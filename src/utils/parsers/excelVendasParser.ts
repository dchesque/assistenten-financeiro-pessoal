import * as XLSX from 'xlsx';

export interface VendaExcelData {
  nsu: string;
  data_venda: string;
  data_recebimento: string;
  valor_bruto: number;
  valor_liquido: number;
  valor_taxa: number;
  taxa_percentual_cobrada: number;
  bandeira: string;
  tipo_transacao: string;
  parcelas: number;
}

export interface ExcelParseResult {
  vendas: VendaExcelData[];
  erros: string[];
  avisos: string[];
  linhasValidas: number;
  totalLinhas: number;
  colunasMapeadas: Record<string, string>;
}

// Mapeamentos de colunas com múltiplas variações
const COLUMN_MAPPINGS = {
  nsu: ['nsu', 'numero', 'id', 'transacao', 'número', 'numero_transacao', 'transaction_id'],
  data_venda: ['data_venda', 'data', 'date', 'dt_venda', 'data_transacao', 'transaction_date', 'sale_date'],
  data_recebimento: ['data_recebimento', 'dt_recebimento', 'data_liquidacao', 'settlement_date', 'receive_date'],
  valor_bruto: ['valor_bruto', 'valor_total', 'total', 'amount', 'gross_amount', 'valor', 'value'],
  valor_liquido: ['valor_liquido', 'liquido', 'net_amount', 'valor_final', 'final_amount'],
  valor_taxa: ['valor_taxa', 'taxa', 'fee', 'desconto', 'discount', 'commission', 'comissao'],
  taxa_percentual_cobrada: ['taxa_percentual', 'percentual', 'taxa_percent', 'fee_percent', 'percent'],
  bandeira: ['bandeira', 'card', 'flag', 'marca', 'brand', 'card_brand', 'cartao'],
  tipo_transacao: ['tipo_transacao', 'tipo', 'type', 'transaction_type', 'payment_type'],
  parcelas: ['parcelas', 'installments', 'parcelamento', 'installment_count', 'qtd_parcelas']
};

/**
 * Mapeia automaticamente as colunas do Excel para os campos esperados
 */
function mapearColunas(headers: string[]): Record<string, string> {
  const mapeamento: Record<string, string> = {};
  const headersLower = headers.map(h => h.toLowerCase().trim());
  
  for (const [campo, variacoes] of Object.entries(COLUMN_MAPPINGS)) {
    for (const variacao of variacoes) {
      const index = headersLower.findIndex(h => 
        h.includes(variacao) || 
        variacao.includes(h) ||
        h.replace(/[^a-z0-9]/g, '') === variacao.replace(/[^a-z0-9]/g, '')
      );
      
      if (index !== -1) {
        mapeamento[campo] = headers[index];
        break;
      }
    }
  }
  
  return mapeamento;
}

/**
 * Valida uma linha do Excel
 */
function validarLinha(row: any, mapeamento: Record<string, string>, numeroLinha: number): { valida: boolean; erros: string[] } {
  const erros: string[] = [];
  
  // Campos obrigatórios
  const camposObrigatorios = ['nsu', 'data_venda', 'valor_bruto', 'bandeira'];
  
  for (const campo of camposObrigatorios) {
    const coluna = mapeamento[campo];
    if (!coluna || !row[coluna] || String(row[coluna]).trim() === '') {
      erros.push(`Linha ${numeroLinha}: Campo obrigatório '${campo}' está vazio ou não encontrado`);
    }
  }
  
  // Validações específicas
  if (mapeamento.valor_bruto && row[mapeamento.valor_bruto]) {
    const valor = parseFloat(String(row[mapeamento.valor_bruto]).replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      erros.push(`Linha ${numeroLinha}: Valor bruto inválido: ${row[mapeamento.valor_bruto]}`);
    }
  }
  
  if (mapeamento.data_venda && row[mapeamento.data_venda]) {
    const data = new Date(row[mapeamento.data_venda]);
    if (isNaN(data.getTime())) {
      erros.push(`Linha ${numeroLinha}: Data de venda inválida: ${row[mapeamento.data_venda]}`);
    }
  }
  
  return { valida: erros.length === 0, erros };
}

/**
 * Converte uma linha do Excel para o formato padrão
 */
