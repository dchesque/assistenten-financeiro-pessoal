import { useState, useEffect } from 'react';
import { mockDataService, type Contato } from '@/services/mockDataService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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

  // Separar contatos por tipo
  const credores = contatos.filter(contato => contato.tipo === 'credor');
  const pagadores = contatos.filter(contato => contato.tipo === 'pagador');

  const carregarContatos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await mockDataService.getContatos();
      setContatos(data);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      setError('Erro ao carregar contatos');
      toast.error('Erro ao carregar contatos');
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
      
      // Verificar se documento já existe
      const documentoLimpo = dadosContato.documento.replace(/\D/g, '');
      const existente = contatos.find(contato => 
        contato.documento.replace(/\D/g, '') === documentoLimpo
      );
      
      if (existente) {
        throw new Error('Já existe um contato com este documento');
      }

      // Validar documento (implementação básica)
      const tipoDocumento = documentoLimpo.length === 11 ? 'pessoa_fisica' : 'pessoa_juridica';
      if (!validarDocumento(dadosContato.documento, tipoDocumento)) {
        throw new Error('Documento inválido');
      }

      const novoContato = await mockDataService.createContato(dadosContato);
      setContatos(prev => [...prev, novoContato]);
      
      const tipoContato = dadosContato.tipo === 'credor' ? 'credor' : 'pagador';
      toast.success(`${tipoContato === 'credor' ? 'Credor' : 'Pagador'} criado com sucesso!`);
      return novoContato;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar contato';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarContato = async (id: string, dadosAtualizacao: Partial<Contato>): Promise<Contato | null> => {
    try {
      setLoading(true);
      
      // Verificar se novo documento já existe (se documento estiver sendo alterado)
      if (dadosAtualizacao.documento) {
        const documentoLimpo = dadosAtualizacao.documento.replace(/\D/g, '');
        const existente = contatos.find(contato => 
          contato.id !== id &&
          contato.documento.replace(/\D/g, '') === documentoLimpo
        );
        
        if (existente) {
          throw new Error('Já existe um contato com este documento');
        }

        // Validar novo documento
        const tipoDocumento = documentoLimpo.length === 11 ? 'pessoa_fisica' : 'pessoa_juridica';
        if (!validarDocumento(dadosAtualizacao.documento, tipoDocumento)) {
          throw new Error('Documento inválido');
        }
      }

      const contatoAtualizado = await mockDataService.updateContato(id, dadosAtualizacao);
      
      if (contatoAtualizado) {
        setContatos(prev => 
          prev.map(contato => contato.id === id ? contatoAtualizado : contato)
        );
        toast.success('Contato atualizado com sucesso!');
      }
      
      return contatoAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar contato';
      setError(errorMessage);
      toast.error(errorMessage);
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
      
      const sucesso = await mockDataService.deleteContato(id);
      
      if (sucesso) {
        setContatos(prev => prev.filter(contato => contato.id !== id));
        toast.success('Contato excluído com sucesso!');
      } else {
        throw new Error('Contato não encontrado');
      }
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir contato';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buscarPorDocumento = (documento: string): Contato | null => {
    const documentoLimpo = documento.replace(/\D/g, '');
    return contatos.find(contato => 
      contato.documento.replace(/\D/g, '') === documentoLimpo
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