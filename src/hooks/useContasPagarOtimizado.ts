import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { ContaPagar } from './useContasPagar';

export interface FiltrosContas {
  busca?: string;
  status?: string;
  fornecedor_id?: number;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
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

// Dados mock otimizados
const mockContasOtimizadas: ContaPagar[] = [
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
  },
  {
    id: 4,
    descricao: 'Telefone empresarial',
    valor_original: 320.50,
    valor_final: 320.50,
    data_vencimento: '2024-12-18',
    status: 'vencido',
    fornecedor_id: 2,
    created_at: '2024-12-15T11:15:00Z',
    updated_at: '2024-12-15T11:15:00Z'
  }
];

export function useContasPagarOtimizado(filtros?: FiltrosContas) {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contasFiltradas = useMemo(() => {
    if (!filtros) return contas;

    return contas.filter(conta => {
      // Filtro por busca
      if (filtros.busca) {
        const busca = filtros.busca.toLowerCase();
        if (!conta.descricao.toLowerCase().includes(busca)) return false;
      }

      // Filtro por status
      if (filtros.status && filtros.status !== 'todos' && conta.status !== filtros.status) {
        return false;
      }

      // Filtro por fornecedor
      if (filtros.fornecedor_id && conta.fornecedor_id !== filtros.fornecedor_id) {
        return false;
      }

      // Filtro por data
      if (filtros.data_inicio && conta.data_vencimento < filtros.data_inicio) {
        return false;
      }
      if (filtros.data_fim && conta.data_vencimento > filtros.data_fim) {
        return false;
      }

      // Filtro por valor
      if (filtros.valor_min && conta.valor_final < filtros.valor_min) {
        return false;
      }
      if (filtros.valor_max && conta.valor_final > filtros.valor_max) {
        return false;
      }

      return true;
    });
  }, [contas, filtros]);

  const estatisticas = useMemo((): EstatisticasContas => {
    const pendentes = contasFiltradas.filter(c => c.status === 'pendente');
    const pagas = contasFiltradas.filter(c => c.status === 'pago');
    const vencidas = contasFiltradas.filter(c => c.status === 'vencido');

    return {
      total: contasFiltradas.length,
      pendentes: pendentes.length,
      pagas: pagas.length,
      vencidas: vencidas.length,
      valor_total: contasFiltradas.reduce((acc, c) => acc + c.valor_final, 0),
      valor_pendente: pendentes.reduce((acc, c) => acc + c.valor_final, 0),
      valor_pago: pagas.reduce((acc, c) => acc + c.valor_final, 0)
    };
  }, [contasFiltradas]);

  const carregarContas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Marcar como vencidas as contas com data de vencimento passada
      const contasComStatus = mockContasOtimizadas.map(conta => {
        if (conta.status === 'pendente' && new Date(conta.data_vencimento) < new Date()) {
          return { ...conta, status: 'vencido' as const };
        }
        return conta;
      });
      
      setContas(contasComStatus);
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

  const recarregar = carregarContas;

  useEffect(() => {
    carregarContas();
  }, []);

  return {
    contas: contasFiltradas,
    loading,
    error,
    estatisticas,
    carregarContas,
    criarConta,
    atualizarConta,
    excluirConta,
    baixarConta,
    recarregar
  };
}