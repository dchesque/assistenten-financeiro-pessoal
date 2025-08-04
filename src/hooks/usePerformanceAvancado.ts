import { useState, useEffect, useCallback, useMemo } from 'react';
import { performanceService, MetricaPerformance } from '@/services/PerformanceService';
import { useToast } from '@/hooks/use-toast';

export interface EstadoPerformance {
  // Estados de carregamento
  loading: boolean;
  optimizing: boolean;
  
  // Dados principais
  estatisticas: any;
  metricas: MetricaPerformance[];
  infoCache: any;
  
  // Resultados de otimização
  resultadoOtimizacao?: {
    cacheOtimizado: boolean;
    backupExecutado: boolean;
    metricas: MetricaPerformance[];
  };
  
  // Erros
  erro?: string;
}

export function usePerformanceAvancado() {
  const { toast } = useToast();
  
  const [estado, setEstado] = useState<EstadoPerformance>({
    loading: false,
    optimizing: false,
    estatisticas: {},
    metricas: [],
    infoCache: {}
  });

  // Cache para evitar re-renderizações desnecessárias
  const estadoMemoizado = useMemo(() => estado, [
    estado.loading,
    estado.optimizing,
    estado.estatisticas,
    estado.metricas.length,
    estado.infoCache.totalItens,
    estado.erro
  ]);

  // Carregar estatísticas rápidas
  const carregarEstatisticas = useCallback(async () => {
    try {
      setEstado(prev => ({ ...prev, loading: true, erro: undefined }));
      
      const estatisticas = await performanceService.obterEstatisticasRapidas();
      
      setEstado(prev => ({
        ...prev,
        estatisticas,
        loading: false
      }));
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao carregar estatísticas';
      
      setEstado(prev => ({
        ...prev,
        loading: false,
        erro: mensagemErro
      }));
      
      toast({
        title: "Erro ao carregar estatísticas",
        description: mensagemErro,
        variant: "destructive"
      });
    }
  }, [toast]);

  // Carregar métricas de performance
  const carregarMetricas = useCallback(async () => {
    try {
      setEstado(prev => ({ ...prev, loading: true, erro: undefined }));
      
      const metricas = await performanceService.obterMetricasPerformance();
      
      setEstado(prev => ({
        ...prev,
        metricas,
        loading: false
      }));
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao carregar métricas';
      
      setEstado(prev => ({
        ...prev,
        loading: false,
        erro: mensagemErro
      }));
      
      toast({
        title: "Erro ao carregar métricas",
        description: mensagemErro,
        variant: "destructive"
      });
    }
  }, [toast]);

  // Atualizar informações do cache
  const atualizarInfoCache = useCallback(() => {
    const infoCache = performanceService.obterInfoCache();
    setEstado(prev => ({ ...prev, infoCache }));
  }, []);

  // Limpar cache específico
  const limparCache = useCallback((padrao?: string) => {
    try {
      performanceService.invalidarCache(padrao);
      atualizarInfoCache();
      
      toast({
        title: "Cache limpo com sucesso",
        description: padrao ? `Cache com padrão "${padrao}" foi limpo` : "Todo o cache foi limpo"
      });
      
    } catch (error) {
      toast({
        title: "Erro ao limpar cache",
        description: "Não foi possível limpar o cache",
        variant: "destructive"
      });
    }
  }, [toast, atualizarInfoCache]);

  // Otimizar sistema completo
  const otimizarSistema = useCallback(async () => {
    try {
      setEstado(prev => ({ ...prev, optimizing: true, erro: undefined }));
      
      const resultado = await performanceService.otimizarSistema();
      
      setEstado(prev => ({
        ...prev,
        optimizing: false,
        resultadoOtimizacao: resultado
      }));
      
      atualizarInfoCache();
      
      if (resultado.cacheOtimizado) {
        toast({
          title: "Sistema otimizado com sucesso",
          description: `Cache otimizado e ${resultado.backupExecutado ? 'backup executado' : 'backup não necessário'}`
        });
      } else {
        toast({
          title: "Otimização parcial",
          description: "Algumas operações de otimização falharam",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro na otimização';
      
      setEstado(prev => ({
        ...prev,
        optimizing: false,
        erro: mensagemErro
      }));
      
      toast({
        title: "Erro na otimização",
        description: mensagemErro,
        variant: "destructive"
      });
    }
  }, [toast, atualizarInfoCache]);

  // Pré-carregar dados críticos
  const preCarregarDados = useCallback(async () => {
    try {
      await performanceService.preCarregarDadosCriticos();
      atualizarInfoCache();
      
      toast({
        title: "Dados pré-carregados",
        description: "Dados críticos foram carregados no cache"
      });
      
    } catch (error) {
      toast({
        title: "Erro no pré-carregamento",
        description: "Não foi possível pré-carregar os dados",
        variant: "destructive"
      });
    }
  }, [toast, atualizarInfoCache]);

  // Carregar todos os dados iniciais
  const carregarTodosDados = useCallback(async () => {
    await Promise.allSettled([
      carregarEstatisticas(),
      carregarMetricas()
    ]);
    atualizarInfoCache();
  }, [carregarEstatisticas, carregarMetricas, atualizarInfoCache]);

  // Análise de performance do sistema
  const analisarPerformance = useMemo(() => {
    const { metricas, infoCache } = estadoMemoizado;
    
    if (!metricas.length) return null;
    
    const problemas = metricas.filter(m => ['critico', 'atencao'].includes(m.status));
    const sucessos = metricas.filter(m => ['otimo', 'bom'].includes(m.status));
    
    const scoreGeral = ((sucessos.length / metricas.length) * 100);
    
    return {
      scoreGeral: Math.round(scoreGeral),
      problemas: problemas.length,
      sucessos: sucessos.length,
      hitRateCache: infoCache.hitRate || 0,
      statusGeral: scoreGeral >= 80 ? 'otimo' : 
                   scoreGeral >= 60 ? 'bom' : 
                   scoreGeral >= 40 ? 'regular' : 'critico',
      recomendacoes: problemas.map(p => p.recomendacao).filter(Boolean)
    };
  }, [estadoMemoizado]);

  // Inicializar monitoramento
  useEffect(() => {
    // Iniciar monitoramento de performance
    performanceService.iniciarMonitoramento();
    
    // Carregar dados iniciais
    carregarTodosDados();
    
    // Atualizar informações do cache periodicamente
    const intervalCache = setInterval(atualizarInfoCache, 30000); // 30s
    
    // Atualizar métricas periodicamente
    const intervalMetricas = setInterval(carregarMetricas, 5 * 60 * 1000); // 5min
    
    return () => {
      clearInterval(intervalCache);
      clearInterval(intervalMetricas);
    };
  }, [carregarTodosDados, carregarMetricas, atualizarInfoCache]);

  return {
    // Estado
    ...estadoMemoizado,
    
    // Análise
    analise: analisarPerformance,
    
    // Ações
    carregarEstatisticas,
    carregarMetricas,
    carregarTodosDados,
    limparCache,
    otimizarSistema,
    preCarregarDados,
    atualizarInfoCache
  };
}

// Hook para dados específicos com cache
export function useDadosComCache<T>(
  chave: string,
  fetcher: () => Promise<T>,
  ttl?: number,
  dependencias: any[] = []
) {
  const [dados, setDados] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      
      const resultado = await performanceService.obterComCache(chave, fetcher, ttl);
      setDados(resultado);
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao buscar dados';
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  }, [chave, fetcher, ttl]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados, ...dependencias]);

  return {
    dados,
    loading,
    erro,
    recarregar: buscarDados
  };
}