import { useState } from 'react';

interface ErrosValidacao {
  nome?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  codigo_vendedor?: string;
  percentual_comissao?: string;
  meta_mensal?: string;
  desconto_maximo?: string;
}

export function useVendedorValidations() {
  const [erros, setErros] = useState<ErrosValidacao>({});

  const validarCPF = (cpf: string): boolean => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    
    // Validar dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo[i]) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo[9])) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo[i]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpfLimpo[10]);
  };

  const validarCNPJ = (cnpj: string): boolean => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
    
    // Validar primeiro dígito verificador
    let soma = 0;
    let peso = 2;
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(cnpjLimpo[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    if (digito1 !== parseInt(cnpjLimpo[12])) return false;
    
    // Validar segundo dígito verificador
    soma = 0;
    peso = 2;
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(cnpjLimpo[i]) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    return digito2 === parseInt(cnpjLimpo[13]);
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarTelefone = (telefone: string): boolean => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    return telefoneLimpo.length === 10 || telefoneLimpo.length === 11;
  };

  const validarFormulario = (dados: any): boolean => {
    const novosErros: ErrosValidacao = {};

    // Nome obrigatório
    if (!dados.nome?.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    } else if (dados.nome.trim().length < 2) {
      novosErros.nome = 'Nome deve ter pelo menos 2 caracteres';
    } else if (dados.nome.trim().length > 100) {
      novosErros.nome = 'Nome deve ter no máximo 100 caracteres';
    }

    // Documento obrigatório e válido
    if (!dados.documento?.trim()) {
      novosErros.documento = 'Documento é obrigatório';
    } else {
      const documento = dados.documento.replace(/\D/g, '');
      if (documento.length === 11) {
        if (!validarCPF(documento)) {
          novosErros.documento = 'CPF inválido';
        }
      } else if (documento.length === 14) {
        if (!validarCNPJ(documento)) {
          novosErros.documento = 'CNPJ inválido';
        }
      } else {
        novosErros.documento = 'Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)';
      }
    }

    // Email opcional, mas deve ser válido se preenchido
    if (dados.email?.trim()) {
      if (!validarEmail(dados.email)) {
        novosErros.email = 'Email inválido';
      } else if (dados.email.length > 255) {
        novosErros.email = 'Email deve ter no máximo 255 caracteres';
      }
    }

    // Telefone opcional, mas deve ser válido se preenchido
    if (dados.telefone?.trim() && !validarTelefone(dados.telefone)) {
      novosErros.telefone = 'Telefone deve ter 10 ou 11 dígitos';
    }

    // Código do vendedor obrigatório
    if (!dados.codigo_vendedor?.trim()) {
      novosErros.codigo_vendedor = 'Código do vendedor é obrigatório';
    } else if (dados.codigo_vendedor.trim().length > 20) {
      novosErros.codigo_vendedor = 'Código deve ter no máximo 20 caracteres';
    }

    // Percentual de comissão deve estar entre 0 e 100
    if (dados.percentual_comissao !== undefined && dados.percentual_comissao !== null && dados.percentual_comissao !== '') {
      const percentual = parseFloat(dados.percentual_comissao);
      if (isNaN(percentual) || percentual < 0 || percentual > 100) {
        novosErros.percentual_comissao = 'Percentual deve estar entre 0% e 100%';
      }
    }

    // Meta mensal deve ser maior que zero se preenchida
    if (dados.meta_mensal !== undefined && dados.meta_mensal !== null && dados.meta_mensal !== '') {
      const meta = parseFloat(dados.meta_mensal);
      if (isNaN(meta) || meta < 0) {
        novosErros.meta_mensal = 'Meta mensal deve ser maior ou igual a zero';
      } else if (meta > 10000000) { // 10 milhões
        novosErros.meta_mensal = 'Meta mensal deve ser menor que R$ 10.000.000';
      }
    }

    // Desconto máximo deve estar entre 0 e 100 se preenchido
    if (dados.desconto_maximo !== undefined && dados.desconto_maximo !== null && dados.desconto_maximo !== '') {
      const desconto = parseFloat(dados.desconto_maximo);
      if (isNaN(desconto) || desconto < 0 || desconto > 100) {
        novosErros.desconto_maximo = 'Desconto máximo deve estar entre 0% e 100%';
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const limparErros = () => {
    setErros({});
  };

  const formatarCPF = (valor: string): string => {
    const numero = valor.replace(/\D/g, '');
    return numero.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarCNPJ = (valor: string): string => {
    const numero = valor.replace(/\D/g, '');
    return numero.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatarTelefone = (valor: string): string => {
    const numero = valor.replace(/\D/g, '');
    if (numero.length === 11) {
      return numero.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return numero.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const aplicarMascaraDocumento = (valor: string): string => {
    const numero = valor.replace(/\D/g, '');
    if (numero.length <= 11) {
      return formatarCPF(numero);
    }
    return formatarCNPJ(numero);
  };

  return {
    erros,
    validarFormulario,
    limparErros,
    validarCPF,
    validarCNPJ,
    validarEmail,
    validarTelefone,
    formatarCPF,
    formatarCNPJ,
    formatarTelefone,
    aplicarMascaraDocumento
  };
}