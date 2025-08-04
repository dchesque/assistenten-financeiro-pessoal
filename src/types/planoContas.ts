export interface PlanoContas {
  id: number;
  codigo: string; // Ex: "3.2.1.001"
  nome: string;
  descricao?: string;
  cor: string;
  icone: string;
  plano_pai_id?: number; // Hierarquia
  plano_pai?: PlanoContas; // Relação com conta pai
  nivel: number; // 1=principal, 2=sub, 3=sub-sub
  tipo_dre: 'receita' | 'deducao_receita' | 'custo' | 'despesa_administrativa' | 'despesa_comercial' | 'despesa_financeira';
  aceita_lancamento: boolean; // Se pode receber lançamentos diretos
  ativo: boolean;
  total_contas: number; // Calculado
  valor_total: number; // Calculado
  created_at: string;
  updated_at: string;
}

// Interface para Supabase (snake_case)
export interface PlanoContasSupabase {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone: string;
  plano_pai_id?: number;
  nivel: number;
  tipo_dre: 'receita' | 'deducao_receita' | 'custo' | 'despesa_administrativa' | 'despesa_comercial' | 'despesa_financeira';
  aceita_lancamento: boolean;
  total_contas: number;
  valor_total: number;
  created_at: string;
  updated_at: string;
  ativo: boolean;
}

export interface FiltrosPlanoContas {
  busca: string;
  status: 'todos' | 'ativo' | 'inativo';
  tipo_dre: 'todos' | 'receita' | 'deducao_receita' | 'custo' | 'despesa_administrativa' | 'despesa_comercial' | 'despesa_financeira';
  aceita_lancamento: 'todos' | 'sim' | 'nao';
  nivel: 'todos' | '1' | '2' | '3';
}

export const TIPOS_DRE = [
  { valor: 'receita', nome: 'Receita', cor: '#10B981' },
  { valor: 'deducao_receita', nome: 'Dedução da Receita', cor: '#EF4444' },
  { valor: 'custo', nome: 'Custo dos Produtos Vendidos', cor: '#3B82F6' },
  { valor: 'despesa_administrativa', nome: 'Despesa Administrativa', cor: '#8B5CF6' },
  { valor: 'despesa_comercial', nome: 'Despesa Comercial', cor: '#EC4899' },
  { valor: 'despesa_financeira', nome: 'Despesa Financeira', cor: '#F59E0B' }
];

export const CORES_PLANO_CONTAS = [
  { nome: 'Azul', valor: '#3B82F6', bg: 'bg-blue-500' },
  { nome: 'Verde', valor: '#10B981', bg: 'bg-green-500' },
  { nome: 'Roxo', valor: '#8B5CF6', bg: 'bg-purple-500' },
  { nome: 'Rosa', valor: '#EC4899', bg: 'bg-pink-500' },
  { nome: 'Laranja', valor: '#F59E0B', bg: 'bg-orange-500' },
  { nome: 'Vermelho', valor: '#EF4444', bg: 'bg-red-500' },
  { nome: 'Turquesa', valor: '#06B6D4', bg: 'bg-cyan-500' },
  { nome: 'Indigo', valor: '#6366F1', bg: 'bg-indigo-500' }
];

export const ICONES_PLANO_CONTAS = [
  { nome: 'Material', icone: 'Package' },
  { nome: 'Serviços', icone: 'Wrench' },
  { nome: 'Aluguel', icone: 'Home' },
  { nome: 'Energia', icone: 'Zap' },
  { nome: 'Telefone', icone: 'Phone' },
  { nome: 'Internet', icone: 'Wifi' },
  { nome: 'Transporte', icone: 'Truck' },
  { nome: 'Marketing', icone: 'Megaphone' },
  { nome: 'Escritório', icone: 'Building' },
  { nome: 'Equipamentos', icone: 'Monitor' },
  { nome: 'Alimentação', icone: 'Coffee' },
  { nome: 'Limpeza', icone: 'Sparkles' },
  { nome: 'Segurança', icone: 'Shield' },
  { nome: 'Jurídico', icone: 'Scale' },
  { nome: 'Contabilidade', icone: 'Calculator' },
  { nome: 'Produção', icone: 'Factory' },
  { nome: 'Pessoas', icone: 'Users' },
  { nome: 'Financeiro', icone: 'CreditCard' },
  { nome: 'Outros', icone: 'MoreHorizontal' }
];

// Funções de conversão entre formatos
export const planoContasToSupabase = (plano: PlanoContas): PlanoContasSupabase => {
  return {
    id: plano.id,
    codigo: plano.codigo,
    nome: plano.nome,
    descricao: plano.descricao,
    cor: plano.cor,
    icone: plano.icone,
    plano_pai_id: plano.plano_pai_id,
    nivel: plano.nivel,
    tipo_dre: plano.tipo_dre,
    aceita_lancamento: plano.aceita_lancamento,
    total_contas: plano.total_contas,
    valor_total: plano.valor_total,
    created_at: plano.created_at,
    updated_at: plano.updated_at,
    ativo: plano.ativo
  };
};

export const supabaseToPlanoContas = (data: PlanoContasSupabase): PlanoContas => {
  return {
    id: data.id,
    codigo: data.codigo,
    nome: data.nome,
    descricao: data.descricao,
    cor: data.cor,
    icone: data.icone,
    plano_pai_id: data.plano_pai_id,
    nivel: data.nivel,
    tipo_dre: data.tipo_dre,
    aceita_lancamento: data.aceita_lancamento,
    total_contas: data.total_contas,
    valor_total: data.valor_total,
    created_at: data.created_at,
    updated_at: data.updated_at,
    ativo: data.ativo
  };
};