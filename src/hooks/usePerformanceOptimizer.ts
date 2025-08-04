import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

interface PerformanceMetrics {
  queriesExecuted: number;
  cacheHits: number;
  cacheMisses: number;
  averageQueryTime: number;
  totalQueryTime: number;
  lastQueryTime: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: PerformanceMetrics = {
    queriesExecuted: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageQueryTime: 0,
    totalQueryTime: 0,
    lastQueryTime: 0
  };

  constructor(private defaultTTL: number = 30 * 1000) {} // 30 segundos default

  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const startTime = performance.now();
    
    // Verificar se existe no cache e ainda é válido
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      this.metrics.cacheHits++;
      const endTime = performance.now();
      this.updateMetrics(endTime - startTime);
      return cached.data;
    }

    // Cache miss - executar fetcher
    this.metrics.cacheMisses++;
    
    try {
      const data = await fetcher();
      
      // Armazenar no cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });

      const endTime = performance.now();
      this.updateMetrics(endTime - startTime);
      
      return data;
    } catch (error) {
      const endTime = performance.now();
      this.updateMetrics(endTime - startTime);
      throw error;
    }
  }

  invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Invalidar chaves que correspondem ao padrão
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private updateMetrics(queryTime: number) {
    this.metrics.queriesExecuted++;
    this.metrics.totalQueryTime += queryTime;
    this.metrics.averageQueryTime = this.metrics.totalQueryTime / this.metrics.queriesExecuted;
    this.metrics.lastQueryTime = queryTime;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getCacheInfo() {
    return {
      size: this.cache.size,
      hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      ...this.metrics
    };
  }
}

// Instância global do cache
const globalCache = new PerformanceCache();

export const usePerformanceOptimizer = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  // Hook para buscar dados com cache
  const fetchWithCache = useCallback(async <T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    return globalCache.get(key, queryFn, ttl);
  }, []);

  // Invalidar cache por padrão
  const invalidateCache = useCallback((pattern?: string) => {
    globalCache.invalidate(pattern);
  }, []);

  // Executar otimizações automáticas
  const otimizarSistema = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      const resultados = {
        inicio: new Date(),
        cacheStatus: globalCache.getCacheInfo(),
        otimizacoes: [] as string[],
        melhorias: [] as string[]
      };

      // 1. Verificar e otimizar índices (simulado - seria executado no banco)
      console.log('🔍 Analisando performance do banco de dados...');
      
      // 2. Limpar cache expirado
      const cacheInfo = globalCache.getCacheInfo();
      if (cacheInfo.size > 100) {
        globalCache.invalidate();
        resultados.otimizacoes.push('Cache limpo - mais de 100 entradas');
      }

      // 3. Verificar queries lentas simuladas
      if (cacheInfo.averageQueryTime > 500) {
        resultados.melhorias.push('Queries médias acima de 500ms - considere otimizar');
      }

      // 4. Pré-carregar dados essenciais
      console.log('📦 Pré-carregando dados críticos...');
      
      await Promise.all([
        fetchWithCache('fornecedores-ativos', async () => {
          const { data } = await supabase
            .from('fornecedores')
            .select('id, nome')
            .eq('ativo', true)
            .limit(50);
          return data || [];
        }),
        
        fetchWithCache('plano-contas-lancamento', async () => {
          const { data } = await supabase
            .from('plano_contas')
            .select('id, nome, codigo')
            .eq('ativo', true)
            .eq('aceita_lancamento', true)
            .limit(100);
          return data || [];
        }),

        fetchWithCache('bancos-ativos', async () => {
          const { data } = await supabase
            .from('bancos')
            .select('id, nome')
            .eq('ativo', true);
          return data || [];
        })
      ]);

      resultados.otimizacoes.push('Dados críticos pré-carregados');
      resultados.melhorias.push('Cache populado com dados essenciais');

      // 5. Verificar integridade dos dados
      console.log('🔍 Verificando integridade dos dados...');
      
      const { data: contasSemFornecedor } = await supabase
        .from('contas_pagar')
        .select('id')
        .is('fornecedor_id', null)
        .limit(1);

      if (contasSemFornecedor?.length) {
        resultados.melhorias.push('Encontradas contas sem fornecedor - verificar integridade');
      }

      setOptimizationResults(resultados);
      
    } catch (error) {
      console.error('Erro na otimização:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [fetchWithCache]);

  // Métricas de performance
  const metricas = useMemo(() => {
    return globalCache.getMetrics();
  }, []);

  // Hook para queries otimizadas específicas
  const queries = {
    fornecedoresAtivos: useCallback(() => 
      fetchWithCache('fornecedores-ativos', async () => {
        const { data } = await supabase
          .from('fornecedores')
          .select('*')
          .eq('ativo', true)
          .order('nome');
        return data || [];
      })
    , [fetchWithCache]),

    planoContasLancamento: useCallback(() =>
      fetchWithCache('plano-contas-lancamento', async () => {
        const { data } = await supabase
          .from('plano_contas')
          .select('*')
          .eq('ativo', true)
          .eq('aceita_lancamento', true)
          .order('codigo');
        return data || [];
      })
    , [fetchWithCache]),

    bancosAtivos: useCallback(() =>
      fetchWithCache('bancos-ativos', async () => {
        const { data } = await supabase
          .from('bancos')
          .select('*')
          .eq('ativo', true)
          .order('nome');
        return data || [];
      })
    , [fetchWithCache]),

    estatisticasRapidas: useCallback(() =>
      fetchWithCache('estatisticas-dashboard', async () => {
        // Buscar dados essenciais do dashboard em uma única query otimizada
        const hoje = new Date().toISOString().split('T')[0];
        
        const [contasPagar, vendas, cheques] = await Promise.all([
          supabase.from('contas_pagar').select('status, valor_final', { count: 'exact' }),
          supabase.from('vendas').select('valor_final', { count: 'exact' }).eq('ativo', true),
          supabase.from('cheques').select('status, valor', { count: 'exact' })
        ]);

        return {
          contasPagar: contasPagar.data?.length || 0,
          vendas: vendas.data?.length || 0,
          cheques: cheques.data?.length || 0,
          ultima_atualizacao: new Date()
        };
      }, 2 * 60 * 1000) // Cache por 2 minutos
    , [fetchWithCache])
  };

  return {
    fetchWithCache,
    invalidateCache,
    otimizarSistema,
    isOptimizing,
    optimizationResults,
    metricas,
    queries,
    cacheInfo: globalCache.getCacheInfo()
  };
};