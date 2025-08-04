import { type VendaSupabase } from '@/types/venda';

export interface ValidacaoResult {
  valido: boolean;
  erros: string[];
  avisos: string[];
}

export class VendaValidationService {
  
  /**
   * Valida dados de venda antes da submissão
   */
  static validarVenda(venda: Partial<VendaSupabase>): ValidacaoResult {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Validações obrigatórias
    if (!venda.cliente_id) {
      erros.push('Cliente é obrigatório');
    }

    if (!venda.valor_total || venda.valor_total <= 0) {
      erros.push('Valor total deve ser maior que zero');
    }

    if (!venda.valor_final || venda.valor_final <= 0) {
      erros.push('Valor final deve ser maior que zero');
    }

    if (!venda.forma_pagamento) {
      erros.push('Forma de pagamento é obrigatória');
    }

    if (!venda.data_venda) {
      erros.push('Data da venda é obrigatória');
    }

    if (!venda.hora_venda) {
      erros.push('Hora da venda é obrigatória');
    }

    // Validações de valores
    if (venda.valor_total && venda.valor_final && venda.desconto) {
      const valorEsperado = venda.valor_total - venda.desconto;
      if (Math.abs(valorEsperado - venda.valor_final) > 0.01) {
        erros.push('Valor final não confere com valor total menos desconto');
      }
    }

    if (venda.desconto && venda.valor_total && venda.desconto > venda.valor_total) {
      erros.push('Desconto não pode ser maior que o valor total');
    }

    if (venda.desconto && venda.desconto < 0) {
      erros.push('Desconto não pode ser negativo');
    }

    // Validações de parcelas
    if (venda.parcelas && venda.parcelas < 1) {
      erros.push('Número de parcelas deve ser maior que zero');
    }

    if (venda.parcelas && venda.parcelas > 1) {
      const formasParceladas = ['cartao_credito', 'crediario', 'financiamento'];
      if (venda.forma_pagamento && !formasParceladas.includes(venda.forma_pagamento)) {
        avisos.push('Forma de pagamento pode não aceitar parcelamento');
      }
    }

    // Validações de comissão
    if (venda.comissao_percentual && (venda.comissao_percentual < 0 || venda.comissao_percentual > 100)) {
      erros.push('Percentual de comissão deve estar entre 0% e 100%');
    }

    if (venda.comissao_valor && venda.comissao_valor < 0) {
      erros.push('Valor da comissão não pode ser negativo');
    }

    if (venda.comissao_valor && venda.valor_final && venda.comissao_valor > venda.valor_final) {
      avisos.push('Valor da comissão é maior que o valor final da venda');
    }

    // Validações de data
    if (venda.data_venda) {
      const dataVenda = new Date(venda.data_venda);
      const hoje = new Date();
      const amanha = new Date(hoje);
      amanha.setDate(hoje.getDate() + 1);

      if (dataVenda > amanha) {
        erros.push('Data da venda não pode ser futura');
      }

      const umAnoAtras = new Date(hoje);
      umAnoAtras.setFullYear(hoje.getFullYear() - 1);

      if (dataVenda < umAnoAtras) {
        avisos.push('Data da venda é muito antiga (mais de 1 ano)');
      }
    }

    // Validações de vendedor
    if (venda.vendedor && venda.vendedor.trim().length < 2) {
      erros.push('Nome do vendedor deve ter pelo menos 2 caracteres');
    }

    // Validações de tipo de venda
    const tiposValidos = ['produto', 'servico', 'devolucao', 'desconto'];
    if (venda.tipo_venda && !tiposValidos.includes(venda.tipo_venda)) {
      erros.push('Tipo de venda inválido');
    }

    // Validações de status
    const statusValidos = ['ativa', 'cancelada', 'devolvida'];
    if (venda.status && !statusValidos.includes(venda.status)) {
      erros.push('Status da venda inválido');
    }

    // Validações específicas para devolução
    if (venda.tipo_venda === 'devolucao') {
      if (!venda.observacoes || venda.observacoes.trim().length < 10) {
        erros.push('Observações são obrigatórias para devoluções (mínimo 10 caracteres)');
      }
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  /**
   * Valida valor monetário
   */
  static validarValorMonetario(valor: number, nome: string = 'Valor'): string[] {
    const erros: string[] = [];

    if (isNaN(valor)) {
      erros.push(`${nome} deve ser um número válido`);
      return erros;
    }

    if (valor < 0) {
      erros.push(`${nome} não pode ser negativo`);
    }

    if (valor > 999999.99) {
      erros.push(`${nome} não pode ser maior que R$ 999.999,99`);
    }

    // Verificar se tem mais de 2 casas decimais
    if (Number.isFinite(valor) && (valor * 100) % 1 !== 0) {
      erros.push(`${nome} deve ter no máximo 2 casas decimais`);
    }

    return erros;
  }

  /**
   * Valida percentual
   */
  static validarPercentual(percentual: number, nome: string = 'Percentual'): string[] {
    const erros: string[] = [];

    if (isNaN(percentual)) {
      erros.push(`${nome} deve ser um número válido`);
      return erros;
    }

    if (percentual < 0) {
      erros.push(`${nome} não pode ser negativo`);
    }

    if (percentual > 100) {
      erros.push(`${nome} não pode ser maior que 100%`);
    }

    return erros;
  }

  /**
   * Valida documento (CPF/CNPJ)
   */
  static validarDocumento(documento: string): ValidacaoResult {
    const erros: string[] = [];
    const avisos: string[] = [];

    if (!documento || documento.trim().length === 0) {
      erros.push('Documento é obrigatório');
      return { valido: false, erros, avisos };
    }

    // Remover caracteres especiais
    const doc = documento.replace(/[^\d]/g, '');

    if (doc.length === 11) {
      // Validação de CPF simplificada
      if (!/^\d{11}$/.test(doc)) {
        erros.push('CPF deve conter apenas números');
      } else if (doc === '00000000000' || doc === '11111111111') {
        erros.push('CPF inválido');
      }
    } else if (doc.length === 14) {
      // Validação de CNPJ simplificada
      if (!/^\d{14}$/.test(doc)) {
        erros.push('CNPJ deve conter apenas números');
      } else if (doc === '00000000000000') {
        erros.push('CNPJ inválido');
      }
    } else {
      erros.push('Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  /**
   * Valida dados antes da duplicação
   */
  static validarDuplicacao(venda: VendaSupabase): ValidacaoResult {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Verificar se não é uma devolução ou cancelamento
    if (venda.status === 'cancelada') {
      erros.push('Não é possível duplicar uma venda cancelada');
    }

    if (venda.tipo_venda === 'devolucao') {
      erros.push('Não é possível duplicar uma devolução');
    }

    // Avisos para vendas antigas
    if (venda.data_venda) {
      const dataVenda = new Date(venda.data_venda);
      const hoje = new Date();
      const diasAtras = Math.floor((hoje.getTime() - dataVenda.getTime()) / (1000 * 60 * 60 * 24));

      if (diasAtras > 30) {
        avisos.push('Você está duplicando uma venda de mais de 30 dias atrás');
      }
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  /**
   * Valida dados para relatório
   */
  static validarRelatorio(dataInicio: string, dataFim: string): ValidacaoResult {
    const erros: string[] = [];
    const avisos: string[] = [];

    if (!dataInicio) {
      erros.push('Data inicial é obrigatória');
    }

    if (!dataFim) {
      erros.push('Data final é obrigatória');
    }

    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);

      if (inicio > fim) {
        erros.push('Data inicial não pode ser maior que a data final');
      }

      const diasDiferenca = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));

      if (diasDiferenca > 365) {
        avisos.push('Período muito longo (mais de 1 ano). O relatório pode demorar para carregar.');
      }

      if (diasDiferenca < 1) {
        avisos.push('Período muito curto (menos de 1 dia)');
      }
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }
}