
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, FileText, Users, DollarSign } from 'lucide-react';

interface ProcessoImportacao {
  etapa: 'preparando' | 'validando' | 'processando' | 'finalizando' | 'concluido';
  progresso: number;
  mensagem: string;
}

interface ImportacaoProgressoProps {
  processo: ProcessoImportacao;
  analises?: {
    totalLinhas: number;
    linhasValidas: number;
    linhasComErro: number;
    clientesNovos: number;
    clientesExistentes: number;
    valorTotal: number;
  };
}

export function ImportacaoProgresso({ processo, analises }: ImportacaoProgressoProps) {
  const getEtapaIcon = (etapa: string) => {
    switch (etapa) {
      case 'preparando':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'validando':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'processando':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'finalizando':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'concluido':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEtapaLabel = (etapa: string) => {
    const labels = {
      preparando: 'Preparando Arquivo',
      validando: 'Validando Dados',
      processando: 'Processando Vendas',
      finalizando: 'Finalizando',
      concluido: 'Concluído'
    };
    return labels[etapa as keyof typeof labels] || etapa;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header com status atual */}
          <div className="flex items-center space-x-3">
            {getEtapaIcon(processo.etapa)}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{getEtapaLabel(processo.etapa)}</h3>
              <p className="text-sm text-gray-600">{processo.mensagem}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{processo.progresso}%</div>
            </div>
          </div>

          {/* Barra de progresso */}
          <Progress value={processo.progresso} className="h-3" />

          {/* Etapas */}
          <div className="grid grid-cols-5 gap-2">
            {['preparando', 'validando', 'processando', 'finalizando', 'concluido'].map((etapa, index) => {
              const isActive = processo.etapa === etapa;
              const isCompleted = ['preparando', 'validando', 'processando', 'finalizando', 'concluido'].indexOf(processo.etapa) > index;
              
              return (
                <div
                  key={etapa}
                  className={`text-center p-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : isCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {getEtapaLabel(etapa)}
                </div>
              );
            })}
          </div>

          {/* Estatísticas em tempo real */}
          {analises && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{analises.totalLinhas}</div>
                <div className="text-xs text-gray-600">Total de Linhas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analises.linhasValidas}</div>
                <div className="text-xs text-gray-600">Linhas Válidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analises.clientesNovos}</div>
                <div className="text-xs text-gray-600">Clientes Novos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(analises.valorTotal)}
                </div>
                <div className="text-xs text-gray-600">Valor Total</div>
              </div>
            </div>
          )}

          {/* Animação de loading */}
          {processo.etapa !== 'concluido' && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span>Processando...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
