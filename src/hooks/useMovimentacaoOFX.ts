import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface MovimentacaoOFXSupabase {
  id: number;
  banco_id: number;
  data_movimentacao: string;
  descricao: string;
  valor: number;
  tipo: 'debito' | 'credito';
  saldo_anterior: number;
  saldo_posterior: number;
  codigo_autenticacao?: string;
  status_conciliacao: 'pendente' | 'conciliado' | 'divergente';
  conta_pagar_id?: number;
  observacao_conciliacao?: string;
  created_at: string;
  updated_at: string;
}

// Dados mock para movimentações OFX
const mockMovimentacoes: MovimentacaoOFXSupabase[] = [
  {
    id: 1,
    banco_id: 1,
    data_movimentacao: '2024-12-22',
    descricao: 'TED RECEBIDA - ABC FORNECIMENTOS',
    valor: 1500.00,
    tipo: 'credito',
    saldo_anterior: 13500.00,
    saldo_posterior: 15000.00,
    codigo_autenticacao: 'TED123456',
    status_conciliacao: 'pendente',
    created_at: '2024-12-22T10:30:00Z',
    updated_at: '2024-12-22T10:30:00Z'
  },
  {
    id: 2,
    banco_id: 1,
    data_movimentacao: '2024-12-21',
    descricao: 'PAGTO FORNECEDOR XYZ',
    valor: 850.00,
    tipo: 'debito',
    saldo_anterior: 14350.00,
    saldo_posterior: 13500.00,
    codigo_autenticacao: 'PAG789012',
    status_conciliacao: 'conciliado',
    conta_pagar_id: 15,
    created_at: '2024-12-21T14:20:00Z',
    updated_at: '2024-12-21T14:25:00Z'
  }
];

export function useMovimentacaoOFX(bancoId?: number) {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoOFXSupabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listarMovimentacoes = async (bancoIdParam?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let movimentacoesFiltradas = mockMovimentacoes;
      
      if (bancoIdParam || bancoId) {
        const id = bancoIdParam || bancoId;
        movimentacoesFiltradas = mockMovimentacoes.filter(m => m.banco_id === id);
      }
      
      setMovimentacoes(movimentacoesFiltradas);
    } catch (error) {
      setError('Erro ao carregar movimentações');
      toast.error('Erro ao carregar movimentações OFX');
    } finally {
      setLoading(false);
    }
  };

  const criarMovimentacao = async (movimentacao: Omit<MovimentacaoOFXSupabase, 'id' | 'created_at' | 'updated_at'>): Promise<MovimentacaoOFXSupabase> => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const novaMovimentacao: MovimentacaoOFXSupabase = {
      ...movimentacao,
      id: Math.max(...movimentacoes.map(m => m.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setMovimentacoes(prev => [...prev, novaMovimentacao]);
    toast.success('Movimentação criada com sucesso!');
    
    return novaMovimentacao;
  };

  const atualizarMovimentacao = async (id: number, updates: Partial<MovimentacaoOFXSupabase>): Promise<MovimentacaoOFXSupabase> => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const movimentacaoAtualizada = movimentacoes.find(m => m.id === id);
    if (!movimentacaoAtualizada) {
      throw new Error('Movimentação não encontrada');
    }
    
    const movimentacaoNova = { 
      ...movimentacaoAtualizada, 
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    setMovimentacoes(prev => prev.map(m => m.id === id ? movimentacaoNova : m));
    toast.success('Movimentação atualizada com sucesso!');
    
    return movimentacaoNova;
  };

  const vincularContaPagar = async (movimentacaoId: number, contaPagarId: number): Promise<void> => {
    await atualizarMovimentacao(movimentacaoId, {
      status_conciliacao: 'conciliado',
      conta_pagar_id: contaPagarId
    });
    
    toast.success('Movimentação vinculada à conta a pagar!');
  };

  const marcarComoIgnorada = async (movimentacaoId: number, observacao?: string): Promise<void> => {
    await atualizarMovimentacao(movimentacaoId, {
      status_conciliacao: 'divergente',
      observacao_conciliacao: observacao
    });
    
    toast.success('Movimentação marcada como divergente!');
  };

  useEffect(() => {
    if (bancoId) {
      listarMovimentacoes(bancoId);
    }
  }, [bancoId]);

  return {
    movimentacoes,
    loading,
    error,
    listarMovimentacoes,
    criarMovimentacao,
    atualizarMovimentacao,
    vincularContaPagar,
    marcarComoIgnorada
  };
}