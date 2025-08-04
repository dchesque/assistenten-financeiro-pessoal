
export interface Cliente {
  id: number;
  nome: string;
  documento: string;
  tipo: 'PF' | 'PJ';
  rg_ie?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  observacoes?: string;
  receberPromocoes: boolean;
  whatsappMarketing: boolean;
  totalCompras: number;
  valorTotalCompras: number;
  ticketMedio: number;
  dataUltimaCompra?: string;
  createdAt: string;
  updatedAt: string;
  ativo: boolean;
}

// Interface para criação (Supabase preparado)
export interface ClienteInsert {
  nome: string;
  documento: string;
  tipo: 'PF' | 'PJ';
  rg_ie?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status?: 'ativo' | 'inativo' | 'bloqueado';
  observacoes?: string;
  receber_promocoes?: boolean;
  whatsapp_marketing?: boolean;
  ativo?: boolean;
  user_id: string;
  total_compras?: number;
  valor_total_compras?: number;
  ticket_medio?: number;
  data_ultima_compra?: string;
}

// Interface para atualização (Supabase preparado)
export interface ClienteUpdate {
  nome?: string;
  documento?: string;
  tipo?: 'PF' | 'PJ';
  rg_ie?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status?: 'ativo' | 'inativo' | 'bloqueado';
  observacoes?: string;
  receber_promocoes?: boolean;
  whatsapp_marketing?: boolean;
  ativo?: boolean;
  updated_at?: string;
}

// Interface para Supabase (snake_case)
export interface ClienteSupabase {
  id: number;
  nome: string;
  documento: string;
  tipo: 'PF' | 'PJ';
  rg_ie?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  observacoes?: string;
  receber_promocoes: boolean;
  whatsapp_marketing: boolean;
  total_compras: number;
  valor_total_compras: number;
  ticket_medio: number;
  data_ultima_compra?: string;
  created_at: string;
  updated_at: string;
  ativo: boolean;
}

export interface ClientesFiltros {
  busca: string;
  status: 'todos' | 'ativo' | 'inativo' | 'bloqueado';
  tipo: 'todos' | 'PF' | 'PJ';
  ultimaCompra: 'todos' | '30dias' | '90dias' | '180dias' | '1ano';
  cidade: string;
  estado: string;
  faixaTicket: 'todos' | 'baixo' | 'medio' | 'alto';
  totalCompras: 'todos' | '0-5' | '6-15' | '16-30' | '30+';
  receberPromocoes: 'todos' | 'sim' | 'nao';
  whatsappMarketing: 'todos' | 'sim' | 'nao';
}

export interface ClientesEstatisticas {
  totalClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  tempoMedioRetorno: number;
  ticketMedio: number;
  faturamentoTotal: number;
  crescimentoMensal: number;
  percentualAtivos: number;
  variacaoTicket: number;
  metaMensal: number;
}

// Funções de conversão para Supabase
export const clienteToSupabase = (cliente: Cliente): ClienteSupabase => ({
  id: cliente.id,
  nome: cliente.nome,
  documento: cliente.documento,
  tipo: cliente.tipo,
  rg_ie: cliente.rg_ie,
  telefone: cliente.telefone,
  whatsapp: cliente.whatsapp,
  email: cliente.email,
  cep: cliente.cep,
  logradouro: cliente.logradouro,
  numero: cliente.numero,
  complemento: cliente.complemento,
  bairro: cliente.bairro,
  cidade: cliente.cidade,
  estado: cliente.estado,
  status: cliente.status,
  observacoes: cliente.observacoes,
  receber_promocoes: cliente.receberPromocoes,
  whatsapp_marketing: cliente.whatsappMarketing,
  total_compras: cliente.totalCompras,
  valor_total_compras: cliente.valorTotalCompras,
  ticket_medio: cliente.ticketMedio,
  data_ultima_compra: cliente.dataUltimaCompra,
  created_at: cliente.createdAt,
  updated_at: cliente.updatedAt,
  ativo: cliente.ativo
});

export const supabaseToCliente = (cliente: ClienteSupabase): Cliente => ({
  id: cliente.id,
  nome: cliente.nome,
  documento: cliente.documento,
  tipo: cliente.tipo,
  rg_ie: cliente.rg_ie,
  telefone: cliente.telefone,
  whatsapp: cliente.whatsapp,
  email: cliente.email,
  cep: cliente.cep,
  logradouro: cliente.logradouro,
  numero: cliente.numero,
  complemento: cliente.complemento,
  bairro: cliente.bairro,
  cidade: cliente.cidade,
  estado: cliente.estado,
  status: cliente.status,
  observacoes: cliente.observacoes,
  receberPromocoes: cliente.receber_promocoes,
  whatsappMarketing: cliente.whatsapp_marketing,
  totalCompras: cliente.total_compras,
  valorTotalCompras: cliente.valor_total_compras,
  ticketMedio: cliente.ticket_medio,
  dataUltimaCompra: cliente.data_ultima_compra,
  createdAt: cliente.created_at,
  updatedAt: cliente.updated_at,
  ativo: cliente.ativo
});
