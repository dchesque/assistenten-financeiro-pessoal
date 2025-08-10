import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { BlurBackground } from '@/components/ui/BlurBackground';
import { useContasPagar } from '@/hooks/useContasPagar';
import { useModalResponsive } from '@/hooks/useModalResponsive';
import { ContactSelector } from '@/components/selectors/ContactSelector';
import { CategoriaSelector } from '@/components/selectors/CategoriaSelector';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, converterMoedaParaNumero } from '@/lib/formatacaoBrasileira';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calculator, CreditCard, Calendar, User, Tag, FileText, DollarSign, CheckCircle, AlertCircle, ArrowLeft, Building2, Receipt } from 'lucide-react';
import { GRADIENTES, GLASSMORPHISM, ANIMATIONS } from '@/constants/designSystem';
import { ContaPagar } from '@/types/contaPagar';

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão de Débito',
  'Cartão de Crédito',
  'Transferência Bancária',
  'Boleto',
  'Cheque',
  'Outro'
];

const ANIMATION_VARIANTS = {
  card: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.95 }
  },
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },
  summary: {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, delay: 0.2 }
    }
  }
};

export default function NovaConta() {
  const navigate = useNavigate();
  const { criarConta, loading } = useContasPagar();
  const { isMobile, getModalClasses } = useModalResponsive();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    descricao: '',
    valor_original: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    contact_id: '',
    category_id: '',
    forma_pagamento: 'PIX',
    dda: false,
    observacoes: '',
    parcela_atual: 1,
    total_parcelas: 1,
    percentual_juros: 0,
    percentual_desconto: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number, data = formData) => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!data.descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
        if (data.valor_original <= 0) newErrors.valor_original = 'Valor deve ser maior que zero';
        if (!data.forma_pagamento) newErrors.forma_pagamento = 'Forma de pagamento é obrigatória';
        break;
      case 2:
        if (!data.data_vencimento) newErrors.data_vencimento = 'Data de vencimento é obrigatória';
        break;
      case 3:
        if (data.parcela_atual > data.total_parcelas) {
          newErrors.parcela_atual = 'Parcela atual não pode ser maior que o total';
        }
        break;
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (data = formData) => {
    return validateStep(1, data) && validateStep(2, data) && validateStep(3, data);
  };

  const calcularValorFinal = useCallback(() => {
    let valor = formData.valor_original;
    
    if (formData.percentual_juros > 0) {
      valor += (valor * formData.percentual_juros / 100);
    }
    
    if (formData.percentual_desconto > 0) {
      valor -= (valor * formData.percentual_desconto / 100);
    }
    
    return valor;
  }, [formData.valor_original, formData.percentual_juros, formData.percentual_desconto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, corrija os erros no formulário.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const valorFinal = calcularValorFinal();
      
      const contaData: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'> = {
        contact_id: formData.contact_id || '',
        category_id: formData.category_id || '',
        descricao: formData.descricao.trim(),
        data_emissao: formData.data_emissao,
        data_vencimento: formData.data_vencimento,
        valor_original: formData.valor_original,
        percentual_juros: formData.percentual_juros || 0,
        valor_juros: formData.percentual_juros ? (formData.valor_original * formData.percentual_juros / 100) : 0,
        percentual_desconto: formData.percentual_desconto || 0,
        valor_desconto: formData.percentual_desconto ? (formData.valor_original * formData.percentual_desconto / 100) : 0,
        valor_final: valorFinal,
        status: 'pendente',
        parcela_atual: formData.parcela_atual,
        total_parcelas: formData.total_parcelas,
        forma_pagamento: formData.forma_pagamento,
        dda: formData.dda,
        observacoes: formData.observacoes.trim() || undefined
      };

      await criarConta(contaData);
      toast({
        title: 'Sucesso!',
        description: 'Conta a pagar criada com sucesso.',
      });
      navigate('/contas-pagar');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar conta a pagar. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleValorChange = useCallback((value: string) => {
    const numericValue = converterMoedaParaNumero(value);
    setFormData(prev => ({ ...prev, valor_original: numericValue }));
  }, []);

  const nextStep = () => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
        if (formData.valor_original <= 0) newErrors.valor_original = 'Valor deve ser maior que zero';
        if (!formData.forma_pagamento) newErrors.forma_pagamento = 'Forma de pagamento é obrigatória';
        break;
      case 2:
        if (!formData.data_vencimento) newErrors.data_vencimento = 'Data de vencimento é obrigatória';
        break;
      case 3:
        if (formData.parcela_atual > formData.total_parcelas) {
          newErrors.parcela_atual = 'Parcela atual não pode ser maior que o total';
        }
        break;
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getStepIcon = (step: number) => {
    const icons = [FileText, Calendar, DollarSign, Calculator];
    const IconComponent = icons[step - 1];
    return <IconComponent className="w-4 h-4" />;
  };

  const getStepTitle = (step: number) => {
    const titles = ['Dados Principais', 'Datas e Relacionamentos', 'Valores e Parcelas', 'Resumo'];
    return titles[step - 1];
  };

  const canProceed = () => {
    return validateStep(currentStep);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 relative">
      <BlurBackground variant="page" />
      
      <div className="relative z-10">
        <PageContainer maxWidth="full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={ANIMATION_VARIANTS.container}
            className="space-y-6 max-w-6xl mx-auto"
          >
            {/* Header com glassmorphism */}
            <motion.div variants={ANIMATION_VARIANTS.card}>
              <Card className={`${GLASSMORPHISM.card} border-white/20 shadow-xl`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-700 bg-clip-text text-transparent">
                        Nova Conta a Pagar
                      </h1>
                      <p className="text-muted-foreground mt-1">
                        Cadastre uma nova conta a pagar no sistema
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/contas-pagar')}
                      className={`${GLASSMORPHISM.input} hover:bg-white/20 transition-all duration-300`}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Step Navigation */}
            <motion.div variants={ANIMATION_VARIANTS.card}>
              <Card className={`${GLASSMORPHISM.card} border-white/20`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`
                          flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                          ${currentStep >= step 
                            ? `bg-gradient-to-r ${GRADIENTES.primary} text-white shadow-lg` 
                            : 'bg-white/60 text-gray-400 border border-gray-200'
                          }
                        `}>
                          {currentStep > step ? <CheckCircle className="w-5 h-5" /> : getStepIcon(step)}
                        </div>
                        {step < 4 && (
                          <div className={`
                            w-12 lg:w-20 h-0.5 mx-2 transition-all duration-300
                            ${currentStep > step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'}
                          `} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-medium text-gray-900">
                      Etapa {currentStep}: {getStepTitle(currentStep)}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Form Content */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        variants={ANIMATION_VARIANTS.card}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <Card className={`${GLASSMORPHISM.card} border-white/20 shadow-lg hover:shadow-xl transition-all duration-300`}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-purple-600" />
                              Dados Principais
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="descricao" className="text-sm font-medium">
                                Descrição *
                              </Label>
                              <Input
                                id="descricao"
                                value={formData.descricao}
                                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                                placeholder="Ex: Aluguel do escritório"
                                className={`${GLASSMORPHISM.input} transition-all duration-300 ${
                                  errors.descricao ? 'border-red-500 bg-red-50/20' : 'focus:border-purple-500'
                                }`}
                              />
                              {errors.descricao && (
                                <motion.p 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-sm text-red-600 flex items-center gap-1"
                                >
                                  <AlertCircle className="w-3 h-3" />
                                  {errors.descricao}
                                </motion.p>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="valor_original" className="text-sm font-medium">
                                  Valor Original *
                                </Label>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    id="valor_original"
                                    value={formatCurrency(formData.valor_original)}
                                    onChange={(e) => handleValorChange(e.target.value)}
                                    placeholder="R$ 0,00"
                                    className={`${GLASSMORPHISM.input} pl-10 transition-all duration-300 ${
                                      errors.valor_original ? 'border-red-500 bg-red-50/20' : 'focus:border-purple-500'
                                    }`}
                                  />
                                </div>
                                {errors.valor_original && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-red-600 flex items-center gap-1"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.valor_original}
                                  </motion.p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="forma_pagamento" className="text-sm font-medium">
                                  Forma de Pagamento *
                                </Label>
                                <Select 
                                  value={formData.forma_pagamento} 
                                  onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value }))}
                                >
                                  <SelectTrigger className={`${GLASSMORPHISM.input} transition-all duration-300 ${
                                    errors.forma_pagamento ? 'border-red-500' : 'focus:border-purple-500'
                                  }`}>
                                    <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FORMAS_PAGAMENTO.map((forma) => (
                                      <SelectItem key={forma} value={forma}>
                                        {forma}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {errors.forma_pagamento && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-red-600 flex items-center gap-1"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.forma_pagamento}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        variants={ANIMATION_VARIANTS.card}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-6"
                      >
                        <Card className={`${GLASSMORPHISM.card} border-white/20 shadow-lg hover:shadow-xl transition-all duration-300`}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-purple-600" />
                              Datas
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="data_emissao" className="text-sm font-medium">
                                  Data de Emissão
                                </Label>
                                <Input
                                  id="data_emissao"
                                  type="date"
                                  value={formData.data_emissao}
                                  onChange={(e) => setFormData(prev => ({ ...prev, data_emissao: e.target.value }))}
                                  className={`${GLASSMORPHISM.input} transition-all duration-300 focus:border-purple-500`}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="data_vencimento" className="text-sm font-medium">
                                  Data de Vencimento *
                                </Label>
                                <Input
                                  id="data_vencimento"
                                  type="date"
                                  value={formData.data_vencimento}
                                  onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                                  className={`${GLASSMORPHISM.input} transition-all duration-300 ${
                                    errors.data_vencimento ? 'border-red-500 bg-red-50/20' : 'focus:border-purple-500'
                                  }`}
                                />
                                {errors.data_vencimento && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-red-600 flex items-center gap-1"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.data_vencimento}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className={`${GLASSMORPHISM.card} border-white/20 shadow-lg hover:shadow-xl transition-all duration-300`}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-purple-600" />
                              Relacionamentos
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Fornecedor</Label>
                                <ContactSelector
                                  value={formData.contact_id || ""}
                                  onChange={(value) => setFormData(prev => ({ ...prev, contact_id: value }))}
                                  tipo="supplier"
                                  placeholder="Selecione o fornecedor"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Categoria</Label>
                                <CategoriaSelector
                                  value={formData.category_id || ""}
                                  onChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                                  tipo="expense"
                                  placeholder="Selecione a categoria"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        variants={ANIMATION_VARIANTS.card}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-6"
                      >
                        <Card className={`${GLASSMORPHISM.card} border-white/20 shadow-lg hover:shadow-xl transition-all duration-300`}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-purple-600" />
                              Valores e Parcelas
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="parcela_atual" className="text-sm font-medium">
                                  Parcela Atual
                                </Label>
                                <Input
                                  id="parcela_atual"
                                  type="number"
                                  min="1"
                                  value={formData.parcela_atual}
                                  onChange={(e) => setFormData(prev => ({ ...prev, parcela_atual: parseInt(e.target.value) || 1 }))}
                                  className={`${GLASSMORPHISM.input} transition-all duration-300 ${
                                    errors.parcela_atual ? 'border-red-500 bg-red-50/20' : 'focus:border-purple-500'
                                  }`}
                                />
                                {errors.parcela_atual && (
                                  <motion.p 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-red-600 flex items-center gap-1"
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    {errors.parcela_atual}
                                  </motion.p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="total_parcelas" className="text-sm font-medium">
                                  Total de Parcelas
                                </Label>
                                <Input
                                  id="total_parcelas"
                                  type="number"
                                  min="1"
                                  value={formData.total_parcelas}
                                  onChange={(e) => setFormData(prev => ({ ...prev, total_parcelas: parseInt(e.target.value) || 1 }))}
                                  className={`${GLASSMORPHISM.input} transition-all duration-300 focus:border-purple-500`}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="percentual_juros" className="text-sm font-medium">
                                  Juros (%)
                                </Label>
                                <Input
                                  id="percentual_juros"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.percentual_juros}
                                  onChange={(e) => setFormData(prev => ({ ...prev, percentual_juros: parseFloat(e.target.value) || 0 }))}
                                  className={`${GLASSMORPHISM.input} transition-all duration-300 focus:border-purple-500`}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="percentual_desconto" className="text-sm font-medium">
                                  Desconto (%)
                                </Label>
                                <Input
                                  id="percentual_desconto"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={formData.percentual_desconto}
                                  onChange={(e) => setFormData(prev => ({ ...prev, percentual_desconto: parseFloat(e.target.value) || 0 }))}
                                  className={`${GLASSMORPHISM.input} transition-all duration-300 focus:border-purple-500`}
                                />
                              </div>
                            </div>

                            <motion.div 
                              className={`${GLASSMORPHISM.card} p-4 border border-white/20 rounded-lg`}
                              whileHover={{ scale: 1.02 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Receipt className="w-5 h-5 text-purple-600" />
                                  <span className="font-medium">DDA (Débito Direto Autorizado)</span>
                                </div>
                                <Switch
                                  checked={formData.dda}
                                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dda: checked }))}
                                />
                              </div>
                            </motion.div>
                          </CardContent>
                        </Card>

                        <Card className={`${GLASSMORPHISM.card} border-white/20 shadow-lg hover:shadow-xl transition-all duration-300`}>
                          <CardHeader>
                            <CardTitle>Observações</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={formData.observacoes}
                              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                              placeholder="Observações adicionais sobre esta conta..."
                              rows={4}
                              className={`${GLASSMORPHISM.input} transition-all duration-300 focus:border-purple-500 resize-none`}
                            />
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        variants={ANIMATION_VARIANTS.card}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <Card className={`${GLASSMORPHISM.card} border-white/20 shadow-lg`}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              Confirmação dos Dados
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <strong>Descrição:</strong>
                                <p className="text-muted-foreground">{formData.descricao}</p>
                              </div>
                              <div className="space-y-2">
                                <strong>Valor Original:</strong>
                                <p className="text-muted-foreground">{formatCurrency(formData.valor_original)}</p>
                              </div>
                              <div className="space-y-2">
                                <strong>Data de Vencimento:</strong>
                                <p className="text-muted-foreground">{new Date(formData.data_vencimento).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div className="space-y-2">
                                <strong>Forma de Pagamento:</strong>
                                <p className="text-muted-foreground">{formData.forma_pagamento}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation Buttons */}
                  <motion.div
                    variants={ANIMATION_VARIANTS.card}
                    className="flex justify-between pt-6"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`${GLASSMORPHISM.input} hover:bg-white/20 transition-all duration-300`}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Anterior
                    </Button>

                    {currentStep < 4 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className={`bg-gradient-to-r ${GRADIENTES.primary} hover:shadow-lg transition-all duration-300 text-white`}
                      >
                        Próximo
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={loading || !validateForm()}
                        className={`bg-gradient-to-r ${GRADIENTES.sucesso} hover:shadow-lg transition-all duration-300 text-white`}
                      >
                        {loading ? 'Salvando...' : 'Criar Conta'}
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </motion.div>
                </div>

                {/* Summary Sidebar */}
                <motion.div
                  variants={ANIMATION_VARIANTS.summary}
                  className="space-y-6"
                >
                  <Card className={`${GLASSMORPHISM.card} border-white/20 shadow-xl sticky top-6`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-purple-600" />
                        Resumo da Conta
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor Original:</span>
                          <motion.span 
                            key={formData.valor_original}
                            initial={{ scale: 1.2, color: '#3b82f6' }}
                            animate={{ scale: 1, color: '#1f2937' }}
                            transition={{ duration: 0.3 }}
                            className="font-medium"
                          >
                            {formatCurrency(formData.valor_original)}
                          </motion.span>
                        </div>
                        
                        <AnimatePresence>
                          {formData.percentual_juros > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex justify-between"
                            >
                              <span className="text-muted-foreground">Juros ({formData.percentual_juros}%):</span>
                              <span className="text-red-600 font-medium">
                                + {formatCurrency(formData.valor_original * formData.percentual_juros / 100)}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <AnimatePresence>
                          {formData.percentual_desconto > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex justify-between"
                            >
                              <span className="text-muted-foreground">Desconto ({formData.percentual_desconto}%):</span>
                              <span className="text-green-600 font-medium">
                                - {formatCurrency(formData.valor_original * formData.percentual_desconto / 100)}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <Separator />
                        
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Valor Final:</span>
                          <motion.span 
                            key={calcularValorFinal()}
                            initial={{ scale: 1.2, color: '#3b82f6' }}
                            animate={{ scale: 1, color: '#7c3aed' }}
                            transition={{ duration: 0.4 }}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                          >
                            {formatCurrency(calcularValorFinal())}
                          </motion.span>
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {formData.total_parcelas > 1 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="pt-3 border-t border-white/20"
                          >
                            <div className="text-sm text-muted-foreground mb-2">Parcelas:</div>
                            <Badge 
                              variant="outline" 
                              className="bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200"
                            >
                              {formData.parcela_atual} de {formData.total_parcelas}
                            </Badge>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {currentStep === 4 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="pt-4 border-t border-white/20"
                        >
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/contas-pagar')}
                            disabled={loading}
                            className={`w-full ${GLASSMORPHISM.input} hover:bg-white/20 transition-all duration-300`}
                          >
                            Cancelar
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </form>
          </motion.div>
        </PageContainer>
      </div>
    </div>
  );
}