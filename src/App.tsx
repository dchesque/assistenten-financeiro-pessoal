import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from "sonner";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingStates } from '@/components/ui/LoadingStates';
import { Layout } from '@/components/layout/Layout';

// Páginas críticas (carregamento imediato)
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Lazy loading das páginas
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ContasPagar = lazy(() => import('@/pages/ContasPagar'));
const ContasReceber = lazy(() => import('@/pages/ContasReceber'));
const Fornecedores = lazy(() => import('@/pages/Fornecedores'));
const Bancos = lazy(() => import('@/pages/Bancos'));
const Settings = lazy(() => import('@/pages/Settings'));
const Categorias = lazy(() => import('@/pages/Categorias'));
const CategoriasUnificadas = lazy(() => import('@/pages/CategoriasUnificadas'));
const Cheques = lazy(() => import('@/pages/Cheques'));
const ContaIndividual = lazy(() => import('@/pages/ContaIndividual'));
const Contatos = lazy(() => import('@/pages/Contatos'));
const Credores = lazy(() => import('@/pages/Credores'));
const DRE = lazy(() => import('@/pages/DRE'));
const DesignSystemPreview = lazy(() => import('@/pages/DesignSystemPreview'));
const IntegracaoModulos = lazy(() => import('@/pages/IntegracaoModulos'));
const LancamentoLote = lazy(() => import('@/pages/LancamentoLote'));

const MonitoramentoPerformance = lazy(() => import('@/pages/MonitoramentoPerformance'));
const NovaEntrada = lazy(() => import('@/pages/NovaEntrada'));
const Pagadores = lazy(() => import('@/pages/Pagadores'));
const ProgressoImplementacao = lazy(() => import('@/pages/ProgressoImplementacao'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const RelatoriosGerais = lazy(() => import('@/pages/RelatoriosGerais'));
const StatusSistema = lazy(() => import('@/pages/StatusSistema'));
const TesteIntegracao = lazy(() => import('@/pages/TesteIntegracao'));
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
              <Route path="/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
              <Route path="/bancos" element={<ProtectedRoute><Layout><Bancos /></Layout></ProtectedRoute>} />
              <Route path="/categorias" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
              <Route path="/categorias-unificadas" element={<ProtectedRoute><Layout><CategoriasUnificadas /></Layout></ProtectedRoute>} />
              <Route path="/cheques" element={<ProtectedRoute><Layout><Cheques /></Layout></ProtectedRoute>} />
              <Route path="/conta-individual" element={<ProtectedRoute><Layout><ContaIndividual /></Layout></ProtectedRoute>} />
              <Route path="/contatos" element={<ProtectedRoute><Layout><Contatos /></Layout></ProtectedRoute>} />
              <Route path="/credores" element={<ProtectedRoute><Layout><Credores /></Layout></ProtectedRoute>} />
              <Route path="/dre" element={<ProtectedRoute><Layout><DRE /></Layout></ProtectedRoute>} />
              <Route path="/design-system" element={<ProtectedRoute><Layout><DesignSystemPreview /></Layout></ProtectedRoute>} />
              <Route path="/integracao-modulos" element={<ProtectedRoute><Layout><IntegracaoModulos /></Layout></ProtectedRoute>} />
              <Route path="/lancamento-lote" element={<ProtectedRoute><Layout><LancamentoLote /></Layout></ProtectedRoute>} />
              
              <Route path="/monitoramento-performance" element={<ProtectedRoute><Layout><MonitoramentoPerformance /></Layout></ProtectedRoute>} />
              <Route path="/nova-entrada" element={<ProtectedRoute><Layout><NovaEntrada /></Layout></ProtectedRoute>} />
              <Route path="/pagadores" element={<ProtectedRoute><Layout><Pagadores /></Layout></ProtectedRoute>} />
              <Route path="/progresso-implementacao" element={<ProtectedRoute><Layout><ProgressoImplementacao /></Layout></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Layout><Relatorios /></Layout></ProtectedRoute>} />
              <Route path="/relatorios-gerais" element={<ProtectedRoute><Layout><RelatoriosGerais /></Layout></ProtectedRoute>} />
              <Route path="/status-sistema" element={<ProtectedRoute><Layout><StatusSistema /></Layout></ProtectedRoute>} />
              <Route path="/teste-integracao" element={<ProtectedRoute><Layout><TesteIntegracao /></Layout></ProtectedRoute>} />
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
