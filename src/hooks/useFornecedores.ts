import { useState, useEffect } from 'react';
import { Fornecedor, FornecedorSupabase, fornecedorToSupabase, supabaseToFornecedor } from '@/types/fornecedor';
import { supabase } from '@/integrations/supabase/client';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import { useAuth } from '@/hooks/useAuth';

export interface UseFornecedoresReturn {
  fornecedores: Fornecedor[];
  loading: boolean;
  error: string | null;
  criarFornecedor: (fornecedor: Omit<Fornecedor, 'id' | 'dataCadastro' | 'totalCompras' | 'valorTotal'>) => Promise<Fornecedor>;
  atualizarFornecedor: (id: number, fornecedor: Partial<Fornecedor>) => Promise<Fornecedor>;
  excluirFornecedor: (id: number) => Promise<void>;
  buscarPorDocumento: (documento: string, excludeId?: number) => Promise<Fornecedor | null>;
  atualizarEstatisticas: (fornecedorId: number) => Promise<void>;
  recarregar: () => Promise<void>;
}

export const useFornecedores = (): UseFornecedoresReturn => {
  const { user } = useAuth();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { invalidarAposCRUD } = useCacheInvalidation();

  // Carregar fornecedores
  const listarFornecedores = async (): Promise<Fornecedor[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      
      // Converter dados do Supabase para formato local usando a função de conversão
      const fornecedoresConvertidos = (data || []).map(item => supabaseToFornecedor(item as FornecedorSupabase));
      
      return fornecedoresConvertidos;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar fornecedores';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Criar fornecedor
  const criarFornecedor = async (fornecedor: Omit<Fornecedor, 'id' | 'dataCadastro' | 'totalCompras' | 'valorTotal'>): Promise<Fornecedor> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar documento único
      const documentoExistente = await buscarPorDocumento(fornecedor.documento);
      if (documentoExistente) {
        throw new Error('CPF/CNPJ já cadastrado no sistema');
      }
      
      // Criar fornecedor completo com valores padrão para converter
      const fornecedorCompleto: Fornecedor = {
        ...fornecedor,
        id: 0, // Será ignorado pelo banco
        dataCadastro: new Date().toISOString().split('T')[0],
        totalCompras: 0,
        valorTotal: 0
      };
      
      const dadosParaInserir = {
        ...fornecedorToSupabase(fornecedorCompleto),
        user_id: user?.id
      };
      
      const { data, error } = await supabase
        .from('fornecedores')
        .insert(dadosParaInserir)
        .select()
        .single();
      
      if (error) throw error;
      
      const novoFornecedor = supabaseToFornecedor(data as FornecedorSupabase);
      
      // Invalidar cache após criação
      invalidarAposCRUD('fornecedores', 'criar');
      
      await recarregar();
      return novoFornecedor;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar fornecedor';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar fornecedor
  const atualizarFornecedor = async (id: number, dadosAtualizacao: Partial<Fornecedor>): Promise<Fornecedor> => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar documento único se alterado
      if (dadosAtualizacao.documento) {
        const documentoExistente = await buscarPorDocumento(dadosAtualizacao.documento, id);
        if (documentoExistente) {
          throw new Error('CPF/CNPJ já cadastrado para outro fornecedor');
        }
      }
      
      // Converter apenas campos que existem nos dados de atualização
      const dadosParaAtualizar: Partial<FornecedorSupabase> = {};
      
      if (dadosAtualizacao.nome) dadosParaAtualizar.nome = dadosAtualizacao.nome;
      if (dadosAtualizacao.nome_fantasia) dadosParaAtualizar.nome_fantasia = dadosAtualizacao.nome_fantasia;
      if (dadosAtualizacao.tipo) dadosParaAtualizar.tipo = dadosAtualizacao.tipo;
      if (dadosAtualizacao.documento) dadosParaAtualizar.documento = dadosAtualizacao.documento;
      if (dadosAtualizacao.email) dadosParaAtualizar.email = dadosAtualizacao.email;
      if (dadosAtualizacao.telefone) dadosParaAtualizar.telefone = dadosAtualizacao.telefone;
      if (dadosAtualizacao.cep) dadosParaAtualizar.cep = dadosAtualizacao.cep;
      if (dadosAtualizacao.endereco) dadosParaAtualizar.logradouro = dadosAtualizacao.endereco;
      if (dadosAtualizacao.numero) dadosParaAtualizar.numero = dadosAtualizacao.numero;
      if (dadosAtualizacao.bairro) dadosParaAtualizar.bairro = dadosAtualizacao.bairro;
      if (dadosAtualizacao.cidade) dadosParaAtualizar.cidade = dadosAtualizacao.cidade;
      if (dadosAtualizacao.estado) dadosParaAtualizar.estado = dadosAtualizacao.estado;
      if (dadosAtualizacao.categoria_padrao_id) dadosParaAtualizar.categoria_padrao_id = dadosAtualizacao.categoria_padrao_id;
      if (dadosAtualizacao.tipo_fornecedor) dadosParaAtualizar.tipo_fornecedor = dadosAtualizacao.tipo_fornecedor;
      if (dadosAtualizacao.observacoes) dadosParaAtualizar.observacoes = dadosAtualizacao.observacoes;
      if (dadosAtualizacao.ativo !== undefined) dadosParaAtualizar.ativo = dadosAtualizacao.ativo;
      
      const { data, error } = await supabase
        .from('fornecedores')
        .update({
          ...dadosParaAtualizar,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const fornecedorAtualizado = supabaseToFornecedor(data as FornecedorSupabase);
      
      // Invalidar cache após atualização
      invalidarAposCRUD('fornecedores', 'atualizar');
      
      await recarregar();
      return fornecedorAtualizado;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar fornecedor';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Excluir fornecedor
  const excluirFornecedor = async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se tem contas vinculadas antes de excluir
      const { data: contas } = await supabase
        .from('contas_pagar')
        .select('id')
        .eq('fornecedor_id', id)
        .limit(1);
      
      if (contas && contas.length > 0) {
        throw new Error('Não é possível excluir fornecedor com contas vinculadas');
      }
      
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalidar cache após exclusão
      invalidarAposCRUD('fornecedores', 'excluir');
      
      await recarregar();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir fornecedor';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Buscar por documento
  const buscarPorDocumento = async (documento: string, excludeId?: number): Promise<Fornecedor | null> => {
    try {
      let query = supabase
        .from('fornecedores')
        .select('*')
        .eq('documento', documento);
      
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return supabaseToFornecedor(data as FornecedorSupabase);
    } catch (err) {
      console.error('Erro ao buscar por documento:', err);
      return null;
    }
  };

  // Atualizar estatísticas
  const atualizarEstatisticas = async (fornecedorId: number): Promise<void> => {
    try {
      // Usar a função do Supabase para atualizar estatísticas
      const { error } = await supabase.rpc('atualizar_estatisticas_fornecedor', {
        p_fornecedor_id: fornecedorId
      });
      
      if (error) {
        console.error('Erro ao atualizar estatísticas no Supabase:', error);
        throw error;
      }
      
      // Recarregar dados para refletir as mudanças
      await recarregar();
    } catch (err) {
      console.error('Erro ao atualizar estatísticas:', err);
      throw err;
    }
  };

  // Recarregar dados
  const recarregar = async (): Promise<void> => {
    const dados = await listarFornecedores();
    setFornecedores(dados);
  };

  // Carregar dados iniciais
  useEffect(() => {
    listarFornecedores().then(setFornecedores).catch(console.error);
  }, []);

  return {
    fornecedores,
    loading,
    error,
    criarFornecedor,
    atualizarFornecedor,
    excluirFornecedor,
    buscarPorDocumento,
    atualizarEstatisticas,
    recarregar
  };
};