import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Search,
  Filter
} from 'lucide-react';
import { useVendasSupabaseAtualizado } from '@/hooks/useVendasSupabaseAtualizado';
import { useVendas } from '@/hooks/useVendas';
import { NotificacoesVendas } from '@/components/vendas/NotificacoesVendas';
import { FiltrosInteligentesVendas } from '@/components/vendas/FiltrosInteligentesVendas';
import { RelatorioAvancadoModal } from '@/components/vendas/RelatorioAvancadoModal';
import { formatarMoeda } from '@/utils/formatters';
import { type VendaCompleta } from '@/types/venda';

export default function ConsultarVendasAtualizada() {
  const navigate = useNavigate();
  const {
    vendas,
    estatisticas,
    loading,
    filtros,
    setFiltros,
    carregarVendas
  } = useVendasSupabaseAtualizado();
  
  const { atualizarVenda, excluirVenda, criarVenda } = useVendas();

  // Estados dos modais
  const [relatorioModalOpen, setRelatorioModalOpen] = useState(false);
  const [vendaVisualizarModal, setVendaVisualizarModal] = useState<VendaCompleta | null>(null);
  const [vendaEditarModal, setVendaEditarModal] = useState<VendaCompleta | null>(null);
  const [vendaDuplicarModal, setVendaDuplicarModal] = useState<VendaCompleta | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    carregarVendas();
  }, []);

  // Handlers dos modais
  const handleVisualizarVenda = (venda: VendaCompleta) => {
    setVendaVisualizarModal(venda);
  };

  const handleEditarVenda = (venda: VendaCompleta) => {
    setVendaEditarModal(venda);
  };

  const handleDuplicarVenda = (venda: VendaCompleta) => {
    setVendaDuplicarModal(venda);
  };

  const handleSalvarVenda = async (dados: any) => {
    if (vendaEditarModal) {
      const sucesso = await atualizarVenda(vendaEditarModal.id, dados);
      if (sucesso) {
        setVendaEditarModal(null);
        carregarVendas();
      }
      return sucesso;
    }
    return false;
  };

  const handleDuplicar = async (dados: any) => {
    const sucesso = await criarVenda(dados);
    if (sucesso) {
      setVendaDuplicarModal(null);
      carregarVendas();
    }
    return sucesso;
  };

  const handleExcluirVenda = async (id: number) => {
    const sucesso = await excluirVenda(id);
    if (sucesso) {
      carregarVendas();
    }
    return sucesso;
  };

  const calcularPercentualCrescimento = () => {
    if (!estatisticas) return 0;
    return estatisticas.crescimentoMensal;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-4 lg:p-8">
      {/* Background blur abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Consultar Vendas</h1>
            <p className="text-gray-600 mt-1">Gerencie e analise suas vendas com filtros inteligentes</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setRelatorioModalOpen(true)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Relatório Avançado
            </Button>
            
            <Button
              onClick={() => navigate('/nova-venda')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {formatarMoeda(estatisticas.receitaLiquida)}
                </div>
                <p className={`text-xs mt-1 flex items-center ${
                  calcularPercentualCrescimento() >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {calcularPercentualCrescimento().toFixed(1)}% vs mês anterior
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Total Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {estatisticas.totalVendas.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {estatisticas.vendasHoje} vendas hoje
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {formatarMoeda(estatisticas.ticketMedio)}
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Por venda
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Top Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-orange-900 truncate">
                  {estatisticas.topVendedor || 'N/A'}
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Melhor do período
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Coluna principal - Tabela e filtros */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filtros Inteligentes */}
            <FiltrosInteligentesVendas
              filtros={filtros}
              onFiltrosChange={setFiltros}
              totalResultados={vendas.length}
              loading={loading}
            />

            {/* Tabela de Vendas */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span>Vendas Encontradas</span>
                    <Badge variant="outline" className="ml-2">
                      {vendas.length}
                    </Badge>
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => carregarVendas()}
                      disabled={loading}
                      className="text-xs"
                    >
                      {loading ? 'Carregando...' : 'Atualizar'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {/* Tabela temporária - usar TabelaVendas existente por enquanto */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Data</th>
                        <th className="text-left p-3">Cliente</th>
                        <th className="text-left p-3">Valor</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.map((venda) => (
                        <tr key={venda.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">{venda.data_venda}</td>
                          <td className="p-3">{venda.cliente_nome}</td>
                          <td className="p-3">{formatarMoeda(venda.valor_final)}</td>
                          <td className="p-3">{venda.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Notificações */}
          <div className="lg:col-span-1">
            <NotificacoesVendas />
          </div>
        </div>
      </div>

      {/* Modals */}
      <RelatorioAvancadoModal
        open={relatorioModalOpen}
        onOpenChange={setRelatorioModalOpen}
      />

      {/* Modals de vendas serão implementados na próxima fase */}
    </div>
  );
}