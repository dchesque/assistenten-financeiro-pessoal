import { Modal, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';

interface ModalConfirmacaoChequesProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chequesProblematicos: Array<{ numero: string; motivo: string }>;
  banco_nome: string;
}

export function ModalConfirmacaoCheques({
  isOpen,
  onClose,
  onConfirm,
  chequesProblematicos,
  banco_nome
}: ModalConfirmacaoChequesProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚠️ Cheques Duplicados Detectados"
      size="lg"
      icon={<AlertTriangle className="h-6 w-6 text-white" />}
    >
      <ModalContent className="space-y-6">
        <div className="bg-amber-50/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200/50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800">
                Alguns números de cheque já existem no sistema
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Os seguintes cheques já foram emitidos para <strong>{banco_nome}</strong>:
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="font-medium text-gray-800">Cheques Problemáticos:</h5>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {chequesProblematicos.map((cheque, index) => (
              <div 
                key={index}
                className="flex items-center justify-between bg-red-50/80 backdrop-blur-sm rounded-lg p-3 border border-red-200/50"
              >
                <div className="flex items-center space-x-3">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="font-mono text-sm font-medium text-gray-900">
                    #{cheque.numero}
                  </span>
                </div>
                <Badge variant="outline" className="bg-red-100/80 text-red-700 border-red-200">
                  {cheque.motivo}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800">
                O que você gostaria de fazer?
              </h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• <strong>Continuar mesmo assim:</strong> Os cheques serão criados (não recomendado)</li>
                <li>• <strong>Cancelar:</strong> Voltar e ajustar os números manualmente</li>
              </ul>
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          className="bg-white/80 backdrop-blur-sm border-gray-300/50 text-gray-700 hover:bg-gray-50/80"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          className="bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Continuar Mesmo Assim
        </Button>
      </ModalFooter>
    </Modal>
  );
}