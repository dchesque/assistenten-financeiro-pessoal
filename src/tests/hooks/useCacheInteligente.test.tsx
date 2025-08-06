import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useCacheInteligente from '@/hooks/useCacheInteligente';

/**
 * 🧪 TESTES AUTOMATIZADOS PREMIUM
 * Suíte completa de testes para hook de cache inteligente
 */

// Mock do fetcher
const mockFetcher = vi.fn();
const mockData = [
  { id: 1, nome: 'Fornecedor 1' },
  { id: 2, nome: 'Fornecedor 2' }
];

describe('useCacheInteligente', () => {
  beforeEach(() => {
    mockFetcher.mockClear();
    mockFetcher.mockResolvedValue(mockData);
    
    // Limpar localStorage
    localStorage.clear();
    
    // Mock do performance.now para testes determinísticos
    vi.spyOn(performance, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Funcionalidade Básica', () => {
    it('deve carregar dados iniciais', async () => {
      const { result } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher)
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBe(null);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBe(null);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it('deve usar dados do cache na segunda chamada', async () => {
      // Primeira renderização
      const { unmount } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Segunda renderização - deve usar cache
      const { result } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      // Não deve chamar fetcher novamente
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it('deve revalidar dados com revalidate()', async () => {
      const { result } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      // Alterar dados mockados
      const newData = [{ id: 3, nome: 'Fornecedor 3' }];
      mockFetcher.mockResolvedValueOnce(newData);

      // Revalidar
      await result.current.revalidate();

      expect(result.current.data).toEqual(newData);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com erros do fetcher', async () => {
      const errorMessage = 'Erro de rede';
      mockFetcher.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.data).toBe(null);
    });

    it('deve usar fallback para cache expirado em caso de erro', async () => {
      // Primeiro, carregar dados com sucesso
      const { unmount } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher, { ttl: 1 })
      );

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Aguardar cache expirar
      vi.advanceTimersByTime(2);

      // Fazer fetcher falhar
      mockFetcher.mockRejectedValueOnce(new Error('Erro de rede'));

      // Renderizar novamente com fallbackToExpired = true
      const { result } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher, { 
          fallbackToExpired: true 
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Deve usar dados expirados como fallback
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Mutação Otimista', () => {
    it('deve atualizar dados otimisticamente', async () => {
      const { result } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      const newData = [{ id: 3, nome: 'Novo Fornecedor' }];
      
      // Mutação otimista
      result.current.mutate(newData);

      expect(result.current.data).toEqual(newData);
    });

    it('deve atualizar dados com função', async () => {
      const { result } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      // Mutação com função
      result.current.mutate((current) => [
        ...current!,
        { id: 3, nome: 'Fornecedor Adicionado' }
      ]);

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data![2].nome).toBe('Fornecedor Adicionado');
    });
  });

  describe('Configurações Avançadas', () => {
    it('deve respeitar TTL customizado', async () => {
      const shortTTL = 100; // 100ms
      
      const { unmount } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher, { ttl: shortTTL })
      );

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Aguardar TTL expirar
      vi.advanceTimersByTime(shortTTL + 1);

      // Nova renderização deve chamar fetcher novamente
      renderHook(() =>
        useCacheInteligente('test-key', mockFetcher, { ttl: shortTTL })
      );

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(2);
      });
    });

    it('deve invalidar cache corretamente', async () => {
      const { result } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      // Invalidar cache
      result.current.invalidate();

      expect(result.current.data).toBe(null);
    });

    it('deve chamar callbacks de sucesso e erro', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();

      // Teste de sucesso
      const { unmount } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher, { onSuccess, onError })
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData);
      });

      expect(onError).not.toHaveBeenCalled();

      unmount();

      // Teste de erro
      mockFetcher.mockRejectedValueOnce(new Error('Erro teste'));

      renderHook(() =>
        useCacheInteligente('test-key-error', mockFetcher, { onSuccess, onError })
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Tipos de Cache', () => {
    it('deve usar cache de API corretamente', async () => {
      const { result } = renderHook(() =>
        useCacheInteligente('api-key', mockFetcher, { type: 'api' })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it('deve usar cache de usuário corretamente', async () => {
      const { result } = renderHook(() =>
        useCacheInteligente('user-key', mockFetcher, { type: 'user' })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it('deve usar cache estático corretamente', async () => {
      const { result } = renderHook(() =>
        useCacheInteligente('static-key', mockFetcher, { type: 'static' })
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('Métricas', () => {
    it('deve fornecer métricas do cache', async () => {
      const { result } = renderHook(() =>
        useCacheInteligente('test-key', mockFetcher)
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      const metrics = result.current.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.hits).toBe('number');
      expect(typeof metrics.misses).toBe('number');
      expect(typeof metrics.hitRate).toBe('number');
    });
  });

  describe('Refresh Interval', () => {
    it('deve revalidar automaticamente com refreshInterval', async () => {
      vi.useFakeTimers();

      const refreshInterval = 1000; // 1 segundo
      
      renderHook(() =>
        useCacheInteligente('test-key', mockFetcher, { refreshInterval })
      );

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(1);
      });

      // Avançar tempo para trigger refresh
      vi.advanceTimersByTime(refreshInterval);

      await waitFor(() => {
        expect(mockFetcher).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });
});

/**
 * Testes de integração
 */
describe('useCacheInteligente - Integração', () => {
  it('deve funcionar com múltiplas instâncias', async () => {
    const fetcher1 = vi.fn().mockResolvedValue(['data1']);
    const fetcher2 = vi.fn().mockResolvedValue(['data2']);

    const { result: result1 } = renderHook(() =>
      useCacheInteligente('key1', fetcher1)
    );

    const { result: result2 } = renderHook(() =>
      useCacheInteligente('key2', fetcher2)
    );

    await waitFor(() => {
      expect(result1.current.data).toEqual(['data1']);
      expect(result2.current.data).toEqual(['data2']);
    });

    expect(fetcher1).toHaveBeenCalledTimes(1);
    expect(fetcher2).toHaveBeenCalledTimes(1);
  });

  it('deve compartilhar cache entre instâncias com mesma key', async () => {
    const { result: result1 } = renderHook(() =>
      useCacheInteligente('shared-key', mockFetcher)
    );

    await waitFor(() => {
      expect(result1.current.data).toEqual(mockData);
    });

    // Segunda instância com mesma key
    const { result: result2 } = renderHook(() =>
      useCacheInteligente('shared-key', mockFetcher)
    );

    // Deve usar cache existente
    expect(result2.current.data).toEqual(mockData);
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });
});