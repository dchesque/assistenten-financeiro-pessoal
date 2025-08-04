// Sistema de cache para otimizar consultas frequentes
class CacheManager {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  // Tempo padrão de vida do cache (30 segundos)
  private defaultTTL = 30 * 1000;

  // Armazenar dados no cache
  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Recuperar dados do cache
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar se o cache expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // Verificar se existe no cache e não expirou
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Limpar item específico do cache
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Limpar todo o cache
  clear(): void {
    this.cache.clear();
  }

  // Limpar cache por padrão de chave
  clearByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Invalidar cache relacionado a uma entidade
  invalidateEntity(entity: string): void {
    this.clearByPattern(`^${entity}`);
    
    // Também limpar caches que podem ter relação com a entidade
    const relatedPatterns = {
      'fornecedores': ['contas_pagar', 'dashboard'],
      'clientes': ['vendas', 'dashboard'],
      'contas_pagar': ['dashboard', 'fluxo_caixa'],
      'vendas': ['dashboard', 'fluxo_caixa'],
      'cheques': ['dashboard'],
      'bancos': ['dashboard', 'contas_pagar', 'cheques']
    };

    const related = relatedPatterns[entity as keyof typeof relatedPatterns];
    if (related) {
      related.forEach(pattern => this.clearByPattern(`^${pattern}`));
    }
  }

  // Obter estatísticas do cache
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Implementar se necessário
    };
  }
}

// Instância singleton do cache
export const cache = new CacheManager();

// Decorador para cachear resultados de funções
export function cacheable(key: string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}_${JSON.stringify(args)}`;
      
      // Verificar se existe no cache
      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== null) {
        console.log(`Cache hit para ${cacheKey}`);
        return cachedResult;
      }

      // Executar método original
      console.log(`Cache miss para ${cacheKey}`);
      const result = await originalMethod.apply(this, args);
      
      // Armazenar resultado no cache
      cache.set(cacheKey, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

// Utilitários para cache específicos do domínio
export class DomainCache {
  
  // Cache para fornecedores
  static getFornecedores(filtros?: any) {
    const key = `fornecedores_${JSON.stringify(filtros || {})}`;
    return cache.get(key);
  }

  static setFornecedores(data: any, filtros?: any) {
    const key = `fornecedores_${JSON.stringify(filtros || {})}`;
    cache.set(key, data, 30 * 1000); // 30 segundos
  }

  // Cache para clientes
  static getClientes(filtros?: any) {
    const key = `clientes_${JSON.stringify(filtros || {})}`;
    return cache.get(key);
  }

  static setClientes(data: any, filtros?: any) {
    const key = `clientes_${JSON.stringify(filtros || {})}`;
    cache.set(key, data, 30 * 1000); // 30 segundos
  }

  // Cache para plano de contas
  static getPlanoContas() {
    return cache.get('plano_contas');
  }

  static setPlanoContas(data: any) {
    cache.set('plano_contas', data, 30 * 1000); // 30 segundos
  }

  // Cache para bancos
  static getBancos() {
    return cache.get('bancos');
  }

  static setBancos(data: any) {
    cache.set('bancos', data, 30 * 1000); // 30 segundos
  }

  // Cache para estatísticas do dashboard
  static getDashboardStats() {
    return cache.get('dashboard_stats');
  }

  static setDashboardStats(data: any) {
    cache.set('dashboard_stats', data, 30 * 1000); // 30 segundos
  }

  // Cache para dados de fluxo de caixa
  static getFluxoCaixa(filtros?: any) {
    const key = `fluxo_caixa_${JSON.stringify(filtros || {})}`;
    return cache.get(key);
  }

  static setFluxoCaixa(data: any, filtros?: any) {
    const key = `fluxo_caixa_${JSON.stringify(filtros || {})}`;
    cache.set(key, data, 30 * 1000); // 30 segundos
  }

  // Invalidação específica por operação
  static invalidateAfterOperation(operation: string, entity: string) {
    console.log(`Invalidando cache após ${operation} em ${entity}`);
    
    // Invalidar cache da entidade principal
    cache.invalidateEntity(entity);
    
    // Invalidar dashboard sempre que houver mudanças
    cache.clearByPattern('^dashboard');
    
    // Invalidar fluxo de caixa se for operação financeira
    if (['contas_pagar', 'vendas', 'cheques', 'movimentacoes_bancarias'].includes(entity)) {
      cache.clearByPattern('^fluxo_caixa');
    }
  }
}