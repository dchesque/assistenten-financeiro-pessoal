import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, converterMoedaParaNumero } from '@/lib/formatacaoBrasileira';
import { toast } from '@/hooks/use-toast';
import { ContactSelector } from '@/components/selectors/ContactSelector';
import { CategoriaSelector } from '@/components/selectors/CategoriaSelector';
import { useContasReceber } from '@/hooks/useContasReceber';
import { ContaReceber } from '@/types/contaReceber';
import { ArrowLeft, Calendar, DollarSign, User, FileText, CreditCard, Building2, Calculator } from 'lucide-react';

const FORMAS_RECEBIMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão de Débito',
  'Cartão de Crédito',
  'Transferência Bancária',
  'Boleto',
  'Cheque',
  'Outro'
];

export default function NovoRecebimento() {
  const navigate = useNavigate();
  const { criarConta, loading } = useContasReceber();

  const [formData, setFormData] = useState({
    descricao: '',
    valor_original: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    contact_id: '',
    category_id: '',
    forma_recebimento: 'PIX',
    observacoes: '',
    parcela_atual: 1,
    total_parcelas: 1,
    percentual_juros: 0,
    percentual_desconto: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (formData.valor_original <= 0) {
      newErrors.valor_original = 'Valor deve ser maior que zero';
    }

    if (!formData.data_vencimento) {
      newErrors.data_vencimento = 'Data de vencimento é obrigatória';
    }

    if (!formData.forma_recebimento) {
      newErrors.forma_recebimento = 'Forma de recebimento é obrigatória';
    }

    if (formData.parcela_atual > formData.total_parcelas) {
      newErrors.parcela_atual = 'Parcela atual não pode ser maior que o total';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calcularValorFinal = () => {
    let valor = formData.valor_original;
    
    // Aplicar juros
    if (formData.percentual_juros > 0) {
      valor += (valor * formData.percentual_juros / 100);
    }
    
    // Aplicar desconto
    if (formData.percentual_desconto > 0) {
      valor -= (valor * formData.percentual_desconto / 100);
    }
    
    return valor;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const valorFinal = calcularValorFinal();
      
      const contaData = {
        description: formData.descricao.trim(),
        amount: valorFinal,
        due_date: formData.data_vencimento,
        status: 'pending' as const,
        category_id: formData.category_id || undefined,
        customer_name: formData.contact_id ? undefined : 'Cliente não informado',
        notes: formData.observacoes.trim() || undefined
      };

      await criarConta(contaData);
      toast({
        title: 'Sucesso!',
        description: 'Conta a receber criada com sucesso.',
      });
      navigate('/contas-receber');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar conta a receber. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleValorChange = (value: string) => {
    const numericValue = converterMoedaParaNumero(value);
    setFormData(prev => ({ ...prev, valor_original: numericValue }));
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader 
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Contas a Receber', href: '/contas-receber' },
            { label: 'Nova Conta' }
          ]}
          title="Nova Conta a Receber"
          subtitle="Cadastre uma nova conta a receber no sistema"
          actions={
            <Button 
              variant="outline" 
              onClick={() => navigate('/contas-receber')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          }
        />

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Dados Principais */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="card-base">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Dados Principais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Ex: Venda de produtos"
                      className={errors.descricao ? 'border-red-500' : ''}
                    />
                    {errors.descricao && <p className="text-sm text-red-600">{errors.descricao}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor_original">Valor Original *</Label>
                      <Input
                        id="valor_original"
                        value={formatCurrency(formData.valor_original)}
                        onChange={(e) => handleValorChange(e.target.value)}
                        placeholder="R$ 0,00"
                        className={errors.valor_original ? 'border-red-500' : ''}
                      />
                      {errors.valor_original && <p className="text-sm text-red-600">{errors.valor_original}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="forma_recebimento">Forma de Recebimento *</Label>
                      <Select value={formData.forma_recebimento} onValueChange={(value) => setFormData(prev => ({ ...prev, forma_recebimento: value }))}>
                        <SelectTrigger className={errors.forma_recebimento ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAS_RECEBIMENTO.map((forma) => (
                            <SelectItem key={forma} value={forma}>
                              {forma}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.forma_recebimento && <p className="text-sm text-red-600">{errors.forma_recebimento}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_emissao">Data de Emissão</Label>
                      <Input
                        id="data_emissao"
                        type="date"
                        value={formData.data_emissao}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_emissao: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                      <Input
                        id="data_vencimento"
                        type="date"
                        value={formData.data_vencimento}
                        onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                        className={errors.data_vencimento ? 'border-red-500' : ''}
                      />
                      {errors.data_vencimento && <p className="text-sm text-red-600">{errors.data_vencimento}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Relacionamentos */}
              <Card className="card-base">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Relacionamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente/Pagador</Label>
                      <ContactSelector
                        value={formData.contact_id}
                        onChange={(value) => setFormData(prev => ({ ...prev, contact_id: value }))}
                        tipo="customer"
                        placeholder="Selecione o cliente"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <CategoriaSelector
                        value={formData.category_id}
                        onChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                        tipo="income"
                        placeholder="Selecione a categoria"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valores e Parcelas */}
              <Card className="card-base">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Valores e Parcelas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="parcela_atual">Parcela Atual</Label>
                      <Input
                        id="parcela_atual"
                        type="number"
                        min="1"
                        value={formData.parcela_atual}
                        onChange={(e) => setFormData(prev => ({ ...prev, parcela_atual: parseInt(e.target.value) || 1 }))}
                        className={errors.parcela_atual ? 'border-red-500' : ''}
                      />
                      {errors.parcela_atual && <p className="text-sm text-red-600">{errors.parcela_atual}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total_parcelas">Total de Parcelas</Label>
                      <Input
                        id="total_parcelas"
                        type="number"
                        min="1"
                        value={formData.total_parcelas}
                        onChange={(e) => setFormData(prev => ({ ...prev, total_parcelas: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="percentual_juros">Juros (%)</Label>
                      <Input
                        id="percentual_juros"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.percentual_juros}
                        onChange={(e) => setFormData(prev => ({ ...prev, percentual_juros: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="percentual_desconto">Desconto (%)</Label>
                      <Input
                        id="percentual_desconto"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.percentual_desconto}
                        onChange={(e) => setFormData(prev => ({ ...prev, percentual_desconto: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Observações */}
              <Card className="card-base">
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais sobre esta conta..."
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Resumo */}
            <div className="space-y-6">
              <Card className="card-base sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Original:</span>
                      <span className="font-medium">{formatCurrency(formData.valor_original)}</span>
                    </div>
                    
                    {formData.percentual_juros > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Juros ({formData.percentual_juros}%):</span>
                        <span className="text-green-600">+ {formatCurrency(formData.valor_original * formData.percentual_juros / 100)}</span>
                      </div>
                    )}
                    
                    {formData.percentual_desconto > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Desconto ({formData.percentual_desconto}%):</span>
                        <span className="text-red-600">- {formatCurrency(formData.valor_original * formData.percentual_desconto / 100)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Valor Final:</span>
                      <span className="text-primary">{formatCurrency(calcularValorFinal())}</span>
                    </div>
                  </div>

                  {formData.total_parcelas > 1 && (
                    <div className="pt-3 border-t">
                      <div className="text-sm text-muted-foreground mb-2">Parcelas:</div>
                      <Badge variant="outline">
                        {formData.parcela_atual} de {formData.total_parcelas}
                      </Badge>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary"
                    >
                      {loading ? 'Salvando...' : 'Criar Conta'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/contas-receber')}
                      disabled={loading}
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}