import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useFornecedoresSupabase } from '@/hooks/useFornecedoresSupabase';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const waitFor = async (callback: () => void, options?: { timeout?: number }) => {
  return new Promise<void>((resolve) => {
    const timeout = options?.timeout || 1000;
    const interval = 50;
    let elapsed = 0;
    
    const check = () => {
      try {
        callback();
        resolve();
      } catch {
        elapsed += interval;
        if (elapsed >= timeout) {
          resolve();
        } else {
          setTimeout(check, interval);
        }
      }
    };
    
    check();
  });
};

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock de dados de teste
const mockFornecedores = [
  {
    id: 1,
    nome: 'Fornecedor Teste',
    tipo: 'pessoa_juridica',
    tipo_fornecedor: 'despesa',
    documento: '12.345.678/0001-90',
    email: 'teste@fornecedor.com',
    telefone: '(11) 99999-9999',
    ativo: true,
    totalCompras: 10,
    valorTotal: 1000.50,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    nome: 'João Silva',
    tipo: 'pessoa_fisica',
    tipo_fornecedor: 'receita',
    documento: '123.456.789-01',
    email: 'joao@email.com',
    telefone: '(11) 88888-8888',
    ativo: false,
    totalCompras: 5,
    valorTotal: 500.25,
    created_at: '2025-01-02T00:00:00.000Z',
    updated_at: '2025-01-02T00:00:00.000Z'
  }
];

// Mock do Supabase para este teste específico
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: mockFornecedores,
          error: null
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockFornecedores.filter(f => f.ativo),
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({
        data: [{ ...mockFornecedores[0], id: 3 }],
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [{ ...mockFornecedores[0], nome: 'Fornecedor Atualizado' }],
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    }))
  }
}));

describe('useFornecedoresSupabase', () => {
  it('deve carregar fornecedores corretamente', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFornecedoresSupabase(), { wrapper });
    
    // Verificar estado inicial de carregamento
    expect(result.current.loading).toBe(true);
    expect(result.current.fornecedores).toEqual([]);
    
    // Aguardar carregamento
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Verificar dados carregados
    expect(result.current.fornecedores).toHaveLength(2);
    expect(result.current.fornecedores[0].nome).toBe('Fornecedor Teste');
    expect(result.current.fornecedores[1].nome).toBe('João Silva');
  });

  it('deve filtrar fornecedores ativos corretamente', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFornecedoresSupabase(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Verificar se há fornecedores ativos e inativos
    const ativos = result.current.fornecedores.filter(f => f.ativo);
    const inativos = result.current.fornecedores.filter(f => !f.ativo);
    
    expect(ativos).toHaveLength(1);
    expect(inativos).toHaveLength(1);
    expect(ativos[0].nome).toBe('Fornecedor Teste');
    expect(inativos[0].nome).toBe('João Silva');
  });

  it('deve criar novo fornecedor', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFornecedoresSupabase(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const novoFornecedor = {
      nome: 'Novo Fornecedor',
      tipo: 'pessoa_juridica' as const,
      tipo_fornecedor: 'despesa' as const,
      documento: '98.765.432/0001-10',
      email: 'novo@fornecedor.com',
      telefone: '(11) 77777-7777',
      ativo: true,
      totalCompras: 0,
      valorTotal: 0
    };
    
    // Executar criação
    await result.current.criarFornecedor(novoFornecedor);
    
    // Verificar se foi criado (mock retorna sucesso)
    expect(result.current.error).toBeNull();
  });

  it('deve atualizar fornecedor existente', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFornecedoresSupabase(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const dadosAtualizacao = {
      nome: 'Fornecedor Atualizado',
      email: 'atualizado@fornecedor.com'
    };
    
    // Executar atualização
    await result.current.atualizarFornecedor(1, dadosAtualizacao);
    
    // Verificar se foi atualizado
    expect(result.current.error).toBeNull();
  });

  it('deve excluir fornecedor', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFornecedoresSupabase(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Executar exclusão
    await result.current.excluirFornecedor(1);
    
    // Verificar se foi excluído
    expect(result.current.error).toBeNull();
  });

  it('deve lidar com erros corretamente', async () => {
    // Mock de erro
    const supabaseErrorMock = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Erro de conexão' }
          }))
        }))
      }))
    };
    
    vi.doMock('@/integrations/supabase/client', () => ({
      supabase: supabaseErrorMock
    }));
    
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFornecedoresSupabase(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Verificar se o erro foi capturado
    expect(result.current.error).toBeTruthy();
  });

  it('deve calcular estatísticas corretamente', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useFornecedoresSupabase(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Verificar estatísticas
    expect(result.current.estatisticas.total).toBe(2);
    expect(result.current.estatisticas.ativos).toBe(1);
    expect(result.current.estatisticas.inativos).toBe(1);
    expect(result.current.estatisticas.totalCompras).toBe(15);
    expect(result.current.estatisticas.valorTotal).toBe(1500.75);
  });
});