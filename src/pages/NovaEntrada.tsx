import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, DollarSign, Calendar, User, Tag, Building, FileText, Settings, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';

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

      const sucesso = await criarConta(dadosConta);
      
      if (sucesso) {
        toast({
          title: "Sucesso!",
          description: "Conta a receber cadastrada com sucesso!",
        });
        navigate('/contas-receber');
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
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
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/contas-receber')}
                className="hover:bg-white/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Nova Entrada</h1>
                <p className="text-gray-600">Cadastre uma nova conta a receber</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
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
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* ... keep existing code (all formulário content) */}
            
            <Form {...form}>
              <form id="nova-entrada-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Seção: Pagador */}
                <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-gray-900">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span>Pagador</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <PagadorSelector
                      value={watchedValues.pagador_id}
                      onChange={(value) => form.setValue('pagador_id', value)}
                      onOpenModal={() => setPagadorSelectorOpen(true)}
                      onNewPagador={() => setCadastroRapidoOpen(true)}
                    />
                    {form.formState.errors.pagador_id && (
                      <p className="text-sm text-red-600">{form.formState.errors.pagador_id.message}</p>
                    )}
                  </CardContent>
                </Card>

                {/* ... keep existing code (all other form sections) */}
              </form>
            </Form>
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
      </div>
    </Layout>
  );
}