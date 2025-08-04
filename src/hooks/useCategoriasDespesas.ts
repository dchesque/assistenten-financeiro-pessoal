import { useState, useEffect, useCallback } from 'react';
import { CategoriaDespesa, FiltrosCategoria, GRUPOS_CATEGORIA, supabaseToCategoriaDespesa } from '@/types/categoriaDespesa';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Hook temporário que funciona com any até atualizarmos os tipos do Supabase

export const useCategoriasDespesas = () => {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar categorias
  const carregarCategorias = useCallback(async (filtros?: FiltrosCategoria) => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = (supabase as any)
        .from('categorias_despesas')
        .select('*')
        .eq('user_id', user.id)
        .order('grupo', { ascending: true })
        .order('nome', { ascending: true });

      if (filtros?.grupo) {
        query = query.eq('grupo', filtros.grupo);
      }
      
      if (filtros?.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo);
      }
      
      if (filtros?.busca) {
        query = query.ilike('nome', `%${filtros.busca}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const categoriasConvertidas = (data || []).map(supabaseToCategoriaDespesa);
      setCategorias(categoriasConvertidas);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar categorias';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Criar categoria
  const criarCategoria = async (categoria: Omit<CategoriaDespesa, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    
    try {
      // Verificar se já existe categoria com mesmo nome
      const categoriaExistente = categorias.find(c => 
        c.nome.toLowerCase() === categoria.nome.toLowerCase() && c.ativo
      );
      
      if (categoriaExistente) {
        throw new Error('Já existe uma categoria com este nome');
      }

      const { data, error } = await (supabase as any)
        .from('categorias_despesas')
        .insert({
          nome: categoria.nome,
          grupo: categoria.grupo,
          cor: categoria.cor,
          icone: categoria.icone,
          user_id: user.id,
          ativo: categoria.ativo
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const novaCategoria = supabaseToCategoriaDespesa(data);
      setCategorias(prev => [...prev, novaCategoria]);
      
      toast.success('Categoria criada com sucesso!');
      return novaCategoria;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar categoria';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar categoria
  const atualizarCategoria = async (id: number, dados: Partial<CategoriaDespesa>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    
    try {
      // Verificar se já existe categoria com mesmo nome (exceto a atual)
      if (dados.nome) {
        const categoriaExistente = categorias.find(c => 
          c.nome.toLowerCase() === dados.nome.toLowerCase() && 
          c.id !== id && 
          c.ativo
        );
        
        if (categoriaExistente) {
          throw new Error('Já existe uma categoria com este nome');
        }
      }

      const { data, error } = await (supabase as any)
        .from('categorias_despesas')
        .update({
          nome: dados.nome,
          grupo: dados.grupo,
          cor: dados.cor,
          icone: dados.icone,
          ativo: dados.ativo
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      const categoriaAtualizada = supabaseToCategoriaDespesa(data);
      setCategorias(prev => 
        prev.map(c => c.id === id ? categoriaAtualizada : c)
      );
      
      toast.success('Categoria atualizada com sucesso!');
      return categoriaAtualizada;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar categoria';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir categoria
  const excluirCategoria = async (id: number) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    
    try {
      // Verificar se há contas vinculadas
      const { data: contas } = await (supabase as any)
        .from('contas_pessoais')
        .select('id')
        .eq('categoria_id', id)
        .eq('user_id', user.id)
        .limit(1);
      
      if (contas && contas.length > 0) {
        throw new Error('Não é possível excluir categoria que possui contas vinculadas');
      }

      const { error } = await (supabase as any)
        .from('categorias_despesas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setCategorias(prev => prev.filter(c => c.id !== id));
      
      toast.success('Categoria excluída com sucesso!');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir categoria';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar categorias para seletor
  const buscarCategorias = useCallback(async (termo?: string, grupo?: string) => {
    if (!user?.id) return [];
    
    try {
      let query = (supabase as any)
        .from('categorias_despesas')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (grupo) {
        query = query.eq('grupo', grupo);
      }
      
      if (termo) {
        query = query.ilike('nome', `%${termo}%`);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      
      return (data || []).map(supabaseToCategoriaDespesa);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  }, [user?.id]);

  // Obter estatísticas
  const obterEstatisticas = useCallback(() => {
    const stats = {
      total: categorias.length,
      ativas: categorias.filter(c => c.ativo).length,
      inativas: categorias.filter(c => !c.ativo).length,
      porGrupo: {} as Record<string, number>
    };

    categorias.forEach(categoria => {
      if (categoria.ativo) {
        stats.porGrupo[categoria.grupo] = (stats.porGrupo[categoria.grupo] || 0) + 1;
      }
    });

    return stats;
  }, [categorias]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      carregarCategorias();
    }
  }, [user?.id, carregarCategorias]);

  return {
    categorias,
    loading,
    error,
    carregarCategorias,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
    buscarCategorias,
    obterEstatisticas,
    gruposDisponiveis: GRUPOS_CATEGORIA
  };
};