import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Fornecedor, supabaseToFornecedor, fornecedorToSupabase } from '@/types/fornecedor';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface EstatisticasFornecedor {
  total: number;
  ativos: number;
  inativos: number;
  totalCompras: number;
  valorTotal: number;
}

interface UseFornecedoresSupabaseReturn {
  fornecedores: Fornecedor[];
  loading: boolean;
  error: string | null;
  estatisticas: EstatisticasFornecedor;
  criarFornecedor: (fornecedor: Omit<Fornecedor, 'id' | 'dataCadastro'>) => Promise<Fornecedor>;
  atualizarFornecedor: (id: number, fornecedor: Partial<Fornecedor>) => Promise<Fornecedor>;
  excluirFornecedor: (id: number) => Promise<void>;
  buscarFornecedores: (termo: string) => Fornecedor[];
  recarregar: () => Promise<void>;
}

export function useFornecedoresSupabase(): UseFornecedoresSupabaseReturn {
  const { user } = useAuth();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasFornecedor>({
    total: 0,
    ativos: 0,
    inativos: 0,
    totalCompras: 0,
    valorTotal: 0
  });


  // Listar todos os fornecedores
  const listarFornecedores = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');

      if (supabaseError) {
        throw supabaseError;
      }

      const fornecedoresConvertidos = data.map((item: any) => supabaseToFornecedor(item));
      setFornecedores(fornecedoresConvertidos);
      
      // Calcular estatísticas
      calcularEstatisticas(fornecedoresConvertidos);
    } catch (err: any) {
      console.error('Erro ao listar fornecedores:', err);
      setError(err.message || 'Erro ao carregar fornecedores');
      toast({
        title: "Erro",
        description: "Erro ao carregar fornecedores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const calcularEstatisticas = (fornecedoresList: Fornecedor[]) => {
    const novasEstatisticas: EstatisticasFornecedor = {
      total: fornecedoresList.length,
      ativos: fornecedoresList.filter(f => f.ativo).length,
      inativos: fornecedoresList.filter(f => !f.ativo).length,
      totalCompras: fornecedoresList.reduce((sum, f) => sum + (f.totalCompras || 0), 0),
      valorTotal: fornecedoresList.reduce((sum, f) => sum + (f.valorTotal || 0), 0)
    };
    setEstatisticas(novasEstatisticas);
  };

  // Criar fornecedor
  const criarFornecedor = async (novoFornecedor: Omit<Fornecedor, 'id' | 'dataCadastro'>): Promise<Fornecedor> => {
    try {
      const fornecedorCompleto = { ...novoFornecedor, id: 0, dataCadastro: '' } as Fornecedor;
      const dadosSupabase = fornecedorToSupabase(fornecedorCompleto);

      const { data, error: supabaseError } = await supabase
        .from('fornecedores')
        .insert([{
          ...dadosSupabase,
          user_id: user?.id
        }])
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const fornecedorCriado = supabaseToFornecedor(data as any);
      
      // Atualizar lista local
      setFornecedores(prev => [...prev, fornecedorCriado]);
      calcularEstatisticas([...fornecedores, fornecedorCriado]);

      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso!"
      });

      return fornecedorCriado;
    } catch (err: any) {
      console.error('Erro ao criar fornecedor:', err);
      const mensagem = err.message || 'Erro ao criar fornecedor';
      
      toast({
        title: "Erro",
        description: mensagem,
        variant: "destructive"
      });
      
      throw new Error(mensagem);
    }
  };

  // Atualizar fornecedor
  const atualizarFornecedor = async (id: number, dadosAtualizados: Partial<Fornecedor>): Promise<Fornecedor> => {
    try {
      const fornecedorCompleto = { ...dadosAtualizados, id: id, dataCadastro: '' } as Fornecedor;
      const dadosSupabase = fornecedorToSupabase(fornecedorCompleto);

      const { data, error: supabaseError } = await supabase
        .from('fornecedores')
        .update(dadosSupabase)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const fornecedorAtualizado = supabaseToFornecedor(data as any);
      
      // Atualizar lista local
      setFornecedores(prev => prev.map(f => f.id === id ? fornecedorAtualizado : f));
      calcularEstatisticas(fornecedores.map(f => f.id === id ? fornecedorAtualizado : f));

      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso!"
      });

      return fornecedorAtualizado;
    } catch (err: any) {
      console.error('Erro ao atualizar fornecedor:', err);
      const mensagem = err.message || 'Erro ao atualizar fornecedor';
      
      toast({
        title: "Erro",
        description: mensagem,
        variant: "destructive"
      });
      
      throw new Error(mensagem);
    }
  };

  // Excluir fornecedor
  const excluirFornecedor = async (id: number): Promise<void> => {
    try {
      // Verificar se há contas vinculadas
      const { count } = await supabase
        .from('contas_pagar')
        .select('*', { count: 'exact', head: true })
        .eq('fornecedor_id', id);

      if (count && count > 0) {
        throw new Error('Não é possível excluir um fornecedor que possui contas vinculadas');
      }

      const { error: supabaseError } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      // Atualizar lista local
      const novaLista = fornecedores.filter(f => f.id !== id);
      setFornecedores(novaLista);
      calcularEstatisticas(novaLista);

      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso!"
      });
    } catch (err: any) {
      console.error('Erro ao excluir fornecedor:', err);
      const mensagem = err.message || 'Erro ao excluir fornecedor';
      
      toast({
        title: "Erro",
        description: mensagem,
        variant: "destructive"
      });
      
      throw new Error(mensagem);
    }
  };

  // Buscar fornecedores por termo
  const buscarFornecedores = (termo: string): Fornecedor[] => {
    if (!termo.trim()) {
      return fornecedores.filter(f => f.ativo);
    }

    const termoBusca = termo.toLowerCase().trim();
    return fornecedores.filter(fornecedor => 
      fornecedor.ativo &&
      (fornecedor.nome.toLowerCase().includes(termoBusca) ||
       fornecedor.documento.includes(termoBusca) ||
       (fornecedor.nome_fantasia && fornecedor.nome_fantasia.toLowerCase().includes(termoBusca)) ||
       (fornecedor.email && fornecedor.email.toLowerCase().includes(termoBusca)))
    );
  };

  // Recarregar dados
  const recarregar = async () => {
    await listarFornecedores();
  };

  // Carregar dados iniciais
  useEffect(() => {
    listarFornecedores();
  }, []);

  return {
    fornecedores,
    loading,
    error,
    estatisticas,
    criarFornecedor,
    atualizarFornecedor,
    excluirFornecedor,
    buscarFornecedores,
    recarregar
  };
}