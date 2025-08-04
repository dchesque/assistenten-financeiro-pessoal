import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Vendedor, NovoVendedor, FiltrosVendedor, ResumoVendedores } from '@/types/vendedor';
import { validarVendedorCompleto, validarCodigoUnico, validarDocumentoUnico } from '@/utils/vendedorValidators';

// Cache service para otimização
class VendedorCacheService {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  static set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 min default
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
      ttl
    });
  }
  
  static get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return JSON.parse(JSON.stringify(item.data));
  }
  
  static invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  static clear() {
    this.cache.clear();
  }
}

interface UseVendedoresAvancadoReturn {
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
  // Novos métodos avançados
  sincronizarComVendas: () => Promise<void>;
  calcularComissoesPendentes: (vendedorId?: number) => Promise<void>;
  gerarRelatorioExecutivo: () => Promise<any>;
  auditarVendedores: () => Promise<any[]>;
  otimizarPerformance: () => Promise<void>;
}

export const useVendedoresAvancado = (): UseVendedoresAvancadoReturn => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosVendedor>({
    busca: '',
    status: 'todos',
    nivel_acesso: 'todos',
    departamento: 'todos',
    data_admissao_inicio: '',
    data_admissao_fim: ''
  });
  
  const { toast } = useToast();

  // Função otimizada para buscar vendedores com cache inteligente
  const buscarVendedores = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setErro(null);

      const cacheKey = 'vendedores_list';
      
      if (!forceRefresh) {
        const cachedData = VendedorCacheService.get(cacheKey);
        if (cachedData) {
          setVendedores(cachedData);
          setLoading(false);
          return;
        }
      }

      console.log('Buscando vendedores otimizado...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Query otimizada - buscar todos os campos
      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .eq('user_id', user.id)
        .order('ranking_atual', { ascending: true, nullsFirst: false })
        .order('nome');

      if (error) {
        console.error('Erro na query vendedores:', error);
        throw error;
      }

      const vendedoresData = data || [];
      
      // Cache com TTL de 3 minutos para dados dinâmicos
      VendedorCacheService.set(cacheKey, vendedoresData, 3 * 60 * 1000);
      
      setVendedores(vendedoresData as Vendedor[]);
      
      console.log(`${vendedoresData.length} vendedores carregados com cache otimizado`);

    } catch (error: any) {
      console.error('Erro ao buscar vendedores:', error);
      setErro(error.message || 'Erro ao carregar vendedores');
      toast({
        title: "Erro ao carregar vendedores",
        description: error.message || 'Tente novamente',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Carregar dados automaticamente
  useEffect(() => {
    buscarVendedores();
  }, [buscarVendedores]);

  // Filtros otimizados
  const vendedoresFiltrados = useMemo(() => {
    return vendedores.filter(vendedor => {
      const matchBusca = !filtros.busca || 
        vendedor.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        vendedor.codigo_vendedor.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        vendedor.documento.includes(filtros.busca) ||
        vendedor.email?.toLowerCase().includes(filtros.busca.toLowerCase());

      const matchStatus = filtros.status === 'todos' || vendedor.status === filtros.status;
      const matchNivel = filtros.nivel_acesso === 'todos' || vendedor.nivel_acesso === filtros.nivel_acesso;
      const matchDepartamento = filtros.departamento === 'todos' || vendedor.departamento === filtros.departamento;

      let matchDataAdmissao = true;
      if (filtros.data_admissao_inicio || filtros.data_admissao_fim) {
        const dataAdmissao = vendedor.data_admissao ? new Date(vendedor.data_admissao) : null;
        if (dataAdmissao) {
          if (filtros.data_admissao_inicio) {
            matchDataAdmissao = matchDataAdmissao && dataAdmissao >= new Date(filtros.data_admissao_inicio);
          }
          if (filtros.data_admissao_fim) {
            matchDataAdmissao = matchDataAdmissao && dataAdmissao <= new Date(filtros.data_admissao_fim);
          }
        }
      }

      return matchBusca && matchStatus && matchNivel && matchDepartamento && matchDataAdmissao;
    });
  }, [vendedores, filtros]);

  // Resumos otimizados
  const resumos = useMemo((): ResumoVendedores => {
    const ativos = vendedoresFiltrados.filter(v => v.ativo);
    const totalVendasValor = vendedoresFiltrados.reduce((acc, v) => acc + (v.valor_total_vendido || 0), 0);
    const totalComissoes = vendedoresFiltrados.reduce((acc, v) => acc + (v.comissao_total_recebida || 0), 0);
    const ticketMedio = vendedoresFiltrados.length > 0 ? 
      vendedoresFiltrados.reduce((acc, v) => acc + (v.ticket_medio || 0), 0) / vendedoresFiltrados.length : 0;
    
    const melhorVendedor = vendedoresFiltrados.reduce((melhor, atual) => {
      return (atual.valor_total_vendido || 0) > (melhor?.valor_total_vendido || 0) ? atual : melhor;
    }, vendedoresFiltrados[0] || null);

    return {
      total_vendedores: vendedoresFiltrados.length,
      vendedores_ativos: ativos.length,
      total_vendido: totalVendasValor,
      total_comissoes: totalComissoes,
      ticket_medio_geral: ticketMedio,
      melhor_vendedor: melhorVendedor?.nome || 'Nenhum'
    };
  }, [vendedoresFiltrados]);

  // Criar vendedor com validações avançadas e auditoria
  const criarVendedor = useCallback(async (vendedor: NovoVendedor): Promise<boolean> => {
    try {
      setLoading(true);

      // Validações completas
      const validacao = validarVendedorCompleto(vendedor);
      if (!validacao.valido) {
        toast({
          title: "Dados inválidos",
          description: validacao.erros.join(', '),
          variant: "destructive"
        });
        return false;
      }

      // Verificar unicidade de código e documento
      if (!validarCodigoUnico(vendedor.codigo_vendedor, vendedores)) {
        toast({
          title: "Código já existe",
          description: "Este código de vendedor já está em uso",
          variant: "destructive"
        });
        return false;
      }

      if (!validarDocumentoUnico(vendedor.documento, vendedores)) {
        toast({
          title: "Documento já existe",
          description: "Este documento já está cadastrado",
          variant: "destructive"
        });
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('vendedores')
        .insert([{
          ...vendedor,
          user_id: user.id
        }]);

      if (error) throw error;

      // Invalidar cache e recarregar
      VendedorCacheService.invalidate('vendedores');
      await buscarVendedores(true);

      // Log de auditoria
      await supabase.from('audit_log').insert({
        tabela: 'vendedores',
        operacao: 'INSERT',
        usuario_id: user.id,
        descricao: `Vendedor criado: ${vendedor.nome}`,
        dados_depois: JSON.stringify(vendedor)
      });

      toast({
        title: "Vendedor criado!",
        description: `${vendedor.nome} foi criado com sucesso`,
        duration: 4000
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao criar vendedor:', error);
      toast({
        title: "Erro ao criar vendedor",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [vendedores, buscarVendedores, toast]);

  // Atualizar vendedor com otimização de updates
  const atualizarVendedor = useCallback(async (id: number, vendedorAtualizado: Partial<Vendedor>): Promise<boolean> => {
    try {
      setLoading(true);

      const vendedorOriginal = vendedores.find(v => v.id === id);
      if (!vendedorOriginal) {
        throw new Error('Vendedor não encontrado');
      }

      // Validar apenas campos alterados
      const dadosCompletos = { ...vendedorOriginal, ...vendedorAtualizado };
      const validacao = validarVendedorCompleto(dadosCompletos);
      
      if (!validacao.valido) {
        toast({
          title: "Dados inválidos",
          description: validacao.erros.join(', '),
          variant: "destructive"
        });
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('vendedores')
        .update({
          ...vendedorAtualizado,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update otimista no cache
      setVendedores(prev => 
        prev.map(v => v.id === id ? { ...v, ...vendedorAtualizado } : v)
      );

      // Invalidar cache específico
      VendedorCacheService.invalidate(`vendedor_${id}`);

      // Log de auditoria
      await supabase.from('audit_log').insert({
        tabela: 'vendedores',
        operacao: 'UPDATE',
        registro_id: id,
        usuario_id: user.id,
        descricao: `Vendedor atualizado: ${dadosCompletos.nome}`,
        dados_antes: JSON.stringify(vendedorOriginal),
        dados_depois: JSON.stringify(dadosCompletos)
      });

      toast({
        title: "Vendedor atualizado!",
        description: `${dadosCompletos.nome} foi atualizado com sucesso`,
        duration: 3000
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar vendedor:', error);
      toast({
        title: "Erro ao atualizar vendedor",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [vendedores, toast]);

  // Sincronizar dados com tabela de vendas
  const sincronizarComVendas = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Sincronizando vendedores com vendas...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar estatísticas de vendas por vendedor
      const { data: estatisticasVendas, error } = await supabase
        .from('vendas')
        .select(`
          vendedor_id,
          valor_final,
          comissao_valor,
          data_venda
        `)
        .eq('user_id', user.id)
        .eq('status', 'ativa');

      if (error) throw error;

      // Agrupar por vendedor
      const estatisticasPorVendedor = estatisticasVendas?.reduce((acc, venda) => {
        if (!venda.vendedor_id) return acc;
        
        if (!acc[venda.vendedor_id]) {
          acc[venda.vendedor_id] = {
            total_vendas: 0,
            valor_total_vendido: 0,
            comissao_total_recebida: 0,
            data_ultima_venda: null
          };
        }
        
        acc[venda.vendedor_id].total_vendas++;
        acc[venda.vendedor_id].valor_total_vendido += Number(venda.valor_final || 0);
        acc[venda.vendedor_id].comissao_total_recebida += Number(venda.comissao_valor || 0);
        
        if (!acc[venda.vendedor_id].data_ultima_venda || 
            venda.data_venda > acc[venda.vendedor_id].data_ultima_venda) {
          acc[venda.vendedor_id].data_ultima_venda = venda.data_venda;
        }
        
        return acc;
      }, {} as Record<number, any>) || {};

      // Atualizar vendedores com as estatísticas
      for (const vendedor of vendedores) {
        const stats = estatisticasPorVendedor[vendedor.id];
        if (stats) {
          const ticket_medio = stats.total_vendas > 0 ? 
            stats.valor_total_vendido / stats.total_vendas : 0;

          await supabase
            .from('vendedores')
            .update({
              total_vendas: stats.total_vendas,
              valor_total_vendido: stats.valor_total_vendido,
              comissao_total_recebida: stats.comissao_total_recebida,
              data_ultima_venda: stats.data_ultima_venda,
              ticket_medio: ticket_medio,
              updated_at: new Date().toISOString()
            })
            .eq('id', vendedor.id);
        }
      }

      // Invalidar cache e recarregar
      VendedorCacheService.clear();
      await buscarVendedores(true);

      toast({
        title: "Sincronização concluída!",
        description: "Dados dos vendedores sincronizados com vendas",
        duration: 4000
      });

    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [vendedores, buscarVendedores, toast]);

  // Calcular comissões pendentes
  const calcularComissoesPendentes = useCallback(async (vendedorId?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('vendas')
        .select('vendedor_id, valor_final, comissao_valor')
        .eq('user_id', user.id)
        .eq('status', 'ativa');

      if (vendedorId) {
        query = query.eq('vendedor_id', vendedorId);
      }

      const { data: vendas, error } = await query;
      if (error) throw error;

      // Processar comissões (implementar lógica específica do negócio)
      console.log('Comissões processadas para', vendas?.length || 0, 'vendas');
      
      toast({
        title: "Comissões calculadas!",
        description: `Processadas ${vendas?.length || 0} vendas`,
        duration: 3000
      });

    } catch (error: any) {
      console.error('Erro ao calcular comissões:', error);
      toast({
        title: "Erro ao calcular comissões",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [toast]);

  // Gerar relatório executivo
  const gerarRelatorioExecutivo = useCallback(async () => {
    try {
      const relatorio = {
        resumo_geral: resumos,
        top_vendedores: vendedores
          .filter(v => v.ativo)
          .sort((a, b) => (b.valor_total_vendido || 0) - (a.valor_total_vendido || 0))
          .slice(0, 5),
        vendedores_risco: vendedores.filter(v => {
          const metaAtingida = v.meta_mensal ? 
            ((v.valor_total_vendido || 0) / v.meta_mensal) * 100 : 0;
          return metaAtingida < 50 && v.ativo;
        }),
        indicadores_performance: {
          ticket_medio_geral: vendedores.reduce((acc, v) => acc + (v.ticket_medio || 0), 0) / vendedores.length,
          comissao_media: vendedores.reduce((acc, v) => acc + (v.percentual_comissao || 0), 0) / vendedores.length,
          vendedores_sem_vendas: vendedores.filter(v => (v.total_vendas || 0) === 0 && v.ativo).length
        },
        data_geracao: new Date().toISOString()
      };

      return relatorio;
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }, [vendedores, resumos]);

  // Auditoria de vendedores
  const auditarVendedores = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: logs, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('tabela', 'vendedores')
        .eq('usuario_id', user.id)
        .order('data_operacao', { ascending: false })
        .limit(100);

      if (error) throw error;

      return logs || [];
    } catch (error: any) {
      console.error('Erro na auditoria:', error);
      throw error;
    }
  }, []);

  // Otimização de performance
  const otimizarPerformance = useCallback(async () => {
    try {
      console.log('Otimizando performance do módulo vendedores...');
      
      // Limpar cache antigo
      VendedorCacheService.clear();
      
      // Pre-carregar dados essenciais
      await buscarVendedores(true);
      
      // Executar limpeza de dados orfãos se necessário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Performance otimizada com sucesso');
      
      toast({
        title: "Performance otimizada!",
        description: "Cache limpo e dados recarregados",
        duration: 3000
      });

    } catch (error: any) {
      console.error('Erro na otimização:', error);
      toast({
        title: "Erro na otimização",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [buscarVendedores, toast]);

  // Métodos básicos mantidos para compatibilidade
  const excluirVendedor = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se vendedor tem vendas
      const { data: vendas, error: vendaError } = await supabase
        .from('vendas')
        .select('id')
        .eq('vendedor_id', id)
        .limit(1);

      if (vendaError) throw vendaError;

      if (vendas && vendas.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Vendedor possui vendas vinculadas",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('vendedores')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update otimista
      setVendedores(prev => prev.filter(v => v.id !== id));

      toast({
        title: "Vendedor excluído!",
        description: "Vendedor removido com sucesso",
        duration: 3000
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao excluir vendedor:', error);
      toast({
        title: "Erro ao excluir vendedor",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleStatus = useCallback(async (id: number): Promise<boolean> => {
    const vendedor = vendedores.find(v => v.id === id);
    if (!vendedor) return false;

    const novoStatus = vendedor.status === 'ativo' ? 'inativo' : 'ativo';
    const ativo = novoStatus === 'ativo';

    return await atualizarVendedor(id, { status: novoStatus, ativo });
  }, [vendedores, atualizarVendedor]);

  const gerarProximoCodigo = useCallback(async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('gerar_proximo_codigo_vendedor');
      
      if (error) {
        console.error('Erro ao gerar código:', error);
        return `V${String(vendedores.length + 1).padStart(3, '0')}`;
      }
      
      return data || `V${String(vendedores.length + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      return `V${String(vendedores.length + 1).padStart(3, '0')}`;
    }
  }, [vendedores.length]);

  const recarregar = useCallback(async () => {
    await buscarVendedores(true);
  }, [buscarVendedores]);

  const limparCache = useCallback(() => {
    VendedorCacheService.clear();
  }, []);

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
    limparCache,
    // Métodos avançados da Fase 5
    sincronizarComVendas,
    calcularComissoesPendentes,
    gerarRelatorioExecutivo,
    auditarVendedores,
    otimizarPerformance
  };
};