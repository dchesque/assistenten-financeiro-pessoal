
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatarMoeda } from "@/utils/formatters";
import { useFormatacao } from "@/hooks/useFormatacao";
import { useValidacaoVenda } from "@/hooks/useValidacaoVenda";
import { useVendas } from "@/hooks/useVendas";
import { FormularioVenda } from "@/components/vendas/FormularioVenda";
import { ResumoVenda } from "@/components/vendas/ResumoVenda";
import { Cliente } from "@/types/cliente";
import { PlanoContas } from "@/types/planoContas";
import { Vendedor } from "@/types/vendedor";
import { toast } from "@/components/ui/sonner";
import { useToast } from "@/hooks/use-toast";
import { Eraser, Save, ShoppingCart, Home, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { createBreadcrumb } from "@/utils/breadcrumbUtils";

interface FormData {
  dataVenda: string;
  horaVenda: string;
  cliente: Cliente | null;
  vendedor: Vendedor | null;
  categoria: PlanoContas | null;
  tipoVenda: 'venda' | 'devolucao';
  valorBruto: string;
  descontoPercentual: string;
  descontoValor: string;
  formaPagamento: string;
  bancoId: number | null;
  parcelamento: number;
  numeroParcelas: number;
  documentoReferencia: string;
  observacoes: string;
  vendaAVista: boolean;
  enviarPorEmail: boolean;
}

export default function NovaVenda() {
  const { converterMoedaParaNumero, converterPercentualParaNumero, formatarPercentualInput } = useFormatacao();
  const { errosValidacao, validarFormulario, limparErros } = useValidacaoVenda();
  const { toast: useToastHook } = useToast();
  const { salvarVenda: salvarVendaHook, loading } = useVendas();

  const [formData, setFormData] = useState<FormData>({
    dataVenda: new Date().toLocaleDateString('pt-CA'), // Formato YYYY-MM-DD em timezone local
    horaVenda: new Date().toTimeString().slice(0, 5),
    cliente: null,
    vendedor: null,
    categoria: null,
    tipoVenda: 'venda',
    valorBruto: '',
    descontoPercentual: '',
    descontoValor: '',
    formaPagamento: '',
    bancoId: null,
    parcelamento: 1,
    numeroParcelas: 1,
    documentoReferencia: '',
    observacoes: '',
    vendaAVista: true,
    enviarPorEmail: false
  });

  // Cálculos automáticos
  const calcularValorLiquido = (): number => {
    const bruto = converterMoedaParaNumero(formData.valorBruto);
    const descontoR = converterMoedaParaNumero(formData.descontoValor);
    const valorCalculado = bruto - descontoR;
    return formData.tipoVenda === 'devolucao' ? -Math.abs(valorCalculado) : valorCalculado;
  };

  // Função para calcular percentual a partir do valor de desconto
  const calcularPercentualDesconto = (valorDesconto: string, valorBruto: string): string => {
    if (!valorDesconto || !valorBruto) return '';
    
    const desconto = converterMoedaParaNumero(valorDesconto);
    const bruto = converterMoedaParaNumero(valorBruto);
    
    if (bruto === 0) return '';
    
    const percentual = (desconto / bruto) * 100;
    const percentualLimitado = Math.min(percentual, 100);
    
    return formatarPercentualInput(percentualLimitado.toString());
  };

  // Validação do formulário
  const isFormularioValido = (): boolean => {
    return !!(formData.dataVenda && formData.categoria && formData.valorBruto && formData.formaPagamento);
  };

  // Função para limpar campos
  const limparCampos = () => {
    setFormData({
      dataVenda: new Date().toLocaleDateString('pt-CA'), // Formato YYYY-MM-DD em timezone local
      horaVenda: new Date().toTimeString().slice(0, 5),
      cliente: null,
      vendedor: null,
      categoria: null,
      tipoVenda: 'venda',
      valorBruto: '',
      descontoPercentual: '',
      descontoValor: '',
      formaPagamento: '',
      bancoId: null,
      parcelamento: 1,
      numeroParcelas: 1,
      documentoReferencia: '',
      observacoes: '',
      vendaAVista: true,
      enviarPorEmail: false
    });
    limparErros();
    toast.success("Campos limpos com sucesso!");
  };

  // Função para salvar venda
  const salvarVenda = async () => {
    if (!isFormularioValido()) {
      useToastHook({
        title: "Formulário incompleto",
        description: "Preencha todos os campos obrigatórios antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const valorLiquido = calcularValorLiquido();
      
        // Preparar dados usando a estrutura correta do hook
        const dadosVenda = {
          data_venda: formData.dataVenda,
          hora_venda: formData.horaVenda || '12:00:00',
          cliente_id: formData.cliente?.id || 1, // ID do cliente "CONSUMIDOR" se não especificado
          valor_total: converterMoedaParaNumero(formData.valorBruto),
          desconto: converterMoedaParaNumero(formData.descontoValor),
          valor_final: Math.abs(valorLiquido), // Garantir valor positivo
          forma_pagamento: formData.formaPagamento,
          parcelas: formData.vendaAVista ? 1 : formData.parcelamento,
          plano_conta_id: formData.categoria?.id || null,
          tipo_venda: formData.tipoVenda === 'venda' ? 'produto' : 'devolucao', // Corrigir mapeamento
          vendedor_id: formData.vendedor?.id || null, // Usar vendedor_id em vez de string
          vendedor: formData.vendedor?.nome || 'Sistema', // Manter para compatibilidade
          observacoes: formData.observacoes,
          status: 'ativa',
          ativo: true
        };

      console.log("Salvando venda com dados:", dadosVenda);

      // Usar o hook useVendas para salvar
      const sucesso = await salvarVendaHook(dadosVenda);
      
      if (sucesso) {
        limparCampos();
      }
    } catch (error) {
      console.error("Erro inesperado ao salvar venda:", error);
      useToastHook({
        title: "Erro",
        description: "Erro inesperado ao salvar venda. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Blur decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/nova-venda')}
        title="Nova Venda"
        subtitle="Registro de vendas • Cálculo automático de comissões"
        icon={<ShoppingCart className="w-6 h-6 text-green-600" />}
        actions={
          <>
            <Button 
              variant="outline" 
              className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl h-11 px-6 hover:bg-white/90 transition-all duration-300" 
              onClick={limparCampos}
            >
              <Eraser className="w-4 h-4 mr-2" />
              Limpar Campos
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl h-11 px-6 font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={!isFormularioValido() || loading} 
              onClick={salvarVenda}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Venda
            </Button>
          </>
        }
      />

      <div className="relative z-10 p-6 space-y-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2">
            <FormularioVenda
              formData={formData}
              setFormData={setFormData}
              calcularValorLiquido={calcularValorLiquido}
              calcularPercentualDesconto={calcularPercentualDesconto}
              errosValidacao={errosValidacao}
            />
          </div>

          {/* Preview Lateral */}
          <div className="lg:col-span-1">
            <ResumoVenda
              formData={formData}
              calcularValorLiquido={calcularValorLiquido}
              isFormularioValido={isFormularioValido}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
