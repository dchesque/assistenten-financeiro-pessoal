import { Badge } from '@/components/ui/badge';
import { ContaPagar } from '@/types/contaPagar';
import { Fornecedor } from '@/types/fornecedor';
import { PlanoContas } from '@/types/planoContas';
import { Banco } from '@/types/banco';
import { formatarMoeda, formatarData, formatarDataHora } from '@/utils/formatters';
import { Edit, FileText, X, Info, Calendar, DollarSign, CreditCard, MessageSquare } from 'lucide-react';
import { SectionHeader, FieldDisplay } from './ModalComponents';

interface ContaVisualizarModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: (ContaPagar & {
    fornecedor: Fornecedor;
    plano_conta: PlanoContas;
    banco?: Banco;
    dias_para_vencimento?: number;
    dias_em_atraso?: number;
  }) | null;
  onEditar: (conta: any) => void;
  onBaixar: (conta: any) => void;
  onDuplicar: (conta: any) => void;
  onExcluir: (conta: any) => void;
}

export default function ContaVisualizarModal({ 
  isOpen, 
  onClose, 
  conta, 
  onEditar, 
  onBaixar, 
  onDuplicar, 
  onExcluir 
}: ContaVisualizarModalProps) {
  if (!conta) return null;

  const getStatusConfig = (status: string) => {
    const configs = {
      pendente: { color: 'bg-yellow-100/80 text-yellow-700', label: 'Pendente' },
      pago: { color: 'bg-green-100/80 text-green-700', label: 'Pago' },
      vencido: { color: 'bg-red-100/80 text-red-700', label: 'Vencido' },
      cancelado: { color: 'bg-gray-100/80 text-gray-700', label: 'Cancelado' }
    };
    return configs[status as keyof typeof configs] || configs.pendente;
  };

  const statusConfig = getStatusConfig(conta.status);

  const calcularDiasVencimento = () => {
    const hoje = new Date();
    const vencimento = new Date(conta.data_vencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const diasVencimento = calcularDiasVencimento();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Visualizar Conta a Pagar
                </h2>
                <p className="text-sm text-gray-500">ID: #{conta.id}</p>
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
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
            {conta.dda && (
              <Badge className="bg-purple-100/80 text-purple-700">
                DDA
              </Badge>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Coluna 1: Informações Básicas */}
              <div className="space-y-8">
                <SectionHeader icon={Info} title="Informações Básicas" color="blue" />
                
                <div className="space-y-4">
                  <FieldDisplay label="Descrição" value={conta.descricao} />
                  {conta.documento_referencia && (
                    <FieldDisplay label="Documento/Referência" value={conta.documento_referencia} />
                  )}
                  <FieldDisplay 
                    label="Credor" 
                    value={conta.fornecedor ? conta.fornecedor.nome : 'Sem fornecedor'} 
                  />
                  <FieldDisplay 
                    label="Categoria" 
                    value={conta.plano_conta ? conta.plano_conta.nome : 'Sem categoria'} 
                  />
                </div>
                
                <SectionHeader icon={Calendar} title="Datas e Prazos" color="purple" />
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FieldDisplay label="Data de Emissão" value={conta.data_emissao ? formatarData(conta.data_emissao) : '-'} />
                    <FieldDisplay label="Data de Vencimento" value={formatarData(conta.data_vencimento)} />
                  </div>
                  <FieldDisplay label="Data de Vencimento" value={formatarData(conta.data_vencimento)} />
                  
                  {conta.status !== 'pago' && diasVencimento < 0 && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
                      <p className="text-red-800 font-semibold">
                        ⚠️ {Math.abs(diasVencimento)} dias em atraso
                      </p>
                    </div>
                  )}
                  
                  {conta.status === 'pago' && conta.data_pagamento && (
                    <FieldDisplay 
                      label="Data de Pagamento" 
                      value={formatarData(conta.data_pagamento)} 
                      valueClass="text-green-600 font-semibold"
                    />
                  )}
                </div>
              </div>
              
              {/* Coluna 2: Informações Financeiras */}
              <div className="space-y-8">
                <SectionHeader icon={DollarSign} title="Informações Financeiras" color="green" />
                
                <div className="space-y-4">
                  <FieldDisplay label="Valor Original" value={formatarMoeda(conta.valor_original)} />
                  
                  {conta.valor_juros && conta.valor_juros > 0 && (
                    <FieldDisplay 
                      label="Juros" 
                      value={`${conta.percentual_juros ? `${conta.percentual_juros}% - ` : ''}${formatarMoeda(conta.valor_juros)}`}
                      valueClass="text-red-600 font-semibold"
                    />
                  )}
                  
                  {conta.valor_desconto && conta.valor_desconto > 0 && (
                    <FieldDisplay 
                      label="Desconto" 
                      value={`${conta.percentual_desconto ? `${conta.percentual_desconto}% - ` : ''}${formatarMoeda(conta.valor_desconto)}`}
                      valueClass="text-green-600 font-semibold"
                    />
                  )}
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Valor Final:</span>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatarMoeda(conta.valor_final)}
                      </span>
                    </div>
                  </div>
                  
                  {conta.status === 'pago' && conta.valor_pago && (
                    <FieldDisplay 
                      label="Valor Pago" 
                      value={formatarMoeda(conta.valor_pago)} 
                      valueClass="text-green-600 font-semibold" 
                    />
                  )}
                </div>
                
                {conta.status === 'pago' && conta.banco && (
                  <>
                    <SectionHeader icon={CreditCard} title="Informações do Pagamento" color="emerald" />
                    <div className="space-y-4">
                      <FieldDisplay label="Banco" value={conta.banco.nome} />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Observações */}
            {conta.observacoes && (
              <div className="mt-10">
                <SectionHeader icon={MessageSquare} title="Observações" color="gray" />
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                  <p className="text-gray-800 leading-relaxed">{conta.observacoes}</p>
                </div>
              </div>
            )}
            
            {/* Informações do Sistema */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="text-gray-600">
                  <span className="font-semibold text-gray-800">Criado em:</span> {formatarDataHora(conta.created_at || '')}
                </div>
                <div className="text-gray-600">
                  <span className="font-semibold text-gray-800">Última atualização:</span> {formatarDataHora(conta.updated_at || '')}
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
                onClick={() => onEditar(conta)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
              {conta.status === 'pendente' && (
                <button
                  onClick={() => onBaixar(conta)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Baixar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}