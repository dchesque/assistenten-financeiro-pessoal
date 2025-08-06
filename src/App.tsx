import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from "sonner";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/layout/Layout';

// Páginas críticas (carregamento imediato)
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Lazy loading das páginas restantes
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ContasPagar = lazy(() => import('@/pages/ContasPagar'));
const ContasReceber = lazy(() => import('@/pages/ContasReceber'));
const Bancos = lazy(() => import('@/pages/Bancos'));
const Settings = lazy(() => import('@/pages/Settings'));
const NovaConta = lazy(() => import('@/pages/NovaConta'));
const NovoRecebimento = lazy(() => import('@/pages/NovoRecebimento'));
const Contatos = lazy(() => import('@/pages/Contatos'));
const Categorias = lazy(() => import('@/pages/Categorias'));
const DesignSystemPreview = lazy(() => import('@/pages/DesignSystemPreview'));

const MonitoramentoPerformance = lazy(() => import('@/pages/MonitoramentoPerformance'));
const Sistema = lazy(() => import('@/pages/Sistema'));
// StatusSistema removido - Supabase não mais necessário
const Usuarios = lazy(() => import('@/pages/Usuarios'));

// Componente de fallback para lazy loading
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/contas-pagar" element={<ProtectedRoute><Layout><ContasPagar /></Layout></ProtectedRoute>} />
              <Route path="/contas-receber" element={<ProtectedRoute><Layout><ContasReceber /></Layout></ProtectedRoute>} />
              <Route path="/bancos" element={<ProtectedRoute><Layout><Bancos /></Layout></ProtectedRoute>} />
              <Route path="/nova-conta" element={<ProtectedRoute><Layout><NovaConta /></Layout></ProtectedRoute>} />
              <Route path="/novo-recebimento" element={<ProtectedRoute><Layout><NovoRecebimento /></Layout></ProtectedRoute>} />
              <Route path="/contatos" element={<ProtectedRoute><Layout><Contatos /></Layout></ProtectedRoute>} />
              <Route path="/categorias" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
              <Route path="/design-system" element={<ProtectedRoute><Layout><DesignSystemPreview /></Layout></ProtectedRoute>} />
              
              <Route path="/monitoramento-performance" element={<ProtectedRoute><Layout><MonitoramentoPerformance /></Layout></ProtectedRoute>} />
              <Route path="/sistema" element={<ProtectedRoute><Layout><Sistema /></Layout></ProtectedRoute>} />
              {/* StatusSistema removido */}
              <Route path="/usuarios" element={<ProtectedRoute><Layout><Usuarios /></Layout></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
          <SonnerToaster />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;