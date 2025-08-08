import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { PlanoContas } from '@/types/planoContas';
import { useErrorHandler } from './useErrorHandler';
// Dados mock para plano de contas
const mockPlanoContas: PlanoContas[] = [
  {
    id: 1,
    nome: 'Receitas de Vendas',
    codigo: '3.1.01',
    tipo_dre: 'despesa_pessoal',
    cor: '#10b981',
    icone: 'TrendingUp',
    nivel: 1,
    aceita_lancamento: true,
    ativo: true,
    plano_pai_id: null,
    descricao: 'Receitas provenientes de vendas',
    total_contas: 5,
    valor_total: 150000.00,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    nome: 'Fornecedores',
    codigo: '1.2.01',
    tipo_dre: 'despesa_pessoal',
    cor: '#ef4444',
    icone: 'Users',
    nivel: 1,
    aceita_lancamento: true,
    ativo: true,
    plano_pai_id: null,
    descricao: 'Despesas com fornecedores',
    total_contas: 12,
    valor_total: 45000.00,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 3,
    nome: 'Material de Escritório',
    codigo: '1.2.02',
    tipo_dre: 'despesa_pessoal',
    cor: '#f59e0b',
    icone: 'Package',
    nivel: 2,
    aceita_lancamento: true,
    ativo: true,
    plano_pai_id: 2,
    descricao: 'Material de escritório e suprimentos',
    total_contas: 3,
    valor_total: 8500.00,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 4,
    nome: 'Energia Elétrica',
    codigo: '1.2.03',
    tipo_dre: 'despesa_pessoal',
    cor: '#8b5cf6',
    icone: 'Zap',
    nivel: 1,
    aceita_lancamento: true,
    ativo: true,
    plano_pai_id: null,
    descricao: 'Contas de energia elétrica',
    total_contas: 1,
    valor_total: 2800.00,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

export function usePlanoContas() {
  const [contas, setContas] = useState<PlanoContas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();
  const carregarContas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setContas(mockPlanoContas);
    } catch (error) {
      const appError = handleError(error, 'usePlanoContas.carregarContas');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const criarConta = async (conta: Omit<PlanoContas, 'id' | 'created_at' | 'updated_at'>): Promise<PlanoContas> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const novaConta: PlanoContas = {
        ...conta,
        id: Math.max(...contas.map(c => c.id)) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setContas(prev => [...prev, novaConta]);
      toast({ title: 'Sucesso', description: 'Conta criada com sucesso!' });
      
      return novaConta;
    } catch (error) {
      handleError(error, 'usePlanoContas.criarConta');
      throw error;
    }
  };

  const atualizarConta = async (id: number, dadosAtualizacao: Partial<PlanoContas>): Promise<PlanoContas> => {
    try {
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
      toast({ title: 'Sucesso', description: 'Conta atualizada com sucesso!' });
      
      return contaNova;
    } catch (error) {
      handleError(error, 'usePlanoContas.atualizarConta');
      throw error;
    }
  };

  const excluirConta = async (id: number): Promise<void> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setContas(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Sucesso', description: 'Conta excluída com sucesso!' });
    } catch (error) {
      handleError(error, 'usePlanoContas.excluirConta');
      throw error;
    }
  };

  const buscarContasPorTipo = (tipo_dre: string): PlanoContas[] => {
    return contas.filter(c => c.tipo_dre === tipo_dre && c.ativo);
  };

  const buscarContasAnaliticas = (termo?: string): PlanoContas[] => {
    const contasAnaliticas = contas.filter(c => c.aceita_lancamento && c.ativo);
    if (!termo) return contasAnaliticas;
    
    return contasAnaliticas.filter(c => 
      c.nome.toLowerCase().includes(termo.toLowerCase()) ||
      c.codigo.includes(termo)
    );
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
    buscarContasAnaliticas
  };
}