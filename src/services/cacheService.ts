/**
 * 🗄️ CACHE SERVICE PREMIUM
 * Serviço de cache inteligente com estratégias avançadas, TTL, compressão e métricas
 */

/**
 * Estratégias de cache disponíveis
 */
export type CacheStrategy = 'lru' | 'fifo' | 'lfu';

/**
 * Configuração do cache
 */
export interface CacheConfig {
  /** Tamanho máximo do cache (padrão: 100) */
  maxSize?: number;
  /** TTL em milissegundos (padrão: 5 minutos) */
  ttl?: number;
  /** Estratégia de limpeza (padrão: 'lru') */
  strategy?: CacheStrategy;
  /** Se deve comprimir dados grandes */
  compress?: boolean;
  /** Tamanho mínimo para compressão em bytes */
  compressionThreshold?: number;
  /** Se deve persistir no localStorage */
  persist?: boolean;
  /** Prefixo para chaves no localStorage */
  persistPrefix?: string;
}

/**
 * Item do cache com metadados
 */
interface CacheItem<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed: boolean;
}

/**
 * Métricas do cache
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  totalSize: number;
  itemCount: number;
  memoryUsage: number;
}

/**
 * Configurações de cache por tipo de dados
 */
export const CACHE_CONFIGS = {
  // Dados que mudam raramente - TTL longo
  static: { ttl: 30 * 60 * 1000, maxSize: 50 }, // 30 minutos
  
  // Dados de usuário - TTL médio
  user: { ttl: 10 * 60 * 1000, maxSize: 30 }, // 10 minutos
  
  // Dados de API - TTL curto
  api: { ttl: 5 * 60 * 1000, maxSize: 100 }, // 5 minutos
  
  // Pesquisas - TTL muito curto
  search: { ttl: 2 * 60 * 1000, maxSize: 20 }, // 2 minutos
  
  // Validações - TTL médio
  validation: { ttl: 15 * 60 * 1000, maxSize: 50 }, // 15 minutos
  
  // Fornecedores - TTL longo
  fornecedores: { ttl: 20 * 60 * 1000, maxSize: 200 }, // 20 minutos
  
  // Contas - TTL curto (dados dinâmicos)
  contas: { ttl: 3 * 60 * 1000, maxSize: 150 }, // 3 minutos
  
  // Categorias - TTL muito longo
  categorias: { ttl: 60 * 60 * 1000, maxSize: 30 }, // 1 hora
} as const;

/**
 * Serviço de cache premium com estratégias avançadas
 */
