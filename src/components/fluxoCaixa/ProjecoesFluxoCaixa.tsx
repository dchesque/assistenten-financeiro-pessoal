import { ProjecaoFluxo } from '@/types/fluxoCaixa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjecoesFluxoCaixaProps {
  projecoes: ProjecaoFluxo[];
  loading?: boolean;
}

export function ProjecoesFluxoCaixa({ projecoes, loading = false }: ProjecoesFluxoCaixaProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border border-white/20 animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: ProjecaoFluxo['status']) => {
    switch (status) {
      case 'positivo':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'negativo':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'critico':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'estavel':
        return <Minus className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ProjecaoFluxo['status']) => {
    switch (status) {
      case 'positivo':
        return 'bg-green-100/80 text-green-700 border-green-200/50';
      case 'negativo':
        return 'bg-red-100/80 text-red-700 border-red-200/50';
      case 'critico':
        return 'bg-red-100/80 text-red-700 border-red-200/50';
      case 'estavel':
        return 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50';
      default:
        return 'bg-gray-100/80 text-gray-700 border-gray-200/50';
    }
  };

  const getStatusLabel = (status: ProjecaoFluxo['status']) => {
    switch (status) {
      case 'positivo':
        return 'Crescimento';
      case 'negativo':
        return 'Declínio';
      case 'critico':
        return 'Crítico';
      case 'estavel':
        return 'Estável';
      default:
        return 'Neutro';
    }
  };

  const getConfiancaColor = (confianca: number) => {
    if (confianca >= 90) return 'text-green-600';
    if (confianca >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Projeções de Fluxo de Caixa</h3>
          <p className="text-sm text-gray-500">Análise preditiva baseada em histórico e compromissos</p>
        </div>
      </div>
      
      {/* Grid de Projeções - 3 Cards Largura Total */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {projecoes.map((projecao, index) => (
          <Card 
            key={index}
            className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  {projecao.periodo_label}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {format(projecao.data_inicio, 'dd/MM', { locale: ptBR })} - {format(projecao.data_fim, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${projecao.saldo_final >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {projecao.saldo_final.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(projecao.status)} text-xs font-medium px-2 py-1`}
                  >
                    {getStatusLabel(projecao.status)}
                  </Badge>
                  <span className={`text-sm font-medium ${projecao.variacao_percentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {projecao.variacao_percentual >= 0 ? '+' : ''}{projecao.variacao_percentual.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Layout horizontal para entradas/saídas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Entradas</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {projecao.entradas_previstas.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-red-50/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-600 font-medium">Saídas</span>
                  </div>
                  <p className="text-lg font-bold text-red-600">
                    {projecao.saidas_previstas.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
              </div>
              
              {/* Barra de confiança maior */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nível de Confiança</span>
                  <span className={`font-medium ${getConfiancaColor(projecao.confianca)}`}>
                    {projecao.confianca}%
                  </span>
                </div>
                <div className="w-full bg-gray-200/50 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${projecao.confianca}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Detalhes compactos */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendas:</span>
                  <span className="font-medium text-green-600">
                    {(projecao.detalhes.vendas_previstas / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contas:</span>
                  <span className="font-medium text-red-600">
                    {(projecao.detalhes.contas_a_pagar / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transferên.:</span>
                  <span className="font-medium text-blue-600">
                    {(projecao.detalhes.transferencias / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Outros:</span>
                  <span className="font-medium text-gray-600">
                    {((projecao.detalhes.outras_entradas + projecao.detalhes.outras_saidas) / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}