import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { dataService } from '@/services/DataServiceFactory';
import type { ContaPagar } from '@/types/contaPagar';

// Dados mock removidos - agora usando dataService

// Re-export ContaEnriquecida for compatibility
export type { ContaEnriquecida } from '@/types/contaEnriquecida';

export function useContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarContas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const contasCarregadas = await dataService.contasPagar.getAll();
      setContas(contasCarregadas);
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error);
      setError('Erro ao carregar contas a pagar');
      toast.error('Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  };

  const criarConta = async (conta: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>): Promise<ContaPagar> => {
    try {
      const novaConta = await dataService.contasPagar.create(conta);
      setContas(prev => [...prev, novaConta]);
      toast.success('Conta criada com sucesso!');
      return novaConta;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta');
      throw error;
    }
  };

  const atualizarConta = async (id: number, dadosAtualizacao: Partial<ContaPagar>): Promise<ContaPagar> => {
    try {
      const contaAtualizada = await dataService.contasPagar.update(id, dadosAtualizacao);
      setContas(prev => prev.map(c => c.id === id ? contaAtualizada : c));
      toast.success('Conta atualizada com sucesso!');
      return contaAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast.error('Erro ao atualizar conta');
      throw error;
    }
  };

  const excluirConta = async (id: number): Promise<void> => {
    try {
      await dataService.contasPagar.delete(id);
      setContas(prev => prev.filter(c => c.id !== id));
      toast.success('Conta excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
      throw error;
    }
  };

  const baixarConta = async (id: number, dadosPagamento: { data_pagamento: string; banco_id?: number; valor_pago?: number }): Promise<void> => {
    try {
      const dataPagamento = new Date(dadosPagamento.data_pagamento);
      await dataService.contasPagar.marcarComoPaga(id, dataPagamento, dadosPagamento.valor_pago);
      
      // Atualizar estado local
      setContas(prev => prev.map(c => 
        c.id === id 
          ? { 
              ...c, 
              status: 'pago' as const, 
              data_pagamento: dadosPagamento.data_pagamento,
              banco_id: dadosPagamento.banco_id,
              valor_final: dadosPagamento.valor_pago || c.valor_final
            }
          : c
      ));
      
      toast.success('Conta baixada com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar conta:', error);
      toast.error('Erro ao baixar conta');
      throw error;
    }
  };

  const filtrarContas = (filtros: { status?: string; fornecedor_id?: number; data_inicio?: string; data_fim?: string }) => {
    return contas.filter(conta => {
      if (filtros.status && filtros.status !== 'todos' && conta.status !== filtros.status) return false;
      if (filtros.fornecedor_id && conta.fornecedor_id !== filtros.fornecedor_id) return false;
      if (filtros.data_inicio && conta.data_vencimento < filtros.data_inicio) return false;
      if (filtros.data_fim && conta.data_vencimento > filtros.data_fim) return false;
      return true;
    });
  };

  useEffect(() => {
    carregarContas();
  }, []);

  // Tipo ContaEnriquecida para compatibilidade

  return {
    contas,
    loading,
    error,
    estados: {
      carregando: loading,
      salvandoEdicao: false,
      erro: error
    },
    carregarContas,
    criarConta,
    atualizarConta,
    excluirConta,
    baixarConta,
    filtrarContas
  };
}