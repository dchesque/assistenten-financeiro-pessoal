export interface Vendedor {
  id: number;
  
  // Dados Pessoais
  nome: string;
  documento: string;
  tipo_documento: 'CPF' | 'CNPJ';
  email?: string;
  telefone?: string;
  whatsapp?: string;
  data_nascimento?: string;
  
  // Dados Profissionais
  codigo_vendedor: string;
  data_admissao: string;
  data_demissao?: string;
  cargo: string;
  departamento: string;
  
  // Sistema de Comissão
  tipo_comissao: 'percentual' | 'valor_fixo' | 'hibrido';
  percentual_comissao: number;
  valor_fixo_comissao: number;
  meta_mensal: number;
  
  // Controles de Acesso
  pode_dar_desconto: boolean;
  desconto_maximo: number;
  acesso_sistema: boolean;
  nivel_acesso: 'vendedor' | 'supervisor' | 'gerente';
  
  // Endereço
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  
  // Estatísticas Calculadas
  total_vendas: number;
  valor_total_vendido: number;
  comissao_total_recebida: number;
  ticket_medio: number;
  melhor_mes_vendas: number;
  data_ultima_venda?: string;
  ranking_atual: number;
  
  // Status e Auditoria
  status: 'ativo' | 'inativo' | 'afastado' | 'demitido';
  foto_url?: string;
  observacoes?: string;
  ativo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface NovoVendedor {
  nome: string;
  documento: string;
  tipo_documento: 'CPF' | 'CNPJ';
  email?: string;
  telefone?: string;
  whatsapp?: string;
  data_nascimento?: string;
  codigo_vendedor: string;
  data_admissao: string;
  cargo: string;
  departamento: string;
  tipo_comissao: 'percentual' | 'valor_fixo' | 'hibrido';
  percentual_comissao: number;
  valor_fixo_comissao: number;
  meta_mensal: number;
  pode_dar_desconto: boolean;
  desconto_maximo: number;
  acesso_sistema: boolean;
  nivel_acesso: 'vendedor' | 'supervisor' | 'gerente';
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  status: 'ativo' | 'inativo' | 'afastado' | 'demitido';
  observacoes?: string;
}

export interface FiltrosVendedor {
  busca: string;
  status: 'todos' | 'ativo' | 'inativo' | 'afastado' | 'demitido';
  nivel_acesso: 'todos' | 'vendedor' | 'supervisor' | 'gerente';
  departamento: string;
  data_admissao_inicio?: string;
  data_admissao_fim?: string;
}

export interface ResumoVendedores {
  total_vendedores: number;
  vendedores_ativos: number;
  total_vendido: number;
  total_comissoes: number;
  ticket_medio_geral: number;
  melhor_vendedor: string;
}

export interface PerformanceVendedor {
  vendedor_nome: string;
  periodo: string;
  total_vendas: number;
  valor_total: number;
  meta_periodo: number;
  percentual_meta: number;
  comissao_periodo: number;
  ticket_medio: number;
  ranking_posicao: number;
  vendas_por_dia: Array<{
    data: string;
    vendas: number;
    valor: number;
  }>;
}

export interface RankingVendedor {
  vendedor_id: number;
  vendedor_nome: string;
  codigo_vendedor: string;
  total_vendas: number;
  valor_vendido: number;
  meta_mensal: number;
  percentual_meta: number;
  ranking_posicao: number;
  foto_url?: string;
}

export const STATUS_VENDEDOR = [
  { valor: 'ativo', nome: 'Ativo', cor: 'green' },
  { valor: 'inativo', nome: 'Inativo', cor: 'red' },
  { valor: 'afastado', nome: 'Afastado', cor: 'yellow' },
  { valor: 'demitido', nome: 'Demitido', cor: 'gray' }
];

export const NIVEIS_ACESSO = [
  { valor: 'vendedor', nome: 'Vendedor' },
  { valor: 'supervisor', nome: 'Supervisor' },
  { valor: 'gerente', nome: 'Gerente' }
];

export const TIPOS_COMISSAO = [
  { valor: 'percentual', nome: 'Percentual sobre vendas' },
  { valor: 'valor_fixo', nome: 'Valor fixo mensal' },
  { valor: 'hibrido', nome: 'Híbrido (fixo + percentual)' }
];