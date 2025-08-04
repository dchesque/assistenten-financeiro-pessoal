// Serviço de validação simplificado para lançamento em lote
export const ValidationServiceSimplificado = {
  // Validações básicas
  required(value: any, fieldName: string): string | null {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} é obrigatório`;
    }
    return null;
  },

  valorPositivo(value: number, fieldName: string): string | null {
    if (value <= 0) {
      return `${fieldName} deve ser maior que zero`;
    }
    return null;
  },

  dataFutura(data: string, fieldName: string): string | null {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataInformada = new Date(data);
    
    if (dataInformada < hoje) {
      return `${fieldName} não pode ser no passado`;
    }
    return null;
  },

  // Validação de lote simplificada
  validarLote(parcelas: any[]): { valido: boolean; erros: string[] } {
    const erros: string[] = [];
    
    if (!parcelas || parcelas.length === 0) {
      erros.push('Nenhuma parcela foi definida');
      return { valido: false, erros };
    }

    if (parcelas.length < 2) {
      erros.push('Deve ter pelo menos 2 parcelas');
    }

    if (parcelas.length > 100) {
      erros.push('Máximo de 100 parcelas permitidas');
    }
    
    const valorTotal = parcelas.reduce((acc, p) => acc + (p.valor || 0), 0);
    if (valorTotal > 10000000) {
      erros.push('Valor total excede R$ 10.000.000,00');
    }
    
    const parcelasInvalidas = parcelas.filter(p => (p.valor || 0) <= 0);
    if (parcelasInvalidas.length > 0) {
      erros.push('Todas as parcelas devem ter valor maior que zero');
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    parcelas.forEach((parcela, index) => {
      if (!parcela.data_vencimento) {
        erros.push(`Parcela ${index + 1}: Data de vencimento é obrigatória`);
      } else {
        const dataVencimento = new Date(parcela.data_vencimento);
        if (dataVencimento < hoje) {
          erros.push(`Parcela ${index + 1}: Data não pode ser no passado`);
        }
      }
    });

    return { valido: erros.length === 0, erros };
  },

  // Validação de cheques simplificada
  validarCheques(numerosCheques: string[]): { valido: boolean; problemas: string[] } {
    const problemas: string[] = [];
    
    // Validar formato
    numerosCheques.forEach(num => {
      if (!/^\d{1,8}$/.test(num)) {
        problemas.push(`Número ${num} tem formato inválido`);
      }
    });
    
    // Validar duplicatas
    const duplicatas = numerosCheques.filter((num, index) => 
      numerosCheques.indexOf(num) !== index
    );
    if (duplicatas.length > 0) {
      problemas.push(`Números duplicados: ${duplicatas.join(', ')}`);
    }
    
    return { valido: problemas.length === 0, problemas };
  }
};