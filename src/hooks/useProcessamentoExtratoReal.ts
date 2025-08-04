import { useState } from 'react';
import { parseExcelVendas, validarArquivoExcel, ExcelParseResult } from '@/utils/parsers/excelVendasParser';
import { parseCSVVendas, validarArquivoCSV } from '@/utils/parsers/csvVendasParser';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessamentoExtratoRealReturn {
  processandoVendas: boolean;
  processandoBancario: boolean;
  progresso: number;
  loading: boolean;
  erros: string[];
  validarArquivoVendas: (arquivo: File) => { valido: boolean; erro?: string };
  validarArquivoBancario: (arquivo: File) => { valido: boolean; erro?: string };
  processarArquivoVendas: (arquivo: File, maquininhaId: string, periodo: string) => Promise<any>;
  processarArquivoBancario: (arquivo: File, bancoId: number, periodo: string) => Promise<any>;
  uploadArquivoVendas: (arquivo: File) => Promise<void>;
  uploadArquivoBancario: (arquivo: File) => Promise<void>;
  processarArquivos: (maquininhaId: string, periodo: string) => Promise<void>;
}

export function useProcessamentoExtratoReal(): ProcessamentoExtratoRealReturn {
  const [processandoVendas, setProcessandoVendas] = useState(false);
  const [processandoBancario, setProcessandoBancario] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erros, setErros] = useState<string[]>([]);

  const loading = processandoVendas || processandoBancario;

  const validarArquivoVendas = (arquivo: File): { valido: boolean; erro?: string } => {
    if (!arquivo) {
      return { valido: false, erro: 'Nenhum arquivo selecionado' };
    }

    const extensao = arquivo.name.toLowerCase().slice(arquivo.name.lastIndexOf('.'));
    
    if (extensao === '.xlsx' || extensao === '.xls') {
      return validarArquivoExcel(arquivo);
    } else if (extensao === '.csv') {
      return validarArquivoCSV(arquivo);
    } else {
      return { valido: false, erro: 'Formato não suportado. Use .xlsx, .xls ou .csv' };
    }
  };

  const processarArquivoVendas = async (arquivo: File, maquininhaId: string, periodo: string): Promise<any> => {
    try {
      setProcessandoVendas(true);
      setProgresso(0);

      const extensao = arquivo.name.toLowerCase().slice(arquivo.name.lastIndexOf('.'));
      let resultado: any;

      if (extensao === '.xlsx' || extensao === '.xls') {
        // Usar parser Excel
        setProgresso(20);
        const resultadoExcel: ExcelParseResult = await parseExcelVendas(arquivo);
        setProgresso(60);
        
        if (resultadoExcel.erros.length > 0) {
          console.warn('Avisos no processamento Excel:', resultadoExcel.erros);
        }

        // Inserir vendas no banco de dados
        for (const venda of resultadoExcel.vendas) {
          await supabase.from('vendas_maquininha').insert({
            maquininha_id: maquininhaId,
            periodo_processamento: periodo,
            nsu: venda.nsu,
            data_venda: venda.data_venda,
            data_recebimento: venda.data_recebimento,
            valor_bruto: venda.valor_bruto,
            valor_liquido: venda.valor_liquido,
            valor_taxa: venda.valor_taxa,
            taxa_percentual_cobrada: venda.taxa_percentual_cobrada,
            bandeira: venda.bandeira,
            tipo_transacao: venda.tipo_transacao,
            parcelas: venda.parcelas,
            status: 'pendente'
          });
        }

        resultado = {
          totalProcessado: resultadoExcel.linhasValidas,
          totalLinhas: resultadoExcel.totalLinhas,
          erros: resultadoExcel.erros,
          colunasMapeadas: resultadoExcel.colunasMapeadas
        };

      } else if (extensao === '.csv') {
        // Usar parser CSV
        setProgresso(20);
        const texto = await arquivo.text();
        const resultadoCSV = await parseCSVVendas(texto);
        setProgresso(60);
        
        if (resultadoCSV.erros && resultadoCSV.erros.length > 0) {
          console.warn('Avisos no processamento CSV:', resultadoCSV.erros);
        }

        // Inserir vendas no banco de dados
        if (resultadoCSV.vendas) {
          for (const venda of resultadoCSV.vendas) {
            const dataVenda = typeof venda.data_venda === 'string' 
              ? venda.data_venda 
              : venda.data_venda?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
            
            await supabase.from('vendas_maquininha').insert({
              maquininha_id: maquininhaId,
              periodo_processamento: periodo,
              nsu: venda.nsu || String(Math.random()),
              data_venda: dataVenda,
              data_recebimento: dataVenda,
              valor_bruto: venda.valor_bruto || 0,
              valor_liquido: venda.valor_liquido || 0,
              valor_taxa: venda.valor_taxa || 0,
              taxa_percentual_cobrada: 0,
              bandeira: venda.bandeira || 'N/A',
              tipo_transacao: 'debito',
              parcelas: 1,
              status: 'pendente'
            });
          }
        }

        resultado = {
          totalProcessado: resultadoCSV.vendas?.length || 0,
          totalLinhas: (resultadoCSV.vendas?.length || 0) + (resultadoCSV.erros?.length || 0),
          erros: resultadoCSV.erros || [],
          colunasMapeadas: {} // CSV parser não retorna mapeamento
        };
      }

      setProgresso(100);
      return resultado;

    } catch (error) {
      console.error('Erro ao processar arquivo de vendas:', error);
      throw error;
    } finally {
      setProcessandoVendas(false);
      setProgresso(0);
    }
  };

  const processarArquivoBancario = async (arquivo: File, bancoId: number, periodo: string): Promise<any> => {
    try {
      setProcessandoBancario(true);
      setProgresso(0);

      // Implementar processamento de arquivo bancário (OFX/CSV)
      // Por enquanto, simulação
      setProgresso(50);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProgresso(100);
      
      return {
        totalProcessado: 100,
        totalLinhas: 100,
        erros: []
      };

    } catch (error) {
      console.error('Erro ao processar arquivo bancário:', error);
      throw error;
    } finally {
      setProcessandoBancario(false);
      setProgresso(0);
    }
  };

  const validarArquivoBancario = (arquivo: File) => ({ valido: true });
  const uploadArquivoVendas = async (arquivo: File) => {};
  const uploadArquivoBancario = async (arquivo: File) => {};
  const processarArquivos = async (maquininhaId: string, periodo: string) => {};

  return {
    processandoVendas,
    processandoBancario,
    progresso,
    loading,
    erros,
    validarArquivoVendas,
    validarArquivoBancario,
    processarArquivoVendas,
    processarArquivoBancario,
    uploadArquivoVendas,
    uploadArquivoBancario,
    processarArquivos
  };
}