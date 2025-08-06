import { memo, useMemo, CSSProperties } from 'react';
import { FixedSizeList as List, VariableSizeList, ListChildComponentProps } from 'react-window';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 📦 LISTA VIRTUALIZADA PREMIUM
 * Componente de lista virtualizada otimizada para grandes volumes de dados
 */

interface VirtualizedListProps<T = any> {
  /** Array de itens para renderizar */
  items: T[];
  /** Altura de cada item (para FixedSizeList) */
  itemHeight?: number;
  /** Função para calcular altura do item (para VariableSizeList) */
  getItemHeight?: (index: number) => number;
  /** Altura total do container */
  height: number;
  /** Largura do container */
  width?: number | string;
  /** Componente para renderizar cada item */
  renderItem: (props: { item: T; index: number; style: CSSProperties }) => React.ReactNode;
  /** Se está carregando dados */
  loading?: boolean;
  /** Número de skeletons para loading */
  skeletonCount?: number;
  /** Classe CSS adicional */
  className?: string;
  /** Callback quando scroll chega ao fim */
  onEndReached?: () => void;
  /** Threshold para trigger onEndReached */
  endReachedThreshold?: number;
  /** Se deve usar VariableSizeList */
  variableSize?: boolean;
}

/**
 * Componente interno para renderizar item
 */
const ItemRenderer = memo(({ 
  index, 
  style, 
  data 
}: ListChildComponentProps & { 
  data: { 
    items: any[]; 
    renderItem: VirtualizedListProps['renderItem'] 
  } 
}) => {
  const { items, renderItem } = data;
  const item = items[index];

  if (!item) {
    return (
      <div style={style} className="flex items-center p-4">
        <Skeleton className="w-full h-12" />
      </div>
    );
  }

  return (
    <div style={style}>
      {renderItem({ item, index, style })}
    </div>
  );
});

ItemRenderer.displayName = 'VirtualizedListItem';

/**
 * Lista virtualizada premium com otimizações avançadas
 * 
 * @example
 * ```tsx
 * const MeuComponente = () => {
 *   const items = useMemo(() => Array.from({ length: 10000 }, (_, i) => ({ 
 *     id: i, 
 *     nome: `Item ${i}` 
 *   })), []);
 * 
 *   return (
 *     <VirtualizedList
 *       items={items}
 *       height={400}
 *       itemHeight={80}
 *       renderItem={({ item, index, style }) => (
 *         <div className="p-4 border-b">
 *           <h3>{item.nome}</h3>
 *           <p>Índice: {index}</p>
 *         </div>
 *       )}
 *       onEndReached={() => console.log('Carregar mais itens')}
 *     />
 *   );
 * };
 * ```
 */
export const VirtualizedList = <T extends any = any>({
  items,
  itemHeight = 50,
  getItemHeight,
  height,
  width = '100%',
  renderItem,
  loading = false,
  skeletonCount = 10,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8,
  variableSize = false
}: VirtualizedListProps<T>) => {
  
  // Dados otimizados para o renderizador
  const itemData = useMemo(() => ({
    items,
    renderItem
  }), [items, renderItem]);

  // Handler para scroll
  const handleScroll = useMemo(() => {
    if (!onEndReached) return undefined;
    
    return ({ scrollTop, scrollHeight, clientHeight }: any) => {
      const scrolled = scrollTop + clientHeight;
      const threshold = scrollHeight * endReachedThreshold;
      
      if (scrolled >= threshold) {
        onEndReached();
      }
    };
  }, [onEndReached, endReachedThreshold]);

  // Loading skeleton
  if (loading && items.length === 0) {
    return (
      <div className={`space-y-2 ${className}`} style={{ height, width }}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <Skeleton key={i} className="w-full h-12" />
        ))}
      </div>
    );
  }

  // Renderizar lista variável ou fixa
  if (variableSize && getItemHeight) {
    return (
      <VariableSizeList
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={getItemHeight}
        itemData={itemData}
        className={className}
        onScroll={handleScroll}
      >
        {ItemRenderer}
      </VariableSizeList>
    );
  }

  return (
    <List
      height={height}
      width={width}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={itemData}
      className={className}
      onScroll={handleScroll}
    >
      {ItemRenderer}
    </List>
  );
};

/**
 * Hook para virtualização inteligente
 * Decide automaticamente quando usar virtualização baseado no número de itens
 */
export const useSmartVirtualization = <T>(
  items: T[], 
  threshold: number = 100
) => {
  const shouldVirtualize = useMemo(() => 
    items.length > threshold, 
    [items.length, threshold]
  );

  return {
    shouldVirtualize,
    virtualizedProps: shouldVirtualize ? {
      height: 400,
      itemHeight: 60
    } : null
  };
};

export default VirtualizedList;