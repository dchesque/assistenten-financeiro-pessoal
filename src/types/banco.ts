export interface Banco {
  id: number;
  nome: string;
  codigo_banco: string; // obrigatório para OFX
  agencia: string;
  conta: string;
  digito_verificador: string;
  tipo_conta: 'conta_corrente' | 'poupanca' | 'conta_salario';
  
  // Financeiro
  saldo_inicial: number;
  saldo_atual: number; // calculado
  limite?: number;
  limite_usado: number; // calculado
  
  // OFX
  suporta_ofx: boolean;
  url_ofx?: string;
  ultimo_fitid?: string;
  data_ultima_sincronizacao?: string;
  
  // Contato
  gerente?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  
  // Sistema
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MovimentacaoBancaria {
  id: number;
  banco_id: number;
  fitid?: string; // ID único do OFX
  data_transacao: string;
  data_processamento: string;
  tipo: 'debito' | 'credito';
  valor: number;
  descricao: string;
  categoria_automatica?: string;
  conta_pagar_id?: number; // vinculação com conta a pagar
  origem: 'manual' | 'ofx';
  status_conciliacao: 'conciliado' | 'pendente' | 'divergente';
  created_at: string;
}

export interface MovimentacaoOFX {
  id: number;
  banco_id: number;
  fitid: string; // ID único do OFX
  data_transacao: string;
  data_processamento: string;
  tipo: 'debito' | 'credito';
  valor: number;
  descricao_original: string; // Do OFX
  descricao_limpa: string; // Processada
  status_processamento: 'pendente' | 'vinculado' | 'conta_criada' | 'ignorado';
  conta_pagar_id?: number; // Se vinculou/criou conta
  observacoes?: string;
  created_at: string;
}

export const TIPO_CONTA_LABELS = {
  conta_corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  conta_salario: 'Conta Salário'
};

export const STATUS_CONCILIACAO_LABELS = {
  conciliado: 'Conciliado',
  pendente: 'Pendente',
  divergente: 'Divergente'
};

export const STATUS_PROCESSAMENTO_LABELS = {
  pendente: 'Pendente',
  vinculado: 'Vinculado',
  conta_criada: 'Conta Criada',
  ignorado: 'Ignorado'
};