import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "sonner";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/layout/Layout';
import { Loader2 } from 'lucide-react';
import { StartupInitializer } from '@/components/layout/StartupInitializer';
import { SecurityGuard } from '@/components/auth/SecurityGuard';

// Páginas críticas (carregamento imediato)
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import AuthConfirm from '@/pages/AuthConfirm';
import AuthResetPassword from '@/pages/AuthResetPassword';
import NotFound from '@/pages/NotFound';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Lazy loading das páginas restantes
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ContasPagar = lazy(() => import('@/pages/ContasPagar'));
const ContasReceber = lazy(() => import('@/pages/ContasReceber'));
const Categorias = lazy(() => import('@/pages/Categorias'));
const Banks = lazy(() => import('@/pages/Banks'));

const NovaConta = lazy(() => import('@/pages/NovaConta'));
const NovoRecebimento = lazy(() => import('@/pages/NovoRecebimento'));
const Contatos = lazy(() => import('@/pages/Contatos'));
const MeuPerfil = lazy(() => import('@/pages/MeuPerfil'));
const Assinatura = lazy(() => import('@/pages/Assinatura'));
const DesignSystemPreview = lazy(() => import('@/pages/DesignSystemPreview'));

const MonitoramentoPerformance = lazy(() => import('@/pages/MonitoramentoPerformance'));
const Administrador = lazy(() => import('@/pages/Administrador'));
const UsuariosAdmin = lazy(() => import('@/pages/UsuariosAdmin'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));
// StatusSistema removido - Supabase não mais necessário

// Componente de fallback para lazy loading
const PageFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <SecurityGuard>
        <QueryClientProvider client={queryClient}>
          <StartupInitializer>
            <Router>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />
                <Route path="/auth/reset-password" element={<AuthResetPassword />} />
                <Route path="/" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/contas-pagar" element={<ProtectedRoute><Layout><ContasPagar /></Layout></ProtectedRoute>} />
                <Route path="/contas-receber" element={<ProtectedRoute><Layout><ContasReceber /></Layout></ProtectedRoute>} />
                <Route path="/bancos" element={<ProtectedRoute><Layout><Banks /></Layout></ProtectedRoute>} />
                <Route path="/nova-conta" element={<ProtectedRoute><Layout><NovaConta /></Layout></ProtectedRoute>} />
                <Route path="/novo-recebimento" element={<ProtectedRoute><Layout><NovoRecebimento /></Layout></ProtectedRoute>} />
                <Route path="/contatos" element={<ProtectedRoute><Layout><Contatos /></Layout></ProtectedRoute>} />
                <Route path="/categorias" element={<ProtectedRoute><Layout><Categorias /></Layout></ProtectedRoute>} />
                <Route path="/meu-perfil" element={<ProtectedRoute><Layout><MeuPerfil /></Layout></ProtectedRoute>} />
                <Route path="/assinatura" element={<ProtectedRoute><Layout><Assinatura /></Layout></ProtectedRoute>} />
                <Route path="/design-system" element={<ProtectedRoute><Layout><DesignSystemPreview /></Layout></ProtectedRoute>} />
                
                <Route path="/monitoramento-performance" element={<ProtectedRoute><Layout><MonitoramentoPerformance /></Layout></ProtectedRoute>} />
                <Route path="/administrador" element={<ProtectedRoute><Layout><Administrador /></Layout></ProtectedRoute>} />
                <Route path="/administrador/usuarios" element={<ProtectedRoute><Layout><UsuariosAdmin /></Layout></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster 
              position="top-right"
              expand={false}
              richColors
              closeButton
              duration={4000}
              toastOptions={{
                style: {
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                },
                className: 'sonner-toast',
              }}
            />
            </Router>
          </StartupInitializer>
        </QueryClientProvider>
      </SecurityGuard>
    </ErrorBoundary>
  );
}

export default App;