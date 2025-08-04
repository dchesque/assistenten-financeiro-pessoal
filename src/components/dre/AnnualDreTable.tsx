
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3,
  Eye,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from "@/components/ui/table";

interface MonthData {
  mes: number;
  nome: string;
  receitaLiquida: number;
  lucroBruto: number;
  resultadoLiquido: number;
  margemBruta: number;
  margemLiquida: number;
}

interface AnnualDreTableProps {
  ano: number;
  dados: MonthData[];
  onDetalheMes: (mes: number) => void;
}

export function AnnualDreTable({ ano, dados, onDetalheMes }: AnnualDreTableProps) {
  
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  const obterCorResultado = (valor: number) => {
    return valor >= 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const obterIconeTendencia = (valor: number) => {
    return valor >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  // Calcular totais
  const totalAnual = dados.reduce((acc, mes) => ({
    receitaLiquida: acc.receitaLiquida + mes.receitaLiquida,
    lucroBruto: acc.lucroBruto + mes.lucroBruto,
    resultadoLiquido: acc.resultadoLiquido + mes.resultadoLiquido
  }), { receitaLiquida: 0, lucroBruto: 0, resultadoLiquido: 0 });

  const margemBrutaMedia = dados.length > 0 ? 
    dados.reduce((acc, mes) => acc + mes.margemBruta, 0) / dados.length : 0;
  
  const margemLiquidaMedia = dados.length > 0 ? 
    dados.reduce((acc, mes) => acc + mes.margemLiquida, 0) / dados.length : 0;

  // Garantir que temos dados para todos os 12 meses
  const mesesCompletos = Array.from({ length: 12 }, (_, index) => {
    const mes = index + 1;
    const dadosMes = dados.find(d => d.mes === mes);
    return dadosMes || {
      mes,
      nome: new Date(ano, index).toLocaleDateString('pt-BR', { month: 'long' }),
      receitaLiquida: 0,
      lucroBruto: 0,
      resultadoLiquido: 0,
      margemBruta: 0,
      margemLiquida: 0
    };
  });

  const estruturaDRE = [
    {
      categoria: 'Receita Líquida',
      tipo: 'receita',
      obterValor: (mes: MonthData) => mes.receitaLiquida,
      cor: 'text-blue-700'
    },
    {
      categoria: 'Lucro Bruto',
      tipo: 'lucro',
      obterValor: (mes: MonthData) => mes.lucroBruto,
      cor: 'text-emerald-700'
    },
    {
      categoria: 'Resultado Líquido',
      tipo: 'resultado',
      obterValor: (mes: MonthData) => mes.resultadoLiquido,
      cor: ''
    }
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          DRE Anual - {ano}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50/80 to-blue-50/40 backdrop-blur-sm hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-blue-50/40">
                <TableHead className="w-48 font-semibold text-gray-700 sticky left-0 bg-gradient-to-r from-gray-50/80 to-blue-50/40 backdrop-blur-sm">
                  Descrição
                </TableHead>
                {mesesCompletos.map((mes) => (
                  <TableHead key={mes.mes} className="text-center font-semibold text-gray-700 min-w-24">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="outline" className="bg-white/60 border-gray-300/50 text-xs">
                        {mes.mes.toString().padStart(2, '0')}
                      </Badge>
                      <span className="text-xs hidden lg:inline">
                        {mes.nome.substring(0, 3)}
                      </span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center font-semibold text-gray-700 min-w-32 bg-gradient-to-r from-blue-50/60 to-purple-50/60">
                  Total Anual
                </TableHead>
                <TableHead className="text-center font-semibold text-gray-700 min-w-24">
                  Ação
                </TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {estruturaDRE.map((linha) => {
                const totalLinha = mesesCompletos.reduce((acc, mes) => acc + linha.obterValor(mes), 0);
                
                return (
                  <TableRow key={linha.categoria} className="hover:bg-white/40 transition-all duration-200">
                    <TableCell className="font-medium sticky left-0 bg-white/80 backdrop-blur-sm border-r border-gray-200/50">
                      {linha.categoria}
                    </TableCell>
                    
                    {mesesCompletos.map((mes) => {
                      const valor = linha.obterValor(mes);
                      return (
                        <TableCell key={mes.mes} className="text-center">
                          <span className={`font-medium ${linha.tipo === 'resultado' ? obterCorResultado(valor) : linha.cor}`}>
                            {formatarMoeda(valor)}
                          </span>
                        </TableCell>
                      );
                    })}
                    
                    <TableCell className="text-center bg-gradient-to-r from-blue-50/20 to-purple-50/20">
                      <span className={`font-bold text-lg ${linha.tipo === 'resultado' ? obterCorResultado(totalLinha) : linha.cor}`}>
                        {formatarMoeda(totalLinha)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {linha.tipo === 'resultado' && (
                        <div className="flex items-center justify-center gap-1">
                          {obterIconeTendencia(totalLinha)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Linha de Margens */}
              <TableRow className="border-t-2 border-gray-300/50 bg-gradient-to-r from-gray-50/40 to-blue-50/20">
                <TableCell className="font-semibold sticky left-0 bg-gradient-to-r from-gray-50/40 to-blue-50/20 backdrop-blur-sm border-r border-gray-200/50">
                  Margem Bruta (%)
                </TableCell>
                
                {mesesCompletos.map((mes) => (
                  <TableCell key={mes.mes} className="text-center">
                    <Badge 
                      variant="outline" 
                      className={`${
                        mes.margemBruta >= 30 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        mes.margemBruta >= 20 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {formatarPercentual(mes.margemBruta)}
                    </Badge>
                  </TableCell>
                ))}
                
                <TableCell className="text-center bg-gradient-to-r from-blue-50/20 to-purple-50/20">
                  <span className="font-bold text-purple-700">
                    {formatarPercentual(margemBrutaMedia)}
                  </span>
                </TableCell>
                
                <TableCell className="text-center"></TableCell>
              </TableRow>
              
              <TableRow className="bg-gradient-to-r from-gray-50/40 to-blue-50/20">
                <TableCell className="font-semibold sticky left-0 bg-gradient-to-r from-gray-50/40 to-blue-50/20 backdrop-blur-sm border-r border-gray-200/50">
                  Margem Líquida (%)
                </TableCell>
                
                {mesesCompletos.map((mes) => (
                  <TableCell key={mes.mes} className="text-center">
                    <Badge 
                      variant="outline" 
                      className={`${
                        mes.margemLiquida >= 15 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        mes.margemLiquida >= 10 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {formatarPercentual(mes.margemLiquida)}
                    </Badge>
                  </TableCell>
                ))}
                
                <TableCell className="text-center bg-gradient-to-r from-blue-50/20 to-purple-50/20">
                  <span className="font-bold text-orange-700">
                    {formatarPercentual(margemLiquidaMedia)}
                  </span>
                </TableCell>
                
                <TableCell className="text-center"></TableCell>
              </TableRow>
            </TableBody>
            
            <TableFooter>
              <TableRow className="bg-gradient-to-r from-blue-100/80 to-purple-100/40 backdrop-blur-sm border-t-2 border-blue-300/50">
                <TableCell className="font-bold sticky left-0 bg-gradient-to-r from-blue-100/80 to-purple-100/40 backdrop-blur-sm">
                  <Badge className="bg-blue-600 text-white">AÇÕES</Badge>
                </TableCell>
                
                {mesesCompletos.map((mes) => (
                  <TableCell key={mes.mes} className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDetalheMes(mes.mes)}
                      className="bg-white/60 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      <span className="hidden lg:inline">DRE</span>
                    </Button>
                  </TableCell>
                ))}
                
                <TableCell className="text-center bg-gradient-to-r from-blue-50/20 to-purple-50/20">
                  <span className="text-sm text-muted-foreground font-medium">Ver Detalhes</span>
                </TableCell>
                
                <TableCell className="text-center"></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
