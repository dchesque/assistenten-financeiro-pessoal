import { useState, useEffect } from 'react';
import { Eye, Edit3, Calendar, DollarSign, CheckCircle, Clock, Plus, Hash, RotateCcw, Scale, AlertCircle, Check, X, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { ParcelaPreview, LancamentoLoteSummary } from '@/types/lancamentoLote';
import { FormaPagamento } from '@/types/formaPagamento';
import { EditarParcelaModal } from './EditarParcelaModal';
import { ModalConfirmacaoCheques } from './ModalConfirmacaoCheques';
import { useValidacoesCheques } from '@/hooks/useValidacoesCheques';
import { formatarData } from '@/utils/formatters';
import { aplicarMascaraMoeda, converterMoedaParaNumero } from '@/utils/masks';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { supabase } from '@/integrations/supabase/client';

interface PreviewParcelasProps {
  parcelas: ParcelaPreview[];
  onEditarParcela: (numero: number, novoValor: number) => void;
  onEditarData: (numero: number, novaData: string) => void;
  formaPagamento?: FormaPagamento;
  onChequeChange?: (numeroParcela: number, numeroCheque: string) => void;
  className?: string;
}

export function PreviewParcelas({ 
  parcelas, 
  onEditarParcela, 
  onEditarData,
  formaPagamento,
  onChequeChange,
  className = "" 
}: PreviewParcelasProps) {
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<ParcelaPreview | null>(null);
  const [numerosCheques, setNumerosCheques] = useState<{[key: number]: string}>({});
  const [valoresEditados, setValoresEditados] = useState<{[key: number]: string}>({});
  const [datasEditadas, setDatasEditadas] = useState<{[key: number]: string}>({});
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [chequesProblematicos, setChequesProblematicos] = useState<Array<{ numero: string; motivo: string }>>([]);

  // Hooks
  const { bancos } = useBancosSupabase();
  const { validarNumeroCheque, validarSequenciaCheques, buscarProximoNumeroDisponivel } = useValidacoesCheques();

  const handleEditarClick = (parcela: ParcelaPreview) => {
    setParcelaSelecionada(parcela);
    setModalEditarAberto(true);
  };

  const handleSalvarEdicao = (novoValor: number) => {
    if (parcelaSelecionada) {
      onEditarParcela(parcelaSelecionada.numero, novoValor);
    }
  };

  // Buscar próximo número disponível do banco selecionado
  const buscarProximoNumero = async (bancoId: number): Promise<string> => {
    try {
      // Buscar cheques existentes no Supabase
      const { data: chequesExistentes } = await supabase
        .from('cheques')
        .select('numero_cheque')
        .eq('banco_id', bancoId);

      const numerosExistentes = (chequesExistentes || [])
        .map(c => parseInt(c.numero_cheque))
        .filter(n => !isNaN(n));

      // Incluir também os números já digitados nas outras parcelas
      const numerosDigitados = Object.values(numerosCheques)
        .map(num => parseInt(num))
        .filter(n => !isNaN(n));

      const todosNumeros = [...numerosExistentes, ...numerosDigitados].sort((a, b) => a - b);
      
      let proximo = 1;
      for (const numero of todosNumeros) {
        if (numero === proximo) {
          proximo++;
        } else {
          break;
        }
      }

      return proximo.toString().padStart(6, '0');
    } catch (error) {
      console.error('Erro ao buscar próximo número:', error);
      return '000001';
    }
  };


  // Validação em tempo real usando hook customizado
  const [chequesValidation, setChequesValidation] = useState<{[key: number]: 'valid' | 'invalid' | 'empty'}>({});

  useEffect(() => {
    if (!formaPagamento?.banco_id) return;
    
    const novaValidacao: {[key: number]: 'valid' | 'invalid' | 'empty'} = {};
    Object.entries(numerosCheques).forEach(([parcelaNum, numero]) => {
      const validacao = validarNumeroCheque(numero, parseInt(parcelaNum), formaPagamento.banco_id, numerosCheques);
      novaValidacao[parseInt(parcelaNum)] = validacao.status as 'valid' | 'invalid' | 'empty';
    });
    setChequesValidation(novaValidacao);
  }, [numerosCheques, formaPagamento?.banco_id]);

  // Atualizar número de cheque
  const handleChequeChange = (numeroParcela: number, numeroCheque: string) => {
    setNumerosCheques(prev => ({
      ...prev,
      [numeroParcela]: numeroCheque
    }));
    
    if (onChequeChange) {
      onChequeChange(numeroParcela, numeroCheque);
    }
  };

  // Sugerir próximo número disponível para uma parcela
  const handleProximoDisponivel = async (numeroParcela: number) => {
    if (!formaPagamento?.banco_id) return;
    
    const proximoNumero = await buscarProximoNumero(formaPagamento.banco_id);
    handleChequeChange(numeroParcela, proximoNumero);
  };

  // Funções para edição inline de valor
  const handleValorChange = (numeroParcela: number, valor: string) => {
    const valorMascarado = aplicarMascaraMoeda(valor);
    setValoresEditados(prev => ({
      ...prev,
      [numeroParcela]: valorMascarado
    }));
  };

  const handleValorBlur = (numeroParcela: number) => {
    const valorEditado = valoresEditados[numeroParcela];
    if (valorEditado) {
      const valorNumerico = converterMoedaParaNumero(valorEditado);
      if (valorNumerico > 0) {
        onEditarParcela(numeroParcela, valorNumerico);
        setTimeout(() => {
          setValoresEditados(prev => {
            const novosValores = { ...prev };
            delete novosValores[numeroParcela];
            return novosValores;
          });
        }, 2000); // Limpar após 2s para mostrar feedback visual
      } else {
        toast({
          title: "Valor inválido",
          description: "O valor deve ser maior que zero",
          variant: "destructive"
        });
      }
    }
  };

  // Funções para edição inline de data
  const handleDataChange = (numeroParcela: number, data: string) => {
    setDatasEditadas(prev => ({
      ...prev,
      [numeroParcela]: data
    }));
  };

  const handleDataBlur = (numeroParcela: number) => {
    const dataEditada = datasEditadas[numeroParcela];
    if (dataEditada) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataInformada = new Date(dataEditada);
      
      if (dataInformada < hoje) {
        toast({
          title: "Data inválida",
          description: "A data de vencimento não pode ser no passado",
          variant: "destructive"
        });
        return;
      }
      
      onEditarData(numeroParcela, dataEditada);
      setTimeout(() => {
        setDatasEditadas(prev => {
          const novasDatas = { ...prev };
          delete novasDatas[numeroParcela];
          return novasDatas;
        });
      }, 2000);
    }
  };

  // Resetar todas as datas para sequência original
  const resetarDatas = () => {
    if (parcelas.length === 0) return;
    
    const primeiraData = new Date(parcelas[0].data_vencimento);
    parcelas.forEach((parcela, index) => {
      const novaData = new Date(primeiraData);
      novaData.setMonth(primeiraData.getMonth() + index);
      onEditarData(parcela.numero, novaData.toISOString().split('T')[0]);
    });
    
    toast({
      title: "Datas resetadas",
      description: "Todas as datas foram restauradas para sequência mensal"
    });
  };

  // Equalizar todos os valores
  const equalizarValores = () => {
    if (parcelas.length === 0) return;
    
    const valorPadrao = parcelas[0].valor;
    parcelas.forEach(parcela => {
      if (parcela.valor !== valorPadrao) {
        onEditarParcela(parcela.numero, valorPadrao);
      }
    });
    
    toast({
      title: "Valores equalizados",
      description: `Todas as parcelas foram ajustadas para R$ ${valorPadrao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    });
  };

  // Preencher sequência automática baseado no primeiro cheque
  const preencherSequencia = () => {
    if (!formaPagamento?.banco_id) {
      toast({
        title: "Erro",
        description: "Selecione um banco antes de preencher a sequência",
        variant: "destructive"
      });
      return;
    }
    
    // 1. Pegar valor do primeiro cheque (parcela 1)
    const primeiroCheque = numerosCheques[1] || '';
    
    // 2. Validar se primeiro cheque está preenchido
    if (!primeiroCheque || primeiroCheque.trim() === '') {
      toast({
        title: "Erro",
        description: "Preencha o número do primeiro cheque antes de gerar a sequência",
        variant: "destructive"
      });
      return;
    }
    
    // 3. Converter para número e validar
    const numeroBase = parseInt(primeiroCheque);
    if (isNaN(numeroBase)) {
      toast({
        title: "Erro",
        description: "Número do primeiro cheque deve ser numérico",
        variant: "destructive"
      });
      return;
    }

    // 4. Validar sequência antes de preencher
    const validacao = validarSequenciaCheques(primeiroCheque, parcelas.length, formaPagamento.banco_id);
    
    if (validacao.temDuplicatas) {
      setChequesProblematicos(validacao.chequesProblematicos);
      setModalConfirmacaoAberto(true);
      return;
    }
    
    // 5. Gerar sequência para parcelas restantes
    const novosNumeros: {[key: number]: string} = { ...numerosCheques };
    
    for (let i = 2; i <= parcelas.length; i++) {
      const numeroSequencial = (numeroBase + (i - 1)).toString().padStart(6, '0');
      novosNumeros[i] = numeroSequencial;
      
      if (onChequeChange) {
        onChequeChange(i, numeroSequencial);
      }
    }
    
    setNumerosCheques(novosNumeros);
    
    // 6. Feedback de sucesso
    const ultimoNumero = numeroBase + parcelas.length - 1;
    toast({
      title: "Sequência preenchida com sucesso!",
      description: `Sequência criada: ${numeroBase.toString().padStart(6, '0')} a ${ultimoNumero.toString().padStart(6, '0')}`
    });
  };

  // Continuar com sequência mesmo com duplicatas
  const continuarSequenciaComDuplicatas = () => {
    const primeiroCheque = numerosCheques[1] || '';
    const numeroBase = parseInt(primeiroCheque);
    const novosNumeros: {[key: number]: string} = { ...numerosCheques };
    
    for (let i = 2; i <= parcelas.length; i++) {
      const numeroSequencial = (numeroBase + (i - 1)).toString().padStart(6, '0');
      novosNumeros[i] = numeroSequencial;
      
      if (onChequeChange) {
        onChequeChange(i, numeroSequencial);
      }
    }
    
    setNumerosCheques(novosNumeros);
    setModalConfirmacaoAberto(false);
    
    toast({
      title: "⚠️ Sequência criada com duplicatas",
      description: "Revise os números antes de salvar",
      variant: "destructive"
    });
  };

  const calcularResumo = (): LancamentoLoteSummary => {
    const total_parcelas = parcelas.length;
    const valor_total = parcelas.reduce((acc, p) => acc + p.valor, 0);
    const primeira_data = parcelas.length > 0 ? parcelas[0].data_vencimento : '';
    const ultima_data = parcelas.length > 0 ? parcelas[parcelas.length - 1].data_vencimento : '';
    
    return {
      total_parcelas,
      valor_total,
      primeira_data,
      ultima_data,
      intervalo: 'Mensal' // Simplificado para o resumo
    };
  };

  const resumo = calcularResumo();

  if (parcelas.length === 0) {
    return (
      <div className={`card-base p-8 text-center ${className}`}>
        <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Preview das Parcelas</h3>
        <p className="text-gray-500">Preencha os dados da configuração para visualizar as parcelas</p>
      </div>
    );
  }

  return (
    <>
      <div className={`card-base ${className}`}>
        {/* Header da seção */}
        <div className="border-b border-gray-200/50 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100/80 rounded-lg">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Preview das Parcelas</h3>
                <p className="text-sm text-gray-600">Visualize e edite as parcelas que serão criadas</p>
              </div>
            </div>
            
            <Badge variant="outline" className="bg-purple-50/80 text-purple-700 border-purple-200">
              {resumo.total_parcelas} parcelas
            </Badge>
          </div>
        </div>

        {/* Resumo */}
        <div className="p-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-2 text-blue-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Primeira</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatarData(resumo.primeira_data)}
              </p>
            </div>
            
            <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-2 text-green-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Última</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatarData(resumo.ultima_data)}
              </p>
            </div>
            
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-2 text-purple-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Valor Total</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                R$ {resumo.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="bg-orange-50/80 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-2 text-orange-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Parcelas</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {resumo.total_parcelas}x de R$ {(resumo.valor_total / resumo.total_parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Tabela de parcelas */}
        <div className="px-6 pb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parcela
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>Vencimento</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={resetarDatas}
                                className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Resetar para sequência mensal</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-end space-x-2">
                        <DollarSign className="h-3 w-3" />
                        <span>Valor</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={equalizarValores}
                                className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600"
                              >
                                <Scale className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Igualar todos os valores</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </th>
                    {formaPagamento?.tipo === 'cheque' && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center justify-center space-x-2">
                          <Hash className="h-3 w-3" />
                          <span>Número do Cheque</span>
                          {formaPagamento?.banco_id && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={preencherSequencia}
                                    disabled={!numerosCheques[1] || !numerosCheques[1].trim()}
                                    className={`ml-2 text-xs h-6 px-2 transition-all duration-200 ${
                                      numerosCheques[1] && numerosCheques[1].trim()
                                        ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600'
                                        : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    Preencher Sequência
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {numerosCheques[1] && numerosCheques[1].trim() ? (
                                    <div className="space-y-1">
                                      <p>Gerar sequência baseada no primeiro cheque</p>
                                      <p className="text-xs text-blue-600 font-mono">
                                        {(() => {
                                          const primeiro = parseInt(numerosCheques[1]);
                                          if (!isNaN(primeiro)) {
                                            const ultimo = primeiro + parcelas.length - 1;
                                            return `Sequência: ${primeiro.toString().padStart(6, '0')} → ${ultimo.toString().padStart(6, '0')}`;
                                          }
                                          return '';
                                        })()}
                                      </p>
                                    </div>
                                  ) : (
                                    <p>Preencha o primeiro cheque para gerar sequência</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </th>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {parcelas.map((parcela) => {
                    const validation = chequesValidation[parcela.numero];
                    const numeroCheque = numerosCheques[parcela.numero] || '';
                    
                    return (
                      <tr 
                        key={parcela.numero}
                        className="hover:bg-gray-50/50 transition-colors duration-200"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {parcela.numero}/{resumo.total_parcelas}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <Input
                            type="date"
                            value={datasEditadas[parcela.numero] || parcela.data_vencimento}
                            onChange={(e) => handleDataChange(parcela.numero, e.target.value)}
                            onBlur={() => handleDataBlur(parcela.numero)}
                            className={`w-36 text-sm transition-all duration-200 ${
                              parcela.status === 'editada' && !datasEditadas[parcela.numero]
                                ? 'border-blue-300 bg-blue-50/50'
                                : datasEditadas[parcela.numero]
                                ? 'border-orange-300 bg-orange-50/50'
                                : 'border-gray-200 bg-white/80'
                            } backdrop-blur-sm`}
                          />
                        </td>
                        
                        <td className="px-4 py-3 text-right">
                          <Input
                            type="text"
                            value={valoresEditados[parcela.numero] || `R$ ${parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            onChange={(e) => handleValorChange(parcela.numero, e.target.value)}
                            onBlur={() => handleValorBlur(parcela.numero)}
                            className={`w-28 text-right text-sm transition-all duration-200 ${
                              parcela.status === 'editada' && !valoresEditados[parcela.numero]
                                ? 'border-blue-300 bg-blue-50/50'
                                : valoresEditados[parcela.numero]
                                ? 'border-orange-300 bg-orange-50/50'
                                : 'border-gray-200 bg-white/80'
                            } backdrop-blur-sm`}
                          />
                        </td>
                        
                        {formaPagamento?.tipo === 'cheque' && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center space-x-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="relative">
                                      <Input
                                        type="text"
                                        placeholder="000001"
                                        value={numeroCheque}
                                        onChange={(e) => handleChequeChange(parcela.numero, e.target.value)}
                                        className={`w-20 text-center font-mono text-sm ${
                                          validation === 'valid' ? 'border-green-500 bg-green-50/50' :
                                          validation === 'invalid' ? 'border-red-500 bg-red-50/50' :
                                          'border-gray-300 bg-white/80'
                                        } backdrop-blur-sm`}
                                        maxLength={6}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  {validation === 'invalid' && (
                                    <TooltipContent className="bg-red-100 text-red-800 border-red-200">
                                      <p>Cheque já existe ou duplicado</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                              
                              {formaPagamento?.banco_id && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleProximoDisponivel(parcela.numero)}
                                        className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-600"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Usar próximo número disponível</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </td>
                        )}
                        
                        <td className="px-4 py-3 text-center">
                          {parcela.status === 'editada' ? (
                            <Badge variant="outline" className="bg-orange-100/80 text-orange-700 border-orange-200">
                              <Edit3 className="h-3 w-3 mr-1" />
                              Editada
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100/80 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Calculada
                            </Badge>
                          )}
                        </td>
                         
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <EditarParcelaModal
        isOpen={modalEditarAberto}
        onClose={() => setModalEditarAberto(false)}
        parcela={parcelaSelecionada}
        onSave={handleSalvarEdicao}
      />

      <ModalConfirmacaoCheques
        isOpen={modalConfirmacaoAberto}
        onClose={() => setModalConfirmacaoAberto(false)}
        onConfirm={continuarSequenciaComDuplicatas}
        chequesProblematicos={chequesProblematicos}
        banco_nome={bancos.find(b => b.id === formaPagamento?.banco_id)?.nome || 'Banco selecionado'}
      />
    </>
  );
}