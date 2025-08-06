import { useState, useEffect } from 'react';
import { mockDataService, type ContaPagar } from '@/services/mockDataService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UseContasPagarReturn {
  contas: ContaPagar[];
  loading: boolean;
  error: string | null;
  criarConta: (conta: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<ContaPagar>;
  atualizarConta: (id: string, conta: Partial<ContaPagar>) => Promise<ContaPagar | null>;
  excluirConta: (id: string) => Promise<void>;
  baixarConta: (id: string, dados: { data_pagamento: string; valor_pago?: number }) => Promise<ContaPagar | null>;
  recarregar: () => Promise<void>;
  estatisticas: {
    total_contas: number;
    valor_total: number;
    pendentes: number;
    valor_pendente: number;
    vencidas: number;
    valor_vencido: number;
    pagas: number;
    valor_pago: number;
  };
}

export function useContasPagar(): UseContasPagarReturn {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Calcular estatísticas
  const estatisticas = {
    total_contas: contas.length,
    valor_total: contas.reduce((total, conta) => total + conta.valor_original, 0),
    pendentes: contas.filter(conta => conta.status === 'pendente').length,
    valor_pendente: contas.filter(conta => conta.status === 'pendente').reduce((total, conta) => total + conta.valor_original, 0),
    vencidas: contas.filter(conta => conta.status === 'vencido').length,
    valor_vencido: contas.filter(conta => conta.status === 'vencido').reduce((total, conta) => total + conta.valor_original, 0),
    pagas: contas.filter(conta => conta.status === 'pago').length,
    valor_pago: contas.filter(conta => conta.status === 'pago').reduce((total, conta) => total + (conta.valor_pago || conta.valor_original), 0)
  };

  const carregarContas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await mockDataService.getContasPagar();
      setContas(data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      setError('Erro ao carregar contas');
      toast.error('Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  };

  const criarConta = async (dadosConta: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<ContaPagar> => {
    try {
      setLoading(true);
      
      // Validações básicas
      if (dadosConta.valor_original <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      if (new Date(dadosConta.data_vencimento) < new Date()) {
        // Permitir datas passadas, mas alertar
        console.warn('Data de vencimento no passado');
      }

      const novaConta = await mockDataService.createContaPagar(dadosConta);
      setContas(prev => [...prev, novaConta]);
      
      toast.success('Conta a pagar criada com sucesso!');
      return novaConta;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar conta a pagar';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarConta = async (id: string, dadosAtualizacao: Partial<ContaPagar>): Promise<ContaPagar | null> => {
    try {
      setLoading(true);
      
      // Validações
      if (dadosAtualizacao.valor_original !== undefined && dadosAtualizacao.valor_original <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }

      const contaAtualizada = await mockDataService.updateContaPagar(id, dadosAtualizacao);
      
      if (contaAtualizada) {
        setContas(prev => 
          prev.map(conta => conta.id === id ? contaAtualizada : conta)
        );
        toast.success('Conta a pagar atualizada com sucesso!');
      }
      
      return contaAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar conta a pagar';
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
      
      const sucesso = await mockDataService.deleteContaPagar(id);
      
      if (sucesso) {
        setContas(prev => prev.filter(conta => conta.id !== id));
        toast.success('Conta a pagar excluída com sucesso!');
      } else {
        throw new Error('Conta não encontrada');
      }
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir conta a pagar';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const baixarConta = async (id: string, dados: { data_pagamento: string; valor_pago?: number }): Promise<ContaPagar | null> => {
    try {
      setLoading(true);
      
      const conta = contas.find(c => c.id === id);
      if (!conta) {
        throw new Error('Conta não encontrada');
      }

      const dadosAtualizacao: Partial<ContaPagar> = {
        status: 'pago',
        data_pagamento: dados.data_pagamento,
        valor_pago: dados.valor_pago ?? conta.valor_original
      };

      const contaAtualizada = await mockDataService.updateContaPagar(id, dadosAtualizacao);
      
      if (contaAtualizada) {
        setContas(prev => 
          prev.map(c => c.id === id ? contaAtualizada : c)
        );
        toast.success('Conta baixada com sucesso!');
      }
      
      return contaAtualizada;
    } catch (error) {
      console.error('Erro ao baixar conta:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao baixar conta';
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
    baixarConta,
    recarregar,
    estatisticas
  };
}