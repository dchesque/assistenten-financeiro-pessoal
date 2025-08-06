import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Métricas de performance
 */
export interface PerformanceMetrics {
  /** Tempo de renderização em ms */
  renderTime: number;
  /** Uso de memória em MB */
  memoryUsage: number;
  /** Número de re-renders */
  reRenders: number;
  /** Tamanho do bundle em KB */
  bundleSize: number;
  /** First Paint em ms */
  firstPaint: number;
  /** First Contentful Paint em ms */
  firstContentfulPaint: number;
  /** Largest Contentful Paint em ms */
  largestContentfulPaint: number;
  /** First Input Delay em ms */
  firstInputDelay: number;
  /** Cumulative Layout Shift */
  cumulativeLayoutShift: number;
}

/**
 * Configurações do monitor
 */
export interface PerformanceConfig {
  /** Se deve monitorar re-renders */
  trackReRenders?: boolean;
  /** Se deve monitorar memória */
  trackMemory?: boolean;
  /** Se deve monitorar Web Vitals */
  trackWebVitals?: boolean;
  /** Intervalo de coleta em ms */
  sampleInterval?: number;
  /** Threshold para alertas */
  thresholds?: {
    renderTime?: number;
    memoryUsage?: number;
    reRenders?: number;
  };
  /** Callback para alertas */
  onAlert?: (metric: string, value: number, threshold: number) => void;
}

/**
 * Dados de Web Vitals
 */
interface WebVitalsData {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
}

/**
 * Hook para monitoramento de performance com métricas avançadas
 * 
 * @param componentName - Nome do componente para identificação
 * @param config - Configurações do monitor
 * @returns Métricas e funções de controle
 * 
 * @example
 * ```tsx
 * const HeavyComponent = () => {
 *   const { 
 *     metrics, 
 *     startMeasurement, 
 *     endMeasurement,
 *     getReport 
 *   } = usePerformanceMonitor('HeavyComponent', {
 *     trackReRenders: true,
 *     trackMemory: true,
 *     thresholds: {
 *       renderTime: 100, // 100ms
 *       memoryUsage: 50,  // 50MB
 *       reRenders: 10     // 10 re-renders
 *     },
 *     onAlert: (metric, value, threshold) => {
 *       console.warn(`Performance Alert: ${metric} = ${value} > ${threshold}`);
 *     }
 *   });
 * 
 *   useEffect(() => {
 *     startMeasurement();
 *     
 *     // Operação pesada
 *     heavyComputation();
 *     
 *     endMeasurement();
 *   }, []);
 * 
 *   return (
 *     <div>
 *       <div>Render Time: {metrics.renderTime}ms</div>
 *       <div>Re-renders: {metrics.reRenders}</div>
 *       <button onClick={() => console.log(getReport())}>
 *         Ver Relatório
 *       </button>
 *     </div>
 *   );
 * };
 * ```
 */
