import { useCategorias } from '@/hooks/useCategorias';

// Alias/Wrapper para manter compatibilidade com código existente
// Mapeia plano de contas para categories

export interface PlanoContasCompat {
  id: string;
  nome: string;
  codigo?: string;
  tipo: 'receita' | 'despesa';
  grupo?: string;
  nivel: number;
  pai_id?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function usePlanoContas() {
  const { categorias, loading, error, criarCategoria, atualizarCategoria, excluirCategoria } = useCategorias();

  // Converter categories para formato de plano de contas
  const planoContas = categorias.map(categoria => ({
    id: categoria.id,
    nome: categoria.name,
    codigo: categoria.id.substring(0, 8), // Usar primeiros 8 chars do ID como código
    tipo: categoria.type as 'receita' | 'despesa',
    grupo: categoria.group_name || 'Geral',
    nivel: 1, // Nível fixo por simplicidade
    pai_id: undefined,
    ativo: true,
    created_at: categoria.created_at,
    updated_at: categoria.updated_at
  }));

  const criarPlanoContas = async (dados: Partial<PlanoContasCompat>) => {
    try {
      return await criarCategoria({
        name: dados.nome || '',
        type: dados.tipo || 'despesa',
        color: '#6366f1',
        group_name: dados.grupo || 'Geral'
      });
    } catch (error) {
      throw error;
    }
  };

  const atualizarPlanoContas = async (id: string, updates: Partial<PlanoContasCompat>) => {
    try {
      return await atualizarCategoria(id, {
        name: updates.nome,
        type: updates.tipo,
        group_name: updates.grupo
      });
    } catch (error) {
      throw error;
    }
  };

  const excluirPlanoContas = async (id: string) => {
    try {
      await excluirCategoria(id);
    } catch (error) {
      throw error;
    }
  };

  const buscarPorTipo = (tipo: 'receita' | 'despesa') => {
    return planoContas.filter(pc => pc.tipo === tipo);
  };

  const buscarPorGrupo = (grupo: string) => {
    return planoContas.filter(pc => pc.grupo === grupo);
  };

  return {
    planoContas,
    loading,
    error,
    criarPlanoContas,
    atualizarPlanoContas,
    excluirPlanoContas,
    buscarPorTipo,
    buscarPorGrupo,
    recarregar: () => {} // No-op, handled by useCategorias
  };
}