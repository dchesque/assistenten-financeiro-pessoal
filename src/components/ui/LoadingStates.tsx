import React from 'react';
import { Building, User } from 'lucide-react';
import { GLASSMORPHISM, ANIMATIONS, UTILS } from '@/constants/designSystem';

// Skeleton para card de fornecedor
export const FornecedorCardSkeleton = () => {
  return (
    <div className={`${GLASSMORPHISM.card} p-6 ${ANIMATIONS.pulse}`}>
      {/* Header do card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
      </div>

      {/* Informações */}
      <div className="space-y-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded flex-1"></div>
          </div>
        ))}
      </div>

      {/* Estatísticas */}
      <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex space-x-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-8 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
};

// Grid de cards skeleton
interface FornecedorCardSkeletonGridProps {
  count?: number;
}

export const FornecedorCardSkeletonGrid: React.FC<FornecedorCardSkeletonGridProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <FornecedorCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Skeleton para modal de fornecedor
export const FornecedorModalSkeleton = () => {
  return (
    <div className={ANIMATIONS.pulse}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
          <div className="h-5 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Tipo de Pessoa */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Nome */}
        <div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-16"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>

        {/* Tipo Fornecedor */}
        <div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
          <div className="flex space-x-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Conta Padrão */}
        <div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-40"></div>
          <div className="flex space-x-2">
            <div className="flex-1 h-12 bg-gray-200 rounded"></div>
            <div className="w-24 h-12 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Contato */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded mb-2 w-16"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded mb-2 w-12"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-3 p-6 border-t border-white/20">
        <div className="w-20 h-10 bg-gray-200 rounded"></div>
        <div className="w-16 h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

// Skeleton para tabela de fornecedores
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 7 }) => {
  return (
    <div className={`${GLASSMORPHISM.card} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/20">
          {/* Header */}
          <thead className="bg-gray-50/80 backdrop-blur-sm">
            <tr>
              {Array.from({ length: columns }, (_, i) => (
                <th key={i} className="px-6 py-4">
                  <div className={`h-3 bg-gray-200 rounded ${ANIMATIONS.pulse}`}></div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="bg-white/60 divide-y divide-white/20">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex} className={ANIMATIONS.pulse}>
                {Array.from({ length: columns }, (_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    {colIndex === 0 ? (
                      // Primeira coluna com avatar e nome
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                        <div>
                          <div className="h-3 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ) : colIndex === columns - 2 ? (
                      // Status badge
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    ) : colIndex === columns - 1 ? (
                      // Ações
                      <div className="flex space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    ) : (
                      // Outras colunas
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Skeleton para lista de linhas (view alternativa)
export const FornecedorTableSkeleton = () => {
  return <TableSkeleton rows={8} columns={7} />;
};

// Skeleton para estados de loading específicos
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin ${sizeClasses[size]}`}></div>
  );
};

// Estado vazio customizado
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = <Building className="w-16 h-16 text-gray-400" />, 
  title, 
  description, 
  action 
}) => {
  return (
    <div className={`${GLASSMORPHISM.card} p-12 text-center`}>
      <div className="mx-auto mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {action}
    </div>
  );
};

// Container com loading overlay
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loading, children }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className={`absolute inset-0 ${GLASSMORPHISM.overlay} flex items-center justify-center z-10 rounded-2xl`}>
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 font-medium">Carregando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton para cards simples
export const CardSkeleton = () => {
  return (
    <div className={`${GLASSMORPHISM.card} p-6 ${ANIMATIONS.pulse}`}>
      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  );
};

// Exportar todos os componentes como objeto LoadingStates
export const LoadingStates = {
  FornecedorCardSkeleton,
  FornecedorCardSkeletonGrid,
  FornecedorModalSkeleton,
  TableSkeleton,
  FornecedorTableSkeleton,
  LoadingSpinner,
  EmptyState,
  LoadingOverlay,
  CardSkeleton
};