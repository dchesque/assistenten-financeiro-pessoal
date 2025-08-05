import { useState, useCallback } from 'react';
import type { EsquemaValidacao, ValidacaoRegra } from '@/utils/validacoes';

interface UseValidacaoReturn {
  erros: Record<string, string>;
  validarCampo: (campo: string, valor: string, regras?: ValidacaoRegra[]) => string;
  validarTodos: (dados: Record<string, any>) => boolean;
  limparErros: () => void;
  limparErroCampo: (campo: string) => void;
  temErros: boolean;
  adicionarErro: (campo: string, erro: string) => void;
}

export function useValidacao(esquemaValidacao: EsquemaValidacao = {}): UseValidacaoReturn {
  const [erros, setErros] = useState<Record<string, string>>({});

  const validarCampo = useCallback((campo: string, valor: string, regras?: ValidacaoRegra[]) => {
    const regrasCampo = regras || esquemaValidacao[campo] || [];
    
    for (const regra of regrasCampo) {
      const erro = regra.validador(valor);
      if (erro) {
        setErros(prev => ({ ...prev, [campo]: erro }));
        return erro;
      }
    }
    
    setErros(prev => {
      const novosErros = { ...prev };
      delete novosErros[campo];
      return novosErros;
    });
    
    return '';
  }, [esquemaValidacao]);

  const validarTodos = useCallback((dados: Record<string, any>) => {
    const novosErros: Record<string, string> = {};
    
    Object.keys(esquemaValidacao).forEach(campo => {
      const valor = dados[campo] || '';
      const regras = esquemaValidacao[campo];
      
      for (const regra of regras) {
        const erro = regra.validador(valor);
        if (erro) {
          novosErros[campo] = erro;
          break;
        }
      }
    });
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [esquemaValidacao]);

  const limparErros = useCallback(() => {
    setErros({});
  }, []);

  const limparErroCampo = useCallback((campo: string) => {
    setErros(prev => {
      const novosErros = { ...prev };
      delete novosErros[campo];
      return novosErros;
    });
  }, []);

  const adicionarErro = useCallback((campo: string, erro: string) => {
    setErros(prev => ({ ...prev, [campo]: erro }));
  }, []);

  return {
    erros,
    validarCampo,
    validarTodos,
    limparErros,
    limparErroCampo,
    adicionarErro,
    temErros: Object.keys(erros).length > 0
  };
}