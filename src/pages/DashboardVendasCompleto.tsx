import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  BarChart3,
  Target,
  TrendingUp,
  FileText,
  Users,
  DollarSign
} from 'lucide-react';
import { useVendasSupabaseAtualizado } from '@/hooks/useVendasSupabaseAtualizado';
import { DashboardAvancado } from '@/components/vendas/DashboardAvancado';
import { MetasPerformance } from '@/components/vendas/MetasPerformance';
import { NotificacoesVendas } from '@/components/vendas/NotificacoesVendas';
import { FiltrosInteligentesVendas } from '@/components/vendas/FiltrosInteligentesVendas';
import { RelatorioAvancadoModal } from '@/components/vendas/RelatorioAvancadoModal';
import { formatarMoeda } from '@/utils/formatters';

export default function DashboardVendasCompleto() {
  const navigate = useNavigate();
  const {
    vendas,
    estatisticas,
    loading,
    filtros,
    setFiltros,
    carregarVendas
  } = useVendasSupabaseAtualizado();

  const [relatorioModalOpen, setRelatorioModalOpen] = useState(false);
  const [tabAtiva, setTabAtiva] = useState('dashboard');

  // Carregar dados iniciais
  useEffect(() => {
    carregarVendas();
  }, []);

  // Extrair vendedores únicos
  const vendedores = React.useMemo(() => {
    const vendedoresUnicos = [...new Set(vendas.map(v => v.vendedor).filter(Boolean))];
    return vendedoresUnicos as string[];
  }, [vendas]);

  const estatisticasGerais = React.useMemo(() => {
    if (!estatisticas) return null;

    return {
      receitaTotal: estatisticas.receitaLiquida,
      crescimentoMensal: estatisticas.crescimentoMensal,
      totalVendas: estatisticas.totalVendas,
      ticketMedio: estatisticas.ticketMedio,
      vendasHoje: estatisticas.vendasHoje,
      topVendedor: estatisticas.topVendedor
    };
  }, [estatisticas]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-4 lg:p-8">
      {/* Background blur abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Vendas</h1>
            <p className="text-gray-600 mt-1">Análise completa e gestão de performance</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setRelatorioModalOpen(true)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              Relatórios
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

        {/* KPIs Resumo */}
        {estatisticasGerais && (
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
                  {formatarMoeda(estatisticasGerais.receitaTotal)}
                </div>
                <p className={`text-xs mt-1 flex items-center ${
                  estatisticasGerais.crescimentoMensal >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {estatisticasGerais.crescimentoMensal.toFixed(1)}% vs mês anterior
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
                  {estatisticasGerais.totalVendas.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {estatisticasGerais.vendasHoje} vendas hoje
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
                  {formatarMoeda(estatisticasGerais.ticketMedio)}
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Por venda
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Top Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-orange-900 truncate">
                  {estatisticasGerais.topVendedor || 'N/A'}
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Melhor do mês
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navegação por Abas */}
        <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-1 border border-white/20">
            <TabsList className="grid w-full grid-cols-3 bg-transparent">
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="metas"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Target className="w-4 h-4 mr-2" />
                Metas e Performance
              </TabsTrigger>
              <TabsTrigger 
                value="vendas"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Consultar Vendas
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Conteúdo das Abas */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <DashboardAvancado />
              </div>
              <div className="lg:col-span-1">
                <NotificacoesVendas />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metas" className="space-y-6">
            <MetasPerformance 
              vendedores={vendedores}
              vendas={vendas}
            />
          </TabsContent>

          <TabsContent value="vendas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                {/* Filtros */}
                <FiltrosInteligentesVendas
                  filtros={filtros}
                  onFiltrosChange={setFiltros}
                  totalResultados={vendas.length}
                  loading={loading}
                />

                {/* Tabela Simplificada */}
                <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <span>Vendas Recentes</span>
                        <Badge variant="outline" className="ml-2">
                          {vendas.length}
                        </Badge>
                      </span>
                      <Button
                        onClick={() => navigate('/consultar-vendas')}
                        variant="outline"
                        size="sm"
                      >
                        Ver Todas
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse flex space-x-4">
                            <div className="rounded-full bg-gray-200 h-8 w-8"></div>
                            <div className="flex-1 space-y-2 py-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {vendas.slice(0, 10).map((venda) => (
                          <div key={venda.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                  {venda.cliente_nome?.charAt(0) || 'C'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">{venda.cliente_nome}</div>
                                <div className="text-xs text-gray-600">
                                  {venda.data_venda} • {venda.vendedor || 'Sem vendedor'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm">{formatarMoeda(venda.valor_final)}</div>
                              <div className="text-xs text-gray-600">{venda.forma_pagamento}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-1">
                <NotificacoesVendas />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Relatório */}
      <RelatorioAvancadoModal
        open={relatorioModalOpen}
        onOpenChange={setRelatorioModalOpen}
      />
    </div>
  );
}