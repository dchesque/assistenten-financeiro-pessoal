import { memo, useMemo, CSSProperties } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 📦 LISTA VIRTUALIZADA PREMIUM
 * Componente de lista virtualizada otimizada para grandes volumes de dados
 */

interface VirtualizedListProps {
  /** Array de itens para renderizar */
  items: any[];
  /** Altura de cada item */
  itemHeight?: number;
  /** Altura total do container */
  height: number;
  /** Largura do container */
  width?: number | string;
  /** Componente para renderizar cada item */
  renderItem: (props: { item: any; index: number; style: CSSProperties }) => React.ReactNode;
  /** Se está carregando dados */
  loading?: boolean;
  /** Número de skeletons para loading */
  skeletonCount?: number;
  /** Classe CSS adicional */
  className?: string;
  /** Callback quando scroll chega ao fim */
  onEndReached?: () => void;
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
 */
export const VirtualizedList = ({
  items,
  itemHeight = 50,
  height,
  width = '100%',
  renderItem,
  loading = false,
  skeletonCount = 10,
  className = '',
  onEndReached
}: VirtualizedListProps) => {
  
  // Dados otimizados para o renderizador
  const itemData = useMemo(() => ({
    items,
    renderItem
  }), [items, renderItem]);

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

  return (
    <List
      height={height}
      width={width}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={itemData}
      className={className}
    >
      {ItemRenderer}
    </List>
  );
};

/**
 * Hook para virtualização inteligente
 */
export const useSmartVirtualization = (
  items: any[], 
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