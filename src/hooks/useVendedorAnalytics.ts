import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Vendedor } from '@/types/vendedor';

export interface ProgressoMeta {
  meta: number;
  realizado: number;
  percentual: number;
  diasUteis: number;
  diasDecorridos: number;
  diasRestantes: number;
  percentualTempo: number;
  ritmoAtual: number;
  ritmoNecessario: number;
  projecaoFinal: number;
  status: 'critico' | 'em_risco' | 'no_ritmo' | 'na_frente';
  probabilidade: number;
}

export interface KPIVendedor {
  ticketMedio: {
    valor: number;
    mediaEquipe: number;
    percentualDiferenca: number;
    ranking: number;
  };
  participacaoFaturamento: {
    meuFaturamento: number;
    faturamentoEquipe: number;
    percentual: number;
    posicaoRanking: number;
  };
  taxaDevolucao: {
    minhaTaxa: number;
    taxaEquipe: number;
    ranking: number;
  };
  consistencia: {
    percentual: number;
    diasComVenda: number;
    diasUteis: number;
    mediaEquipe: number;
  };
}

export interface InsightAutomatico {
  tipo: 'urgente' | 'destaque' | 'oportunidade' | 'parabens';
  icone: string;
  titulo: string;
  descricao: string;
  acao: string;
  impacto?: string;
  cor: string;
}

