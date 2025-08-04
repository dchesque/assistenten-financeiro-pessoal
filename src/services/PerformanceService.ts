import { supabase } from '@/integrations/supabase/client';

// Interface para métricas de performance
export interface MetricaPerformance {
  metrica: string;
  valor: number;
  unidade: string;
  status: 'otimo' | 'bom' | 'regular' | 'baixo' | 'atencao' | 'critico';
  recomendacao: string;
}

// Interface para cache de performance
export interface CachePerformance {
  chave: string;
  dados: any;
  timestamp: number;
  ttl: number;
  hits: number;
}

// Service principal de performance
export class PerformanceService {
  private static instance: PerformanceService;
  private cache = new Map<string, CachePerformance>();
  private metricas = new Map<string, number>();
  
  // TTL padrão: 5 minutos
  private readonly TTL_PADRAO = 5 * 60 * 1000;
  
  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Cache inteligente com TTL dinâmico
  async obterComCache<T>(
    chave: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const agora = Date.now();
    const itemCache = this.cache.get(chave);
    
    // Verificar se cache é válido
    if (itemCache && (agora - itemCache.timestamp) < itemCache.ttl) {
      itemCache.hits++;
      this.registrarMetrica('cache_hits', 1);
      return itemCache.dados;
    }
    
    // Cache miss - buscar dados
    const inicio = performance.now();
    try {
      const dados = await fetcher();
      const tempo = performance.now() - inicio;
      
      // Salvar no cache com TTL dinâmico baseado no tempo de busca
      const ttlDinamico = ttl || this.calcularTTLDinamico(tempo);
      
      this.cache.set(chave, {
        chave,
        dados,
        timestamp: agora,
        ttl: ttlDinamico,
        hits: 1
      });
      
      this.registrarMetrica('cache_misses', 1);
      this.registrarMetrica('tempo_consulta', tempo);
      
      return dados;
    } catch (error) {
      this.registrarMetrica('erros_cache', 1);
      throw error;
    }
  }

  // TTL dinâmico baseado na performance da consulta
  private calcularTTLDinamico(tempoConsulta: number): number {
    if (tempoConsulta > 2000) return 15 * 60 * 1000; // 15 min para consultas lentas
    if (tempoConsulta > 1000) return 10 * 60 * 1000; // 10 min para consultas médias
    if (tempoConsulta > 500) return 5 * 60 * 1000;   // 5 min para consultas rápidas
    return this.TTL_PADRAO; // TTL padrão para consultas muito rápidas
  }

  // Invalidar cache por padrão
  invalidarCache(padrao?: string): void {
    if (!padrao) {
      this.cache.clear();
      return;
    }
    
    const chaves = Array.from(this.cache.keys());
    chaves.forEach(chave => {
      if (chave.includes(padrao)) {
        this.cache.delete(chave);
      }
    });
  }

  // Pré-carregar dados críticos
  async preCarregarDadosCriticos(): Promise<void> {
    const operacoes = [
      () => this.obterEstatisticasRapidas(),
      () => this.obterMetricasPerformance(),
      () => this.obterClientesAtivos(),
      () => this.obterFornecedoresAtivos()
    ];
    
    // Executar em paralelo
    await Promise.allSettled(operacoes.map(op => op()));
  }

  // Estatísticas otimizadas
  async obterEstatisticasRapidas() {
    return this.obterComCache(
      'estatisticas_rapidas',
      async () => {
        const { data, error } = await supabase
          .rpc('estatisticas_rapidas_cache');
        
        if (error) throw error;
        return data[0] || {};
      },
      30 * 1000 // 30 segundos para estatísticas
    );
  }

  // Métricas de performance do sistema
  async obterMetricasPerformance(): Promise<MetricaPerformance[]> {
    return this.obterComCache(
      'metricas_performance',
      async () => {
        const { data, error } = await supabase
          .rpc('monitorar_performance_sistema');
        
        if (error) throw error;
        return (data || []).map(item => ({
          ...item,
          status: item.status as MetricaPerformance['status']
        }));
      },
      30 * 1000 // 30 segundos para métricas
    );
  }

