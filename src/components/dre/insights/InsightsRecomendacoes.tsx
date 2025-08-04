
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb
} from "lucide-react";

interface InsightsRecomendacoesProps {
  receitaLiquida: number;
  lucroBruto: number;
  resultadoLiquido: number;
  margemBruta: number;
  margemLiquida: number;
}

export function InsightsRecomendacoes({ 
  receitaLiquida,
  lucroBruto,
  resultadoLiquido, 
  margemBruta, 
  margemLiquida 
}: InsightsRecomendacoesProps) {

  const insights = [
    {
      condicao: margemBruta < 30,
      tipo: 'warning',
      titulo: 'Margem Bruta Baixa',
      descricao: 'A margem bruta está abaixo dos 30%. Revise custos de produção.',
      icone: AlertTriangle
    },
    {
      condicao: margemLiquida < 10,
      tipo: 'warning',
      titulo: 'Margem Líquida Reduzida',
      descricao: 'Margem líquida abaixo de 10%. Analise despesas operacionais.',
      icone: TrendingDown
    },
    {
      condicao: resultadoLiquido > 0 && margemLiquida > 15,
      tipo: 'success',
      titulo: 'Performance Excelente',
      descricao: 'Resultado positivo com margem líquida saudável.',
      icone: CheckCircle
    },
    {
      condicao: resultadoLiquido < 0,
      tipo: 'danger',
      titulo: 'Resultado Negativo',
      descricao: 'Empresa operando com prejuízo. Ação imediata necessária.',
      icone: AlertTriangle
    },
    {
      condicao: receitaLiquida > 0 && lucroBruto / receitaLiquida > 0.5,
      tipo: 'success',
      titulo: 'Controle de Custos Eficiente',
      descricao: 'Excelente controle dos custos dos produtos vendidos.',
      icone: TrendingUp
    }
  ];

  const insightsAtivos = insights.filter(insight => insight.condicao);

  if (insightsAtivos.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Insights e Recomendações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insightsAtivos.map((insight, index) => (
          <div 
            key={index}
            className={`p-4 rounded-xl border-l-4 ${
              insight.tipo === 'success' 
                ? 'bg-emerald-50/60 border-emerald-500' 
                : insight.tipo === 'warning'
                ? 'bg-orange-50/60 border-orange-500'
                : 'bg-red-50/60 border-red-500'
            } backdrop-blur-sm`}
          >
            <div className="flex items-start gap-3">
              <insight.icone className={`w-5 h-5 mt-0.5 ${
                insight.tipo === 'success' 
                  ? 'text-emerald-600' 
                  : insight.tipo === 'warning'
                  ? 'text-orange-600'
                  : 'text-red-600'
              }`} />
              <div>
                <h4 className={`font-semibold ${
                  insight.tipo === 'success' 
                    ? 'text-emerald-800' 
                    : insight.tipo === 'warning'
                    ? 'text-orange-800'
                    : 'text-red-800'
                }`}>
                  {insight.titulo}
                </h4>
                <p className={`text-sm ${
                  insight.tipo === 'success' 
                    ? 'text-emerald-700' 
                    : insight.tipo === 'warning'
                    ? 'text-orange-700'
                    : 'text-red-700'
                }`}>
                  {insight.descricao}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
