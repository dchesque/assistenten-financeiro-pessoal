import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, loading, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        const currentPath = window.location.pathname;
        navigate(`/auth?returnUrl=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (requireAdmin && !isAdmin) {
        navigate('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, loading, navigate, requireAdmin, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}