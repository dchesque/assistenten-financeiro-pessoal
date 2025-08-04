import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ContasPagar from "./pages/ContasPagar";
import BaixarContas from "./pages/BaixarContas";
import ContaIndividual from "./pages/ContaIndividual";
import LancamentoLote from "./pages/LancamentoLote";
import Fornecedores from "./pages/Fornecedores";
import PlanoContas from "./pages/PlanoContas";
import Bancos from "./pages/Bancos";
import Cheques from "./pages/Cheques";
import ConciliacaoMaquininhas from "./pages/ConciliacaoMaquininhas";
import DashboardConciliacao from "./pages/DashboardConciliacao";
import GerenciarMaquininhas from "./pages/GerenciarMaquininhas";
import UploadExtratos from "./pages/UploadExtratos";
import Relatorios from "./pages/Relatorios";
import RelatoriosGerais from "./pages/RelatoriosGerais";
import Settings from "./pages/Settings";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";

// Novas páginas para os fly-outs
import ConsultarVendas from "./pages/ConsultarVendas";
import NovaVenda from "./pages/NovaVenda";
import ImportarVendas from "./pages/ImportarVendas";
import Clientes from "./pages/Clientes";
import DRE from "./pages/DRE";
import FluxoCaixa from "./pages/FluxoCaixa";
import Vendedores from "./pages/Vendedores";
import VendedorAnalytics from "./pages/VendedorAnalytics";
import RelatoriosComissoes from "./pages/RelatoriosComissoes";

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
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/contas-pagar" element={<ProtectedRoute><Layout><ContasPagar /></Layout></ProtectedRoute>} />
          <Route path="/baixar-contas" element={<ProtectedRoute><Layout><BaixarContas /></Layout></ProtectedRoute>} />
          <Route path="/conta-individual" element={<ProtectedRoute><Layout><ContaIndividual /></Layout></ProtectedRoute>} />
          <Route path="/lancamento-lote" element={<ProtectedRoute><Layout><LancamentoLote /></Layout></ProtectedRoute>} />
          <Route path="/fornecedores" element={<ProtectedRoute><Layout><Fornecedores /></Layout></ProtectedRoute>} />
          <Route path="/categorias" element={<ProtectedRoute><Layout><PlanoContas /></Layout></ProtectedRoute>} />
          <Route path="/bancos" element={<ProtectedRoute><Layout><Bancos /></Layout></ProtectedRoute>} />
          <Route path="/cheques" element={<ProtectedRoute><Layout><Cheques /></Layout></ProtectedRoute>} />
          <Route path="/conciliacao" element={<ProtectedRoute><Layout><ConciliacaoMaquininhas /></Layout></ProtectedRoute>} />
          <Route path="/conciliacao/dashboard" element={<ProtectedRoute><Layout><DashboardConciliacao /></Layout></ProtectedRoute>} />
          <Route path="/maquininhas" element={<ProtectedRoute><Layout><GerenciarMaquininhas /></Layout></ProtectedRoute>} />
          <Route path="/conciliacao/upload" element={<ProtectedRoute><Layout><UploadExtratos /></Layout></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Layout><Relatorios /></Layout></ProtectedRoute>} />
          <Route path="/relatorios-gerais" element={<ProtectedRoute><Layout><RelatoriosGerais /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><Layout><Usuarios /></Layout></ProtectedRoute>} />
          
          {/* Rotas dos fly-outs */}
          <Route path="/consultar-vendas" element={<ProtectedRoute><Layout><ConsultarVendas /></Layout></ProtectedRoute>} />
          <Route path="/nova-venda" element={<ProtectedRoute><Layout><NovaVenda /></Layout></ProtectedRoute>} />
          <Route path="/importar-vendas" element={<ProtectedRoute><Layout><ImportarVendas /></Layout></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
          <Route path="/vendedores" element={<ProtectedRoute><Layout><Vendedores /></Layout></ProtectedRoute>} />
          <Route path="/vendedor-analytics/:id" element={<ProtectedRoute><Layout><VendedorAnalytics /></Layout></ProtectedRoute>} />
          <Route path="/relatorios-comissoes" element={<ProtectedRoute><Layout><RelatoriosComissoes /></Layout></ProtectedRoute>} />
          <Route path="/dre" element={<ProtectedRoute><Layout><DRE /></Layout></ProtectedRoute>} />
          <Route path="/fluxo-caixa" element={<ProtectedRoute><Layout><FluxoCaixa /></Layout></ProtectedRoute>} />
          
          {/* Rotas de Conciliação */}
          <Route path="/dashboard-conciliacao" element={<ProtectedRoute><Layout><DashboardConciliacao /></Layout></ProtectedRoute>} />
          <Route path="/upload-extratos" element={<ProtectedRoute><Layout><UploadExtratos /></Layout></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
