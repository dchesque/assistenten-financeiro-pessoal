import { useState, useCallback } from 'react';
import { Vendedor, NovoVendedor } from '@/types/vendedor';

interface ErrosValidacao {
  nome?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  codigo_vendedor?: string;
  percentual_comissao?: string;
  desconto_maximo?: string;
  data_admissao?: string;
  meta_mensal?: string;
}

interface ValidacaoResult {
  valido: boolean;
  erros: ErrosValidacao;
}

export const useValidacaoVendedor = () => {
  const [erros, setErros] = useState<ErrosValidacao>({});

  // Validação de CPF
  const validarCPF = useCallback((cpf: string): boolean => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    
    return resto === parseInt(cpfLimpo.charAt(10));
  }, []);

  // Validação de CNPJ
  const validarCNPJ = useCallback((cnpj: string): boolean => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
    
    const calcularDigito = (cnpj: string, posicoes: number[]): number => {
      let soma = 0;
      for (let i = 0; i < posicoes.length; i++) {
        soma += parseInt(cnpj.charAt(i)) * posicoes[i];
      }
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };
    
    const primeiroDigito = calcularDigito(cnpjLimpo, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const segundoDigito = calcularDigito(cnpjLimpo, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    
    return primeiroDigito === parseInt(cnpjLimpo.charAt(12)) && 
           segundoDigito === parseInt(cnpjLimpo.charAt(13));
  }, []);

  // Validação de email
  const validarEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Validação de telefone
  const validarTelefone = useCallback((telefone: string): boolean => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    return telefoneLimpo.length === 10 || telefoneLimpo.length === 11;
  }, []);

  // Validação de percentual (0-100)
  const validarPercentual = useCallback((valor: number): boolean => {
    return valor >= 0 && valor <= 100;
  }, []);

  // Validação completa do formulário
  const validarFormulario = useCallback((
    dados: NovoVendedor | Partial<Vendedor>,
    vendedoresExistentes: Vendedor[] = [],
    vendedorAtualId?: number
  ): ValidacaoResult => {
    const novosErros: ErrosValidacao = {};

    // Validação do nome
    if (!dados.nome || dados.nome.trim().length < 3) {
      novosErros.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    // Validação do documento
    if (!dados.documento) {
      novosErros.documento = 'Documento é obrigatório';
    } else {
      const documentoLimpo = dados.documento.replace(/\D/g, '');
      const tipoDoc = dados.tipo_documento || (documentoLimpo.length <= 11 ? 'CPF' : 'CNPJ');
      
      if (tipoDoc === 'CPF') {
        if (!validarCPF(dados.documento)) {
          novosErros.documento = 'CPF inválido';
        }
      } else if (tipoDoc === 'CNPJ') {
        if (!validarCNPJ(dados.documento)) {
          novosErros.documento = 'CNPJ inválido';
        }
      }

      // Verificar se documento é único
      const documentoExistente = vendedoresExistentes.find(v => 
        v.documento === dados.documento && v.id !== vendedorAtualId
      );
      if (documentoExistente) {
        novosErros.documento = 'Este documento já está cadastrado';
      }
    }

    // Validação do email
    if (dados.email && !validarEmail(dados.email)) {
      novosErros.email = 'Email inválido';
    }

    // Validação do telefone
    if (dados.telefone && !validarTelefone(dados.telefone)) {
      novosErros.telefone = 'Telefone deve ter 10 ou 11 dígitos';
    }

    // Validação do código do vendedor
    if (!dados.codigo_vendedor) {
      novosErros.codigo_vendedor = 'Código do vendedor é obrigatório';
    } else {
      // Verificar se código é único
      const codigoExistente = vendedoresExistentes.find(v => 
        v.codigo_vendedor === dados.codigo_vendedor && v.id !== vendedorAtualId
      );
      if (codigoExistente) {
        novosErros.codigo_vendedor = 'Este código já está em uso';
      }
    }

    // Validação do percentual de comissão
    if (dados.percentual_comissao !== undefined && !validarPercentual(dados.percentual_comissao)) {
      novosErros.percentual_comissao = 'Percentual deve estar entre 0 e 100%';
    }

    // Validação do desconto máximo
    if (dados.desconto_maximo !== undefined && !validarPercentual(dados.desconto_maximo)) {
      novosErros.desconto_maximo = 'Desconto máximo deve estar entre 0 e 100%';
    }

    // Validação da data de admissão
    if (!dados.data_admissao) {
      novosErros.data_admissao = 'Data de admissão é obrigatória';
    } else {
      const dataAdmissao = new Date(dados.data_admissao);
      const hoje = new Date();
      if (dataAdmissao > hoje) {
        novosErros.data_admissao = 'Data de admissão não pode ser futura';
      }
    }

    // Validação da meta mensal
    if (dados.meta_mensal !== undefined && dados.meta_mensal < 0) {
      novosErros.meta_mensal = 'Meta mensal deve ser um valor positivo';
    }

    setErros(novosErros);

    return {
      valido: Object.keys(novosErros).length === 0,
      erros: novosErros
    };
  }, [validarCPF, validarCNPJ, validarEmail, validarTelefone, validarPercentual]);

  // Limpar erros
  const limparErros = useCallback(() => {
    setErros({});
  }, []);

  // Formatadores
  const formatarCPF = useCallback((valor: string): string => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }, []);

  const formatarCNPJ = useCallback((valor: string): string => {
    const numeros = valor.replace(/\D/g, '');
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }, []);

  const formatarTelefone = useCallback((valor: string): string => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }, []);

  const aplicarMascaraDocumento = useCallback((valor: string): string => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return formatarCPF(valor);
    }
    return formatarCNPJ(valor);
  }, [formatarCPF, formatarCNPJ]);

  return {
    erros,
    validarCPF,
    validarCNPJ,
    validarEmail,
    validarTelefone,
    validarPercentual,
    validarFormulario,
    limparErros,
    formatarCPF,
    formatarCNPJ,
    formatarTelefone,
    aplicarMascaraDocumento
  };
};