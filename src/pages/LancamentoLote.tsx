import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { ArrowLeft, User, FileText, Settings, Eye, Plus, RotateCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FornecedorSelector } from '@/components/contasPagar/FornecedorSelector';
import { PlanoContasSelector } from '@/components/contasPagar/PlanoContasSelector';
import { FormaPagamentoSection } from '@/components/contasPagar/FormaPagamentoSection';
import { LotePreview } from '@/components/lancamentoLote/LotePreview';
import { PreviewParcelasSimplificado } from '@/components/lancamentoLote/PreviewParcelasSimplificado';
import { LancamentoLoteFormData, ParcelaPreview, INTERVALOS_PARCELA, INTERVALOS_OPCOES } from '@/types/lancamentoLote';
import { SucessoLoteModal } from '@/components/lancamentoLote/SucessoLoteModal';
import { ModalConfirmacaoCheques } from '@/components/lancamentoLote/ModalConfirmacaoCheques';
import { ConfirmacaoLoteModal } from '@/components/lancamentoLote/ConfirmacaoLoteModal';
import { ProgressoLancamento } from '@/components/lancamentoLote/ProgressoLancamento';
import { ProgressoLoteAprimorado } from '@/components/lancamentoLote/ProgressoLoteAprimorado';
import { useValidacoesCheques } from '@/hooks/useValidacoesCheques';
import { useLancamentoLoteSimplificado, ResultadoLancamento } from '@/hooks/useLancamentoLoteSimplificado';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { useCredores } from '@/hooks/useCredores';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useCheques } from '@/hooks/useCheques';
import { FormaPagamento } from '@/types/formaPagamento';
import { Fornecedor } from '@/types/fornecedor';
import { PlanoContas } from '@/types/planoContas';
import { Banco } from '@/types/banco';
import { aplicarMascaraMoeda, converterMoedaParaNumero } from '@/utils/masks';
import { formatarData } from '@/utils/formatters';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function LancamentoLote() {
  const navigate = useNavigate();
  
  // 🔐 TODOS OS HOOKS DEVEM SER CHAMADOS PRIMEIRO - ORDEM FIXA
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { validarSequenciaCheques } = useValidacoesCheques();
  const { validarLancamento, executarLancamento, loading: loadingLancamento, progresso } = useLancamentoLoteSimplificado();
  const { credores } = useCredores();
  const { planoContas } = usePlanoContas();
  const { bancos } = useBancosSupabase();
  const { cheques } = useCheques();

  // Estados do formulário - SEMPRE na mesma ordem
  const [formData, setFormData] = useState<LancamentoLoteFormData>(() => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 30);
    
    return {
      fornecedor_id: null,
      plano_conta_id: null,
      descricao: '',
      documento_referencia: '',
      valor_parcela: 0,
      primeira_data_vencimento: hoje.toISOString().split('T')[0],
      quantidade_parcelas: 12,
      intervalo_parcelas: 'mensal',
      data_emissao: new Date().toISOString().split('T')[0],
      dda: false
    };
  });

  const [credorSelecionado, setCredorSelecionado] = useState<Fornecedor | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<PlanoContas | null>(null);
  const [categoriaAutoPreenchida, setCategoriaAutoPreenchida] = useState(false);
  const [valorParcelaFormatado, setValorParcelaFormatado] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>({
    tipo: 'dinheiro_pix'
  });
  const [parcelas, setParcelas] = useState<ParcelaPreview[]>([]);
  const [modalSucessoAberto, setModalSucessoAberto] = useState(false);
  const [modalConfirmacaoChequesAberto, setModalConfirmacaoChequesAberto] = useState(false);
  const [modalConfirmacaoLoteAberto, setModalConfirmacaoLoteAberto] = useState(false);
  const [loteId, setLoteId] = useState<string | null>(null);
  const [chequesProblematicos, setChequesProblematicos] = useState<Array<{
    numero: string;
    motivo: string;
  }>>([]);

  // useEffect para proteção da rota - SEMPRE chamado na mesma ordem
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Acesso restrito",
        description: "Faça login para acessar esta página",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Função para gerar parcelas - DEFINIDA ANTES DOS useEffect
  const gerarParcelas = useCallback(() => {
    const novasParcelas: ParcelaPreview[] = [];
    const primeiraData = new Date(formData.primeira_data_vencimento);
    const diasIntervalo = INTERVALOS_PARCELA[formData.intervalo_parcelas].dias;
    
    for (let i = 0; i < formData.quantidade_parcelas; i++) {
      const dataVencimento = new Date(primeiraData);
      dataVencimento.setDate(primeiraData.getDate() + i * diasIntervalo);
      
      novasParcelas.push({
        numero: i + 1,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        valor: formData.valor_parcela,
        status: 'calculada'
      });
    }
    setParcelas(novasParcelas);
  }, [formData.primeira_data_vencimento, formData.intervalo_parcelas, formData.quantidade_parcelas, formData.valor_parcela]);

  // useEffect para gerar parcelas - SEMPRE chamado na mesma ordem
  useEffect(() => {
    if (formData.valor_parcela > 0 && formData.primeira_data_vencimento && formData.quantidade_parcelas > 0) {
      gerarParcelas();
    } else {
      setParcelas([]);
    }
  }, [gerarParcelas, formData.valor_parcela, formData.primeira_data_vencimento, formData.quantidade_parcelas]);

  // ✅ RETURNS CONDICIONAIS SÓ APÓS TODOS OS HOOKS
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleCredorSelect = async (credor: Fornecedor) => {
    setCredorSelecionado(credor);
    setFormData(prev => ({
      ...prev,
      fornecedor_id: credor.id
    }));

    // Auto-preencher categoria padrão do credor se existir
    if (credor.categoria_padrao_id) {
      try {
        const { data, error } = await supabase
          .from('plano_contas')
          .select('*')
          .eq('id', credor.categoria_padrao_id)
          .eq('aceita_lancamento', true)
          .single();

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
          
          setCategoriaSelecionada(categoriaDefault);
          setCategoriaAutoPreenchida(true);
          setFormData(prev => ({
            ...prev,
            plano_conta_id: categoriaDefault.id
          }));

          // Feedback ao usuário
          toast({
            title: "Categoria preenchida automaticamente",
            description: `${categoriaDefault.codigo} - ${categoriaDefault.nome}`
          });
        }
      } catch (error) {
        console.error('Erro ao buscar categoria padrão:', error);
      }
    } else {
      // Credor sem categoria padrão
      setCategoriaSelecionada(null);
      setCategoriaAutoPreenchida(false);
      setFormData(prev => ({
        ...prev,
        plano_conta_id: null
      }));
    }
  };

  const handleCategoriaSelect = (categoria: PlanoContas) => {
    setCategoriaSelecionada(categoria);
    setCategoriaAutoPreenchida(false); // Remove indicador quando seleção manual
    setFormData(prev => ({
      ...prev,
      plano_conta_id: categoria.id
    }));
  };

  const handleValorParcelaChange = (valor: string) => {
    const valorMascarado = aplicarMascaraMoeda(valor);
    setValorParcelaFormatado(valorMascarado);
    const valorNumerico = converterMoedaParaNumero(valorMascarado);
    setFormData(prev => ({
      ...prev,
      valor_parcela: valorNumerico
    }));
  };

  const handleEditarParcela = (numero: number, novoValor: number) => {
    setParcelas(prev => prev.map(parcela => parcela.numero === numero ? {
      ...parcela,
      valor: novoValor,
      status: 'editada',
      editada: true
    } : parcela));
    
    toast({
      title: "Parcela editada",
      description: `Parcela ${numero} foi alterada para R$ ${novoValor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2
      })}`
    });
  };

  const handleEditarData = (numero: number, novaData: string) => {
    setParcelas(prev => prev.map(parcela => parcela.numero === numero ? {
      ...parcela,
      data_vencimento: novaData,
      status: 'editada',
      editada: true
    } : parcela));
    
    toast({
      title: "Data editada",
      description: `Data da parcela ${numero} foi alterada para ${formatarData(novaData)}`
    });
  };

  const handleChequeChange = (numeroParcela: number, numeroCheque: string) => {
    setParcelas(prev => prev.map(parcela => parcela.numero === numeroParcela ? {
      ...parcela,
      numero_cheque: numeroCheque
    } : parcela));
  };

  const validarFormulario = () => {
    // 🔐 Verificar autenticação ANTES de qualquer coisa
    if (!isAuthenticated || !user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive"
      });
      return false;
    }

    if (!credorSelecionado) {
      toast({
        title: "Erro de validação",
        description: "Selecione um credor",
        variant: "destructive"
      });
      return false;
    }

    if (!categoriaSelecionada) {
      toast({
        title: "Erro de validação",
        description: "Selecione uma categoria",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.descricao.trim()) {
      toast({
        title: "Erro de validação",
        description: "Preencha a descrição",
        variant: "destructive"
      });
      return false;
    }

    if (formData.valor_parcela <= 0) {
      toast({
        title: "Erro de validação",
        description: "Valor da parcela deve ser maior que zero",
        variant: "destructive"
      });
      return false;
    }

    if (formData.quantidade_parcelas < 2 || formData.quantidade_parcelas > 100) {
      toast({
        title: "Erro de validação",
        description: "Quantidade de parcelas deve estar entre 2 e 100",
        variant: "destructive"
      });
      return false;
    }

    if (parcelas.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Nenhuma parcela foi gerada",
        variant: "destructive"
      });
      return false;
    }

    // Validações específicas para cheque
    if (formaPagamento.tipo === 'cheque') {
      if (!formaPagamento.banco_id) {
        toast({
          title: "Erro de validação",
          description: "Selecione o banco para emissão dos cheques",
          variant: "destructive"
        });
        return false;
      }

      // Verificar se todas as parcelas têm números de cheque
      const parcelasSemCheque = parcelas.filter(p => !p.numero_cheque || !p.numero_cheque.trim());
      if (parcelasSemCheque.length > 0) {
        toast({
          title: "Erro de validação",
          description: `Preencha o número do cheque para ${parcelasSemCheque.length === 1 ? 'a parcela' : 'as parcelas'} ${parcelasSemCheque.map(p => p.numero).join(', ')}`,
          variant: "destructive"
        });
        return false;
      }

      // Verificar duplicatas de cheques
      const numerosCheques = parcelas.map(p => p.numero_cheque).filter(n => n);
      const duplicatas = numerosCheques.filter((num, index) => numerosCheques.indexOf(num) !== index);
      if (duplicatas.length > 0) {
        toast({
          title: "Erro de validação",
          description: "Números de cheque não podem ser duplicados",
          variant: "destructive"
        });
        return false;
      }

      // Verificar se cheques já existem no sistema
      const chequesExistentes = parcelas.filter(p => p.numero_cheque && cheques.some(c => c.banco_id === formaPagamento.banco_id && c.numero_cheque === p.numero_cheque.padStart(6, '0')));
      if (chequesExistentes.length > 0) {
        toast({
          title: "Erro de validação",
          description: `Cheque(s) ${chequesExistentes.map(p => p.numero_cheque).join(', ')} já existe(m) para este banco`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleGerarParcelas = () => {
    if (!validarFormulario()) return;
    setModalConfirmacaoLoteAberto(true);
  };

  const handleConfirmarLancamento = async () => {
    setModalConfirmacaoLoteAberto(false);
    const resultado = await executarLancamento(formData, parcelas, formaPagamento);
    
    if (resultado.sucesso) {
      setLoteId(resultado.loteId!);
      setModalSucessoAberto(true);

      // Toast com link direto
      toast({
        title: "✅ Lote criado com sucesso!",
        description: <div className="space-y-2">
          <p>{resultado.totalParcelas} parcelas foram criadas</p>
          <button 
            onClick={() => navigate(`/contas-pagar?lote=${resultado.loteId}&highlight=true`)} 
            className="text-blue-600 hover:text-blue-700 underline text-sm font-medium"
          >
            Ver parcelas criadas →
          </button>
        </div>,
        duration: 8000
      });
    } else {
      toast({
        title: "❌ Erro ao criar lote",
        description: resultado.erros?.join(', ') || "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const limparFormulario = () => {
    setFormData({
      fornecedor_id: null,
      plano_conta_id: null,
      descricao: '',
      documento_referencia: '',
      valor_parcela: 0,
      primeira_data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      quantidade_parcelas: 12,
      intervalo_parcelas: 'mensal',
      data_emissao: new Date().toISOString().split('T')[0],
      dda: false
    });
    setCredorSelecionado(null);
    setCategoriaSelecionada(null);
    setCategoriaAutoPreenchida(false);
    setValorParcelaFormatado('');
    setFormaPagamento({
      tipo: 'dinheiro_pix'
    });
    setParcelas([]);
    setModalSucessoAberto(false);
    setLoteId(null);
  };

  // Validar quantidade de parcelas em tempo real
  const handleQuantidadeParcelasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value);
    if (valor > 100) {
      toast({
        title: "Máximo 100 parcelas permitidas",
        description: "O valor foi ajustado para 100 parcelas",
        variant: "destructive"
      });
      setFormData(prev => ({
        ...prev,
        quantidade_parcelas: 100
      }));
      return;
    }
    if (valor < 2 && valor !== 0) {
      toast({
        title: "Mínimo 2 parcelas necessárias",
        description: "O valor foi ajustado para 2 parcelas"
      });
      setFormData(prev => ({
        ...prev,
        quantidade_parcelas: 2
      }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      quantidade_parcelas: valor || 0
    }));
  };

  const handleVisualizarPreview = () => {
    if (formData.valor_parcela > 0 && formData.primeira_data_vencimento && formData.quantidade_parcelas > 0) {
      gerarParcelas();
      toast({
        title: "Preview atualizado",
        description: `${formData.quantidade_parcelas} parcelas foram geradas para visualização`
      });
    } else {
      toast({
        title: "Dados incompletos",
        description: "Preencha valor, data e quantidade para gerar o preview",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background blur abstratos */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl" />
      </div>

      <PageHeader 
        breadcrumb={createBreadcrumb('/lancamento-lote')} 
        title="Lançamento em Lote" 
        subtitle="Cadastre múltiplas contas a pagar de uma vez • Parcelamento automático" 
      />

      <div className="relative p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário principal */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-2xl">
              <div className="p-8 space-y-8">
                
                {/* Seção 1: Dados do Fornecedor */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <User className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Dados do Fornecedor</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Fornecedor <span className="text-red-500">*</span>
                      </Label>
                      <FornecedorSelector 
                        value={credorSelecionado} 
                        onSelect={handleCredorSelect} 
                        placeholder="Selecionar credor..." 
                        className="w-full" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Categoria/Plano de Contas <span className="text-red-500">*</span>
                      </Label>
                      <div className="space-y-1">
                        <PlanoContasSelector 
                          value={categoriaSelecionada} 
                          onSelect={handleCategoriaSelect} 
                          placeholder="Selecionar categoria..." 
                          className="w-full" 
                        />
                        {categoriaAutoPreenchida && categoriaSelecionada && (
                          <div className="flex items-center space-x-1 animate-fade-in">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-blue-600 italic">
                              Categoria padrão do fornecedor
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Documento/Referência
                      </Label>
                      <Input 
                        placeholder="NF 12345, Contrato 567, Pedido 890" 
                        value={formData.documento_referencia} 
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          documento_referencia: e.target.value
                        }))} 
                        className="bg-white/80 backdrop-blur-sm border-gray-300/50" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Data de Emissão
                      </Label>
                      <Input 
                        type="date" 
                        value={formData.data_emissao} 
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          data_emissao: e.target.value
                        }))} 
                        className="bg-white/80 backdrop-blur-sm border-gray-300/50" 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção 2: Dados da Conta */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <FileText className="h-5 w-5 text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Dados da Conta</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Descrição <span className="text-red-500">*</span>
                      </Label>
                      <Textarea 
                        placeholder="Ex: Financiamento equipamento, Compra parcelada fornecedor X, etc." 
                        value={formData.descricao} 
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          descricao: e.target.value
                        }))} 
                        className="bg-white/80 backdrop-blur-sm border-gray-300/50 min-h-[80px]" 
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="dda" 
                        checked={formData.dda} 
                        onCheckedChange={checked => setFormData(prev => ({
                          ...prev,
                          dda: !!checked
                        }))} 
                      />
                      <Label htmlFor="dda" className="text-sm text-gray-700">
                        Aplicar DDA para todas as parcelas
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção 3: Configuração das Parcelas */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <Settings className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Configuração das Parcelas</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Valor da Parcela <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        placeholder="R$ 0,00" 
                        value={valorParcelaFormatado} 
                        onChange={e => handleValorParcelaChange(e.target.value)} 
                        className="bg-white/80 backdrop-blur-sm border-gray-300/50 text-right text-lg font-medium" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Primeira Data de Vencimento <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        type="date" 
                        value={formData.primeira_data_vencimento} 
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          primeira_data_vencimento: e.target.value
                        }))} 
                        className="bg-white/80 backdrop-blur-sm border-gray-300/50" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Quantidade de Parcelas <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        type="number" 
                        min={2} 
                        max={100} 
                        value={formData.quantidade_parcelas} 
                        onChange={handleQuantidadeParcelasChange} 
                        className={`bg-white/80 backdrop-blur-sm border-gray-300/50 ${formData.quantidade_parcelas < 2 || formData.quantidade_parcelas > 100 ? 'border-red-500 focus:border-red-500' : ''}`} 
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                      <Label className="text-sm font-medium text-gray-700">
                        Intervalo entre Parcelas
                      </Label>
                      <Select 
                        value={formData.intervalo_parcelas} 
                        onValueChange={(value: 'mensal' | 'quinzenal' | 'semanal') => setFormData(prev => ({
                          ...prev,
                          intervalo_parcelas: value
                        }))}
                      >
                        <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INTERVALOS_OPCOES.map(opcao => (
                            <SelectItem key={opcao.value} value={opcao.value}>
                              {opcao.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção 4: Forma de Pagamento */}
                <FormaPagamentoSection 
                  value={formaPagamento} 
                  onChange={setFormaPagamento} 
                  numeroParcelas={formData.quantidade_parcelas} 
                  bancos={bancos} 
                  cheques={cheques} 
                />

                <Separator />

                {/* Seção 5: Preview das Parcelas */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">5</span>
                    </div>
                    <Eye className="h-5 w-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Preview das Parcelas</h2>
                  </div>

                  <PreviewParcelasSimplificado 
                    parcelas={parcelas} 
                    onEditarParcela={handleEditarParcela} 
                    onEditarData={handleEditarData} 
                    formaPagamento={formaPagamento} 
                    onChequeChange={handleChequeChange} 
                    className="border-0 bg-transparent shadow-none p-0" 
                  />
                </div>
              </div>
            </Card>

            {/* Footer com ações */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                
                {/* Informações do resumo */}
                <div className="text-sm text-gray-600">
                  {parcelas.length > 0 && (
                    <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                      <span className="font-medium">
                        {parcelas.length} parcelas geradas
                      </span>
                      <span className="hidden lg:block">•</span>
                      <span>
                        Valor total: R$ {parcelas.reduce((acc, p) => acc + p.valor, 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    onClick={limparFormulario} 
                    className="bg-white/80 backdrop-blur-sm border-gray-300/50 text-gray-700 hover:bg-white hover:border-gray-400" 
                    disabled={loadingLancamento}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleVisualizarPreview} 
                    className="bg-white/80 backdrop-blur-sm border-blue-500/50 text-blue-600 hover:bg-blue-50 hover:border-blue-500" 
                    disabled={loadingLancamento}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar Preview
                  </Button>
                  
                  <Button 
                    onClick={handleGerarParcelas} 
                    disabled={loadingLancamento || parcelas.length === 0 || formData.quantidade_parcelas < 2 || formData.quantidade_parcelas > 100} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingLancamento ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Gerando Parcelas...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Gerar Parcelas</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview lateral */}
          <LotePreview 
            formData={formData} 
            fornecedor={credorSelecionado} 
            categoria={categoriaSelecionada} 
            parcelas={parcelas} 
          />
        </div>

        {/* Modais */}
        {loteId && (
          <SucessoLoteModal 
            isOpen={modalSucessoAberto} 
            onClose={() => setModalSucessoAberto(false)} 
            onCriarNovoLote={limparFormulario} 
            onVisualizarParcelas={() => navigate(`/contas-pagar?lote=${loteId}&highlight=true`)} 
            loteId={loteId} 
            totalParcelas={parcelas.length} 
            valorTotal={parcelas.reduce((acc, p) => acc + p.valor, 0)} 
            primeiraData={parcelas[0]?.data_vencimento || ''} 
            ultimaData={parcelas[parcelas.length - 1]?.data_vencimento || ''} 
          />
        )}

        <ModalConfirmacaoCheques 
          isOpen={modalConfirmacaoChequesAberto} 
          onClose={() => setModalConfirmacaoChequesAberto(false)} 
          onConfirm={() => {
            setModalConfirmacaoChequesAberto(false);
            // Continuar com o preenchimento da sequência mesmo com duplicatas
          }} 
          chequesProblematicos={chequesProblematicos} 
          banco_nome={bancos.find(b => b.id === formaPagamento.banco_id)?.nome || 'Banco selecionado'} 
        />

        <ConfirmacaoLoteModal 
          isOpen={modalConfirmacaoLoteAberto} 
          onClose={() => setModalConfirmacaoLoteAberto(false)} 
          onConfirm={handleConfirmarLancamento} 
          loading={loadingLancamento} 
          formData={formData} 
          parcelas={parcelas} 
          formaPagamento={formaPagamento} 
          fornecedor={credorSelecionado} 
          categoria={categoriaSelecionada}
          banco={bancos.find(b => b.id === formaPagamento.banco_id) || null} 
        />

        {/* Progresso do lançamento */}
        {loadingLancamento && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <ProgressoLancamento 
              progresso={progresso} 
              loading={loadingLancamento} 
              className="w-full max-w-lg" 
            />
          </div>
        )}
      </div>
    </div>
  );
}