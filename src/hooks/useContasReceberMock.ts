import { useState, useEffect } from 'react';
import { mockDataService, type ContaReceber } from '@/services/mockDataService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UseContasReceberReturn {
  contas: ContaReceber[];
  loading: boolean;
  error: string | null;
  criarConta: (conta: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<ContaReceber>;
  atualizarConta: (id: string, conta: Partial<ContaReceber>) => Promise<ContaReceber | null>;
  excluirConta: (id: string) => Promise<void>;
  marcarComoRecebido: (id: string, dados: { data_recebimento: string; valor_recebido?: number }) => Promise<ContaReceber | null>;
  recarregar: () => Promise<void>;
  estatisticas: {
    total_contas: number;
    valor_total: number;
    pendentes: number;
    valor_pendente: number;
    vencidas: number;
    valor_vencido: number;
    recebidas: number;
    valor_recebido: number;
  };
}

export function useContasReceber(): UseContasReceberReturn {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Calcular estatísticas
  const estatisticas = {
    total_contas: contas.length,
    valor_total: contas.reduce((total, conta) => total + conta.valor, 0),
    pendentes: contas.filter(conta => conta.status === 'pendente').length,
    valor_pendente: contas.filter(conta => conta.status === 'pendente').reduce((total, conta) => total + conta.valor, 0),
    vencidas: contas.filter(conta => conta.status === 'vencido').length,
    valor_vencido: contas.filter(conta => conta.status === 'vencido').reduce((total, conta) => total + conta.valor, 0),
    recebidas: contas.filter(conta => conta.status === 'recebido').length,
    valor_recebido: contas.filter(conta => conta.status === 'recebido').reduce((total, conta) => total + conta.valor, 0)
  };

  const carregarContas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await mockDataService.getContasReceber();
      setContas(data);
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
      setError('Erro ao carregar contas a receber');
      toast.error('Erro ao carregar contas a receber');
    } finally {
      setLoading(false);
    }
  };

  const criarConta = async (dadosConta: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<ContaReceber> => {
    try {
      setLoading(true);
      
      // Validações básicas
      if (dadosConta.valor <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      if (new Date(dadosConta.data_vencimento) < new Date()) {
        // Permitir datas passadas, mas alertar
        console.warn('Data de vencimento no passado');
      }

      const novaConta = await mockDataService.createContaReceber(dadosConta);
      setContas(prev => [...prev, novaConta]);
      
      toast.success('Conta a receber criada com sucesso!');
      return novaConta;
    } catch (error) {
      console.error('Erro ao criar conta a receber:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conta a receber';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarConta = async (id: string, dadosAtualizacao: Partial<ContaReceber>): Promise<ContaReceber | null> => {
    try {
      setLoading(true);
      
      // Validações
      if (dadosAtualizacao.valor !== undefined && dadosAtualizacao.valor <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      const contaAtualizada = await mockDataService.updateContaReceber(id, dadosAtualizacao);
      
      if (contaAtualizada) {
        setContas(prev => 
          prev.map(conta => conta.id === id ? contaAtualizada : conta)
        );
        toast.success('Conta a receber atualizada com sucesso!');
      }
      
      return contaAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar conta a receber:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar conta a receber';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const excluirConta = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      
      const sucesso = await mockDataService.deleteContaReceber(id);
      
      if (sucesso) {
        setContas(prev => prev.filter(conta => conta.id !== id));
        toast.success('Conta a receber excluída com sucesso!');
      } else {
        throw new Error('Conta não encontrada');
      }
    } catch (error) {
      console.error('Erro ao excluir conta a receber:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir conta a receber';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const marcarComoRecebido = async (id: string, dados: { data_recebimento: string; valor_recebido?: number }): Promise<ContaReceber | null> => {
    try {
      setLoading(true);
      
      const conta = contas.find(c => c.id === id);
      if (!conta) {
        throw new Error('Conta não encontrada');
      }

      const dadosAtualizacao: Partial<ContaReceber> = {
        status: 'recebido',
        data_recebimento: dados.data_recebimento,
        valor: dados.valor_recebido ?? conta.valor
      };

      const contaAtualizada = await mockDataService.updateContaReceber(id, dadosAtualizacao);
      
      if (contaAtualizada) {
        setContas(prev => 
          prev.map(c => c.id === id ? contaAtualizada : c)
        );
        toast.success('Conta marcada como recebida!');
      }
      
      return contaAtualizada;
    } catch (error) {
      console.error('Erro ao marcar conta como recebida:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao marcar conta como recebida';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const recarregar = async (): Promise<void> => {
    await carregarContas();
  };

  useEffect(() => {
    if (user) {
      carregarContas();
    } else {
      setContas([]);
    }
  }, [user]);

  return {
    contas,
    loading,
    error,
    criarConta,
    atualizarConta,
    excluirConta,
    marcarComoRecebido,
    recarregar,
    estatisticas
  };
}