// Tipos para credores pessoais
export interface CredorPessoal {
  id: number;
  nome: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  documento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  ativo: boolean;
  // Estatísticas calculadas
  total_contas?: number;
  valor_total?: number;
  ultima_conta?: string;
}

export interface CredorPessoalSupabase {
  id: number;
  nome: string;
  tipo: string;
  documento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  ativo: boolean;
  total_contas?: number;
  valor_total?: number;
  ultima_conta?: string;
}

export interface FiltrosCredor {
  tipo?: 'pessoa_fisica' | 'pessoa_juridica';
  ativo?: boolean;
  busca?: string;
  estado?: string;
}

// Estados do Brasil para seleção
export const ESTADOS_BRASIL = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

// Funções de conversão
export const credorPessoalToSupabase = (credor: CredorPessoal): CredorPessoalSupabase => ({
  id: credor.id,
  nome: credor.nome,
  tipo: credor.tipo,
  documento: credor.documento,
  email: credor.email,
  telefone: credor.telefone,
  endereco: credor.endereco,
  cidade: credor.cidade,
  estado: credor.estado,
  cep: credor.cep,
  observacoes: credor.observacoes,
  user_id: credor.user_id,
  created_at: credor.created_at,
  updated_at: credor.updated_at,
  ativo: credor.ativo,
  total_contas: credor.total_contas,
  valor_total: credor.valor_total,
  ultima_conta: credor.ultima_conta
});

export const supabaseToCredorPessoal = (data: CredorPessoalSupabase): CredorPessoal => ({
  id: data.id,
  nome: data.nome,
  tipo: data.tipo as CredorPessoal['tipo'],
  documento: data.documento,
  email: data.email,
  telefone: data.telefone,
  endereco: data.endereco,
  cidade: data.cidade,
  estado: data.estado,
  cep: data.cep,
  observacoes: data.observacoes,
  user_id: data.user_id,
  created_at: data.created_at,
  updated_at: data.updated_at,
  ativo: data.ativo,
  total_contas: data.total_contas,
  valor_total: data.valor_total,
  ultima_conta: data.ultima_conta
});