  // Clientes ativos otimizado
  async obterClientesAtivos() {
    return this.obterComCache(
      'clientes_ativos',
      async () => {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nome, documento, tipo')
          .eq('ativo', true)
          .limit(100);
        
        if (error) throw error;
        return data;
      },
      30 * 1000 // 30 segundos para clientes
    );
  }

  // Fornecedores ativos otimizado
  async obterFornecedoresAtivos() {
    return this.obterComCache(
      'fornecedores_ativos',
      async () => {
        const { data, error } = await supabase
          .from('fornecedores')
          .select('id, nome, documento, tipo')
          .eq('ativo', true)
          .limit(100);
        
        if (error) throw error;
        return data;
      },
      30 * 1000 // 30 segundos para fornecedores
    );
  }

  // Plano de contas otimizado
  async obterPlanoContasLancamento() {
    return this.obterComCache(
      'plano_contas_lancamento',
      async () => {
        const { data, error } = await supabase
          .from('plano_contas')
          .select('id, codigo, nome, aceita_lancamento')
          .eq('ativo', true)
          .eq('aceita_lancamento', true);
        
        if (error) throw error;
        return data;
      },
      30 * 1000 // 30 segundos para plano de contas
    );
  }

  // Limpeza automática do cache
  async limparCacheAutomatico(): Promise<void> {
    const agora = Date.now();
    const chaves = Array.from(this.cache.keys());
    
    chaves.forEach(chave => {
      const item = this.cache.get(chave);
      if (item && (agora - item.timestamp) > item.ttl) {
        this.cache.delete(chave);
      }
    });
    
    // Executar limpeza no banco também
    try {
      await supabase.rpc('limpar_cache_performance');
    } catch (error) {
      console.warn('Erro na limpeza de cache do banco:', error);
    }
  }

  // Registrar métricas internas
  private registrarMetrica(nome: string, valor: number): void {
    const atual = this.metricas.get(nome) || 0;
    this.metricas.set(nome, atual + valor);
  }

  // Obter informações do cache
  obterInfoCache() {
    const totalItens = this.cache.size;
    const totalHits = Array.from(this.cache.values())
      .reduce((acc, item) => acc + item.hits, 0);
    
    const cacheHits = this.metricas.get('cache_hits') || 0;
    const cacheMisses = this.metricas.get('cache_misses') || 0;
    const totalOperacoes = cacheHits + cacheMisses;
    
    return {
      totalItens,
      totalHits,
      hitRate: totalOperacoes > 0 ? (cacheHits / totalOperacoes) * 100 : 0,
      memoryUsage: this.estimarUsoMemoria(),
      metricas: Object.fromEntries(this.metricas)
    };
  }

  // Estimar uso de memória do cache
  private estimarUsoMemoria(): number {
    let tamanho = 0;
    this.cache.forEach(item => {
      tamanho += JSON.stringify(item.dados).length;
    });
    return tamanho; // bytes aproximados
  }

  // Otimização automática do sistema
  async otimizarSistema(): Promise<{
    cacheOtimizado: boolean;
    backupExecutado: boolean;
    metricas: MetricaPerformance[];
  }> {
    try {
      // 1. Limpar cache expirado
      await this.limparCacheAutomatico();
      
      // 2. Pré-carregar dados críticos
      await this.preCarregarDadosCriticos();
      
      // 3. Executar backup de dados críticos
      const { data: backupResult } = await supabase
        .rpc('backup_dados_criticos');
      
      // 4. Obter métricas atualizadas
      const metricas = await this.obterMetricasPerformance();
      
      return {
        cacheOtimizado: true,
        backupExecutado: !!backupResult,
        metricas
      };
    } catch (error) {
      console.error('Erro na otimização do sistema:', error);
      return {
        cacheOtimizado: false,
        backupExecutado: false,
        metricas: []
      };
    }
  }

  // Monitoramento em tempo real
  iniciarMonitoramento(): void {
    // Limpeza automática a cada 10 minutos
    setInterval(() => {
      this.limparCacheAutomatico();
    }, 10 * 60 * 1000);
    
    // Pré-carregamento a cada 30 minutos
    setInterval(() => {
      this.preCarregarDadosCriticos();
    }, 30 * 60 * 1000);
  }
}

// Singleton instance
export const performanceService = PerformanceService.getInstance();