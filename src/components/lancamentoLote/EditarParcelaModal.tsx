import { useState, useEffect } from 'react';
import { Edit3, Calendar, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParcelaPreview } from '@/types/lancamentoLote';
import { aplicarMascaraMoeda, converterMoedaParaNumero } from '@/utils/masks';
import { formatarData } from '@/utils/formatters';

interface EditarParcelaModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: ParcelaPreview | null;
  onSave: (novoValor: number) => void;
}

export function EditarParcelaModal({
  isOpen,
  onClose,
  parcela,
  onSave
}: EditarParcelaModalProps) {
  const [novoValor, setNovoValor] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (parcela) {
      setNovoValor(aplicarMascaraMoeda(parcela.valor.toString()));
    }
  }, [parcela]);

  const handleSave = () => {
    if (!parcela) return;
    
    const valorNumerico = converterMoedaParaNumero(novoValor);
    
    if (valorNumerico <= 0) {
      alert('O valor deve ser maior que zero');
      return;
    }

    setLoading(true);
    
    // Simular delay de processamento
    setTimeout(() => {
      onSave(valorNumerico);
      setLoading(false);
      onClose();
    }, 300);
  };

  const handleValorChange = (valor: string) => {
    const valorMascarado = aplicarMascaraMoeda(valor);
    setNovoValor(valorMascarado);
  };

  if (!parcela) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <span>Editar Parcela {parcela.numero}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações da parcela */}
          <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Vencimento: {formatarData(parcela.data_vencimento)}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>Valor atual: R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Campo de edição */}
          <div className="space-y-2">
            <Label htmlFor="novo-valor" className="text-sm font-medium text-gray-700">
              Novo Valor *
            </Label>
            <Input
              id="novo-valor"
              value={novoValor}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="R$ 0,00"
              className="bg-white/80 backdrop-blur-sm border-gray-300/50 rounded-xl focus:border-blue-500 text-right"
              autoFocus
            />
          </div>

          {/* Botões de ação */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={loading || !novoValor || converterMoedaParaNumero(novoValor) <= 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </div>
              ) : (
                'Salvar Alteração'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}