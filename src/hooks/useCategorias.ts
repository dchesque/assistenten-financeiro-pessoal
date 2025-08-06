import { useState, useEffect } from 'react';
import { mockDataService, type Categoria } from '@/services/mockDataService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UseCategoriastReturn {
  categorias: Categoria[];
  loading: boolean;
  error: string | null;
  criarCategoria: (categoria: Omit<Categoria, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Categoria>;
  atualizarCategoria: (id: string, categoria: Partial<Categoria>) => Promise<Categoria | null>;
  excluirCategoria: (id: string) => Promise<void>;
  recarregar: () => Promise<void>;
}

export function useCategorias(): UseCategoriastReturn {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const carregarCategorias = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await mockDataService.getCategorias();
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setError('Erro ao carregar categorias');
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const criarCategoria = async (dadosCategoria: Omit<Categoria, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Categoria> => {
    try {
      setLoading(true);
      
      // Verificar se já existe categoria com o mesmo nome
      const existente = categorias.find(cat => 
        cat.nome.toLowerCase() === dadosCategoria.nome.toLowerCase() &&
        cat.tipo === dadosCategoria.tipo
      );
      
      if (existente) {
        throw new Error('Já existe uma categoria com este nome para este tipo');
      }

      const novaCategoria = await mockDataService.createCategoria(dadosCategoria);
      setCategorias(prev => [...prev, novaCategoria]);
      
      toast.success('Categoria criada com sucesso!');
      return novaCategoria;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar categoria';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarCategoria = async (id: string, dadosAtualizacao: Partial<Categoria>): Promise<Categoria | null> => {
    try {
      setLoading(true);
      
      // Verificar se novo nome já existe (se nome estiver sendo alterado)
      if (dadosAtualizacao.nome) {
        const categoriaAtual = categorias.find(cat => cat.id === id);
        if (categoriaAtual) {
          const existente = categorias.find(cat => 
            cat.id !== id &&
            cat.nome.toLowerCase() === dadosAtualizacao.nome!.toLowerCase() &&
            cat.tipo === (dadosAtualizacao.tipo || categoriaAtual.tipo)
          );
          
          if (existente) {
            throw new Error('Já existe uma categoria com este nome para este tipo');
          }
        }
      }

      const categoriaAtualizada = await mockDataService.updateCategoria(id, dadosAtualizacao);
      
      if (categoriaAtualizada) {
        setCategorias(prev => 
          prev.map(cat => cat.id === id ? categoriaAtualizada : cat)
        );
        toast.success('Categoria atualizada com sucesso!');
      }
      
      return categoriaAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar categoria';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const excluirCategoria = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Verificar se categoria está sendo usada (implementar quando houver contas)
      // Por enquanto, permitir exclusão
      
      const sucesso = await mockDataService.deleteCategoria(id);
      
      if (sucesso) {
        setCategorias(prev => prev.filter(cat => cat.id !== id));
        toast.success('Categoria excluída com sucesso!');
      } else {
        throw new Error('Categoria não encontrada');
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir categoria';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const recarregar = async (): Promise<void> => {
    await carregarCategorias();
  };

  useEffect(() => {
    if (user) {
      carregarCategorias();
    } else {
      setCategorias([]);
    }
  }, [user]);

  return {
    categorias,
    loading,
    error,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
    recarregar
  };
}