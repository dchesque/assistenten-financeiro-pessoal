import { useState, useCallback } from 'react';
import { useChequesSupabase } from '@/hooks/useChequesSupabase';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';

export interface ValidacaoCheque {
  isValid: boolean;
  status: 'valid' | 'invalid' | 'empty' | 'duplicate_system' | 'duplicate_batch';
  message: string;
  tooltip: string;
}

export function useValidacoesCheques() {
  const { cheques } = useChequesSupabase();
  const { bancos } = useBancosSupabase();
  const [validacoesCheques, setValidacoesCheques] = useState<{[key: number]: ValidacaoCheque}>({});

  // Verificar se cheque já existe no sistema
  const verificarChequeDisponivel = useCallback((banco_id: number, numero_cheque: string): boolean => {
    if (!numero_cheque || !numero_cheque.trim()) return true;
    
    const numeroFormatado = numero_cheque.padStart(6, '0');
    return !cheques.some(c => 
      c.banco_id === banco_id && 
      c.numero_cheque === numeroFormatado
    );
  }, []);

  // Validar número de cheque individual
  const validarNumeroCheque = useCallback((
    numero: string, 
    parcelaNumero: number, 
    banco_id?: number,
    numerosChequesBatch: {[key: number]: string} = {}
  ): ValidacaoCheque => {
    // Campo vazio
    if (!numero.trim()) {
      return {
        isValid: false,
        status: 'empty',
        message: 'Campo obrigatório',
        tooltip: 'Preencha o número do cheque'
      };
    }

    // Número inválido (não numérico)
    const numeroInt = parseInt(numero);
    if (isNaN(numeroInt)) {
      return {
        isValid: false,
        status: 'invalid',
        message: 'Número inválido',
        tooltip: 'Digite apenas números'
      };
    }

    // Verificar se já existe no sistema
    if (banco_id && !verificarChequeDisponivel(banco_id, numero)) {
      const banco = bancos.find(b => b.id === banco_id);
      return {
        isValid: false,
        status: 'duplicate_system',
        message: 'Cheque já existe',
        tooltip: `Cheque #${numero.padStart(6, '0')} já existe no ${banco?.nome || 'banco selecionado'}`
      };
    }

    // Verificar duplicatas no lote atual
    const existeNoBatch = Object.entries(numerosChequesBatch).some(([key, valor]) => 
      parseInt(key) !== parcelaNumero && valor === numero
    );
    
    if (existeNoBatch) {
      return {
        isValid: false,
        status: 'duplicate_batch',
        message: 'Duplicado no lote',
        tooltip: 'Este número já está sendo usado em outra parcela'
      };
    }

    // Válido
    return {
      isValid: true,
      status: 'valid',
      message: 'Cheque disponível',
      tooltip: 'Cheque disponível para uso'
    };
  }, [verificarChequeDisponivel]);

  // Validar sequência de cheques antes de preencher
  const validarSequenciaCheques = useCallback((
    numeroInicial: string,
    quantidade: number,
    banco_id: number
  ): { 
    temDuplicatas: boolean;
    chequesProblematicos: Array<{ numero: string; motivo: string }>;
    podePreencherSequencia: boolean;
  } => {
    const numeroBase = parseInt(numeroInicial);
    if (isNaN(numeroBase)) {
      return {
        temDuplicatas: false,
        chequesProblematicos: [{ numero: numeroInicial, motivo: 'Número inválido' }],
        podePreencherSequencia: false
      };
    }

    const chequesProblematicos: Array<{ numero: string; motivo: string }> = [];

    // Verificar cada número da sequência
    for (let i = 0; i < quantidade; i++) {
      const numeroSequencia = numeroBase + i;
      const numeroFormatado = numeroSequencia.toString().padStart(6, '0');

      if (!verificarChequeDisponivel(banco_id, numeroFormatado)) {
        const banco = bancos.find(b => b.id === banco_id);
        chequesProblematicos.push({
          numero: numeroFormatado,
          motivo: `Já existe no ${banco?.nome || 'banco'}`
        });
      }
    }

    return {
      temDuplicatas: chequesProblematicos.length > 0,
      chequesProblematicos,
      podePreencherSequencia: chequesProblematicos.length === 0
    };
  }, [verificarChequeDisponivel]);

  // Validar múltiplos cheques de uma vez (para lote)
  const validarLoteCheques = useCallback((
    numerosCheques: string[],
    banco_id: number
  ): {
    isValid: boolean;
    chequesInvalidos: Array<{ numero: string; motivo: string }>;
  } => {
    const chequesInvalidos: Array<{ numero: string; motivo: string }> = [];
    
    // Verificar cada cheque individualmente
    numerosCheques.forEach(numero => {
      if (!numero.trim()) {
        chequesInvalidos.push({ numero: '', motivo: 'Número não informado' });
        return;
      }

      const numeroInt = parseInt(numero);
      if (isNaN(numeroInt)) {
        chequesInvalidos.push({ numero, motivo: 'Número inválido' });
        return;
      }

      if (!verificarChequeDisponivel(banco_id, numero)) {
        const banco = bancos.find(b => b.id === banco_id);
        chequesInvalidos.push({
          numero: numero.padStart(6, '0'),
          motivo: `Já existe no ${banco?.nome || 'banco'}`
        });
      }
    });

    // Verificar duplicatas dentro do próprio lote
    const numerosCounts = numerosCheques.reduce((acc, numero) => {
      acc[numero] = (acc[numero] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(numerosCounts).forEach(([numero, count]) => {
      if (count > 1) {
        chequesInvalidos.push({
          numero: numero.padStart(6, '0'),
          motivo: 'Duplicado no lote'
        });
      }
    });

    return {
      isValid: chequesInvalidos.length === 0,
      chequesInvalidos
    };
  }, [verificarChequeDisponivel]);

  // Buscar próximo número disponível
  const buscarProximoNumeroDisponivel = useCallback((banco_id: number): string => {
    const chequesExistentes = cheques
      .filter(c => c.banco_id === banco_id)
      .map(c => parseInt(c.numero_cheque))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    let proximo = 1;
    for (const numero of chequesExistentes) {
      if (numero === proximo) {
        proximo++;
      } else {
        break;
      }
    }

    return proximo.toString().padStart(6, '0');
  }, []);

  // Atualizar validação de um cheque específico
  const atualizarValidacaoCheque = useCallback((
    parcelaNumero: number,
    validacao: ValidacaoCheque
  ) => {
    setValidacoesCheques(prev => ({
      ...prev,
      [parcelaNumero]: validacao
    }));
  }, []);

  // Limpar todas as validações
  const limparValidacoes = useCallback(() => {
    setValidacoesCheques({});
  }, []);

  return {
    validacoesCheques,
    verificarChequeDisponivel,
    validarNumeroCheque,
    validarSequenciaCheques,
    validarLoteCheques,
    buscarProximoNumeroDisponivel,
    atualizarValidacaoCheque,
    limparValidacoes
  };
}