// Utilitários de validação para vendedores
import { Vendedor, NovoVendedor } from '@/types/vendedor';

export interface ValidacaoResult {
  valido: boolean;
  erros: string[];
  avisos: string[];
}

// Validações de negócio para vendedores
export const validarVendedorCompleto = (vendedor: NovoVendedor | Partial<Vendedor>): ValidacaoResult => {
  const erros: string[] = [];
  const avisos: string[] = [];

  // Nome obrigatório
  if (!vendedor.nome?.trim()) {
    erros.push('Nome é obrigatório');
  } else if (vendedor.nome.trim().length < 2) {
    erros.push('Nome deve ter pelo menos 2 caracteres');
  } else if (vendedor.nome.trim().length > 100) {
    erros.push('Nome deve ter no máximo 100 caracteres');
  }

  // Código do vendedor
  if (!vendedor.codigo_vendedor?.trim()) {
    erros.push('Código do vendedor é obrigatório');
  } else if (!/^[A-Z0-9]+$/.test(vendedor.codigo_vendedor.trim())) {
    avisos.push('Código do vendedor deve conter apenas letras maiúsculas e números');
  }

  // Documento
  if (!vendedor.documento?.trim()) {
    erros.push('Documento é obrigatório');
  } else {
    const documento = vendedor.documento.replace(/\D/g, '');
    if (documento.length !== 11 && documento.length !== 14) {
      erros.push('Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)');
    }
  }

  // Email
  if (vendedor.email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(vendedor.email)) {
      erros.push('Email inválido');
    } else if (vendedor.email.length > 255) {
      erros.push('Email deve ter no máximo 255 caracteres');
    }
  }

  // Telefone
  if (vendedor.telefone?.trim()) {
    const telefone = vendedor.telefone.replace(/\D/g, '');
    if (telefone.length < 10 || telefone.length > 11) {
      erros.push('Telefone deve ter 10 ou 11 dígitos');
    }
  }

  // Percentual de comissão
  if (vendedor.percentual_comissao !== undefined && vendedor.percentual_comissao !== null) {
    const percentual = Number(vendedor.percentual_comissao);
    if (isNaN(percentual) || percentual < 0 || percentual > 100) {
      erros.push('Percentual de comissão deve estar entre 0% e 100%');
    } else if (percentual > 50) {
      avisos.push('Percentual de comissão muito alto (acima de 50%)');
    }
  }

  // Meta mensal
  if (vendedor.meta_mensal !== undefined && vendedor.meta_mensal !== null) {
    const meta = Number(vendedor.meta_mensal);
    if (isNaN(meta) || meta < 0) {
      erros.push('Meta mensal deve ser maior ou igual a zero');
    } else if (meta > 10000000) {
      erros.push('Meta mensal deve ser menor que R$ 10.000.000');
    } else if (meta === 0) {
      avisos.push('Vendedor sem meta mensal definida');
    }
  }

  // Desconto máximo
  if (vendedor.desconto_maximo !== undefined && vendedor.desconto_maximo !== null) {
    const desconto = Number(vendedor.desconto_maximo);
    if (isNaN(desconto) || desconto < 0 || desconto > 100) {
      erros.push('Desconto máximo deve estar entre 0% e 100%');
    } else if (desconto > 30) {
      avisos.push('Desconto máximo muito alto (acima de 30%)');
    }
  }

  // Data de admissão
  if (vendedor.data_admissao) {
    const dataAdmissao = new Date(vendedor.data_admissao);
    const hoje = new Date();
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(hoje.getFullYear() - 1);

    if (dataAdmissao > hoje) {
      erros.push('Data de admissão não pode ser futura');
    } else if (dataAdmissao < umAnoAtras) {
      avisos.push('Data de admissão muito antiga (mais de 1 ano)');
    }
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos
  };
};

// Validar se vendedor pode ser excluído
export const validarExclusaoVendedor = async (vendedorId: number): Promise<ValidacaoResult> => {
  const erros: string[] = [];
  const avisos: string[] = [];

  try {
    // Esta validação seria feita no hook, mas podemos definir a lógica aqui
    // Por enquanto, apenas estrutura para futuras validações
    avisos.push('Verificar se vendedor possui vendas vinculadas');
    
    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  } catch (error) {
    erros.push('Erro ao validar exclusão do vendedor');
    return {
      valido: false,
      erros,
      avisos
    };
  }
};

