import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Users, RotateCcw } from "lucide-react";
import { formatarMoeda } from "@/utils/formatters";

interface DashboardAnalyticsProps {
  analytics: {
    totalVendas: number;
    faturamentoTotal: number;
    ticketMedio: number;
    crescimentoMensal: number;
    topCategorias: any[];
    topFormasPagamento: any[];
    clientesRecorrentes: number;
    taxaDevolucao: number;
  };
}

export function DashboardAnalytics({ analytics }: DashboardAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Resumo Geral */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Vendas Totais
          </CardTitle>
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {analytics.totalVendas}
          </div>
          <div className="text-sm text-gray-600">vendas realizadas</div>
          {analytics.crescimentoMensal !== 0 && (
            <Badge className={`${
              analytics.crescimentoMensal > 0 
                ? 'bg-green-100/80 text-green-700 border-green-200/50' 
                : 'bg-red-100/80 text-red-700 border-red-200/50'
            } rounded-full backdrop-blur-sm border`}>
              {analytics.crescimentoMensal > 0 ? '+' : ''}{analytics.crescimentoMensal.toFixed(1)}% vs mês anterior
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Ticket Médio */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Ticket Médio
          </CardTitle>
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {formatarMoeda(analytics.ticketMedio)}
          </div>
          <div className="text-sm text-gray-600">por venda</div>
          <Progress 
            value={Math.min((analytics.ticketMedio / 1000) * 100, 100)} 
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Clientes Recorrentes */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Clientes Fiéis
          </CardTitle>
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {analytics.clientesRecorrentes}
          </div>
          <div className="text-sm text-gray-600">clientes recorrentes</div>
          <Badge className="bg-green-100/80 text-green-700 border border-green-200/50 rounded-full backdrop-blur-sm">
            Fidelização alta
          </Badge>
        </CardContent>
      </Card>

      {/* Taxa de Devolução */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Taxa de Devolução
          </CardTitle>
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {analytics.taxaDevolucao.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">das vendas</div>
          <Badge className={`${
            analytics.taxaDevolucao < 2 
              ? 'bg-green-100/80 text-green-700 border-green-200/50' 
              : analytics.taxaDevolucao < 5
              ? 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50'
              : 'bg-red-100/80 text-red-700 border-red-200/50'
          } rounded-full backdrop-blur-sm border`}>
            {analytics.taxaDevolucao < 2 ? 'Excelente' : analytics.taxaDevolucao < 5 ? 'Boa' : 'Atenção'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}