function converterLinha(row: any, mapeamento: Record<string, string>): VendaExcelData {
  const obterValor = (campo: string, defaultValue: any = '') => {
    const coluna = mapeamento[campo];
    return coluna && row[coluna] !== undefined ? row[coluna] : defaultValue;
  };
  
  const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    const str = String(value).replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };
  
  const parseDate = (value: any): string => {
    if (!value) return new Date().toISOString().split('T')[0];
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // Tentar formatos brasileiros
    const str = String(value);
    const parts = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (parts) {
      const [, day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return new Date().toISOString().split('T')[0];
  };
  
  const valorBruto = parseNumber(obterValor('valor_bruto', 0));
  const valorLiquido = parseNumber(obterValor('valor_liquido', valorBruto));
  const valorTaxa = parseNumber(obterValor('valor_taxa', valorBruto - valorLiquido));
  
  return {
    nsu: String(obterValor('nsu', '')).trim(),
    data_venda: parseDate(obterValor('data_venda')),
    data_recebimento: parseDate(obterValor('data_recebimento', obterValor('data_venda'))),
    valor_bruto: valorBruto,
    valor_liquido: valorLiquido,
    valor_taxa: valorTaxa,
    taxa_percentual_cobrada: parseNumber(obterValor('taxa_percentual_cobrada', 
      valorBruto > 0 ? (valorTaxa / valorBruto) * 100 : 0
    )),
    bandeira: String(obterValor('bandeira', 'Não informado')).trim(),
    tipo_transacao: String(obterValor('tipo_transacao', 'debito')).toLowerCase().trim(),
    parcelas: Math.max(1, parseInt(String(obterValor('parcelas', 1))))
  };
}

/**
 * Valida o arquivo Excel antes do processamento
 */
export function validarArquivoExcel(arquivo: File): { valido: boolean; erro?: string } {
  if (!arquivo) {
    return { valido: false, erro: 'Nenhum arquivo selecionado' };
  }
  
  const extensao = arquivo.name.toLowerCase();
  if (!extensao.endsWith('.xlsx') && !extensao.endsWith('.xls')) {
    return { valido: false, erro: 'Formato inválido. Use arquivos .xlsx ou .xls' };
  }
  
  // Verificar tamanho (máximo 10MB)
  if (arquivo.size > 10 * 1024 * 1024) {
    return { valido: false, erro: 'Arquivo muito grande. Máximo permitido: 10MB' };
  }
  
  return { valido: true };
}

/**
 * Processa um arquivo Excel e retorna as vendas importadas
 */
export async function parseExcelVendas(arquivo: File): Promise<ExcelParseResult> {
  const validacao = validarArquivoExcel(arquivo);
  if (!validacao.valido) {
    throw new Error(validacao.erro);
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Falha ao ler o arquivo'));
          return;
        }
        
        // Ler workbook
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          reject(new Error('Arquivo Excel não possui planilhas'));
          return;
        }
        
        // Usar primeira planilha
        const primeiraSheet = workbook.Sheets[workbook.SheetNames[0]];
        const dadosSheet = XLSX.utils.sheet_to_json(primeiraSheet, { header: 1 });
        
        if (dadosSheet.length === 0) {
          reject(new Error('Planilha está vazia'));
          return;
        }
        
        // Extrair cabeçalhos (primeira linha)
        const headers = dadosSheet[0] as string[];
        const mapeamento = mapearColunas(headers);
        
        // Validar se encontrou mapeamentos essenciais
        const camposEssenciais = ['nsu', 'data_venda', 'valor_bruto', 'bandeira'];
        const camposNaoEncontrados = camposEssenciais.filter(campo => !mapeamento[campo]);
        
        if (camposNaoEncontrados.length > 0) {
          reject(new Error(`Colunas obrigatórias não encontradas: ${camposNaoEncontrados.join(', ')}`));
          return;
        }
        
        const vendas: VendaExcelData[] = [];
        const erros: string[] = [];
        const avisos: string[] = [];
        
        // Processar linhas de dados (pular cabeçalho)
        for (let i = 1; i < dadosSheet.length; i++) {
          const linha = dadosSheet[i] as any[];
          
          // Pular linhas vazias
          if (!linha || linha.every(cell => !cell || String(cell).trim() === '')) {
            continue;
          }
          
          // Converter array para objeto
          const rowObj: any = {};
          headers.forEach((header, index) => {
            if (header && linha[index] !== undefined) {
              rowObj[header] = linha[index];
            }
          });
          
          // Validar linha
          const validacao = validarLinha(rowObj, mapeamento, i + 1);
          
          if (validacao.valida) {
            try {
              const vendaConvertida = converterLinha(rowObj, mapeamento);
              vendas.push(vendaConvertida);
            } catch (error) {
              erros.push(`Linha ${i + 1}: Erro na conversão - ${error}`);
            }
          } else {
            erros.push(...validacao.erros);
          }
        }
        
        // Adicionar avisos se aplicável
        if (vendas.length > 0 && erros.length > 0) {
          avisos.push(`${erros.length} linhas foram ignoradas devido a erros de validação`);
        }
        
        if (vendas.length === 0) {
          reject(new Error('Nenhuma venda válida encontrada no arquivo'));
          return;
        }
        
        resolve({
          vendas,
          erros,
          avisos,
          linhasValidas: vendas.length,
          totalLinhas: dadosSheet.length - 1, // Exclui cabeçalho
          colunasMapeadas: mapeamento
        });
        
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo Excel: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'));
    };
    
    reader.readAsArrayBuffer(arquivo);
  });
}