import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  Plus,
  Eye,
  ArrowRight,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { KPICard } from '@/components/dashboard/KPICard';
import { AcoesRapidas } from '@/components/dashboard/AcoesRapidas';
import { useDashboard } from '@/hooks/useDashboard';
import { formatarMoeda } from '@/utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { summary, loading, error, recarregar } = useDashboard();

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="space-y-8">
          {/* Header com loading */}
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>

          {/* Skeleton dos cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={recarregar}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 lg:p-8">
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard não disponível</h3>
          <p className="text-gray-600">Dados do dashboard não puderam ser carregados</p>
        </div>
      </div>
    );
  }

  const { saldo_total, contas_pagar, contas_receber } = summary;

  // Calcular fluxo líquido do mês
  const fluxoLiquido = contas_receber.valor_recebido_mes - contas_pagar.valor_pago_mes;

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral das suas finanças pessoais
          </p>
        </div>
        <Button onClick={recarregar} variant="outline">
          <TrendingUp className="w-4 h-4 mr-2" />
          Atualizar dados
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          titulo="Saldo Total"
          valor={formatarMoeda(saldo_total)}
          icone={<DollarSign className="w-6 h-6" />}
          gradiente="from-blue-600 to-blue-700"
          status={saldo_total >= 0 ? 'saudavel' : 'critico'}
          subtitulo="Saldo atual em bancos"
        />

        <KPICard
          titulo="Contas a Pagar"
          valor={formatarMoeda(contas_pagar.valor_pendente)}
          icone={<AlertTriangle className="w-6 h-6" />}
          gradiente="from-orange-500 to-orange-600"
          status="atencao"
          subtitulo={`${contas_pagar.pendentes} conta${contas_pagar.pendentes !== 1 ? 's' : ''} pendente${contas_pagar.pendentes !== 1 ? 's' : ''}`}
        />

        <KPICard
          titulo="Contas a Receber"
          valor={formatarMoeda(contas_receber.valor_pendente)}
          icone={<CheckCircle className="w-6 h-6" />}
          gradiente="from-green-500 to-green-600"
          status="saudavel"
          subtitulo={`${contas_receber.pendentes} conta${contas_receber.pendentes !== 1 ? 's' : ''} pendente${contas_receber.pendentes !== 1 ? 's' : ''}`}
        />

        <KPICard
          titulo="Fluxo do Mês"
          valor={formatarMoeda(fluxoLiquido)}
          icone={<TrendingUp className="w-6 h-6" />}
          gradiente={fluxoLiquido >= 0 ? "from-green-500 to-green-600" : "from-red-500 to-red-600"}
          status={fluxoLiquido >= 0 ? 'saudavel' : 'critico'}
          subtitulo="Receitas - Despesas"
        />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Contas Pendentes */}
        <MetricCard
          titulo="Contas Pendentes"
          valor={contas_pagar.pendentes}
          formato="numero"
          icone={<Calendar className="w-6 h-6 text-blue-600" />}
          cor="blue"
        />

        {/* Contas Vencidas */}
        <MetricCard
          titulo="Contas Vencidas"
          valor={contas_pagar.vencidas}
          formato="numero"
          icone={<AlertTriangle className="w-6 h-6 text-red-600" />}
          cor="red"
        />

        {/* Receitas Pendentes */}
        <MetricCard
          titulo="Receitas Pendentes"
          valor={contas_receber.pendentes}
          formato="numero"
          icone={<CheckCircle className="w-6 h-6 text-green-600" />}
          cor="green"
        />

        {/* Pagas no Mês */}
        <MetricCard
          titulo="Pagas no Mês"
          valor={contas_pagar.pagas_mes}
          formato="numero"
          icone={<CheckCircle className="w-6 h-6 text-blue-600" />}
          cor="blue"
        />
      </div>

      {/* Ações Rápidas */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AcoesRapidas />
        </CardContent>
      </Card>

      {/* Cards de navegação rápida */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => navigate('/contas-pagar')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Gerenciar Contas a Pagar</h3>
                <p className="text-blue-700 text-sm">
                  Visualize e gerencie todas as suas contas a pagar
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => navigate('/contas-receber')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Gerenciar Contas a Receber</h3>
                <p className="text-green-700 text-sm">
                  Controle suas receitas e valores a receber
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => navigate('/categorias')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-900 mb-2">Configurar Categorias</h3>
                <p className="text-purple-700 text-sm">
                  Organize suas despesas por categorias
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}