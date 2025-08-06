import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface UseValidacaoAssincronaOptions {
  delay?: number;
  executarSeVazio?: boolean;
  cacheResultados?: boolean;
}

interface UseValidacaoAssincronaReturn {
  erro: string;
  validando: boolean;
  valido: boolean;
  revalidar: () => Promise<void>;
  limpar: () => void;
}

/**
 * Hook para validações assíncronas premium com debounce
 * 
 * @description Permite validações em tempo real com debounce, cache de resultados
 * e gerenciamento otimizado de estado para melhor UX
 * 
 * @example
 * ```typescript
 * const { erro, validando, valido } = useValidacaoAssincrona(
 *   email,
 *   async (email) => {
 *     const response = await api.validarEmail(email);
 *     return response.erro || '';
 *   },
 *   { delay: 500, cacheResultados: true }
 * );
 * ```
 */
export function useValidacaoAssincrona(
  valor: string,
  validador: (valor: string) => Promise<string>,
  options: UseValidacaoAssincronaOptions = {}
): UseValidacaoAssincronaReturn {
  const {
    delay = 500,
    executarSeVazio = false,
    cacheResultados = false
  } = options;

  const [erro, setErro] = useState<string>('');
  const [validando, setValidando] = useState<boolean>(false);
  const [valido, setValido] = useState<boolean>(false);
  const [cache, setCache] = useState<Map<string, { erro: string; timestamp: number }>>(new Map());
  
  const valorDebounced = useDebounce(valor, delay);

  // Função para executar validação
  const executarValidacao = useCallback(async (valorParaValidar: string) => {
    // Verificar cache se habilitado
    if (cacheResultados && cache.has(valorParaValidar)) {
      const cached = cache.get(valorParaValidar)!;
      // Cache válido por 5 minutos
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setErro(cached.erro);
        setValido(!cached.erro);
        return;
      }
    }

    setValidando(true);
    setErro('');
    setValido(false);
    
    try {
      const mensagemErro = await validador(valorParaValidar);
      
      // Salvar no cache se habilitado
      if (cacheResultados) {
        setCache(prev => new Map(prev).set(valorParaValidar, {
          erro: mensagemErro,
          timestamp: Date.now()
        }));
      }
      
      setErro(mensagemErro);
      setValido(!mensagemErro);
    } catch (error) {
      console.error('Erro na validação assíncrona:', error);
      const mensagemErro = 'Erro na validação. Tente novamente.';
      setErro(mensagemErro);
      setValido(false);
      
      // Salvar erro no cache também
      if (cacheResultados) {
        setCache(prev => new Map(prev).set(valorParaValidar, {
          erro: mensagemErro,
          timestamp: Date.now()
        }));
      }
    } finally {
      setValidando(false);
    }
  }, [validador, cacheResultados, cache]);

  // Effect principal para executar validação
  useEffect(() => {
    // Não validar se valor estiver vazio e não for configurado para executar
    if (!valorDebounced && !executarSeVazio) {
      setErro('');
      setValidando(false);
      setValido(false);
      return;
    }

    executarValidacao(valorDebounced);
  }, [valorDebounced, executarSeVazio, executarValidacao]);

  // Função para revalidar manualmente
  const revalidar = useCallback(async () => {
    if (valor) {
      await executarValidacao(valor);
    }
  }, [valor, executarValidacao]);

  // Função para limpar estado
  const limpar = useCallback(() => {
    setErro('');
    setValidando(false);
    setValido(false);
    if (cacheResultados) {
      setCache(new Map());
    }
  }, [cacheResultados]);

  return {
    erro,
    validando,
    valido,
    revalidar,
    limpar
  };
}

/**
 * Validadores assíncronos pré-definidos para casos comuns
 */
export const validadoresAssincronos = {
  /**
   * Validar se email já existe no sistema
   */
  emailUnico: async (email: string): Promise<string> => {
    if (!email) return '';
    
    // Simular API call - substituir por chamada real
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simular validação
    const emailsExistentes = ['admin@teste.com', 'usuario@teste.com'];
    if (emailsExistentes.includes(email.toLowerCase())) {
      return 'Este email já está em uso';
    }
    
    return '';
  },

  /**
   * Validar se CPF/CNPJ já existe
   */
  documentoUnico: async (documento: string): Promise<string> => {
    if (!documento) return '';
    
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Simular validação
    const documentosExistentes = ['123.456.789-01', '12.345.678/0001-90'];
    if (documentosExistentes.includes(documento)) {
      return 'Este documento já está cadastrado';
    }
    
    return '';
  },

  /**
   * Validar CEP com consulta de endereço
   */
  cepValido: async (cep: string): Promise<string> => {
    if (!cep) return '';
    
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return 'CEP deve ter 8 dígitos';
    }
    
    try {
      // Simular consulta ViaCEP
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simular CEP inválido
      if (cepLimpo.startsWith('99999')) {
        return 'CEP não encontrado';
      }
      
      return '';
    } catch (error) {
      return 'Erro ao validar CEP. Tente novamente.';
    }
  },

  /**
   * Validar nome de usuário único
   */
  usernameUnico: async (username: string): Promise<string> => {
    if (!username) return '';
    
    if (username.length < 3) {
      return 'Nome de usuário deve ter pelo menos 3 caracteres';
    }
    
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 350));
    
    // Simular validação
    const usernames = ['admin', 'root', 'test', 'user'];
    if (usernames.includes(username.toLowerCase())) {
      return 'Este nome de usuário não está disponível';
    }
    
    return '';
  }
};