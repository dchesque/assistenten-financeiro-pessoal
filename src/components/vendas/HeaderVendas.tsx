import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, ShoppingCart, Target, TrendingDown, Plus, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatarMoeda } from "@/utils/formatters";
import { EstatisticasVendas } from "@/types/venda";

interface HeaderVendasProps {
  estatisticas: EstatisticasVendas;
  onExportarCSV: () => void;
}

export function HeaderVendas({ estatisticas, onExportarCSV }: HeaderVendasProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Vendas e Receitas</h1>
          <p className="text-gray-600">Gestão de receitas e análise de vendas</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/nova-venda')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Venda
          </Button>
          
          <Button
            onClick={() => navigate('/importar-vendas')}
            variant="outline"
            className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl hover:bg-white/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          
          <Button
            onClick={onExportarCSV}
            variant="outline"
            className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl hover:bg-white/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Faturamento Mensal */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Faturamento Mensal
            </CardTitle>
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatarMoeda(estatisticas.faturamento_mensal)}
            </div>
            <div className="text-sm text-gray-600">Faturamento do mês</div>
            <Badge className="bg-green-100/80 text-green-700 border border-green-200/50 rounded-full backdrop-blur-sm">
              +{estatisticas.faturamento_crescimento}% vs mês anterior
            </Badge>
          </CardContent>
        </Card>

        {/* Vendas Realizadas */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Vendas Realizadas
            </CardTitle>
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            <div className="text-2xl font-bold text-gray-900">
              {estatisticas.vendas_realizadas}
            </div>
            <div className="text-sm text-gray-600">
              {estatisticas.vendas_por_dia}/dia em média
            </div>
            <Badge className="bg-blue-100/80 text-blue-700 border border-blue-200/50 rounded-full backdrop-blur-sm">
              Meta: 100 vendas/mês
            </Badge>
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
              {formatarMoeda(estatisticas.ticket_medio)}
            </div>
            <div className="text-sm text-gray-600">Por venda</div>
            <Badge className="bg-purple-100/80 text-purple-700 border border-purple-200/50 rounded-full backdrop-blur-sm">
              +{estatisticas.ticket_crescimento}% vs mês anterior
            </Badge>
          </CardContent>
        </Card>

        {/* Devoluções */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Devoluções
            </CardTitle>
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatarMoeda(estatisticas.devolucoes_valor)}
            </div>
            <div className="text-sm text-gray-600">
              {estatisticas.devolucoes_percentual}% do faturamento
            </div>
            <Badge className="bg-red-100/80 text-red-700 border border-red-200/50 rounded-full backdrop-blur-sm">
              Meta: &lt; 2%
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}