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
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { useContasPagar } from '@/hooks/useContasPagar';
import { useCredores } from '@/hooks/useCredores';
import { FornecedorSelector as CredorSelector } from '@/components/contasPagar/FornecedorSelector';
import { PlanoContasSelector } from '@/components/contasPagar/PlanoContasSelector';
import { ContaPreview } from '@/components/contasPagar/ContaPreview';
import { FormaPagamentoSection } from '@/components/contasPagar/FormaPagamentoSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { aplicarMascaraMoeda, aplicarMascaraPercentual, converterMoedaParaNumero, converterPercentualParaNumero, numeroParaMascaraMoeda, numeroParaMascaraPercentual, validarValorMonetario, validarPercentual, formatarMoedaExibicao } from '@/utils/masks';
import { ValidationService } from '@/services/ValidationService';
import { supabase } from '@/integrations/supabase/client';
import { CampoComValidacao } from '@/components/ui/CampoComValidacao';
import { validarValor, validarDescricao, validarDocumento, validarDataVencimento, validarObservacoes } from '@/utils/validacoesTempoReal';
export default function NovoRecebimento() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { criarConta, estados } = useContasPagar();
  const { bancos } = useBancosSupabase();
  const { credores } = useCredores();

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
    status: 'pendente' as 'pendente' | 'pago' | 'vencido' | 'cancelado',
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
  
  // Usar loading do hook
  const loading = estados.salvandoEdicao;

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
        
        localStorage.setItem('rascunho_recebimento', JSON.stringify(rascunho));
        setRascunhoSalvo(true);
        
        // Mostrar feedback sutil
        setTimeout(() => setRascunhoSalvo(false), 2000);
      }
    }, 3000); // Salva após 3 segundos de inatividade
    
    return () => clearTimeout(timer);
  }, [conta, credorSelecionado, contaSelecionada, formaPagamento]);

  // Recuperar rascunho ao carregar página
  useEffect(() => {
    const rascunhoSalvo = localStorage.getItem('rascunho_recebimento');
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
          localStorage.removeItem('rascunho_recebimento');
        }
      } catch (error) {
        console.error('Erro ao recuperar rascunho:', error);
        localStorage.removeItem('rascunho_recebimento');
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
      // Buscar a categoria padrão do Supabase
      import('@/integrations/supabase/client').then(({ supabase }) => {
        supabase
          .from('plano_contas')
          .select('*')
          .eq('id', credor.categoria_padrao_id)
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
              
              setContaSelecionada(categoriaDefault);
              setConta(prev => ({
                ...prev,
                plano_conta_id: categoriaDefault.id
              }));

              // Feedback ao usuário
              toast({
                title: "Categoria preenchida automaticamente",
                description: `${categoriaDefault.codigo} - ${categoriaDefault.nome}`
              });
            }
          });
      });
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
  const validarFormulario = async () => {
    const { ValidationService } = await import('@/services/ValidationService');
    
    // Usar validação robusta do serviço
    const erros = ValidationService.validarContaPagar({
      fornecedor_id: credorSelecionado?.id,
      plano_conta_id: contaSelecionada?.id,
      descricao: conta.descricao,
      data_vencimento: conta.data_vencimento,
      valor_original: conta.valor_original,
      data_emissao: conta.data_emissao
    });
    
    // Mostrar primeiro erro encontrado
    const primeiroErro = Object.values(erros)[0] as string;
    if (primeiroErro) {
      toast({
        title: "Erro de validação",
        description: primeiroErro,
        variant: "destructive"
      });
      return false;
    }
    
    // Validações específicas de status
    if (conta.status === 'pago' && !conta.banco_id) {
      toast({
        title: "Erro",
        description: "Selecione o banco para contas pagas",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  // Função para aplicar rascunho
  const aplicarRascunho = () => {
    const rascunhoSalvo = localStorage.getItem('rascunho_recebimento');
    if (rascunhoSalvo) {
      const dados = JSON.parse(rascunhoSalvo);
      setConta(dados.conta);
      setCredorSelecionado(dados.credor || dados.fornecedor); // Retrocompatibilidade
      setContaSelecionada(dados.categoria);
      setFormaPagamento(dados.formaPagamento);
      setTemRascunho(false);
      
      toast({
        title: "Rascunho aplicado",
        description: "Dados anteriores foram restaurados com sucesso",
      });
    }
  };

  // Função para descartar rascunho
  const descartarRascunho = () => {
    localStorage.removeItem('rascunho_recebimento');
    setTemRascunho(false);
    
    toast({
      title: "Rascunho descartado",
      description: "Dados anteriores foram removidos",
    });
  };

  const salvarConta = async (marcarComoPago = false) => {
    if (!(await validarFormulario())) return;
    
    try {
      // ✅ OBRIGATÓRIO: Obter user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const contaParaSalvar: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'> = {
        fornecedor_id: credorSelecionado!.id!,
        plano_conta_id: contaSelecionada!.id!,
        banco_id: marcarComoPago && formaPagamento.banco_id ? formaPagamento.banco_id : conta.banco_id,
        documento_referencia: conta.documento_referencia,
        descricao: conta.descricao!,
        data_emissao: conta.data_emissao,
        data_vencimento: conta.data_vencimento!,
        valor_original: conta.valor_original!,
        // Novos campos obrigatórios
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
        observacoes: conta.observacoes,
        user_id: user.id  // 🔥 ADICIONAR USER_ID
      };

      await criarConta(contaParaSalvar);
      
      // Após salvar com sucesso, limpar rascunho
      localStorage.removeItem('rascunho_recebimento');
      setRascunhoSalvo(false);
      
      // ✅ MELHORAR TOAST DE SUCESSO
      toast({
        title: "✅ Recebimento criado com sucesso",
        description: `"${conta.descricao}" foi cadastrado`,
        action: (
          <div className="space-x-2">
            <Button size="sm" onClick={() => navigate('/contas-receber')}>
              Ver todas
            </Button>
          </div>
        )
      });

      navigate('/contas-receber');
    } catch (error: any) {
      toast({
        title: "❌ Erro ao salvar recebimento", 
        description: error.message || "Erro interno do servidor. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  return (
    <>
      <PageHeader
        breadcrumb={createBreadcrumb('/novo-recebimento')}
        title="Novo Recebimento"
        subtitle="Lançamento individual de recebimentos • Cadastro detalhado"
        actions={
          <Button 
            variant="outline" 
            onClick={() => navigate('/contas-receber')}
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
                <Button size="sm" variant="destructive" onClick={descartarRascunho}>
                  Descartar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {/* Seção 1: Dados do Credor */}
            <Card className="card-base">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Dados do Credor</h3>
                    <p className="text-sm text-gray-600">Selecione quem pagará esta conta</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <CredorSelector
                    value={credorSelecionado}
                    onSelect={handleCredorSelect}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Seção 2: Dados da Conta */}
            <Card className="card-base">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Dados do Recebimento</h3>
                    <p className="text-sm text-gray-600">Informações básicas e categoria</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documento_referencia">Documento / Referência</Label>
                      <Input
                        id="documento_referencia"
                        value={conta.documento_referencia}
                        onChange={(e) => {
                          setConta(prev => ({ ...prev, documento_referencia: e.target.value }));
                          validarCampoTempoReal('documento_referencia', e.target.value);
                        }}
                        placeholder="Ex: NF 001234, Fatura #567"
                        className="input-base"
                        maxLength={50}
                      />
                      {errosValidacao.documento_referencia && (
                        <p className="text-sm text-red-600">{errosValidacao.documento_referencia}</p>
                      )}
                    </div>

                    <PlanoContasSelector
                      value={contaSelecionada}
                      onSelect={(conta) => {
                        setContaSelecionada(conta);
                        setConta(prev => ({
                          ...prev,
                          plano_conta_id: conta?.id
                        }));
                      }}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição do Recebimento *</Label>
                    <Input
                      id="descricao"
                      value={conta.descricao}
                      onChange={(e) => {
                        setConta(prev => ({ ...prev, descricao: e.target.value }));
                        validarCampoTempoReal('descricao', e.target.value);
                      }}
                      placeholder="Descreva o recebimento..."
                      className="input-base"
                      maxLength={255}
                      required
                    />
                    {errosValidacao.descricao && (
                      <p className="text-sm text-red-600">{errosValidacao.descricao}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_emissao">Data de Emissão</Label>
                      <Input
                        id="data_emissao"
                        type="date"
                        value={conta.data_emissao}
                        onChange={(e) => setConta(prev => ({ ...prev, data_emissao: e.target.value }))}
                        className="input-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                      <Input
                        id="data_vencimento"
                        type="date"
                        value={conta.data_vencimento}
                        onChange={(e) => {
                          setConta(prev => ({ ...prev, data_vencimento: e.target.value }));
                          validarCampoTempoReal('data_vencimento', e.target.value);
                        }}
                        className="input-base"
                        required
                      />
                      {errosValidacao.data_vencimento && (
                        <p className="text-sm text-red-600">{errosValidacao.data_vencimento}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Seção 3: Valores e Vencimento */}
            <Card className="card-base">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Valores e Cálculos</h3>
                    <p className="text-sm text-gray-600">Configure valores, juros e descontos</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="valor_original">Valor Original *</Label>
                    <Input
                      id="valor_original"
                      value={valorOriginalMask}
                      onChange={(e) => handleValorOriginal(e.target.value)}
                      placeholder="R$ 0,00"
                      className="input-base"
                      maxLength={15}
                      required
                    />
                    {errosValidacao.valor_original && (
                      <p className="text-sm text-red-600">{errosValidacao.valor_original}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">Juros</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Percentual</Label>
                          <Input
                            value={percentualJurosMask}
                            onChange={(e) => handlePercentualJuros(e.target.value)}
                            placeholder="0,00%"
                            className="input-base text-sm"
                            maxLength={8}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Valor em R$</Label>
                          <Input
                            value={valorJurosMask}
                            onChange={(e) => handleValorJuros(e.target.value)}
                            placeholder="R$ 0,00"
                            className="input-base text-sm"
                            maxLength={15}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">Desconto</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Percentual</Label>
                          <Input
                            value={percentualDescontoMask}
                            onChange={(e) => handlePercentualDesconto(e.target.value)}
                            placeholder="0,00%"
                            className="input-base text-sm"
                            maxLength={8}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-500">Valor em R$</Label>
                          <Input
                            value={valorDescontoMask}
                            onChange={(e) => handleValorDesconto(e.target.value)}
                            placeholder="R$ 0,00"
                            className="input-base text-sm"
                            maxLength={15}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Valor Final:</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatarMoedaExibicao(conta.valor_final || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Seção 4: Recorrência (Opcional) */}
            <Card className="card-base">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <Repeat className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recorrência</h3>
                    <p className="text-sm text-gray-600">Configure repetições automáticas</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="conta_recorrente"
                      checked={contaRecorrente}
                      onCheckedChange={(checked) => setContaRecorrente(checked as boolean)}
                    />
                    <Label htmlFor="conta_recorrente" className="text-sm">
                      Este é um recebimento recorrente
                    </Label>
                  </div>

                  {contaRecorrente && (
                    <div className="grid gap-4 p-4 bg-purple-50/50 border border-purple-200/50 rounded-xl">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="periodicidade">Periodicidade</Label>
                          <Select value={periodicidade} onValueChange={(value: any) => setPeriodicidade(value)}>
                            <SelectTrigger className="input-base">
                              <SelectValue placeholder="Selecione" />
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
                          <Label htmlFor="quantidade_parcelas">Qtd. Parcelas</Label>
                          <Input
                            id="quantidade_parcelas"
                            type="number"
                            min="1"
                            max="360"
                            value={quantidadeParcelas}
                            onChange={(e) => setQuantidadeParcelas(Number(e.target.value))}
                            className="input-base"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="data_inicio">Data de Início</Label>
                          <Input
                            id="data_inicio"
                            type="date"
                            value={dataInicioRecorrencia}
                            onChange={(e) => setDataInicioRecorrencia(e.target.value)}
                            className="input-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Seção 5: Status da Conta */}
            <Card className="card-base">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Status do Recebimento</h3>
                    <p className="text-sm text-gray-600">Defina o status atual</p>
                  </div>
                </div>

                <RadioGroup
                  value={conta.status}
                  onValueChange={(value) => setConta(prev => ({ ...prev, status: value as 'pendente' | 'pago' | 'vencido' | 'cancelado' }))}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="pendente" id="pendente" />
                    <Label htmlFor="pendente" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>Pendente</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Aguardando recebimento</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="pago" id="pago" />
                    <Label htmlFor="pago" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Pago</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Já foi pago</p>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Campo de valor pago quando status é "pago" */}
                {conta.status === 'pago' && (
                  <div className="space-y-4 p-4 bg-green-50/50 border border-green-200/50 rounded-xl">
                    <div className="space-y-2">
                      <Label htmlFor="valor_pago">Valor Pago</Label>
                      <Input
                        id="valor_pago"
                        value={valorPagoMask}
                        onChange={(e) => handleValorPago(e.target.value)}
                        placeholder="R$ 0,00"
                        className="input-base"
                        maxLength={15}
                      />
                      <p className="text-xs text-gray-500">
                        Valor final: {formatarMoedaExibicao(conta.valor_final || 0)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data_pagamento">Data do Pagamento</Label>
                      <Input
                        id="data_pagamento"
                        type="date"
                        value={conta.data_pagamento || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setConta(prev => ({ ...prev, data_pagamento: e.target.value }))}
                        className="input-base"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Seção 6: Forma de Pagamento */}
            <Card className="card-base">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Forma de Recebimento</h3>
                    <p className="text-sm text-gray-600">Como será recebido</p>
                  </div>
                </div>

                <FormaPagamentoSection
                  value={formaPagamento}
                  onChange={setFormaPagamento}
                  bancos={bancos}
                />
              </div>
            </Card>

            {/* Seção 7: Configurações Adicionais */}
            <Card className="card-base">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configurações Adicionais</h3>
                    <p className="text-sm text-gray-600">Opções extras e observações</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dda"
                      checked={conta.dda}
                      onCheckedChange={(checked) => setConta(prev => ({ ...prev, dda: checked as boolean }))}
                    />
                    <Label htmlFor="dda" className="text-sm">
                      É um recebimento DDA (Débito Direto Autorizado)
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={conta.observacoes}
                      onChange={(e) => {
                        setConta(prev => ({ ...prev, observacoes: e.target.value }));
                        validarCampoTempoReal('observacoes', e.target.value);
                      }}
                      placeholder="Observações adicionais sobre o recebimento..."
                      className="input-base min-h-20"
                      maxLength={500}
                    />
                    {errosValidacao.observacoes && (
                      <p className="text-sm text-red-600">{errosValidacao.observacoes}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {conta.observacoes?.length || 0}/500 caracteres
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Botões de Ação */}
            <Card className="card-base">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => salvarConta(false)}
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Recebimento
                      </>
                    )}
                  </Button>

                  {conta.status !== 'pago' && (
                    <Button
                      onClick={() => salvarConta(true)}
                      disabled={loading}
                      variant="outline"
                      className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Salvar e Marcar como Recebido
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar direita - Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <ContaPreview
                conta={conta}
                formaPagamento={formaPagamento}
              />
            </div>
          </div>
        </div>

        {/* Indicador de auto-save */}
        {rascunhoSalvo && (
          <div className="fixed bottom-6 right-6 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg text-sm">
            ✓ Rascunho salvo automaticamente
          </div>
        )}
      </div>
    </>
  );
}