export const useVendedorAnalytics = (vendedorId?: number, periodo: string = 'mes_atual') => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vendedor, setVendedor] = useState<Vendedor | null>(null);
  const [vendas, setVendas] = useState<any[]>([]);
  const [vendasEquipe, setVendasEquipe] = useState<any[]>([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState<any[]>([]);

  // Buscar dados do vendedor e vendas
  useEffect(() => {
    const buscarDados = async () => {
      if (!user || !vendedorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Buscar vendedor
        const { data: vendedorData, error: vendedorError } = await supabase
          .from('vendedores')
          .select('*')
          .eq('id', vendedorId)
          .eq('user_id', user.id)
          .single();

        if (vendedorError) throw vendedorError;
        setVendedor(vendedorData as Vendedor);

        // Calcular datas do período
        const hoje = new Date();
        let dataInicio: Date;
        let dataFim: Date = hoje;

        switch (periodo) {
          case 'mes_atual':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            break;
          case 'trimestre':
            dataInicio = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1);
            break;
          case 'semestre':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
            break;
          default:
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        }

        // Buscar vendas do vendedor
        const { data: vendasData, error: vendasError } = await supabase
          .from('vendas')
          .select(`
            *,
            clientes(nome)
          `)
          .eq('vendedor_id', vendedorId)
          .eq('ativo', true)
          .gte('data_venda', dataInicio.toISOString().split('T')[0])
          .lte('data_venda', dataFim.toISOString().split('T')[0])
          .order('data_venda', { ascending: true });

        if (vendasError) throw vendasError;
        setVendas(vendasData || []);

        // Buscar vendas da equipe para comparação
        const { data: equipeData, error: equipeError } = await supabase
          .from('vendas')
          .select(`
            *,
            vendedores(id, nome)
          `)
          .eq('user_id', user.id)
          .eq('ativo', true)
          .gte('data_venda', dataInicio.toISOString().split('T')[0])
          .lte('data_venda', dataFim.toISOString().split('T')[0]);

        if (equipeError) throw equipeError;
        setVendasEquipe(equipeData || []);

        // Buscar evolução mensal dos últimos 6 meses
        const seiseMesesAtras = new Date();
        seiseMesesAtras.setMonth(seiseMesesAtras.getMonth() - 5);
        seiseMesesAtras.setDate(1);

        const { data: evolucaoData, error: evolucaoError } = await supabase
          .from('vendas')
          .select('data_venda, valor_final')
          .eq('vendedor_id', vendedorId)
          .eq('ativo', true)
          .gte('data_venda', seiseMesesAtras.toISOString().split('T')[0])
          .order('data_venda', { ascending: true });

        if (evolucaoError) throw evolucaoError;
        setEvolucaoMensal(evolucaoData || []);

      } catch (error) {
        console.error('Erro ao buscar dados do vendedor:', error);
      } finally {
        setLoading(false);
      }
    };

    buscarDados();
  }, [vendedorId, periodo, user]);

  // Calcular progresso da meta
  const progressoMeta = useMemo((): ProgressoMeta | null => {
    if (!vendedor || !vendas) return null;

    const meta = vendedor.meta_mensal;
    const realizado = vendas.reduce((sum, v) => sum + v.valor_final, 0);

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Calcular dias úteis (segunda a sexta)
    const calcularDiasUteis = (inicio: Date, fim: Date) => {
      let dias = 0;
      const atual = new Date(inicio);
      while (atual <= fim) {
        const diaSemana = atual.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) { // Não é domingo nem sábado
          dias++;
        }
        atual.setDate(atual.getDate() + 1);
      }
      return dias;
    };

    const diasUteis = calcularDiasUteis(inicioMes, fimMes);
    const diasDecorridos = calcularDiasUteis(inicioMes, hoje);
    const diasRestantes = diasUteis - diasDecorridos;

    const percentual = meta > 0 ? (realizado / meta) * 100 : 0;
    const percentualTempo = diasUteis > 0 ? (diasDecorridos / diasUteis) * 100 : 0;

    const ritmoAtual = diasDecorridos > 0 ? realizado / diasDecorridos : 0;
    const ritmoNecessario = diasRestantes > 0 ? (meta - realizado) / diasRestantes : 0;

    const projecaoFinal = ritmoAtual * diasUteis;

    // Determinar status
    let status: ProgressoMeta['status'] = 'no_ritmo';
    if (percentualTempo > percentual + 15) status = 'critico';
    else if (percentualTempo > percentual + 5) status = 'em_risco';
    else if (percentual > percentualTempo + 10) status = 'na_frente';

    // Calcular probabilidade de atingir meta
    const diferenca = percentual - percentualTempo;
    let probabilidade = 50;
    if (diferenca > 10) probabilidade = 85;
    else if (diferenca > 0) probabilidade = 70;
    else if (diferenca > -10) probabilidade = 40;
    else probabilidade = 15;

    return {
      meta,
      realizado,
      percentual,
      diasUteis,
      diasDecorridos,
      diasRestantes,
      percentualTempo,
      ritmoAtual,
      ritmoNecessario,
      projecaoFinal,
      status,
      probabilidade
    };
  }, [vendedor, vendas]);

  // Calcular KPIs comparativos
  const kpis = useMemo((): KPIVendedor | null => {
    if (!vendas || !vendasEquipe || vendas.length === 0) return null;

    // Ticket médio
    const meuTicketMedio = vendas.reduce((sum, v) => sum + v.valor_final, 0) / vendas.length;
    
    const vendasOutrosVendedores = vendasEquipe.filter(v => v.vendedor_id !== vendedorId);
    const ticketMedioEquipe = vendasOutrosVendedores.length > 0 
      ? vendasOutrosVendedores.reduce((sum, v) => sum + v.valor_final, 0) / vendasOutrosVendedores.length 
      : 0;

    const percentualDiferencaTicket = ticketMedioEquipe > 0 
      ? ((meuTicketMedio - ticketMedioEquipe) / ticketMedioEquipe) * 100 
      : 0;

    // Participação no faturamento
    const meuFaturamento = vendas.reduce((sum, v) => sum + v.valor_final, 0);
    const faturamentoEquipe = vendasEquipe.reduce((sum, v) => sum + v.valor_final, 0);
    const participacaoPercentual = faturamentoEquipe > 0 ? (meuFaturamento / faturamentoEquipe) * 100 : 0;

    // Taxa de devolução
    const minhasDevoluções = vendas.filter(v => v.tipo_venda === 'devolucao').length;
    const minhaTaxaDevolucao = vendas.length > 0 ? (minhasDevoluções / vendas.length) * 100 : 0;
    
    const devolucõesEquipe = vendasEquipe.filter(v => v.tipo_venda === 'devolucao').length;
    const taxaDevolucaoEquipe = vendasEquipe.length > 0 ? (devolucõesEquipe / vendasEquipe.length) * 100 : 0;

    // Consistência
    const diasUnicos = new Set(vendas.map(v => v.data_venda.split('T')[0])).size;
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const diasUteisDecorridos = Math.min(progressoMeta?.diasDecorridos || 0, progressoMeta?.diasUteis || 0);
    const percentualConsistencia = diasUteisDecorridos > 0 ? (diasUnicos / diasUteisDecorridos) * 100 : 0;

    return {
      ticketMedio: {
        valor: meuTicketMedio,
        mediaEquipe: ticketMedioEquipe,
        percentualDiferenca: percentualDiferencaTicket,
        ranking: 1 // TODO: Calcular ranking real
      },
      participacaoFaturamento: {
        meuFaturamento,
        faturamentoEquipe,
        percentual: participacaoPercentual,
        posicaoRanking: 1 // TODO: Calcular posição real
      },
      taxaDevolucao: {
        minhaTaxa: minhaTaxaDevolucao,
        taxaEquipe: taxaDevolucaoEquipe,
        ranking: 1 // TODO: Calcular ranking real
      },
      consistencia: {
        percentual: percentualConsistencia,
        diasComVenda: diasUnicos,
        diasUteis: diasUteisDecorridos,
        mediaEquipe: 75 // TODO: Calcular média real da equipe
      }
    };
  }, [vendas, vendasEquipe, vendedorId, progressoMeta]);

  // Gerar insights automáticos
  const insights = useMemo((): InsightAutomatico[] => {
    if (!progressoMeta || !kpis) return [];

    const insightsGerados: InsightAutomatico[] = [];

    // Insights de meta
    if (progressoMeta.status === 'critico') {
      insightsGerados.push({
        tipo: 'urgente',
        icone: '🚨',
        titulo: 'Meta em Risco Crítico',
        descricao: `Faltam R$ ${(progressoMeta.meta - progressoMeta.realizado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em ${progressoMeta.diasRestantes} dias`,
        acao: `Precisa vender R$ ${progressoMeta.ritmoNecessario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por dia`,
        cor: 'from-red-500 to-red-600'
      });
    } else if (progressoMeta.status === 'na_frente') {
      insightsGerados.push({
        tipo: 'parabens',
        icone: '🏆',
        titulo: 'Você está Voando!',
        descricao: `${(progressoMeta.percentual - progressoMeta.percentualTempo).toFixed(1)}% adiantado no cronograma`,
        acao: 'Continue assim que vai superar a meta!',
        cor: 'from-green-500 to-green-600'
      });
    }

    // Insights de ticket médio
    if (kpis.ticketMedio.percentualDiferenca > 15) {
      insightsGerados.push({
        tipo: 'destaque',
        icone: '💎',
        titulo: 'Ticket Médio Excepcional',
        descricao: `Seu ticket (${kpis.ticketMedio.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) é ${kpis.ticketMedio.percentualDiferenca.toFixed(1)}% superior à equipe`,
        acao: 'Continue focando em vendas de alto valor',
        impacto: 'Estratégia de vendas premium funcionando',
        cor: 'from-purple-500 to-purple-600'
      });
    }

    // Insights de consistência
    if (kpis.consistencia.percentual < 70) {
      insightsGerados.push({
        tipo: 'oportunidade',
        icone: '📅',
        titulo: 'Oportunidade de Melhoria',
        descricao: `Vendeu em apenas ${kpis.consistencia.diasComVenda} de ${kpis.consistencia.diasUteis} dias úteis`,
        acao: 'Planejar atividades diárias de prospecção',
        impacto: `Potencial: +${((100 - kpis.consistencia.percentual) * 0.5).toFixed(0)}% nas vendas`,
        cor: 'from-blue-500 to-blue-600'
      });
    }

    return insightsGerados;
  }, [progressoMeta, kpis]);

  // Processar evolução mensal para gráficos
  const dadosEvolucaoMensal = useMemo(() => {
    if (!evolucaoMensal.length) return [];

    const vendasPorMes = evolucaoMensal.reduce((acc: any, venda: any) => {
      const data = new Date(venda.data_venda);
      const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[mesAno]) {
        acc[mesAno] = {
          mes: data.toLocaleDateString('pt-BR', { month: 'short' }),
          vendas: 0,
          meta: vendedor?.meta_mensal || 0
        };
      }
      
      acc[mesAno].vendas += venda.valor_final;
      return acc;
    }, {});

    return Object.values(vendasPorMes);
  }, [evolucaoMensal, vendedor]);

  return {
    vendedor,
    vendas,
    progressoMeta,
    kpis,
    insights,
    loading,
    error: null,
    dadosEvolucaoMensal
  };
};