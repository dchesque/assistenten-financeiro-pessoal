export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  group_name?: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategory {
  name: string;
  type: 'income' | 'expense';
  group_name?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategory extends Partial<CreateCategory> {
  id: string;
}

export interface CategoryFilters {
  search?: string;
  type?: 'income' | 'expense' | 'all';
  group?: string;
}

export interface CategoryStats {
  total: number;
  income: number;
  expense: number;
  recent: number;
}

// Grupos de receitas
export const INCOME_GROUPS = {
  trabalho: 'Trabalho',
  investimentos: 'Investimentos',
  alugueis: 'Aluguéis',
  outros: 'Outros'
} as const;

// Grupos de despesas
export const EXPENSE_GROUPS = {
  moradia: 'Moradia',
  transporte: 'Transporte',
  alimentacao: 'Alimentação',
  saude: 'Saúde',
  educacao: 'Educação',
  lazer: 'Lazer',
  cuidados: 'Cuidados Pessoais',
  outros: 'Outros'
} as const;

// Ícones disponíveis por grupo
export const GROUP_ICONS = {
  // Receitas
  trabalho: ['Briefcase', 'UserCheck', 'Building', 'Monitor'],
  investimentos: ['TrendingUp', 'PiggyBank', 'DollarSign', 'Target'],
  alugueis: ['Home', 'Building2', 'MapPin', 'Key'],
  
  // Despesas
  moradia: ['Home', 'Zap', 'Wifi', 'Phone'],
  transporte: ['Car', 'Bus', 'Bike', 'Fuel'],
  alimentacao: ['UtensilsCrossed', 'Coffee', 'Pizza', 'Apple'],
  saude: ['Heart', 'Pill', 'Stethoscope', 'Hospital'],
  educacao: ['GraduationCap', 'BookOpen', 'School', 'Laptop'],
  lazer: ['Gamepad2', 'Music', 'Film', 'Camera'],
  cuidados: ['Scissors', 'Shirt', 'ShoppingBag', 'Crown'],
  outros: ['Circle', 'Package', 'Tag', 'Star']
} as const;

// Cores padrão para categorias
export const CATEGORY_COLORS = [
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#06B6D4', // cyan-500
  '#3B82F6', // blue-500
  '#6366F1', // indigo-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#64748B', // slate-500
] as const;

// Função para obter grupos baseado no tipo
export const getGroupsByType = (type: 'income' | 'expense') => {
  return type === 'income' ? INCOME_GROUPS : EXPENSE_GROUPS;
};

// Função para obter ícones por grupo
export const getIconsByGroup = (group: string) => {
  return GROUP_ICONS[group as keyof typeof GROUP_ICONS] || GROUP_ICONS.outros;
};