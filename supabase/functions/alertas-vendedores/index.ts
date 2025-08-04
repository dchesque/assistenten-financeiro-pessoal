import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertaVendedor {
  vendedor_id: number;
  vendedor_nome: string;
  tipo_alerta: 'meta_critica' | 'performance_baixa' | 'inatividade' | 'meta_atingida' | 'destaque_mes';
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  descricao: string;
  valor_referencia?: number;
  percentual_referencia?: number;
  dias_referencia?: number;
  acao_sugerida: string;
  data_criacao: string;
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

    console.log('Iniciando análise de alertas para vendedores...');

    // Buscar vendedores ativos
    const { data: vendedores, error: vendedoresError } = await supabaseClient
      .from('vendedores')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true);

    if (vendedoresError) throw vendedoresError;

    // Calcular período atual (mês atual)
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Buscar vendas do mês atual
    const { data: vendasMes, error: vendasError } = await supabaseClient
      .from('vendas')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .gte('data_venda', inicioMes.toISOString().split('T')[0])
      .lte('data_venda', fimMes.toISOString().split('T')[0])
      .not('vendedor_id', 'is', null);

    if (vendasError) throw vendasError;

    // Buscar vendas dos últimos 7 dias para análise de atividade
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: vendasSemana, error: vendasSemanaError } = await supabaseClient
      .from('vendas')
      .select('*')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .gte('data_venda', seteDiasAtras.toISOString().split('T')[0])
      .not('vendedor_id', 'is', null);

    if (vendasSemanaError) throw vendasSemanaError;

    const alertas: AlertaVendedor[] = [];
    const agora = new Date().toISOString();

    // Analisar cada vendedor
    for (const vendedor of vendedores || []) {
      const vendasVendedorMes = vendasMes?.filter(v => v.vendedor_id === vendedor.id) || [];
      const vendasVendedorSemana = vendasSemana?.filter(v => v.vendedor_id === vendedor.id) || [];

      // Calcular estatísticas do mês
      const totalVendasMes = vendasVendedorMes.length;
      const valorTotalMes = vendasVendedorMes.reduce((acc, v) => acc + v.valor_final, 0);
      
      // Calcular dias úteis no mês e dias restantes
      const diasUteisNoMes = Math.ceil((fimMes.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24));
      const diasUteisDecorridos = Math.ceil((hoje.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24));
      const diasUteisRestantes = diasUteisNoMes - diasUteisDecorridos;
      
      // Percentual do mês decorrido
      const percentualMesDecorrido = (diasUteisDecorridos / diasUteisNoMes) * 100;
      
      // Percentual da meta atingida
      const percentualMeta = vendedor.meta_mensal > 0 ? (valorTotalMes / vendedor.meta_mensal) * 100 : 0;

      // 1. ALERTA: Meta Crítica - vendedor muito abaixo da meta
      if (vendedor.meta_mensal > 0 && percentualMesDecorrido > 50 && percentualMeta < 30) {
        alertas.push({
          vendedor_id: vendedor.id,
          vendedor_nome: vendedor.nome,
          tipo_alerta: 'meta_critica',
          severidade: 'critica',
          titulo: 'Meta em Situação Crítica',
          descricao: `${vendedor.nome} atingiu apenas ${percentualMeta.toFixed(1)}% da meta com ${percentualMesDecorrido.toFixed(0)}% do mês decorrido.`,
          valor_referencia: valorTotalMes,
          percentual_referencia: percentualMeta,
          dias_referencia: diasUteisRestantes,
          acao_sugerida: 'Reunião urgente para plano de ação e suporte intensivo',
          data_criacao: agora
        });
      }

      // 2. ALERTA: Performance baixa - ritmo insuficiente
      else if (vendedor.meta_mensal > 0 && percentualMesDecorrido > 25 && percentualMeta < (percentualMesDecorrido - 20)) {
        alertas.push({
          vendedor_id: vendedor.id,
          vendedor_nome: vendedor.nome,
          tipo_alerta: 'performance_baixa',
          severidade: 'alta',
          titulo: 'Ritmo Abaixo do Esperado',
          descricao: `${vendedor.nome} precisa acelerar o ritmo para atingir a meta. Atual: ${percentualMeta.toFixed(1)}%, esperado: ${percentualMesDecorrido.toFixed(0)}%.`,
          valor_referencia: valorTotalMes,
          percentual_referencia: percentualMeta,
          dias_referencia: diasUteisRestantes,
          acao_sugerida: 'Coaching e revisão de estratégia de vendas',
          data_criacao: agora
        });
      }

      // 3. ALERTA: Inatividade - sem vendas na semana
      if (vendasVendedorSemana.length === 0 && vendedor.status === 'ativo') {
        alertas.push({
          vendedor_id: vendedor.id,
          vendedor_nome: vendedor.nome,
          tipo_alerta: 'inatividade',
          severidade: 'media',
          titulo: 'Sem Vendas na Semana',
          descricao: `${vendedor.nome} não registrou vendas nos últimos 7 dias.`,
          dias_referencia: 7,
          acao_sugerida: 'Verificar situação e oferecer suporte para retomada das atividades',
          data_criacao: agora
        });
      }

      // 4. ALERTA POSITIVO: Meta atingida
      if (vendedor.meta_mensal > 0 && percentualMeta >= 100) {
        alertas.push({
          vendedor_id: vendedor.id,
          vendedor_nome: vendedor.nome,
          tipo_alerta: 'meta_atingida',
          severidade: 'baixa',
          titulo: 'Meta Atingida!',
          descricao: `Parabéns! ${vendedor.nome} atingiu ${percentualMeta.toFixed(1)}% da meta mensal.`,
          valor_referencia: valorTotalMes,
          percentual_referencia: percentualMeta,
          acao_sugerida: 'Reconhecer conquista e definir novos desafios',
          data_criacao: agora
        });
      }

      // 5. ALERTA: Destaque do mês - performance excepcional
      if (percentualMeta > 150 || (totalVendasMes > 0 && valorTotalMes > vendedor.melhor_mes_vendas)) {
        alertas.push({
          vendedor_id: vendedor.id,
          vendedor_nome: vendedor.nome,
          tipo_alerta: 'destaque_mes',
          severidade: 'baixa',
          titulo: 'Performance Excepcional!',
          descricao: `${vendedor.nome} está tendo um mês excepcional com ${percentualMeta.toFixed(1)}% da meta.`,
          valor_referencia: valorTotalMes,
          percentual_referencia: percentualMeta,
          acao_sugerida: 'Compartilhar boas práticas com a equipe e considerar promoção',
          data_criacao: agora
        });
      }
    }

    // Registrar alertas críticos no log
    const alertasCriticos = alertas.filter(a => a.severidade === 'critica');
    if (alertasCriticos.length > 0) {
      try {
        await supabaseClient.from('audit_log').insert(
          alertasCriticos.map(alerta => ({
            tabela: 'vendedores',
            operacao: 'alerta_critico',
            registro_id: alerta.vendedor_id,
            descricao: `ALERTA CRÍTICO: ${alerta.titulo} - ${alerta.descricao}`,
            data_operacao: new Date().toISOString()
          }))
        );
      } catch (logError) {
        console.error('Erro ao registrar log de auditoria:', logError);
        // Não falhar por causa do log
      }
    }

    // Estatísticas gerais dos alertas
    const estatisticas = {
      total_alertas: alertas.length,
      alertas_criticos: alertas.filter(a => a.severidade === 'critica').length,
      alertas_altos: alertas.filter(a => a.severidade === 'alta').length,
      alertas_medios: alertas.filter(a => a.severidade === 'media').length,
      alertas_baixos: alertas.filter(a => a.severidade === 'baixa').length,
      vendedores_em_risco: alertas.filter(a => a.tipo_alerta === 'meta_critica' || a.tipo_alerta === 'performance_baixa').length,
      vendedores_inativos: alertas.filter(a => a.tipo_alerta === 'inatividade').length,
      vendedores_destaque: alertas.filter(a => a.tipo_alerta === 'meta_atingida' || a.tipo_alerta === 'destaque_mes').length
    };

    console.log(`Análise concluída: ${alertas.length} alertas gerados para ${vendedores?.length || 0} vendedores`);

    return new Response(
      JSON.stringify({
        alertas,
        estatisticas,
        periodo_analise: {
          inicio: inicioMes.toISOString().split('T')[0],
          fim: fimMes.toISOString().split('T')[0],
          dias_uteis_restantes: diasUteisRestantes
        },
        gerado_em: agora
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro ao gerar alertas:', error);
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