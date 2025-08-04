import { useState, useEffect, useCallback } from 'react';
import { ContaPessoal, FiltrosConta, EstatisticasContas, ResumoPorCategoria, supabaseToContaPessoal } from '@/types/contaPessoal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';

export const useContasPessoais = () => {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaPessoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar contas
  const carregarContas = useCallback(async (filtros?: FiltrosConta) => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = (supabase as any)
        .from('contas_pessoais')
        .select(`
          *,
          credores:credor_id(id, nome, tipo),
          categorias_despesas:categoria_id(id, nome, grupo, cor, icone)
        `)
        .eq('user_id', user.id)
        .order('data_vencimento', { ascending: false });

      // Aplicar filtros
      if (filtros?.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }
      
      if (filtros?.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id);
      }
      
      if (filtros?.credor_id) {
        query = query.eq('credor_id', filtros.credor_id);
      }
      
      if (filtros?.data_inicio) {
        query = query.gte('data_vencimento', filtros.data_inicio);
      }
      
      if (filtros?.data_fim) {
        query = query.lte('data_vencimento', filtros.data_fim);
      }
      
      if (filtros?.valor_min) {
        query = query.gte('valor', filtros.valor_min);
      }
      
      if (filtros?.valor_max) {
        query = query.lte('valor', filtros.valor_max);
      }
      
      if (filtros?.vencimento_proximo) {
        const hoje = format(new Date(), 'yyyy-MM-dd');
        const proximosSete = format(addDays(new Date(), 7), 'yyyy-MM-dd');
        query = query.gte('data_vencimento', hoje).lte('data_vencimento', proximosSete);
      }
      
      if (filtros?.busca) {
        query = query.or(`descricao.ilike.%${filtros.busca}%,observacoes.ilike.%${filtros.busca}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const contasConvertidas = (data || []).map(supabaseToContaPessoal);
      setContas(contasConvertidas);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar contas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Criar conta
  const criarConta = async (conta: Omit<ContaPessoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'credor' | 'categoria'>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    
    try {
      const { data, error } = await (supabase as any)
        .from('contas_pessoais')
        .insert({
          descricao: conta.descricao,
          valor: conta.valor,
          data_vencimento: conta.data_vencimento,
          data_pagamento: conta.data_pagamento,
          status: conta.status,
          credor_id: conta.credor_id,
          categoria_id: conta.categoria_id,
          observacoes: conta.observacoes,
          user_id: user.id
        })
        .select(`
          *,
          credores:credor_id(id, nome, tipo),
          categorias_despesas:categoria_id(id, nome, grupo, cor, icone)
        `)
        .single();
      
      if (error) throw error;
      
      const novaConta = supabaseToContaPessoal(data);
      setContas(prev => [novaConta, ...prev]);
      
      toast.success('Conta criada com sucesso!');
      return novaConta;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar conta';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar conta
  const atualizarConta = async (id: number, dados: Partial<ContaPessoal>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    
    try {
      const { data, error } = await (supabase as any)
        .from('contas_pessoais')
        .update({
          descricao: dados.descricao,
          valor: dados.valor,
          data_vencimento: dados.data_vencimento,
          data_pagamento: dados.data_pagamento,
          status: dados.status,
          credor_id: dados.credor_id,
          categoria_id: dados.categoria_id,
          observacoes: dados.observacoes
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          credores:credor_id(id, nome, tipo),
          categorias_despesas:categoria_id(id, nome, grupo, cor, icone)
        `)
        .single();
      
      if (error) throw error;
      
      const contaAtualizada = supabaseToContaPessoal(data);
      setContas(prev => 
        prev.map(c => c.id === id ? contaAtualizada : c)
      );
      
      toast.success('Conta atualizada com sucesso!');
      return contaAtualizada;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar conta';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Marcar como paga
  const marcarComoPaga = async (id: number, dataPagamento?: string) => {
    const dataFinal = dataPagamento || format(new Date(), 'yyyy-MM-dd');
    
    return atualizarConta(id, {
      status: 'paga',
      data_pagamento: dataFinal
    });
  };

  // Excluir conta
  const excluirConta = async (id: number) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    
    try {
      const { error } = await (supabase as any)
        .from('contas_pessoais')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setContas(prev => prev.filter(c => c.id !== id));
      
      toast.success('Conta excluída com sucesso!');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir conta';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter estatísticas gerais
  const obterEstatisticas = useCallback((): EstatisticasContas => {
    const hoje = new Date();
    const proximosSete = addDays(hoje, 7);

    const stats = contas.reduce((acc, conta) => {
      acc.total_contas += 1;
      acc.total_valor += conta.valor;

      switch (conta.status) {
        case 'pendente':
          acc.pendentes += 1;
          acc.valor_pendente += conta.valor;
          
          // Verificar vencimento próximo
          const vencimento = new Date(conta.data_vencimento);
          if (vencimento >= hoje && vencimento <= proximosSete) {
            acc.vencimento_proximo += 1;
            acc.valor_vencimento_proximo += conta.valor;
          }
          break;
        case 'paga':
          acc.pagas += 1;
          acc.valor_pago += conta.valor;
          break;
        case 'vencida':
          acc.vencidas += 1;
          acc.valor_vencido += conta.valor;
          break;
      }

      return acc;
    }, {
      total_contas: 0,
      total_valor: 0,
      pendentes: 0,
      valor_pendente: 0,
      pagas: 0,
      valor_pago: 0,
      vencidas: 0,
      valor_vencido: 0,
      vencimento_proximo: 0,
      valor_vencimento_proximo: 0
    });

    return stats;
  }, [contas]);

  // Obter resumo por categoria
  const obterResumoPorCategoria = useCallback((): ResumoPorCategoria[] => {
    const resumoMap = new Map<number, ResumoPorCategoria>();

    contas.forEach(conta => {
      if (!conta.categoria) return;

      const categoriaId = conta.categoria.id;
      
      if (!resumoMap.has(categoriaId)) {
        resumoMap.set(categoriaId, {
          categoria_id: categoriaId,
          categoria_nome: conta.categoria.nome,
          categoria_grupo: conta.categoria.grupo,
          categoria_cor: conta.categoria.cor,
          categoria_icone: conta.categoria.icone,
          total_contas: 0,
          total_valor: 0,
          valor_pago: 0,
          valor_pendente: 0
        });
      }

      const resumo = resumoMap.get(categoriaId)!;
      resumo.total_contas += 1;
      resumo.total_valor += conta.valor;

      if (conta.status === 'paga') {
        resumo.valor_pago += conta.valor;
      } else {
        resumo.valor_pendente += conta.valor;
      }
    });

    return Array.from(resumoMap.values()).sort((a, b) => b.total_valor - a.total_valor);
  }, [contas]);

  // Atualizar status de contas vencidas
  const atualizarStatusVencidas = useCallback(async () => {
    if (!user?.id) return;

    try {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      const { error } = await (supabase as any)
        .from('contas_pessoais')
        .update({ status: 'vencida' })
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .lt('data_vencimento', hoje);

      if (error) throw error;

      // Recarregar contas após atualização
      carregarContas();
    } catch (error) {
      console.error('Erro ao atualizar status de contas vencidas:', error);
    }
  }, [user?.id, carregarContas]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      carregarContas();
      atualizarStatusVencidas();
    }
  }, [user?.id, carregarContas, atualizarStatusVencidas]);

  return {
    contas,
    loading,
    error,
    carregarContas,
    criarConta,
    atualizarConta,
    marcarComoPaga,
    excluirConta,
    obterEstatisticas,
    obterResumoPorCategoria,
    atualizarStatusVencidas
  };
};