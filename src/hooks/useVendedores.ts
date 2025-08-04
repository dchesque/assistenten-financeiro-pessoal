import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Vendedor, 
  NovoVendedor, 
  FiltrosVendedor, 
  ResumoVendedores 
} from '@/types/vendedor';

interface UseVendedoresReturn {
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
}

export const useVendedores = (): UseVendedoresReturn => {
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

  // Debounce para filtros de busca (otimização de performance)
  const buscaDebounced = useDebounce(filtros.busca, 300);
  const departamentoDebounced = useDebounce(filtros.departamento, 300);

  // Cache simples para evitar recálculos desnecessários
  const [cacheBusca, setCacheBusca] = useState<Map<string, Vendedor[]>>(new Map());

  // Buscar vendedores com select otimizado
  const buscarVendedores = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('nome');

      if (error) throw error;
      
      // Validar dados antes de salvar no estado
      const vendedoresValidos = (data || []).filter(vendedor => 
        vendedor.nome && vendedor.codigo_vendedor
      );
      
      setVendedores(vendedoresValidos as Vendedor[]);
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
  }, [toast]);

  // Criar vendedor
  const criarVendedor = async (vendedor: NovoVendedor): Promise<boolean> => {
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

      await buscarVendedores();
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
  };

  // Atualizar vendedor
  const atualizarVendedor = async (id: number, vendedor: Partial<Vendedor>): Promise<boolean> => {
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

      await buscarVendedores();
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
  };

  // Excluir vendedor
  const excluirVendedor = async (id: number): Promise<boolean> => {
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

      await buscarVendedores();
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
  };

  // Toggle status
  const toggleStatus = async (id: number): Promise<boolean> => {
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

      await buscarVendedores();
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
  };

  // Gerar próximo código
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
      // Retornar um código padrão como fallback
      return `V${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    }
  }, [toast]);

  // Recarregar dados
  const recarregar = async () => {
    await buscarVendedores();
  };

  // Filtros otimizados com debounce
  const vendedoresFiltrados = useMemo(() => {
    console.log('🔍 [DEBUG] Iniciando filtros...');
    console.log('🔍 [DEBUG] vendedores array:', vendedores);
    console.log('🔍 [DEBUG] filtros:', filtros);
    console.log('🔍 [DEBUG] buscaDebounced:', buscaDebounced);
    console.log('🔍 [DEBUG] departamentoDebounced:', departamentoDebounced);
    
    const resultado = vendedores.filter(vendedor => {
      console.log('🔍 [DEBUG] Verificando vendedor:', vendedor.nome, vendedor);
      
      // Filtro de busca com debounce (nome, código, email, telefone, documento)
      const matchBusca = !buscaDebounced || 
        vendedor.nome?.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
        vendedor.codigo_vendedor?.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
        vendedor.documento?.includes(buscaDebounced) ||
        (vendedor.email && vendedor.email.toLowerCase().includes(buscaDebounced.toLowerCase())) ||
        (vendedor.telefone && vendedor.telefone.includes(buscaDebounced)) ||
        (vendedor.whatsapp && vendedor.whatsapp.includes(buscaDebounced));

      console.log('🔍 [DEBUG] matchBusca:', matchBusca);

      // Filtro de status
      const matchStatus = filtros.status === 'todos' || vendedor.status === filtros.status;
      console.log('🔍 [DEBUG] matchStatus:', matchStatus, 'filtros.status:', filtros.status, 'vendedor.status:', vendedor.status);

      // Filtro de nível de acesso
      const matchNivel = filtros.nivel_acesso === 'todos' || vendedor.nivel_acesso === filtros.nivel_acesso;
      console.log('🔍 [DEBUG] matchNivel:', matchNivel, 'filtros.nivel_acesso:', filtros.nivel_acesso, 'vendedor.nivel_acesso:', vendedor.nivel_acesso);

      // Filtro de departamento com debounce
      const matchDepartamento = !departamentoDebounced || 
        vendedor.departamento?.toLowerCase().includes(departamentoDebounced.toLowerCase());
      console.log('🔍 [DEBUG] matchDepartamento:', matchDepartamento);

      // Filtro de data de admissão
      const matchDataInicio = !filtros.data_admissao_inicio || 
        new Date(vendedor.data_admissao) >= new Date(filtros.data_admissao_inicio);
      
      const matchDataFim = !filtros.data_admissao_fim || 
        new Date(vendedor.data_admissao) <= new Date(filtros.data_admissao_fim);

      console.log('🔍 [DEBUG] matchDataInicio:', matchDataInicio, 'matchDataFim:', matchDataFim);

      const passouFiltro = matchBusca && matchStatus && matchNivel && matchDepartamento && matchDataInicio && matchDataFim;
      console.log('🔍 [DEBUG] Vendedor passou no filtro?', passouFiltro);
      
      return passouFiltro;
    });

    console.log('🔍 [DEBUG] Resultado final dos filtros:', resultado);
    return resultado;
  }, [vendedores, buscaDebounced, departamentoDebounced, filtros.status, filtros.nivel_acesso, filtros.data_admissao_inicio, filtros.data_admissao_fim]);

  // Resumos calculados corretamente
  const resumos = useMemo(() => {
    const vendedoresAtivos = vendedores.filter(v => v.status === 'ativo');
    const vendedoresInativos = vendedores.filter(v => v.status === 'inativo');
    
    const totalVendido = vendedores.reduce((acc, v) => acc + (v.valor_total_vendido || 0), 0);
    const totalComissoes = vendedores.reduce((acc, v) => acc + (v.comissao_total_recebida || 0), 0);
    
    const ticketMedio = vendedores.length > 0 ? 
      vendedores.reduce((acc, v) => acc + (v.ticket_medio || 0), 0) / vendedores.length : 0;

    // Melhor vendedor (maior valor vendido)
    const melhorVendedor = vendedores.length > 0 ? 
      vendedores.reduce((melhor, atual) => {
        return (atual.valor_total_vendido || 0) > (melhor.valor_total_vendido || 0) ? atual : melhor;
      }, vendedores[0]) : null;

    return {
      total_vendedores: vendedores.length,
      vendedores_ativos: vendedoresAtivos.length,
      vendedores_inativos: vendedoresInativos.length,
      total_vendido: totalVendido,
      total_comissoes: totalComissoes,
      ticket_medio_geral: ticketMedio,
      melhor_vendedor: melhorVendedor?.nome || 'N/A',
      melhor_vendedor_valor: melhorVendedor?.valor_total_vendido || 0
    };
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
    recarregar
  };
};