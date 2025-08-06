import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, DollarSign, Calendar, User, Tag, Building, FileText, Settings, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';

import { createBreadcrumb } from '@/utils/breadcrumbUtils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/DatePicker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { PagadorSelector } from '@/components/contasReceber/PagadorSelector';
import { CategoriaReceitaSelector } from '@/components/contasReceber/CategoriaReceitaSelector';
import { CadastroRapidoPagadorModal } from '@/components/contasReceber/CadastroRapidoPagadorModal';

import { useContasReceber } from '@/hooks/useContasReceber';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { useFormatacao } from '@/hooks/useFormatacao';
import { formatarMoeda } from '@/utils/formatters';

const novaEntradaSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  data_recebimento: z.string().optional(),
  pagador_id: z.number().min(1, 'Pagador é obrigatório'),
  categoria_id: z.number().min(1, 'Categoria é obrigatória'),
  banco_id: z.number().optional(),
  observacoes: z.string().optional(),
  recorrente: z.boolean().default(false)
});

type NovaEntradaForm = z.infer<typeof novaEntradaSchema>;

export default function NovaEntrada() {
  const navigate = useNavigate();
  const { criarConta, loading: loadingConta } = useContasReceber();
  const { bancos, loading: loadingBancos } = useBancosSupabase();
  const { formatarMoedaInput, converterMoedaParaNumero } = useFormatacao();

  const [showPreview, setShowPreview] = useState(false);
  const [pagadorSelectorOpen, setPagadorSelectorOpen] = useState(false);
  const [categoriaSelectorOpen, setCategoriaSelectorOpen] = useState(false);
  const [cadastroRapidoOpen, setCadastroRapidoOpen] = useState(false);

  const form = useForm<NovaEntradaForm>({
    resolver: zodResolver(novaEntradaSchema),
    defaultValues: {
      descricao: '',
      valor: '',
      data_vencimento: '',
      data_recebimento: '',
      pagador_id: 0,
      categoria_id: 0,
      banco_id: 0,
      observacoes: '',
      recorrente: false
    }
  });

  const watchedValues = form.watch();

  const onSubmit = async (data: NovaEntradaForm) => {
    try {
      const valorNumerico = converterMoedaParaNumero(data.valor);
      
      const dadosConta = {
        descricao: data.descricao,
        valor: valorNumerico,
        data_vencimento: data.data_vencimento,
        data_recebimento: data.data_recebimento || undefined,
        pagador_id: data.pagador_id,
        categoria_id: data.categoria_id,
        banco_id: data.banco_id || undefined,
        observacoes: data.observacoes || undefined,
        recorrente: data.recorrente,
        status: data.data_recebimento ? 'recebido' as const : 'pendente' as const
      };

      await criarConta(dadosConta);
      
      toast({
        title: "Sucesso",
        description: "Conta a receber cadastrada com sucesso!",
      });
      
      navigate('/contas-receber');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cadastrar conta a receber. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleValorChange = (value: string) => {
    const valorFormatado = formatarMoedaInput(value);
    form.setValue('valor', valorFormatado);
  };

  return (
    <Layout>
      <PageHeader
        breadcrumb={createBreadcrumb('/nova-entrada')}
        title="Nova Entrada"
        subtitle="Cadastre uma nova conta a receber • Lançamento individual"
        actions={
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate('/contas-receber')}
              className="bg-white/80 hover:bg-white/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="bg-white/80 hover:bg-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Ocultar' : 'Visualizar'}
            </Button>
            <Button
              type="submit"
              form="nova-entrada-form"
              disabled={loadingConta}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {loadingConta ? 'Salvando...' : 'Salvar Entrada'}
            </Button>
          </div>
        }
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="relative z-10 w-full px-0 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8 px-4 lg:px-8">
          {/* Formulário principal */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="p-8 space-y-8">
                <Form {...form}>
                  <form id="nova-entrada-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  
                    {/* Seção 1: Pagador */}
                    <div>
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          1
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Pagador</h3>
                      </div>
                      <div className="space-y-4">
                        <PagadorSelector
                          value={watchedValues.pagador_id}
                          onChange={(value) => form.setValue('pagador_id', value)}
                          onOpenModal={() => setPagadorSelectorOpen(true)}
                          onNewPagador={() => setCadastroRapidoOpen(true)}
                        />
                        {form.formState.errors.pagador_id && (
                          <p className="text-sm text-red-600">{form.formState.errors.pagador_id.message}</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Seção 2: Informações da Conta */}
                    <div>
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          2
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Informações da Conta</h3>
                      </div>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Descrição da receita"
                            {...field}
                            className="bg-white/80 border-gray-300/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="R$ 0,00"
                            value={field.value}
                            onChange={(e) => handleValorChange(e.target.value)}
                            className="bg-white/80 border-gray-300/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="data_vencimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento *</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Selecionar data"
                            className="bg-white/80"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_recebimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Recebimento</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Selecionar data"
                            className="bg-white/80"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Seção 3: Categorização */}
                    <div>
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          3
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Categorização</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria *
                    </label>
                    <CategoriaReceitaSelector
                      value={watchedValues.categoria_id}
                      onChange={(value) => form.setValue('categoria_id', value)}
                      onOpenModal={() => setCategoriaSelectorOpen(true)}
                    />
                    {form.formState.errors.categoria_id && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.categoria_id.message}</p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="banco_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco</FormLabel>
                        <Select
                          value={field.value?.toString() || ''}
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : 0)}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/80 border-gray-300/50">
                              <SelectValue placeholder="Selecionar banco" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Nenhum banco</SelectItem>
                            {bancos.map((banco) => (
                              <SelectItem key={banco.id} value={banco.id.toString()}>
                                {banco.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                      </div>
                    </div>

                    <Separator />

                    {/* Seção 4: Configurações */}
                    <div>
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          4
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Configurações</h3>
                      </div>
                      <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="recorrente"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200/50 p-4 bg-gray-50/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">
                          Receita Recorrente
                        </FormLabel>
                        <p className="text-sm text-gray-500">
                          Esta receita se repete mensalmente
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais..."
                          className="bg-white/80 border-gray-300/50 resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            </Card>
          </div>

          {/* Preview Lateral */}
          {showPreview && (
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg sticky top-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-gray-900">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <span>Pré-visualização</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição</label>
                      <p className="text-sm text-gray-900 font-medium">
                        {watchedValues.descricao || 'Não informado'}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valor</label>
                      <p className="text-lg font-bold text-green-600">
                        {watchedValues.valor || 'R$ 0,00'}
                      </p>
                    </div>

                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vencimento</label>
                         <p className="text-sm text-gray-900">
                           {watchedValues.data_vencimento || 'Não informado'}
                         </p>
                       </div>
                       
                       <div>
                         <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recebimento</label>
                         <p className="text-sm text-gray-900">
                           {watchedValues.data_recebimento || 'Não informado'}
                         </p>
                       </div>
                     </div>

                     <div>
                       <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                       <Badge 
                         variant={watchedValues.data_recebimento ? "default" : "secondary"}
                         className="mt-1"
                       >
                         {watchedValues.data_recebimento ? 'Recebido' : 'Pendente'}
                       </Badge>
                     </div>

                     {watchedValues.recorrente && (
                       <div>
                         <Badge variant="outline" className="mt-2">
                           📅 Recorrente
                         </Badge>
                       </div>
                     )}

                     {watchedValues.observacoes && (
                       <div>
                         <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Observações</label>
                         <p className="text-sm text-gray-600 italic">
                           {watchedValues.observacoes}
                         </p>
                       </div>
                     )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CadastroRapidoPagadorModal
        isOpen={cadastroRapidoOpen}
        onClose={() => setCadastroRapidoOpen(false)}
        onPagadorCriado={(pagadorId) => {
          form.setValue('pagador_id', pagadorId);
          setCadastroRapidoOpen(false);
        }}
      />
    </Layout>
  );
}