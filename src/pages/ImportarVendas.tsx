import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { 
  Download, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Home, 
  ChevronRight, 
  Users, 
  TrendingUp,
  Clock,
  X,
  FileSpreadsheet,
  AlertTriangle,
  BarChart3,
  Eye,
  FileDown
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { createBreadcrumb } from "@/utils/breadcrumbUtils";
import * as XLSX from 'xlsx';

// Interfaces
interface ImportResult {
  vendasProcessadas: number;
  clientesCriados: number;
  clientesAtualizados: number;
  valorTotal: number;
  ticketMedio: number;
  errosEncontrados: number;
  avisos: number;
  formasPagamento: Array<{
    forma: string;
    quantidade: number;
    percentual: number;
  }>;
  clientesProcessados: Array<{
    codigo: string;
    nome: string;
    vendas: number;
    valor: number;
  }>;
  detalhes: Array<{
    linha: number;
    tipo: 'erro' | 'aviso' | 'sucesso';
    mensagem: string;
  }>;
}

interface ResultadoImportacao {
  total: number;
  sucessos: number;
  erros: string[];
  clientesCriados: number;
  valorTotalImportado: number;
  ticketMedio: number;
  formasPagamento: Array<{
    forma: string;
    vendas: number;
    valor: number;
    percentual: string;
  }>;
  clientesTop: Array<{
    id: number;
    nome: string;
    vendas: number;
    valor: number;
  }>;
}

interface HistoricoImportacao {
  id: string;
  dataImportacao: string;
  nomeArquivo: string;
  vendasProcessadas: number;
  clientesCriados: number;
  status: 'sucesso' | 'erro' | 'parcial';
}

export default function ImportarVendas() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [showResult, setShowResult] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState<ImportResult | null>(null);
  const [resultadoImportacaoCompleto, setResultadoImportacaoCompleto] = useState<ResultadoImportacao | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [historicoImportacoes, setHistoricoImportacoes] = useState<HistoricoImportacao[]>([
    {
      id: '1',
      dataImportacao: '21/01/2025 14:30',
      nomeArquivo: 'vendas_janeiro.csv',
      vendasProcessadas: 45,
      clientesCriados: 8,
      status: 'sucesso'
    }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapeamento das formas de pagamento do ERP
  const formasPagamentoERP = {
    "NUBANK_PIX": "PIX",
    "REDE_DEBITO": "Cartão Débito",
    "REDE_PARCELAD": "Cartão Parcelado", 
    "DINHEIRO": "Dinheiro",
    "TRANSFERENCIA": "Transferência",
    "CHEQUE": "Cheque"
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    const formatosPermitidos = ['.csv', '.xls', '.xlsx'];
    const extensao = file.name.toLowerCase().substr(file.name.lastIndexOf('.'));

    if (!formatosPermitidos.includes(extensao)) {
      toast.error("Formato não suportado. Use apenas .csv, .xls ou .xlsx");
      return;
    }

    setArquivo(file);
    processarArquivo(file);
  };

  const processarArquivo = async (file: File) => {
    setUploading(true);
    setProgress(20);
    setErrors([]);

    // Simular processamento
    setTimeout(() => {
      setUploading(false);
      setValidating(true);
      setProgress(60);
      
      // Simular validação e preview de dados do ERP
      const mockPreview = [
        ["Contrato", "Data Venda", "Código Cliente", "Cliente", "Vendedor", "Usuario", "Tipo Venda", "Vlr. Venda", "Vlr. Acr.", "Tax Cad.", "Des.Pro.", "Des.Ger.", "Trocas", "Liquido"],
        ["23743", "21/07/25 09:12:37", "4908", "FERNANDA ANTONIO FRARE", "JHENIFFER", "LOJA01", "NUBANK_PIX", "729.60", "0.00", "0.00", "0.00", "364.80", "0.00", "364.80"],
        ["23744", "21/07/25 09:46:40", "2308", "DEBORA APARECIDA BERTI", "JHENIFFER", "LOJA01", "NUBANK_PIX", "69.90", "0.00", "0.00", "0.00", "34.95", "0.00", "34.95"],
        ["23745", "21/07/25 09:57:01", "3925", "ELIANE RIZO FIUZA", "JHENIFFER", "LOJA01", "REDE_DEBITO", "49.90", "0.00", "0.00", "0.00", "0.00", "0.00", "49.90"],
        ["23746", "21/07/25 10:15:22", "1205", "MARIA JOSE SILVA", "CARLOS", "LOJA01", "DINHEIRO", "89.90", "0.00", "0.00", "0.00", "0.00", "0.00", "89.90"]
      ];
      
      // Simular validações
      const errosValidacao = [];
      if (mockPreview[0].length !== 14) {
        errosValidacao.push("Arquivo deve ter exatamente 14 colunas");
      }
      
      setTimeout(() => {
        setValidating(false);
        if (errosValidacao.length > 0) {
          setErrors(errosValidacao);
          toast.error("Arquivo inválido. Verifique os erros.");
        } else {
          setPreviewData(mockPreview);
          toast.success("Arquivo validado com sucesso!");
        }
        setProgress(100);
      }, 1500);
    }, 1000);
  };

  const iniciarImportacao = async () => {
    if (!previewData || previewData.length <= 1) {
      toast.error("Nenhum dado para importar");
      return;
    }

    setImporting(true);
    setIsProcessing(true);
    setProgress(0);

    try {
      // Converter preview data para formato de processamento
      const [headers, ...dataRows] = previewData;
      const dadosParaProcessar = dataRows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      // Processar dados
      const resultado = await importarDados(dadosParaProcessar);
      
      setResultadoImportacaoCompleto(resultado);
      setImporting(false);
      setIsProcessing(false);
      setShowResult(true);
      
      toast.success(`Importação concluída! ${resultado.sucessos} vendas processadas.`);
      
    } catch (error: any) {
      setImporting(false);
      setIsProcessing(false);
      toast.error("Erro durante a importação: " + error.message);
    }
  };

  // Função principal de importação de dados
  const importarDados = async (dados: any[]): Promise<ResultadoImportacao> => {
    const total = dados.length;
    let processados = 0;
    let clientesCriados = 0;
    let errosImportacao: string[] = [];
    const vendasProcessadas: any[] = [];
    
    // Progress incremental
    for (const linha of dados) {
      try {
        // 1. Verificar/criar cliente
        const cliente = await verificarOuCriarCliente(
          linha['Código Cliente'], 
          linha['Cliente']
        );
        
        if (cliente.isNew) clientesCriados++;
        
        // 2. Processar venda
        const vendaProcessada = await processarLinhaVenda(linha, cliente.id);
        vendasProcessadas.push(vendaProcessada);
        
        processados++;
        setProgress((processados / total) * 100);
        
        // Delay para mostrar progresso
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error: any) {
        errosImportacao.push(`Linha ${processados + 1}: ${error.message}`);
      }
    }
    
    // 3. Atualizar histórico
    const novaImportacao: HistoricoImportacao = {
      id: Date.now().toString(),
      dataImportacao: new Date().toLocaleString('pt-BR'),
      nomeArquivo: arquivo?.name || 'arquivo.csv',
      vendasProcessadas: processados,
      clientesCriados: clientesCriados,
      status: errosImportacao.length === 0 ? 'sucesso' : (processados > 0 ? 'parcial' : 'erro')
    };
    
    setHistoricoImportacoes(prev => [novaImportacao, ...prev]);
    
    // 4. Calcular estatísticas
    const valorTotalImportado = vendasProcessadas.reduce((acc, venda) => acc + parseFloat(venda.valor_liquido), 0);
    const ticketMedio = vendasProcessadas.length > 0 ? valorTotalImportado / vendasProcessadas.length : 0;
    
    return {
      total: total,
      sucessos: processados,
      erros: errosImportacao,
      clientesCriados: clientesCriados,
      valorTotalImportado: valorTotalImportado,
      ticketMedio: ticketMedio,
      formasPagamento: calcularFormasPagamento(vendasProcessadas),
      clientesTop: calcularTopClientes(vendasProcessadas)
    };
  };

  // Verificar se cliente existe ou criar automaticamente
  const verificarOuCriarCliente = async (codigoERP: string, nomeCliente: string) => {
    // Simular busca no banco (substituir por chamada real ao Supabase)
    const clienteExistente = await buscarClientePorCodigo(codigoERP);
    
    if (clienteExistente) {
      // Cliente existe - atualizar estatísticas
      await atualizarEstatisticasCliente(clienteExistente.id);
      return { id: clienteExistente.id, isNew: false };
    }
    
    // Cliente não existe - criar automaticamente
    const novoCliente = {
      codigo_erp: parseInt(codigoERP),
      nome: nomeCliente.trim(),
      tipo: "Pessoa Física",
      status: "Ativo",
      primeira_compra: new Date().toISOString().split('T')[0],
      total_compras: 0,
      valor_total: 0,
      observacoes: `Criado automaticamente na importação - Código ERP: ${codigoERP}`,
      created_at: new Date().toISOString()
    };
    
    // Simular criação (substituir por chamada ao Supabase)
    const clienteCriado = await criarCliente(novoCliente);
    
    return { id: clienteCriado.id, isNew: true };
  };

  // Funções auxiliares (preparadas para Supabase)
  const buscarClientePorCodigo = async (codigo: string) => {
    // TODO: Implementar busca no Supabase
    // return await supabase.from('clientes').select('*').eq('codigo_erp', codigo).single()
    return null; // Placeholder - sempre criará cliente novo por enquanto
  };

  const criarCliente = async (dadosCliente: any) => {
    // TODO: Implementar criação no Supabase  
    // return await supabase.from('clientes').insert(dadosCliente).select().single()
    return { id: Math.random(), ...dadosCliente }; // Placeholder
  };

  const atualizarEstatisticasCliente = async (clienteId: number) => {
    // TODO: Implementar atualização no Supabase
    // await supabase.from('clientes').update({ ultima_compra: new Date() }).eq('id', clienteId)
  };

  // Processar linha de venda
  const processarLinhaVenda = async (linha: any, clienteId: number) => {
    // Converter dados do ERP para formato do sistema
    const vendaData = {
      documento_referencia: linha['Contrato'],
      data_venda: converterDataERP(linha['Data Venda']),
      hora_venda: extrairHoraERP(linha['Data Venda']),
      cliente_id: clienteId,
      codigo_cliente_erp: parseInt(linha['Código Cliente']),
      vendedor: linha['Vendedor'],
      usuario_erp: linha['Usuario'],
      valor_bruto: parseFloat(linha['Vlr. Venda'] || 0),
      valor_acrescimo: parseFloat(linha['Vlr. Acr.'] || 0),
      taxa_cadastro: parseFloat(linha['Tax Cad.'] || 0),
      desconto_produto: parseFloat(linha['Des.Pro.'] || 0),
      desconto_geral: parseFloat(linha['Des.Ger.'] || 0),
      valor_trocas: parseFloat(linha['Trocas'] || 0),
      valor_liquido: parseFloat(linha['Liquido'] || 0),
      forma_pagamento: converterFormaPagamentoERP(linha['Tipo Venda']),
      tipo_venda: "Venda",
      categoria_id: 1, // TODO: Buscar categoria correta baseada no tipo
      created_at: new Date().toISOString()
    };
    
    // Validar dados processados
    validarDadosVenda(vendaData);
    
    // TODO: Salvar no Supabase
    // await supabase.from('vendas').insert(vendaData)
    
    return vendaData;
  };

  // Funções de conversão
  const converterDataERP = (dataERP: string) => {
    // Converter "21/07/25 09:12:37" para "2025-07-21"
    if (!dataERP) return null;
    
    const [datePart] = dataERP.split(' ');
    const [dia, mes, ano] = datePart.split('/');
    const anoCompleto = ano.length === 2 ? `20${ano}` : ano;
    
    return `${anoCompleto}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  };

  const extrairHoraERP = (dataERP: string) => {
    // Extrair "09:12:37" de "21/07/25 09:12:37"
    if (!dataERP) return null;
    
    const [, horaPart] = dataERP.split(' ');
    return horaPart || '00:00:00';
  };

  const converterFormaPagamentoERP = (tipoERP: string) => {
    const mapeamento = {
      "NUBANK_PIX": "PIX",
      "REDE_DEBITO": "Cartão Débito",
      "REDE_PARCELAD": "Cartão Parcelado", 
      "DINHEIRO": "Dinheiro",
      "TRANSFERENCIA": "Transferência",
      "CHEQUE": "Cheque"
    };
    
    return mapeamento[tipoERP as keyof typeof mapeamento] || tipoERP;
  };

  const validarDadosVenda = (venda: any) => {
    if (!venda.data_venda) throw new Error("Data da venda é obrigatória");
    if (!venda.cliente_id) throw new Error("Cliente é obrigatório");
    if (venda.valor_liquido <= 0) throw new Error("Valor líquido deve ser maior que zero");
  };

  // Calcular distribuição de formas de pagamento
  const calcularFormasPagamento = (vendas: any[]) => {
    const distribuicao: { [key: string]: { count: number, total: number } } = {};
    
    vendas.forEach(venda => {
      const forma = venda.forma_pagamento;
      if (!distribuicao[forma]) {
        distribuicao[forma] = { count: 0, total: 0 };
      }
      distribuicao[forma].count++;
      distribuicao[forma].total += parseFloat(venda.valor_liquido);
    });
    
    return Object.entries(distribuicao).map(([forma, dados]) => ({
      forma,
      vendas: dados.count,
      valor: dados.total,
      percentual: ((dados.count / vendas.length) * 100).toFixed(1)
    }));
  };

  // Calcular top clientes
  const calcularTopClientes = (vendas: any[]) => {
    const clientesMap: { [key: number]: { nome: string, vendas: number, valor: number } } = {};
    
    vendas.forEach(venda => {
      const clienteId = venda.cliente_id;
      if (!clientesMap[clienteId]) {
        clientesMap[clienteId] = {
          nome: `Cliente ${venda.codigo_cliente_erp}`, // TODO: Buscar nome real
          vendas: 0,
          valor: 0
        };
      }
      clientesMap[clienteId].vendas++;
      clientesMap[clienteId].valor += parseFloat(venda.valor_liquido);
    });
    
    return Object.entries(clientesMap)
      .map(([id, dados]) => ({ id: parseInt(id), ...dados }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  };

  const resetarImportacao = () => {
    setArquivo(null);
    setPreviewData([]);
    setProgress(0);
    setShowResult(false);
    setResultadoImportacao(null);
    setResultadoImportacaoCompleto(null);
    setErrors([]);
  };

  // Função para processar Excel
  const processarExcel = async (arquivo: File) => {
    const workbook = XLSX.read(await arquivo.arrayBuffer());
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Primeira aba
    const dados = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Converter para formato compatível
    const [cabecalhos, ...linhas] = dados;
    return linhas.map((linha: any) => {
      const objeto: any = {};
      (cabecalhos as any[]).forEach((cabecalho: any, index: number) => {
        objeto[cabecalho] = linha[index];
      });
      return objeto;
    });
  };

  // Função para processar CSV
  const processarCSV = async (arquivo: File) => {
    const texto = await arquivo.text();
    const linhas = texto.split('\n').filter(linha => linha.trim());
    const [cabecalho, ...dadosLinhas] = linhas;
    const cabecalhos = cabecalho.split(',');
    
    return dadosLinhas.map(linha => {
      const valores = linha.split(',');
      const objeto: any = {};
      cabecalhos.forEach((cab, index) => {
        objeto[cab] = valores[index];
      });
      return objeto;
    });
  };

  // Função para validar data do Excel
  const validarDataExcel = (data: any) => {
    if (typeof data === 'number') {
      return data > 0; // Data serial do Excel
    }
    
    if (typeof data === 'string') {
      const formatosData = [
        /^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/, // DD/MM/YY HH:MM:SS
        /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/, // DD/MM/YYYY HH:MM:SS
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,   // YYYY-MM-DD HH:MM:SS
      ];
      
      return formatosData.some(formato => formato.test(data));
    }
    
    return false;
  };

  // Validações específicas para arquivos Excel
  const validarArquivoExcel = (dados: any[]) => {
    const erros: string[] = [];
    
    if (!dados || dados.length === 0) {
      erros.push("Arquivo Excel vazio ou sem dados na primeira aba");
      return erros;
    }
    
    const cabecalhosEsperados = [
      'Contrato', 'Data Venda', 'Código Cliente', 'Cliente', 'Vendedor',
      'Usuario', 'Tipo Venda', 'Vlr. Venda', 'Vlr. Acr.', 'Tax Cad.',
      'Des.Pro.', 'Des.Ger.', 'Trocas', 'Liquido'
    ];
    
    const cabecalhosArquivo = Object.keys(dados[0] || {});
    
    cabecalhosEsperados.forEach(cabecalho => {
      if (!cabecalhosArquivo.includes(cabecalho)) {
        erros.push(`Coluna obrigatória "${cabecalho}" não encontrada`);
      }
    });
    
    // Validações por linha
    dados.forEach((linha, index) => {
      const numeroLinha = index + 1;
      
      if (!linha['Contrato']) erros.push(`Linha ${numeroLinha}: Contrato obrigatório`);
      if (!linha['Data Venda']) erros.push(`Linha ${numeroLinha}: Data obrigatória`);
      if (!linha['Código Cliente']) erros.push(`Linha ${numeroLinha}: Código Cliente obrigatório`);
      if (!linha['Cliente']) erros.push(`Linha ${numeroLinha}: Nome Cliente obrigatório`);
      
      if (linha['Código Cliente'] && isNaN(Number(linha['Código Cliente']))) {
        erros.push(`Linha ${numeroLinha}: Código Cliente deve ser numérico`);
      }
      
      if (linha['Vlr. Venda'] && isNaN(Number(linha['Vlr. Venda']))) {
        erros.push(`Linha ${numeroLinha}: Valor Venda deve ser numérico`);
      }
      
      if (linha['Data Venda'] && !validarDataExcel(linha['Data Venda'])) {
        erros.push(`Linha ${numeroLinha}: Data em formato inválido`);
      }
    });
    
    return erros;
  };

  const baixarModeloCSV = () => {
    const cabecalhos = [
      'Contrato', 'Data Venda', 'Código Cliente', 'Cliente', 'Vendedor', 
      'Usuario', 'Tipo Venda', 'Vlr. Venda', 'Vlr. Acr.', 'Tax Cad.', 
      'Des.Pro.', 'Des.Ger.', 'Trocas', 'Liquido'
    ];
    
    const exemploLinhas = [
      ['23743', '21/07/25 09:12:37', '4908', 'FERNANDA ANTONIO FRARE', 'JHENIFFER', 'LOJA01', 'NUBANK_PIX', '729.60', '0.00', '0.00', '0.00', '364.80', '0.00', '364.80'],
      ['23744', '21/07/25 09:46:40', '2308', 'DEBORA APARECIDA BERTI', 'JHENIFFER', 'LOJA01', 'NUBANK_PIX', '69.90', '0.00', '0.00', '0.00', '34.95', '0.00', '34.95'],
      ['23745', '21/07/25 09:57:01', '3925', 'ELIANE RIZO FIUZA', 'JHENIFFER', 'LOJA01', 'REDE_DEBITO', '49.90', '0.00', '0.00', '0.00', '0.00', '0.00', '49.90']
    ];
    
    const csvContent = [cabecalhos, ...exemploLinhas]
      .map(linha => linha.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_importacao_vendas_jc.csv';
    link.click();
    
    toast.success("Modelo CSV baixado com sucesso!");
  };

  const baixarModeloExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    const dados = [
      ['Contrato', 'Data Venda', 'Código Cliente', 'Cliente', 'Vendedor', 'Usuario', 'Tipo Venda', 'Vlr. Venda', 'Vlr. Acr.', 'Tax Cad.', 'Des.Pro.', 'Des.Ger.', 'Trocas', 'Liquido'],
      ['23743', '21/07/25 09:12:37', '4908', 'FERNANDA ANTONIO FRARE', 'JHENIFFER', 'LOJA01', 'NUBANK_PIX', '729.60', '0.00', '0.00', '0.00', '364.80', '0.00', '364.80'],
      ['23744', '21/07/25 09:46:40', '2308', 'DEBORA APARECIDA BERTI', 'JHENIFFER', 'LOJA01', 'NUBANK_PIX', '69.90', '0.00', '0.00', '0.00', '34.95', '0.00', '34.95'],
      ['23745', '21/07/25 09:57:01', '3925', 'ELIANE RIZO FIUZA', 'JHENIFFER', 'LOJA01', 'REDE_DEBITO', '49.90', '0.00', '0.00', '0.00', '0.00', '0.00', '49.90']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(dados);
    
    // Formatação das colunas
    worksheet['!cols'] = [
      { wch: 8 },  // Contrato
      { wch: 18 }, // Data Venda
      { wch: 12 }, // Código Cliente
      { wch: 25 }, // Cliente
      { wch: 12 }, // Vendedor
      { wch: 8 },  // Usuario
      { wch: 15 }, // Tipo Venda
      { wch: 10 }, // Vlr. Venda
      { wch: 8 },  // Vlr. Acr.
      { wch: 8 },  // Tax Cad.
      { wch: 8 },  // Des.Pro.
      { wch: 8 },  // Des.Ger.
      { wch: 8 },  // Trocas
      { wch: 10 }  // Liquido
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');
    XLSX.writeFile(workbook, 'modelo_importacao_vendas_jc.xlsx');
    
    toast.success("Modelo Excel baixado com sucesso!");
  };

  // Função para baixar log completo
  const baixarLogCompleto = (resultado: ResultadoImportacao | null) => {
    if (!resultado) return;
    
    const log = [
      `RELATÓRIO DE IMPORTAÇÃO - ${new Date().toLocaleString('pt-BR')}`,
      `=====================================`,
      `Total de linhas processadas: ${resultado.total}`,
      `Vendas importadas com sucesso: ${resultado.sucessos}`,
      `Clientes criados automaticamente: ${resultado.clientesCriados}`,
      `Valor total importado: ${resultado.valorTotalImportado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      `Ticket médio: ${resultado.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      ``,
      `FORMAS DE PAGAMENTO:`,
      ...resultado.formasPagamento.map(forma => 
        `- ${forma.forma}: ${forma.vendas} vendas (${forma.percentual}%) - ${forma.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      ),
      ``,
      `ERROS ENCONTRADOS (${resultado.erros.length}):`,
      ...resultado.erros.map(erro => `- ${erro}`)
    ].join('\n');
    
    const blob = new Blob([log], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `log_importacao_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    toast.success("Log completo baixado!");
  };

  // Renderizar modal de resultado da importação
  const renderModalResultado = () => {
    if (!showResult || !resultadoImportacaoCompleto) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h2 className="text-2xl font-bold text-gray-900">📊 Relatório de Importação</h2>
                <p className="text-gray-600">Resumo do processamento concluído</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResult(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-xl text-center border border-green-200">
                <h3 className="text-sm font-medium text-green-800">✅ Vendas Processadas</h3>
                <p className="text-2xl font-bold text-green-600">{resultadoImportacaoCompleto.sucessos}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800">👥 Clientes Criados</h3>
                <p className="text-2xl font-bold text-blue-600">{resultadoImportacaoCompleto.clientesCriados}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-200">
                <h3 className="text-sm font-medium text-purple-800">💰 Valor Total</h3>
                <p className="text-xl font-bold text-purple-600">
                  {resultadoImportacaoCompleto.valorTotalImportado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-200">
                <h3 className="text-sm font-medium text-orange-800">🎯 Ticket Médio</h3>
                <p className="text-xl font-bold text-orange-600">
                  {resultadoImportacaoCompleto.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
            
            {/* Grid de duas colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formas de Pagamento */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">💳 Formas de Pagamento</h3>
                <div className="space-y-2">
                  {resultadoImportacaoCompleto.formasPagamento.map((forma, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{forma.forma}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium">{forma.vendas} vendas ({forma.percentual}%)</span>
                        <div className="text-xs text-gray-500">
                          {forma.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Top Clientes */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">🏆 Top 5 Clientes</h3>
                <div className="space-y-2">
                  {resultadoImportacaoCompleto.clientesTop.map((cliente, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">#{index + 1} {cliente.nome}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium">{cliente.vendas} vendas</span>
                        <div className="text-xs text-gray-500">
                          {cliente.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Erros (se houver) */}
            {resultadoImportacaoCompleto.erros && resultadoImportacaoCompleto.erros.length > 0 && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <h3 className="font-semibold text-red-800 mb-3">❌ Erros Encontrados ({resultadoImportacaoCompleto.erros.length})</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {resultadoImportacaoCompleto.erros.map((erro, index) => (
                    <div key={index} className="text-sm text-red-600">• {erro}</div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Footer */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => baixarLogCompleto(resultadoImportacaoCompleto)}>
                📋 Baixar Log Completo
              </Button>
              <Button onClick={() => setShowResult(false)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                ✅ Finalizar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      
      {/* Blur decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-green-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/importar-vendas')}
        title="Importar Vendas"
        subtitle="Importe vendas do ERP em lote através de arquivo CSV ou Excel • Processamento automático"
      />

      <div className="relative z-10 p-4 lg:p-8 space-y-8">
        {/* Header com botões de ação */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="h-11 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 w-full sm:w-auto"
              onClick={baixarModeloCSV}
            >
              <Download className="w-4 h-4 mr-2" />
              📥 Modelo CSV
            </Button>
            <Button 
              variant="outline" 
              className="h-11 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white/90 w-full sm:w-auto"
              onClick={baixarModeloExcel}
            >
              <Download className="w-4 h-4 mr-2" />
              📊 Modelo Excel
            </Button>
            <Link to="/consultar-vendas">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 h-11 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto">
                <TrendingUp className="w-4 h-4 mr-2" />
                📊 Consultar Vendas
              </Button>
            </Link>
          </div>
        </div>

        {/* Grid Principal - 3 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA 1 - Card de Alerta (ERP) */}
          <div className="lg:col-span-1">
            <Card className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-yellow-50/90">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  ⚠️ IMPORTANTE - Estrutura do ERP
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm leading-relaxed">
                  Este sistema está configurado para importar dados do <strong>ERP JC PLUS SIZE</strong>:
                </p>
                
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>📊 Exporte do ERP como CSV ou salve como Excel (.xls/.xlsx)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>📋 Mantenha o formato original (14 colunas na ordem correta)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>💾 Use encoding UTF-8 para CSV ou formato padrão Excel</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <span>👥 Clientes serão criados automaticamente</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">5.</span>
                    <span>🔄 Recomendação: importação semanal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">6.</span>
                    <span>📥 Use os botões "Baixar Modelo" para garantir formato correto</span>
                  </div>
                </div>

                <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center gap-2 text-blue-700 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">💡 Dica:</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    Se tiver problemas com CSV, use o formato Excel (.xlsx) que preserva melhor a formatação dos dados.
                  </p>
                </div>
                
                <Link to="/clientes">
                  <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl mt-4">
                    <Users className="w-4 h-4 mr-2" />
                    👥 Gerenciar Clientes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA 2 - Upload do Arquivo */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <Upload className="w-6 h-6 text-blue-600" />
                  📤 Upload do Arquivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Área de Upload */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                    arquivo ? 'border-green-400 bg-green-50/50' : 
                    errors.length > 0 ? 'border-red-400 bg-red-50/50' :
                    'border-gray-300 hover:border-blue-500 hover:bg-blue-50/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    if (files[0]) handleFileSelect(files[0]);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                  
                  {arquivo ? (
                    <div className="space-y-4">
                      <FileSpreadsheet className="w-16 h-16 mx-auto text-green-600" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">{arquivo.name}</p>
                        <p className="text-gray-600">📊 {(arquivo.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="text-red-700 text-sm space-y-1">
                            {errors.map((error, index) => (
                              <div key={index}>❌ {error}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          resetarImportacao();
                        }}
                        className="bg-white/80 hover:bg-white/90"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto text-gray-400 text-6xl">☁️</div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Arraste arquivo CSV ou Excel aqui
                        </h3>
                        <p className="text-gray-600 mb-1">ou clique para selecionar</p>
                        <p className="text-sm text-gray-500">
                          Formatos aceitos: .csv, .xls, .xlsx (máx. 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {(uploading || validating || importing) && (
                  <div className="space-y-3">
                     <div className="flex items-center justify-between text-sm">
                       <span className="text-gray-700 font-medium">
                         {uploading && arquivo && 
                           (arquivo.name.toLowerCase().endsWith('.csv') ? "📄 Enviando arquivo CSV..." : "📊 Enviando arquivo Excel...")
                         }
                         {validating && arquivo && 
                           (arquivo.name.toLowerCase().endsWith('.csv') ? "🔍 Validando dados CSV..." : "🔍 Processando planilha Excel...")
                         }
                         {importing && `📊 Importando vendas...`}
                       </span>
                       <span className="font-semibold">{Math.round(progress)}%</span>
                     </div>
                    <Progress value={progress} className="h-3 bg-gray-200" />
                  </div>
                )}

                {/* Preview dos Dados */}
                {previewData.length > 0 && !importing && errors.length === 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-gray-900">✅ Arquivo válido - Preview das primeiras 5 linhas</h4>
                    </div>
                    <div className="bg-white rounded-lg border p-4 text-xs font-mono max-h-48 overflow-auto">
                      {previewData.slice(0, 5).map((linha, index) => (
                        <div key={index} className={`${index === 0 ? 'font-bold text-blue-700 border-b pb-1 mb-1' : 'text-gray-700'} truncate`}>
                          {linha.join(' | ')}
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={iniciarImportacao}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={importing || isProcessing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      🚀 Iniciar Importação
                    </Button>
                  </div>
                )}

                {/* Botão upload quando não há arquivo */}
                {!arquivo && (
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* COLUNA 3 - Estrutura de Dados */}
          <div className="lg:col-span-1">
            <Card className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-blue-50/90">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  📊 Estrutura Obrigatória do Arquivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  O arquivo deve conter <strong>exatamente 14 colunas</strong> nesta ordem:
                </p>
                
                <div className="space-y-2 text-xs font-mono bg-white/80 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-[auto_1fr] gap-2 text-gray-700">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span><strong>Contrato</strong> (número do contrato)</span>
                    <span className="text-blue-600 font-bold">2.</span>
                    <span><strong>Data Venda</strong> (DD/MM/YY HH:MM:SS)</span>
                    <span className="text-blue-600 font-bold">3.</span>
                    <span><strong>Código Cliente</strong> (código numérico ERP)</span>
                    <span className="text-blue-600 font-bold">4.</span>
                    <span><strong>Cliente</strong> (nome completo)</span>
                    <span className="text-blue-600 font-bold">5.</span>
                    <span><strong>Vendedor</strong> (nome do vendedor)</span>
                    <span className="text-blue-600 font-bold">6.</span>
                    <span><strong>Usuario</strong> (usuário do sistema)</span>
                    <span className="text-blue-600 font-bold">7.</span>
                    <span><strong>Tipo Venda</strong> (NUBANK_PIX, REDE_DEBITO, etc.)</span>
                    <span className="text-blue-600 font-bold">8.</span>
                    <span><strong>Vlr. Venda</strong> (valor bruto)</span>
                    <span className="text-blue-600 font-bold">9.</span>
                    <span><strong>Vlr. Acr.</strong> (valor acréscimo)</span>
                    <span className="text-blue-600 font-bold">10.</span>
                    <span><strong>Tax Cad.</strong> (taxa cadastro)</span>
                    <span className="text-blue-600 font-bold">11.</span>
                    <span><strong>Des.Pro.</strong> (desconto produto)</span>
                    <span className="text-blue-600 font-bold">12.</span>
                    <span><strong>Des.Ger.</strong> (desconto geral)</span>
                    <span className="text-blue-600 font-bold">13.</span>
                    <span><strong>Trocas</strong> (valor de trocas)</span>
                    <span className="text-blue-600 font-bold">14.</span>
                    <span><strong>Liquido</strong> (valor líquido final)</span>
                  </div>
                </div>

                <div className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-yellow-700 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Observações importantes:</span>
                  </div>
                  <ul className="text-xs text-yellow-700 space-y-1 ml-6">
                    <li>⚠️ Manter exatamente essa ordem</li>
                    <li>⚠️ Primeira linha deve conter os cabeçalhos</li>
                    <li>⚠️ Para CSV: usar separador vírgula (,)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Card de Exemplo de Dados */}
        <Card className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-green-50/90">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <CheckCircle className="w-6 h-6 text-green-600" />
              ✅ Exemplo de Dados Válidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Exemplo de linhas do ERP:</p>
            <div className="bg-white rounded-lg p-4 font-mono text-xs overflow-x-auto border">
              <div className="space-y-1 text-gray-700">
                <div className="text-blue-700 font-bold border-b pb-1 mb-2">
                  Contrato,Data Venda,Código Cliente,Cliente,Vendedor,Usuario,Tipo Venda,Vlr. Venda,Vlr. Acr.,Tax Cad.,Des.Pro.,Des.Ger.,Trocas,Liquido
                </div>
                <div>23743,21/07/25 09:12:37,4908,FERNANDA ANTONIO FRARE,JHENIFFER,LOJA01,NUBANK_PIX,729.60,0.00,0.00,0.00,364.80,0.00,364.80</div>
                <div>23744,21/07/25 09:46:40,2308,DEBORA APARECIDA BERTI,JHENIFFER,LOJA01,NUBANK_PIX,69.90,0.00,0.00,0.00,34.95,0.00,34.95</div>
                <div>23745,21/07/25 09:57:01,3925,ELIANE RIZO FIUZA,JHENIFFER,LOJA01,REDE_DEBITO,49.90,0.00,0.00,0.00,0.00,0.00,49.90</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Importações */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900">
              <Clock className="w-6 h-6 text-gray-600" />
              📋 Histórico de Importações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historicoImportacoes.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="text-6xl text-gray-300">📋</div>
                <p className="text-gray-500 font-medium">Nenhuma importação realizada</p>
                <p className="text-sm text-gray-400">Suas importações aparecerão aqui</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Data da Importação</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Arquivo</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Vendas Processadas</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Clientes Criados</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoImportacoes.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-2 text-sm text-gray-700">{item.dataImportacao}</td>
                        <td className="py-3 px-2 text-sm text-gray-700">{item.nomeArquivo}</td>
                        <td className="py-3 px-2 text-sm text-gray-700">{item.vendasProcessadas} vendas</td>
                        <td className="py-3 px-2 text-sm text-gray-700">{item.clientesCriados} clientes</td>
                        <td className="py-3 px-2">
                          <Badge 
                            className={
                              item.status === 'sucesso' ? 'bg-green-100/80 text-green-700' :
                              item.status === 'erro' ? 'bg-red-100/80 text-red-700' :
                              'bg-yellow-100/80 text-yellow-700'
                            }
                          >
                            {item.status === 'sucesso' ? '✅ Sucesso' : 
                             item.status === 'erro' ? '❌ Erro' : '⚠️ Parcial'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              Ver
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                              <FileDown className="w-3 h-3 mr-1" />
                              Log
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Resultado da Importação */}
        {renderModalResultado()}
        
        {/* Indicador de processamento */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
              <div className="text-center space-y-4">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <h3 className="text-lg font-semibold">Processando Importação...</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{Math.round(progress)}% concluído</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}