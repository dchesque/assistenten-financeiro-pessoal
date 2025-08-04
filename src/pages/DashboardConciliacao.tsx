import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { useConciliacao } from '@/hooks/useConciliacao';
import { useMaquininhas } from '@/hooks/useMaquininhas';
import { ConciliarMaquininhaModal } from '@/components/maquininhas/ConciliarMaquininhaModal';
import { NotificacoesConciliacao } from '@/components/conciliacao/NotificacoesConciliacao';
import { formatarMoeda } from '@/utils/formatters';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck,
  Plus
} from 'lucide-react';

export default function DashboardConciliacao() {
  const navigate = useNavigate();
  const { obterDashboardData } = useMaquininhas();
  const { obterEstatisticasConciliacao } = useConciliacao();
  const [dashboardData, setDashboardData] = useState({
    maquininhasAtivas: 0,
    taxaConciliacao: 0,
    recebidoMes: 0,
    taxasPagas: 0,
    ultimasConciliacoes: []
  });
  const [modalConciliacao, setModalConciliacao] = useState({
    aberto: false,
    maquininha: null,
    periodo: new Date().toISOString().slice(0, 7)
  });

  useEffect(() => {
    const carregarDados = async () => {
      const data = await obterDashboardData();
      setDashboardData(data);
    };
    carregarDados();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
      </div>

      <PageHeader
        breadcrumb={createBreadcrumb('/dashboard-conciliacao')}
        title="Dashboard de Conciliação"
        subtitle="Central de controle para conciliação de maquininhas • Análise de recebimentos"
      />

      <div className="relative p-4 lg:p-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Taxa Conciliação</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboardData.taxaConciliacao.toFixed(1)}%
              </div>
              <p className="text-xs text-green-600 mt-1">↗️ +2.1% vs anterior</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Divergências Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">5</div>
              <p className="text-xs text-orange-600 mt-1">Requer atenção</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Valor Divergente</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatarMoeda(1250.80)}
              </div>
              <p className="text-xs text-blue-600 mt-1">0.05% do total</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Conciliações Este Mês</CardTitle>
              <FileCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">15</div>
              <p className="text-xs text-purple-600 mt-1">Meta: 20</p>
            </CardContent>
          </Card>
        </div>

        {/* Últimas Conciliações */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle>Últimas Conciliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.ultimasConciliacoes.map((conciliacao) => (
                <div key={conciliacao.id} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Período: {conciliacao.periodo}</p>
                    <p className="text-sm text-gray-600">{formatarMoeda(conciliacao.total_vendas)} processados</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      conciliacao.status === 'ok' 
                        ? 'bg-green-100/80 text-green-700' 
                        : 'bg-red-100/80 text-red-700'
                    }>
                      {conciliacao.status === 'ok' ? '✅ Conciliado' : '⚠️ Divergência'}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <FileCheck className="w-4 h-4 mr-1" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ConciliarMaquininhaModal
          open={modalConciliacao.aberto}
          onOpenChange={(aberto) => setModalConciliacao(prev => ({ ...prev, aberto }))}
          maquininha={modalConciliacao.maquininha}
          periodo={modalConciliacao.periodo}
        />
      </div>
    </div>
  );
}