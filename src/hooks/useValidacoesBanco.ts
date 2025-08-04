import { useState, useCallback } from 'react';
import { Banco } from '../types/banco';

export interface ErrosValidacao {
  nome: string[];
  codigo_banco: string[];
  agencia: string[];
  conta: string[];
  digito_verificador: string[];
  url_ofx: string[];
  email: string[];
  telefone: string[];
}

export const useValidacoesBanco = (bancos: Banco[], bancoAtual?: Banco | null) => {
  const [erros, setErros] = useState<ErrosValidacao>({
    nome: [],
    codigo_banco: [],
    agencia: [],
    conta: [],
    digito_verificador: [],
    url_ofx: [],
    email: [],
    telefone: []
  });

  const validarCampo = useCallback((campo: keyof ErrosValidacao, valor: any, formData?: any) => {
    const errosCampo: string[] = [];

    switch (campo) {
      case 'nome':
        if (!valor || valor.trim().length < 3) {
          errosCampo.push('Nome do banco deve ter pelo menos 3 caracteres');
        }
        break;

      case 'codigo_banco':
        if (!valor || !/^\d{3}$/.test(valor)) {
          errosCampo.push('Código deve ter exatamente 3 dígitos');
        } else {
          // Verificar unicidade
          const existeOutro = bancos.some(b => 
            b.codigo_banco === valor && 
            b.id !== bancoAtual?.id
          );
          if (existeOutro) {
            errosCampo.push('Código do banco já existe');
          }
        }
        break;

      case 'agencia':
        if (!valor || !/^\d{4,5}(-\d)?$/.test(valor)) {
          errosCampo.push('Agência deve ter 4 ou 5 dígitos (ex: 1234 ou 1234-5)');
        }
        break;

      case 'conta':
        if (!valor || !/^\d{5,10}(-\d)?$/.test(valor)) {
          errosCampo.push('Número da conta deve ter entre 5 e 10 dígitos');
        }
        break;

      case 'digito_verificador':
        if (!valor || !/^\d{1,2}$/.test(valor)) {
          errosCampo.push('Dígito verificador deve ter 1 ou 2 dígitos');
        }
        break;

      case 'url_ofx':
        if (valor && !/^https?:\/\/.+/.test(valor)) {
          errosCampo.push('URL OFX deve começar com http:// ou https://');
        }
        break;

      case 'email':
        if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
          errosCampo.push('Email inválido');
        }
        break;

      case 'telefone':
        if (valor && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(valor)) {
          errosCampo.push('Telefone deve estar no formato (11) 99999-9999');
        }
        break;
    }

    setErros(prev => ({
      ...prev,
      [campo]: errosCampo
    }));

    return errosCampo;
  }, [bancos, bancoAtual]);

  const validarTodos = useCallback((formData: any) => {
    const novosErros: ErrosValidacao = {
      nome: [],
      codigo_banco: [],
      agencia: [],
      conta: [],
      digito_verificador: [],
      url_ofx: [],
      email: [],
      telefone: []
    };

    // Validar cada campo
    Object.keys(novosErros).forEach(campo => {
      const errosCampo = validarCampo(campo as keyof ErrosValidacao, formData[campo], formData);
      novosErros[campo as keyof ErrosValidacao] = errosCampo;
    });

    setErros(novosErros);
    
    // Retornar se há algum erro
    return Object.values(novosErros).some(errosCampo => errosCampo.length > 0);
  }, [validarCampo]);

  const limparErros = useCallback(() => {
    setErros({
      nome: [],
      codigo_banco: [],
      agencia: [],
      conta: [],
      digito_verificador: [],
      url_ofx: [],
      email: [],
      telefone: []
    });
  }, []);

  const temErros = Object.values(erros).some(errosCampo => errosCampo.length > 0);

  return {
    erros,
    validarCampo,
    validarTodos,
    limparErros,
    temErros
  };
};