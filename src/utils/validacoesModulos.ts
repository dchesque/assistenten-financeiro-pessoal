import { toast } from 'sonner';
import { validateCPF, validateCNPJ } from './validators';

// Validações específicas para Contas a Pagar
export const validacoesContasPagar = {
  validarDataVencimento: (dataVencimento: string, dataEmissao?: string): boolean => {
    if (!dataVencimento) {
      toast.error('Data de vencimento é obrigatória');
      return false;
    }

    const vencimento = new Date(dataVencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dataEmissao) {
      const emissao = new Date(dataEmissao);
      if (vencimento < emissao) {
        toast.error('Data de vencimento não pode ser anterior à data de emissão');
        return false;
      }
    } else {
      // Para novas contas, não permitir vencimento no passado
      if (vencimento < hoje) {
        toast.error('Data de vencimento não pode ser passada para novas contas');
        return false;
      }
    }

    return true;
  },

  validarValor: (valor: number): boolean => {
    if (!valor || valor < 0.01) {
      toast.error('Valor mínimo é R$ 0,01');
      return false;
    }
    
    if (valor > 999999999.99) {
      toast.error('Valor máximo é R$ 999.999.999,99');
      return false;
    }

    return true;
  },

  validarDescricao: (descricao: string): boolean => {
    if (!descricao || descricao.trim().length < 3) {
      toast.error('Descrição deve ter no mínimo 3 caracteres');
      return false;
    }

    if (descricao.length > 500) {
      toast.error('Descrição deve ter no máximo 500 caracteres');
      return false;
    }

    return true;
  }
};

// Validações específicas para Fornecedores
export const validacoesFornecedores = {
  validarDocumentoUnico: async (documento: string, fornecedorId?: number): Promise<boolean> => {
    // Simular verificação de unicidade - em produção seria uma consulta ao banco
    const documentoLimpo = documento.replace(/\D/g, '');
    
    if (documentoLimpo.length === 11) {
      if (!validateCPF(documento)) {
        toast.error('CPF inválido');
        return false;
      }
    } else if (documentoLimpo.length === 14) {
      if (!validateCNPJ(documento)) {
        toast.error('CNPJ inválido');
        return false;
      }
    } else {
      toast.error('Documento deve ser um CPF ou CNPJ válido');
      return false;
    }

    // Simular verificação de unicidade
    // TODO: Implementar consulta real ao banco
    const existeOutroFornecedor = Math.random() < 0.1; // 10% chance de conflito para teste
    
    if (existeOutroFornecedor && !fornecedorId) {
      toast.error('CNPJ/CPF já cadastrado para outro fornecedor');
      return false;
    }

    return true;
  },

  validarEmail: (email: string): boolean => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.warning('Email inválido');
      return false;
    }
    return true;
  },

  validarTelefone: (telefone: string): boolean => {
    if (telefone) {
      const telefoneNumeros = telefone.replace(/\D/g, '');
      if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
        toast.warning('Telefone deve ter formato brasileiro válido');
        return false;
      }
    }
    return true;
  }
};

// Validações específicas para Categorias
export const validacoesCategorias = {
  validarNomeUnico: async (nome: string, categoriaId?: number): Promise<boolean> => {
    if (!nome || nome.trim().length < 2) {
      toast.error('Nome da categoria deve ter no mínimo 2 caracteres');
      return false;
    }

    // Simular verificação de unicidade
    const existeOutraCategoria = Math.random() < 0.15; // 15% chance de conflito para teste
    
    if (existeOutraCategoria && !categoriaId) {
      toast.error('Já existe uma categoria com este nome');
      return false;
    }

    return true;
  },

  validarExclusao: async (categoriaId: number): Promise<boolean> => {
    // Simular verificação de vínculos
    const temContasVinculadas = Math.random() < 0.3; // 30% chance de ter vínculos para teste
    
    if (temContasVinculadas) {
      toast.error('Categoria possui vínculos', {
        description: 'Não é possível excluir uma categoria que possui contas vinculadas'
      });
      return false;
    }

    return true;
  }
};

// Validações específicas para Valores
export const validacoesValores = {
  validarFormatoBrasileiro: (valor: string): boolean => {
    // Verificar se o valor está no formato brasileiro (com vírgula)
    const formatoValido = /^\d{1,3}(\.\d{3})*,\d{2}$|^\d+,\d{2}$|^\d+$/.test(valor);
    
    if (!formatoValido) {
      toast.warning('Use o formato brasileiro (ex: 1.234,56)');
      return false;
    }

    return true;
  },

  validarLimites: (valor: number): boolean => {
    if (valor < 0.01) {
      toast.error('Valor mínimo é R$ 0,01');
      return false;
    }

    if (valor > 999999999.99) {
      toast.error('Valor máximo é R$ 999.999.999,99');
      return false;
    }

    return true;
  }
};

// Função utilitária para executar todas as validações de um formulário
export const executarValidacoes = async (
  validacoes: Array<() => Promise<boolean> | boolean>
): Promise<boolean> => {
  let todasValidas = true;

  for (const validacao of validacoes) {
    const resultado = await validacao();
    if (!resultado) {
      todasValidas = false;
    }
  }

  if (!todasValidas) {
    toast.warning('Corrija os campos destacados');
  }

  return todasValidas;
};