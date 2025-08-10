import { useFornecedores } from './useFornecedoresAlias';

// Alias/Wrapper para manter compatibilidade com código existente
// Redireciona useCredores para useFornecedores

export function useCredores() {
  const fornecedoresHook = useFornecedores();
  
  return {
    credores: fornecedoresHook.fornecedores,
    loading: fornecedoresHook.loading,
    error: fornecedoresHook.error,
    criarCredor: fornecedoresHook.criarFornecedor,
    atualizarCredor: fornecedoresHook.atualizarFornecedor,
    excluirCredor: fornecedoresHook.excluirFornecedor,
    buscarPorDocumento: fornecedoresHook.buscarPorDocumento
  };
}