// Validações de consistência de dados
export const validarConsistenciaVendedor = (vendedor: Vendedor): ValidacaoResult => {
  const erros: string[] = [];
  const avisos: string[] = [];

  // Verificar se estatísticas fazem sentido
  if (vendedor.total_vendas && vendedor.total_vendas > 0) {
    if (!vendedor.valor_total_vendido || vendedor.valor_total_vendido <= 0) {
      avisos.push('Vendedor tem vendas registradas mas valor total é zero');
    }

    if (!vendedor.data_ultima_venda) {
      avisos.push('Vendedor tem vendas mas não tem data da última venda');
    }

    // Ticket médio vs total vendido
    if (vendedor.ticket_medio && vendedor.valor_total_vendido) {
      const ticketCalculado = vendedor.valor_total_vendido / vendedor.total_vendas;
      const diferenca = Math.abs(ticketCalculado - vendedor.ticket_medio);
      if (diferenca > 10) { // Diferença significativa
        avisos.push('Ticket médio não confere com valor total vendido');
      }
    }
  }

  // Verificar comissão vs vendas
  if (vendedor.comissao_total_recebida && vendedor.valor_total_vendido) {
    const percentualReal = (vendedor.comissao_total_recebida / vendedor.valor_total_vendido) * 100;
    if (vendedor.percentual_comissao && Math.abs(percentualReal - vendedor.percentual_comissao) > 5) {
      avisos.push('Comissão total não confere com percentual configurado');
    }
  }

  // Verificar status vs ativo
  if (vendedor.status === 'ativo' && !vendedor.ativo) {
    erros.push('Inconsistência: status ativo mas campo ativo é false');
  }
  if (vendedor.status === 'inativo' && vendedor.ativo) {
    erros.push('Inconsistência: status inativo mas campo ativo é true');
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos
  };
};

// Sugestões de melhorias para vendedor
export const gerarSugestoesVendedor = (vendedor: Vendedor): string[] => {
  const sugestoes: string[] = [];

  // Sugestões baseadas em performance
  if (!vendedor.meta_mensal || vendedor.meta_mensal === 0) {
    sugestoes.push('Definir meta mensal para melhor acompanhamento');
  }

  if (!vendedor.foto_url) {
    sugestoes.push('Adicionar foto do vendedor para melhor identificação');
  }

  if (!vendedor.email) {
    sugestoes.push('Adicionar email para comunicação');
  }

  if (!vendedor.telefone && !vendedor.whatsapp) {
    sugestoes.push('Adicionar telefone ou WhatsApp para contato');
  }

  if (vendedor.percentual_comissao === 0) {
    sugestoes.push('Considerar definir percentual de comissão para incentivar vendas');
  }

  if (!vendedor.logradouro) {
    sugestoes.push('Preencher endereço para documentação');
  }

  // Sugestões baseadas em desempenho
  if (vendedor.total_vendas === 0) {
    sugestoes.push('Vendedor ainda não realizou vendas - considerar treinamento');
  }

  if (vendedor.valor_total_vendido && vendedor.meta_mensal && 
      vendedor.valor_total_vendido < vendedor.meta_mensal * 0.5) {
    sugestoes.push('Performance abaixo de 50% da meta - considerar ações de melhoria');
  }

  return sugestoes;
};

// Validação de código único
export const validarCodigoUnico = (codigo: string, vendedores: Vendedor[], vendedorAtualId?: number): boolean => {
  return !vendedores.some(v => 
    v.codigo_vendedor.toLowerCase() === codigo.toLowerCase() && 
    v.id !== vendedorAtualId
  );
};

// Validação de documento único
export const validarDocumentoUnico = (documento: string, vendedores: Vendedor[], vendedorAtualId?: number): boolean => {
  const documentoLimpo = documento.replace(/\D/g, '');
  return !vendedores.some(v => 
    v.documento.replace(/\D/g, '') === documentoLimpo && 
    v.id !== vendedorAtualId
  );
};