import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
  active?: boolean;
}

interface BreadcrumbsOtimizadoProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/fornecedores': 'Fornecedores',
  '/clientes': 'Clientes',
  '/contas-pagar': 'Contas a Pagar',
  '/lancamento-lote': 'Lançamento em Lote',
  '/cheques': 'Cheques',
  '/bancos': 'Bancos',
  '/vendas': 'Vendas',
  '/nova-venda': 'Nova Venda',
  '/consultar-vendas': 'Consultar Vendas',
  '/categorias': 'Plano de Contas',
  '/dre': 'DRE',
  '/fluxo-caixa': 'Fluxo de Caixa',
  '/relatorios': 'Relatórios',
  '/settings': 'Configurações'
};

export function BreadcrumbsOtimizado({ items, showHome = true }: BreadcrumbsOtimizadoProps) {
  const location = useLocation();
  
  // Se items não foram fornecidos, gerar automaticamente baseado na rota
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname);

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {showHome && (
        <>
          <Link 
            to="/" 
            className="flex items-center hover:text-foreground transition-colors duration-200 hover:bg-white/50 px-2 py-1 rounded-md"
          >
            <Home className="w-4 h-4 mr-1" />
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </>
      )}
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />}
          
          {item.active || !item.path ? (
            <span className="font-medium text-foreground px-2 py-1 bg-blue-50/80 rounded-md">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-foreground transition-colors duration-200 hover:bg-white/50 px-2 py-1 rounded-md"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  let currentPath = '';
  
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const isLast = index === paths.length - 1;
    
    // Verificar se temos um label personalizado para esta rota
    const label = ROUTE_LABELS[currentPath] || formatPathLabel(path);
    
    breadcrumbs.push({
      label,
      path: isLast ? undefined : currentPath,
      active: isLast
    });
  });
  
  return breadcrumbs;
}

function formatPathLabel(path: string): string {
  // Converter kebab-case para Title Case em português
  return path
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Hook para facilitar o uso
export function useBreadcrumbs() {
  const location = useLocation();
  
  const setCustomBreadcrumbs = (items: BreadcrumbItem[]) => {
    return items;
  };
  
  return {
    currentPath: location.pathname,
    setCustomBreadcrumbs,
    routeLabel: ROUTE_LABELS[location.pathname] || 'Página'
  };
}