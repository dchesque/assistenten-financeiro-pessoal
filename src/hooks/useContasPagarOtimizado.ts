import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContaPagar, ContaEnriquecida } from '@/types/contaPagar';
import { useContasPagarFiltros } from './useContasPagarFiltros';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface EstadosOperacao {
  carregandoContas: boolean;
  salvandoEdicao: boolean;
  processandoBaixa: boolean;
  excluindoConta: boolean;
  cancelandoConta: boolean;
}

interface ResumoContas {
  pendentes: { total: number; valor: number };
  vencidas: { total: number; valor: number };
  vence7Dias: { total: number; valor: number };
  pagasMes: { total: number; valor: number };
}

export function useContasPagarOtimizado() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [estados, setEstados] = useState<EstadosOperacao>({
    carregandoContas: false,
    salvandoEdicao: false,
    processandoBaixa: false,
    excluindoConta: false,
    cancelandoConta: false
  });

  // Usar hook de filtros otimizado
  const {
    filtros,
    setFiltros,
    filtroRapido,
    setFiltroRapido,
    filtrosOtimizados,
    aplicarFiltros,
    limparFiltros
  } = useContasPagarFiltros();

  // Query básica do Supabase (sem RPC)
  const { data: contasData, isLoading, error } = useQuery({
    queryKey: ['contas-pagar', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          *,
          fornecedores!inner(id, nome, documento),
          plano_contas!inner(id, nome, codigo),
          bancos(id, nome)
        `)
        .eq('user_id', user.id)
        .order('data_vencimento', { ascending: true });

      if (error) throw error;

      // Transformar dados para incluir nomes e cálculos
      return (data || []).map(item => {
        const hoje = new Date();
        const vencimento = new Date(item.data_vencimento);
        const diffTime = vencimento.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...item,
          data_lancamento: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          dda: false,
          fornecedor_nome: item.fornecedores?.nome || 'N/A',
          plano_conta_nome: item.plano_contas?.nome || 'N/A',
          banco_nome: item.bancos?.nome || null,
          dias_para_vencimento: diffDays >= 0 ? diffDays : 0,
          dias_em_atraso: diffDays < 0 ? Math.abs(diffDays) : 0,
          parcela_atual: item.parcela_atual || 1,
          total_parcelas: item.total_parcelas || 1,
          forma_pagamento: item.forma_pagamento || 'dinheiro_pix',
          // Campos para compatibilidade
          fornecedor: { id: item.fornecedor_id, nome: item.fornecedores?.nome || 'N/A', documento: item.fornecedores?.documento || '' },
          plano_conta: { id: item.plano_conta_id, nome: item.plano_contas?.nome || 'N/A', codigo: item.plano_contas?.codigo || '' },
          banco: item.bancos ? { id: item.banco_id!, nome: item.bancos.nome } : null
        } as ContaEnriquecida;
      });
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para estatísticas rápidas
  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-contas', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('estatisticas_contas_rapidas', {
        p_user_id: user.id
      });

      if (error) throw error;
      return data[0];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minuto
  });

  // Contas filtradas (memoização pesada)
  const contasFiltradas = useMemo(() => {
    if (!contasData) return [];
    return aplicarFiltros(contasData);
  }, [contasData, aplicarFiltros]);

  // Resumos calculados
  const resumos = useMemo((): ResumoContas => {
    if (!estatisticas) {
      return {
        pendentes: { total: 0, valor: 0 },
        vencidas: { total: 0, valor: 0 },
        vence7Dias: { total: 0, valor: 0 },
        pagasMes: { total: 0, valor: 0 }
      };
    }

    return {
      pendentes: { 
        total: Number(estatisticas.total_pendentes), 
        valor: Number(estatisticas.valor_pendente) 
      },
      vencidas: { 
        total: Number(estatisticas.total_vencidas), 
        valor: Number(estatisticas.valor_vencido) 
      },
      vence7Dias: { 
        total: Number(estatisticas.total_vence_7_dias), 
        valor: Number(estatisticas.valor_vence_7_dias) 
      },
      pagasMes: { 
        total: Number(estatisticas.total_pagas_mes), 
        valor: Number(estatisticas.valor_pago_mes) 
      }
    };
  }, [estatisticas]);

  // Mutations otimizadas
  const mutationSalvarEdicao = useMutation({
    mutationFn: async (dadosEdicao: Partial<ContaPagar>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const dadosCompletos = {
        ...dadosEdicao,
        user_id: user.id,
        // Garantir valores padrão para novos campos obrigatórios
        parcela_atual: dadosEdicao.parcela_atual || 1,
        total_parcelas: dadosEdicao.total_parcelas || 1,
        forma_pagamento: dadosEdicao.forma_pagamento || 'dinheiro_pix',
        // Garantir campos obrigatórios do Supabase
        descricao: dadosEdicao.descricao || 'Sem descrição',
        data_vencimento: dadosEdicao.data_vencimento || new Date().toISOString().split('T')[0],
        valor_original: dadosEdicao.valor_original || 0,
        valor_final: dadosEdicao.valor_final || dadosEdicao.valor_original || 0,
        fornecedor_id: dadosEdicao.fornecedor_id || 0,
        plano_conta_id: dadosEdicao.plano_conta_id || 0
      };

      if (dadosCompletos.id) {
        const { data, error } = await supabase
          .from('contas_pagar')
          .update(dadosCompletos)
          .eq('id', dadosCompletos.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('contas_pagar')
          .insert(dadosCompletos)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onMutate: () => {
      setEstados(prev => ({ ...prev, salvandoEdicao: true }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-contas'] });
      toast({ title: 'Conta salva com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao salvar conta:', error);
      toast({ 
        title: 'Erro ao salvar conta', 
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setEstados(prev => ({ ...prev, salvandoEdicao: false }));
    }
  });

  const mutationBaixarConta = useMutation({
    mutationFn: async (dadosBaixa: {
      contaId: number;
      dataPagamento: string;
      valorPago: number;
      bancoId?: number;
      observacoes?: string;
      numeroCheque?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('contas_pagar')
        .update({
          status: 'pago',
          data_pagamento: dadosBaixa.dataPagamento,
          valor_pago: dadosBaixa.valorPago,
          banco_id: dadosBaixa.bancoId,
          observacoes: dadosBaixa.observacoes
        })
        .eq('id', dadosBaixa.contaId)
        .select()
        .single();

      if (error) throw error;

      // Se tem número de cheque, criar o cheque
      if (dadosBaixa.numeroCheque && dadosBaixa.bancoId) {
        const { error: chequeError } = await supabase
          .from('cheques')
          .insert({
            numero_cheque: dadosBaixa.numeroCheque,
            banco_id: dadosBaixa.bancoId,
            valor: dadosBaixa.valorPago,
            data_emissao: dadosBaixa.dataPagamento,
            data_vencimento: dadosBaixa.dataPagamento,
            beneficiario_nome: 'Pagamento de Conta',
            status: 'compensado',
            conta_pagar_id: dadosBaixa.contaId,
            user_id: user.id
          });

        if (chequeError) {
          console.error('Erro ao criar cheque:', chequeError);
        }
      }

      return data;
    },
    onMutate: () => {
      setEstados(prev => ({ ...prev, processandoBaixa: true }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-contas'] });
      toast({ title: 'Conta baixada com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao baixar conta:', error);
      toast({ 
        title: 'Erro ao baixar conta', 
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setEstados(prev => ({ ...prev, processandoBaixa: false }));
    }
  });

  const mutationExcluirConta = useMutation({
    mutationFn: async (contaId: number) => {
      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', contaId);
      if (error) throw error;
    },
    onMutate: () => {
      setEstados(prev => ({ ...prev, excluindoConta: true }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-contas'] });
      toast({ title: 'Conta excluída com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao excluir conta:', error);
      toast({ 
        title: 'Erro ao excluir conta', 
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setEstados(prev => ({ ...prev, excluindoConta: false }));
    }
  });

  // Funções públicas
  const salvarEdicao = useCallback((dadosEdicao: Partial<ContaPagar>) => {
    mutationSalvarEdicao.mutate(dadosEdicao);
  }, [mutationSalvarEdicao]);

  const confirmarBaixa = useCallback((dadosBaixa: any) => {
    mutationBaixarConta.mutate(dadosBaixa);
  }, [mutationBaixarConta]);

  const excluirConta = useCallback((contaId: number) => {
    mutationExcluirConta.mutate(contaId);
  }, [mutationExcluirConta]);

  const cancelarConta = useCallback(async (contaId: number) => {
    setEstados(prev => ({ ...prev, cancelandoConta: true }));
    
    try {
      const { error } = await supabase
        .from('contas_pagar')
        .update({ status: 'cancelado' })
        .eq('id', contaId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-contas'] });
      toast({ title: 'Conta cancelada com sucesso!' });
    } catch (error) {
      console.error('Erro ao cancelar conta:', error);
      toast({ 
        title: 'Erro ao cancelar conta', 
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive'
      });
    } finally {
      setEstados(prev => ({ ...prev, cancelandoConta: false }));
    }
  }, [queryClient]);

  return {
    // Dados
    contas: contasData || [],
    contasFiltradas,
    resumos,
    erro: error,

    // Estados
    estados: {
      ...estados,
      carregandoContas: isLoading
    },

    // Filtros
    filtros,
    setFiltros,
    filtroRapido,
    setFiltroRapido,
    limparFiltros,

    // Operações
    salvarEdicao,
    confirmarBaixa,
    excluirConta,
    cancelarConta
  };
}