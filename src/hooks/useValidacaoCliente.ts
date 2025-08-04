
import { useState, useEffect } from 'react';
import { Cliente } from '@/types/cliente';

interface ErrosValidacao {
  nome?: string;
  documento?: string;
  telefone?: string;
  email?: string;
  cep?: string;
}

export const useValidacaoCliente = () => {
  const [erros, setErros] = useState<ErrosValidacao>({});

  const validarCPF = (cpf: string): boolean => {
    const numeros = cpf.replace(/\D/g, '');
    
    if (numeros.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numeros)) return false;
    
    // Validação do primeiro dígito
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(numeros[i]) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(numeros[9]) !== digito1) return false;
    
    // Validação do segundo dígito
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(numeros[i]) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    return parseInt(numeros[10]) === digito2;
  };

  const validarCNPJ = (cnpj: string): boolean => {
    const numeros = cnpj.replace(/\D/g, '');
    
    if (numeros.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(numeros)) return false;
    
    // Validação do primeiro dígito
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(numeros[i]) * pesos1[i];
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(numeros[12]) !== digito1) return false;
    
    // Validação do segundo dígito
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    soma = 0;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(numeros[i]) * pesos2[i];
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    return parseInt(numeros[13]) === digito2;
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarTelefone = (telefone: string): boolean => {
    const numeros = telefone.replace(/\D/g, '');
    return numeros.length >= 10 && numeros.length <= 11;
  };

  const validarCEP = (cep: string): boolean => {
    const numeros = cep.replace(/\D/g, '');
    return numeros.length === 8;
  };

  const validarCampo = (campo: keyof Cliente, valor: string, tipo: 'PF' | 'PJ') => {
    const novosErros = { ...erros };

    switch (campo) {
      case 'nome':
        if (!valor || valor.trim().length < 2) {
          novosErros.nome = 'Nome deve ter pelo menos 2 caracteres';
        } else if (valor.trim().length > 100) {
          novosErros.nome = 'Nome não pode ter mais de 100 caracteres';
        } else {
          delete novosErros.nome;
        }
        break;

      case 'documento':
        if (!valor) {
          novosErros.documento = `${tipo === 'PF' ? 'CPF' : 'CNPJ'} é obrigatório`;
        } else if (tipo === 'PF' && !validarCPF(valor)) {
          novosErros.documento = 'CPF inválido';
        } else if (tipo === 'PJ' && !validarCNPJ(valor)) {
          novosErros.documento = 'CNPJ inválido';
        } else {
          delete novosErros.documento;
        }
        break;

      case 'telefone':
        if (valor && !validarTelefone(valor)) {
          novosErros.telefone = 'Telefone inválido. Use formato (11) 99999-9999';
        } else {
          delete novosErros.telefone;
        }
        break;

      case 'email':
        if (valor && !validarEmail(valor)) {
          novosErros.email = 'Email inválido';
        } else {
          delete novosErros.email;
        }
        break;

      case 'cep':
        if (valor && !validarCEP(valor)) {
          novosErros.cep = 'CEP inválido. Use formato 00000-000';
        } else {
          delete novosErros.cep;
        }
        break;
    }

    setErros(novosErros);
  };

  const limparErros = () => {
    setErros({});
  };

  const temErros = Object.keys(erros).length > 0;

  return {
    erros,
    validarCampo,
    limparErros,
    temErros
  };
};
