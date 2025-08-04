import type { RecebimentoImportado } from '@/types/conciliacao';

interface ParseResult {
  recebimentos: RecebimentoImportado[];
  erros: string[];
  avisos: string[];
}

export class OFXRecebimentosParser {
  /**
   * Parser principal OFX para extrair recebimentos bancários
   */
  static async parseOFX(ofxContent: string): Promise<ParseResult> {
    const recebimentos: RecebimentoImportado[] = [];
    const erros: string[] = [];
    const avisos: string[] = [];

    try {
      // Validar estrutura básica do OFX
      if (!this.validarEstruturaOFX(ofxContent)) {
        erros.push('Arquivo OFX com estrutura inválida');
        return { recebimentos, erros, avisos };
      }

      // Extrair todas as transações
      const transacoes = this.extrairTransacoes(ofxContent);
      
      if (transacoes.length === 0) {
        avisos.push('Nenhuma transação encontrada no arquivo OFX');
        return { recebimentos, erros, avisos };
      }

      // Filtrar apenas recebimentos de maquininhas
      let recebimentosFiltrados = 0;
      transacoes.forEach((transacao, index) => {
        try {
          // Apenas valores positivos (entradas)
          if (transacao.valor <= 0) {
            return;
          }

          // Identificar se é recebimento de maquininha
          if (this.identificarRecebimentoMaquininha(transacao.descricao)) {
            const recebimento: RecebimentoImportado = {
              data_recebimento: transacao.data,
              valor: transacao.valor,
              descricao: this.limparDescricao(transacao.descricao),
              documento: transacao.fitid || `OFX-${index}`,
              tipo_operacao: this.identificarTipoOperacao(transacao.descricao)
            };

            recebimentos.push(recebimento);
            recebimentosFiltrados++;
          }
        } catch (err) {
          erros.push(`Erro ao processar transação ${index + 1}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      });

      if (recebimentosFiltrados === 0) {
        avisos.push('Nenhum recebimento de maquininha identificado no arquivo');
      } else {
        avisos.push(`${recebimentosFiltrados} recebimentos de maquininha encontrados de ${transacoes.length} transações totais`);
      }

    } catch (err) {
      erros.push(`Erro ao processar arquivo OFX: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }

    return { recebimentos, erros, avisos };
  }

  /**
   * Parser alternativo para CSV bancário
   */
  static async parseCSVBancario(csvContent: string): Promise<ParseResult> {
    const recebimentos: RecebimentoImportado[] = [];
    const erros: string[] = [];
    const avisos: string[] = [];

    try {
      const linhas = csvContent.split('\n').filter(linha => linha.trim());
      
      if (linhas.length < 2) {
        erros.push('Arquivo CSV vazio ou sem dados');
        return { recebimentos, erros, avisos };
      }

      // Identificar colunas
      const headers = linhas[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const indices = {
        data: this.encontrarIndiceCSV(headers, ['data', 'dt_movimentacao', 'date']),
        valor: this.encontrarIndiceCSV(headers, ['valor', 'amount', 'vl_movimentacao']),
        descricao: this.encontrarIndiceCSV(headers, ['descricao', 'historic', 'memo', 'description']),
        tipo: this.encontrarIndiceCSV(headers, ['tipo', 'type', 'operacao', 'tipo_operacao']),
        documento: this.encontrarIndiceCSV(headers, ['documento', 'doc', 'reference', 'fitid'])
      };

      // Validar campos obrigatórios
      if (indices.data === -1) erros.push('Coluna Data não encontrada');
      if (indices.valor === -1) erros.push('Coluna Valor não encontrada');
      if (indices.descricao === -1) erros.push('Coluna Descrição não encontrada');

      if (erros.length > 0) {
        return { recebimentos, erros, avisos };
      }

      // Processar linhas
      for (let i = 1; i < linhas.length; i++) {
        try {
          const campos = this.parsearLinhaCSV(linhas[i]);
          
          if (campos.length < Math.max(...Object.values(indices)) + 1) {
            continue; // Pular linha incompleta
          }

          const valor = this.converterValor(campos[indices.valor]);
          const descricao = campos[indices.descricao].trim();

          // Apenas valores positivos e recebimentos de maquininha
          if (valor > 0 && this.identificarRecebimentoMaquininha(descricao)) {
            const recebimento: RecebimentoImportado = {
              data_recebimento: this.converterData(campos[indices.data]),
              valor,
              descricao: this.limparDescricao(descricao),
              documento: indices.documento !== -1 ? campos[indices.documento] : `CSV-${i}`,
              tipo_operacao: indices.tipo !== -1 
                ? this.identificarTipoOperacao(campos[indices.tipo])
                : this.identificarTipoOperacao(descricao)
            };

            recebimentos.push(recebimento);
          }

        } catch (err) {
          erros.push(`Erro na linha ${i + 1}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
      }

    } catch (err) {
      erros.push(`Erro ao processar CSV bancário: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }

    return { recebimentos, erros, avisos };
  }

  /**
   * Identifica se é recebimento de maquininha baseado na descrição
   */
  static identificarRecebimentoMaquininha(descricao: string): boolean {
    const descLower = descricao.toLowerCase();
    
    // Padrões conhecidos de operadoras
    const padroesMaquininha = [
      'rede s.a',
      'rede s/a',
      'redecard',
      'sipag',
      'stone',
      'pagseguro',
      'mercado pago',
      'cielo',
      'getnet',
      'adquirente',
      'cartao',
      'credito',
      'debito',
      'tef',
      'ted cartao',
      'rec cartao',
      'vendas cartao',
      'liquidacao',
      'antecipacao'
    ];

    return padroesMaquininha.some(padrao => descLower.includes(padrao));
  }

  /**
   * Mapeia descrição para operadora
   */
  static mapearOperadora(descricao: string): 'rede' | 'sipag' | 'outros' {
    const descLower = descricao.toLowerCase();
    
    if (descLower.includes('rede') || descLower.includes('redecard')) {
      return 'rede';
    }
    if (descLower.includes('sipag')) {
      return 'sipag';
    }
    
    return 'outros';
  }

  /**
   * Filtra apenas movimentações de entrada relacionadas a maquininhas
   */
  static filtrarMovimentacoesEntrada(movimentacoes: any[]): RecebimentoImportado[] {
    return movimentacoes
      .filter(mov => mov.valor > 0) // Apenas entradas
      .filter(mov => this.identificarRecebimentoMaquininha(mov.descricao))
      .map(mov => ({
        data_recebimento: mov.data,
        valor: mov.valor,
        descricao: this.limparDescricao(mov.descricao),
        documento: mov.documento || mov.fitid || '',
        tipo_operacao: this.identificarTipoOperacao(mov.descricao)
      }));
  }

  /**
   * Métodos privados auxiliares
   */
  private static validarEstruturaOFX(content: string): boolean {
    const indicadoresOFX = [
      '<OFX>',
      '<OFX ',
      '<BANKMSGSRSV1>',
      '<STMTRS>',
      'OFXHEADER'
    ];

    return indicadoresOFX.some(indicador => content.includes(indicador));
  }

  private static extrairTransacoes(ofxContent: string): Array<{
    valor: number;
    data: Date;
    descricao: string;
    fitid?: string;
    tipo?: string;
  }> {
    const transacoes: Array<{
      valor: number;
      data: Date;
      descricao: string;
      fitid?: string;
      tipo?: string;
    }> = [];

    // Extrair todas as transações STMTTRN
    const stmtTrnRegex = /<STMTTRN>(.*?)<\/STMTTRN>/gs;
    const matches = ofxContent.matchAll(stmtTrnRegex);

    for (const match of matches) {
      const trn = match[1];
      
      try {
        const trnamt = trn.match(/<TRNAMT>(.*?)<\/TRNAMT>/)?.[1];
        const dtposted = trn.match(/<DTPOSTED>(.*?)<\/DTPOSTED>/)?.[1];
        const memo = trn.match(/<MEMO>(.*?)<\/MEMO>/)?.[1];
        const name = trn.match(/<NAME>(.*?)<\/NAME>/)?.[1];
        const trntype = trn.match(/<TRNTYPE>(.*?)<\/TRNTYPE>/)?.[1];
        const fitid = trn.match(/<FITID>(.*?)<\/FITID>/)?.[1];

        if (trnamt && dtposted) {
          const valor = parseFloat(trnamt);
          const descricao = memo || name || 'Transação importada';
          
          transacoes.push({
            valor: Math.abs(valor), // Sempre valor absoluto, depois filtrar por entrada
            data: this.formatarDataOFX(dtposted),
            descricao,
            fitid,
            tipo: trntype
          });
        }
      } catch (err) {
        console.warn('Erro ao processar transação OFX:', err);
      }
    }

    return transacoes;
  }

  private static formatarDataOFX(dataOFX: string): Date {
    // OFX usa formato YYYYMMDD ou YYYYMMDDHHMMSS
    const limpo = dataOFX.trim();
    const ano = parseInt(limpo.substring(0, 4));
    const mes = parseInt(limpo.substring(4, 6)) - 1; // JS usa 0-11 para meses
    const dia = parseInt(limpo.substring(6, 8));
    
    return new Date(ano, mes, dia);
  }

  private static converterData(dataStr: string): Date {
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

  private static converterValor(valorStr: string): number {
    const limpo = valorStr.trim()
      .replace(/"/g, '')
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')  // Remover pontos dos milhares
      .replace(',', '.'); // Converter vírgula decimal para ponto

    const valor = parseFloat(limpo);
    return isNaN(valor) ? 0 : valor;
  }

  private static limparDescricao(descricao: string): string {
    return descricao
      .trim()
      .replace(/\s+/g, ' ') // Normalizar espaços
      .replace(/[^\w\s\-\.]/g, '') // Remover caracteres especiais
      .substring(0, 200); // Limitar tamanho
  }

  private static identificarTipoOperacao(descricao: string): string {
    const descLower = descricao.toLowerCase();
    
    if (descLower.includes('ted') || descLower.includes('transferencia')) {
      return 'TED';
    }
    if (descLower.includes('doc')) {
      return 'DOC';
    }
    if (descLower.includes('pix')) {
      return 'PIX';
    }
    if (descLower.includes('antecipacao')) {
      return 'ANTECIPACAO';
    }
    
    return 'CREDITO'; // Padrão
  }

  private static encontrarIndiceCSV(headers: string[], possiveisNomes: string[]): number {
    for (const nome of possiveisNomes) {
      const indice = headers.findIndex(h => h.includes(nome));
      if (indice !== -1) return indice;
    }
    return -1;
  }

  private static parsearLinhaCSV(linha: string): string[] {
    // Parser CSV que lida com aspas e vírgulas dentro de campos
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