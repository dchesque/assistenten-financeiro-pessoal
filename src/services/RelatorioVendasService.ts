import { supabase } from '@/integrations/supabase/client';
import { type VendaCompleta, type RelatorioVendasPeriodo } from '@/types/venda';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface RelatorioConfig {
  dataInicio: string;
  dataFim: string;
  vendedor?: string;
  clienteId?: number;
  categoriaId?: number;
  formaPagamento?: string;
  tipoVenda?: string;
  incluirDetalhes?: boolean;
  incluirGraficos?: boolean;
  formato?: 'pdf' | 'excel' | 'csv' | 'json';
}

export interface DadosRelatorio {
  resumo: RelatorioVendasPeriodo;
  vendas: VendaCompleta[];
  graficos: {
    evolucaoDiaria: Array<{ data: string; vendas: number; valor: number }>;
    vendasPorFormaPagamento: Array<{ forma: string; quantidade: number; valor: number; percentual: number }>;
    vendasPorCategoria: Array<{ categoria: string; quantidade: number; valor: number; percentual: number }>;
    vendasPorVendedor: Array<{ vendedor: string; quantidade: number; valor: number; comissao: number }>;
    ticketMedioPorPeriodo: Array<{ periodo: string; ticketMedio: number }>;
  };
  comparacoes: {
    periodoAnterior: {
      vendas: number;
      valor: number;
      crescimento: number;
    };
    anoAnterior: {
      vendas: number;
      valor: number;
      crescimento: number;
    };
  };
}

export class RelatorioVendasService {
  
