export interface Venda {
  id: number;
  data_venda: string; // YYYY-MM-DD
  hora_venda: string; // HH:mm
  cliente_id?: number; // nullable para VAREJO
  cliente_nome: string; // Para exibição
  cliente_documento?: string;
  vendedor_id?: number; // FK para vendedores
  vendedor?: string; // Nome do vendedor para compatibilidade
  categoria_id: number; // FK para plano_contas
  categoria_nome: string;
  categoria_codigo: string;
  categoria_cor: string;
  valor_bruto: number;
  desconto_percentual: number;
  desconto_valor: number;
  valor_liquido: number;
  forma_pagamento: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'boleto' | 'transferencia';
  banco_id?: number;
  banco_nome?: string;
  tipo_venda: 'venda' | 'devolucao' | 'desconto';
  documento_referencia?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface NovaVenda {
  data_venda: string;
  hora_venda: string;
  cliente_id?: number;
  categoria_id: number;
  valor_bruto: number;
  desconto_percentual: number;
  desconto_valor: number;
  forma_pagamento: string;
  banco_id?: number;
  tipo_venda: 'venda' | 'devolucao' | 'desconto';
  documento_referencia?: string;
  observacoes?: string;
  venda_a_vista: boolean;
  enviar_por_email: boolean;
}

export interface FiltrosVenda {
  busca: string;
  cliente_id: string; // 'todos' ou ID do cliente
  tipo_venda: 'todos' | 'venda' | 'devolucao' | 'desconto';
  forma_pagamento: string; // 'todos' ou forma específica
  data_inicio: string;
  data_fim: string;
}

export interface EstatisticasVendas {
  faturamento_mensal: number;
  faturamento_crescimento: number;
  vendas_realizadas: number;
  vendas_por_dia: number;
  ticket_medio: number;
  ticket_crescimento: number;
  devolucoes_valor: number;
  devolucoes_percentual: number;
  totalVendas: number;
  valorTotal: number;
  ticketMedio: number;
  crescimentoMensal: number;
  melhor_forma_pagamento: string;
  crescimento_vendas: number;
  meta_mensal: number;
}

// Interfaces da Fase 2
export interface VendaCompleta {
  id: number;
  data_venda: string;
  hora_venda: string;
  cliente_id: number;
  cliente_nome: string;
  cliente_documento: string;
  cliente_tipo: string;
  vendedor_id?: number;
  vendedor?: string;
  valor_total: number;
  desconto?: number;
  valor_final: number;
  forma_pagamento: string;
  parcelas?: number;
  tipo_venda: string;
  comissao_percentual?: number;
  comissao_valor?: number;
  status: string;
  observacoes?: string;
  plano_conta_id?: number;
  categoria_nome?: string;
  categoria_codigo?: string;
  tipo_dre?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  ano_venda: number;
  mes_venda: number;
  valor_liquido: number;
  periodo_venda: string;
}

export interface VendaSupabase {
  id: number;
  data_venda: string;
  hora_venda: string;
  cliente_id: number;
  vendedor_id?: number;
  vendedor?: string;
  valor_total: number;
  desconto?: number;
  valor_final: number;
  forma_pagamento: string;
  parcelas?: number;
  tipo_venda: string;
  comissao_percentual?: number;
  comissao_valor?: number;
  status: string;
  observacoes?: string;
  plano_conta_id?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FiltrosVendaAvancados {
  busca: string;
  clienteId?: number;
  vendedor: string;
  formaPagamento: string;
  tipoVenda: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  categoriaId?: number;
  valorMinimo?: number;
  valorMaximo?: number;
  ordenacao: 'data_desc' | 'data_asc' | 'valor_desc' | 'valor_asc' | 'cliente';
  pagina: number;
  itensPorPagina: number;
}

export interface EstatisticasVendasCompletas {
  totalVendas: number;
  receitaBruta: number;
  receitaLiquida: number;
  receitaMensal: number;
  crescimentoMensal: number;
  ticketMedio: number;
  totalDevolucoes: number;
  totalDescontos: number;
  totalComissoes: number;
  topVendedor: string;
  vendasPorFormaPagamento: Record<string, { quantidade: number; valor: number }>;
  vendasPorCategoria: Record<string, { quantidade: number; valor: number }>;
  vendasHoje: number;
  metaVendasDiaria: number;
  desempenhoMeta: number;
}

export interface RelatorioVendasPeriodo {
  totalVendas: number;
  valorBruto: number;
  valorDescontos: number;
  valorLiquido: number;
  totalComissoes: number;
  ticketMedio: number;
  vendasPorFormaPagamento: Array<{ forma_pagamento: string; quantidade: number; valor_total: number }>;
  vendasPorCategoria: Array<{ categoria: string; quantidade: number; valor_total: number }>;
  vendasPorVendedor: Array<{ vendedor: string; quantidade: number; valor_total: number; comissao_total: number }>;
  evolucaoDiaria: Array<{ data: string; quantidade: number; valor_total: number }>;
}

export const FORMAS_PAGAMENTO = [
  { valor: 'pix', nome: 'PIX', icone: 'QrCode', cor: '#10B981' },
  { valor: 'cartao_credito', nome: 'Cartão de Crédito', icone: 'CreditCard', cor: '#3B82F6' },
  { valor: 'cartao_debito', nome: 'Cartão de Débito', icone: 'CreditCard', cor: '#8B5CF6' },
  { valor: 'dinheiro', nome: 'Dinheiro', icone: 'Banknote', cor: '#10B981' },
  { valor: 'boleto', nome: 'Boleto Bancário', icone: 'FileText', cor: '#F59E0B' },
  { valor: 'transferencia', nome: 'Transferência', icone: 'ArrowRightLeft', cor: '#06B6D4' }
];

export const TIPOS_VENDA = [
  { valor: 'venda', nome: 'Venda', cor: '#10B981' },
  { valor: 'devolucao', nome: 'Devolução', cor: '#EF4444' },
  { valor: 'desconto', nome: 'Desconto', cor: '#F59E0B' }
];