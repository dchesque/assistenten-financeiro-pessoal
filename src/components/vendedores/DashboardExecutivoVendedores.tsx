import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Award,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useVendedores } from '@/hooks/useVendedores';
import { useVendasSupabase } from '@/hooks/useVendasSupabase';
import { useAlertasVendedores } from '@/hooks/useAlertasVendedores';
import { formatarMoeda } from '@/utils/formatters';

export const DashboardExecutivoVendedores: React.FC = () => {
  const { vendedores, resumos, loading: loadingVendedores } = useVendedores();
  const { vendas, loading: loadingVendas } = useVendasSupabase();
  const { estatisticas: alertas } = useAlertasVendedores();

  // Calcular métricas do mês atual
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const vendasMesAtual = vendas?.filter(v => {
    const dataVenda = new Date(v.data_venda);
    return dataVenda >= inicioMes && dataVenda <= fimMes && v.ativo && v.vendedor_id;
  }) || [];

  const vendasMesAnterior = vendas?.filter(v => {
    const dataVenda = new Date(v.data_venda);
    const inicioMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return dataVenda >= inicioMesAnterior && dataVenda <= fimMesAnterior && v.ativo && v.vendedor_id;
  }) || [];

  // Métricas comparativas
  const faturamentoMesAtual = vendasMesAtual.reduce((acc, v) => acc + v.valor_final, 0);
  const faturamentoMesAnterior = vendasMesAnterior.reduce((acc, v) => acc + v.valor_final, 0);
  const crescimentoFaturamento = faturamentoMesAnterior > 0 
    ? ((faturamentoMesAtual - faturamentoMesAnterior) / faturamentoMesAnterior) * 100 
    : 0;

  const vendasQuantidadeAtual = vendasMesAtual.length;
  const vendasQuantidadeAnterior = vendasMesAnterior.length;
  const crescimentoVendas = vendasQuantidadeAnterior > 0 
    ? ((vendasQuantidadeAtual - vendasQuantidadeAnterior) / vendasQuantidadeAnterior) * 100 
    : 0;

  const ticketMedioAtual = vendasQuantidadeAtual > 0 ? faturamentoMesAtual / vendasQuantidadeAtual : 0;
  const ticketMedioAnterior = vendasQuantidadeAnterior > 0 ? faturamentoMesAnterior / vendasQuantidadeAnterior : 0;
  const crescimentoTicket = ticketMedioAnterior > 0 
    ? ((ticketMedioAtual - ticketMedioAnterior) / ticketMedioAnterior) * 100 
    : 0;

  // Meta total da equipe
  const metaTotalEquipe = vendedores.reduce((acc, v) => acc + (v.meta_mensal || 0), 0);
  const percentualMetaEquipe = metaTotalEquipe > 0 ? (faturamentoMesAtual / metaTotalEquipe) * 100 : 0;

  // Top performers
  const performanceVendedores = vendedores.map(vendedor => {
    const vendasVendedor = vendasMesAtual.filter(v => v.vendedor_id === vendedor.id);
    const faturamentoVendedor = vendasVendedor.reduce((acc, v) => acc + v.valor_final, 0);
    const percentualMeta = vendedor.meta_mensal > 0 ? (faturamentoVendedor / vendedor.meta_mensal) * 100 : 0;
    
    return {
      ...vendedor,
      faturamento_mes: faturamentoVendedor,
      vendas_mes: vendasVendedor.length,
      percentual_meta: percentualMeta
    };
  }).sort((a, b) => b.faturamento_mes - a.faturamento_mes);

  const topPerformers = performanceVendedores.slice(0, 3);
  const vendedoresAcimaMeta = performanceVendedores.filter(v => v.percentual_meta >= 100).length;

  if (loadingVendedores || loadingVendas) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const getTrendIcon = (valor: number) => {
    if (valor > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (valor < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (valor: number) => {
    if (valor > 0) return 'text-green-600';
    if (valor < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* KPIs Executivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              {getTrendIcon(crescimentoFaturamento)}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Faturamento Mensal</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatarMoeda(faturamentoMesAtual)}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${getTrendColor(crescimentoFaturamento)}`}>
                  {crescimentoFaturamento > 0 ? '+' : ''}{crescimentoFaturamento.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 ml-2">vs mês anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meta da Equipe */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              {percentualMetaEquipe >= 100 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-orange-600" />}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Meta da Equipe</p>
              <p className="text-2xl font-bold text-gray-900">
                {percentualMetaEquipe.toFixed(1)}%
              </p>
              <div className="mt-2">
                <Progress value={Math.min(percentualMetaEquipe, 100)} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatarMoeda(faturamentoMesAtual)}</span>
                  <span>{formatarMoeda(metaTotalEquipe)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendedores Performance */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <Award className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Acima da Meta</p>
              <p className="text-2xl font-bold text-gray-900">
                {vendedoresAcimaMeta}/{vendedores.length}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {vendedores.length > 0 ? ((vendedoresAcimaMeta / vendedores.length) * 100).toFixed(0) : 0}% da equipe
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              {getTrendIcon(crescimentoTicket)}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatarMoeda(ticketMedioAtual)}
              </p>
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${getTrendColor(crescimentoTicket)}`}>
                  {crescimentoTicket > 0 ? '+' : ''}{crescimentoTicket.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 ml-2">vs mês anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top Performers do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.map((vendedor, index) => (
              <div key={vendedor.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{vendedor.nome}</h4>
                    <Badge 
                      variant={vendedor.percentual_meta >= 100 ? 'default' : 'secondary'}
                      className={
                        vendedor.percentual_meta >= 100 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {vendedor.percentual_meta.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">{vendedor.vendas_mes} vendas</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatarMoeda(vendedor.faturamento_mes)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status da Equipe */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Status da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alertas && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded-xl">
                    <div className="text-2xl font-bold text-red-600">
                      {alertas.vendedores_em_risco}
                    </div>
                    <div className="text-sm text-red-700">Em Risco</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">
                      {alertas.vendedores_destaque}
                    </div>
                    <div className="text-sm text-green-700">Destaque</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Alertas Críticos</span>
                    <Badge variant="destructive">
                      {alertas.alertas_criticos}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vendedores Inativos</span>
                    <Badge variant="secondary">
                      {alertas.vendedores_inativos}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total de Alertas</span>
                    <Badge variant="outline">
                      {alertas.total_alertas}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};