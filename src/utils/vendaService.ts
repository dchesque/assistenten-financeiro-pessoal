// Funções utilitárias para persistência e estado
import { Venda, NovaVenda } from '@/types/venda';

export class VendaService {
  private static STORAGE_KEY = 'jc_financeiro_vendas';

  // Simular operações de banco de dados
  static async salvarVenda(venda: NovaVenda): Promise<Venda> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const novaVenda: Venda = {
      ...venda,
      id: Date.now(), // Simular ID auto-incremento
      valor_liquido: venda.valor_bruto - venda.desconto_valor,
      cliente_nome: venda.cliente_id ? `Cliente ${venda.cliente_id}` : 'VAREJO',
      categoria_nome: `Categoria ${venda.categoria_id}`,
      categoria_codigo: `CAT${venda.categoria_id}`,
      categoria_cor: '#3B82F6',
      forma_pagamento: venda.forma_pagamento as any, // Garantir compatibilidade de tipos
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Simular validação no servidor
    if (novaVenda.valor_bruto <= 0) {
      throw new Error('Valor bruto deve ser maior que zero');
    }

    if (novaVenda.desconto_valor > novaVenda.valor_bruto) {
      throw new Error('Desconto não pode ser maior que o valor bruto');
    }

    return novaVenda;
  }

  static async atualizarVenda(id: number, dadosAtualizados: Partial<Venda>): Promise<Venda> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Simular busca no banco
    const vendaExistente = await this.buscarVendaPorId(id);
    if (!vendaExistente) {
      throw new Error('Venda não encontrada');
    }

    const vendaAtualizada: Venda = {
      ...vendaExistente,
      ...dadosAtualizados,
      updated_at: new Date().toISOString()
    };

    return vendaAtualizada;
  }

  static async buscarVendaPorId(id: number): Promise<Venda | null> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Aqui seria uma consulta real ao banco
    // Por enquanto, retorna null para simular
    return null;
  }

  static async excluirVenda(id: number): Promise<boolean> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simular verificação de permissões
    // Não permitir exclusão de vendas antigas (mais de 30 dias)
    return true;
  }

  static validarDadosVenda(venda: NovaVenda | Partial<Venda>): string[] {
    const erros: string[] = [];

    if (!venda.categoria_id) {
      erros.push('Categoria é obrigatória');
    }

    if (!venda.data_venda) {
      erros.push('Data da venda é obrigatória');
    }

    if (!venda.hora_venda) {
      erros.push('Hora da venda é obrigatória');
    }

    if (!venda.valor_bruto || venda.valor_bruto <= 0) {
      erros.push('Valor bruto deve ser maior que zero');
    }

    if (!venda.forma_pagamento) {
      erros.push('Forma de pagamento é obrigatória');
    }

    if (venda.desconto_percentual && (venda.desconto_percentual < 0 || venda.desconto_percentual > 100)) {
      erros.push('Desconto percentual deve estar entre 0% e 100%');
    }

    if (venda.desconto_valor && venda.valor_bruto && venda.desconto_valor > venda.valor_bruto) {
      erros.push('Desconto não pode ser maior que o valor bruto');
    }

    return erros;
  }

  static calcularValorLiquido(valorBruto: number, descontoValor: number): number {
    return Math.max(0, valorBruto - descontoValor);
  }

  static calcularDescontoPercentual(valorBruto: number, descontoValor: number): number {
    if (valorBruto === 0) return 0;
    return Math.round((descontoValor / valorBruto) * 100 * 100) / 100; // 2 casas decimais
  }

  static calcularDescontoValor(valorBruto: number, descontoPercentual: number): number {
    return Math.round(valorBruto * (descontoPercentual / 100) * 100) / 100; // 2 casas decimais
  }
}