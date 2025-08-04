import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RelatorioVendedoresRequest {
  periodo_inicio: string;
  periodo_fim: string;
  vendedor_ids?: number[];
  incluir_detalhes?: boolean;
}

interface PerformanceVendedor {
  vendedor_id: number;
  vendedor_nome: string;
  vendedor_codigo: string;
  total_vendas: number;
  valor_total_vendido: number;
  comissao_total: number;
  ticket_medio: number;
  meta_periodo: number;
  percentual_meta: number;
  ranking_posicao: number;
  dias_produtivos: number;
  vendas_por_forma_pagamento: Record<string, number>;
  evolucao_diaria?: Array<{
    data: string;
    vendas: number;
    valor: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { periodo_inicio, periodo_fim, vendedor_ids, incluir_detalhes = false }: RelatorioVendedoresRequest = await req.json();

    console.log('Gerando relatório de vendedores:', { periodo_inicio, periodo_fim, vendedor_ids });

    // Buscar vendedores
    let vendedoresQuery = supabaseClient
      .from('vendedores')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true);

    if (vendedor_ids && vendedor_ids.length > 0) {
      vendedoresQuery = vendedoresQuery.in('id', vendedor_ids);
    }

    const { data: vendedores, error: vendedoresError } = await vendedoresQuery;
    if (vendedoresError) throw vendedoresError;

    // Buscar vendas do período
    const { data: vendas, error: vendasError } = await supabaseClient
      .from('vendas')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .gte('data_venda', periodo_inicio)
      .lte('data_venda', periodo_fim)
      .not('vendedor_id', 'is', null);

    if (vendasError) throw vendasError;

    // Processar dados para cada vendedor
    const performanceVendedores: PerformanceVendedor[] = [];

    for (const vendedor of vendedores || []) {
      const vendasVendedor = vendas?.filter(v => v.vendedor_id === vendedor.id) || [];
      
      const totalVendas = vendasVendedor.length;
      const valorTotalVendido = vendasVendedor.reduce((acc, v) => acc + v.valor_final, 0);
      const comissaoTotal = vendasVendedor.reduce((acc, v) => acc + (v.comissao_valor || 0), 0);
      const ticketMedio = totalVendas > 0 ? valorTotalVendido / totalVendas : 0;

      // Calcular meta do período
      const diasNoPeriodo = Math.ceil((new Date(periodo_fim).getTime() - new Date(periodo_inicio).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const metaPeriodo = vendedor.meta_mensal ? (vendedor.meta_mensal / 30) * diasNoPeriodo : 0;
      const percentualMeta = metaPeriodo > 0 ? (valorTotalVendido / metaPeriodo) * 100 : 0;

      // Calcular dias produtivos (dias com pelo menos uma venda)
      const diasComVenda = new Set(vendasVendedor.map(v => v.data_venda)).size;

      // Agrupar vendas por forma de pagamento
      const vendasPorFormaPagamento = vendasVendedor.reduce((acc, venda) => {
        const forma = venda.forma_pagamento || 'Não informado';
        acc[forma] = (acc[forma] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      let evolucaoDiaria: Array<{ data: string; vendas: number; valor: number }> | undefined;

      // Se solicitado, incluir evolução diária
      if (incluir_detalhes) {
        const vendasPorDia = vendasVendedor.reduce((acc, venda) => {
          const data = venda.data_venda;
          if (!acc[data]) {
            acc[data] = { vendas: 0, valor: 0 };
          }
          acc[data].vendas += 1;
          acc[data].valor += venda.valor_final;
          return acc;
        }, {} as Record<string, { vendas: number; valor: number }>);

        evolucaoDiaria = Object.entries(vendasPorDia)
          .map(([data, stats]) => ({ data, vendas: stats.vendas, valor: stats.valor }))
          .sort((a, b) => a.data.localeCompare(b.data));
      }

      performanceVendedores.push({
        vendedor_id: vendedor.id,
        vendedor_nome: vendedor.nome,
        vendedor_codigo: vendedor.codigo_vendedor,
        total_vendas: totalVendas,
        valor_total_vendido: valorTotalVendido,
        comissao_total: comissaoTotal,
        ticket_medio: ticketMedio,
        meta_periodo: metaPeriodo,
        percentual_meta: percentualMeta,
        ranking_posicao: 0, // Será calculado após ordenação
        dias_produtivos: diasComVenda,
        vendas_por_forma_pagamento: vendasPorFormaPagamento,
        evolucao_diaria: evolucaoDiaria
      });
    }

    // Ordenar por valor vendido e atribuir ranking
    performanceVendedores.sort((a, b) => b.valor_total_vendido - a.valor_total_vendido);
    performanceVendedores.forEach((vendedor, index) => {
      vendedor.ranking_posicao = index + 1;
    });

    // Calcular estatísticas gerais
    const totalVendasPeriodo = performanceVendedores.reduce((acc, v) => acc + v.total_vendas, 0);
    const valorTotalPeriodo = performanceVendedores.reduce((acc, v) => acc + v.valor_total_vendido, 0);
    const comissaoTotalPeriodo = performanceVendedores.reduce((acc, v) => acc + v.comissao_total, 0);
    const ticketMedioPeriodo = totalVendasPeriodo > 0 ? valorTotalPeriodo / totalVendasPeriodo : 0;

    const estatisticasGerais = {
      total_vendedores: performanceVendedores.length,
      total_vendas: totalVendasPeriodo,
      valor_total: valorTotalPeriodo,
      comissao_total: comissaoTotalPeriodo,
      ticket_medio: ticketMedioPeriodo,
      melhor_vendedor: performanceVendedores[0] || null,
      vendedores_acima_meta: performanceVendedores.filter(v => v.percentual_meta >= 100).length
    };

    console.log('Relatório gerado com sucesso:', {
      vendedores: performanceVendedores.length,
      periodo: `${periodo_inicio} a ${periodo_fim}`
    });

    return new Response(
      JSON.stringify({
        estatisticas_gerais: estatisticasGerais,
        performance_vendedores: performanceVendedores,
        periodo: {
          inicio: periodo_inicio,
          fim: periodo_fim
        },
        gerado_em: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro ao gerar relatório de vendedores:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});