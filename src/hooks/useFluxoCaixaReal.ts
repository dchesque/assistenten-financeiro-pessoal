import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  MovimentacaoFluxo, 
  ProjecaoFluxo, 
  AlertaFluxo, 
  IndicadorFluxo, 
  FiltrosFluxoCaixa, 
  DadosGraficoFluxo 
} from '@/types/fluxoCaixa';

export const useFluxoCaixaReal = () => {
  const [loading, setLoading] = useState(true);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoFluxo[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadorFluxo>({
    saldo_atual: 0,
    entradas_mes: 0,
    entradas_mes_qtd: 0,
    saidas_mes: 0,
    saidas_mes_qtd: 0,
    resultado_mes: 0,
    saldo_projetado_30d: 0,
    status_liquidez: 'saudavel',
    dias_caixa: 0,
    tendencia_mes: 'positiva',
    ultima_atualizacao: new Date()
  });
  const [projecoes, setProjecoes] = useState<ProjecaoFluxo[]>([]);
  const [alertas, setAlertas] = useState<AlertaFluxo[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<DadosGraficoFluxo[]>([]);
  const [filtros, setFiltros] = useState<FiltrosFluxoCaixa>({
    data_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tipo_movimento: ['entrada', 'saida', 'transferencia'],
    categoria_ids: [],
    status: ['realizado', 'previsto', 'em_atraso'],
    origem: ['contas_pagar', 'vendas', 'bancos', 'manual'],
    banco_ids: [],
    periodo_rapido: '30_dias'
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Buscar movimentações bancárias (entradas e saídas reais)
      const { data: movimentacoesBancarias, error: errorBancos } = await supabase
        .from('movimentacoes_bancarias')
        .select(`
          *,
          bancos(nome)
        `)
        .eq('ativo', true)
        .order('data_movimentacao', { ascending: false });

      if (errorBancos) throw errorBancos;

      // Buscar contas a pagar (saídas previstas)
      const { data: contasPagar, error: errorContas } = await supabase
        .from('contas_pagar')
        .select(`
          *,
          fornecedores(nome),
          plano_contas(nome, cor)
        `)
        .order('data_vencimento', { ascending: false });

      if (errorContas) throw errorContas;

      // Buscar vendas (entradas)
      const { data: vendas, error: errorVendas } = await supabase
        .from('vendas')
        .select(`
          *,
          clientes(nome),
          plano_contas(nome, cor)
        `)
        .eq('ativo', true)
        .order('data_venda', { ascending: false });

      if (errorVendas) throw errorVendas;

      // Processar dados em formato unificado
      const movimentacoesUnificadas = await processarMovimentacoes(
        movimentacoesBancarias || [],
        contasPagar || [],
        vendas || []
      );

      setMovimentacoes(movimentacoesUnificadas);
      
      // Calcular indicadores, projeções e alertas
      calcularIndicadores(movimentacoesUnificadas);
      gerarProjecoes(movimentacoesUnificadas);
      gerarAlertas(movimentacoesUnificadas);
      gerarDadosGrafico(movimentacoesUnificadas);

    } catch (error) {
      console.error('Erro ao carregar dados do fluxo de caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarMovimentacoes = async (
    bancarias: any[],
    contas: any[],
    vendas: any[]
  ): Promise<MovimentacaoFluxo[]> => {
    const movimentacoes: MovimentacaoFluxo[] = [];

    // Processar movimentações bancárias (dados reais)
    bancarias.forEach(mov => {
      movimentacoes.push({
        id: `banco_${mov.id}`,
        data: new Date(mov.data_movimentacao),
        descricao: mov.descricao,
        categoria: mov.categoria || 'Sem categoria',
        categoria_id: 0,
        categoria_cor: '#6366f1',
        tipo: mov.tipo_movimentacao === 'entrada' ? 'entrada' : 'saida',
        valor: Math.abs(mov.valor),
        status: 'realizado',
        origem: 'bancos',
        origem_id: mov.id.toString(),
        saldo_acumulado: mov.saldo_posterior || 0,
        banco_id: mov.banco_id,
        banco_nome: mov.bancos?.nome,
        created_at: new Date(mov.created_at),
        updated_at: new Date(mov.updated_at)
      });
    });

    // Processar vendas (entradas)
    vendas.forEach(venda => {
      movimentacoes.push({
        id: `venda_${venda.id}`,
        data: new Date(venda.data_venda),
        descricao: `Venda - ${venda.observacoes || 'Sem descrição'}`,
        categoria: venda.plano_contas?.nome || 'Vendas',
        categoria_id: venda.plano_conta_id || 0,
        categoria_cor: venda.plano_contas?.cor || '#10b981',
        tipo: 'entrada',
        valor: venda.valor_final,
        status: 'realizado',
        origem: 'vendas',
        origem_id: venda.id.toString(),
        saldo_acumulado: 0,
        cliente_nome: venda.clientes?.nome,
        created_at: new Date(venda.created_at),
        updated_at: new Date(venda.updated_at)
      });
    });

    // Processar contas a pagar (saídas previstas ou realizadas)
    contas.forEach(conta => {
      const status = conta.status === 'pago' ? 'realizado' : 
                   new Date(conta.data_vencimento) < new Date() ? 'em_atraso' : 'previsto';

      movimentacoes.push({
        id: `conta_${conta.id}`,
        data: new Date(conta.data_vencimento),
        descricao: conta.descricao,
        categoria: conta.plano_contas?.nome || 'Despesas',
        categoria_id: conta.plano_conta_id,
        categoria_cor: conta.plano_contas?.cor || '#ef4444',
        tipo: 'saida',
        valor: conta.valor_final,
        status,
        origem: 'contas_pagar',
        origem_id: conta.id.toString(),
        saldo_acumulado: 0,
        fornecedor_nome: conta.fornecedores?.nome,
        documento_referencia: conta.documento_referencia,
        created_at: new Date(conta.created_at),
        updated_at: new Date(conta.updated_at)
      });
    });

    // Ordenar por data
    return movimentacoes.sort((a, b) => b.data.getTime() - a.data.getTime());
  };

  const calcularIndicadores = (movimentacoes: MovimentacaoFluxo[]) => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // Movimentações do mês atual
    const movMes = movimentacoes.filter(mov => 
      new Date(mov.data) >= inicioMes && mov.status === 'realizado'
    );

    const entradas = movMes.filter(mov => mov.tipo === 'entrada');
    const saidas = movMes.filter(mov => mov.tipo === 'saida');

    const entradasMes = entradas.reduce((acc, mov) => acc + mov.valor, 0);
    const saidasMes = saidas.reduce((acc, mov) => acc + mov.valor, 0);

    // Saldo atual baseado na última movimentação bancária
    const ultimaMovBancaria = movimentacoes
      .filter(mov => mov.origem === 'bancos' && mov.saldo_acumulado > 0)
      .sort((a, b) => b.data.getTime() - a.data.getTime())[0];

    const saldoAtual = ultimaMovBancaria?.saldo_acumulado || 0;

    const indicadoresCalculados: IndicadorFluxo = {
      saldo_atual: saldoAtual,
      entradas_mes: entradasMes,
      entradas_mes_qtd: entradas.length,
      saidas_mes: saidasMes,
      saidas_mes_qtd: saidas.length,
      resultado_mes: entradasMes - saidasMes,
      saldo_projetado_30d: saldoAtual + (entradasMes - saidasMes),
      status_liquidez: saldoAtual > 10000 ? 'saudavel' : saldoAtual > 0 ? 'atencao' : 'critico',
      dias_caixa: saidasMes > 0 ? Math.floor(saldoAtual / (saidasMes / 30)) : 999,
      tendencia_mes: entradasMes > saidasMes ? 'positiva' : 'negativa',
      ultima_atualizacao: new Date()
    };

    setIndicadores(indicadoresCalculados);
  };

  const gerarProjecoes = (movimentacoes: MovimentacaoFluxo[]) => {
    const hoje = new Date();
    const ultimoMes = movimentacoes.filter(mov => {
      const dataMovimentacao = new Date(mov.data);
      const mes30DiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      return dataMovimentacao >= mes30DiasAtras && mov.status === 'realizado';
    });

    const mediaEntradas = ultimoMes
      .filter(mov => mov.tipo === 'entrada')
      .reduce((acc, mov) => acc + mov.valor, 0) / 30;

    const mediaSaidas = ultimoMes
      .filter(mov => mov.tipo === 'saida')
      .reduce((acc, mov) => acc + mov.valor, 0) / 30;

    const saldoAtual = indicadores.saldo_atual;

    const periodos = [
      { periodo: '7_dias' as const, dias: 7, confianca: 85 },
      { periodo: '30_dias' as const, dias: 30, confianca: 75 },
      { periodo: '90_dias' as const, dias: 90, confianca: 60 }
    ];

    const projecoesCalculadas: ProjecaoFluxo[] = periodos.map(({ periodo, dias, confianca }) => {
      const entradasPrevistas = mediaEntradas * dias;
      const saidasPrevistas = mediaSaidas * dias;
      const variacao = entradasPrevistas - saidasPrevistas;
      const saldoFinal = saldoAtual + variacao;

      let status: 'positivo' | 'negativo' | 'critico' | 'estavel' = 'estavel';
      if (variacao > saldoAtual * 0.1) status = 'positivo';
      else if (saldoFinal < 0) status = 'critico';
      else if (variacao < 0) status = 'negativo';

      return {
        periodo,
        periodo_label: `Próximos ${dias} dias`,
        data_inicio: hoje,
        data_fim: new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000),
        saldo_inicial: saldoAtual,
        entradas_previstas: entradasPrevistas,
        saidas_previstas: saidasPrevistas,
        saldo_final: saldoFinal,
        variacao,
        variacao_percentual: saldoAtual > 0 ? (variacao / saldoAtual) * 100 : 0,
        confianca,
        status,
        detalhes: {
          vendas_previstas: entradasPrevistas * 0.8,
          contas_a_pagar: saidasPrevistas * 0.9,
          transferencias: 0,
          outras_entradas: entradasPrevistas * 0.2,
          outras_saidas: saidasPrevistas * 0.1
        }
      };
    });

    setProjecoes(projecoesCalculadas);
  };

  const gerarAlertas = (movimentacoes: MovimentacaoFluxo[]) => {
    const alertasGerados: AlertaFluxo[] = [];
    const hoje = new Date();

    // Alerta de saldo baixo
    if (indicadores.saldo_atual < 5000) {
      alertasGerados.push({
        id: 'saldo-baixo',
        tipo: 'critico',
        titulo: 'Saldo Baixo',
        descricao: `Saldo atual de R$ ${indicadores.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} está abaixo do recomendado`,
        valor_impacto: indicadores.saldo_atual,
        prioridade: 'alta',
        acoes_sugeridas: [
          'Acelerar cobrança de recebíveis',
          'Negociar prazos com fornecedores',
          'Revisar gastos não essenciais'
        ],
        status: 'ativo',
        created_at: new Date()
      });
    }

    // Contas vencidas
    const contasVencidas = movimentacoes.filter(mov => 
      mov.status === 'em_atraso' && mov.tipo === 'saida'
    );

    if (contasVencidas.length > 0) {
      const valorVencido = contasVencidas.reduce((acc, mov) => acc + mov.valor, 0);
      alertasGerados.push({
        id: 'contas-vencidas',
        tipo: 'atencao',
        titulo: `${contasVencidas.length} Contas Vencidas`,
        descricao: `R$ ${valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em contas em atraso`,
        valor_impacto: valorVencido,
        prioridade: 'alta',
        acoes_sugeridas: [
          'Priorizar pagamento das contas vencidas',
          'Renegociar condições com fornecedores',
          'Evitar juros e multas'
        ],
        status: 'ativo',
        created_at: new Date()
      });
    }

    setAlertas(alertasGerados);
  };

  const gerarDadosGrafico = (movimentacoes: MovimentacaoFluxo[]) => {
    const dados: DadosGraficoFluxo[] = [];
    const hoje = new Date();

    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const mesData = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0);
      
      const movimentacoesMes = movimentacoes.filter(mov => {
        const dataMovimentacao = new Date(mov.data);
        return dataMovimentacao >= mesData && 
               dataMovimentacao <= proximoMes &&
               mov.status === 'realizado';
      });

      const entradas = movimentacoesMes
        .filter(mov => mov.tipo === 'entrada')
        .reduce((acc, mov) => acc + mov.valor, 0);

      const saidas = movimentacoesMes
        .filter(mov => mov.tipo === 'saida')
        .reduce((acc, mov) => acc + mov.valor, 0);

      dados.push({
        periodo: mesData.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        entradas,
        saidas,
        saldo_acumulado: entradas - saidas,
        data: mesData,
        is_projecao: false
      });
    }

    setDadosGrafico(dados);
  };

  const aplicarPeriodoRapido = (periodo: string) => {
    const hoje = new Date();
    let dataInicio: Date;

    switch (periodo) {
      case '7_dias':
        dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30_dias':
        dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90_dias':
        dataInicio = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6_meses':
        dataInicio = new Date(hoje.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setFiltros(prev => ({
      ...prev,
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: hoje.toISOString().split('T')[0],
      periodo_rapido: periodo as any
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      data_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      data_fim: new Date().toISOString().split('T')[0],
      tipo_movimento: ['entrada', 'saida', 'transferencia'],
      categoria_ids: [],
      status: ['realizado', 'previsto', 'em_atraso'],
      origem: ['contas_pagar', 'vendas', 'bancos', 'manual'],
      banco_ids: [],
      periodo_rapido: '30_dias'
    });
  };

  return {
    movimentacoes,
    indicadores,
    projecoes,
    alertas,
    dadosGrafico,
    loading,
    filtros,
    setFiltros,
    aplicarPeriodoRapido,
    limparFiltros,
    recarregar: carregarDados
  };
};