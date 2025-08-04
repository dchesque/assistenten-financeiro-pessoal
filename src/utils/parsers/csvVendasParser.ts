import type { VendaImportada } from '@/types/conciliacao';

interface ParseResult {
  vendas: VendaImportada[];
  erros: string[];
  avisos: string[];
}

export class CSVVendasParser {
  /**
   * Detecta automaticamente o formato do CSV baseado nos headers
   */
  static detectarFormato(headers: string[]): 'rede' | 'sipag' | 'desconhecido' {
    const headersLower = headers.map(h => h.toLowerCase().trim());
    
    // Padrões Rede: NSU, Data, Valor, Taxa, Bandeira, Tipo, Parcelas
    const padraoRede = ['nsu', 'data', 'valor', 'taxa', 'bandeira'];
    const matchRede = padraoRede.every(campo => 
      headersLower.some(header => header.includes(campo))
    );
    
    // Padrões Sipag: ID_Transacao, Data_Venda, Valor_Bruto, Taxa_Adquirente
    const padraoSipag = ['id_transacao', 'data_venda', 'valor_bruto', 'taxa_adquirente'];
    const matchSipag = padraoSipag.every(campo => 
      headersLower.some(header => header.includes(campo.replace('_', '')))
    );
    
    if (matchRede) return 'rede';
    if (matchSipag) return 'sipag';
    return 'desconhecido';
  }

