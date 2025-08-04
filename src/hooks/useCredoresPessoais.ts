import { useState, useEffect, useCallback } from 'react';
import { CredorPessoal, FiltrosCredor, supabaseToCredorPessoal } from '@/types/credorPessoal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const useCredoresPessoais = () => {
  const { user } = useAuth();
  const [credores, setCredores] = useState<CredorPessoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar credores
  const carregarCredores = useCallback(async (filtros?: FiltrosCredor) => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = (supabase as any)
        .from('credores')
        .select('*')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });

      if (filtros?.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }
      
      if (filtros?.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo);
      }
      
      if (filtros?.estado) {
        query = query.eq('estado', filtros.estado);
      }
      
      if (filtros?.busca) {
        query = query.or(`nome.ilike.%${filtros.busca}%,documento.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const credoresConvertidos = (data || []).map(supabaseToCredorPessoal);
      setCredores(credoresConvertidos);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar credores';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Criar credor
  const criarCredor = async (credor: Omit<CredorPessoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_contas' | 'valor_total' | 'ultima_conta'>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    
    try {
      // Verificar se já existe credor com mesmo documento (se fornecido)
      if (credor.documento) {
        const credorExistente = credores.find(c => 
          c.documento === credor.documento && c.ativo
        );
        
        if (credorExistente) {
          throw new Error('Já existe um credor com este documento');
        }
      }

      // Limpar e formatar documento
      const documentoLimpo = credor.documento?.replace(/\D/g, '') || null;

      const { data, error } = await (supabase as any)
        .from('credores')
        .insert({
          nome: credor.nome,
          tipo: credor.tipo,
          documento: documentoLimpo,
          email: credor.email,
          telefone: credor.telefone,
          endereco: credor.endereco,
          cidade: credor.cidade,
          estado: credor.estado,
          cep: credor.cep,
          observacoes: credor.observacoes,
          user_id: user.id,
          ativo: credor.ativo
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const novoCredor = supabaseToCredorPessoal(data);
      setCredores(prev => [...prev, novoCredor]);
      
      toast.success('Credor criado com sucesso!');
      return novoCredor;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar credor';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar credor
  const atualizarCredor = async (id: number, dados: Partial<CredorPessoal>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    
    try {
      // Verificar se já existe credor com mesmo documento (exceto o atual)
      if (dados.documento) {
        const credorExistente = credores.find(c => 
          c.documento === dados.documento && 
          c.id !== id && 
          c.ativo
        );
        
        if (credorExistente) {
          throw new Error('Já existe um credor com este documento');
        }
      }

      // Limpar documento se fornecido
      const documentoLimpo = dados.documento?.replace(/\D/g, '') || undefined;

      const { data, error } = await (supabase as any)
        .from('credores')
        .update({
          nome: dados.nome,
          tipo: dados.tipo,
          documento: documentoLimpo,
          email: dados.email,
          telefone: dados.telefone,
          endereco: dados.endereco,
          cidade: dados.cidade,
          estado: dados.estado,
          cep: dados.cep,
          observacoes: dados.observacoes,
          ativo: dados.ativo
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      const credorAtualizado = supabaseToCredorPessoal(data);
      setCredores(prev => 
        prev.map(c => c.id === id ? credorAtualizado : c)
      );
      
      toast.success('Credor atualizado com sucesso!');
      return credorAtualizado;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar credor';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir credor
  const excluirCredor = async (id: number) => {
    if (!user?.id) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    
    try {
      // Verificar se há contas vinculadas
      const { data: contas } = await (supabase as any)
        .from('contas_pessoais')
        .select('id')
        .eq('credor_id', id)
        .eq('user_id', user.id)
        .limit(1);
      
      if (contas && contas.length > 0) {
        throw new Error('Não é possível excluir credor que possui contas vinculadas');
      }

      const { error } = await (supabase as any)
        .from('credores')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setCredores(prev => prev.filter(c => c.id !== id));
      
      toast.success('Credor excluído com sucesso!');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir credor';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar credores para seletor
  const buscarCredores = useCallback(async (termo?: string, tipo?: string) => {
    if (!user?.id) return [];
    
    try {
      let query = (supabase as any)
        .from('credores')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('nome');

      if (tipo) {
        query = query.eq('tipo', tipo);
      }
      
      if (termo) {
        query = query.or(`nome.ilike.%${termo}%,documento.ilike.%${termo}%`);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;
      
      return (data || []).map(supabaseToCredorPessoal);
    } catch (error) {
      console.error('Erro ao buscar credores:', error);
      return [];
    }
  }, [user?.id]);

  // Buscar credor por ID
  const buscarCredorPorId = useCallback(async (id: number) => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await (supabase as any)
        .from('credores')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      return supabaseToCredorPessoal(data);
    } catch (error) {
      console.error('Erro ao buscar credor:', error);
      return null;
    }
  }, [user?.id]);

  // Obter estatísticas
  const obterEstatisticas = useCallback(() => {
    const stats = {
      total: credores.length,
      ativos: credores.filter(c => c.ativo).length,
      inativos: credores.filter(c => !c.ativo).length,
      pessoaFisica: credores.filter(c => c.tipo === 'pessoa_fisica' && c.ativo).length,
      pessoaJuridica: credores.filter(c => c.tipo === 'pessoa_juridica' && c.ativo).length,
      valorTotalContas: credores.reduce((acc, c) => acc + (c.valor_total || 0), 0),
      totalContas: credores.reduce((acc, c) => acc + (c.total_contas || 0), 0)
    };

    return stats;
  }, [credores]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      carregarCredores();
    }
  }, [user?.id, carregarCredores]);

  return {
    credores,
    loading,
    error,
    carregarCredores,
    criarCredor,
    atualizarCredor,
    excluirCredor,
    buscarCredores,
    buscarCredorPorId,
    obterEstatisticas
  };
};