  /**
   * Gera relatório completo de vendas
   */
  static async gerarRelatorio(config: RelatorioConfig): Promise<DadosRelatorio> {
    try {
      // 1. Buscar dados do relatório usando a função SQL
      const { data: resumoData, error: resumoError } = await supabase.rpc('relatorio_vendas_periodo', {
        data_inicio: config.dataInicio,
        data_fim: config.dataFim,
        vendedor_filtro: config.vendedor || null,
        cliente_id_filtro: config.clienteId || null
      });

      if (resumoError) {
        throw new Error(`Erro ao gerar resumo: ${resumoError.message}`);
      }

      const resumo = resumoData?.[0] || this.criarResumoVazio();

      // 2. Buscar vendas detalhadas se necessário
      let vendas: VendaCompleta[] = [];
      if (config.incluirDetalhes) {
        vendas = await this.buscarVendasDetalhadas(config);
      }

      // 3. Gerar dados dos gráficos
      const graficos = await this.gerarDadosGraficos(config, vendas);

      // 4. Calcular comparações
      const comparacoes = await this.calcularComparacoes(config);

      return {
        resumo: {
          totalVendas: Number(resumo.total_vendas || 0),
          valorBruto: Number(resumo.valor_bruto || 0),
          valorDescontos: Number(resumo.valor_descontos || 0),
          valorLiquido: Number(resumo.valor_liquido || 0),
          totalComissoes: Number(resumo.total_comissoes || 0),
          ticketMedio: Number(resumo.ticket_medio || 0),
          vendasPorFormaPagamento: resumo.vendas_por_forma_pagamento || [],
          vendasPorCategoria: resumo.vendas_por_categoria || [],
          vendasPorVendedor: resumo.vendas_por_vendedor || [],
          evolucaoDiaria: resumo.evolucao_diaria || []
        },
        vendas,
        graficos,
        comparacoes
      };

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Busca vendas detalhadas com filtros
   */
  private static async buscarVendasDetalhadas(config: RelatorioConfig): Promise<VendaCompleta[]> {
    let query = supabase
      .from('vw_vendas_completas')
      .select('*')
      .gte('data_venda', config.dataInicio)
      .lte('data_venda', config.dataFim);

    if (config.vendedor) {
      query = query.eq('vendedor', config.vendedor);
    }

    if (config.clienteId) {
      query = query.eq('cliente_id', config.clienteId);
    }

    if (config.categoriaId) {
      query = query.eq('plano_conta_id', config.categoriaId);
    }

    if (config.formaPagamento) {
      query = query.eq('forma_pagamento', config.formaPagamento);
    }

    if (config.tipoVenda) {
      query = query.eq('tipo_venda', config.tipoVenda);
    }

    query = query.order('data_venda', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar vendas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Gera dados para gráficos
   */
  private static async gerarDadosGraficos(config: RelatorioConfig, vendas: VendaCompleta[]) {
    // Se não temos vendas detalhadas, buscar dados básicos para gráficos
    if (vendas.length === 0) {
      vendas = await this.buscarVendasDetalhadas({
        ...config,
        incluirDetalhes: true
      });
    }

    // Evolução diária
    const evolucaoDiaria = this.calcularEvolucaoDiaria(vendas);

    // Vendas por forma de pagamento
    const vendasPorFormaPagamento = this.calcularVendasPorFormaPagamento(vendas);

    // Vendas por categoria
    const vendasPorCategoria = this.calcularVendasPorCategoria(vendas);

    // Vendas por vendedor
    const vendasPorVendedor = this.calcularVendasPorVendedor(vendas);

    // Ticket médio por período
    const ticketMedioPorPeriodo = this.calcularTicketMedioPorPeriodo(vendas);

    return {
      evolucaoDiaria,
      vendasPorFormaPagamento,
      vendasPorCategoria,
      vendasPorVendedor,
      ticketMedioPorPeriodo
    };
  }

  /**
   * Calcula comparações com períodos anteriores
   */
  private static async calcularComparacoes(config: RelatorioConfig) {
    const dataInicio = new Date(config.dataInicio);
    const dataFim = new Date(config.dataFim);
    const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));

    // Período anterior (mesmo número de dias antes)
    const inicioAnterior = new Date(dataInicio);
    inicioAnterior.setDate(inicioAnterior.getDate() - diasPeriodo);
    const fimAnterior = new Date(dataInicio);
    fimAnterior.setDate(fimAnterior.getDate() - 1);

    // Ano anterior (mesmo período do ano passado)
    const inicioAnoAnterior = new Date(dataInicio);
    inicioAnoAnterior.setFullYear(inicioAnoAnterior.getFullYear() - 1);
    const fimAnoAnterior = new Date(dataFim);
    fimAnoAnterior.setFullYear(fimAnoAnterior.getFullYear() - 1);

    // Buscar dados dos períodos comparativos
    const [periodoAnterior, anoAnterior] = await Promise.all([
      this.buscarResumoComparativo(inicioAnterior.toISOString().split('T')[0], fimAnterior.toISOString().split('T')[0]),
      this.buscarResumoComparativo(inicioAnoAnterior.toISOString().split('T')[0], fimAnoAnterior.toISOString().split('T')[0])
    ]);

    // Buscar dados do período atual para comparação
    const periodoAtual = await this.buscarResumoComparativo(config.dataInicio, config.dataFim);

    return {
      periodoAnterior: {
        vendas: periodoAnterior.vendas,
        valor: periodoAnterior.valor,
        crescimento: this.calcularCrescimento(periodoAtual.valor, periodoAnterior.valor)
      },
      anoAnterior: {
        vendas: anoAnterior.vendas,
        valor: anoAnterior.valor,
        crescimento: this.calcularCrescimento(periodoAtual.valor, anoAnterior.valor)
      }
    };
  }

  /**
   * Busca resumo comparativo simples
   */
  private static async buscarResumoComparativo(dataInicio: string, dataFim: string) {
    const { data, error } = await supabase
      .from('vw_vendas_completas')
      .select('valor_liquido')
      .gte('data_venda', dataInicio)
      .lte('data_venda', dataFim);

    if (error) {
      console.error('Erro ao buscar dados comparativos:', error);
      return { vendas: 0, valor: 0 };
    }

    const vendas = data?.length || 0;
    const valor = data?.reduce((sum, v) => sum + Number(v.valor_liquido), 0) || 0;

    return { vendas, valor };
  }

  /**
   * Calcula crescimento percentual
   */
  private static calcularCrescimento(valorAtual: number, valorAnterior: number): number {
    if (valorAnterior === 0) return valorAtual > 0 ? 100 : 0;
    return ((valorAtual - valorAnterior) / valorAnterior) * 100;
  }

  /**
   * Exporta relatório para Excel
   */
  static async exportarExcel(dados: DadosRelatorio, nomeArquivo: string = 'relatorio-vendas') {
    const workbook = XLSX.utils.book_new();

    // Aba 1: Resumo
    const resumoData = [
      ['RESUMO DO PERÍODO'],
      [''],
      ['Total de Vendas', dados.resumo.totalVendas],
      ['Valor Bruto', this.formatarMoeda(dados.resumo.valorBruto)],
      ['Descontos', this.formatarMoeda(dados.resumo.valorDescontos)],
      ['Valor Líquido', this.formatarMoeda(dados.resumo.valorLiquido)],
      ['Comissões', this.formatarMoeda(dados.resumo.totalComissoes)],
      ['Ticket Médio', this.formatarMoeda(dados.resumo.ticketMedio)],
      [''],
      ['COMPARAÇÕES'],
      [''],
      ['Crescimento vs Período Anterior', `${dados.comparacoes.periodoAnterior.crescimento.toFixed(2)}%`],
      ['Crescimento vs Ano Anterior', `${dados.comparacoes.anoAnterior.crescimento.toFixed(2)}%`]
    ];

    const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');

    // Aba 2: Vendas Detalhadas (se incluídas)
    if (dados.vendas.length > 0) {
      const vendasData = dados.vendas.map(venda => ({
        'ID': venda.id,
        'Data': venda.data_venda,
        'Hora': venda.hora_venda,
        'Cliente': venda.cliente_nome,
        'Vendedor': venda.vendedor || '',
        'Valor Total': venda.valor_total,
        'Desconto': venda.desconto || 0,
        'Valor Final': venda.valor_final,
        'Forma Pagamento': venda.forma_pagamento,
        'Parcelas': venda.parcelas || 1,
        'Categoria': venda.categoria_nome || '',
        'Comissão': venda.comissao_valor || 0,
        'Status': venda.status,
        'Observações': venda.observacoes || ''
      }));

      const vendasSheet = XLSX.utils.json_to_sheet(vendasData);
      XLSX.utils.book_append_sheet(workbook, vendasSheet, 'Vendas');
    }

    // Aba 3: Gráficos (dados)
    const graficosData = [
      ['VENDAS POR FORMA DE PAGAMENTO'],
      ['Forma de Pagamento', 'Quantidade', 'Valor', 'Percentual'],
      ...dados.graficos.vendasPorFormaPagamento.map(item => [
        item.forma, item.quantidade, item.valor, `${item.percentual.toFixed(2)}%`
      ]),
      [''],
      ['VENDAS POR CATEGORIA'],
      ['Categoria', 'Quantidade', 'Valor', 'Percentual'],
      ...dados.graficos.vendasPorCategoria.map(item => [
        item.categoria, item.quantidade, item.valor, `${item.percentual.toFixed(2)}%`
      ]),
      [''],
      ['VENDAS POR VENDEDOR'],
      ['Vendedor', 'Quantidade', 'Valor', 'Comissão'],
      ...dados.graficos.vendasPorVendedor.map(item => [
        item.vendedor, item.quantidade, item.valor, item.comissao
      ])
    ];

    const graficosSheet = XLSX.utils.aoa_to_sheet(graficosData);
    XLSX.utils.book_append_sheet(workbook, graficosSheet, 'Análises');

    // Salvar arquivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${nomeArquivo}-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * Exporta relatório para CSV
   */
  static async exportarCSV(dados: DadosRelatorio, nomeArquivo: string = 'vendas') {
    if (dados.vendas.length === 0) {
      throw new Error('Nenhuma venda para exportar');
    }

    const csvData = dados.vendas.map(venda => ({
      'ID': venda.id,
      'Data': venda.data_venda,
      'Hora': venda.hora_venda,
      'Cliente': venda.cliente_nome,
      'Documento': venda.cliente_documento,
      'Vendedor': venda.vendedor || '',
      'Valor Total': venda.valor_total,
      'Desconto': venda.desconto || 0,
      'Valor Final': venda.valor_final,
      'Forma Pagamento': venda.forma_pagamento,
      'Parcelas': venda.parcelas || 1,
      'Categoria': venda.categoria_nome || '',
      'Comissão %': venda.comissao_percentual || 0,
      'Comissão Valor': venda.comissao_valor || 0,
      'Status': venda.status,
      'Tipo': venda.tipo_venda,
      'Observações': venda.observacoes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${nomeArquivo}-${new Date().toISOString().split('T')[0]}.csv`);
  }

  // Métodos auxiliares para cálculos

  private static calcularEvolucaoDiaria(vendas: VendaCompleta[]) {
    const agrupamento = vendas.reduce((acc, venda) => {
      const data = venda.data_venda;
      if (!acc[data]) {
        acc[data] = { vendas: 0, valor: 0 };
      }
      acc[data].vendas++;
      acc[data].valor += Number(venda.valor_liquido);
      return acc;
    }, {} as Record<string, { vendas: number; valor: number }>);

    return Object.entries(agrupamento)
      .map(([data, stats]) => ({ data, ...stats }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  private static calcularVendasPorFormaPagamento(vendas: VendaCompleta[]) {
    const total = vendas.reduce((sum, v) => sum + Number(v.valor_liquido), 0);
    const agrupamento = vendas.reduce((acc, venda) => {
      const forma = venda.forma_pagamento || 'Não informado';
      if (!acc[forma]) acc[forma] = { quantidade: 0, valor: 0 };
      acc[forma].quantidade++;
      acc[forma].valor += Number(venda.valor_liquido);
      return acc;
    }, {} as Record<string, { quantidade: number; valor: number }>);

    return Object.entries(agrupamento).map(([forma, stats]) => ({
      forma,
      ...stats,
      percentual: total > 0 ? (stats.valor / total) * 100 : 0
    }));
  }

  private static calcularVendasPorCategoria(vendas: VendaCompleta[]) {
    const total = vendas.reduce((sum, v) => sum + Number(v.valor_liquido), 0);
    const agrupamento = vendas.reduce((acc, venda) => {
      const categoria = venda.categoria_nome || 'Sem categoria';
      if (!acc[categoria]) acc[categoria] = { quantidade: 0, valor: 0 };
      acc[categoria].quantidade++;
      acc[categoria].valor += Number(venda.valor_liquido);
      return acc;
    }, {} as Record<string, { quantidade: number; valor: number }>);

    return Object.entries(agrupamento).map(([categoria, stats]) => ({
      categoria,
      ...stats,
      percentual: total > 0 ? (stats.valor / total) * 100 : 0
    }));
  }

  private static calcularVendasPorVendedor(vendas: VendaCompleta[]) {
    const agrupamento = vendas.reduce((acc, venda) => {
      const vendedor = venda.vendedor || 'Não informado';
      if (!acc[vendedor]) acc[vendedor] = { quantidade: 0, valor: 0, comissao: 0 };
      acc[vendedor].quantidade++;
      acc[vendedor].valor += Number(venda.valor_liquido);
      acc[vendedor].comissao += Number(venda.comissao_valor || 0);
      return acc;
    }, {} as Record<string, { quantidade: number; valor: number; comissao: number }>);

    return Object.entries(agrupamento).map(([vendedor, stats]) => ({
      vendedor,
      ...stats
    }));
  }

  private static calcularTicketMedioPorPeriodo(vendas: VendaCompleta[]) {
    const agrupamento = vendas.reduce((acc, venda) => {
      const periodo = venda.data_venda.substring(0, 7); // YYYY-MM
      if (!acc[periodo]) acc[periodo] = { total: 0, quantidade: 0 };
      acc[periodo].total += Number(venda.valor_liquido);
      acc[periodo].quantidade++;
      return acc;
    }, {} as Record<string, { total: number; quantidade: number }>);

    return Object.entries(agrupamento)
      .map(([periodo, stats]) => ({
        periodo,
        ticketMedio: stats.quantidade > 0 ? stats.total / stats.quantidade : 0
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  private static criarResumoVazio(): any {
    return {
      total_vendas: 0,
      valor_bruto: 0,
      valor_descontos: 0,
      valor_liquido: 0,
      total_comissoes: 0,
      ticket_medio: 0,
      vendas_por_forma_pagamento: [],
      vendas_por_categoria: [],
      vendas_por_vendedor: [],
      evolucao_diaria: []
    };
  }

  private static formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
}