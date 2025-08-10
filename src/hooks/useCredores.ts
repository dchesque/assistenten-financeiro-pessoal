// Hook para credores com terminologia de finanças pessoais
import { useFornecedores } from './useFornecedores';
import type { Fornecedor as Credor } from '@/types/fornecedor';

export interface UseCredoresReturn {
  credores: Credor[];
  loading: boolean;
  error: string | null;
  criarCredor: (credor: Omit<Credor, 'id' | 'dataCadastro' | 'totalCompras' | 'valorTotal'>) => Promise<Credor>;
  atualizarCredor: (id: string, credor: Partial<Credor>) => Promise<Credor>;
  excluirCredor: (id: string) => Promise<void>;
  buscarPorDocumento: (documento: string) => Credor | null;
  atualizarEstatisticas: (credorId: string) => Promise<void>;
  recarregar: () => Promise<void>;
}

export const useCredores = (): UseCredoresReturn => {
  const {
    fornecedores: credores,
    loading,
    error,
    criarFornecedor: criarCredor,
    atualizarFornecedor: atualizarCredor,
    excluirFornecedor: excluirCredor,
    buscarPorDocumento,
    atualizarEstatisticas,
    recarregar
  } = useFornecedores();

  return {
    credores,
    loading,
    error,
    criarCredor,
    atualizarCredor,
    excluirCredor,
    buscarPorDocumento,
    atualizarEstatisticas,
    recarregar
  };
};