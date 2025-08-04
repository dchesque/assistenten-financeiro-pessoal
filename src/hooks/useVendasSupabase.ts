import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface VendaSupabase {
  id: number;
  cliente_id: number;
  data_venda: string;
  hora_venda: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
  forma_pagamento: string;
  parcelas: number;
  observacoes?: string;
  plano_conta_id?: number;
  vendedor?: string; // Campo legado (texto)
  vendedor_id?: number; // Novo campo FK
  comissao_percentual: number;
  comissao_valor: number;
  status: string;
  tipo_venda: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Dados do vendedor (quando fazer join)
  vendedor_nome?: string;
  vendedor_codigo?: string;
  vendedor_foto?: string;
}

export interface EstatisticasVendas {
  totalVendas: number;
  receitaBruta: number;
  receitaLiquida: number;
  crescimentoMensal: number;
  ticketMedio: number;
  totalDevolucoes: number;
  vendaMediaDiaria: number;
  topVendedor: string;
}

export interface FiltrosVendas {
  busca: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  formaPagamento: string;
  clienteId?: number;
  vendedor: string;
}

export const useVendasSupabase = () => {
  const { user } = useAuth();
  const [vendas, setVendas] = useState<VendaSupabase[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasVendas>({
    totalVendas: 0,
    receitaBruta: 0,
    receitaLiquida: 0,
    crescimentoMensal: 0,
    ticketMedio: 0,
    totalDevolucoes: 0,
    vendaMediaDiaria: 0,
    topVendedor: ''
  });
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosVendas>({
    busca: '',
    dataInicio: '',
    dataFim: '',
    status: 'todos',
    formaPagamento: 'todos',
    vendedor: 'todos'
  });

  // Carregar vendas
  const carregarVendas = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('vendas')
        .select(`
          *,
          clientes!inner(id, nome, documento),
          vendedores(id, nome, codigo_vendedor, foto_url, percentual_comissao, ranking_atual)
        `)
        .eq('ativo', true)
        .order('data_venda', { ascending: false });

      // Aplicar filtros
      if (filtros.busca) {
        query = query.or(`observacoes.ilike.%${filtros.busca}%,vendedor.ilike.%${filtros.busca}%`);
      }

      if (filtros.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }

      if (filtros.formaPagamento && filtros.formaPagamento !== 'todos') {
        query = query.eq('forma_pagamento', filtros.formaPagamento);
      }

      if (filtros.vendedor && filtros.vendedor !== 'todos') {
        query = query.eq('vendedor', filtros.vendedor);
      }

      if (filtros.dataInicio) {
        query = query.gte('data_venda', filtros.dataInicio);
      }

      if (filtros.dataFim) {
        query = query.lte('data_venda', filtros.dataFim);
      }

      if (filtros.clienteId) {
        query = query.eq('cliente_id', filtros.clienteId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar vendas:', error);
        toast.error('Erro ao carregar vendas');
        return;
      }

      setVendas((data as VendaSupabase[]) || []);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Calcular estatísticas
  const calcularEstatisticas = useCallback(async () => {
    try {
      // Vendas ativas
      const { data: vendasAtivas, error: errorVendas } = await supabase
        .from('vendas')
        .select('*')
        .eq('ativo', true)
        .eq('status', 'ativa');

      if (errorVendas) {
        console.error('Erro ao carregar estatísticas:', errorVendas);
        return;
      }

      const vendas = vendasAtivas || [];
      
      // Vendas do mês atual
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const vendasMesAtual = vendas.filter(v => 
        new Date(v.data_venda) >= primeiroDiaMes
      );

      // Vendas do mês anterior
      const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      const vendasMesAnterior = vendas.filter(v => {
        const dataVenda = new Date(v.data_venda);
        return dataVenda >= primeiroDiaMesAnterior && dataVenda <= ultimoDiaMesAnterior;
      });

      // Devoluções
      const { data: devolucoes } = await supabase
        .from('vendas')
        .select('*')
        .eq('ativo', true)
        .eq('status', 'devolvida');

      // Calcular métricas
      const totalVendas = vendas.length;
      const receitaBruta = vendas.reduce((acc, v) => acc + v.valor_total, 0);
      const receitaLiquida = vendas.reduce((acc, v) => acc + v.valor_final, 0);
      const totalDevolucoes = (devolucoes || []).length;
      const ticketMedio = totalVendas > 0 ? receitaLiquida / totalVendas : 0;
      
      // Crescimento mensal
      const receitaMesAtual = vendasMesAtual.reduce((acc, v) => acc + v.valor_final, 0);
      const receitaMesAnterior = vendasMesAnterior.reduce((acc, v) => acc + v.valor_final, 0);
      const crescimentoMensal = receitaMesAnterior > 0 
        ? ((receitaMesAtual - receitaMesAnterior) / receitaMesAnterior) * 100 
        : 0;

      // Venda média diária (últimos 30 dias)
      const ultimosTrintaDias = vendas.filter(v => {
        const dataVenda = new Date(v.data_venda);
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        return dataVenda >= trintaDiasAtras;
      });
      const vendaMediaDiaria = ultimosTrintaDias.length / 30;

      // Top vendedor
      const vendedoresSales = vendas.reduce((acc, v) => {
        if (v.vendedor) {
          acc[v.vendedor] = (acc[v.vendedor] || 0) + v.valor_final;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const topVendedor = Object.entries(vendedoresSales)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      setEstatisticas({
        totalVendas,
        receitaBruta,
        receitaLiquida,
        crescimentoMensal,
        ticketMedio,
        totalDevolucoes,
        vendaMediaDiaria,
        topVendedor
      });

    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  }, []);

  // Criar venda
  const criarVenda = async (dadosVenda: Omit<VendaSupabase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);

      // Calcular comissão se vendedor_id foi fornecido
      let comissaoCalculada = dadosVenda.comissao_valor || 0;
      let percentualComissao = dadosVenda.comissao_percentual || 0;

      if (dadosVenda.vendedor_id && !dadosVenda.comissao_valor) {
        // Buscar dados do vendedor para calcular comissão
        const { data: vendedorData } = await supabase
          .from('vendedores')
          .select('percentual_comissao, tipo_comissao, valor_fixo_comissao')
          .eq('id', dadosVenda.vendedor_id)
          .single();

        if (vendedorData) {
          percentualComissao = vendedorData.percentual_comissao;
          
          if (vendedorData.tipo_comissao === 'percentual') {
            comissaoCalculada = (dadosVenda.valor_final * vendedorData.percentual_comissao) / 100;
          } else if (vendedorData.tipo_comissao === 'valor_fixo') {
            comissaoCalculada = vendedorData.valor_fixo_comissao;
          } else if (vendedorData.tipo_comissao === 'hibrido') {
            comissaoCalculada = vendedorData.valor_fixo_comissao + 
              ((dadosVenda.valor_final * vendedorData.percentual_comissao) / 100);
          }
        }
      }

      const { data, error } = await supabase
        .from('vendas')
        .insert([{
          ...dadosVenda,
          comissao_valor: comissaoCalculada,
          comissao_percentual: percentualComissao,
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar venda:', error);
        toast.error('Erro ao criar venda');
        return null;
      }

      toast.success('Venda criada com sucesso!');
      await carregarVendas();
      await calcularEstatisticas();
      return data;
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      toast.error('Erro ao criar venda');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar venda
  const atualizarVenda = async (id: number, dadosVenda: Partial<VendaSupabase>) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('vendas')
        .update({
          ...dadosVenda,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar venda:', error);
        toast.error('Erro ao atualizar venda');
        return false;
      }

      toast.success('Venda atualizada com sucesso!');
      await carregarVendas();
      await calcularEstatisticas();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      toast.error('Erro ao atualizar venda');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Excluir venda (soft delete)
  const excluirVenda = async (id: number) => {
    try {
      setLoading(true);

      // Exclusão real (hard delete) da venda
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir venda:', error);
        toast.error('Erro ao excluir venda');
        return false;
      }

      toast.success('Venda excluída com sucesso!');
      await carregarVendas();
      await calcularEstatisticas();
      return true;
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      toast.error('Erro ao excluir venda');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar cliente
  const buscarClientes = async (termo: string) => {
    try {
      if (!termo || termo.length < 2) return [];

      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, documento, telefone')
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
  };

  // Buscar vendedores
  const buscarVendedores = async (termo: string) => {
    try {
      if (!termo || termo.length < 2) return [];

      const { data, error } = await supabase
        .from('vendedores')
        .select('id, nome, codigo_vendedor, foto_url, percentual_comissao, ranking_atual')
        .eq('ativo', true)
        .or(`nome.ilike.%${termo}%,codigo_vendedor.ilike.%${termo}%,email.ilike.%${termo}%`)
        .limit(10);

      if (error) {
        console.error('Erro ao buscar vendedores:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      return [];
    }
  };

  // Calcular comissão automaticamente
  const calcularComissao = (valorVenda: number, vendedorId?: number, vendedores?: any[]) => {
    if (!vendedorId || !vendedores) return { percentual: 0, valor: 0 };
    
    const vendedor = vendedores.find(v => v.id === vendedorId);
    if (!vendedor) return { percentual: 0, valor: 0 };
    
    const percentual = vendedor.percentual_comissao || 0;
    const valor = (valorVenda * percentual) / 100;
    
    return { percentual, valor };
  };

  // Effect para carregar dados iniciais
  useEffect(() => {
    carregarVendas();
  }, [carregarVendas]);

  useEffect(() => {
    calcularEstatisticas();
  }, [calcularEstatisticas]);

  return {
    vendas,
    estatisticas,
    loading,
    filtros,
    setFiltros,
    carregarVendas,
    criarVenda,
    atualizarVenda,
    excluirVenda,
    buscarClientes,
    buscarVendedores,
    calcularComissao,
    calcularEstatisticas
  };
};