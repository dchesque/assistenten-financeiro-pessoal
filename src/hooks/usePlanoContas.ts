import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface PlanoContas {
  id: number;
  nome: string;
  codigo: string;
  tipo: 'receita' | 'despesa';
  categoria_pai_id?: number;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Dados mock para plano de contas
const mockPlanoContas: PlanoContas[] = [
  {
    id: 1,
    nome: 'Receitas de Vendas',
    codigo: '3.1.01',
    tipo: 'receita',
    ativo: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    nome: 'Fornecedores',
    codigo: '1.2.01',
    tipo: 'despesa',
    ativo: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 3,
    nome: 'Material de Escritório',
    codigo: '1.2.02',
    tipo: 'despesa',
    categoria_pai_id: 2,
    ativo: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 4,
    nome: 'Energia Elétrica',
    codigo: '1.2.03',
    tipo: 'despesa',
    ativo: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

export function usePlanoContas() {
  const [contas, setContas] = useState<PlanoContas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarContas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setContas(mockPlanoContas);
    } catch (error) {
      setError('Erro ao carregar plano de contas');
      toast.error('Erro ao carregar plano de contas');
    } finally {
      setLoading(false);
    }
  };

  const criarConta = async (conta: Omit<PlanoContas, 'id' | 'created_at' | 'updated_at'>): Promise<PlanoContas> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const novaConta: PlanoContas = {
      ...conta,
      id: Math.max(...contas.map(c => c.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setContas(prev => [...prev, novaConta]);
    toast.success('Conta criada com sucesso!');
    
    return novaConta;
  };

  const atualizarConta = async (id: number, dadosAtualizacao: Partial<PlanoContas>): Promise<PlanoContas> => {
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

  const buscarContasPorTipo = (tipo: 'receita' | 'despesa'): PlanoContas[] => {
    return contas.filter(c => c.tipo === tipo && c.ativo);
  };

  const buscarContasAtivas = (): PlanoContas[] => {
    return contas.filter(c => c.ativo);
  };

  useEffect(() => {
    carregarContas();
  }, []);

  return {
    contas,
    planoContas: contas, // Alias para compatibilidade
    loading,
    error,
    carregarContas,
    listarPlanoContas: carregarContas, // Alias para compatibilidade
    criarConta,
    criarPlanoContas: criarConta, // Alias para compatibilidade
    atualizarConta,
    atualizarPlanoContas: atualizarConta, // Alias para compatibilidade
    excluirConta,
    excluirPlanoContas: excluirConta, // Alias para compatibilidade
    buscarContasPorTipo,
    buscarContasAtivas,
    buscarContasAnaliticas: buscarContasAtivas // Alias para compatibilidade
  };
}