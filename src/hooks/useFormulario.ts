import { useState, useCallback, useRef } from 'react';
import { useValidacao } from './useValidacao';
import type { EsquemaValidacao } from '@/utils/validacoes';

interface UseFormularioReturn<T> {
  dados: T;
  alterarCampo: (campo: keyof T, valor: any) => void;
  alterarCampos: (novosValues: Partial<T>) => void;
  resetar: () => void;
  estaCarregando: boolean;
  setCarregando: (carregando: boolean) => void;
  salvar: () => Promise<void>;
  erros: Record<string, string>;
  validarCampo: (campo: string, valor: string) => string;
  validarTodos: () => boolean;
  limparErros: () => void;
  temErros: boolean;
}

export function useFormulario<T extends Record<string, any>>(
  dadosIniciais: T,
  onSalvar: (dados: T) => Promise<void>,
  validacao?: EsquemaValidacao
): UseFormularioReturn<T> {
  const [dados, setDados] = useState<T>(dadosIniciais);
  const [estaCarregando, setCarregando] = useState(false);
  
  const { 
    erros, 
    validarCampo: validarCampoInterno, 
    validarTodos: validarTodosInterno, 
    limparErros 
  } = useValidacao(validacao || {});

  const timersRef = useRef<Record<string, number>>({});

  const alterarCampo = useCallback((campo: keyof T, valor: any) => {
    setDados(prev => ({ ...prev, [campo]: valor }));
    // validação com debounce 500ms
    const key = String(campo);
    if (timersRef.current[key]) {
      window.clearTimeout(timersRef.current[key]);
    }
    timersRef.current[key] = window.setTimeout(() => {
      validarCampoInterno(key, String(valor ?? ''));
    }, 500);
  }, [validarCampoInterno]);

  const alterarCampos = useCallback((novosValues: Partial<T>) => {
    setDados(prev => ({ ...prev, ...novosValues }));
  }, []);

  const resetar = useCallback(() => {
    setDados(dadosIniciais);
    limparErros();
  }, [dadosIniciais, limparErros]);

  const validarCampo = useCallback((campo: string, valor: string) => {
    return validarCampoInterno(campo, valor);
  }, [validarCampoInterno]);

  const validarTodos = useCallback(() => {
    return validarTodosInterno(dados);
  }, [validarTodosInterno, dados]);

  const salvar = useCallback(async () => {
    if (validacao && !validarTodos()) {
      return;
    }
    
    setCarregando(true);
    try {
      await onSalvar(dados);
    } finally {
      setCarregando(false);
    }
  }, [dados, onSalvar, validacao, validarTodos]);

  return {
    dados,
    alterarCampo,
    alterarCampos,
    resetar,
    estaCarregando,
    setCarregando,
    salvar,
    erros,
    validarCampo,
    validarTodos,
    limparErros,
    temErros: Object.keys(erros).length > 0
  };
}