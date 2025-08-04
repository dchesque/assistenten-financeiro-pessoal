
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface DreItem {
  codigo: string;
  nome: string;
  valor: number;
  nivel: number;
  tipo: 'receita' | 'custo' | 'despesa' | 'subtotal' | 'total';
  valorComparacao?: number;
}

interface DreResumidoProps {
  dados: DreItem[];
  periodo: string;
  periodoComparacao?: string;
  mostrarComparacao: boolean;
}

export function DreResumido({ 
  dados, 
  periodo, 
  periodoComparacao, 
  mostrarComparacao 
}: DreResumidoProps) {
  
  const formatarMoeda = (valor: number) => {
    const formatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(valor));
    
    return valor < 0 ? `(${formatado})` : formatado;
  };

  // Filtrar apenas totais e subtotais para versão resumida
  const dadosResumidos = dados.filter(item => 
    item.tipo === 'total' || item.tipo === 'subtotal'
  );

  const obterClassePorTipo = (tipo: string) => {
    const base = "transition-all duration-200 hover:bg-white/40";
    
    switch (tipo) {
      case 'total':
        return `${base} font-bold text-lg border-t-2 border-b border-gray-300 bg-gradient-to-r from-blue-50/60 to-purple-50/60`;
      case 'subtotal':
        return `${base} font-semibold text-base border-t border-gray-200 bg-gradient-to-r from-gray-50/60 to-blue-50/40`;
      default:
        return base;
    }
  };

  const obterCorPorTipo = (valor: number) => {
    return valor >= 0 ? 'text-emerald-700' : 'text-red-700';
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Eye className="w-5 h-5 text-blue-600" />
            DRE Resumido - {periodo}
            {periodoComparacao && (
              <Badge variant="outline" className="ml-2 bg-blue-50/60 text-blue-700 border-blue-200">
                {periodoComparacao}
              </Badge>
            )}
          </CardTitle>
          <Badge 
            variant="outline" 
            className="bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700 border-emerald-200 px-3 py-1"
          >
            Visão Resumida
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header da Tabela */}
            <div className="grid grid-cols-12 gap-2 p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/40 backdrop-blur-sm border-b border-gray-200/50 text-sm font-semibold text-muted-foreground">
              <div className="col-span-1">Código</div>
              <div className="col-span-7">Descrição</div>
              <div className="col-span-4 text-right">Valor</div>
            </div>

            {/* Linhas de Dados */}
            <div className="divide-y divide-gray-100">
              {dadosResumidos.map((item) => (
                <div 
                  key={item.codigo}
                  className={`grid grid-cols-12 gap-2 p-4 ${obterClassePorTipo(item.tipo)}`}
                >
                  {/* Código */}
                  <div className="col-span-1">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-white/60 border-gray-300/50"
                    >
                      {item.codigo}
                    </Badge>
                  </div>

                  {/* Nome */}
                  <div className="col-span-7">
                    <span className={`${obterCorPorTipo(item.valor)} font-semibold`}>
                      {item.nome}
                    </span>
                  </div>

                  {/* Valor */}
                  <div className={`col-span-4 text-right font-bold text-lg ${obterCorPorTipo(item.valor)}`}>
                    {formatarMoeda(item.valor)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
