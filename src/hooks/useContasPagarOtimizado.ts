import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { accountsPayableService } from '@/services/accountsPayableService';
import { AccountPayable, PaymentData } from '@/types/accounts';
import { showMessage } from '@/utils/messages';
import { useErrorHandler } from './useErrorHandler';

export interface FiltrosContas {
  busca?: string;
  status?: string;
  fornecedor_id?: string;
  plano_conta_id?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  mes?: string; // Formato YYYY-MM
}

export interface EstatisticasContas {
  total: number;
  pendentes: number;
  pagas: number;
  vencidas: number;
  valor_total: number;
  valor_pendente: number;
  valor_pago: number;
}

export function useContasPagarOtimizado(filtrosIniciais?: FiltrosContas) {
  const [contas, setContas] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosContas>(filtrosIniciais || {});
  const [filtroRapido, setFiltroRapido] = useState('todos');

  const contasFiltradas = useMemo(() => {
    return contas.filter(conta => {
      // Filtro por busca
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        if (!conta.description.toLowerCase().includes(busca)) return false;
      }

      // Filtro por status
      if (filtros.status && filtros.status !== 'todos') {
        // Converter status do inglês para português
        const statusMap: Record<string, string> = {
          'pending': 'pendente',
          'paid': 'pago',
          'overdue': 'vencido'
        };
        const statusPortugues = statusMap[conta.status] || conta.status;
        if (statusPortugues !== filtros.status) {
          return false;
        }
      }

      // Filtro por mês
      if (filtros.mes && filtros.mes !== 'todos') {
        const contaMes = conta.due_date.slice(0, 7); // YYYY-MM
        if (contaMes !== filtros.mes) {
          return false;
        }
      }

      // Filtro por fornecedor
      if (filtros.fornecedor_id && conta.contact_id !== filtros.fornecedor_id) {
        return false;
      }

      // Filtro por data
      if (filtros.data_inicio && conta.due_date < filtros.data_inicio) {
        return false;
      }
      if (filtros.data_fim && conta.due_date > filtros.data_fim) {
        return false;
      }

      // Filtro por valor
      if (filtros.valor_min && conta.amount < filtros.valor_min) {
        return false;
      }
      if (filtros.valor_max && conta.amount > filtros.valor_max) {
        return false;
      }

      return true;
    });
  }, [contas, filtros]);

  const estatisticas = useMemo((): EstatisticasContas => {
    const pendentes = contasFiltradas.filter(c => c.status === 'pending');
    const pagas = contasFiltradas.filter(c => c.status === 'paid');
    const vencidas = contasFiltradas.filter(c => c.status === 'overdue');

    return {
      total: contasFiltradas.length,
      pendentes: pendentes.length,
      pagas: pagas.length,
      vencidas: vencidas.length,
      valor_total: contasFiltradas.reduce((acc, c) => acc + c.amount, 0),
      valor_pendente: pendentes.reduce((acc, c) => acc + c.amount, 0),
      valor_pago: pagas.reduce((acc, c) => acc + c.amount, 0)
    };
  }, [contasFiltradas]);

  const carregarContas = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Update overdue accounts first
      await accountsPayableService.updateOverdueAccounts();
      
      const data = await accountsPayableService.getAccountsPayable();
      setContas(data);
    } catch (err) {
      const appError = handleError(err, 'useContasPagarOtimizado.carregarContas');
      setError(appError.message);
      showMessage.saveError('Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  };

  const criarConta = async (conta: Omit<AccountPayable, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<AccountPayable> => {
    try {
      const novaConta = await accountsPayableService.createAccountPayable(conta);
      await carregarContas(); // Refresh the list
      showMessage.saveSuccess('Conta criada com sucesso!');
      return novaConta;
    } catch (err) {
      handleError(err, 'useContasPagarOtimizado.criarConta');
      showMessage.saveError('Erro ao criar conta');
      throw err;
    }
  };

  const atualizarConta = async (id: string, dadosAtualizacao: Partial<AccountPayable>): Promise<AccountPayable> => {
    try {
      const contaAtualizada = await accountsPayableService.updateAccountPayable(id, dadosAtualizacao);
      await carregarContas(); // Refresh the list
      showMessage.saveSuccess('Conta atualizada com sucesso!');
      return contaAtualizada;
    } catch (err) {
      handleError(err, 'useContasPagarOtimizado.atualizarConta');
      showMessage.saveError('Erro ao atualizar conta');
      throw err;
    }
  };

  const excluirConta = async (id: string): Promise<void> => {
    try {
      await accountsPayableService.deleteAccountPayable(id);
      await carregarContas(); // Refresh the list
      showMessage.deleteSuccess('Conta excluída com sucesso!');
    } catch (err) {
      handleError(err, 'useContasPagarOtimizado.excluirConta');
      showMessage.deleteError('Erro ao excluir conta');
      throw err;
    }
  };

  const baixarConta = async (id: string, dadosPagamento: PaymentData): Promise<void> => {
    try {
      await accountsPayableService.markAsPaid(id, dadosPagamento);
      await carregarContas(); // Refresh the list
      showMessage.saveSuccess('Conta baixada com sucesso!');
    } catch (err) {
      handleError(err, 'useContasPagarOtimizado.baixarConta');
      showMessage.saveError('Erro ao baixar conta');
      throw err;
    }
  };

  const recarregar = carregarContas;

  const limparFiltros = () => {
    setFiltros({});
    setFiltroRapido('todos');
  };

  // Estatísticas expandidas
  const pendentesContas = contasFiltradas.filter(c => c.status === 'pending');
  const vencidasContas = contasFiltradas.filter(c => c.status === 'overdue');
  const vence7DiasContas = contasFiltradas.filter(c => {
    const hoje = new Date();
    const vencimento = new Date(c.due_date);
    const diasParaVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return c.status === 'pending' && diasParaVencimento <= 7 && diasParaVencimento >= 0;
  });
  const pagasMesContas = contasFiltradas.filter(c => {
    const hoje = new Date();
    const pagamento = c.paid_at ? new Date(c.paid_at) : null;
    return c.status === 'paid' && pagamento && 
      pagamento.getMonth() === hoje.getMonth() && 
      pagamento.getFullYear() === hoje.getFullYear();
  });

  const resumos = {
    total: estatisticas.total,
    valor_total: estatisticas.valor_total,
    pendentes: {
      total: pendentesContas.length,
      valor: pendentesContas.reduce((acc, c) => acc + c.amount, 0)
    },
    vencidas: {
      total: vencidasContas.length,
      valor: vencidasContas.reduce((acc, c) => acc + c.amount, 0)
    },
    vence7Dias: {
      total: vence7DiasContas.length,
      valor: vence7DiasContas.reduce((acc, c) => acc + c.amount, 0)
    },
    pagasMes: {
      total: pagasMesContas.length,
      valor: pagasMesContas.reduce((acc, c) => acc + c.amount, 0)
    }
  };
  
  const estados = {
    carregando: loading,
    carregandoContas: loading,
    salvandoEdicao: false,
    processandoBaixa: false,
    erro: error
  };

  const salvarEdicao = async (id: string, dados: Partial<AccountPayable>) => {
    return await atualizarConta(id, dados);
  };

  const confirmarBaixa = async (id: string, dadosBaixa: PaymentData) => {
    return await baixarConta(id, dadosBaixa);
  };

  const cancelarConta = async (id: string): Promise<void> => {
    await atualizarConta(id, { status: 'pending' });
    showMessage.saveSuccess('Conta cancelada com sucesso!');
  };

  useEffect(() => {
    if (user) {
      carregarContas();
    } else {
      setContas([]);
    }
  }, [user]);

  return {
    contas: contasFiltradas,
    contasFiltradas,
    loading,
    error,
    estatisticas,
    resumos,
    estados,
    filtros,
    setFiltros,
    filtroRapido,
    setFiltroRapido,
    limparFiltros,
    carregarContas,
    criarConta,
    atualizarConta,
    excluirConta,
    baixarConta,
    salvarEdicao,
    confirmarBaixa,
    cancelarConta,
    recarregar
  };
}