import { useState } from 'react';
import { Eye, Edit3, Calendar, DollarSign, Hash, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ParcelaPreview, LancamentoLoteSummary } from '@/types/lancamentoLote';
import { FormaPagamento } from '@/types/formaPagamento';
import { formatarData } from '@/utils/formatters';
import { aplicarMascaraMoeda, converterMoedaParaNumero } from '@/utils/masks';

interface PreviewParcelasSimplificadoProps {
  parcelas: ParcelaPreview[];
  onEditarParcela: (numero: number, novoValor: number) => void;
  onEditarData: (numero: number, novaData: string) => void;
  formaPagamento?: FormaPagamento;
  onChequeChange?: (numeroParcela: number, numeroCheque: string) => void;
  className?: string;
}

export function PreviewParcelasSimplificado({ 
  parcelas, 
  onEditarParcela, 
  onEditarData,
  formaPagamento,
  onChequeChange,
  className = "" 
}: PreviewParcelasSimplificadoProps) {
  const [valoresEditados, setValoresEditados] = useState<{[key: number]: string}>({});
  const [datasEditadas, setDatasEditadas] = useState<{[key: number]: string}>({});
  const [numerosCheques, setNumerosCheques] = useState<{[key: number]: string}>({});

  // Cálculo do resumo
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
      intervalo: 'Mensal'
    };
  };

  // Edição de valor inline
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
        }, 1000);
      } else {
        toast({
          title: "Valor inválido",
          description: "O valor deve ser maior que zero",
          variant: "destructive"
        });
      }
    }
  };

  // Edição de data inline
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
      }, 1000);
    }
  };

  // Preencher sequência de cheques
  const preencherSequencia = () => {
    if (!formaPagamento?.banco_id) {
      toast({
        title: "Erro",
        description: "Selecione um banco primeiro",
        variant: "destructive"
      });
      return;
    }
    
    const primeiroCheque = numerosCheques[1] || '';
    if (!primeiroCheque.trim()) {
      toast({
        title: "Erro", 
        description: "Preencha o número do primeiro cheque",
        variant: "destructive"
      });
      return;
    }
    
    const numeroBase = parseInt(primeiroCheque);
    if (isNaN(numeroBase)) {
      toast({
        title: "Erro",
        description: "Número do primeiro cheque deve ser numérico",
        variant: "destructive"
      });
      return;
    }

    const novosNumeros: {[key: number]: string} = { ...numerosCheques };
    
    for (let i = 2; i <= parcelas.length; i++) {
      const numeroSequencial = (numeroBase + (i - 1)).toString().padStart(6, '0');
      novosNumeros[i] = numeroSequencial;
      
      if (onChequeChange) {
        onChequeChange(i, numeroSequencial);
      }
    }
    
    setNumerosCheques(novosNumeros);
    
    toast({
      title: "Sequência preenchida!",
      description: `Cheques ${numeroBase.toString().padStart(6, '0')} a ${(numeroBase + parcelas.length - 1).toString().padStart(6, '0')}`
    });
  };

  const handleChequeChange = (numeroParcela: number, numeroCheque: string) => {
    setNumerosCheques(prev => ({
      ...prev,
      [numeroParcela]: numeroCheque
    }));
    
    if (onChequeChange) {
      onChequeChange(numeroParcela, numeroCheque);
    }
  };

  const resumo = calcularResumo();

  if (parcelas.length === 0) {
    return (
      <div className={`card-base p-8 text-center ${className}`}>
        <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Preview das Parcelas</h3>
        <p className="text-gray-500">Configure os dados para visualizar as parcelas</p>
      </div>
    );
  }

  return (
    <div className={`card-base ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200/50 p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100/80 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Preview das Parcelas</h3>
              <p className="text-sm text-gray-600">Visualize e edite as parcelas</p>
            </div>
          </div>
          
          <Badge variant="outline" className="bg-purple-50/80 text-purple-700 border-purple-200">
            {resumo.total_parcelas} parcelas
          </Badge>
        </div>
      </div>

      {/* Resumo */}
      <div className="p-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 text-blue-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Período</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatarData(resumo.primeira_data)} - {formatarData(resumo.ultima_data)}
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
          
          <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 text-green-600 mb-1">
              <Hash className="h-4 w-4" />
              <span className="text-sm font-medium">Parcelas</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {resumo.total_parcelas}x de R$ {(resumo.valor_total / resumo.total_parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela simplificada */}
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
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  {formaPagamento?.tipo === 'cheque' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <span>Nº Cheque</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={preencherSequencia}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <Wand2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50">
                {parcelas.map((parcela) => (
                  <tr key={parcela.numero} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {parcela.numero}
                        </span>
                        {parcela.editada && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Editada
                          </Badge>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      {datasEditadas[parcela.numero] !== undefined ? (
                        <Input
                          type="date"
                          value={datasEditadas[parcela.numero]}
                          onChange={(e) => handleDataChange(parcela.numero, e.target.value)}
                          onBlur={() => handleDataBlur(parcela.numero)}
                          className="w-40 h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleDataChange(parcela.numero, parcela.data_vencimento)}
                          className="text-sm text-gray-900 hover:text-blue-600 flex items-center space-x-1"
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{formatarData(parcela.data_vencimento)}</span>
                          <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 text-right">
                      {valoresEditados[parcela.numero] !== undefined ? (
                        <Input
                          value={valoresEditados[parcela.numero]}
                          onChange={(e) => handleValorChange(parcela.numero, e.target.value)}
                          onBlur={() => handleValorBlur(parcela.numero)}
                          className="w-32 h-8 text-sm text-right"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => handleValorChange(parcela.numero, parcela.valor.toString())}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 flex items-center space-x-1 ml-auto"
                        >
                          <DollarSign className="h-3 w-3" />
                          <span>R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>
                    
                    {formaPagamento?.tipo === 'cheque' && (
                      <td className="px-4 py-3">
                        <Input
                          value={numerosCheques[parcela.numero] || parcela.numero_cheque || ''}
                          onChange={(e) => handleChequeChange(parcela.numero, e.target.value)}
                          placeholder="000000"
                          className="w-24 h-8 text-sm"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}