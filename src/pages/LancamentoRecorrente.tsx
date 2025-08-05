import { useState } from 'react';
import { Plus, Calendar, DollarSign, Package, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/PageHeader';
import { Layout } from '@/components/layout/Layout';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { DatePicker } from '@/components/ui/DatePicker';
import { PagadorSelector } from '@/components/contasReceber/PagadorSelector';
import { CategoriaReceitaSelector } from '@/components/contasReceber/CategoriaReceitaSelector';
import { useContasReceber } from '@/hooks/useContasReceber';
import { toast } from 'sonner';
import { format, addDays, addMonths } from 'date-fns';

interface ParcelaRecorrente {
  numero: number;
  data_vencimento: string;
  valor: number;
  descricao: string;
}

const INTERVALOS_OPCOES = [
  { value: 'mensal', label: 'Mensal (30 dias)', dias: 30 },
  { value: 'quinzenal', label: 'Quinzenal (15 dias)', dias: 15 },
  { value: 'semanal', label: 'Semanal (7 dias)', dias: 7 }
];

export default function LancamentoRecorrente() {
  const [formData, setFormData] = useState({
    pagador_id: null as number | null,
    categoria_receita_id: null as number | null,
    descricao: '',
    documento_referencia: '',
    valor_parcela: 0,
    primeira_data_vencimento: '',
    quantidade_parcelas: 1,
    intervalo_parcelas: 'mensal' as 'mensal' | 'quinzenal' | 'semanal',
    data_emissao: format(new Date(), 'yyyy-MM-dd')
  });

  const [parcelas, setParcelas] = useState<ParcelaRecorrente[]>([]);
  const [etapa, setEtapa] = useState<'configuracao' | 'preview' | 'processando' | 'concluido'>('configuracao');
  const [progresso, setProgresso] = useState(0);

  const { criarConta } = useContasReceber();

  const breadcrumbItems = [
    { label: 'Início', href: '/dashboard' },
    { label: 'Recebimentos' },
    { label: 'Lançamento Recorrente' }
  ];

  const calcularParcelas = () => {
    if (!formData.primeira_data_vencimento || !formData.valor_parcela || !formData.quantidade_parcelas) {
      return;
    }

    const novasParcelas: ParcelaRecorrente[] = [];
    const dataInicial = new Date(formData.primeira_data_vencimento);
    const intervalo = INTERVALOS_OPCOES.find(i => i.value === formData.intervalo_parcelas);

    if (!intervalo) return;

    for (let i = 0; i < formData.quantidade_parcelas; i++) {
      let dataVencimento: Date;
      
      if (formData.intervalo_parcelas === 'mensal') {
        dataVencimento = addMonths(dataInicial, i);
      } else {
        dataVencimento = addDays(dataInicial, i * intervalo.dias);
      }

      novasParcelas.push({
        numero: i + 1,
        data_vencimento: format(dataVencimento, 'yyyy-MM-dd'),
        valor: formData.valor_parcela,
        descricao: `${formData.descricao} - Parcela ${i + 1}/${formData.quantidade_parcelas}`
      });
    }

    setParcelas(novasParcelas);
  };

  const handleGerarPreview = () => {
    if (!formData.pagador_id || !formData.categoria_receita_id || !formData.descricao || !formData.valor_parcela) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    calcularParcelas();
    setEtapa('preview');
  };

  const handleConfirmarLancamento = async () => {
    setEtapa('processando');
    setProgresso(0);

    try {
      for (let i = 0; i < parcelas.length; i++) {
        const parcela = parcelas[i];
        
        await criarConta({
          pagador_id: formData.pagador_id!,
          categoria_id: formData.categoria_receita_id!,
          descricao: parcela.descricao,
          valor: parcela.valor,
          data_vencimento: parcela.data_vencimento,
          status: 'pendente',
          observacoes: `Lançamento recorrente - ${formData.intervalo_parcelas}`,
          recorrente: true
        });

        setProgresso(((i + 1) / parcelas.length) * 100);
        
        // Pequeno delay para mostrar o progresso
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setEtapa('concluido');
      toast.success(`${parcelas.length} contas a receber criadas com sucesso!`);
    } catch (error) {
      console.error('Erro ao criar lançamento recorrente:', error);
      toast.error('Erro ao processar lançamento recorrente');
      setEtapa('preview');
    }
  };

  const handleNovoLancamento = () => {
    setFormData({
      pagador_id: null,
      categoria_receita_id: null,
      descricao: '',
      documento_referencia: '',
      valor_parcela: 0,
      primeira_data_vencimento: '',
      quantidade_parcelas: 1,
      intervalo_parcelas: 'mensal',
      data_emissao: format(new Date(), 'yyyy-MM-dd')
    });
    setParcelas([]);
    setEtapa('configuracao');
    setProgresso(0);
  };

  const valorTotal = parcelas.reduce((total, parcela) => total + parcela.valor, 0);

  if (etapa === 'processando') {
    return (
      <Layout>
        <div className="p-4 lg:p-8">
          <PageHeader 
            title="Processando Lançamento" 
            subtitle="Criando contas a receber..."
            breadcrumb={breadcrumbItems}
          />

          <Card className="card-base max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold mb-4">Processando lançamento...</h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progresso}%` }}
                ></div>
              </div>
              <p className="text-gray-600">{Math.round(progresso)}% concluído</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (etapa === 'concluido') {
    return (
      <Layout>
        <div className="p-4 lg:p-8">
          <PageHeader 
            title="Lançamento Concluído" 
            subtitle="Contas a receber criadas com sucesso"
            breadcrumb={breadcrumbItems}
          />

          <Card className="card-base max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-4">Lançamento realizado com sucesso!</h3>
              <p className="text-gray-600 mb-6">
                {parcelas.length} contas a receber foram criadas no sistema.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Total de parcelas:</span>
                    <span className="ml-2 text-green-600">{parcelas.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-800">Valor total:</span>
                    <span className="ml-2 text-green-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleNovoLancamento} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Lançamento
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/contas-receber'}>
                  Ver Contas a Receber
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (etapa === 'preview') {
    return (
      <Layout>
        <div className="p-4 lg:p-8">
          <PageHeader 
            title="Preview do Lançamento" 
            subtitle="Confirme os dados antes de processar"
            breadcrumb={breadcrumbItems}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEtapa('configuracao')}>
                  Voltar
                </Button>
                <Button onClick={handleConfirmarLancamento} className="btn-primary">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Lançamento
                </Button>
              </div>
            }
          />

          <div className="grid gap-6">
            {/* Resumo */}
            <Card className="card-base">
              <CardHeader>
                <CardTitle>Resumo do Lançamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-600">Total de Parcelas</p>
                    <p className="text-2xl font-bold text-blue-700">{parcelas.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-600">Valor Total</p>
                    <p className="text-2xl font-bold text-green-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-600">Primeira Parcela</p>
                    <p className="text-lg font-bold text-purple-700">
                      {parcelas[0] ? new Date(parcelas[0].data_vencimento).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-orange-600">Última Parcela</p>
                    <p className="text-lg font-bold text-orange-700">
                      {parcelas[parcelas.length - 1] ? new Date(parcelas[parcelas.length - 1].data_vencimento).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Parcelas */}
            <Card className="card-base">
              <CardHeader>
                <CardTitle>Parcelas a serem criadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {parcelas.map((parcela, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{parcela.numero}</Badge>
                        <div>
                          <p className="font-medium">{parcela.descricao}</p>
                          <p className="text-sm text-gray-600">
                            Vencimento: {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valor)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 lg:p-8">
        <PageHeader 
          title="Lançamento Recorrente" 
          subtitle="Crie múltiplas contas a receber automaticamente"
          breadcrumb={breadcrumbItems}
        />

        <Card className="card-base max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Configuração do Lançamento Recorrente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pagador">Pagador *</Label>
                <PagadorSelector
                  value={formData.pagador_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, pagador_id: value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria de Receita *</Label>
                <CategoriaReceitaSelector
                  value={formData.categoria_receita_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, categoria_receita_id: value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Aluguel, Salário, etc."
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">Documento/Referência</Label>
                <Input
                  id="documento"
                  placeholder="Número do contrato, nota fiscal, etc."
                  value={formData.documento_referencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, documento_referencia: e.target.value }))}
                />
              </div>
            </div>

            {/* Configuração das parcelas */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Configuração das Parcelas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor por Parcela *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="valor"
                      type="number"
                      placeholder="0,00"
                      step="0.01"
                      min="0"
                      className="pl-10"
                      value={formData.valor_parcela || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_parcela: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-inicial">Primeira Data *</Label>
                <DatePicker
                  value={formData.primeira_data_vencimento}
                  onChange={(date) => setFormData(prev => ({ 
                    ...prev, 
                    primeira_data_vencimento: date
                  }))}
                />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.quantidade_parcelas}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade_parcelas: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intervalo">Intervalo *</Label>
                  <Select 
                    value={formData.intervalo_parcelas} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, intervalo_parcelas: value }))}
                  >
                    <SelectTrigger>
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

            {/* Data de emissão */}
            <div className="border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="data-emissao">Data de Emissão</Label>
                <DatePicker
                  value={formData.data_emissao}
                  onChange={(date) => setFormData(prev => ({ 
                    ...prev, 
                    data_emissao: date
                  }))}
                />
              </div>
            </div>

            {/* Resumo rápido */}
            {formData.valor_parcela > 0 && formData.quantidade_parcelas > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Resumo:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Parcelas:</span>
                    <span className="ml-2 font-medium">{formData.quantidade_parcelas}x</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Valor total:</span>
                    <span className="ml-2 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                        .format(formData.valor_parcela * formData.quantidade_parcelas)}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Periodicidade:</span>
                    <span className="ml-2 font-medium">
                      {INTERVALOS_OPCOES.find(i => i.value === formData.intervalo_parcelas)?.label.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button variant="outline" onClick={() => window.history.back()}>
                Cancelar
              </Button>
              <Button onClick={handleGerarPreview} className="btn-primary">
                <ArrowRight className="w-4 h-4 mr-2" />
                Gerar Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}