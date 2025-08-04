
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  TrendingUp,
  BarChart3,
  Eye
} from "lucide-react";
import { AnnualDreTable } from "./AnnualDreTable";
import { AnnualSummaryCards } from "./AnnualSummaryCards";

interface MonthData {
  mes: number;
  nome: string;
  receitaLiquida: number;
  lucroBruto: number;
  resultadoLiquido: number;
  margemBruta: number;
  margemLiquida: number;
}

interface AnnualViewProps {
  ano: number;
  dados: MonthData[];
  onDetalheMes: (mes: number) => void;
}

export function AnnualView({ ano, dados, onDetalheMes }: AnnualViewProps) {
  
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  const totalAnual = dados.reduce((acc, mes) => ({
    receitaLiquida: acc.receitaLiquida + mes.receitaLiquida,
    lucroBruto: acc.lucroBruto + mes.lucroBruto,
    resultadoLiquido: acc.resultadoLiquido + mes.resultadoLiquido
  }), { receitaLiquida: 0, lucroBruto: 0, resultadoLiquido: 0 });

  const margemBrutaMedia = dados.length > 0 ? 
    dados.reduce((acc, mes) => acc + mes.margemBruta, 0) / dados.length : 0;
  
  const margemLiquidaMedia = dados.length > 0 ? 
    dados.reduce((acc, mes) => acc + mes.margemLiquida, 0) / dados.length : 0;

  return (
    <div className="space-y-6">
      
      {/* Header com Totais Anuais */}
      <AnnualSummaryCards
        ano={ano}
        totalAnual={totalAnual}
        margemBrutaMedia={margemBrutaMedia}
        margemLiquidaMedia={margemLiquidaMedia}
        formatarMoeda={formatarMoeda}
      />

      {/* Tabela DRE Anual */}
      <AnnualDreTable
        ano={ano}
        dados={dados}
        onDetalheMes={onDetalheMes}
      />
    </div>
  );
}
