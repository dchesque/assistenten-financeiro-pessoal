import { useState, useEffect } from 'react';
import { dataService } from '@/services/DataServiceFactory';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { showMessage } from '@/utils/messages';

export interface EstatisticasFornecedor {
  total: number;
  ativos: number;
  inativos: number;
  totalCompras: number;
  valorTotal: number;
}

export interface UseFornecedoresReturn {
  fornecedores: any[];
  loading: boolean;
  error: string | null;
  estatisticas: EstatisticasFornecedor;
  criarFornecedor: (fornecedor: any) => Promise<any>;
  atualizarFornecedor: (id: string, fornecedor: any) => Promise<any>;
  excluirFornecedor: (id: string) => Promise<void>;
  buscarFornecedores: (termo: string) => any[];
  buscarPorDocumento: (documento: string) => any;
  atualizarEstatisticas: () => Promise<void>;
  recarregar: () => Promise<void>;
  carregarFornecedores: () => Promise<void>;
}

export function useFornecedores(): UseFornecedoresReturn {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { handleError, withRetry, withTimeout, cancelAll } = useErrorHandler('fornecedores');

  const calcularEstatisticas = (fornecedoresList: any[]): EstatisticasFornecedor => {
    const ativos = fornecedoresList.filter(f => f.ativo || f.active);
    const inativos = fornecedoresList.filter(f => !(f.ativo || f.active));
    
    return {
      total: fornecedoresList.length,
      ativos: ativos.length,
      inativos: inativos.length,
      totalCompras: fornecedoresList.reduce((acc, f) => acc + (f.totalCompras || f.total_purchases || 0), 0),
      valorTotal: fornecedoresList.reduce((acc, f) => acc + (f.valorTotal || f.total_value || 0), 0)
    };
  };

  const carregarFornecedores = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await dataService.fornecedores.getAll();
      setFornecedores(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      const appErr = handleError(error, 'carregar-fornecedores');
      setError(appErr.message);
    } finally {
      setLoading(false);
    }
  };

  const criarFornecedor = async (fornecedor: any): Promise<any> => {
    try {
      const novoFornecedor = await showMessage.promise(
        dataService.fornecedores.create(fornecedor),
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

  const atualizarFornecedor = async (id: string, dadosAtualizacao: any): Promise<any> => {
    try {
      const fornecedorAtualizado = await showMessage.promise(
        dataService.fornecedores.update(id, dadosAtualizacao),
        {
          loading: 'Atualizando fornecedor...',
          success: 'Fornecedor atualizado com sucesso!',
          error: 'Erro ao atualizar fornecedor'
        }
      );
      
      setFornecedores(prev => prev.map(f => f.id === id ? fornecedorAtualizado : f));
      return fornecedorAtualizado;
    } catch (err) {
      handleError(err, 'atualizar-fornecedor');
      throw err;
    }
  };

  const excluirFornecedor = async (id: string): Promise<void> => {
    const fornecedorAExcluir = fornecedores.find(f => f.id === id);
    
    try {
      await showMessage.promise(
        dataService.fornecedores.delete(id),
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

  const buscarFornecedores = (termo: string): any[] => {
    if (!termo) return fornecedores;
    
    const termoLower = termo.toLowerCase();
    return fornecedores.filter(f => 
      (f.nome || f.name)?.toLowerCase().includes(termoLower) ||
      (f.documento || f.document)?.includes(termo) ||
      (f.email)?.toLowerCase().includes(termoLower)
    );
  };

  const buscarPorDocumento = (documento: string) => {
    return fornecedores.find(f => (f.documento || f.document) === documento);
  };

  const atualizarEstatisticas = async () => {
    // Estatísticas já são calculadas automaticamente
  };

  const recarregar = async (): Promise<void> => {
    await carregarFornecedores();
  };

  useEffect(() => {
    if (user) {
      carregarFornecedores();
    } else {
      setFornecedores([]);
    }

    return () => {
      cancelAll();
    };
  }, [user, cancelAll]);

  return {
    fornecedores,
    loading,
    error,
    estatisticas: calcularEstatisticas(fornecedores),
    criarFornecedor,
    atualizarFornecedor,
    excluirFornecedor,
    buscarFornecedores,
    buscarPorDocumento,
    atualizarEstatisticas,
    recarregar,
    carregarFornecedores
  };
}