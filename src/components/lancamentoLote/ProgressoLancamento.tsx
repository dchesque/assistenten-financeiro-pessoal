import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProgressoLancamentoProps {
  progresso: number;
  loading: boolean;
  className?: string;
}

const ETAPAS = [
  { id: 1, nome: 'Validando dados', porcentagem: 10 },
  { id: 2, nome: 'Verificando fornecedor', porcentagem: 20 },
  { id: 3, nome: 'Validando categoria', porcentagem: 30 },
  { id: 4, nome: 'Verificando cheques', porcentagem: 40 },
  { id: 5, nome: 'Criando parcelas', porcentagem: 60 },
  { id: 6, nome: 'Criando cheques', porcentagem: 80 },
  { id: 7, nome: 'Finalizando', porcentagem: 100 }
];

export function ProgressoLancamento({ progresso, loading, className = "" }: ProgressoLancamentoProps) {
  if (!loading && progresso === 0) return null;

  const etapaAtual = ETAPAS.find(etapa => progresso <= etapa.porcentagem) || ETAPAS[ETAPAS.length - 1];

  return (
    <div className={`bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100/80 rounded-lg">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Criando lançamento em lote</h3>
            <p className="text-sm text-gray-600">{etapaAtual.nome}...</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progresso</span>
            <span className="font-medium text-gray-900">{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        {/* Lista de etapas */}
        <div className="space-y-2">
          {ETAPAS.map((etapa) => {
            const concluida = progresso >= etapa.porcentagem;
            const atual = etapaAtual.id === etapa.id && loading;

            return (
              <div
                key={etapa.id}
                className={`flex items-center space-x-3 text-sm transition-all duration-200 ${
                  atual ? 'text-blue-600' : concluida ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {loading && atual ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : concluida ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span className={concluida || atual ? 'font-medium' : ''}>
                  {etapa.nome}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}