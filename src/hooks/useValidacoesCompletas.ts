import { useState, useCallback } from 'react';
import { Cheque } from '@/types/cheque';
import { useChequesSupabase } from '@/hooks/useChequesSupabase';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';

export interface ErroValidacao {
  campo: string;
  mensagem: string;
  tipo: 'obrigatorio' | 'formato' | 'duplicata' | 'logica';
}

export interface ResultadoValidacao {
  valido: boolean;
  erros: ErroValidacao[];
  warnings: string[];
}

export interface ValidacaoVisual {
  [campo: string]: {
    hasError: boolean;
    message: string;
    borderColor: string;
  };
}

export function useValidacoesCompletas() {
  const { cheques } = useChequesSupabase();
  const { bancos } = useBancosSupabase();
  const [validacaoVisual, setValidacaoVisual] = useState<ValidacaoVisual>({});

  // Verificar se número de cheque já existe no sistema
  const verificarNumeroExistente = useCallback((numero: string, bancoId: number, chequeId?: number): boolean => {
    if (!numero.trim()) return false;
    
    const numeroFormatado = numero.padStart(6, '0');
    return cheques.some(c => 
      c.banco_id === bancoId && 
      c.numero_cheque === numeroFormatado &&
      c.id !== chequeId
    );
  }, []);

  // Buscar próximo número disponível para um banco
  const buscarProximoNumeroDisponivel = useCallback((bancoId: number): string => {
    const chequesExistentes = cheques
      .filter(c => c.banco_id === bancoId)
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

  // Validar CPF
  const validarCPF = useCallback((cpf: string): boolean => {
    if (!cpf) return true; // Campo opcional
    
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpfLimpo)) return false; // Todos dígitos iguais
    
    // Algoritmo de validação do CPF
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let dv1 = resto < 2 ? 0 : resto;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let dv2 = resto < 2 ? 0 : resto;
    
    return dv1 === parseInt(cpfLimpo.charAt(9)) && dv2 === parseInt(cpfLimpo.charAt(10));
  }, []);

  // Validar CNPJ
  const validarCNPJ = useCallback((cnpj: string): boolean => {
    if (!cnpj) return true; // Campo opcional
    
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    if (cnpjLimpo.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpjLimpo)) return false; // Todos dígitos iguais
    
    // Algoritmo de validação do CNPJ
    const calcularDigito = (cnpj: string, posicoes: number): number => {
      let soma = 0;
      let pos = posicoes - 7;
      
      for (let i = posicoes; i >= 1; i--) {
        soma += parseInt(cnpj.charAt(posicoes - i)) * pos--;
        if (pos < 2) pos = 9;
      }
      
      return soma % 11 < 2 ? 0 : 11 - (soma % 11);
    };
    
    const dv1 = calcularDigito(cnpjLimpo, 12);
    const dv2 = calcularDigito(cnpjLimpo, 13);
    
    return dv1 === parseInt(cnpjLimpo.charAt(12)) && dv2 === parseInt(cnpjLimpo.charAt(13));
  }, []);

  // Validar dados completos do cheque
  const validarDadosCheque = useCallback((dados: Partial<Cheque>, chequeId?: number): ResultadoValidacao => {
    const erros: ErroValidacao[] = [];
    const warnings: string[] = [];

    // Validação do banco
    if (!dados.banco_id || dados.banco_id === 0) {
      erros.push({
        campo: 'banco_id',
        mensagem: 'Selecione o banco emissor',
        tipo: 'obrigatorio'
      });
    } else {
      const banco = bancos.find(b => b.id === dados.banco_id);
      if (!banco) {
        erros.push({
          campo: 'banco_id',
          mensagem: 'Banco selecionado não encontrado',
          tipo: 'logica'
        });
      } else if (!banco.ativo) {
        warnings.push('O banco selecionado está inativo');
      }
    }

    // Validação do número do cheque
    if (!dados.numero_cheque || !dados.numero_cheque.trim()) {
      erros.push({
        campo: 'numero_cheque',
        mensagem: 'Número do cheque é obrigatório',
        tipo: 'obrigatorio'
      });
    } else {
      const numero = dados.numero_cheque.trim();
      
      // Formato numérico
      if (!/^\d+$/.test(numero)) {
        erros.push({
          campo: 'numero_cheque',
          mensagem: 'Número deve conter apenas dígitos',
          tipo: 'formato'
        });
      } else {
        // Tamanho adequado (1-6 dígitos)
        if (numero.length > 6) {
          erros.push({
            campo: 'numero_cheque',
            mensagem: 'Número deve ter no máximo 6 dígitos',
            tipo: 'formato'
          });
        }
        
        // Verificar duplicata no sistema
        if (dados.banco_id && verificarNumeroExistente(numero, dados.banco_id, chequeId)) {
          erros.push({
            campo: 'numero_cheque',
            mensagem: `Cheque #${numero.padStart(6, '0')} já existe neste banco`,
            tipo: 'duplicata'
          });
        }
      }
    }

    // Validação do beneficiário
    if (dados.tipo_beneficiario === 'fornecedor') {
      if (!dados.fornecedor_id || dados.fornecedor_id === 0) {
        erros.push({
          campo: 'fornecedor_id',
          mensagem: 'Selecione um fornecedor',
          tipo: 'obrigatorio'
        });
      }
    } else if (dados.tipo_beneficiario === 'outros') {
      if (!dados.beneficiario_nome || dados.beneficiario_nome.trim().length < 3) {
        erros.push({
          campo: 'beneficiario_nome',
          mensagem: 'Nome do beneficiário é obrigatório (mínimo 3 caracteres)',
          tipo: 'obrigatorio'
        });
      }
      
      // Validar documento se preenchido
      if (dados.beneficiario_documento) {
        const doc = dados.beneficiario_documento.replace(/[^\d]/g, '');
        if (doc.length === 11) {
          if (!validarCPF(dados.beneficiario_documento)) {
            erros.push({
              campo: 'beneficiario_documento',
              mensagem: 'CPF inválido',
              tipo: 'formato'
            });
          }
        } else if (doc.length === 14) {
          if (!validarCNPJ(dados.beneficiario_documento)) {
            erros.push({
              campo: 'beneficiario_documento',
              mensagem: 'CNPJ inválido',
              tipo: 'formato'
            });
          }
        } else if (doc.length > 0) {
          erros.push({
            campo: 'beneficiario_documento',
            mensagem: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos',
            tipo: 'formato'
          });
        }
      }
    }

    // Validação do valor
    if (!dados.valor || dados.valor <= 0) {
      erros.push({
        campo: 'valor',
        mensagem: 'Valor deve ser maior que zero',
        tipo: 'obrigatorio'
      });
    } else {
      // Valor muito alto (warning)
      if (dados.valor > 50000) {
        warnings.push('Valor alto: Verifique se está correto');
      }
    }

    // Validação da data de emissão
    if (!dados.data_emissao) {
      erros.push({
        campo: 'data_emissao',
        mensagem: 'Data de emissão é obrigatória',
        tipo: 'obrigatorio'
      });
    } else {
      const dataEmissao = new Date(dados.data_emissao);
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999); // Considerar até o final do dia
      
      if (dataEmissao > hoje) {
        erros.push({
          campo: 'data_emissao',
          mensagem: 'Data de emissão não pode ser futura',
          tipo: 'logica'
        });
      }
      
      // Data muito antiga (warning)
      const umAnoAtras = new Date();
      umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
      if (dataEmissao < umAnoAtras) {
        warnings.push('Data de emissão muito antiga');
      }
    }

    // Validação da data de vencimento
    if (dados.data_vencimento && dados.data_emissao) {
      if (dados.data_vencimento < dados.data_emissao) {
        erros.push({
          campo: 'data_vencimento',
          mensagem: 'Data de vencimento não pode ser anterior à emissão',
          tipo: 'logica'
        });
      }
    }

    return {
      valido: erros.length === 0,
      erros,
      warnings
    };
  }, [verificarNumeroExistente, validarCPF, validarCNPJ]);

  // Atualizar validação visual em tempo real
  const atualizarValidacaoVisual = useCallback((campo: string, valor: any, dadosCompletos?: Partial<Cheque>, chequeId?: number) => {
    const dadosValidacao = { ...dadosCompletos, [campo]: valor };
    const resultado = validarDadosCheque(dadosValidacao, chequeId);
    
    const errosCampo = resultado.erros.filter(e => e.campo === campo);
    
    setValidacaoVisual(prev => ({
      ...prev,
      [campo]: {
        hasError: errosCampo.length > 0,
        message: errosCampo[0]?.mensagem || '',
        borderColor: errosCampo.length > 0 ? 'border-red-300' : 'border-green-300'
      }
    }));
  }, [validarDadosCheque]);

  // Limpar validações visuais
  const limparValidacoesVisuais = useCallback(() => {
    setValidacaoVisual({});
  }, []);

  // Validar sequência de cheques para preenchimento automático
  const validarSequenciaCheques = useCallback((
    numeroInicial: string,
    quantidade: number,
    bancoId: number
  ): { 
    valida: boolean;
    chequesProblematicos: Array<{ numero: string; motivo: string }>;
    proximosNumeros: string[];
  } => {
    const numeroBase = parseInt(numeroInicial);
    if (isNaN(numeroBase)) {
      return {
        valida: false,
        chequesProblematicos: [{ numero: numeroInicial, motivo: 'Número inválido' }],
        proximosNumeros: []
      };
    }

    const chequesProblematicos: Array<{ numero: string; motivo: string }> = [];
    const proximosNumeros: string[] = [];

    // Verificar cada número da sequência
    for (let i = 0; i < quantidade; i++) {
      const numeroSequencia = numeroBase + i;
      const numeroFormatado = numeroSequencia.toString().padStart(6, '0');
      proximosNumeros.push(numeroFormatado);

      if (verificarNumeroExistente(numeroFormatado, bancoId)) {
        const banco = bancos.find(b => b.id === bancoId);
        chequesProblematicos.push({
          numero: numeroFormatado,
          motivo: `Já existe no ${banco?.nome || 'banco'}`
        });
      }
    }

    return {
      valida: chequesProblematicos.length === 0,
      chequesProblematicos,
      proximosNumeros
    };
  }, [verificarNumeroExistente]);

  return {
    // Validações
    validarDadosCheque,
    verificarNumeroExistente,
    buscarProximoNumeroDisponivel,
    validarCPF,
    validarCNPJ,
    validarSequenciaCheques,
    
    // Validação visual
    validacaoVisual,
    atualizarValidacaoVisual,
    limparValidacoesVisuais
  };
}