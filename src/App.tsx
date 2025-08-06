import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/hooks/useOffline";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ContasPagar from "./pages/ContasPagar";
import NovaEntrada from "./pages/NovaEntrada";
import ContaIndividual from "./pages/ContaIndividual";
import LancamentoLote from "./pages/LancamentoLote";
import Credores from "./pages/Credores";
import Bancos from "./pages/Bancos";
import Settings from "./pages/Settings";
import ContasReceber from "./pages/ContasReceber";
import Pagadores from "./pages/Pagadores";
import CategoriasUnificadas from "./pages/CategoriasUnificadas";
import Contatos from "./pages/Contatos";
import LancamentoRecorrente from "./pages/LancamentoRecorrente";
import DesignSystemPreview from "./pages/DesignSystemPreview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/contas-pagar" element={<ProtectedRoute><Layout><ContasPagar /></Layout></ProtectedRoute>} />
          <Route path="/nova-entrada" element={<ProtectedRoute><Layout><NovaEntrada /></Layout></ProtectedRoute>} />
          <Route path="/conta-individual" element={<ProtectedRoute><Layout><ContaIndividual /></Layout></ProtectedRoute>} />
          <Route path="/lancamento-lote" element={<ProtectedRoute><Layout><LancamentoLote /></Layout></ProtectedRoute>} />
          <Route path="/credores" element={<ProtectedRoute><Layout><Credores /></Layout></ProtectedRoute>} />
          <Route path="/categorias" element={<ProtectedRoute><Layout><CategoriasUnificadas /></Layout></ProtectedRoute>} />
          <Route path="/bancos" element={<ProtectedRoute><Layout><Bancos /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="/contas-receber" element={<ProtectedRoute><Layout><ContasReceber /></Layout></ProtectedRoute>} />
          <Route path="/pagadores" element={<ProtectedRoute><Layout><Pagadores /></Layout></ProtectedRoute>} />
          <Route path="/contatos" element={<ProtectedRoute><Layout><Contatos /></Layout></ProtectedRoute>} />
          <Route path="/lancamento-recorrente" element={<ProtectedRoute><Layout><LancamentoRecorrente /></Layout></ProtectedRoute>} />
          <Route path="/design-system" element={<DesignSystemPreview />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
