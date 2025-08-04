
import { Card, CardContent } from "@/components/ui/card";
import { 
  DollarSign,
  BarChart3,
  Target,
  PieChart
} from "lucide-react";

interface IndicadoresPrincipaisProps {
  receitaLiquida: number;
  lucroBruto: number;
  resultadoLiquido: number;
  margemLiquida: number;
}

export function IndicadoresPrincipais({ 
  receitaLiquida, 
  lucroBruto, 
  resultadoLiquido, 
  margemLiquida 
}: IndicadoresPrincipaisProps) {
  
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Receita Líquida */}
      <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Receita Líquida</p>
              <p className="text-2xl font-bold text-blue-900">{formatarMoeda(receitaLiquida)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lucro Bruto */}
      <Card className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 backdrop-blur-sm border border-emerald-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Lucro Bruto</p>
              <p className="text-2xl font-bold text-emerald-900">{formatarMoeda(lucroBruto)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultado Líquido */}
      <Card className={`bg-gradient-to-br ${
        resultadoLiquido >= 0 
          ? 'from-purple-50/80 to-purple-100/40 border-purple-200/50' 
          : 'from-red-50/80 to-red-100/40 border-red-200/50'
      } backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              resultadoLiquido >= 0 ? 'bg-purple-600' : 'bg-red-600'
            }`}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`text-sm font-medium ${
                resultadoLiquido >= 0 ? 'text-purple-700' : 'text-red-700'
              }`}>Resultado Líquido</p>
              <p className={`text-2xl font-bold ${
                resultadoLiquido >= 0 ? 'text-purple-900' : 'text-red-900'
              }`}>{formatarMoeda(resultadoLiquido)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margem Líquida */}
      <Card className="bg-gradient-to-br from-orange-50/80 to-orange-100/40 backdrop-blur-sm border border-orange-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">Margem Líquida</p>
              <p className="text-2xl font-bold text-orange-900">{formatarPercentual(margemLiquida)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
