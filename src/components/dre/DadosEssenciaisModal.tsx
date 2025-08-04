
import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Package, 
  Save, 
  X,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useFormatacao } from "@/hooks/useFormatacao";

interface DadosEssenciaisDRE {
  id?: number;
  mes_referencia: string;
  cmv_valor: number;
  estoque_inicial_qtd?: number;
  estoque_inicial_valor?: number;
  estoque_final_qtd?: number;
  estoque_final_valor?: number;
  created_at?: string;
  updated_at?: string;
}

interface DadosEssenciaisModalProps {
  isOpen: boolean;
  onClose: () => void;
  dadosExistentes?: DadosEssenciaisDRE;
  onSalvar: (dados: DadosEssenciaisDRE) => Promise<void>;
  cmvSugerido?: number;
  periodoSelecionado?: string;
}

export function DadosEssenciaisModal({ 
  isOpen, 
  onClose, 
  dadosExistentes,
  onSalvar,
  cmvSugerido = 0,
  periodoSelecionado
}: DadosEssenciaisModalProps) {
  const { formatarMoedaInput, converterMoedaParaNumero } = useFormatacao();
  
  // Extrair ano e mês do período de referência
  const extrairAnoMes = (periodo: string) => {
    const [ano, mes] = periodo.split('-');
    return { ano: parseInt(ano), mes: parseInt(mes) };
  };

  const formatarPeriodo = (ano: number, mes: number) => {
    return `${ano}-${mes.toString().padStart(2, '0')}`;
  };

  const periodoInicial = periodoSelecionado || dadosExistentes?.mes_referencia || new Date().toISOString().slice(0, 7);
  const { ano: anoInicial, mes: mesInicial } = extrairAnoMes(periodoInicial);

  const [anoSelecionado, setAnoSelecionado] = useState(anoInicial);
  const [mesSelecionado, setMesSelecionado] = useState(mesInicial);
  
  const [formulario, setFormulario] = useState<DadosEssenciaisDRE>(() => ({
    mes_referencia: periodoInicial,
    cmv_valor: dadosExistentes?.cmv_valor || 0,
    estoque_inicial_qtd: dadosExistentes?.estoque_inicial_qtd || 0,
    estoque_inicial_valor: dadosExistentes?.estoque_inicial_valor || 0,
    estoque_final_qtd: dadosExistentes?.estoque_final_qtd || 0,
    estoque_final_valor: dadosExistentes?.estoque_final_valor || 0,
  }));

  const [valoresFormatados, setValoresFormatados] = useState({
    cmv: '',
    estoqueInicialValor: '',
    estoqueFinalValor: '',
  });

  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);

  // Gerar arrays para os dropdowns
  const anos = Array.from(
    { length: 10 }, 
    (_, i) => new Date().getFullYear() - i
  );

  const meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];

  // Atualizar período no formulário quando ano ou mês mudam
  useEffect(() => {
    const novoPeriodo = formatarPeriodo(anoSelecionado, mesSelecionado);
    setFormulario(prev => ({ ...prev, mes_referencia: novoPeriodo }));
  }, [anoSelecionado, mesSelecionado]);

  // Atualizar dados quando modal abre
  useEffect(() => {
    if (isOpen) {
      const periodoAtualizado = periodoSelecionado || dadosExistentes?.mes_referencia || new Date().toISOString().slice(0, 7);
      const { ano: novoAno, mes: novoMes } = extrairAnoMes(periodoAtualizado);
      
      setAnoSelecionado(novoAno);
      setMesSelecionado(novoMes);

      const novoFormulario = {
        mes_referencia: periodoAtualizado,
        cmv_valor: dadosExistentes?.cmv_valor || 0,
        estoque_inicial_qtd: dadosExistentes?.estoque_inicial_qtd || 0,
        estoque_inicial_valor: dadosExistentes?.estoque_inicial_valor || 0,
        estoque_final_qtd: dadosExistentes?.estoque_final_qtd || 0,
        estoque_final_valor: dadosExistentes?.estoque_final_valor || 0,
      };

      setFormulario(novoFormulario);

      setValoresFormatados({
        cmv: novoFormulario.cmv_valor > 0 ? formatarMoedaInput((novoFormulario.cmv_valor * 100).toString()) : '',
        estoqueInicialValor: novoFormulario.estoque_inicial_valor && novoFormulario.estoque_inicial_valor > 0 
          ? formatarMoedaInput((novoFormulario.estoque_inicial_valor * 100).toString()) : '',
        estoqueFinalValor: novoFormulario.estoque_final_valor && novoFormulario.estoque_final_valor > 0 
          ? formatarMoedaInput((novoFormulario.estoque_final_valor * 100).toString()) : '',
      });

      setErros([]);
    }
  }, [isOpen, dadosExistentes, periodoSelecionado, formatarMoedaInput]);

  if (!isOpen) return null;

  const validarDados = (): boolean => {
    const novosErros: string[] = [];

    if (!formulario.mes_referencia) {
      novosErros.push("Período de referência é obrigatório");
    }

    const hoje = new Date();
    const periodoData = new Date(formulario.mes_referencia + "-01");
    if (periodoData > hoje) {
      novosErros.push("Não é possível lançar dados para períodos futuros");
    }

    if (!formulario.cmv_valor || formulario.cmv_valor <= 0) {
      novosErros.push("CMV deve ser maior que zero");
    }

    if (formulario.estoque_final_qtd && formulario.estoque_final_qtd < 0) {
      novosErros.push("Estoque final não pode ser negativo");
    }

    if (formulario.estoque_inicial_qtd && formulario.estoque_inicial_qtd < 0) {
      novosErros.push("Estoque inicial não pode ser negativo");
    }

    setErros(novosErros);
    return novosErros.length === 0;
  };

  const handleSalvar = async () => {
    if (!validarDados()) return;

    setCarregando(true);
    try {
      await onSalvar(formulario);
      toast({
        title: "Sucesso!",
        description: "Dados essenciais salvos com sucesso!",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleValorChange = (campo: 'cmv' | 'estoqueInicialValor' | 'estoqueFinalValor', valor: string) => {
    const valorFormatado = formatarMoedaInput(valor);
    setValoresFormatados(prev => ({ ...prev, [campo]: valorFormatado }));
    
    const numeroConvertido = converterMoedaParaNumero(valorFormatado);
    
    switch (campo) {
      case 'cmv':
        setFormulario(prev => ({ ...prev, cmv_valor: numeroConvertido }));
        break;
      case 'estoqueInicialValor':
        setFormulario(prev => ({ ...prev, estoque_inicial_valor: numeroConvertido }));
        break;
      case 'estoqueFinalValor':
        setFormulario(prev => ({ ...prev, estoque_final_valor: numeroConvertido }));
        break;
    }
  };

  const aplicarCMVSugerido = () => {
    if (cmvSugerido > 0) {
      const valorFormatado = formatarMoedaInput((cmvSugerido * 100).toString());
      setValoresFormatados(prev => ({ ...prev, cmv: valorFormatado }));
      setFormulario(prev => ({ ...prev, cmv_valor: cmvSugerido }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Dados Essenciais do Período</h2>
                <p className="text-sm text-gray-600">Informe CMV e estoque para DRE preciso</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Alertas de erro */}
          {erros.length > 0 && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Corrija os seguintes erros:</h4>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    {erros.map((erro, index) => (
                      <li key={index}>• {erro}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Seção Período */}
          <div className="bg-gradient-to-r from-blue-50/60 to-blue-100/40 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Período de Referência
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ano *
                </label>
                <Select 
                  value={anoSelecionado.toString()} 
                  onValueChange={(value) => setAnoSelecionado(parseInt(value))}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-12">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50">
                    {anos.map((ano) => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Mês *
                </label>
                <Select 
                  value={mesSelecionado.toString()} 
                  onValueChange={(value) => setMesSelecionado(parseInt(value))}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-12">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50">
                    {meses.map((mes) => (
                      <SelectItem key={mes.valor} value={mes.valor.toString()}>
                        {mes.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selecione o período para os dados essenciais
            </p>
          </div>

          {/* Seção CMV */}
          <div className="bg-gradient-to-r from-green-50/60 to-green-100/40 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              CMV - Custo das Mercadorias Vendidas
            </h3>
            
            {/* Sugestão de CMV */}
            {cmvSugerido > 0 && (
              <div className="bg-blue-50/60 backdrop-blur-sm border border-blue-200/50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      CMV Sugerido: R$ {cmvSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={aplicarCMVSugerido}
                    className="text-xs bg-white/60 hover:bg-white/80"
                  >
                    Aplicar
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Baseado em 45% da receita líquida do período
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Valor do CMV *
              </label>
              <input 
                type="text"
                placeholder="R$ 0,00"
                value={valoresFormatados.cmv}
                onChange={(e) => handleValorChange('cmv', e.target.value)}
                className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full px-4 py-3 transition-all duration-200 text-right"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Custo total dos produtos vendidos no período
              </p>
            </div>
          </div>

          {/* Seção Estoque */}
          <div className="bg-gradient-to-r from-purple-50/60 to-purple-100/40 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-purple-600" />
              Controle de Estoque (Opcional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estoque Inicial */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">📥 Estoque Inicial</h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Quantidade (unidades)
                  </label>
                  <input 
                    type="number"
                    placeholder="0"
                    min="0"
                    value={formulario.estoque_inicial_qtd || ''}
                    onChange={(e) => setFormulario(prev => ({ 
                      ...prev, 
                      estoque_inicial_qtd: parseInt(e.target.value) || 0 
                    }))}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Valor Total
                  </label>
                  <input 
                    type="text"
                    placeholder="R$ 0,00"
                    value={valoresFormatados.estoqueInicialValor}
                    onChange={(e) => handleValorChange('estoqueInicialValor', e.target.value)}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full px-3 py-2 text-right"
                  />
                </div>
              </div>
              
              {/* Estoque Final */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">📤 Estoque Final</h4>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Quantidade (unidades)
                  </label>
                  <input 
                    type="number"
                    placeholder="0"
                    min="0"
                    value={formulario.estoque_final_qtd || ''}
                    onChange={(e) => setFormulario(prev => ({ 
                      ...prev, 
                      estoque_final_qtd: parseInt(e.target.value) || 0 
                    }))}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Valor Total
                  </label>
                  <input 
                    type="text"
                    placeholder="R$ 0,00"
                    value={valoresFormatados.estoqueFinalValor}
                    onChange={(e) => handleValorChange('estoqueFinalValor', e.target.value)}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full px-3 py-2 text-right"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-700">
                💡 Os dados de estoque ajudam a validar o CMV e calcular métricas de giro
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={carregando}
            className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar}
            disabled={carregando}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            {carregando ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{carregando ? 'Salvando...' : 'Salvar Dados'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
