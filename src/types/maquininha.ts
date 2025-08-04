export interface Maquininha {
  id: string;
  nome: string; // "Rede - Loja Principal"
  operadora: 'rede' | 'sipag';
  codigo_estabelecimento: string; // EC da Rede ou Merchant ID Sipag
  banco_id: number; // Vinculado ao módulo Bancos
  banco_nome: string;
  ativo: boolean;
  taxas: TaxaMaquininha[];
  created_at: Date;
  updated_at: Date;
}

export interface TaxaMaquininha {
  id: string;
  maquininha_id: string;
  bandeira: 'visa' | 'mastercard' | 'elo' | 'hipercard' | 'american_express';
  tipo_transacao: 'debito' | 'credito_vista' | 'credito_parcelado';
  parcelas_max?: number; // Para crédito parcelado
  taxa_percentual: number; // Ex: 3.99
  taxa_fixa?: number; // Taxa fixa em R$ (se houver)
  ativo: boolean;
}

export interface ProcessamentoExtrato {
  id: string;
  periodo: string; // "2025-01"
  maquininha_id: string;
  arquivo_vendas: {
    nome: string;
    tipo: 'csv' | 'xlsx';
    processado_em: Date;
    total_registros: number;
  };
  arquivo_bancario: {
    nome: string;
    tipo: 'ofx' | 'csv';
    processado_em: Date;
    total_registros: number;
  };
  status: 'processando' | 'conciliado' | 'divergencias' | 'erro';
  divergencias: number;
  conciliado_automaticamente: number;
}

export interface VendaMaquininha {
  id: string;
  maquininha_id: string;
  nsu: string; // Número sequencial único
  data_venda: Date;
  data_recebimento: Date;
  valor_bruto: number;
  valor_taxa: number;
  valor_liquido: number;
  taxa_percentual_cobrada: number; // Para comparar com contratada
  bandeira: string;
  tipo_transacao: string;
  parcelas: number;
  status: 'pendente' | 'recebido' | 'cancelado';
  periodo_processamento: string; // "2025-01"
}

export interface RecebimentoBancario {
  id: string;
  banco_id: number;
  data_recebimento: Date;
  valor: number;
  descricao: string; // "REDE S.A." ou "SIPAG"
  tipo_operacao: string;
  documento: string;
  periodo_processamento: string;
  status: 'pendente_conciliacao' | 'conciliado' | 'divergencia';
}

export interface ConciliacaoMaquininha {
  id: string;
  periodo: string; // "2025-01"
  maquininha_id: string;
  data_conciliacao: Date;
  total_vendas: number;
  total_recebimentos: number;
  total_taxas: number;
  status: 'ok' | 'divergencia';
  observacoes?: string;
  detalhes_diarios: DetalheConciliacao[];
}

export interface DetalheConciliacao {
  data: Date;
  vendas_valor: number;
  vendas_quantidade: number;
  recebimento_valor: number;
  recebimento_quantidade: number;
  diferenca: number;
  status: 'ok' | 'divergencia';
  motivo_divergencia?: string;
}

export interface TaxasOperadora {
  operadora: 'rede' | 'sipag';
  nome: string;
  totalTransacoes: number;
  totalTaxas: number;
  fornecedor_id: number;
  bancoVinculado: number;
}

export const OPERADORAS = {
  rede: 'Rede',
  sipag: 'Sipag'
} as const;

export const BANDEIRAS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  elo: 'Elo',
  hipercard: 'Hipercard',
  american_express: 'American Express'
} as const;

export const TIPOS_TRANSACAO = {
  debito: 'Débito',
  credito_vista: 'Crédito à Vista',
  credito_parcelado: 'Crédito Parcelado'
} as const;

export const STATUS_CONCILIACAO_COLORS = {
  ok: 'bg-green-100/80 text-green-700',
  divergencia: 'bg-red-100/80 text-red-700',
  processando: 'bg-blue-100/80 text-blue-700',
  conciliado: 'bg-green-100/80 text-green-700',
  erro: 'bg-red-100/80 text-red-700'
};

export const STATUS_CONCILIACAO_LABELS = {
  ok: 'Conciliado',
  divergencia: 'Divergência',
  processando: 'Processando',
  conciliado: 'Conciliado',
  erro: 'Erro'
};