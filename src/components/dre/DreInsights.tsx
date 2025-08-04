
import { IndicadoresPrincipais } from "./insights/IndicadoresPrincipais";
import { AnaliseMargens } from "./insights/AnaliseMargens";
import { InsightsRecomendacoes } from "./insights/InsightsRecomendacoes";

interface DreInsightsProps {
  receitaLiquida: number;
  lucroBruto: number;
  resultadoLiquido: number;
  margemBruta: number;
  margemLiquida: number;
  tipoVisualizacao: 'mensal' | 'anual';
}

export function DreInsights({ 
  receitaLiquida, 
  lucroBruto, 
  resultadoLiquido, 
  margemBruta, 
  margemLiquida,
  tipoVisualizacao 
}: DreInsightsProps) {
  
  return (
    <div className="space-y-6">
      
      {/* Indicadores Principais */}
      <IndicadoresPrincipais
        receitaLiquida={receitaLiquida}
        lucroBruto={lucroBruto}
        resultadoLiquido={resultadoLiquido}
        margemLiquida={margemLiquida}
      />

      {/* Análise de Margens */}
      <AnaliseMargens
        margemBruta={margemBruta}
        margemLiquida={margemLiquida}
      />

      {/* Insights e Recomendações */}
      <InsightsRecomendacoes
        receitaLiquida={receitaLiquida}
        lucroBruto={lucroBruto}
        resultadoLiquido={resultadoLiquido}
        margemBruta={margemBruta}
        margemLiquida={margemLiquida}
      />
    </div>
  );
}
