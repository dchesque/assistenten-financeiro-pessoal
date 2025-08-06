/**
 * 📚 DOCUMENTAÇÃO DOS HOOKS
 * Interfaces para documentação TypeScript dos hooks do sistema
 */

/**
 * Interface para documentação do hook useFornecedoresSupabase
 * Fornece operações CRUD completas para fornecedores
 */
export interface UseFornecedoresSupabaseDoc {
  fornecedores: any[];
  carregando: boolean;
  erro: Error | null;
  criarFornecedor: (dados: any) => Promise<void>;
  atualizarFornecedor: (id: string, dados: any) => Promise<void>;
  excluirFornecedor: (id: string) => Promise<void>;
  buscarFornecedores: (filtros?: any) => Promise<void>;
}

/**
 * Interface para documentação do hook useCacheInteligente
 * Sistema de cache multi-camada com TTL e métricas
 */
export interface UseCacheInteligenteDoc {
  data: any | null;
  isLoading: boolean;
  error: Error | null;
  isValidating: boolean;
  lastUpdated: Date | null;
  mutate: (data: any) => void;
  revalidate: () => Promise<any>;
  invalidate: () => void;
  getMetrics: () => any;
}

/**
 * Interface para documentação do hook usePerformanceMonitor
 * Monitoramento de performance com métricas avançadas
 */
export interface UsePerformanceMonitorDoc {
  metrics: {
    renderTime: number;
    memoryUsage: number;
    reRenders: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
  startMeasurement: () => void;
  endMeasurement: () => void;
  getReport: () => any;
  resetMetrics: () => void;
  isMonitoring: boolean;
}

/**
 * Interface para documentação do hook useValidacaoAssincrona
 * Validação assíncrona com debouncing
 */
export interface UseValidacaoAssincronaDoc {
  erro: string;
  validando: boolean;
  valido: boolean;
  revalidar: () => void;
  limpar: () => void;
}

/**
 * Interface para documentação do hook useCacheInvalidation
 * Invalidação inteligente de cache
 */
export interface UseCacheInvalidationDoc {
  invalidarAposCRUD: (entidade: string, operacao: string) => void;
  atualizarDados: (entidade: string) => Promise<void>;
  sincronizarSistema: () => Promise<void>;
}