
import { useState } from 'react';
import { Cliente } from '@/types/cliente';
import { PlanoContas } from '@/types/planoContas';

interface FormData {
  dataVenda: string;
  horaVenda: string;
  cliente: Cliente | null;
  categoria: PlanoContas | null;
  tipoVenda: 'venda' | 'devolucao';
  valorBruto: string;
  descontoPercentual: string;
  descontoValor: string;
  formaPagamento: string;
  bancoId: number | null;
  parcelamento: number;
  documentoReferencia: string;
  observacoes: string;
  vendaAVista: boolean;
  enviarPorEmail: boolean;
}

export const useValidacaoVenda = () => {
  const [errosValidacao, setErrosValidacao] = useState<Record<string, string>>({});

  const validarFormulario = (formData: FormData): boolean => {
    const novosErros: Record<string, string> = {};

    // Validação da data
    if (!formData.dataVenda) {
      novosErros.dataVenda = 'Data da venda é obrigatória';
    } else {
      const dataVenda = new Date(formData.dataVenda);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      if (dataVenda > hoje) {
        novosErros.dataVenda = 'Data da venda não pode ser futura';
      }
    }

    // Validação da categoria
    if (!formData.categoria) {
      novosErros.categoria = 'Categoria é obrigatória';
    }

    // Validação do valor bruto
    if (!formData.valorBruto) {
      novosErros.valorBruto = 'Valor bruto é obrigatório';
    } else {
      const valor = converterMoedaParaNumero(formData.valorBruto);
      if (valor <= 0) {
        novosErros.valorBruto = 'Valor deve ser maior que zero';
      }
      if (valor > 999999.99) {
        novosErros.valorBruto = 'Valor não pode exceder R$ 999.999,99';
      }
    }

    // Validação da forma de pagamento
    if (!formData.formaPagamento) {
      novosErros.formaPagamento = 'Forma de pagamento é obrigatória';
    }

    // Validação de desconto
    if (formData.descontoValor) {
      const valorBruto = converterMoedaParaNumero(formData.valorBruto);
      const valorDesconto = converterMoedaParaNumero(formData.descontoValor);
      
      if (valorDesconto >= valorBruto) {
        novosErros.descontoValor = 'Desconto não pode ser maior ou igual ao valor bruto';
      }
    }

    setErrosValidacao(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const converterMoedaParaNumero = (valorMoeda: string): number => {
    if (!valorMoeda) return 0;
    const numero = valorMoeda
      .replace(/[R$\s.]/g, '')
      .replace(',', '.');
    return parseFloat(numero) || 0;
  };

  const limparErros = () => {
    setErrosValidacao({});
  };

  return {
    errosValidacao,
    validarFormulario,
    limparErros
  };
};