export class CacheService {
  private cache = new Map<string, CacheItem>();
  private config: Required<CacheConfig>;
  private metrics: CacheMetrics;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: 100,
      ttl: 5 * 60 * 1000, // 5 minutos
      strategy: 'lru',
      compress: true,
      compressionThreshold: 1024, // 1KB
      persist: false,
      persistPrefix: 'cache_',
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      totalSize: 0,
      itemCount: 0,
      memoryUsage: 0
    };

    // Iniciar limpeza automática a cada minuto
    this.startCleanup();

    // Carregar cache persistido se habilitado
    if (this.config.persist) {
      this.loadFromPersistence();
    }
  }

  /**
   * Obter item do cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Verificar se expirou
    if (this.isExpired(item)) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Atualizar metadados de acesso
    item.accessCount++;
    item.lastAccessed = Date.now();

    this.metrics.hits++;
    this.updateHitRate();

    // Descomprimir se necessário
    const value = item.compressed ? this.decompress(item.value) : item.value;
    return value as T;
  }

  /**
   * Definir item no cache
   */
  set<T>(key: string, value: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const now = Date.now();
    
    // Calcular tamanho do valor
    const size = this.calculateSize(value);
    
    // Comprimir se necessário
    const shouldCompress = this.config.compress && size > this.config.compressionThreshold;
    const finalValue = shouldCompress ? this.compress(value) : value;

    const item: CacheItem<T> = {
      value: finalValue,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
      size: shouldCompress ? this.calculateSize(finalValue) : size,
      compressed: shouldCompress
    };

    // Verificar se precisa fazer eviction
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, item);
    this.metrics.sets++;
    this.updateMetrics();

    // Persistir se habilitado
    if (this.config.persist) {
      this.saveToPersistence(key, item);
    }
  }

  /**
   * Remover item do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.metrics.deletes++;
      this.updateMetrics();

      if (this.config.persist) {
        localStorage.removeItem(`${this.config.persistPrefix}${key}`);
      }
    }

    return deleted;
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.resetMetrics();

    if (this.config.persist) {
      this.clearPersistence();
    }
  }

  /**
   * Verificar se chave existe e não expirou
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (this.isExpired(item)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Obter tamanho atual do cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Obter métricas do cache
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Obter todas as chaves
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Forçar limpeza de itens expirados
   */
  cleanup(): number {
    const initialSize = this.cache.size;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item, now)) {
        this.cache.delete(key);
        if (this.config.persist) {
          localStorage.removeItem(`${this.config.persistPrefix}${key}`);
        }
      }
    }

    const cleaned = initialSize - this.cache.size;
    this.updateMetrics();
    return cleaned;
  }

  /**
   * Destruir cache e limpar recursos
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }

  // Métodos privados

  private isExpired(item: CacheItem, now: number = Date.now()): boolean {
    return now - item.timestamp > item.ttl;
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;

    switch (this.config.strategy) {
      case 'lru':
        keyToEvict = this.findLRU();
        break;
      case 'lfu':
        keyToEvict = this.findLFU();
        break;
      case 'fifo':
      default:
        keyToEvict = this.findFIFO();
        break;
    }

    this.cache.delete(keyToEvict);
    this.metrics.evictions++;

    if (this.config.persist) {
      localStorage.removeItem(`${this.config.persistPrefix}${keyToEvict}`);
    }
  }

  private findLRU(): string {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFU(): string {
    let leastUsedKey = '';
    let leastCount = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < leastCount) {
        leastCount = item.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  private findFIFO(): string {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Aproximação (UTF-16)
    } catch {
      return 0;
    }
  }

  private compress(value: any): string {
    try {
      // Implementação simples - em produção usar lib como lz-string
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }

  private decompress(compressed: string): any {
    try {
      return JSON.parse(compressed);
    } catch {
      return null;
    }
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  private updateMetrics(): void {
    this.metrics.itemCount = this.cache.size;
    this.metrics.totalSize = Array.from(this.cache.values())
      .reduce((total, item) => total + item.size, 0);
    this.metrics.memoryUsage = this.metrics.totalSize;
    this.updateHitRate();
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      totalSize: 0,
      itemCount: 0,
      memoryUsage: 0
    };
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // A cada minuto
  }

  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private saveToPersistence(key: string, item: CacheItem): void {
    try {
      const persistKey = `${this.config.persistPrefix}${key}`;
      localStorage.setItem(persistKey, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to persist cache item:', error);
    }
  }

  private loadFromPersistence(): void {
    try {
      const prefix = this.config.persistPrefix;
      const now = Date.now();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const originalKey = key.substring(prefix.length);
          const itemStr = localStorage.getItem(key);
          
          if (itemStr) {
            const item: CacheItem = JSON.parse(itemStr);
            
            // Verificar se não expirou
            if (!this.isExpired(item, now)) {
              this.cache.set(originalKey, item);
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from persistence:', error);
    }
  }

  private clearPersistence(): void {
    try {
      const prefix = this.config.persistPrefix;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear cache persistence:', error);
    }
  }
}

// Instâncias globais do cache
export const globalCache = new CacheService({
  maxSize: 200,
  ttl: 10 * 60 * 1000, // 10 minutos
  strategy: 'lru',
  persist: true,
  persistPrefix: 'global_cache_'
});

export const apiCache = new CacheService(CACHE_CONFIGS.api);
export const userCache = new CacheService(CACHE_CONFIGS.user);
export const staticCache = new CacheService(CACHE_CONFIGS.static);
export const searchCache = new CacheService(CACHE_CONFIGS.search);
export const validationCache = new CacheService(CACHE_CONFIGS.validation);

export default CacheService;