  /**
   * Parser principal que detecta formato e processa automaticamente
   */
  static async parse(csvContent: string): Promise<ParseResult> {
    const linhas = csvContent.split('\n').filter(linha => linha.trim());
    
    if (linhas.length < 2) {
      return {
        vendas: [],
        erros: ['Arquivo CSV vazio ou sem dados'],
        avisos: []
      };
    }

    const headers = linhas[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const formato = this.detectarFormato(headers);

    switch (formato) {
      case 'rede':
        return this.parseRede(csvContent);
      case 'sipag':
        return this.parseSipag(csvContent);
      default:
        return {
          vendas: [],
          erros: [`Formato não reconhecido. Headers encontrados: ${headers.join(', ')}`],
          avisos: ['Certifique-se que o arquivo está no formato Rede ou Sipag']
        };
    }
  }

  /**
   * Parser específico para formato Rede
   * Formato esperado: NSU,Data,Valor_Bruto,Taxa,Valor_Liquido,Bandeira,Tipo,Parcelas
   */
  static async parseRede(csvContent: string): Promise<ParseResult> {
    const linhas = csvContent.split('\n').filter(linha => linha.trim());
    const vendas: VendaImportada[] = [];
    const erros: string[] = [];
    const avisos: string[] = [];

    // Mapear índices das colunas
    const headers = linhas[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const indices = {
      nsu: this.encontrarIndice(headers, ['nsu', 'numero_sequencial']),
      data: this.encontrarIndice(headers, ['data', 'data_venda', 'dt_venda']),
      valorBruto: this.encontrarIndice(headers, ['valor_bruto', 'valor', 'vl_bruto']),
      taxa: this.encontrarIndice(headers, ['taxa', 'taxa_adquirente', 'vl_taxa']),
      valorLiquido: this.encontrarIndice(headers, ['valor_liquido', 'vl_liquido']),
      bandeira: this.encontrarIndice(headers, ['bandeira', 'cartao', 'brand']),
      tipo: this.encontrarIndice(headers, ['tipo', 'tipo_transacao', 'modalidade']),
      parcelas: this.encontrarIndice(headers, ['parcelas', 'qtd_parcelas', 'installments'])
    };

    // Validar campos obrigatórios
    if (indices.nsu === -1) erros.push('Coluna NSU não encontrada');
    if (indices.data === -1) erros.push('Coluna Data não encontrada');
    if (indices.valorBruto === -1) erros.push('Coluna Valor Bruto não encontrada');

    if (erros.length > 0) {
      return { vendas, erros, avisos };
    }

    // Processar cada linha
    for (let i = 1; i < linhas.length; i++) {
      try {
        const campos = this.parsearLinha(linhas[i]);
        
        if (campos.length < Math.max(...Object.values(indices)) + 1) {
          erros.push(`Linha ${i + 1}: Número insuficiente de campos`);
          continue;
        }

        const validacao = this.validarLinha(campos, i + 1, indices);
        if (!validacao.valido) {
          erros.push(...validacao.erros);
          continue;
        }

        const valorBruto = this.converterValor(campos[indices.valorBruto]);
        const taxa = indices.taxa !== -1 ? this.converterValor(campos[indices.taxa]) : 0;
        const valorLiquido = indices.valorLiquido !== -1 
          ? this.converterValor(campos[indices.valorLiquido])
          : valorBruto - taxa;

        const venda: VendaImportada = {
          nsu: campos[indices.nsu].trim(),
          data_venda: this.converterData(campos[indices.data]),
          valor_bruto: valorBruto,
          valor_taxa: taxa,
          valor_liquido: valorLiquido,
          bandeira: this.converterBandeira(campos[indices.bandeira] || 'visa'),
          tipo_transacao: this.converterTipoTransacao(campos[indices.tipo] || 'debito'),
          parcelas: indices.parcelas !== -1 ? parseInt(campos[indices.parcelas]) || 1 : 1
        };

        vendas.push(venda);

      } catch (err) {
        erros.push(`Linha ${i + 1}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    if (vendas.length === 0 && erros.length === 0) {
      erros.push('Nenhuma venda válida encontrada no arquivo');
    }

    return { vendas, erros, avisos };
  }

  /**
   * Parser específico para formato Sipag
   * Formato esperado: ID_Transacao,Data_Venda,Valor_Bruto,Taxa_Adquirente,Bandeira,Tipo_Pagamento,Parcelas
   */
  static async parseSipag(csvContent: string): Promise<ParseResult> {
    const linhas = csvContent.split('\n').filter(linha => linha.trim());
    const vendas: VendaImportada[] = [];
    const erros: string[] = [];
    const avisos: string[] = [];

    const headers = linhas[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const indices = {
      nsu: this.encontrarIndice(headers, ['id_transacao', 'transacao_id', 'nsu']),
      data: this.encontrarIndice(headers, ['data_venda', 'data', 'dt_transacao']),
      valorBruto: this.encontrarIndice(headers, ['valor_bruto', 'valor', 'amount']),
      taxa: this.encontrarIndice(headers, ['taxa_adquirente', 'taxa', 'fee']),
      bandeira: this.encontrarIndice(headers, ['bandeira', 'marca', 'brand']),
      tipo: this.encontrarIndice(headers, ['tipo_pagamento', 'tipo', 'payment_type']),
      parcelas: this.encontrarIndice(headers, ['parcelas', 'installments', 'qtd_parcelas'])
    };

    // Validar campos obrigatórios
    if (indices.nsu === -1) erros.push('Coluna ID_Transacao não encontrada');
    if (indices.data === -1) erros.push('Coluna Data_Venda não encontrada');
    if (indices.valorBruto === -1) erros.push('Coluna Valor_Bruto não encontrada');

    if (erros.length > 0) {
      return { vendas, erros, avisos };
    }

    // Processar cada linha
    for (let i = 1; i < linhas.length; i++) {
      try {
        const campos = this.parsearLinha(linhas[i]);
        
        const validacao = this.validarLinha(campos, i + 1, indices);
        if (!validacao.valido) {
          erros.push(...validacao.erros);
          continue;
        }

        const valorBruto = this.converterValor(campos[indices.valorBruto]);
        const taxa = indices.taxa !== -1 ? this.converterValor(campos[indices.taxa]) : valorBruto * 0.035; // Estimar 3.5% se não informado

        const venda: VendaImportada = {
          nsu: campos[indices.nsu].trim(),
          data_venda: this.converterData(campos[indices.data]),
          valor_bruto: valorBruto,
          valor_taxa: taxa,
          valor_liquido: valorBruto - taxa,
          bandeira: this.converterBandeira(campos[indices.bandeira] || 'visa'),
          tipo_transacao: this.converterTipoTransacao(campos[indices.tipo] || 'debito'),
          parcelas: indices.parcelas !== -1 ? parseInt(campos[indices.parcelas]) || 1 : 1
        };

        vendas.push(venda);

      } catch (err) {
        erros.push(`Linha ${i + 1}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    return { vendas, erros, avisos };
  }

  /**
   * Valida uma linha individual
   */
  static validarLinha(campos: string[], numeroLinha: number, indices: any): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    // Validar NSU
    if (!campos[indices.nsu] || campos[indices.nsu].trim() === '') {
      erros.push(`Linha ${numeroLinha}: NSU vazio`);
    }

    // Validar valor
    const valor = this.converterValor(campos[indices.valorBruto]);
    if (isNaN(valor) || valor <= 0) {
      erros.push(`Linha ${numeroLinha}: Valor inválido (${campos[indices.valorBruto]})`);
    }

    // Validar data
    try {
      const data = this.converterData(campos[indices.data]);
      if (isNaN(data.getTime())) {
        erros.push(`Linha ${numeroLinha}: Data inválida (${campos[indices.data]})`);
      }
    } catch {
      erros.push(`Linha ${numeroLinha}: Formato de data inválido (${campos[indices.data]})`);
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }

  /**
   * Utilitários de conversão
   */
  static converterData(dataStr: string): Date {
    const limpo = dataStr.trim().replace(/"/g, '');
    
    // Tentar formatos: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
    const formatos = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/,   // YYYY-MM-DD
      /^(\d{2})-(\d{2})-(\d{4})$/    // DD-MM-YYYY
    ];

    for (const formato of formatos) {
      const match = limpo.match(formato);
      if (match) {
        if (formato === formatos[0] || formato === formatos[2]) {
          // DD/MM/YYYY ou DD-MM-YYYY
          const [, dia, mes, ano] = match;
          return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        } else {
          // YYYY-MM-DD
          const [, ano, mes, dia] = match;
          return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        }
      }
    }

    throw new Error(`Formato de data não reconhecido: ${dataStr}`);
  }

  static converterValor(valorStr: string): number {
    const limpo = valorStr.trim()
      .replace(/"/g, '')
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')  // Remover pontos dos milhares
      .replace(',', '.'); // Converter vírgula decimal para ponto

    const valor = parseFloat(limpo);
    return isNaN(valor) ? 0 : valor;
  }

  static converterBandeira(bandeiraStr: string): string {
    const limpo = bandeiraStr.trim().toLowerCase();
    const mapeamento: { [key: string]: string } = {
      'visa': 'visa',
      'master': 'mastercard',
      'mastercard': 'mastercard',
      'elo': 'elo',
      'hiper': 'hipercard',
      'hipercard': 'hipercard',
      'amex': 'american_express',
      'american express': 'american_express',
      'diners': 'diners'
    };

    for (const [chave, valor] of Object.entries(mapeamento)) {
      if (limpo.includes(chave)) {
        return valor;
      }
    }

    return 'visa'; // Padrão
  }

  static converterTipoTransacao(tipoStr: string): string {
    const limpo = tipoStr.trim().toLowerCase();
    
    if (limpo.includes('débito') || limpo.includes('debito') || limpo.includes('debit')) {
      return 'debito';
    }
    if (limpo.includes('crédito') || limpo.includes('credito') || limpo.includes('credit')) {
      if (limpo.includes('parcelado') || limpo.includes('installment')) {
        return 'credito_parcelado';
      }
      return 'credito_vista';
    }

    return 'debito'; // Padrão
  }

  /**
   * Utilitários auxiliares
   */
  private static encontrarIndice(headers: string[], possiveisNomes: string[]): number {
    for (const nome of possiveisNomes) {
      const indice = headers.findIndex(h => h.includes(nome));
      if (indice !== -1) return indice;
    }
    return -1;
  }

  private static parsearLinha(linha: string): string[] {
    // Parser CSV mais robusto que lida com aspas e vírgulas dentro de campos
    const campos: string[] = [];
    let campoAtual = '';
    let dentroAspas = false;
    
    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];
      
      if (char === '"') {
        dentroAspas = !dentroAspas;
      } else if (char === ',' && !dentroAspas) {
        campos.push(campoAtual.trim());
        campoAtual = '';
      } else {
        campoAtual += char;
      }
    }
    
    campos.push(campoAtual.trim());
    return campos;
  }
}

// Funções de conveniência para compatibilidade
export const parseCSVVendas = (csvContent: string) => CSVVendasParser.parse(csvContent);
export const validarArquivoCSV = (arquivo: File) => ({ valido: true });