export function usePerformanceMonitor(
  componentName: string,
  config: PerformanceConfig = {}
) {
  const {
    trackReRenders = true,
    trackMemory = true,
    trackWebVitals = true,
    sampleInterval = 1000,
    thresholds = {},
    onAlert
  } = config;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    reRenders: 0,
    bundleSize: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0
  });

  const renderCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const measurementActiveRef = useRef(false);
  const webVitalsRef = useRef<WebVitalsData>({});
  const observersRef = useRef<PerformanceObserver[]>([]);

  /**
   * Iniciar medição de performance
   */
  const startMeasurement = useCallback(() => {
    if (measurementActiveRef.current) return;
    
    measurementActiveRef.current = true;
    startTimeRef.current = performance.now();
    
    if (performance.mark) {
      performance.mark(`${componentName}-start`);
    }
  }, [componentName]);

  /**
   * Finalizar medição de performance
   */
  const endMeasurement = useCallback(() => {
    if (!measurementActiveRef.current) return;
    
    measurementActiveRef.current = false;
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    if (performance.mark && performance.measure) {
      performance.mark(`${componentName}-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-start`,
        `${componentName}-end`
      );
    }

    setMetrics(prev => {
      const newMetrics = { ...prev, renderTime };
      
      // Verificar thresholds
      if (thresholds.renderTime && renderTime > thresholds.renderTime && onAlert) {
        onAlert('renderTime', renderTime, thresholds.renderTime);
      }
      
      return newMetrics;
    });
  }, [componentName, thresholds.renderTime, onAlert]);

  /**
   * Obter uso de memória
   */
  const getMemoryUsage = useCallback((): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }, []);

  /**
   * Configurar observadores de Web Vitals
   */
  const setupWebVitalsObservers = useCallback(() => {
    if (!trackWebVitals || !window.PerformanceObserver) return;

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        webVitalsRef.current.fcp = fcpEntry.startTime;
        setMetrics(prev => ({ 
          ...prev, 
          firstContentfulPaint: fcpEntry.startTime 
        }));
      }
    });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        webVitalsRef.current.lcp = lastEntry.startTime;
        setMetrics(prev => ({ 
          ...prev, 
          largestContentfulPaint: lastEntry.startTime 
        }));
      }
    });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.processingStart) {
          const fid = entry.processingStart - entry.startTime;
          webVitalsRef.current.fid = fid;
          setMetrics(prev => ({ 
            ...prev, 
            firstInputDelay: fid 
          }));
        }
      });
    });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      webVitalsRef.current.cls = clsValue;
      setMetrics(prev => ({ 
        ...prev, 
        cumulativeLayoutShift: clsValue 
      }));
    });

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      observersRef.current = [fcpObserver, lcpObserver, fidObserver, clsObserver];
    } catch (error) {
      console.warn('Error setting up performance observers:', error);
    }
  }, [trackWebVitals]);

  /**
   * Obter relatório completo de performance
   */
  const getReport = useCallback(() => {
    const report = {
      component: componentName,
      timestamp: new Date().toISOString(),
      metrics: { ...metrics },
      webVitals: { ...webVitalsRef.current },
      memoryInfo: getMemoryUsage(),
      performanceEntries: performance.getEntriesByType('measure')
        .filter(entry => entry.name.includes(componentName))
        .map(entry => ({
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime
        }))
    };

    return report;
  }, [componentName, metrics, getMemoryUsage]);

  /**
   * Resetar métricas
   */
  const resetMetrics = useCallback(() => {
    renderCountRef.current = 0;
    webVitalsRef.current = {};
    
    setMetrics({
      renderTime: 0,
      memoryUsage: 0,
      reRenders: 0,
      bundleSize: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0
    });

    // Limpar entradas de performance
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
    if (performance.clearMarks) {
      performance.clearMarks();
    }
  }, []);

  // Contar re-renders
  useEffect(() => {
    if (trackReRenders) {
      renderCountRef.current++;
      
      setMetrics(prev => {
        const newReRenders = renderCountRef.current;
        
        // Verificar threshold
        if (thresholds.reRenders && newReRenders > thresholds.reRenders && onAlert) {
          onAlert('reRenders', newReRenders, thresholds.reRenders);
        }
        
        return { ...prev, reRenders: newReRenders };
      });
    }
  });

  // Monitorar memória periodicamente
  useEffect(() => {
    if (!trackMemory) return;

    const interval = setInterval(() => {
      const memoryUsage = getMemoryUsage();
      
      setMetrics(prev => {
        // Verificar threshold
        if (thresholds.memoryUsage && memoryUsage > thresholds.memoryUsage && onAlert) {
          onAlert('memoryUsage', memoryUsage, thresholds.memoryUsage);
        }
        
        return { ...prev, memoryUsage };
      });
    }, sampleInterval);

    return () => clearInterval(interval);
  }, [trackMemory, getMemoryUsage, sampleInterval, thresholds.memoryUsage, onAlert]);

  // Configurar observadores na montagem
  useEffect(() => {
    setupWebVitalsObservers();
    
    // Cleanup
    return () => {
      observersRef.current.forEach(observer => {
        try {
          observer.disconnect();
        } catch (error) {
          console.warn('Error disconnecting observer:', error);
        }
      });
      observersRef.current = [];
    };
  }, [setupWebVitalsObservers]);

  // Obter First Paint na montagem
  useEffect(() => {
    if (trackWebVitals) {
      const paintEntries = performance.getEntriesByType('paint');
      const fpEntry = paintEntries.find(entry => entry.name === 'first-paint');
      
      if (fpEntry) {
        setMetrics(prev => ({ ...prev, firstPaint: fpEntry.startTime }));
      }
    }
  }, [trackWebVitals]);

  return {
    metrics,
    startMeasurement,
    endMeasurement,
    getReport,
    resetMetrics,
    isMonitoring: measurementActiveRef.current
  };
}

/**
 * Hook simplificado para monitoramento básico
 */
export function useBasicPerformance(componentName: string) {
  return usePerformanceMonitor(componentName, {
    trackReRenders: true,
    trackMemory: false,
    trackWebVitals: false,
    thresholds: {
      renderTime: 50,
      reRenders: 5
    }
  });
}

export default usePerformanceMonitor;