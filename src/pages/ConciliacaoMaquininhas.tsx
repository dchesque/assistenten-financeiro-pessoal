import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { useMaquininhas } from '@/hooks/useMaquininhas';
import { formatarMoeda } from '@/utils/formatters';
import { CreditCard, TrendingUp, DollarSign, AlertTriangle, Plus, Upload, BarChart3 } from 'lucide-react';

export default function ConciliacaoMaquininhas() {
  const { obterDashboardData, loading } = useMaquininhas();
  const [dashboardData, setDashboardData] = useState({
    maquininhasAtivas: 0,
    taxaConciliacao: 0,
    recebidoMes: 0,
    taxasPagas: 0,
    ultimasConciliacoes: []
  });

  useEffect(() => {
    const carregarDashboard = async () => {
      const data = await obterDashboardData();
      setDashboardData(data);
    };
    carregarDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl"></div>
      </div>

      <PageHeader
        breadcrumb={createBreadcrumb('/conciliacao-maquininhas')}
        title="Conciliação de Maquininhas"
        subtitle="Gerencie suas maquininhas e automatize a conciliação de recebimentos • Controle financeiro"
      />

      <div className="relative p-4 lg:p-8">
        {/* Cards de métricas e ações */}
        <div className="flex gap-3 mb-8">
          <Button 
            variant="outline"
            className="bg-white/80 hover:bg-white/90 border-purple-200 hover:border-purple-300"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button 
            variant="outline"
            className="bg-white/80 hover:bg-white/90 border-blue-200 hover:border-blue-300"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Extratos
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Maquininha
          </Button>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Maquininhas Ativas
              </CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.maquininhasAtivas}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Operadoras conectadas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Taxa de Conciliação
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.taxaConciliacao.toFixed(1)}%
              </div>
              <p className="text-xs text-green-600 mt-1">
                ↗️ +2.1% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Recebido este Mês
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatarMoeda(dashboardData.recebidoMes)}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                ↗️ +8.2% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Taxas Pagas
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatarMoeda(dashboardData.taxasPagas)}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                3,95% do volume total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seções principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Últimas Conciliações */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                📊 Últimas Conciliações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.ultimasConciliacoes.map((conciliacao) => (
                  <div key={conciliacao.id} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Período: {conciliacao.periodo}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatarMoeda(conciliacao.total_vendas)} processados
                      </p>
                    </div>
                    <Badge 
                      className={
                        conciliacao.status === 'ok' 
                          ? 'bg-green-100/80 text-green-700' 
                          : 'bg-red-100/80 text-red-700'
                      }
                    >
                      {conciliacao.status === 'ok' ? '✅ Conciliado' : '⚠️ Divergência'}
                    </Badge>
                  </div>
                ))}
                {dashboardData.ultimasConciliacoes.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma conciliação realizada ainda</p>
                    <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600">
                      Fazer primeira conciliação
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                ⚡ Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <Plus className="w-6 h-6 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Cadastrar Maquininha</p>
                      <p className="text-sm text-gray-600">Adicionar nova operadora</p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-16 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200 hover:from-blue-100 hover:to-green-100"
                >
                  <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Upload de Extratos</p>
                      <p className="text-sm text-gray-600">Processar conciliação</p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-16 bg-gradient-to-r from-green-50 to-yellow-50 border-green-200 hover:from-green-100 hover:to-yellow-100"
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Relatórios de Taxas</p>
                      <p className="text-sm text-gray-600">Analisar custos por operadora</p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-16 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:from-orange-100 hover:to-red-100"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Lançar Taxas Mensais</p>
                      <p className="text-sm text-gray-600">Gerar contas a pagar</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}