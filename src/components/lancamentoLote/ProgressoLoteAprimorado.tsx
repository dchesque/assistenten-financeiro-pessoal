import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressoLoteAprimoradoProps {
  progresso: number;
  etapa?: string;
}

export const ProgressoLoteAprimorado = ({ progresso, etapa }: ProgressoLoteAprimoradoProps) => {
  const etapas = [
    { id: 0, nome: 'Iniciando', descricao: 'Preparando dados...' },
    { id: 20, nome: 'Validando', descricao: 'Verificando informações...' },
    { id: 40, nome: 'Processando', descricao: 'Criando contas...' },
    { id: 60, nome: 'Salvando', descricao: 'Gravando no banco...' },
    { id: 80, nome: 'Finalizando', descricao: 'Últimos ajustes...' },
    { id: 100, nome: 'Concluído', descricao: 'Lote criado com sucesso!' }
  ];
  
  const etapaAtual = etapas.find(e => progresso >= e.id) || etapas[0];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Ícone animado */}
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            {progresso === 100 ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            )}
          </div>
          
          {/* Título */}
          <h3 className="text-xl font-semibold mb-2">
            {progresso === 100 ? 'Lote Criado!' : 'Criando Lote...'}
          </h3>
          
          {/* Etapa atual */}
          <p className="text-gray-600 mb-6">
            {etapaAtual.nome}: {etapaAtual.descricao}
          </p>
          
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progresso}%` }}
            />
          </div>
          
          {/* Porcentagem */}
          <p className="text-sm text-gray-500">{progresso}% concluído</p>
          
          {/* Etapas visuais */}
          <div className="flex justify-between mt-6 text-xs">
            {etapas.slice(0, -1).map((e, index) => (
              <div 
                key={e.id}
                className={cn(
                  "flex flex-col items-center",
                  progresso >= e.id ? "text-blue-600" : "text-gray-400"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full mb-1 transition-colors",
                  progresso >= e.id ? "bg-blue-600" : "bg-gray-300"
                )} />
                <span>{e.nome}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};