
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface TotalAnual {
  receitaLiquida: number;
  lucroBruto: number;
  resultadoLiquido: number;
}

interface AnnualSummaryCardsProps {
  ano: number;
  totalAnual: TotalAnual;
  margemBrutaMedia: number;
  margemLiquidaMedia: number;
  formatarMoeda: (valor: number) => string;
}

export function AnnualSummaryCards({ 
  ano, 
  totalAnual, 
  margemBrutaMedia, 
  margemLiquidaMedia, 
  formatarMoeda 
}: AnnualSummaryCardsProps) {
  
  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  const obterCorResultado = (valor: number) => {
    return valor >= 0 ? 'text-emerald-600' : 'text-red-600';
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Calendar className="w-5 h-5 text-blue-600" />
          Resumo Anual - {ano}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1">
            <p className="text-sm text-muted-foreground font-medium">Receita Líquida</p>
            <p className="text-2xl font-bold text-blue-700">{formatarMoeda(totalAnual.receitaLiquida)}</p>
          </div>
          <div className="lg:col-span-1">
            <p className="text-sm text-muted-foreground font-medium">Lucro Bruto</p>
            <p className="text-2xl font-bold text-emerald-700">{formatarMoeda(totalAnual.lucroBruto)}</p>
          </div>
          <div className="lg:col-span-1">
            <p className="text-sm text-muted-foreground font-medium">Resultado Líquido</p>
            <p className={`text-2xl font-bold ${obterCorResultado(totalAnual.resultadoLiquido)}`}>
              {formatarMoeda(totalAnual.resultadoLiquido)}
            </p>
          </div>
          <div className="lg:col-span-1">
            <p className="text-sm text-muted-foreground font-medium">Margem Bruta Média</p>
            <p className="text-2xl font-bold text-purple-700">{formatarPercentual(margemBrutaMedia)}</p>
          </div>
          <div className="lg:col-span-1">
            <p className="text-sm text-muted-foreground font-medium">Margem Líquida Média</p>
            <p className="text-2xl font-bold text-orange-700">{formatarPercentual(margemLiquidaMedia)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
