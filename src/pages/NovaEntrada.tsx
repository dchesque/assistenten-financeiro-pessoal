import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, DollarSign, Calendar, User, Tag, Building, FileText, Settings, Eye, Save, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BlurBackground } from '@/components/ui/BlurBackground';

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
    <>
      <PageHeader
        breadcrumb={createBreadcrumb('/nova-entrada')}
        title="Nova Entrada"
        subtitle="Cadastre uma nova conta a receber • Lançamento individual"
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        {/* Background abstratos */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário principal */}
            <div className="lg:col-span-2 space-y-8">
              <Form {...form}>
                <form id="nova-entrada-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  
                  {/* Card 1: Dados do Pagador */}
                  <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 rounded-2xl">
                    <div className="p-6 space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">1</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Dados do Pagador</h2>
                      </div>
                      
                      <div className="space-y-4">
                        <PagadorSelector
                          value={watchedValues.pagador_id}
                          onChange={(value) => form.setValue('pagador_id', value)}
                          onOpenModal={() => setPagadorSelectorOpen(true)}
                          onNewPagador={() => setCadastroRapidoOpen(true)}
                        />
                        {form.formState.errors.pagador_id && (
                          <p className="text-sm text-red-600 mt-1">{form.formState.errors.pagador_id.message}</p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Card 2: Informações da Conta */}
                  <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 rounded-2xl">
                    <div className="p-6 space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">2</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Informações da Conta</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                  </Card>

                  {/* Card 3: Categorização */}
                  <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 rounded-2xl">
                    <div className="p-6 space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">3</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Categorização</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                  </Card>

                  {/* Card 4: Configurações */}
                  <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 rounded-2xl">
                    <div className="p-6 space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">4</span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Configurações</h2>
                      </div>
                      
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="recorrente"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-gray-200/50 p-4 bg-gray-50/50">
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
                                  {...field}
                                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </Card>
                </form>
              </Form>
            </div>

            {/* Sidebar responsiva */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-8">
                <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
                  <div className="p-6 space-y-6">
                    {/* Header da sidebar */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Preview da Conta</h3>
                    </div>
                    
                    <Separator />
                    
                    {/* Preview dos dados */}
                    <div className="space-y-4">
                      {watchedValues.descricao ? (
                        <div className="bg-gray-50/50 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-600 mb-1">Descrição</p>
                          <p className="text-gray-900 font-medium">{watchedValues.descricao}</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50/30 rounded-xl p-4 border-2 border-dashed border-gray-200">
                          <p className="text-sm text-gray-500">Aguardando descrição...</p>
                        </div>
                      )}

                      {watchedValues.valor ? (
                        <div className="bg-green-50/50 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-600 mb-1">Valor</p>
                          <p className="text-2xl font-bold text-green-600">{watchedValues.valor}</p>
                        </div>
                      ) : (
                        <div className="bg-gray-50/30 rounded-xl p-4 border-2 border-dashed border-gray-200">
                          <p className="text-sm text-gray-500">Aguardando valor...</p>
                        </div>
                      )}

                      {watchedValues.data_vencimento ? (
                        <div className="bg-blue-50/50 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-600 mb-1">Vencimento</p>
                          <p className="text-gray-900 font-medium">
                            {new Date(watchedValues.data_vencimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50/30 rounded-xl p-4 border-2 border-dashed border-gray-200">
                          <p className="text-sm text-gray-500">Aguardando data de vencimento...</p>
                        </div>
                      )}

                      {watchedValues.data_recebimento && (
                        <div className="bg-purple-50/50 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-600 mb-1">Recebimento</p>
                          <p className="text-gray-900 font-medium">
                            {new Date(watchedValues.data_recebimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}

                      {watchedValues.recorrente && (
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-blue-100/80 text-blue-700 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                            Recorrente
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    {/* Ações */}
                    <div className="space-y-3">
                      <Button 
                        form="nova-entrada-form"
                        type="submit"
                        disabled={loadingConta}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                      >
                        {loadingConta ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Conta
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                        className="w-full bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-gray-300/50 rounded-xl"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Limpar Formulário
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para cadastro rápido de pagador */}
      <CadastroRapidoPagadorModal
        isOpen={cadastroRapidoOpen}
        onClose={() => setCadastroRapidoOpen(false)}
        onPagadorCriado={(pagadorId) => {
          form.setValue('pagador_id', pagadorId);
          setCadastroRapidoOpen(false);
        }}
      />
    </>
  );
}