import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Check, X, RotateCcw } from 'lucide-react';
import { MOTIVOS_DEVOLUCAO } from '@/types/cheque';

interface AcaoRapidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'compensar' | 'cancelar' | 'devolver';
  numeroCheque: string;
  onConfirmar: (dados: any) => void;
}

export function AcaoRapidaModal({ 
  isOpen, 
  onClose, 
  tipo, 
  numeroCheque, 
  onConfirmar 
}: AcaoRapidaModalProps) {
  const [formData, setFormData] = useState({
    data_compensacao: new Date().toISOString().split('T')[0],
    motivo_cancelamento: '',
    motivo_devolucao: '',
    observacoes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tipo === 'compensar' && !formData.data_compensacao) {
      alert('Informe a data de compensação');
      return;
    }
    
    if (tipo === 'cancelar' && !formData.motivo_cancelamento.trim()) {
      alert('Informe o motivo do cancelamento');
      return;
    }
    
    if (tipo === 'devolver' && !formData.motivo_devolucao) {
      alert('Selecione o motivo da devolução');
      return;
    }

    onConfirmar(formData);
    onClose();
  };

  const getIcon = () => {
    switch (tipo) {
      case 'compensar': return <Check className="w-6 h-6 text-green-600" />;
      case 'cancelar': return <X className="w-6 h-6 text-red-600" />;
      case 'devolver': return <RotateCcw className="w-6 h-6 text-orange-600" />;
    }
  };

  const getTitle = () => {
    switch (tipo) {
      case 'compensar': return 'Marcar Cheque como Compensado';
      case 'cancelar': return 'Cancelar Cheque';
      case 'devolver': return 'Marcar Cheque como Devolvido';
    }
  };

  const getButtonText = () => {
    switch (tipo) {
      case 'compensar': return 'Marcar Compensado';
      case 'cancelar': return 'Cancelar Cheque';
      case 'devolver': return 'Marcar Devolvido';
    }
  };

  const getButtonColor = () => {
    switch (tipo) {
      case 'compensar': return 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800';
      case 'cancelar': return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800';
      case 'devolver': return 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="flex items-center space-x-3 text-xl">
            {getIcon()}
            <span className="text-gray-900">{getTitle()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-120px)] px-8">
          <form id="acao-rapida-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Informação do cheque */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-muted-foreground">Cheque</div>
            <div className="font-mono font-semibold">#{numeroCheque}</div>
          </div>

          {/* Campos específicos por tipo */}
            {tipo === 'compensar' && (
              <div className="space-y-2">
                <Label htmlFor="data_compensacao" className="text-sm font-medium text-gray-700">Data de Compensação *</Label>
                <Input
                  id="data_compensacao"
                  type="date"
                  value={formData.data_compensacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_compensacao: e.target.value }))}
                  className="bg-white/80 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11"
                  required
                />
                <div className="text-xs text-gray-600">
                  A data não pode ser anterior à data de emissão
                </div>
              </div>
            )}

            {tipo === 'cancelar' && (
              <div className="space-y-2">
                <Label htmlFor="motivo_cancelamento" className="text-sm font-medium text-gray-700">Motivo do Cancelamento *</Label>
                <Textarea
                  id="motivo_cancelamento"
                  value={formData.motivo_cancelamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo_cancelamento: e.target.value }))}
                  placeholder="Ex: Erro na emissão, mudança de pagamento..."
                  className="bg-white/80 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  rows={3}
                  required
                />
              </div>
            )}

            {tipo === 'devolver' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="motivo_devolucao" className="text-sm font-medium text-gray-700">Motivo da Devolução *</Label>
                  <Select 
                    value={formData.motivo_devolucao} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, motivo_devolucao: value }))}
                  >
                    <SelectTrigger className="bg-white/80 border-2 border-gray-200 rounded-xl focus:border-blue-500 h-11">
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20">
                    {MOTIVOS_DEVOLUCAO.map(motivo => (
                      <SelectItem key={motivo} value={motivo}>
                        {motivo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

            {/* Observações opcionais */}
            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Informações adicionais..."
                className="bg-white/80 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                rows={2}
              />
            </div>

          {/* Aviso importante */}
          {tipo === 'cancelar' && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <div className="font-medium">Atenção!</div>
                <div>Esta ação não pode ser desfeita. O cheque será marcado como cancelado permanentemente.</div>
              </div>
            </div>
          )}
          </form>
        </div>

        {/* Footer Fixo */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 px-8 py-6 z-10">
          <div className="flex justify-between items-center gap-4">
            <Button 
              type="button" 
              onClick={onClose}
              className="bg-white border-2 border-gray-300 text-gray-700 rounded-xl px-6 py-3 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancelar
            </Button>
            <Button 
              form="acao-rapida-form"
              type="submit"
              className={`${getButtonColor()} text-white rounded-xl px-6 py-3 transition-all duration-200 font-medium`}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}