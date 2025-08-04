import { Fornecedor } from '@/types/fornecedor';
import { PlanoContas } from '@/types/planoContas';
import { LancamentoLoteFormData, ParcelaPreview } from '@/types/lancamentoLote';
import { FormaPagamento, TIPOS_PAGAMENTO_LABELS, TIPOS_PAGAMENTO_ICONS } from '@/types/formaPagamento';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Package, Settings, CreditCard, Building2 } from 'lucide-react';
import { formatarData } from '@/utils/formatters';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';

interface LotePreviewProps {
  formData: LancamentoLoteFormData;
  fornecedor: Fornecedor | null;
  categoria: PlanoContas | null;
  parcelas: ParcelaPreview[];
  formaPagamento?: FormaPagamento;
}

export function LotePreview({ formData, fornecedor, categoria, parcelas, formaPagamento }: LotePreviewProps) {
  const { bancos } = useBancosSupabase();
  const valorTotal = parcelas.reduce((acc, p) => acc + p.valor, 0);
  
  const primeiraData = parcelas.length > 0 ? parcelas[0].data_vencimento : '';
  const ultimaData = parcelas.length > 0 ? parcelas[parcelas.length - 1].data_vencimento : '';
  
  const getIntervaloLabel = () => {
    switch (formData.intervalo_parcelas) {
      case 'semanal': return 'Semanal';
      case 'quinzenal': return 'Quinzenal';
      case 'mensal': return 'Mensal';
      default: return '-';
    }
  };

  return (
    <div className="w-80">
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg sticky top-6">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Preview do Lote</h3>
            <Badge variant="outline" className="bg-blue-100/80 text-blue-700 border-blue-200">
              <Package className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
          </div>

          {/* Fornecedor e Categoria */}
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Fornecedor
              </div>
              <div className="text-sm font-medium text-gray-900">
                {fornecedor?.nome || 'Não selecionado'}
              </div>
            </div>
            
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Categoria
              </div>
              <div className="text-sm text-gray-700">
                {categoria ? (
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs">{categoria.codigo}</span>
                    <span>{categoria.nome}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-green-600 mb-3">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium text-sm">Valores</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor por Parcela:</span>
                <span className="font-medium">
                  {formData.valor_parcela > 0 
                    ? `R$ ${formData.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                    : 'R$ 0,00'
                  }
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantidade:</span>
                <span className="font-medium">
                  {formData.quantidade_parcelas} {formData.quantidade_parcelas === 1 ? 'parcela' : 'parcelas'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-900">Valor Total:</span>
                <span className="font-bold text-lg text-green-600">
                  R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Prazos */}
          {parcelas.length > 0 && (
            <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-blue-600 mb-3">
                <Calendar className="h-4 w-4" />
                <span className="font-medium text-sm">Prazos</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Primeira Parcela:</span>
                  <span className="font-medium">
                    {primeiraData ? formatarData(primeiraData) : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Última Parcela:</span>
                  <span className="font-medium">
                    {ultimaData ? formatarData(ultimaData) : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Intervalo:</span>
                  <span className="font-medium">{getIntervaloLabel()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Configurações */}
          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-purple-600 mb-3">
              <Settings className="h-4 w-4" />
              <span className="font-medium text-sm">Configurações</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">DDA:</span>
                <span className="font-medium">
                  {formData.dda ? 'Sim' : 'Não'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Emissão:</span>
                <span className="font-medium">
                  {formData.data_emissao ? formatarData(formData.data_emissao) : 'Hoje'}
                </span>
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          {formaPagamento && (
            <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-green-600 mb-3">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium text-sm">Forma de Pagamento</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tipo:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">{TIPOS_PAGAMENTO_ICONS[formaPagamento.tipo]}</span>
                    <span className="font-medium">{TIPOS_PAGAMENTO_LABELS[formaPagamento.tipo]}</span>
                  </div>
                </div>
                
                {/* Banco para Transferência ou Cheque */}
                {(formaPagamento.tipo === 'transferencia' || formaPagamento.tipo === 'cheque') && formaPagamento.banco_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Banco:</span>
                    <span className="font-medium">
                      {bancos.find(b => b.id === formaPagamento.banco_id)?.nome}
                    </span>
                  </div>
                )}
                
                {/* Cheques */}
                {formaPagamento.tipo === 'cheque' && formaPagamento.numeros_cheques && formaPagamento.numeros_cheques.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cheques:</span>
                      <Badge variant="outline" className="text-xs">
                        {formaPagamento.numeros_cheques.length} cheques
                      </Badge>
                    </div>
                    <div className="text-xs font-mono bg-blue-100/80 px-2 py-1 rounded">
                      #{formaPagamento.numeros_cheques[0]} a #{formaPagamento.numeros_cheques[formaPagamento.numeros_cheques.length - 1]}
                    </div>
                  </div>
                )}
                
                {/* Tipo de Cartão */}
                {formaPagamento.tipo === 'cartao' && formaPagamento.tipo_cartao && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tipo:</span>
                    <Badge variant="outline" className="text-xs">
                      {formaPagamento.tipo_cartao === 'debito' ? 'Débito' : 'Crédito'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status das Parcelas */}
          {parcelas.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Status das Parcelas
              </div>
              <div className="flex flex-wrap gap-1">
                {parcelas.slice(0, 12).map((parcela) => (
                  <div
                    key={parcela.numero}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center text-white font-medium ${
                      parcela.status === 'editada' 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }`}
                  >
                    {parcela.numero}
                  </div>
                ))}
                {parcelas.length > 12 && (
                  <div className="text-xs text-gray-500 flex items-center px-2">
                    +{parcelas.length - 12}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4 mt-3 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Calculada</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-gray-600">Editada</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}