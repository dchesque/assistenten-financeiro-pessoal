import { useState, useEffect } from 'react';
import { X, Edit, User, FileText, DollarSign, MessageSquare } from 'lucide-react';
import { ContaPagar } from '@/types/contaPagar';
import { Fornecedor } from '@/types/fornecedor';
import { PlanoContas } from '@/types/planoContas';
import { formatarMoeda, parseMoeda, formatarData } from '@/utils/formatters';
import { SectionHeader, FieldDisplay, LoadingSpinner, CurrencyInput } from './ModalComponents';
import { FornecedorSelector } from './FornecedorSelector';
import { PlanoContasSelector } from './PlanoContasSelector';

interface ContaEditarModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: (ContaPagar & {
    fornecedor: Fornecedor;
    plano_conta: PlanoContas;
  }) | null;
  onSalvar: (dadosEdicao: any) => void;
}

export default function ContaEditarModal({ isOpen, onClose, conta, onSalvar }: ContaEditarModalProps) {
  const [dadosEdicao, setDadosEdicao] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [errosValidacao, setErrosValidacao] = useState<Record<string, string>>({});


  // Inicializar dados quando a conta for carregada
  useEffect(() => {
    if (conta) {
      setDadosEdicao({
        ...conta,
        fornecedor: conta.fornecedor,
        plano_conta: conta.plano_conta
      });
    }
  }, [conta]);

  // Recalcular valores automaticamente
  useEffect(() => {
    const valorOriginal = parseFloat(dadosEdicao.valor_original) || 0;
    const percJuros = parseFloat(dadosEdicao.percentual_juros) || 0;
    const percDesconto = parseFloat(dadosEdicao.percentual_desconto) || 0;
    
    const valorJuros = (valorOriginal * percJuros) / 100;
    const valorDesconto = (valorOriginal * percDesconto) / 100;
    const valorFinal = valorOriginal + valorJuros - valorDesconto;
    
    setDadosEdicao((prev: any) => ({
      ...prev,
      valor_juros: valorJuros,
      valor_desconto: valorDesconto,
      valor_final: valorFinal
    }));
  }, [dadosEdicao.valor_original, dadosEdicao.percentual_juros, dadosEdicao.percentual_desconto]);

  // Validação em tempo real
  const validarCampo = async (campo: string, valor: any) => {
    const { ValidationService } = await import('@/services/ValidationService');
    const novoErro = ValidationService.validarContaPagar({ 
      [campo]: valor,
      ...dadosEdicao // Contexto completo
    });
    setErrosValidacao(prev => ({
      ...prev,
      [campo]: novoErro[campo] || ''
    }));
  };

  const handleSalvar = async () => {
    try {
      setErro('');
      setLoading(true);

      // Validações básicas
      if (!dadosEdicao.descricao?.trim()) {
        setErro('Descrição é obrigatória');
        return;
      }
      if (!dadosEdicao.fornecedor?.id) {
        setErro('Credor é obrigatório');
        return;
      }
      if (!dadosEdicao.plano_conta?.id) {
        setErro('Categoria é obrigatória');
        return;
      }
      if (!dadosEdicao.data_vencimento) {
        setErro('Data de vencimento é obrigatória');
        return;
      }
      if (!dadosEdicao.valor_original || dadosEdicao.valor_original <= 0) {
        setErro('Valor original deve ser maior que zero');
        return;
      }

      await onSalvar(dadosEdicao);
      onClose();
    } catch (error) {
      setErro('Erro ao salvar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!conta || !isOpen) return null;

  return (
    <>
      {/* Modal Principal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Edit className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Editar Conta a Pagar
                  </h2>
                  <p className="text-sm text-gray-500">ID: #{conta?.id}</p>
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

          {/* Erro */}
          {erro && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">{erro}</p>
            </div>
          )}

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Coluna 1: Dados Básicos */}
              <div className="space-y-8">
                <SectionHeader icon={User} title="Dados do Credor" color="blue" />
                
                 <div className="space-y-4">
                   {/* Credor */}
                   <div>
                     <label className="text-sm font-medium text-gray-700 mb-2 block">
                       Credor *
                     </label>
                      <FornecedorSelector
                        value={dadosEdicao.fornecedor}
                        onSelect={(fornecedor) => {
                          setDadosEdicao((prev: any) => ({ ...prev, fornecedor }));

                          // Auto-preencher categoria padrão do credor se existir
                          if (fornecedor.categoria_padrao_id && !dadosEdicao.plano_conta) {
                            import('@/integrations/supabase/client').then(({ supabase }) => {
                              supabase
                                .from('plano_contas')
                                .select('*')
                                .eq('id', fornecedor.categoria_padrao_id)
                                .eq('aceita_lancamento', true)
                                .single()
                                .then(({ data, error }) => {
                                  if (data && !error) {
                                    const categoriaDefault: PlanoContas = {
                                      id: data.id,
                                      codigo: data.codigo,
                                      nome: data.nome,
                                      tipo_dre: 'despesa_pessoal',
                                      cor: data.cor || '#6B7280',
                                      icone: data.icone || 'Package',
                                      nivel: data.nivel,
                                      plano_pai_id: data.plano_pai_id,
                                      aceita_lancamento: data.aceita_lancamento,
                                      ativo: data.ativo,
                                      total_contas: 0,
                                      valor_total: 0,
                                      created_at: data.created_at,
                                      updated_at: data.updated_at
                                    };
                                    
                                    setDadosEdicao((prev: any) => ({ ...prev, plano_conta: categoriaDefault }));
                                  }
                                });
                            });
                          }
                        }}
                        placeholder="Selecionar credor..."
                        className="w-full"
                      />
                   </div>

                   {/* Categoria */}
                   <div>
                     <label className="text-sm font-medium text-gray-700 mb-2 block">
                       Categoria/Plano de Contas *
                     </label>
                     <PlanoContasSelector
                       value={dadosEdicao.plano_conta}
                       onSelect={(conta) => setDadosEdicao((prev: any) => ({ ...prev, plano_conta: conta }))}
                       placeholder="Selecionar categoria..."
                       className="w-full"
                     />
                   </div>
                 </div>

                <SectionHeader icon={FileText} title="Dados da Conta" color="purple" />
                
                <div className="space-y-4">
                  {/* Descrição */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Descrição *
                    </label>
                     <input
                       type="text"
                       value={dadosEdicao.descricao || ''}
                        onChange={async (e) => {
                          const valor = e.target.value;
                          setDadosEdicao((prev: any) => ({ ...prev, descricao: valor }));
                          await validarCampo('descricao', valor);
                        }}
                       className={`w-full bg-white border rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                         errosValidacao.descricao 
                           ? 'border-red-300 focus:ring-red-500' 
                           : 'border-gray-300 focus:ring-blue-500'
                       }`}
                       placeholder="Descrição da conta"
                     />
                     {errosValidacao.descricao && (
                       <p className="text-red-500 text-sm mt-1">{errosValidacao.descricao}</p>
                     )}
                  </div>

                  {/* Documento/Referência */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Documento/Referência
                    </label>
                    <input
                      type="text"
                      value={dadosEdicao.documento_referencia || ''}
                      onChange={(e) => setDadosEdicao((prev: any) => ({ ...prev, documento_referencia: e.target.value }))}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="NF 12345, Pedido 567, etc."
                    />
                  </div>

                  {/* Data de Vencimento */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Data de Vencimento *
                    </label>
                     <input
                       type="date"
                       value={dadosEdicao.data_vencimento || ''}
                        onChange={async (e) => {
                          const valor = e.target.value;
                          setDadosEdicao((prev: any) => ({ ...prev, data_vencimento: valor }));
                          await validarCampo('data_vencimento', valor);
                        }}
                       className={`w-full bg-white border rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                         errosValidacao.data_vencimento 
                           ? 'border-red-300 focus:ring-red-500' 
                           : 'border-gray-300 focus:ring-blue-500'
                       }`}
                     />
                     {errosValidacao.data_vencimento && (
                       <p className="text-red-500 text-sm mt-1">{errosValidacao.data_vencimento}</p>
                     )}
                  </div>
                </div>
              </div>

              {/* Coluna 2: Valores */}
              <div className="space-y-8">
                <SectionHeader icon={DollarSign} title="Valores e Cálculos" color="green" />
                
                <div className="space-y-4">
                  {/* Valor Original */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Valor Original *
                    </label>
                     <CurrencyInput
                       value={dadosEdicao.valor_original || 0}
                        onChange={async (valor) => {
                          setDadosEdicao((prev: any) => ({ ...prev, valor_original: valor }));
                          await validarCampo('valor_original', valor);
                        }}
                       className={`bg-white border rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                         errosValidacao.valor_original 
                           ? 'border-red-300 focus:ring-red-500' 
                           : 'border-gray-300 focus:ring-blue-500'
                       }`}
                       placeholder="R$ 0,00"
                     />
                     {errosValidacao.valor_original && (
                       <p className="text-red-500 text-sm mt-1">{errosValidacao.valor_original}</p>
                     )}
                  </div>

                  {/* Juros */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Juros/Multa</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={dadosEdicao.percentual_juros || ''}
                          onChange={(e) => setDadosEdicao((prev: any) => ({ ...prev, percentual_juros: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="0,00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Percentual (%)</p>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={formatarMoeda(dadosEdicao.valor_juros || 0)}
                          readOnly
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-right text-gray-600 font-medium"
                        />
                        <p className="text-xs text-gray-500 mt-1">Valor (R$)</p>
                      </div>
                    </div>
                  </div>

                  {/* Desconto */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Desconto</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={dadosEdicao.percentual_desconto || ''}
                          onChange={(e) => setDadosEdicao((prev: any) => ({ ...prev, percentual_desconto: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="0,00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Percentual (%)</p>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={formatarMoeda(dadosEdicao.valor_desconto || 0)}
                          readOnly
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-right text-gray-600 font-medium"
                        />
                        <p className="text-xs text-gray-500 mt-1">Valor (R$)</p>
                      </div>
                    </div>
                  </div>

                  {/* Valor Final */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Valor Final:</span>
                      <span className="text-3xl font-bold text-blue-600">
                        {formatarMoeda(dadosEdicao.valor_final || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="mt-10">
              <SectionHeader icon={MessageSquare} title="Observações" color="gray" />
              <textarea
                value={dadosEdicao.observacoes || ''}
                onChange={(e) => setDadosEdicao((prev: any) => ({ ...prev, observacoes: e.target.value }))}
                rows={4}
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Observações sobre esta conta..."
              />
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
              Cancelar
            </button>
            <button 
              onClick={handleSalvar}
              disabled={loading}
              className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}