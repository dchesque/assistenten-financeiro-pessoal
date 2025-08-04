
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react";

interface AnaliseMargensProps {
  margemBruta: number;
  margemLiquida: number;
}

export function AnaliseMargens({ margemBruta, margemLiquida }: AnaliseMargensProps) {
  
  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  const obterStatusMargem = (margem: number) => {
    if (margem >= 20) return { cor: 'emerald', status: 'Excelente', icone: CheckCircle };
    if (margem >= 10) return { cor: 'blue', status: 'Bom', icone: TrendingUp };
    if (margem >= 5) return { cor: 'orange', status: 'Atenção', icone: AlertTriangle };
    return { cor: 'red', status: 'Crítico', icone: TrendingDown };
  };

  const statusMargemBruta = obterStatusMargem(margemBruta);
  const statusMargemLiquida = obterStatusMargem(margemLiquida);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Activity className="w-5 h-5 text-blue-600" />
          Análise de Margens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Margem Bruta */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <statusMargemBruta.icone className={`w-5 h-5 text-${statusMargemBruta.cor}-600`} />
              <span className="font-medium">Margem Bruta</span>
              <Badge 
                variant="outline" 
                className={`bg-${statusMargemBruta.cor}-50 text-${statusMargemBruta.cor}-700 border-${statusMargemBruta.cor}-200`}
              >
                {statusMargemBruta.status}
              </Badge>
            </div>
            <span className="font-bold text-xl">{formatarPercentual(margemBruta)}</span>
          </div>
          <Progress 
            value={Math.min(margemBruta, 100)} 
            className="h-3"
          />
          <p className="text-sm text-muted-foreground">
            Meta recomendada: 30% ou superior
          </p>
        </div>

        <div className="border-t border-gray-200/50 pt-6">
          {/* Margem Líquida */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <statusMargemLiquida.icone className={`w-5 h-5 text-${statusMargemLiquida.cor}-600`} />
                <span className="font-medium">Margem Líquida</span>
                <Badge 
                  variant="outline" 
                  className={`bg-${statusMargemLiquida.cor}-50 text-${statusMargemLiquida.cor}-700 border-${statusMargemLiquida.cor}-200`}
                >
                  {statusMargemLiquida.status}
                </Badge>
              </div>
              <span className="font-bold text-xl">{formatarPercentual(margemLiquida)}</span>
            </div>
            <Progress 
              value={Math.min(margemLiquida, 100)} 
              className="h-3"
            />
            <p className="text-sm text-muted-foreground">
              Meta recomendada: 15% ou superior
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
