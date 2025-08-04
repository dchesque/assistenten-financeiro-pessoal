import { Skeleton } from "@/components/ui/skeleton";

// Skeleton para cards de estatísticas
export const PlanoContasCardSkeleton = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
};

// Skeleton para tabela hierárquica
export const PlanoContasTableSkeleton = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
      <div className="p-6 border-b border-gray-200/50">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="p-6 space-y-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
            {/* Indentação hierárquica */}
            <div style={{ marginLeft: `${(index % 3) * 20}px` }}>
              <div className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading state para modal
export const PlanoContasModalSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Formulário */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-xl p-4">
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-3">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};

// Skeleton para dropdown hierárquico
export const HierarquiaSelectSkeleton = () => {
  return (
    <div className="space-y-2">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="flex items-center space-x-3 py-2 px-3">
          <div style={{ marginLeft: `${(index % 3) * 16}px` }}>
            <div className="flex items-center space-x-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton para cards de contas
export const PlanoContasCardListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="w-8 h-8 rounded" />
          </div>
          
          <div className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton para filtros
export const PlanoContasFiltrosSkeleton = () => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-28" />
    </div>
  );
};