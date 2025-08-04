import { AlertTriangle, FileText, Calendar, DollarSign, CreditCard, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LancamentoLoteFormData, ParcelaPreview } from '@/types/lancamentoLote';
import { FormaPagamento } from '@/types/formaPagamento';
import { Fornecedor } from '@/types/fornecedor';
import { PlanoContas } from '@/types/planoContas';
import { Banco } from '@/types/banco';
import { formatarDataBrasilia } from '@/utils/timezone';

interface ConfirmacaoLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  formData: LancamentoLoteFormData;
  parcelas: ParcelaPreview[];
  formaPagamento: FormaPagamento;
  fornecedor: Fornecedor | null;
  categoria: PlanoContas | null;
  banco: Banco | null;
}

export function ConfirmacaoLoteModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  formData,
  parcelas,
  formaPagamento,
  fornecedor,
  categoria,
  banco
}: ConfirmacaoLoteModalProps) {
  const valorTotal = parcelas.reduce((acc, p) => acc + p.valor, 0);
  const primeiraData = parcelas.length > 0 ? parcelas[0].data_vencimento : '';
  const ultimaData = parcelas.length > 0 ? parcelas[parcelas.length - 1].data_vencimento : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <div className="p-2 bg-blue-100/80 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <span>Confirmar Lançamento em Lote</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Alerta de confirmação */}
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Atenção!</h4>
                <p className="text-sm text-blue-700">
                  Você está prestes a criar <strong>{parcelas.length} parcelas</strong> no valor total de{' '}
                  <strong>R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
          </div>

          {/* Resumo do lote */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-600" />
                <span>Dados Gerais</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fornecedor:</span>
                  <span className="font-medium text-gray-900">{fornecedor?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoria:</span>
                  <span className="font-medium text-gray-900">{categoria?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Descrição:</span>
                  <span className="font-medium text-gray-900">{formData.descricao}</span>
                </div>
                {formData.documento_referencia && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documento:</span>
                    <span className="font-medium text-gray-900">{formData.documento_referencia}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span>Cronograma</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Primeira parcela:</span>
                  <span className="font-medium text-gray-900">{formatarDataBrasilia(primeiraData)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última parcela:</span>
                  <span className="font-medium text-gray-900">{formatarDataBrasilia(ultimaData)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de parcelas:</span>
                  <span className="font-medium text-gray-900">{parcelas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Intervalo:</span>
                  <span className="font-medium text-gray-900">
                    {formData.intervalo_parcelas === 'mensal' ? 'Mensal' : 
                     formData.intervalo_parcelas === 'quinzenal' ? 'Quinzenal' : 'Semanal'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Valores e forma de pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>Valores</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor por parcela:</span>
                  <span className="font-medium text-gray-900">
                    R$ {formData.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200/50">
                  <span className="text-gray-600 font-medium">Valor total:</span>
                  <span className="font-bold text-green-700 text-base">
                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>Forma de Pagamento</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <Badge variant="outline" className="bg-blue-100/80 text-blue-700 border-blue-200">
                    {formaPagamento.tipo === 'cheque' ? 'Cheque' :
                     formaPagamento.tipo === 'transferencia' ? 'Transferência' :
                     formaPagamento.tipo === 'cartao' ? 'Cartão' : 'Dinheiro/PIX'}
                  </Badge>
                </div>
                {formaPagamento.tipo === 'cheque' && banco && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Banco:</span>
                    <span className="font-medium text-gray-900">{banco.nome}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detalhes específicos de cheque */}
          {formaPagamento.tipo === 'cheque' && (
            <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3">Cheques que serão criados</h4>
              <div className="text-sm text-gray-700">
                <p className="mb-2">
                  Serão criados <strong>{parcelas.length} cheques</strong> com status "Pendente"
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Primeiro cheque:</span>{' '}
                    <span className="font-mono font-medium">
                      {parcelas[0]?.numero_cheque?.padStart(6, '0')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Último cheque:</span>{' '}
                    <span className="font-mono font-medium">
                      {parcelas[parcelas.length - 1]?.numero_cheque?.padStart(6, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="bg-white/80 backdrop-blur-sm border-gray-300/50"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Criando...</span>
              </div>
            ) : (
              'Confirmar e Criar Parcelas'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}