// Tipos para contas pessoais
export interface ContaPessoal {
  id: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'paga' | 'vencida';
  credor_id?: number;
  categoria_id: number;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Dados relacionados (opcionais para joins)
  credor?: {
    id: number;
    nome: string;
    tipo: string;
  };
  categoria?: {
    id: number;
    nome: string;
    grupo: string;
    cor: string;
    icone: string;
  };
}

export interface ContaPessoalSupabase {
  id: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
  credor_id?: number;
  categoria_id: number;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  credores?: {
    id: number;
    nome: string;
    tipo: string;
  };
  categorias_despesas?: {
    id: number;
    nome: string;
    grupo: string;
    cor: string;
    icone: string;
  };
}

export interface FiltrosConta {
  status?: ContaPessoal['status'] | 'todos';
  categoria_id?: number;
  credor_id?: number;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  busca?: string;
  vencimento_proximo?: boolean; // próximos 7 dias
}

export interface EstatisticasContas {
  total_contas: number;
  total_valor: number;
  pendentes: number;
  valor_pendente: number;
  pagas: number;
  valor_pago: number;
  vencidas: number;
  valor_vencido: number;
  vencimento_proximo: number; // próximos 7 dias
  valor_vencimento_proximo: number;
}

export interface ResumoPorCategoria {
  categoria_id: number;
  categoria_nome: string;
  categoria_grupo: string;
  categoria_cor: string;
  categoria_icone: string;
  total_contas: number;
  total_valor: number;
  valor_pago: number;
  valor_pendente: number;
}

// Funções de conversão
export const contaPessoalToSupabase = (conta: ContaPessoal): Omit<ContaPessoalSupabase, 'credores' | 'categorias_despesas'> => ({
  id: conta.id,
  descricao: conta.descricao,
  valor: conta.valor,
  data_vencimento: conta.data_vencimento,
  data_pagamento: conta.data_pagamento,
  status: conta.status,
  credor_id: conta.credor_id,
  categoria_id: conta.categoria_id,
  observacoes: conta.observacoes,
  user_id: conta.user_id,
  created_at: conta.created_at,
  updated_at: conta.updated_at
});

export const supabaseToContaPessoal = (data: ContaPessoalSupabase): ContaPessoal => ({
  id: data.id,
  descricao: data.descricao,
  valor: data.valor,
  data_vencimento: data.data_vencimento,
  data_pagamento: data.data_pagamento,
  status: data.status as ContaPessoal['status'],
  credor_id: data.credor_id,
  categoria_id: data.categoria_id,
  observacoes: data.observacoes,
  user_id: data.user_id,
  created_at: data.created_at,
  updated_at: data.updated_at,
  credor: data.credores ? {
    id: data.credores.id,
    nome: data.credores.nome,
    tipo: data.credores.tipo
  } : undefined,
  categoria: data.categorias_despesas ? {
    id: data.categorias_despesas.id,
    nome: data.categorias_despesas.nome,
    grupo: data.categorias_despesas.grupo,
    cor: data.categorias_despesas.cor,
    icone: data.categorias_despesas.icone
  } : undefined
});