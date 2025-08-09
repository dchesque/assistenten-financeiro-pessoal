import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { ArrowLeft, Save, CreditCard, Calendar, AlertTriangle, FileText, CheckCircle, Repeat } from 'lucide-react';
import { ContaPagar } from '@/types/contaPagar';
import { Fornecedor } from '@/types/fornecedor';
import { PlanoContas } from '@/types/planoContas';
import { Banco } from '@/types/banco';
import { FormaPagamento } from '@/types/formaPagamento';
import { useBancos } from '@/hooks/useBancos';
import { useContasPagar } from '@/hooks/useContasPagarSupabase';
import { useContatos } from '@/hooks/useContatos';
import { FornecedorSelector as CredorSelector } from '@/components/contasPagar/FornecedorSelector';
import { PlanoContasSelector } from '@/components/contasPagar/PlanoContasSelector';
import { ContaPreview } from '@/components/contasPagar/ContaPreview';
import { FormaPagamentoSection } from '@/components/contasPagar/FormaPagamentoSection';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLoadingStates } from '@/hooks/useLoadingStates';
import { aplicarMascaraMoeda, aplicarMascaraPercentual, converterMoedaParaNumero, converterPercentualParaNumero, numeroParaMascaraMoeda, numeroParaMascaraPercentual, validarValorMonetario, validarPercentual, formatarMoedaExibicao } from '@/utils/masks';
import { ValidationService } from '@/services/ValidationService';
// Supabase removido - usando dados mock
import { CampoComValidacao } from '@/components/ui/CampoComValidacao';
import { validarValor, validarDescricao, validarDocumento, validarDataVencimento, validarObservacoes } from '@/utils/validacoesTempoReal';
import { toast } from '@/hooks/use-toast';
export default function NovaConta() {
  const navigate = useNavigate();
  const { criarConta, loading } = useContasPagar();
  const { bancos } = useBancos();
  const { credores } = useContatos();
  const { isSaving, setLoading } = useLoadingStates();

  // Estados do formulário
  const [conta, setConta] = useState<Partial<ContaPagar>>({
    documento_referencia: '',
    descricao: '',
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    valor_original: 0,
    percentual_juros: 0,
    valor_juros: 0,
    percentual_desconto: 0,
    valor_desconto: 0,
    valor_final: 0,
    status: 'pendente',
    dda: false,
    observacoes: ''
  });

  // Estados para controlar valores com máscara
  const [valorOriginalMask, setValorOriginalMask] = useState('');
  const [percentualJurosMask, setPercentualJurosMask] = useState('');
  const [valorJurosMask, setValorJurosMask] = useState('');
  const [percentualDescontoMask, setPercentualDescontoMask] = useState('');
  const [valorDescontoMask, setValorDescontoMask] = useState('');
  const [valorPagoMask, setValorPagoMask] = useState('');
  const [credorSelecionado, setCredorSelecionado] = useState<Fornecedor | null>(null);
  const [contaSelecionada, setContaSelecionada] = useState<PlanoContas | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>({
    tipo: 'dinheiro_pix'
  });
  
  // Estados de validação em tempo real
  const [errosValidacao, setErrosValidacao] = useState<Record<string, string>>({});
  
  // Estados do auto-save
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);
  const [temRascunho, setTemRascunho] = useState(false);
  
  // Estados para recorrência
  const [contaRecorrente, setContaRecorrente] = useState(false);
  const [periodicidade, setPeriodicidade] = useState<'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'>('mensal');
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(1);
  const [dataInicioRecorrencia, setDataInicioRecorrencia] = useState(new Date().toISOString().split('T')[0]);

  // Função de validação em tempo real
  const validarCampoTempoReal = async (campo: string, valor: any) => {
    const { ValidationService } = await import('@/services/ValidationService');
    const erro = ValidationService.validarContaPagar({ 
      [campo]: valor,
      // Passar contexto completo para validações mais precisas
      fornecedor_id: credorSelecionado?.id,
      plano_conta_id: contaSelecionada?.id,
      data_emissao: conta.data_emissao  // 🔥 CORREÇÃO: Passar data de emissão para validação correta
    });
    
    setErrosValidacao(prev => ({ 
      ...prev, 
      [campo]: erro[campo] || '' 
    }));
  };

  // Auto-save automático
  useEffect(() => {
    const timer = setTimeout(() => {
      // Só salva se há dados preenchidos
      if (conta.descricao || conta.valor_original > 0 || credorSelecionado || contaSelecionada) {
        const rascunho = {
          conta,
          credor: credorSelecionado,
          categoria: contaSelecionada,
          formaPagamento,
          timestamp: Date.now(),
          versao: '1.0'
        };
        
        localStorage.setItem('rascunho_conta_individual', JSON.stringify(rascunho));
        setRascunhoSalvo(true);
        
        // Mostrar feedback sutil
        setTimeout(() => setRascunhoSalvo(false), 2000);
      }
    }, 3000); // Salva após 3 segundos de inatividade
    
    return () => clearTimeout(timer);
  }, [conta, credorSelecionado, contaSelecionada, formaPagamento]);

  // Recuperar rascunho ao carregar página
  useEffect(() => {
    const rascunhoSalvo = localStorage.getItem('rascunho_conta_individual');
    if (rascunhoSalvo) {
      try {
        const dados = JSON.parse(rascunhoSalvo);
        
        // Verificar se não é muito antigo (24 horas)
        const agora = Date.now();
        const horasPassadas = (agora - dados.timestamp) / (1000 * 60 * 60);
        
        if (horasPassadas < 24) {
          setTemRascunho(true);
          // Não aplicar automaticamente, perguntar ao usuário
        } else {
          // Rascunho muito antigo, remover
          localStorage.removeItem('rascunho_conta_individual');
        }
      } catch (error) {
        console.error('Erro ao recuperar rascunho:', error);
        localStorage.removeItem('rascunho_conta_individual');
      }
    }
  }, []);

  // Cálculo automático do valor final
  useEffect(() => {
    const original = conta.valor_original || 0;
    const juros = conta.valor_juros || 0;
    const desconto = conta.valor_desconto || 0;
    const final = original + juros - desconto;
    setConta(prev => ({
      ...prev,
      valor_final: final
    }));
  }, [conta.valor_original, conta.valor_juros, conta.valor_desconto]);

  // Função para selecionar credor e auto-preencher categoria
  const handleCredorSelect = (credor: Fornecedor) => {
    setCredorSelecionado(credor);
    setConta(prev => ({
      ...prev,
      fornecedor_id: credor.id
    }));

    // Auto-preencher categoria padrão do credor se existir
    if (credor.categoria_padrao_id) {
      // Mock: categoria padrão
      const categoriaDefault: PlanoContas = {
        id: credor.categoria_padrao_id,
        codigo: 'CATPADRAO',
        nome: 'Categoria Padrão',
        tipo_dre: 'despesa_pessoal',
        cor: '#6B7280',
        icone: 'Package',
        nivel: 1,
        plano_pai_id: null,
        aceita_lancamento: true,
        ativo: true,
        total_contas: 0,
        valor_total: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setContaSelecionada(categoriaDefault);
      setConta(prev => ({
        ...prev,
        plano_conta_id: categoriaDefault.id
      }));
    } else {
      // Credor sem categoria padrão - não alterar seleção atual
      if (!contaSelecionada) {
        setConta(prev => ({
          ...prev,
          plano_conta_id: undefined
        }));
      }
    }
  };

  // Handlers para campos com máscara
  const handleValorOriginal = (valor: string) => {
    const mascarado = aplicarMascaraMoeda(valor);
    const numero = converterMoedaParaNumero(mascarado);
    setValorOriginalMask(mascarado);
    setConta(prev => ({
      ...prev,
      valor_original: numero
    }));
  };
  const handlePercentualJuros = (valor: string) => {
    const mascarado = aplicarMascaraPercentual(valor);
    const numero = converterPercentualParaNumero(mascarado);
    setPercentualJurosMask(mascarado);

    // Recalcular valor em reais
    const valorJuros = (conta.valor_original || 0) * (numero / 100);
    const mascaraJuros = numeroParaMascaraMoeda(valorJuros);
    setValorJurosMask(mascaraJuros);
    setConta(prev => ({
      ...prev,
      percentual_juros: numero,
      valor_juros: valorJuros
    }));
  };
  const handleValorJuros = (valor: string) => {
    const mascarado = aplicarMascaraMoeda(valor);
    const numero = converterMoedaParaNumero(mascarado);
    setValorJurosMask(mascarado);

    // Recalcular percentual
    const percentual = conta.valor_original ? numero / conta.valor_original * 100 : 0;
    const mascaraPercentual = numeroParaMascaraPercentual(percentual);
    setPercentualJurosMask(mascaraPercentual);
    setConta(prev => ({
      ...prev,
      valor_juros: numero,
      percentual_juros: percentual
    }));
  };
  const handlePercentualDesconto = (valor: string) => {
    const mascarado = aplicarMascaraPercentual(valor);
    const numero = converterPercentualParaNumero(mascarado);
    setPercentualDescontoMask(mascarado);

    // Recalcular valor em reais
    const valorDesconto = (conta.valor_original || 0) * (numero / 100);
    const mascaraDesconto = numeroParaMascaraMoeda(valorDesconto);
    setValorDescontoMask(mascaraDesconto);
    setConta(prev => ({
      ...prev,
      percentual_desconto: numero,
      valor_desconto: valorDesconto
    }));
  };
  const handleValorDesconto = (valor: string) => {
    const mascarado = aplicarMascaraMoeda(valor);
    const numero = converterMoedaParaNumero(mascarado);
    setValorDescontoMask(mascarado);

    // Recalcular percentual
    const percentual = conta.valor_original ? numero / conta.valor_original * 100 : 0;
    const mascaraPercentual = numeroParaMascaraPercentual(percentual);
    setPercentualDescontoMask(mascaraPercentual);
    setConta(prev => ({
      ...prev,
      valor_desconto: numero,
      percentual_desconto: percentual
    }));
  };
  const handleValorPago = (valor: string) => {
    const mascarado = aplicarMascaraMoeda(valor);
    const numero = converterMoedaParaNumero(mascarado);
    setValorPagoMask(mascarado);
    setConta(prev => ({
      ...prev,
      valor_pago: numero
    }));
  };
  const validarFormulario = (): boolean => {
    const errors: string[] = [];
    
    // Validações obrigatórias
    if (!credorSelecionado || !credorSelecionado.id) {
      errors.push('Selecione um credor');
    }
    
    if (!conta.descricao || conta.descricao.trim() === '') {
      errors.push('Descrição é obrigatória');
    } else if (conta.descricao.length < 3) {
      errors.push('Descrição deve ter pelo menos 3 caracteres');
    } else if (conta.descricao.length > 500) {
      errors.push('Descrição deve ter no máximo 500 caracteres');
    }
    
    if (!conta.valor_original || conta.valor_original <= 0) {
      errors.push('Valor deve ser maior que zero');
    } else if (conta.valor_original > 999999.99) {
      errors.push('Valor máximo excedido (R$ 999.999,99)');
    }
    
    if (!conta.data_emissao) {
      errors.push('Data de emissão é obrigatória');
    }
    
    if (!conta.data_vencimento) {
      errors.push('Data de vencimento é obrigatória');
    }
    
    // Validações de lógica de negócio
    if (conta.data_emissao && conta.data_vencimento) {
      const emissao = new Date(conta.data_emissao);
      const vencimento = new Date(conta.data_vencimento);
      
      if (vencimento < emissao) {
        errors.push('Data de vencimento não pode ser anterior à emissão');
      }
      
      // Validar se não é muito no futuro (ex: máximo 5 anos)
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 5);
      if (vencimento > maxFutureDate) {
        errors.push('Data de vencimento não pode ser superior a 5 anos');
      }
    }
    
    if (!contaSelecionada || !contaSelecionada.id) {
      errors.push('Selecione uma categoria');
    }
    
    // Validações específicas de status
    if (conta.status === 'pago' && !conta.banco_id) {
      errors.push('Selecione o banco para contas pagas');
    }
    
    // Mostrar erros se houver
    if (errors.length > 0) {
      errors.forEach(error => {
        toast({ title: 'Atenção', description: error });
      });
      return false;
    }
    
    return true;
  };
  // Função para aplicar rascunho
  const aplicarRascunho = () => {
    const rascunhoSalvo = localStorage.getItem('rascunho_conta_individual');
    if (rascunhoSalvo) {
      const dados = JSON.parse(rascunhoSalvo);
      setConta(dados.conta);
      setCredorSelecionado(dados.credor || dados.fornecedor); // Retrocompatibilidade
      setContaSelecionada(dados.categoria);
      setFormaPagamento(dados.formaPagamento);
      setTemRascunho(false);
      
      toast({ title: 'Sucesso', description: 'Rascunho aplicado - dados restaurados com sucesso' });
    }
  };

  // Função para descartar rascunho
  const descartarRascunho = () => {
    localStorage.removeItem('rascunho_conta_individual');
    setTemRascunho(false);
    
    toast({ title: 'Sucesso', description: 'Rascunho descartado' });
  };

  const salvarConta = async (marcarComoPago = false) => {
    if (!validarFormulario()) return;
    
    setLoading('saving', true);
    try {
      // ✅ OBRIGATÓRIO: Obter user_id
      // Mock user - Supabase removido
      const user = { id: '1' };
      if (!user) throw new Error('Usuário não autenticado');

      const contaParaSalvar = {
        fornecedor_id: credorSelecionado!.id!.toString(),
        plano_conta_id: contaSelecionada!.id!.toString(),
        banco_id: marcarComoPago && formaPagamento.banco_id ? formaPagamento.banco_id.toString() : undefined,
        documento_referencia: conta.documento_referencia,
        descricao: conta.descricao!,
        data_emissao: conta.data_emissao,
        data_vencimento: conta.data_vencimento!,
        valor_original: conta.valor_original!,
        parcela_atual: 1,
        total_parcelas: 1,
        forma_pagamento: 'dinheiro_pix',
        percentual_juros: conta.percentual_juros,
        valor_juros: conta.valor_juros || 0,
        percentual_desconto: conta.percentual_desconto,
        valor_desconto: conta.valor_desconto || 0,
        valor_final: conta.valor_final!,
        status: marcarComoPago ? 'pago' : (conta.status as 'pendente' | 'pago' | 'vencido' | 'cancelado'),
        data_pagamento: marcarComoPago ? new Date().toISOString().split('T')[0] : conta.data_pagamento,
        valor_pago: marcarComoPago ? conta.valor_final : conta.valor_pago,
        dda: conta.dda!,
        observacoes: conta.observacoes
      };

      await criarConta(contaParaSalvar);
      
      // Após salvar com sucesso, limpar rascunho
      localStorage.removeItem('rascunho_conta_individual');
      setRascunhoSalvo(false);
      
      // ✅ MELHORAR TOAST DE SUCESSO
      toast({ title: 'Sucesso', description: `Conta "${conta.descricao}" criada com sucesso!` });
      navigate('/contas-pagar');
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar conta. Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading('saving', false);
    }
  };
  return (
    <>
      <PageHeader
        breadcrumb={createBreadcrumb('/conta-individual')}
        title="Nova Conta a Pagar"
        subtitle="Lançamento individual de contas • Cadastro detalhado"
        actions={
          <Button 
            variant="outline" 
            onClick={() => navigate('/contas-pagar')}
            className="bg-white/80 hover:bg-white/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <div className="relative p-4 lg:p-8">
        {/* Banner de rascunho encontrado */}
        {temRascunho && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Rascunho encontrado</p>
                  <p className="text-xs text-blue-600">Dados salvos automaticamente foram encontrados</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={aplicarRascunho}>
                  Restaurar
                </Button>
                <Button size="sm" variant="ghost" onClick={descartarRascunho}>
                  Descartar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário principal */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-2xl">
              <div className="p-8 space-y-8">
                {/* Seção: Dados do Fornecedor */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Dados do Credor</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Credor <span className="text-red-500">*</span>
                      </Label>
                      <CredorSelector 
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
                      <PlanoContasSelector value={contaSelecionada} onSelect={setContaSelecionada} placeholder="Selecionar categoria..." className="w-full" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção: Dados da Conta */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Dados da Conta</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Documento/Referência
                      </Label>
                      <Input placeholder="NF 12345, Pedido 567, etc." value={conta.documento_referencia || ''} onChange={e => setConta(prev => ({
                      ...prev,
                      documento_referencia: e.target.value
                    }))} className="bg-white/80 backdrop-blur-sm border-gray-300/50" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Data de Emissão
                      </Label>
                      <Input 
                        type="date" 
                        value={conta.data_emissao || ''} 
                         onChange={e => {
                           setConta(prev => ({ ...prev, data_emissao: e.target.value }));
                           validarCampoTempoReal('data_emissao', e.target.value);
                         }}
                        className={`bg-white/80 backdrop-blur-sm ${
                          errosValidacao.data_emissao ? 'border-red-300' : 'border-green-300'
                        }`}
                      />
                      {errosValidacao.data_emissao && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {errosValidacao.data_emissao}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Descrição <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        placeholder="Descrição da compra ou serviço" 
                        value={conta.descricao || ''} 
                         onChange={e => {
                           setConta(prev => ({ ...prev, descricao: e.target.value }));
                           validarCampoTempoReal('descricao', e.target.value);
                         }}
                        className={`bg-white/80 backdrop-blur-sm ${
                          errosValidacao.descricao ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500'
                        }`}
                      />
                      {errosValidacao.descricao && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {errosValidacao.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção: Valores e Vencimento */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Valores e Vencimento</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Valor Original <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        type="text" 
                        placeholder="R$ 0,00" 
                        value={valorOriginalMask} 
                         onChange={e => {
                           handleValorOriginal(e.target.value);
                           validarCampoTempoReal('valor_original', converterMoedaParaNumero(e.target.value));
                         }}
                        className={`bg-white/80 backdrop-blur-sm text-right text-lg font-medium ${
                          errosValidacao.valor_original ? 'border-red-300' : 'border-green-300'
                        }`}
                      />
                      {errosValidacao.valor_original && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {errosValidacao.valor_original}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Data de Vencimento <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        type="date" 
                        value={conta.data_vencimento || ''} 
                         onChange={e => {
                           setConta(prev => ({ ...prev, data_vencimento: e.target.value }));
                           validarCampoTempoReal('data_vencimento', e.target.value);
                         }}
                        className={`bg-white/80 backdrop-blur-sm ${
                          errosValidacao.data_vencimento ? 'border-red-300' : 'border-green-300'
                        }`}
                      />
                      {errosValidacao.data_vencimento && (
                        <p className="text-red-500 text-sm mt-1 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {errosValidacao.data_vencimento}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Juros/Multa</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Percentual</Label>
                          <Input type="text" placeholder="0,00%" value={percentualJurosMask} onChange={e => handlePercentualJuros(e.target.value)} className="bg-white/80 backdrop-blur-sm border-gray-300/50 text-right" />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Valor (R$)</Label>
                          <Input type="text" placeholder="R$ 0,00" value={valorJurosMask} onChange={e => handleValorJuros(e.target.value)} className="bg-white/80 backdrop-blur-sm border-gray-300/50 text-right" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Desconto</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Percentual</Label>
                          <Input type="text" placeholder="0,00%" value={percentualDescontoMask} onChange={e => handlePercentualDesconto(e.target.value)} className="bg-white/80 backdrop-blur-sm border-gray-300/50 text-right" />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Valor (R$)</Label>
                          <Input type="text" placeholder="R$ 0,00" value={valorDescontoMask} onChange={e => handleValorDesconto(e.target.value)} className="bg-white/80 backdrop-blur-sm border-gray-300/50 text-right" />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">Valor Final:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatarMoedaExibicao(conta.valor_final || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção: Recorrência */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Recorrência</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="conta-recorrente"
                        checked={contaRecorrente}
                        onCheckedChange={(checked) => setContaRecorrente(checked as boolean)}
                      />
                      <Label htmlFor="conta-recorrente" className="text-sm font-medium text-gray-700">
                        Esta é uma conta recorrente
                      </Label>
                    </div>

                    {contaRecorrente && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Periodicidade <span className="text-red-500">*</span>
                          </Label>
                          <Select value={periodicidade} onValueChange={(value: any) => setPeriodicidade(value)}>
                            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
                              <SelectValue placeholder="Selecionar periodicidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="semanal">Semanal</SelectItem>
                              <SelectItem value="quinzenal">Quinzenal</SelectItem>
                              <SelectItem value="mensal">Mensal</SelectItem>
                              <SelectItem value="bimestral">Bimestral</SelectItem>
                              <SelectItem value="trimestral">Trimestral</SelectItem>
                              <SelectItem value="semestral">Semestral</SelectItem>
                              <SelectItem value="anual">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Quantidade de parcelas <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max="60"
                            value={quantidadeParcelas}
                            onChange={(e) => setQuantidadeParcelas(parseInt(e.target.value) || 1)}
                            className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                            placeholder="1"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Data de início <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="date"
                            value={dataInicioRecorrencia}
                            onChange={(e) => setDataInicioRecorrencia(e.target.value)}
                            className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                          />
                        </div>

                        <div className="md:col-span-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-600">
                            <strong>Resumo:</strong> Serão criadas <strong>{quantidadeParcelas} parcelas</strong> com 
                            periodicidade <strong>{periodicidade}</strong> a partir de <strong>{new Date(dataInicioRecorrencia).toLocaleDateString('pt-BR')}</strong>.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Seção: Status da Conta */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">5</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Status da Conta</h2>
                  </div>

                  <RadioGroup value={conta.status} onValueChange={value => setConta(prev => ({
                  ...prev,
                  status: value as any
                }))} className="flex space-x-8">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pendente" id="pendente" />
                      <Label htmlFor="pendente" className="text-sm font-medium text-gray-700">
                        🟡 Pendente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pago" id="pago" />
                      <Label htmlFor="pago" className="text-sm font-medium text-gray-700">
                        🟢 Pago
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Campos condicionais para pagamento */}
                  {conta.status === 'pago' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-green-50/50 rounded-lg border border-green-200/50">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Banco <span className="text-red-500">*</span>
                        </Label>
                        <Select value={conta.banco_id?.toString()} onValueChange={value => setConta(prev => ({
                      ...prev,
                      banco_id: parseInt(value)
                    }))}>
                          <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
                            <SelectValue placeholder="Selecionar banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {bancos.filter(b => !b.deleted_at).map(banco => <SelectItem key={banco.id} value={banco.id}>
                                {banco.name} - {banco.type}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Data de Pagamento
                        </Label>
                        <Input type="date" value={conta.data_pagamento || new Date().toISOString().split('T')[0]} onChange={e => setConta(prev => ({
                      ...prev,
                      data_pagamento: e.target.value
                    }))} className="bg-white/80 backdrop-blur-sm border-gray-300/50" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Valor Pago
                        </Label>
                        <Input type="text" placeholder="R$ 0,00" value={valorPagoMask || (conta.valor_final ? numeroParaMascaraMoeda(conta.valor_final) : '')} onChange={e => handleValorPago(e.target.value)} className="bg-white/80 backdrop-blur-sm border-gray-300/50 text-right" />
                      </div>
                    </div>}
                </div>

                <Separator />

                {/* Seção: Forma de Pagamento */}
                <FormaPagamentoSection 
                  value={formaPagamento}
                  onChange={setFormaPagamento}
                  numeroParcelas={1}
                  bancos={bancos as any}
                />

                <Separator />

                {/* Seção: Configurações Adicionais */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">6</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Configurações Adicionais</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="dda" checked={conta.dda} onCheckedChange={checked => setConta(prev => ({
                      ...prev,
                      dda: checked as boolean
                    }))} />
                      <Label htmlFor="dda" className="text-sm font-medium text-gray-700">
                        Esta conta é paga via DDA (Débito Direto Autorizado)
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Observações</Label>
                      <Textarea placeholder="Observações adicionais sobre esta conta..." value={conta.observacoes || ''} onChange={e => setConta(prev => ({
                      ...prev,
                      observacoes: e.target.value
                    }))} className="bg-white/80 backdrop-blur-sm border-gray-300/50 min-h-[100px]" />
                    </div>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  <Button variant="outline" onClick={() => navigate('/dashboard')} className="bg-white/80 backdrop-blur-sm border-white/20">
                    Cancelar
                  </Button>
                  
                  <LoadingButton 
                    onClick={() => salvarConta(false)} 
                    loading={isSaving} 
                    loadingText="Salvando..."
                    icon={<Save className="h-4 w-4" />}
                    className="btn-primary flex-1"
                  >
                    Salvar
                  </LoadingButton>
                  
                  <LoadingButton 
                    onClick={() => salvarConta(true)} 
                    loading={isSaving}
                    loadingText="Salvando..."
                    icon={<CreditCard className="h-4 w-4" />}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
                  >
                    Salvar e Pagar
                  </LoadingButton>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar de Preview */}
          <div className="lg:col-span-1">
            <ContaPreview conta={conta} formaPagamento={formaPagamento} />
          </div>
        </div>
      </div>
      
      {/* Indicador sutil de auto-save */}
      {rascunhoSalvo && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 rounded-lg px-3 py-2 flex items-center space-x-2 animate-fade-in-out z-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">Rascunho salvo</span>
        </div>
      )}
    </>
  );
}