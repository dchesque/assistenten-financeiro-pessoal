import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  TrendingDown,
  Eye
} from "lucide-react";

interface DreItem {
  codigo: string;
  nome: string;
  valor: number;
  nivel: number;
  tipo: 'receita' | 'custo' | 'despesa' | 'subtotal' | 'total';
  valorComparacao?: number;
}

interface DreTableProps {
  dados: DreItem[];
  periodo: string;
  periodoComparacao?: string;
  mostrarComparacao: boolean;
  tipoVisualizacao: 'mensal' | 'anual';
}

export function DreTable({ 
  dados, 
  periodo, 
  periodoComparacao, 
  mostrarComparacao, 
  tipoVisualizacao 
}: DreTableProps) {
  
  const formatarMoeda = (valor: number) => {
    const formatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(valor));
    
    return valor < 0 ? `(${formatado})` : formatado;
  };

  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return 0;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  };

  const formatarVariacao = (variacao: number) => {
    const sinal = variacao >= 0 ? '+' : '';
    return `${sinal}${variacao.toFixed(1)}%`;
  };

  const obterClassePorTipo = (tipo: string, nivel: number) => {
    const base = "transition-all duration-200 hover:bg-white/40";
    
    switch (tipo) {
      case 'total':
        return `${base} font-bold text-lg border-t-2 border-b border-gray-300 bg-gradient-to-r from-blue-50/60 to-purple-50/60`;
      case 'subtotal':
        return `${base} font-semibold text-base border-t border-gray-200 bg-gradient-to-r from-gray-50/60 to-blue-50/40`;
      default:
        return `${base} ${nivel > 1 ? 'text-sm text-muted-foreground' : ''}`;
    }
  };

  const obterCorPorTipo = (tipo: string, valor: number) => {
    if (tipo === 'total' || tipo === 'subtotal') {
      return valor >= 0 ? 'text-emerald-700' : 'text-red-700';
    }
    
    switch (tipo) {
      case 'receita':
        return 'text-emerald-600';
      case 'custo':
      case 'despesa':
        return 'text-red-600';
      default:
        return 'text-foreground';
    }
  };

  const obterIconeVariacao = (variacao: number) => {
    if (variacao > 0) return <TrendingUp className="w-3 h-3 text-emerald-600" />;
    if (variacao < 0) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const obterIndentacao = (nivel: number) => {
    return `pl-${Math.min(nivel * 6, 12)}`;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Eye className="w-5 h-5 text-blue-600" />
            DRE - {periodo}
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
            {tipoVisualizacao === 'mensal' ? 'Visão Mensal' : 'Visão Anual'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header da Tabela */}
            <div className="grid grid-cols-12 gap-2 p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/40 backdrop-blur-sm border-b border-gray-200/50 text-sm font-semibold text-muted-foreground">
              <div className="col-span-1">Código</div>
              <div className="col-span-5">Descrição</div>
              <div className="col-span-3 text-right">Valor</div>
              {mostrarComparacao && (
                <>
                  <div className="col-span-2 text-right">Anterior</div>
                  <div className="col-span-1 text-center">Var.</div>
                </>
              )}
            </div>

            {/* Linhas de Dados */}
            <div className="divide-y divide-gray-100">
              {dados.map((item) => {
                const variacao = item.valorComparacao ? 
                  calcularVariacao(item.valor, item.valorComparacao) : 0;
                
                return (
                  <div 
                    key={item.codigo}
                    className={`grid grid-cols-12 gap-2 p-4 ${obterClassePorTipo(item.tipo, item.nivel)}`}
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

                    {/* Nome com indentação */}
                    <div className={`col-span-5 ${obterIndentacao(item.nivel)}`}>
                      <span className={`${obterCorPorTipo(item.tipo, item.valor)} ${
                        item.tipo === 'total' || item.tipo === 'subtotal' ? 'font-semibold' : ''
                      }`}>
                        {item.nome}
                      </span>
                    </div>

                    {/* Valor */}
                    <div className={`col-span-3 text-right font-medium ${obterCorPorTipo(item.tipo, item.valor)}`}>
                      {formatarMoeda(item.valor)}
                    </div>

                    {/* Comparação (se ativa) */}
                    {mostrarComparacao && (
                      <>
                        <div className="col-span-2 text-right text-muted-foreground">
                          {item.valorComparacao ? formatarMoeda(item.valorComparacao) : '-'}
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          {item.valorComparacao && (
                            <div className="flex items-center gap-1">
                              {obterIconeVariacao(variacao)}
                              <span className={`text-xs font-medium ${
                                variacao > 0 ? 'text-emerald-600' : 
                                variacao < 0 ? 'text-red-600' : 'text-gray-400'
                              }`}>
                                {formatarVariacao(variacao)}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}