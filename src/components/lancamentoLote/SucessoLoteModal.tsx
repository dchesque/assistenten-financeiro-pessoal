import { CheckCircle, ExternalLink, RotateCcw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatarData } from '@/utils/formatters';

interface SucessoLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCriarNovoLote: () => void;
  onVisualizarParcelas: () => void;
  loteId: string;
  totalParcelas: number;
  valorTotal: number;
  primeiraData: string;
  ultimaData: string;
}

export function SucessoLoteModal({
  isOpen,
  onClose,
  onCriarNovoLote,
  onVisualizarParcelas,
  loteId,
  totalParcelas,
  valorTotal,
  primeiraData,
  ultimaData
}: SucessoLoteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl text-center">
            <div className="p-3 bg-green-100/80 rounded-xl mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6 mt-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Lote criado com sucesso!
            </h2>
            <p className="text-gray-600">
              Suas {totalParcelas} parcelas foram criadas e estão prontas para uso.
            </p>
          </div>

          {/* Resumo do lote */}
          <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ID do Lote:</span>
              <Badge variant="outline" className="bg-blue-50/80 text-blue-700 border-blue-200 font-mono text-xs">
                {loteId.split('-')[0]}...
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total de Parcelas:</span>
              <span className="font-semibold text-gray-900">{totalParcelas}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Valor Total:</span>
              <span className="font-semibold text-green-700">
                R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Período:</span>
              <span className="font-semibold text-gray-900">
                {formatarData(primeiraData)} → {formatarData(ultimaData)}
              </span>
            </div>
          </div>

          {/* Próximos passos */}
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Próximos passos</span>
            </h4>
            <ul className="text-sm text-blue-700 space-y-1 text-left">
              <li>• Visualize as parcelas criadas em "Contas a Pagar"</li>
              <li>• Acompanhe os vencimentos no Dashboard</li>
              <li>• Realize os pagamentos quando necessário</li>
            </ul>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col space-y-3 pt-6 border-t border-gray-200/50">
          <Button
            onClick={onVisualizarParcelas}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Parcelas Criadas
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onCriarNovoLote}
              className="bg-white/80 backdrop-blur-sm border-gray-300/50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Novo Lote
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-white/80 backdrop-blur-sm border-gray-300/50"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}