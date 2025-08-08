export interface Category {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategory {
  name: string;
  color?: string;
}

export interface UpdateCategory extends Partial<CreateCategory> {
  id: string;
}

export interface CategoryFilters {
  search?: string;
}

export interface CategoryStats {
  total: number;
  recent: number;
}

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