import { useState, useEffect, useMemo } from 'react';
import { addDays, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Hooks do Supabase
import { useFornecedoresSupabase } from '@/hooks/useFornecedoresSupabase';
import { useContasPagar } from '@/hooks/useContasPagar';
import { usePlanoContas } from '@/hooks/usePlanoContas';

export interface FiltrosRelatorio {
  periodo_inicio: Date;
  periodo_fim: Date;
  tipo_relatorio: 'resumo' | 'fornecedores' | 'contas' | 'fluxo' | 'categorias';
  agrupamento: 'categoria' | 'fornecedor' | 'status' | 'vencimento';
  formato_saida: 'visualizar' | 'pdf' | 'excel' | 'csv';
}

export interface ResumoExecutivo {
  total_fornecedores_ativos: number;
  contas_pendentes: {
    valor: number;
    quantidade: number;
  };
  proximos_vencimentos: {
    valor: number;
    quantidade: number;
  };
  ticket_medio_fornecedor: number;
  status_liquidez: 'alto' | 'medio' | 'baixo';
}

export interface RelatorioFornecedores {
  top_fornecedores: Array<{
    id: number;
    nome: string;
    valor_total: number;
    percentual: number;
  }>;
  fornecedores_por_tipo: Array<{
    tipo: string;
    quantidade: number;
    valor_total: number;
  }>;
  status_atividade: {
    ativos: number;
    inativos: number;
  };
}

export interface AnaliseContasPagar {
  contas_por_status: Array<{
    status: string;
    quantidade: number;
    valor: number;
    cor: string;
  }>;
  aging_contas: Array<{
    faixa: string;
    quantidade: number;
    valor: number;
    percentual: number;
  }>;
  valor_medio_conta: number;
  evolucao_temporal: Array<{
    mes: string;
    pagas: number;
    pendentes: number;
    vencidas: number;
  }>;
}

export interface DadosGrafico {
  periodo: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

const PERIODOS_RAPIDOS = [
  { label: 'Este mês', valor: 'mes_atual' },
  { label: 'Mês anterior', valor: 'mes_anterior' },
  { label: 'Trimestre', valor: 'trimestre' },
  { label: 'Ano', valor: 'ano' }
];

export const useRelatoriosGerais = () => {
  const { fornecedores } = useFornecedoresSupabase();
  const { contas } = useContasPagar();
  const { planoContas: planos } = usePlanoContas();
  
  // Estados principais
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    periodo_inicio: startOfMonth(new Date()),
    periodo_fim: endOfMonth(new Date()),
    tipo_relatorio: 'resumo',
    agrupamento: 'categoria',
    formato_saida: 'visualizar'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dados, setDados] = useState<any>(null);

  // Função para aplicar período rápido
  const aplicarPeriodoRapido = (periodo: string) => {
    const hoje = new Date();
    let inicio: Date;
    let fim: Date;

    switch (periodo) {
      case 'mes_atual':
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
        break;
      case 'mes_anterior':
        const mesAnterior = subMonths(hoje, 1);
        inicio = startOfMonth(mesAnterior);
        fim = endOfMonth(mesAnterior);
        break;
      case 'trimestre':
        inicio = startOfMonth(subMonths(hoje, 2));
        fim = endOfMonth(hoje);
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = new Date(hoje.getFullYear(), 11, 31);
        break;
      default:
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
    }

    setFiltros(prev => ({
      ...prev,
      periodo_inicio: inicio,
      periodo_fim: fim
    }));
  };

  // Cálculo do resumo executivo
  const resumoExecutivo = useMemo((): ResumoExecutivo => {
    const fornecedoresAtivos = fornecedores.filter(f => f.ativo).length;
    
    const contasPendentes = contas.filter(c => 
      c.status === 'pendente' && 
      new Date(c.data_vencimento) >= filtros.periodo_inicio &&
      new Date(c.data_vencimento) <= filtros.periodo_fim
    );

    const proximosVencimentos = contas.filter(c =>
      c.status === 'pendente' &&
      new Date(c.data_vencimento) <= addDays(new Date(), 7)
    );

    const totalGasto = contas
      .filter(c => c.status === 'pago')
      .reduce((acc, c) => acc + c.valor_final, 0);

    const ticketMedio = fornecedoresAtivos > 0 ? totalGasto / fornecedoresAtivos : 0;

    return {
      total_fornecedores_ativos: fornecedoresAtivos,
      contas_pendentes: {
        valor: contasPendentes.reduce((acc, c) => acc + c.valor_final, 0),
        quantidade: contasPendentes.length
      },
      proximos_vencimentos: {
        valor: proximosVencimentos.reduce((acc, c) => acc + c.valor_final, 0),
        quantidade: proximosVencimentos.length
      },
      ticket_medio_fornecedor: ticketMedio,
      status_liquidez: ticketMedio > 50000 ? 'alto' : ticketMedio > 20000 ? 'medio' : 'baixo'
    };
  }, [filtros, fornecedores, contas]);

  // Relatório de fornecedores
  const relatorioFornecedores = useMemo((): RelatorioFornecedores => {
    const fornecedoresComValor = fornecedores.map(f => ({
      ...f,
      valor_calculado: contas
        .filter(c => c.fornecedor_id === f.id)
        .reduce((acc, c) => acc + c.valor_final, 0)
    }));

    const topFornecedores = fornecedoresComValor
      .sort((a, b) => b.valor_calculado - a.valor_calculado)
      .slice(0, 10)
      .map(f => {
        const valorTotal = fornecedoresComValor.reduce((acc, item) => acc + item.valor_calculado, 0);
        return {
          id: f.id,
          nome: f.nome,
          valor_total: f.valor_calculado,
          percentual: valorTotal > 0 ? (f.valor_calculado / valorTotal) * 100 : 0
        };
      });

    const tiposCount = fornecedores.reduce((acc, f) => {
      const tipo = f.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica';
      if (!acc[tipo]) {
        acc[tipo] = { quantidade: 0, valor_total: 0 };
      }
      acc[tipo].quantidade++;
      acc[tipo].valor_total += fornecedoresComValor.find(fv => fv.id === f.id)?.valor_calculado || 0;
      return acc;
    }, {} as Record<string, any>);

    const fornecedoresPorTipo = Object.entries(tiposCount).map(([tipo, dados]) => ({
      tipo,
      quantidade: dados.quantidade as number,
      valor_total: dados.valor_total as number
    }));

    return {
      top_fornecedores: topFornecedores,
      fornecedores_por_tipo: fornecedoresPorTipo,
      status_atividade: {
        ativos: fornecedores.filter(f => f.ativo).length,
        inativos: fornecedores.filter(f => !f.ativo).length
      }
    };
  }, [fornecedores, contas]);

  // Análise de contas a pagar
  const analiseContasPagar = useMemo((): AnaliseContasPagar => {
    const statusColors = {
      pendente: '#3B82F6',
      pago: '#10B981',
      vencido: '#EF4444',
      cancelado: '#6B7280'
    };

    const contasPorStatus = Object.entries(
      contas.reduce((acc, conta) => {
        if (!acc[conta.status]) {
          acc[conta.status] = { quantidade: 0, valor: 0 };
        }
        acc[conta.status].quantidade++;
        acc[conta.status].valor += conta.valor_final;
        return acc;
      }, {} as Record<string, any>)
    ).map(([status, dados]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      quantidade: (dados as any).quantidade,
      valor: (dados as any).valor,
      cor: statusColors[status as keyof typeof statusColors] || '#6B7280'
    }));

    // Aging de contas
    const hoje = new Date();
    const agingBuckets = {
      '0-30 dias': { min: 0, max: 30 },
      '31-60 dias': { min: 31, max: 60 },
      '61-90 dias': { min: 61, max: 90 },
      '+90 dias': { min: 91, max: Infinity }
    };

    const agingContas = Object.entries(agingBuckets).map(([faixa, range]) => {
      const contasNaFaixa = contas.filter(conta => {
        if (conta.status !== 'vencido') return false;
        const diasVencido = Math.floor(
          (hoje.getTime() - new Date(conta.data_vencimento).getTime()) / (1000 * 60 * 60 * 24)
        );
        return diasVencido >= range.min && diasVencido <= range.max;
      });

      const valor = contasNaFaixa.reduce((acc, c) => acc + c.valor_final, 0);
      const totalVencidas = contas
        .filter(c => c.status === 'vencido')
        .reduce((acc, c) => acc + c.valor_final, 0);

      return {
        faixa,
        quantidade: contasNaFaixa.length,
        valor,
        percentual: totalVencidas > 0 ? (valor / totalVencidas) * 100 : 0
      };
    });

    const valorMedio = contas.length > 0 
      ? contas.reduce((acc, c) => acc + c.valor_final, 0) / contas.length 
      : 0;

    // Evolução temporal (últimos 6 meses)
    const evolucaoTemporal = Array.from({ length: 6 }, (_, i) => {
      const mes = subMonths(new Date(), 5 - i);
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);

      const contasDoMes = contas.filter(c => {
        const dataVenc = new Date(c.data_vencimento);
        return dataVenc >= inicioMes && dataVenc <= fimMes;
      });

      return {
        mes: format(mes, 'MMM/yy'),
        pagas: contasDoMes.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor_final, 0),
        pendentes: contasDoMes.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor_final, 0),
        vencidas: contasDoMes.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor_final, 0)
      };
    });

    return {
      contas_por_status: contasPorStatus,
      aging_contas: agingContas,
      valor_medio_conta: valorMedio,
      evolucao_temporal: evolucaoTemporal
    };
  }, [contas]);

  // Gerar relatório
  const gerarRelatorio = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const dadosConsolidados = {
        resumo_executivo: resumoExecutivo,
        relatorio_fornecedores: relatorioFornecedores,
        analise_contas_pagar: analiseContasPagar,
        periodo: {
          inicio: format(filtros.periodo_inicio, 'dd/MM/yyyy'),
          fim: format(filtros.periodo_fim, 'dd/MM/yyyy')
        },
        gerado_em: new Date().toISOString()
      };

      setDados(dadosConsolidados);
    } catch (err) {
      setError('Erro ao gerar relatório. Tente novamente.');
      console.error('Erro ao gerar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  // Exportar PDF
  const exportarPDF = async () => {
    if (!dados) return;
    
    setLoading(true);
    try {
      // Implementar exportação PDF futuramente
      // exportação PDF em desenvolvimento
      // Simular export
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      setError('Erro ao exportar PDF');
    } finally {
      setLoading(false);
    }
  };

  // Exportar Excel
  const exportarExcel = async () => {
    if (!dados) return;
    
    setLoading(true);
    try {
      // Implementar exportação Excel futuramente
      // exportação Excel em desenvolvimento
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      setError('Erro ao exportar Excel');
    } finally {
      setLoading(false);
    }
  };

  // Auto-gerar relatório quando filtros mudam
  useEffect(() => {
    gerarRelatorio();
  }, [filtros.periodo_inicio, filtros.periodo_fim, filtros.tipo_relatorio]);

  return {
    // Estados
    filtros,
    setFiltros,
    loading,
    error,
    dados,
    
    // Dados calculados
    resumoExecutivo,
    relatorioFornecedores,
    analiseContasPagar,
    
    // Funções
    gerarRelatorio,
    exportarPDF,
    exportarExcel,
    aplicarPeriodoRapido,
    
    // Constantes
    PERIODOS_RAPIDOS
  };
};