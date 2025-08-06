import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface ContaPagar {
  id: number;
  descricao: string;
  valor_original: number;
  valor_final: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'vencido';
  fornecedor_id: number;
  plano_contas_id?: number;
  banco_id?: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Dados mock para contas a pagar
const mockContasPagar: ContaPagar[] = [
  {
    id: 1,
    descricao: 'Material de escritório',
    valor_original: 850.00,
    valor_final: 850.00,
    data_vencimento: '2024-12-25',
    status: 'pendente',
    fornecedor_id: 1,
    plano_contas_id: 3,
    observacoes: 'Pagamento mensal',
    created_at: '2024-12-20T10:00:00Z',
    updated_at: '2024-12-20T10:00:00Z'
  },
  {
    id: 2,
    descricao: 'Energia elétrica - dezembro',
    valor_original: 450.75,
    valor_final: 450.75,
    data_vencimento: '2024-12-30',
    status: 'pendente',
    fornecedor_id: 2,
    plano_contas_id: 4,
    created_at: '2024-12-21T14:20:00Z',
    updated_at: '2024-12-21T14:20:00Z'
  },
  {
    id: 3,
    descricao: 'Serviços de consultoria',
    valor_original: 2500.00,
    valor_final: 2500.00,
    data_vencimento: '2024-12-20',
    data_pagamento: '2024-12-20',
    status: 'pago',
    fornecedor_id: 1,
    banco_id: 1,
    created_at: '2024-12-18T09:30:00Z',
    updated_at: '2024-12-20T16:45:00Z'
  }
];

export function useContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarContas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setContas(mockContasPagar);
    } catch (error) {
      setError('Erro ao carregar contas a pagar');
      toast.error('Erro ao carregar contas a pagar');
    } finally {
      setLoading(false);
    }
  };

  const criarConta = async (conta: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>): Promise<ContaPagar> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const novaConta: ContaPagar = {
      ...conta,
      id: Math.max(...contas.map(c => c.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setContas(prev => [...prev, novaConta]);
    toast.success('Conta criada com sucesso!');
    
    return novaConta;
  };

  const atualizarConta = async (id: number, dadosAtualizacao: Partial<ContaPagar>): Promise<ContaPagar> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const contaAtualizada = contas.find(c => c.id === id);
    if (!contaAtualizada) {
      throw new Error('Conta não encontrada');
    }
    
    const contaNova = { 
      ...contaAtualizada, 
      ...dadosAtualizacao,
      updated_at: new Date().toISOString()
    };
    
    setContas(prev => prev.map(c => c.id === id ? contaNova : c));
    toast.success('Conta atualizada com sucesso!');
    
    return contaNova;
  };

  const excluirConta = async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setContas(prev => prev.filter(c => c.id !== id));
    toast.success('Conta excluída com sucesso!');
  };

  const baixarConta = async (id: number, dadosPagamento: { data_pagamento: string; banco_id?: number; valor_pago?: number }): Promise<void> => {
    await atualizarConta(id, {
      ...dadosPagamento,
      status: 'pago',
      valor_final: dadosPagamento.valor_pago || contas.find(c => c.id === id)?.valor_final || 0
    });
    
    toast.success('Conta baixada com sucesso!');
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
    carregarContas,
    criarConta,
    atualizarConta,
    excluirConta,
    baixarConta,
    filtrarContas
  };
}