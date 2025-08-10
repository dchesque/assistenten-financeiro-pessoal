import { Badge } from '@/components/ui/badge';
import { ContaPagar } from '@/types/contaPagar';
import { Fornecedor } from '@/types/fornecedor';
import { PlanoContas } from '@/types/planoContas';
import { Banco } from '@/types/banco';
import { formatarMoeda, formatarData, formatarDataHora } from '@/utils/formatters';
import { Edit, FileText, X, DollarSign, Calendar, CreditCard, MessageSquare, Building2 } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        
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
            
            {/* Descrição Destacada */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Descrição</h3>
              <p className="text-gray-800 text-base leading-relaxed">{conta.descricao}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Coluna 1: Informações do Contato e Categoria */}
              <div className="space-y-6">
                
                {/* Contato/Credor */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Contato</h4>
                  </div>
                  <p className="text-gray-700 font-medium text-lg">
                    {conta.fornecedor ? conta.fornecedor.nome : 'Sem contato vinculado'}
                  </p>
                </div>

                {/* Categoria */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Categoria</h4>
                  </div>
                  {conta.plano_conta ? (
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: conta.plano_conta.cor || '#6B7280' }}
                      />
                      <p className="text-gray-700 font-medium text-lg">{conta.plano_conta.nome}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Sem categoria</p>
                  )}
                </div>

                {/* Documentos */}
                {conta.documento_referencia && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Documento</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{conta.documento_referencia}</p>
                  </div>
                )}
              </div>
              
              {/* Coluna 2: Informações Financeiras e Datas */}
              <div className="space-y-6">
                
                {/* Informações Financeiras */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Valores</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor Original:</span>
                      <span className="font-semibold text-gray-900">{formatarMoeda(conta.valor_original)}</span>
                    </div>
                    
                    {conta.valor_juros && conta.valor_juros > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Juros/Multa:</span>
                        <span className="font-semibold text-red-600">+{formatarMoeda(conta.valor_juros)}</span>
                      </div>
                    )}
                    
                    {conta.valor_desconto && conta.valor_desconto > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Desconto:</span>
                        <span className="font-semibold text-green-600">-{formatarMoeda(conta.valor_desconto)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Valor Final:</span>
                        <span className="text-2xl font-bold text-blue-600">{formatarMoeda(conta.valor_final)}</span>
                      </div>
                    </div>
                    
                    {conta.status === 'pago' && conta.valor_pago && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-medium">Valor Pago:</span>
                          <span className="font-bold text-green-600">{formatarMoeda(conta.valor_pago)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Datas */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Datas</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {conta.data_emissao && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Data de Emissão:</span>
                        <span className="font-medium text-gray-900">{formatarData(conta.data_emissao)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Data de Vencimento:</span>
                      <span className={`font-medium ${
                        conta.status !== 'pago' && diasVencimento < 0 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                      }`}>
                        {formatarData(conta.data_vencimento)}
                      </span>
                    </div>
                    
                    {conta.status !== 'pago' && diasVencimento < 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-800 font-semibold text-center">
                          ⚠️ {Math.abs(diasVencimento)} dias em atraso
                        </p>
                      </div>
                    )}
                    
                    {conta.status === 'pago' && conta.data_pagamento && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-medium">Data de Pagamento:</span>
                          <span className="font-bold text-green-600">{formatarData(conta.data_pagamento)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações do Banco (se pago) */}
                {conta.status === 'pago' && conta.banco && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Banco</h4>
                    </div>
                    <p className="text-gray-700 font-medium">{conta.banco.nome}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Observações */}
            {conta.observacoes && (
              <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Observações</h4>
                </div>
                <p className="text-gray-800 leading-relaxed">{conta.observacoes}</p>
              </div>
            )}
            
            {/* Informações do Sistema */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium text-gray-700">Criado em:</span> {formatarDataHora(conta.created_at || '')}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Última atualização:</span> {formatarDataHora(conta.updated_at || '')}
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