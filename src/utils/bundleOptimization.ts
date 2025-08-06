/**
 * 📦 BUNDLE OPTIMIZATION PREMIUM
 * Utilitários para otimização avançada de bundle
 */

/**
 * Análise de bundle e code splitting
 */
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private loadedChunks = new Set<string>();
  private chunkSizes = new Map<string, number>();
  private loadTimes = new Map<string, number>();

  static getInstance(): BundleAnalyzer {
    if (!this.instance) {
      this.instance = new BundleAnalyzer();
    }
    return this.instance;
  }

  /**
   * Registrar carregamento de chunk
   */
  registerChunkLoad(chunkName: string, size?: number): void {
    const startTime = performance.now();
    
    this.loadedChunks.add(chunkName);
    if (size) {
      this.chunkSizes.set(chunkName, size);
    }
    
    console.log(`📦 Chunk carregado: ${chunkName} (${size ? `${size}KB` : 'tamanho desconhecido'})`);
    
    // Registrar tempo de carregamento
    requestIdleCallback(() => {
      const endTime = performance.now();
      this.loadTimes.set(chunkName, endTime - startTime);
    });
  }

  /**
   * Obter estatísticas do bundle
   */
  getBundleStats() {
    const totalSize = Array.from(this.chunkSizes.values()).reduce((acc, size) => acc + size, 0);
    const averageLoadTime = Array.from(this.loadTimes.values()).reduce((acc, time) => acc + time, 0) / this.loadTimes.size;

    return {
      totalChunks: this.loadedChunks.size,
      totalSize: `${totalSize}KB`,
      averageLoadTime: `${Math.round(averageLoadTime)}ms`,
      chunks: Array.from(this.loadedChunks),
      chunkDetails: Array.from(this.chunkSizes.entries()).map(([name, size]) => ({
        name,
        size: `${size}KB`,
        loadTime: `${Math.round(this.loadTimes.get(name) || 0)}ms`
      }))
    };
  }

  /**
   * Detectar chunks desnecessários
   */
  detectUnusedChunks(): string[] {
    // Em produção, isso seria mais sofisticado
    const allPossibleChunks = [
      'dashboard', 'contas-pagar', 'fornecedores', 'bancos', 
      'cheques', 'dre', 'relatorios', 'configuracoes'
    ];

    return allPossibleChunks.filter(chunk => !this.loadedChunks.has(chunk));
  }
}

/**
 * Preloader inteligente de recursos
 */
export class ResourcePreloader {
  private preloadedResources = new Set<string>();
  private preloadQueue = new Map<string, Promise<any>>();

  /**
   * Pré-carregar rota crítica
   */
  async preloadCriticalRoute(routeName: string): Promise<void> {
    if (this.preloadedResources.has(routeName)) {
      return;
    }

    const routeMap: Record<string, () => Promise<any>> = {
      dashboard: () => import('@/pages/Dashboard'),
      'contas-pagar': () => import('@/pages/ContasPagar'),
      bancos: () => import('@/pages/Bancos')
    };

    const loader = routeMap[routeName];
    if (!loader) {
      console.warn(`Rota ${routeName} não encontrada para preload`);
      return;
    }

    if (this.preloadQueue.has(routeName)) {
      return this.preloadQueue.get(routeName);
    }

    const preloadPromise = loader()
      .then(() => {
        this.preloadedResources.add(routeName);
        console.log(`🚀 Rota ${routeName} pré-carregada com sucesso`);
        BundleAnalyzer.getInstance().registerChunkLoad(routeName);
      })
      .catch(error => {
        console.error(`❌ Erro ao pré-carregar ${routeName}:`, error);
      })
      .finally(() => {
        this.preloadQueue.delete(routeName);
      });

    this.preloadQueue.set(routeName, preloadPromise);
    return preloadPromise;
  }

  /**
   * Pré-carregar com base no comportamento do usuário
   */
  preloadBasedOnUserBehavior(): void {
    // Pré-carregar Dashboard (sempre usado)
    this.preloadCriticalRoute('dashboard');

    // Detectar padrões de navegação
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('dashboard')) {
      // Se está no dashboard, pré-carregar rotas mais acessadas
      this.preloadCriticalRoute('contas-pagar');
      this.preloadCriticalRoute('fornecedores');
    }

    if (currentPath.includes('fornecedores')) {
      // Se está em fornecedores, pré-carregar contas a pagar (workflow comum)
      this.preloadCriticalRoute('contas-pagar');
    }

