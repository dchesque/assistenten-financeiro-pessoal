import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { showMessage } from '@/utils/messages';
import { Fornecedor } from '@/types/fornecedor';

export interface EstatisticasFornecedor {
  total: number;
  ativos: number;
  inativos: number;
  totalCompras: number;
  valorTotal: number;
}

// Dados mock para fornecedores
const mockFornecedores: Fornecedor[] = [
  {
    id: 1,
    nome: 'ABC Fornecimentos Ltda',
    documento: '12.345.678/0001-90',
    tipo: 'pessoa_juridica',
    tipo_fornecedor: 'despesa',
    email: 'contato@abc.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua Principal, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    observacoes: 'Fornecedor principal',
    ativo: true,
    dataCadastro: '2024-01-15',
    totalCompras: 15,
    valorTotal: 25000.00,
    ultimaCompra: '2024-12-20'
  },
  {
    id: 2,
    nome: 'João Silva',
    documento: '123.456.789-01',
    tipo: 'pessoa_fisica',
    tipo_fornecedor: 'receita',
    email: 'joao@email.com',
    telefone: '(11) 88888-8888',
    endereco: 'Av. Secundária, 456',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '20000-000',
    observacoes: '',
    ativo: true,
    dataCadastro: '2024-02-10',
    totalCompras: 8,
    valorTotal: 12000.00,
    ultimaCompra: '2024-12-18'
  }
];

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { handleError, withRetry, withTimeout } = useErrorHandler('fornecedores');

  const calcularEstatisticas = (fornecedoresList: Fornecedor[]): EstatisticasFornecedor => {
    const ativos = fornecedoresList.filter(f => f.ativo);
    const inativos = fornecedoresList.filter(f => !f.ativo);
    
    return {
      total: fornecedoresList.length,
      ativos: ativos.length,
      inativos: inativos.length,
      totalCompras: fornecedoresList.reduce((acc, f) => acc + (f.totalCompras || 0), 0),
      valorTotal: fornecedoresList.reduce((acc, f) => acc + (f.valorTotal || 0), 0)
    };
  };

  const carregarFornecedores = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    const loadingToast = showMessage.loading('Carregando fornecedores...');
    
    try {
      // Simular delay de API
      await withRetry(() => 
        withTimeout(new Promise(resolve => setTimeout(() => resolve(mockFornecedores), 500)), 10000)
      );
      
      setFornecedores(mockFornecedores);
      showMessage.dismiss();
    } catch (err) {
      showMessage.dismiss();
      const appErr = handleError(err, 'carregar-fornecedores');
      setError(appErr.message);
    } finally {
      setLoading(false);
    }
  };

  const criarFornecedor = async (fornecedor: Omit<Fornecedor, 'id' | 'dataCadastro'>): Promise<Fornecedor> => {
    try {
      const novoFornecedor: Fornecedor = {
        ...fornecedor,
        id: Math.max(...fornecedores.map(f => f.id)) + 1,
        dataCadastro: new Date().toISOString(),
        totalCompras: 0,
        valorTotal: 0
      };

      await showMessage.promise(
        withRetry(() => new Promise(resolve => setTimeout(() => resolve(novoFornecedor), 500))),
        {
          loading: 'Salvando fornecedor...',
          success: 'Fornecedor criado com sucesso!',
          error: 'Erro ao criar fornecedor'
        }
      );
      
      setFornecedores(prev => [...prev, novoFornecedor]);
      return novoFornecedor;
    } catch (err) {
      handleError(err, 'criar-fornecedor');
      throw err;
    }
  };

  const atualizarFornecedor = async (id: number, dadosAtualizacao: Partial<Fornecedor>): Promise<Fornecedor> => {
    try {
      const fornecedorAtualizado = fornecedores.find(f => f.id === id);
      if (!fornecedorAtualizado) {
        throw new Error('Fornecedor não encontrado');
      }
      
      const fornecedorNovo = { ...fornecedorAtualizado, ...dadosAtualizacao };

      await showMessage.promise(
        withRetry(() => new Promise(resolve => setTimeout(() => resolve(fornecedorNovo), 500))),
        {
          loading: 'Atualizando fornecedor...',
          success: 'Fornecedor atualizado com sucesso!',
          error: 'Erro ao atualizar fornecedor'
        }
      );
      
      setFornecedores(prev => prev.map(f => f.id === id ? fornecedorNovo : f));
      return fornecedorNovo;
    } catch (err) {
      handleError(err, 'atualizar-fornecedor');
      throw err;
    }
  };

  const excluirFornecedor = async (id: number): Promise<void> => {
    const fornecedorAExcluir = fornecedores.find(f => f.id === id);
    
    try {
      await showMessage.promise(
        withRetry(() => new Promise(resolve => setTimeout(resolve, 500))),
        {
          loading: 'Excluindo fornecedor...',
          success: 'Fornecedor excluído com sucesso!',
          error: 'Erro ao excluir fornecedor'
        }
      );
      
      setFornecedores(prev => prev.filter(f => f.id !== id));

      // Oferecer ação de desfazer
      if (fornecedorAExcluir) {
        showMessage.withUndo('Fornecedor excluído', () => {
          setFornecedores(prev => [...prev, fornecedorAExcluir]);
        });
      }
    } catch (err) {
      handleError(err, 'excluir-fornecedor');
      throw err;
    }
  };

  const buscarFornecedores = (termo: string): Fornecedor[] => {
    if (!termo) return fornecedores;
    
    const termoLower = termo.toLowerCase();
    return fornecedores.filter(f => 
      f.nome.toLowerCase().includes(termoLower) ||
      f.documento.includes(termo) ||
      f.email?.toLowerCase().includes(termoLower)
    );
  };

  useEffect(() => {
    if (user) {
      carregarFornecedores();
    }

    return () => {
      cancelAll();
    };
  }, [user, cancelAll]);

  const buscarPorDocumento = (documento: string) => {
    return fornecedores.find(f => f.documento === documento);
  };

  const atualizarEstatisticas = async () => {
    // Mock - já calculado automaticamente
  };

  const recarregar = carregarFornecedores;

  return {
    fornecedores,
    loading,
    error,
    estatisticas: calcularEstatisticas(fornecedores),
    carregarFornecedores,
    criarFornecedor,
    atualizarFornecedor,
    excluirFornecedor,
    buscarFornecedores,
    buscarPorDocumento,
    atualizarEstatisticas,
    recarregar
  };
}