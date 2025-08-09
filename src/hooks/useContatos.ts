import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { toast } from '@/hooks/use-toast';

// Usando tipos do Supabase diretamente
import type { Database } from '@/integrations/supabase/types';

type Contato = Database['public']['Tables']['contacts']['Row'];
type ContatoInsert = Database['public']['Tables']['contacts']['Insert'];
type ContatoUpdate = Database['public']['Tables']['contacts']['Update'];

export interface UseContatosReturn {
  contatos: Contato[];
  credores: Contato[];
  pagadores: Contato[];
  loading: boolean;
  error: string | null;
  criarContato: (contato: Omit<ContatoInsert, 'user_id'>) => Promise<Contato>;
  atualizarContato: (id: string, contato: ContatoUpdate) => Promise<Contato | null>;
  excluirContato: (id: string) => Promise<void>;
  buscarPorDocumento: (documento: string) => Contato | null;
  recarregar: () => Promise<void>;
}

export function useContatos(): UseContatosReturn {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  // Separar contatos por tipo
  const credores = contatos.filter(contato => contato.type === 'supplier');
  const pagadores = contatos.filter(contato => contato.type === 'customer');

  const carregarContatos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar contatos com dados de categoria, filtrando apenas registros não excluídos
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          category:categories(
            id,
            name,
            color,
            type
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setContatos(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      const appError = handleError(error, 'useContatos.carregarContatos');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const validarDocumento = (documento: string, tipo: 'pessoa_fisica' | 'pessoa_juridica'): boolean => {
    // Remover caracteres especiais
    const docLimpo = documento.replace(/\D/g, '');
    
    if (tipo === 'pessoa_fisica') {
      // CPF deve ter 11 dígitos
      return docLimpo.length === 11;
    } else {
      // CNPJ deve ter 14 dígitos
      return docLimpo.length === 14;
    }
  };

  const criarContato = async (dadosContato: Omit<ContatoInsert, 'user_id'>): Promise<Contato> => {
    try {
      setLoading(true);
      
      // Verificar se documento já existe (se fornecido)
      if (dadosContato.document) {
        const documentoLimpo = dadosContato.document.replace(/\D/g, '');
        const existente = contatos.find(contato => 
          contato.document && contato.document.replace(/\D/g, '') === documentoLimpo
        );
        
        if (existente) {
          throw new Error('Já existe um contato com este documento');
        }
      }

      // Inserir contato no Supabase
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...dadosContato,
          user_id: user.id
        })
        .select(`
          *,
          category:categories(
            id,
            name,
            color,
            type
          )
        `)
        .single();
        
      if (error) throw error;
      
      setContatos(prev => [...prev, data]);
      toast({ title: 'Sucesso', description: 'Contato criado com sucesso!' });
      return data;
    } catch (error) {
      const appError = handleError(error, 'useContatos.criarContato');
      setError(appError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarContato = async (id: string, dadosAtualizacao: ContatoUpdate): Promise<Contato | null> => {
    try {
      setLoading(true);
      
      // Verificar se novo documento já existe (se documento estiver sendo alterado)
      if (dadosAtualizacao.document) {
        const documentoLimpo = dadosAtualizacao.document.replace(/\D/g, '');
        const existente = contatos.find(contato => 
          contato.id !== id &&
          contato.document && contato.document.replace(/\D/g, '') === documentoLimpo
        );
        
        if (existente) {
          throw new Error('Já existe um contato com este documento');
        }
      }

      // Atualizar contato no Supabase
      const { data, error } = await supabase
        .from('contacts')
        .update(dadosAtualizacao)
        .eq('id', id)
        .select(`
          *,
          category:categories(
            id,
            name,
            color,
            type
          )
        `)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setContatos(prev => 
          prev.map(contato => contato.id === id ? data : contato)
        );
        toast({ title: 'Sucesso', description: 'Contato atualizado com sucesso!' });
      }
      
      return data;
    } catch (error) {
      const appError = handleError(error, 'useContatos.atualizarContato');
      setError(appError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const excluirContato = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Soft delete - marcar como excluído
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
        
      if (error) throw error;
      
      setContatos(prev => prev.filter(contato => contato.id !== id));
      toast({ title: 'Sucesso', description: 'Contato excluído com sucesso!' });
    } catch (error) {
      const appError = handleError(error, 'useContatos.excluirContato');
      setError(appError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buscarPorDocumento = (documento: string): Contato | null => {
    const documentoLimpo = documento.replace(/\D/g, '');
    return contatos.find(contato => 
      contato.document && contato.document.replace(/\D/g, '') === documentoLimpo
    ) || null;
  };

  const recarregar = async (): Promise<void> => {
    await carregarContatos();
  };

  useEffect(() => {
    if (user) {
      carregarContatos();
    } else {
      setContatos([]);
    }
  }, [user]);

  return {
    contatos,
    credores,
    pagadores,
    loading,
    error,
    criarContato,
    atualizarContato,
    excluirContato,
    buscarPorDocumento,
    recarregar
  };
}