import { lazy, Suspense, ComponentType } from 'react';
import { LoadingStates } from '@/components/ui/LoadingStates';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * 🚀 LAZY LOADING PREMIUM
 * Sistema de carregamento preguiçoso de rotas com fallbacks elegantes
 */

interface LazyRouteProps {
  /** Factory function para carregar o componente */
  factory: () => Promise<{ default: ComponentType<any> }>;
  /** Componente de loading personalizado */
  fallback?: React.ComponentType;
  /** Props para passar para o componente */
  componentProps?: Record<string, any>;
  /** Nome da rota para debugging */
  routeName?: string;
  /** Se deve pré-carregar o componente */
  preload?: boolean;
}

/**
 * Mapa de componentes lazy carregados para cache
 */
const lazyComponentCache = new Map<string, ComponentType<any>>();

/**
 * Componente de rota lazy com cache inteligente
 * 
 * @example
 * ```tsx
 * // Definição da rota
 * <LazyRoute
 *   factory={() => import('@/pages/Dashboard')}
 *   routeName="Dashboard"
 *   preload={true}
 *   fallback={DashboardSkeleton}
 * />
 * ```
 */
export const LazyRoute = ({
  factory,
  fallback: CustomFallback,
  componentProps = {},
  routeName = 'UnknownRoute',
  preload = false
}: LazyRouteProps) => {
  
  // Verificar se já está no cache
  const cachedComponent = lazyComponentCache.get(routeName);
  
  if (cachedComponent) {
    const CachedComponent = cachedComponent;
    return <CachedComponent {...componentProps} />;
  }

  // Criar componente lazy
  const LazyComponent = lazy(async () => {
    try {
      console.log(`🚀 Carregando rota: ${routeName}`);
      const start = performance.now();
      
      const module = await factory();
      
      const end = performance.now();
      console.log(`✅ Rota ${routeName} carregada em ${Math.round(end - start)}ms`);
      
      // Cache do componente para próximas renderizações
      lazyComponentCache.set(routeName, module.default);
      
      return module;
    } catch (error) {
      console.error(`❌ Erro ao carregar rota ${routeName}:`, error);
      throw error;
    }
  });

  // Pré-carregar se solicitado
  if (preload) {
    factory().then(module => {
      lazyComponentCache.set(routeName, module.default);
    }).catch(error => {
      console.warn(`Erro no preload de ${routeName}:`, error);
    });
  }

  // Fallback padrão ou customizado
  const FallbackComponent = CustomFallback || (() => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingStates.PageLoading />
        <p className="mt-4 text-gray-600">Carregando {routeName}...</p>
      </div>
    </div>
  ));

  return (
    <ErrorBoundary>
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...componentProps} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Factory para criar rotas lazy tipadas
 */
export const createLazyRoute = <T extends Record<string, any> = {}>(
  factory: () => Promise<{ default: ComponentType<T> }>,
  routeName: string,
  options: Partial<Omit<LazyRouteProps, 'factory' | 'routeName'>> = {}
) => {
  return (props: T) => (
    <LazyRoute
      factory={factory}
      routeName={routeName}
      componentProps={props}
      {...options}
    />
  );
};

/**
 * Hook para gerenciar preload de rotas
 */
export const useRoutePreload = () => {
  const preloadRoute = (factory: () => Promise<any>, routeName: string) => {
    if (lazyComponentCache.has(routeName)) {
      return Promise.resolve();
    }

    return factory()
      .then(module => {
        lazyComponentCache.set(routeName, module.default);
        console.log(`🔄 Rota ${routeName} pré-carregada`);
      })
      .catch(error => {
        console.warn(`Erro no preload de ${routeName}:`, error);
      });
  };

  const preloadMultipleRoutes = async (routes: Array<{
    factory: () => Promise<any>;
    routeName: string;
  }>) => {
    await Promise.allSettled(
      routes.map(({ factory, routeName }) => 
        preloadRoute(factory, routeName)
      )
    );
  };

  const getCacheStatus = () => {
    return {
      totalCached: lazyComponentCache.size,
      cachedRoutes: Array.from(lazyComponentCache.keys())
    };
  };

  return {
    preloadRoute,
    preloadMultipleRoutes,
    getCacheStatus
  };
};

/**
 * Rotas lazy pré-configuradas para o sistema
 */
export const LazyRoutes = {
  Dashboard: createLazyRoute(
    () => import('@/pages/Dashboard'),
    'Dashboard',
    { preload: true }
  ),
  
  ContasPagar: createLazyRoute(
    () => import('@/pages/ContasPagar'),
    'ContasPagar'
  ),
  
  ContasReceber: createLazyRoute(
    () => import('@/pages/ContasReceber'),
    'ContasReceber'
  ),
  
  Fornecedores: createLazyRoute(
    () => import('@/pages/Fornecedores'),
    'Fornecedores'
  ),
  
  Bancos: createLazyRoute(
    () => import('@/pages/Bancos'),
    'Bancos'
  ),
  
  Cheques: createLazyRoute(
    () => import('@/pages/Cheques'),
    'Cheques'
  ),
  
  DRE: createLazyRoute(
    () => import('@/pages/DRE'),
    'DRE'
  ),
  
  Relatorios: createLazyRoute(
    () => import('@/pages/Relatorios'),
    'Relatorios'
  )
};

export default LazyRoute;