    // Pré-carregar baseado em hora do dia
    const hora = new Date().getHours();
    if (hora >= 8 && hora <= 18) {
      // Horário comercial - pré-carregar módulos financeiros
      this.preloadCriticalRoute('bancos');
      this.preloadCriticalRoute('cheques');
    }
  }

  /**
   * Pré-carregar recursos estáticos
   */
  preloadStaticResources(): void {
    const criticalAssets = [
      // Fontes críticas
      '/fonts/Inter-Regular.woff2',
      '/fonts/Inter-Medium.woff2',
      '/fonts/Inter-SemiBold.woff2',
      
      // Ícones críticos
      '/icons/logo.svg',
      '/icons/dashboard.svg',
      '/icons/money.svg'
    ];

    criticalAssets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = asset;
      
      if (asset.includes('.woff2')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (asset.includes('.svg')) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  }

  /**
   * Obter estatísticas de preload
   */
  getPreloadStats() {
    return {
      preloadedRoutes: Array.from(this.preloadedResources),
      queuedPreloads: Array.from(this.preloadQueue.keys()),
      totalPreloaded: this.preloadedResources.size
    };
  }
}

/**
 * Otimizador de performance em runtime
 */
export class RuntimeOptimizer {
  private observedElements = new WeakMap<Element, IntersectionObserver>();
  
  /**
   * Lazy loading inteligente de componentes
   */
  setupIntersectionObserver(
    element: Element, 
    callback: () => void,
    options: IntersectionObserverInit = {}
  ): void {
    const defaultOptions: IntersectionObserverInit = {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
          this.observedElements.delete(entry.target);
        }
      });
    }, defaultOptions);

    observer.observe(element);
    this.observedElements.set(element, observer);
  }

  /**
   * Cleanup de observers
   */
  cleanup(): void {
    this.observedElements = new WeakMap();
  }

  /**
   * Otimizar renderização de listas grandes
   */
  optimizeListRendering(listElement: HTMLElement): void {
    // Implementar virtual scrolling automático para listas com mais de 100 itens
    const items = listElement.children;
    
    if (items.length > 100) {
      console.log(`📊 Lista com ${items.length} itens detectada - considere usar VirtualizedList`);
      
      // Adicionar atributo para identificar listas que precisam de virtualização
      listElement.setAttribute('data-needs-virtualization', 'true');
      listElement.setAttribute('data-item-count', items.length.toString());
    }
  }
}

/**
 * Monitor de bundle size
 */
export class BundleSizeMonitor {
  private static readonly SIZE_THRESHOLD_KB = 500; // 500KB
  
  /**
   * Monitorar tamanho do bundle em desenvolvimento
   */
  static monitorBundleSize(): void {
    if (process.env.NODE_ENV !== 'development') return;

    // Simular análise de bundle (em produção seria mais sofisticado)
    const estimatedSize = this.estimateBundleSize();
    
    if (estimatedSize > this.SIZE_THRESHOLD_KB) {
      console.warn(`📦 Bundle size estimado: ${estimatedSize}KB - Considere otimização!`);
      this.suggestOptimizations();
    } else {
      console.log(`✅ Bundle size OK: ${estimatedSize}KB`);
    }
  }

  private static estimateBundleSize(): number {
    // Estimar baseado no número de módulos carregados
    const moduleCount = Object.keys(window).filter(key => key.includes('webpack')).length;
    return moduleCount * 50; // Estimativa grosseira
  }

  private static suggestOptimizations(): void {
    console.group('🔧 Sugestões de Otimização:');
    console.log('1. Use lazy loading para rotas não críticas');
    console.log('2. Implemente tree shaking mais agressivo');
    console.log('3. Considere code splitting por features');
    console.log('4. Remova dependências não utilizadas');
    console.log('5. Use dynamic imports para bibliotecas pesadas');
    console.groupEnd();
  }
}

// Instâncias singleton
export const bundleAnalyzer = BundleAnalyzer.getInstance();
export const resourcePreloader = new ResourcePreloader();
export const runtimeOptimizer = new RuntimeOptimizer();

// Auto-inicialização em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  BundleSizeMonitor.monitorBundleSize();
  resourcePreloader.preloadBasedOnUserBehavior();
  resourcePreloader.preloadStaticResources();
}

/**
 * Hook para otimização de componentes
 */
export const useComponentOptimization = (componentName: string) => {
  const startTime = performance.now();
  
  return {
    measureRenderTime: () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // 60fps = 16ms por frame
        console.warn(`⚠️ ${componentName} render lento: ${renderTime.toFixed(2)}ms`);
      }
      
      bundleAnalyzer.registerChunkLoad(componentName, Math.round(renderTime));
    }
  };
};

export default {
  BundleAnalyzer,
  ResourcePreloader,
  RuntimeOptimizer,
  BundleSizeMonitor,
  bundleAnalyzer,
  resourcePreloader,
  runtimeOptimizer,
  useComponentOptimization
};