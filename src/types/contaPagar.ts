export interface ContaPagar {
  id?: number;
  
  // Relacionamentos
  fornecedor_id: number;
  plano_conta_id: number;
  banco_id?: number; // Se pago
  
  // Dados principais
  documento_referencia?: string;
  descricao: string;
  data_emissao?: string; // Data de emissão (padrão: hoje)
  data_vencimento: string;
  
  // Valores
  valor_original: number;
  percentual_juros?: number;
  valor_juros?: number;
  percentual_desconto?: number;
  valor_desconto?: number;
  valor_final: number; // calculado
  
  // Pagamento
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  data_pagamento?: string;
  valor_pago?: number;
  
  // Novos campos otimizados
  grupo_lancamento?: string; // Para identificar lotes
  parcela_atual: number; // Controle de parcelas
  total_parcelas: number; // Total de parcelas
  forma_pagamento: string; // Forma de pagamento obrigatória
  
  // Configurações
  dda: boolean;
  observacoes?: string;
  
  // Sistema
  user_id?: string; // UUID do usuário
  created_at?: string;
  updated_at?: string;
}

// Interface estendida com dados relacionados para performance
export interface ContaEnriquecida extends ContaPagar {
  fornecedor_nome: string;
  plano_conta_nome: string;
  banco_nome?: string;
  dias_para_vencimento: number;
  dias_em_atraso: number;
}

export interface FiltrosContaPagar {
  busca: string;
  status: 'todos' | 'pendente' | 'pago' | 'vencido' | 'cancelado';
  fornecedor_id: 'todos' | number;
  plano_conta_id: 'todos' | number;
  data_inicio: string;
  data_fim: string;
}

export const STATUS_CONTA_LABELS = {
  pendente: 'Pendente',
  pago: 'Pago',
  vencido: 'Vencido',
  cancelado: 'Cancelado'
};

export const STATUS_CONTA_COLORS = {
  pendente: 'bg-blue-100/80 text-blue-700',
  pago: 'bg-green-100/80 text-green-700',
  vencido: 'bg-red-100/80 text-red-700',
  cancelado: 'bg-gray-100/80 text-gray-700'
};