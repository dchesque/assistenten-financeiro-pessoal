import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Vendedor, 
  NovoVendedor, 
  FiltrosVendedor, 
  ResumoVendedores 
} from '@/types/vendedor';

interface UseVendedoresOptimizadoReturn {
  vendedores: Vendedor[];
  vendedoresFiltrados: Vendedor[];
  loading: boolean;
  erro: string | null;
  resumos: ResumoVendedores;
  filtros: FiltrosVendedor;
  setFiltros: (filtros: FiltrosVendedor) => void;
  criarVendedor: (vendedor: NovoVendedor) => Promise<boolean>;
  atualizarVendedor: (id: number, vendedor: Partial<Vendedor>) => Promise<boolean>;
  excluirVendedor: (id: number) => Promise<boolean>;
  toggleStatus: (id: number) => Promise<boolean>;
  gerarProximoCodigo: () => Promise<string>;
  recarregar: () => Promise<void>;
  limparCache: () => void;
}

// Cache simples para dados de vendedores
const cacheVendedores = new Map<string, { data: Vendedor[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useVendedoresOptimizado = (): UseVendedoresOptimizadoReturn => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { toast } = useToast();

  const [filtros, setFiltros] = useState<FiltrosVendedor>({
    busca: '',
    status: 'todos',
    nivel_acesso: 'todos',
    departamento: '',
    data_admissao_inicio: '',
    data_admissao_fim: ''
  });

  // Função para verificar cache
  const obterDoCache = useCallback((userId: string): Vendedor[] | null => {
    const cached = cacheVendedores.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  // Função para salvar no cache
  const salvarNoCache = useCallback((userId: string, data: Vendedor[]) => {
    cacheVendedores.set(userId, { data, timestamp: Date.now() });
  }, []);

  // Limpar cache
  const limparCache = useCallback(() => {
    cacheVendedores.clear();
  }, []);

  // Buscar vendedores com cache otimizado
  const buscarVendedores = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setErro(null);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar cache primeiro (se não forçar refresh)
      if (!forceRefresh) {
        const cachedData = obterDoCache(userData.user.id);
        if (cachedData) {
          setVendedores(cachedData);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('nome');

      if (error) throw error;
      
      // Validar e filtrar dados
      const vendedoresValidos = (data || []).filter(vendedor => 
        vendedor.nome && 
        vendedor.codigo_vendedor &&
        vendedor.id
      ) as Vendedor[];
      
      // Salvar no cache
      salvarNoCache(userData.user.id, vendedoresValidos);
      setVendedores(vendedoresValidos);
    } catch (error: any) {
      console.error('Erro ao buscar vendedores:', error);
      const mensagemErro = error.message === 'Usuário não autenticado' 
        ? 'Sessão expirada. Faça login novamente.'
        : 'Erro ao carregar vendedores. Tente novamente.';
      
      setErro(mensagemErro);
      toast({
        title: "Erro ao carregar vendedores",
        description: mensagemErro,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast, obterDoCache, salvarNoCache]);

  // Criar vendedor com invalidação de cache
  const criarVendedor = useCallback(async (vendedor: NovoVendedor): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('vendedores')
        .insert([{
          ...vendedor,
          user_id: userData.user.id
        }]);

      if (error) throw error;

      toast({
        title: "Vendedor criado com sucesso",
        description: `${vendedor.nome} foi adicionado à equipe.`,
      });

      // Invalidar cache e recarregar
      limparCache();
      await buscarVendedores(true);
      return true;
    } catch (error: any) {
      console.error('Erro ao criar vendedor:', error);
      toast({
        title: "Erro ao criar vendedor",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast, buscarVendedores, limparCache]);

  // Atualizar vendedor com invalidação de cache
  const atualizarVendedor = useCallback(async (id: number, vendedor: Partial<Vendedor>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('vendedores')
        .update(vendedor)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Vendedor atualizado",
        description: "As informações foram salvas com sucesso.",
      });

      // Invalidar cache e recarregar
      limparCache();
      await buscarVendedores(true);
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar vendedor:', error);
      toast({
        title: "Erro ao atualizar vendedor",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast, buscarVendedores, limparCache]);

  // Excluir vendedor com validação robusta
  const excluirVendedor = useCallback(async (id: number): Promise<boolean> => {
    try {
      // Verificar se há vendas vinculadas
      const { data: vendas, error: vendaError } = await supabase
        .from('vendas')
        .select('id')
        .eq('vendedor_id', id)
        .limit(1);

      if (vendaError) throw vendaError;

      if (vendas && vendas.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este vendedor possui vendas vinculadas. Desative-o ao invés de excluir.",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('vendedores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Vendedor excluído",
        description: "O vendedor foi removido da equipe.",
      });

      // Invalidar cache e recarregar
      limparCache();
      await buscarVendedores(true);
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir vendedor:', error);
      toast({
        title: "Erro ao excluir vendedor",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  }, [toast, buscarVendedores, limparCache]);

  // Toggle status otimizado
  const toggleStatus = useCallback(async (id: number): Promise<boolean> => {
    try {
      const vendedor = vendedores.find(v => v.id === id);
      if (!vendedor) return false;

      const novoStatus = vendedor.status === 'ativo' ? 'inativo' : 'ativo';

      const { error } = await supabase
        .from('vendedores')
        .update({ 
          status: novoStatus,
          ativo: novoStatus === 'ativo'
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: `Vendedor ${novoStatus === 'ativo' ? 'ativado' : 'desativado'}`,
        description: `${vendedor.nome} está agora ${novoStatus}.`,
      });

      // Atualizar estado local para resposta rápida
      setVendedores(prev => prev.map(v => 
        v.id === id 
          ? { ...v, status: novoStatus, ativo: novoStatus === 'ativo' }
          : v
      ));

      // Invalidar cache
      limparCache();
      return true;
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  }, [vendedores, toast, limparCache]);

  // Gerar próximo código otimizado
  const gerarProximoCodigo = useCallback(async (): Promise<string> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase.rpc('gerar_proximo_codigo_vendedor', {
        p_user_id: userData.user.id
      });
      
      if (error) throw error;
      return data || 'V001';
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      toast({
        title: "Erro ao gerar código",
        description: "Não foi possível gerar o próximo código do vendedor",
        variant: "destructive"
      });
      // Fallback: gerar código baseado no timestamp
      return `V${String(Date.now() % 1000).padStart(3, '0')}`;
    }
  }, [toast]);

  // Recarregar dados
  const recarregar = useCallback(async () => {
    await buscarVendedores(true);
  }, [buscarVendedores]);

  // Filtros otimizados com memoização
  const vendedoresFiltrados = useMemo(() => {
    const filtrarVendedores = (vendedores: Vendedor[]) => {
      return vendedores.filter(vendedor => {
        // Filtro de busca otimizado
        const termoBusca = filtros.busca.toLowerCase().trim();
        const matchBusca = !termoBusca || 
          vendedor.nome.toLowerCase().includes(termoBusca) ||
          vendedor.codigo_vendedor.toLowerCase().includes(termoBusca) ||
          vendedor.documento.includes(filtros.busca) ||
          vendedor.email?.toLowerCase().includes(termoBusca) ||
          vendedor.telefone?.includes(filtros.busca) ||
          vendedor.whatsapp?.includes(filtros.busca);

        // Outros filtros
        const matchStatus = filtros.status === 'todos' || vendedor.status === filtros.status;
        const matchNivel = filtros.nivel_acesso === 'todos' || vendedor.nivel_acesso === filtros.nivel_acesso;
        const matchDepartamento = !filtros.departamento || 
          vendedor.departamento?.toLowerCase().includes(filtros.departamento.toLowerCase());

        // Filtros de data
        const matchDataInicio = !filtros.data_admissao_inicio || 
          new Date(vendedor.data_admissao) >= new Date(filtros.data_admissao_inicio);
        const matchDataFim = !filtros.data_admissao_fim || 
          new Date(vendedor.data_admissao) <= new Date(filtros.data_admissao_fim);

        return matchBusca && matchStatus && matchNivel && matchDepartamento && matchDataInicio && matchDataFim;
      });
    };

    return filtrarVendedores(vendedores);
  }, [vendedores, filtros]);

  // Resumos otimizados
  const resumos = useMemo(() => {
    const calcularResumos = (vendedores: Vendedor[]): ResumoVendedores => {
      const vendedoresAtivos = vendedores.filter(v => v.status === 'ativo');
      const vendedoresInativos = vendedores.filter(v => v.status === 'inativo');
      
      const totalVendido = vendedores.reduce((acc, v) => acc + (v.valor_total_vendido || 0), 0);
      const totalComissoes = vendedores.reduce((acc, v) => acc + (v.comissao_total_recebida || 0), 0);
      
      const ticketMedio = vendedores.length > 0 ? 
        vendedores.reduce((acc, v) => acc + (v.ticket_medio || 0), 0) / vendedores.length : 0;

      // Melhor vendedor otimizado
      const melhorVendedor = vendedores.reduce((melhor, atual) => {
        return (atual.valor_total_vendido || 0) > (melhor?.valor_total_vendido || 0) ? atual : melhor;
      }, null as Vendedor | null);

      return {
        total_vendedores: vendedores.length,
        vendedores_ativos: vendedoresAtivos.length,
        total_vendido: totalVendido,
        total_comissoes: totalComissoes,
        ticket_medio_geral: ticketMedio,
        melhor_vendedor: melhorVendedor?.nome || 'N/A'
      };
    };

    return calcularResumos(vendedores);
  }, [vendedores]);

  useEffect(() => {
    buscarVendedores();
  }, [buscarVendedores]);

  return {
    vendedores,
    vendedoresFiltrados,
    loading,
    erro,
    resumos,
    filtros,
    setFiltros,
    criarVendedor,
    atualizarVendedor,
    excluirVendedor,
    toggleStatus,
    gerarProximoCodigo,
    recarregar,
    limparCache
  };
};