export type TipoPagamento = 'dinheiro_pix' | 'transferencia' | 'cheque' | 'cartao';

export interface FormaPagamento {
  tipo: TipoPagamento;
  banco_id?: number;
  numero_cheque?: string;
  numeros_cheques?: string[];
  tipo_cartao?: 'debito' | 'credito';
}

export interface ChequeParaCriacao {
  numero_cheque: string;
  banco_id: number;
  tipo_beneficiario: 'fornecedor' | 'pessoa_fisica';
  fornecedor_id?: number;
  beneficiario_nome?: string;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  finalidade: string;
  observacoes?: string;
  status: 'pendente';
  conta_vinculada_id?: number;
  criado_automaticamente: boolean;
}

export const TIPOS_PAGAMENTO_LABELS = {
  dinheiro_pix: 'Dinheiro/PIX',
  transferencia: 'Transferência/TED',
  cheque: 'Cheque',
  cartao: 'Cartão'
} as const;

export const TIPOS_PAGAMENTO_ICONS = {
  dinheiro_pix: '💰',
  transferencia: '🏦',
  cheque: '📋',
  cartao: '💳'
} as const;