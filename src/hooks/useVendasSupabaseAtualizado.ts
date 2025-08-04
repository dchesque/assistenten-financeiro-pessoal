import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { 
  VendaCompleta, 
  FiltrosVendaAvancados, 
  EstatisticasVendasCompletas,
  RelatorioVendasPeriodo,
  VendaSupabase
} from '@/types/venda';

interface UseVendasSupabaseReturn {
  vendas: VendaCompleta[];
  estatisticas: EstatisticasVendasCompletas | null;
  relatorio: RelatorioVendasPeriodo | null;
  loading: boolean;
  filtros: FiltrosVendaAvancados;
  carregarVendas: () => Promise<void>;
  criarVenda: (venda: Omit<VendaSupabase, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  atualizarVenda: (id: number, venda: Partial<VendaSupabase>) => Promise<boolean>;
  excluirVenda: (id: number) => Promise<boolean>;
  buscarClientes: (termo: string) => Promise<any[]>;
  gerarRelatorio: (dataInicio: string, dataFim: string, vendedor?: string, clienteId?: number) => Promise<void>;
  setFiltros: (novos: Partial<FiltrosVendaAvancados>) => void;
  limparCache: () => void;
}

// Cache simples para otimização
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useVendasSupabaseAtualizado(): UseVendasSupabaseReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasVendasCompletas | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioVendasPeriodo | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltrosState] = useState<FiltrosVendaAvancados>({
    busca: '',
    clienteId: undefined,
    vendedor: '',
    formaPagamento: '',
    tipoVenda: '',
    status: '',
    dataInicio: '',
    dataFim: '',
    categoriaId: undefined,
    valorMinimo: undefined,
    valorMaximo: undefined,
    ordenacao: 'data_desc',
    pagina: 1,
    itensPorPagina: 50
  });

  // Utilitários de cache
  const getFromCache = (key: string) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  const saveToCache = (key: string, data: any) => {
    cache.set(key, { data, timestamp: Date.now() });
  };

  const limparCache = useCallback(() => {
    cache.clear();
  }, []);

  // Carregar vendas com filtros
  const carregarVendas = useCallback(async () => {
    setLoading(true);
    try {
      const cacheKey = `vendas_${JSON.stringify(filtros)}`;
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) {
        setVendas(cachedData.vendas);
        setEstatisticas(cachedData.estatisticas);
        setLoading(false);
        return;
      }

      // Usar consulta direta na tabela vendas para evitar ambiguidade da view
      let query = supabase
        .from('vendas')
        .select(`
          *,
          clientes:cliente_id(
            nome,
            documento,
            tipo
          ),
          plano_contas:plano_conta_id(
            nome,
            codigo,
            tipo_dre
          )
        `)
        .eq('ativo', true);

      // Aplicar filtros
      if (filtros.busca) {
        query = query.or(`clientes.nome.ilike.%${filtros.busca}%,vendedor.ilike.%${filtros.busca}%`);
      }

      if (filtros.clienteId) {
        query = query.eq('cliente_id', filtros.clienteId);
      }

      if (filtros.vendedor) {
        query = query.ilike('vendedor', `%${filtros.vendedor}%`);
      }

      if (filtros.formaPagamento) {
        query = query.eq('forma_pagamento', filtros.formaPagamento);
      }

      if (filtros.tipoVenda) {
        query = query.eq('tipo_venda', filtros.tipoVenda);
      }

      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros.dataInicio) {
        query = query.gte('data_venda', filtros.dataInicio);
      }

      if (filtros.dataFim) {
        query = query.lte('data_venda', filtros.dataFim);
      }

      if (filtros.categoriaId) {
        query = query.eq('plano_conta_id', filtros.categoriaId);
      }

      if (filtros.valorMinimo !== undefined) {
        query = query.gte('valor_final', filtros.valorMinimo);
      }

      if (filtros.valorMaximo !== undefined) {
        query = query.lte('valor_final', filtros.valorMaximo);
      }

      // Ordenação e paginação
      const [orderField, orderDirection] = filtros.ordenacao.split('_');
      query = query.order(orderField === 'data' ? 'data_venda' : orderField === 'valor' ? 'valor_final' : 'data_venda', { 
        ascending: orderDirection === 'asc' 
      });

      const offset = (filtros.pagina - 1) * filtros.itensPorPagina;
      query = query.range(offset, offset + filtros.itensPorPagina - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar vendas:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar vendas: " + error.message,
          variant: "destructive"
        });
        return;
      }

      // Transformar dados para VendaCompleta
      const vendasData = (data || []).map((venda: any) => ({
        ...venda,
        cliente_nome: venda.clientes?.nome || 'Cliente não encontrado',
        cliente_documento: venda.clientes?.documento || '',
        cliente_tipo: venda.clientes?.tipo || 'PF',
        categoria_nome: venda.plano_contas?.nome || 'Sem categoria',
        categoria_codigo: venda.plano_contas?.codigo || '',
        tipo_dre: venda.plano_contas?.tipo_dre || '',
        ano_venda: new Date(venda.data_venda).getFullYear(),
        mes_venda: new Date(venda.data_venda).getMonth() + 1,
        valor_liquido: venda.valor_final,
        periodo_venda: new Date(venda.data_venda).toLocaleDateString('pt-BR')
      })) as VendaCompleta[];
      
      setVendas(vendasData);

      // Calcular estatísticas
      const stats = calcularEstatisticas(vendasData);
      setEstatisticas(stats);

      // Salvar no cache
      saveToCache(cacheKey, { vendas: vendasData, estatisticas: stats });

    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar vendas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filtros, toast]);

  // Calcular estatísticas
  const calcularEstatisticas = (vendas: VendaCompleta[]): EstatisticasVendasCompletas => {
    if (!vendas.length) {
      return {
        totalVendas: 0,
        receitaBruta: 0,
        receitaLiquida: 0,
        receitaMensal: 0,
        crescimentoMensal: 0,
        ticketMedio: 0,
        totalDevolucoes: 0,
        totalDescontos: 0,
        totalComissoes: 0,
        topVendedor: '',
        vendasPorFormaPagamento: {},
        vendasPorCategoria: {},
        vendasHoje: 0,
        metaVendasDiaria: 0,
        desempenhoMeta: 0
      };
    }

    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

    const vendasMesAtual = vendas.filter(v => 
      v.ano_venda === anoAtual && v.mes_venda === mesAtual
    );
    const vendasHoje = vendas.filter(v => v.data_venda === hoje);

    const receitaMensal = vendasMesAtual.reduce((sum, v) => sum + (v.valor_final || 0), 0);
    const receitaHoje = vendasHoje.reduce((sum, v) => sum + (v.valor_final || 0), 0);

    // Agrupar por forma de pagamento
    const porFormaPagamento = vendas.reduce((acc, venda) => {
      const forma = venda.forma_pagamento || 'Não especificado';
      if (!acc[forma]) {
        acc[forma] = { quantidade: 0, valor: 0 };
      }
      acc[forma].quantidade += 1;
      acc[forma].valor += venda.valor_final || 0;
      return acc;
    }, {} as Record<string, { quantidade: number; valor: number }>);

    // Agrupar por categoria
    const porCategoria = vendas.reduce((acc, venda) => {
      const categoria = venda.categoria_nome || 'Sem categoria';
      if (!acc[categoria]) {
        acc[categoria] = { quantidade: 0, valor: 0 };
      }
      acc[categoria].quantidade += 1;
      acc[categoria].valor += venda.valor_final || 0;
      return acc;
    }, {} as Record<string, { quantidade: number; valor: number }>);

    // Top vendedor
    const vendedores = vendas.reduce((acc, venda) => {
      if (venda.vendedor) {
        acc[venda.vendedor] = (acc[venda.vendedor] || 0) + (venda.valor_final || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const topVendedor = Object.entries(vendedores)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const clientesUnicos = new Set(vendas.map(v => v.cliente_id)).size;

    return {
      totalVendas: vendasMesAtual.length,
      receitaBruta: receitaMensal,
      receitaLiquida: receitaMensal,
      receitaMensal,
      crescimentoMensal: 0, // Seria calculado comparando com mês anterior
      ticketMedio: vendasMesAtual.length > 0 ? receitaMensal / vendasMesAtual.length : 0,
      totalDevolucoes: 0,
      totalDescontos: vendas.reduce((sum, v) => sum + (v.desconto || 0), 0),
      totalComissoes: vendas.reduce((sum, v) => sum + (v.comissao_valor || 0), 0),
      topVendedor,
      vendasPorFormaPagamento: porFormaPagamento,
      vendasPorCategoria: porCategoria,
      vendasHoje: vendasHoje.length,
      metaVendasDiaria: 100000 / 30, // Meta diária baseada em meta mensal
      desempenhoMeta: (receitaMensal / 100000) * 100
    };
  };

  // Gerar relatório
  const gerarRelatorio = useCallback(async (dataInicio: string, dataFim: string, vendedor?: string, clienteId?: number) => {
    try {
      const { data, error } = await supabase.rpc('relatorio_vendas_periodo', {
        data_inicio: dataInicio,
        data_fim: dataFim,
        vendedor_filtro: vendedor || null,
        cliente_id_filtro: clienteId || null
      });

      if (error) {
        console.error('Erro ao gerar relatório:', error);
        toast({
          title: "Erro",
          description: "Erro ao gerar relatório",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        const relatorioData = data[0];
        setRelatorio({
          totalVendas: relatorioData.total_vendas || 0,
          valorBruto: relatorioData.valor_bruto || 0,
          valorDescontos: relatorioData.valor_descontos || 0,
          valorLiquido: relatorioData.valor_liquido || 0,
          totalComissoes: relatorioData.total_comissoes || 0,
          ticketMedio: relatorioData.ticket_medio || 0,
          vendasPorFormaPagamento: Array.isArray(relatorioData.vendas_por_forma_pagamento) ? relatorioData.vendas_por_forma_pagamento as any[] : [],
          vendasPorCategoria: Array.isArray(relatorioData.vendas_por_categoria) ? relatorioData.vendas_por_categoria as any[] : [],
          vendasPorVendedor: Array.isArray(relatorioData.vendas_por_vendedor) ? relatorioData.vendas_por_vendedor as any[] : [],
          evolucaoDiaria: Array.isArray(relatorioData.evolucao_diaria) ? relatorioData.evolucao_diaria as any[] : []
        });
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao gerar relatório",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Criar venda
  const criarVenda = useCallback(async (venda: Omit<VendaSupabase, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .insert([{
          ...venda,
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar venda:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar venda",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Venda criada com sucesso!"
      });

      // Recarregar vendas e limpar cache
      limparCache();
      await carregarVendas();
      return true;

    } catch (error) {
      console.error('Erro ao criar venda:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar venda",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, carregarVendas, limparCache]);

  // Atualizar venda
  const atualizarVenda = useCallback(async (id: number, venda: Partial<VendaSupabase>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('vendas')
        .update(venda)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar venda:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao atualizar venda",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Venda atualizada com sucesso!"
      });

      limparCache();
      await carregarVendas();
      return true;

    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar venda",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, carregarVendas, limparCache]);

  // Excluir venda (soft delete)
  const excluirVenda = useCallback(async (id: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('vendas')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir venda:', error);
        toast({
          title: "Erro",
          description: error.message || "Erro ao excluir venda",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Sucesso",
        description: "Venda excluída com sucesso!"
      });

      limparCache();
      await carregarVendas();
      return true;

    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir venda",
        variant: "destructive"
      });
      return false;
    }
  }, [toast, carregarVendas, limparCache]);

  // Buscar clientes
  const buscarClientes = useCallback(async (termo: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, documento')
        .eq('ativo', true)
        .or(`nome.ilike.%${termo}%,documento.ilike.%${termo}%`)
        .limit(10);

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  }, []);

  // Atualizar filtros
  const setFiltros = useCallback((novos: Partial<FiltrosVendaAvancados>) => {
    setFiltrosState(prev => ({
      ...prev,
      ...novos,
      pagina: novos.pagina || 1 // Reset página quando mudar filtros
    }));
  }, []);

  // Carregar vendas quando filtros mudarem
  useEffect(() => {
    carregarVendas();
  }, [carregarVendas]);

  return {
    vendas,
    estatisticas,
    relatorio,
    loading,
    filtros,
    carregarVendas,
    criarVenda,
    atualizarVenda,
    excluirVenda,
    buscarClientes,
    gerarRelatorio,
    setFiltros,
    limparCache
  };
}