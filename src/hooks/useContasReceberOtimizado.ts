import { useState, useEffect, useMemo, useCallback } from 'react';
import { AccountReceivable } from '@/types/accounts';
import { useAccountsReceivable } from './useAccountsReceivable';
import { useCategories } from './useCategories';
import { useContatos } from './useContatos';
import { toast } from 'sonner';

export interface FiltrosContasReceber {
  busca: string;
  status: 'todos' | 'pendente' | 'recebido' | 'vencido';
  cliente_id: string;
  categoria_id: string;
  data_inicio: string;
  data_fim: string;
  valor_min: string;
  valor_max: string;
  mes_referencia: string;
}

export interface EstatisticasContasReceber {
  total: number;
  total_valor: number;
  pendentes: number;
  valor_pendente: number;
  recebidas: number;
  valor_recebido: number;
  vencidas: number;
  valor_vencido: number;
}

export const useContasReceberOtimizado = () => {
  const { accounts, loading, error, createAccount, updateAccount, markAsReceived, deleteAccount, refetch } = useAccountsReceivable();
  const { categories } = useCategories();
  const { contatos: clientes } = useContatos();

  const [filtros, setFiltros] = useState<FiltrosContasReceber>({
    busca: '',
    status: 'todos',
    cliente_id: '',
    categoria_id: '',
    data_inicio: '',
    data_fim: '',
    valor_min: '',
    valor_max: '',
    mes_referencia: ''
  });

  const [filtroRapido, setFiltroRapido] = useState<string>('todos');

  // Filtrar contas baseado nos critérios
  const contasFiltradas = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter(conta => {
      const hoje = new Date();
      const dataVencimento = new Date(conta.due_date);
      const isVencida = dataVencimento < hoje && conta.status === 'pending';

      // Filtro de busca
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        const matchDescricao = conta.description?.toLowerCase().includes(busca);
        const matchCliente = conta.customer_name?.toLowerCase().includes(busca);
        const matchReferencia = conta.reference_document?.toLowerCase().includes(busca);
        
        if (!matchDescricao && !matchCliente && !matchReferencia) {
          return false;
        }
      }

      // Filtro de status
      if (filtros.status !== 'todos') {
        if (filtros.status === 'vencido') {
          if (!isVencida) return false;
        } else if (filtros.status === 'pendente' && conta.status !== 'pending') {
          return false;
        } else if (filtros.status === 'recebido' && conta.status !== 'received') {
          return false;
        }
      }

      // Filtro de cliente
      if (filtros.cliente_id && conta.contact_id !== filtros.cliente_id) {
        return false;
      }

      // Filtro de categoria
      if (filtros.categoria_id && conta.category_id !== filtros.categoria_id) {
        return false;
      }

      // Filtro de valor
      if (filtros.valor_min && conta.amount < parseFloat(filtros.valor_min)) {
        return false;
      }

      if (filtros.valor_max && conta.amount > parseFloat(filtros.valor_max)) {
        return false;
      }

      // Filtro de data
      if (filtros.data_inicio && conta.due_date < filtros.data_inicio) {
        return false;
      }

      if (filtros.data_fim && conta.due_date > filtros.data_fim) {
        return false;
      }

      // Filtro de mês de referência
      if (filtros.mes_referencia) {
        const mesReferencia = new Date(filtros.mes_referencia);
        const mesVencimento = new Date(conta.due_date);
        
        if (mesVencimento.getMonth() !== mesReferencia.getMonth() || 
            mesVencimento.getFullYear() !== mesReferencia.getFullYear()) {
          return false;
        }
      }

      return true;
    });
  }, [accounts, filtros]);

  // Calcular estatísticas
  const estatisticas = useMemo((): EstatisticasContasReceber => {
    const hoje = new Date();
    
    const stats = contasFiltradas.reduce((acc, conta) => {
      const dataVencimento = new Date(conta.due_date);
      const isVencida = dataVencimento < hoje && conta.status === 'pending';

      acc.total++;
      acc.total_valor += conta.amount;

      if (conta.status === 'received') {
        acc.recebidas++;
        acc.valor_recebido += conta.received_amount || conta.amount;
      } else if (isVencida) {
        acc.vencidas++;
        acc.valor_vencido += conta.amount;
      } else if (conta.status === 'pending') {
        acc.pendentes++;
        acc.valor_pendente += conta.amount;
      }

      return acc;
    }, {
      total: 0,
      total_valor: 0,
      pendentes: 0,
      valor_pendente: 0,
      recebidas: 0,
      valor_recebido: 0,
      vencidas: 0,
      valor_vencido: 0
    });

    return stats;
  }, [contasFiltradas]);

  const carregarContas = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas a receber');
    }
  }, [refetch]);

  const criarConta = useCallback(async (dadosConta: Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await createAccount(dadosConta);
      toast.success('Conta a receber criada com sucesso!');
      await refetch();
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta a receber');
      throw error;
    }
  }, [createAccount, refetch]);

  const atualizarConta = useCallback(async (id: string, dadosAtualizacao: Partial<AccountReceivable>) => {
    try {
      await updateAccount(id, dadosAtualizacao);
      toast.success('Conta atualizada com sucesso!');
      await refetch();
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast.error('Erro ao atualizar conta');
      throw error;
    }
  }, [updateAccount, refetch]);

  const excluirConta = useCallback(async (id: string) => {
    try {
      await deleteAccount(id);
      toast.success('Conta excluída com sucesso!');
      await refetch();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
      throw error;
    }
  }, [deleteAccount, refetch]);

  const baixarConta = useCallback(async (id: string, dadosRecebimento: { bank_account_id: string; received_at: string }) => {
    try {
      await markAsReceived(id, dadosRecebimento);
      toast.success('Recebimento registrado com sucesso!');
      await refetch();
    } catch (error) {
      console.error('Erro ao registrar recebimento:', error);
      toast.error('Erro ao registrar recebimento');
      throw error;
    }
  }, [markAsReceived, refetch]);

  const limparFiltros = useCallback(() => {
    setFiltros({
      busca: '',
      status: 'todos',
      cliente_id: '',
      categoria_id: '',
      data_inicio: '',
      data_fim: '',
      valor_min: '',
      valor_max: '',
      mes_referencia: ''
    });
    setFiltroRapido('todos');
  }, []);

  // Resumos adicionais
  const resumos = useMemo(() => {
    const hoje = new Date();
    const proximosSete = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const vencendoProximo = contasFiltradas.filter(conta => {
      const vencimento = new Date(conta.due_date);
      return conta.status === 'pending' && vencimento >= hoje && vencimento <= proximosSete;
    });

    return {
      vencendoProximo: vencendoProximo.length,
      valorVencendoProximo: vencendoProximo.reduce((sum, conta) => sum + conta.amount, 0)
    };
  }, [contasFiltradas]);

  // Estados auxiliares
  const estados = {
    loading,
    error,
    temContas: accounts && accounts.length > 0,
    temContasFiltradas: contasFiltradas.length > 0
  };

  useEffect(() => {
    carregarContas();
  }, [carregarContas]);

  return {
    // Dados
    contas: accounts || [],
    contasFiltradas,
    categorias: categories || [],
    clientes: clientes || [],
    
    // Filtros
    filtros,
    setFiltros,
    filtroRapido,
    setFiltroRapido,
    limparFiltros,
    
    // Estatísticas
    estatisticas,
    resumos,
    
    // Estados
    estados,
    
    // Ações
    carregarContas,
    criarConta,
    atualizarConta,
    excluirConta,
    baixarConta,
    
    // Aliases para compatibilidade
    recarregar: carregarContas,
    salvarEdicao: atualizarConta,
    confirmarRecebimento: baixarConta,
    cancelarConta: excluirConta
  };
};