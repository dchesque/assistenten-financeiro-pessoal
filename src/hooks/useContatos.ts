import { useState, useEffect } from 'react';
import { dataService } from '@/services/DataServiceFactory';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { toast } from '@/hooks/use-toast';

// Tipos para contatos do Supabase
export interface Contato {
  id: string;
  name: string;
  type: string;
  document?: string;
  document_type?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  active: boolean;
  metadata: any;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
export interface UseContatosReturn {
  contatos: Contato[];
  credores: Contato[];
  pagadores: Contato[];
  loading: boolean;
  error: string | null;
  criarContato: (contato: Omit<Contato, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Contato>;
  atualizarContato: (id: string, contato: Partial<Contato>) => Promise<Contato | null>;
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
      const data = await dataService.fornecedores.getAll(); // Usando fornecedores como contatos por enquanto
      setContatos(data);
    } catch (error) {
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

  const criarContato = async (dadosContato: Omit<Contato, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Contato> => {
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

        // Validar documento (implementação básica)
        const tipoDocumento = documentoLimpo.length === 11 ? 'pessoa_fisica' : 'pessoa_juridica';
        if (!validarDocumento(dadosContato.document, tipoDocumento)) {
          throw new Error('Documento inválido');
        }
      }

      const novoContato = await dataService.fornecedores.create(dadosContato);
      setContatos(prev => [...prev, novoContato]);
      
      toast({ title: 'Sucesso', description: 'Contato criado com sucesso!' });
      return novoContato;
    } catch (error) {
      const appError = handleError(error, 'useContatos.criarContato');
      setError(appError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarContato = async (id: string, dadosAtualizacao: Partial<Contato>): Promise<Contato | null> => {
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

        // Validar novo documento
        const tipoDocumento = documentoLimpo.length === 11 ? 'pessoa_fisica' : 'pessoa_juridica';
        if (!validarDocumento(dadosAtualizacao.document, tipoDocumento)) {
          throw new Error('Documento inválido');
        }
      }

      const contatoAtualizado = await dataService.fornecedores.update(id, dadosAtualizacao);
      
      if (contatoAtualizado) {
        setContatos(prev => 
          prev.map(contato => contato.id === id ? contatoAtualizado : contato)
        );
        toast({ title: 'Sucesso', description: 'Contato atualizado com sucesso!' });
      }
      
      return contatoAtualizado;
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
      
      // Verificar se contato está sendo usado (implementar quando houver contas)
      // Por enquanto, permitir exclusão
      
      await dataService.fornecedores.delete(id);
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