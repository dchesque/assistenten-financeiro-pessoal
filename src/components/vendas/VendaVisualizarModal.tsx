import { Venda } from '@/types/venda';
import { Badge } from '@/components/ui/badge';
import { formatarMoeda, formatarData, formatarDataHora } from '@/utils/formatters';
import { FORMAS_PAGAMENTO } from '@/types/venda';
import { QrCode, CreditCard, Banknote, FileText, ArrowRightLeft, User, Calendar, DollarSign, ShoppingCart, X, Edit, Info, MessageSquare } from 'lucide-react';
import { SectionHeader, FieldDisplay, ValorVendaGrid } from './ModalComponents';

interface VendaVisualizarModalProps {
  venda: Venda | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (venda: Venda) => void;
}

export function VendaVisualizarModal({ venda, isOpen, onClose, onEdit }: VendaVisualizarModalProps) {
  if (!venda || !isOpen) return null;

  const getFormaPagamentoIcon = (forma: string) => {
    switch (forma) {
      case 'pix':
        return <QrCode className="w-4 h-4" />;
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="w-4 h-4" />;
      case 'dinheiro':
        return <Banknote className="w-4 h-4" />;
      case 'boleto':
        return <FileText className="w-4 h-4" />;
      case 'transferencia':
        return <ArrowRightLeft className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const formaPagamento = FORMAS_PAGAMENTO.find(f => f.valor === venda.forma_pagamento);

  const getTipoVendaBadge = () => {
    const configs = {
      venda: { color: 'bg-green-100/80 text-green-700', label: 'Venda' },
      devolucao: { color: 'bg-red-100/80 text-red-700', label: 'Devolução' },
      desconto: { color: 'bg-orange-100/80 text-orange-700', label: 'Desconto' }
    };
    return configs[venda.tipo_venda as keyof typeof configs] || configs.venda;
  };

  const tipoBadge = getTipoVendaBadge();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <ShoppingCart className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Visualizar Venda
                </h2>
                <p className="text-sm text-gray-500">ID: #{venda.id}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex-shrink-0 px-6 py-4">
          <div className="flex items-center space-x-2">
            <Badge className={tipoBadge.color}>
              {tipoBadge.label}
            </Badge>
            <Badge 
              className="rounded-full text-white border-0" 
              style={{ backgroundColor: venda.categoria_cor }}
            >
              {venda.categoria_codigo}
            </Badge>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Coluna 1: Informações do Cliente e Venda */}
              <div className="space-y-8">
                <SectionHeader icon={User} title="Informações do Cliente" color="blue" />
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-medium">
                    {venda.cliente_nome.charAt(0)}
                  </div>
                  <div>
                    <FieldDisplay label="Nome do Cliente" value={venda.cliente_nome} />
                    {venda.cliente_documento && (
                      <div className="mt-2">
                        <FieldDisplay label="Documento" value={venda.cliente_documento} />
                      </div>
                    )}
                  </div>
                </div>

                {venda.cliente_id && (
                  <div className="bg-blue-50/50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Histórico do Cliente</div>
                    <div className="text-sm font-medium text-blue-700">
                      Cliente cadastrado • Histórico disponível
                    </div>
                  </div>
                )}
                
                <SectionHeader icon={Info} title="Informações da Venda" color="purple" />
                
                <div className="space-y-4">
                  <FieldDisplay 
                    label="Categoria" 
                    value={`${venda.categoria_codigo} - ${venda.categoria_nome}`} 
                  />
                  {venda.documento_referencia && (
                    <FieldDisplay label="Documento/Referência" value={venda.documento_referencia} />
                  )}
                </div>
                
                <SectionHeader icon={Calendar} title="Data e Hora" color="emerald" />
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FieldDisplay label="Data da Venda" value={formatarData(venda.data_venda)} />
                    <FieldDisplay label="Hora da Venda" value={venda.hora_venda} />
                  </div>
                </div>
              </div>
              
              {/* Coluna 2: Informações Financeiras e Pagamento */}
              <div className="space-y-8">
                <SectionHeader icon={DollarSign} title="Informações Financeiras" color="green" />
                
                <ValorVendaGrid
                  valorBruto={venda.valor_bruto}
                  valorDesconto={venda.desconto_valor}
                  valorLiquido={venda.valor_liquido}
                  percentualDesconto={venda.desconto_percentual}
                  tipoVenda={venda.tipo_venda}
                />
                
                <SectionHeader icon={CreditCard} title="Informações do Pagamento" color="blue" />
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getFormaPagamentoIcon(venda.forma_pagamento)}
                    </div>
                    <FieldDisplay 
                      label="Forma de Pagamento" 
                      value={formaPagamento?.nome || venda.forma_pagamento} 
                    />
                  </div>

                  {venda.banco_nome && (
                    <FieldDisplay label="Banco" value={venda.banco_nome} />
                  )}

                  <FieldDisplay 
                    label="Status do Pagamento" 
                    value={
                      <Badge className="bg-green-100/80 text-green-700 rounded-full">
                        Processado
                      </Badge>
                    } 
                  />
                </div>
              </div>
            </div>
            
            {/* Observações */}
            {venda.observacoes && (
              <div className="mt-10">
                <SectionHeader icon={MessageSquare} title="Observações" color="gray" />
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                  <p className="text-gray-800 leading-relaxed">{venda.observacoes}</p>
                </div>
              </div>
            )}
            
            {/* Informações do Sistema */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="text-gray-600">
                  <span className="font-semibold text-gray-800">Criado em:</span> {formatarDataHora(venda.created_at)}
                </div>
                <div className="text-gray-600">
                  <span className="font-semibold text-gray-800">Última atualização:</span> {formatarDataHora(venda.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              Fechar
            </button>
            <div className="flex space-x-3">
              <button
                onClick={() => onEdit(venda)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}