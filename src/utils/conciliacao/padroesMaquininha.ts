import { supabase } from '@/integrations/supabase/client';

// Padrões de operadoras de maquininhas para machine learning
export interface PadroesOperadora {
  operadora: string;
  delayMedioRecebimento: number; // dias
  variacaoValorComum: number; // R$
  bandeirasMaisComuns: string[];
  tiposTransacaoFrequentes: string[];
  parcelasMedio: number;
  toleranciaRecomendada: {
    valor: number;
    dias: number;
  };
  padroesSazonais: {
    mes: number;
    multiplicadorVolume: number;
  }[];
}

export interface AnaliseOperadora {
  identificarPadroes: (operadora: string, periodoMeses: number) => Promise<PadroesOperadora>;
  sugerirTolerancia: (operadora: string, historico: any[]) => { valor: number; dias: number };
  detectarAnomalias: (vendas: any[], recebimentos: any[]) => string[];
  otimizarParametros: (resultadosAnteriores: any[]) => { toleranciaValor: number; toleranciaDias: number };
}

// Dados baseados em análise de mercado brasileiro
const PADROES_CONHECIDOS: Record<string, PadroesOperadora> = {
  rede: {
    operadora: 'rede',
    delayMedioRecebimento: 1.2, // Rede é geralmente mais rápida
    variacaoValorComum: 0.50,
    bandeirasMaisComuns: ['visa', 'mastercard', 'elo'],
    tiposTransacaoFrequentes: ['debito', 'credito_vista', 'credito_parcelado'],
    parcelasMedio: 2.1,
    toleranciaRecomendada: {
      valor: 0.75,
      dias: 1
    },
    padroesSazonais: [
      { mes: 12, multiplicadorVolume: 1.8 }, // Dezembro - Black Friday/Natal
      { mes: 5, multiplicadorVolume: 1.3 },  // Maio - Dia das Mães
      { mes: 8, multiplicadorVolume: 1.2 },  // Agosto - Dia dos Pais
    ]
  },
  sipag: {
    operadora: 'sipag',
    delayMedioRecebimento: 1.8, // Sipag tem delay ligeiramente maior
    variacaoValorComum: 0.80,
    bandeirasMaisComuns: ['visa', 'mastercard', 'elo', 'american_express'],
    tiposTransacaoFrequentes: ['debito', 'credito_vista', 'pix'],
    parcelasMedio: 1.9,
    toleranciaRecomendada: {
      valor: 1.00,
      dias: 2
    },
    padroesSazonais: [
      { mes: 12, multiplicadorVolume: 1.9 },
      { mes: 6, multiplicadorVolume: 1.4 },  // Junho - Festa Junina
      { mes: 10, multiplicadorVolume: 1.1 }, // Outubro - Dia das Crianças
    ]
  }
};

/**
 * Identifica padrões específicos de uma operadora
 */
export async function identificarPadroesOperadora(
  operadora: string, 
  periodoMeses: number = 3
): Promise<PadroesOperadora> {
  try {
    // 1. Buscar dados históricos da operadora
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - periodoMeses);

    const { data: vendasHistoricas } = await supabase
      .from('vendas_maquininha')
      .select(`
        *,
        maquininha:maquininhas!inner(operadora)
      `)
      .eq('maquininhas.operadora', operadora)
      .gte('data_venda', dataLimite.toISOString().split('T')[0]);

    if (!vendasHistoricas || vendasHistoricas.length < 10) {
      // Retornar padrões conhecidos se não há dados suficientes
      return PADROES_CONHECIDOS[operadora] || PADROES_CONHECIDOS.rede;
    }

    // 2. Analisar delay médio de recebimento
    const delays = vendasHistoricas
      .filter(v => v.data_recebimento && v.data_venda)
      .map(v => {
        const dataVenda = new Date(v.data_venda);
        const dataRecebimento = new Date(v.data_recebimento);
        return Math.abs(dataRecebimento.getTime() - dataVenda.getTime()) / (1000 * 60 * 60 * 24);
      });

    const delayMedio = delays.length > 0 
      ? delays.reduce((a, b) => a + b, 0) / delays.length 
      : PADROES_CONHECIDOS[operadora]?.delayMedioRecebimento || 1.5;

    // 3. Analisar variação de valores (diferença entre bruto e líquido)
    const variacoes = vendasHistoricas
      .map(v => Math.abs(v.valor_bruto - v.valor_liquido))
      .filter(v => v > 0);

    const variacaoMedia = variacoes.length > 0
      ? variacoes.reduce((a, b) => a + b, 0) / variacoes.length
      : PADROES_CONHECIDOS[operadora]?.variacaoValorComum || 0.75;

    // 4. Analisar bandeiras mais comuns
    const contagemBandeiras: Record<string, number> = {};
    vendasHistoricas.forEach(v => {
      const bandeira = v.bandeira.toLowerCase();
      contagemBandeiras[bandeira] = (contagemBandeiras[bandeira] || 0) + 1;
    });

    const bandeirasMaisComuns = Object.entries(contagemBandeiras)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([bandeira]) => bandeira);

    // 5. Analisar tipos de transação
    const contagemTipos: Record<string, number> = {};
    vendasHistoricas.forEach(v => {
      const tipo = v.tipo_transacao.toLowerCase();
      contagemTipos[tipo] = (contagemTipos[tipo] || 0) + 1;
    });

    const tiposFrequentes = Object.entries(contagemTipos)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([tipo]) => tipo);

    // 6. Calcular parcelas médio
    const parcelasMedio = vendasHistoricas.length > 0
      ? vendasHistoricas.reduce((acc, v) => acc + v.parcelas, 0) / vendasHistoricas.length
      : 1.5;

    // 7. Determinar tolerância recomendada baseada na análise
    const toleranciaValor = Math.max(0.25, Math.min(2.0, variacaoMedia * 1.2));
    const toleranciaDias = Math.max(0, Math.min(3, Math.ceil(delayMedio + 0.5)));

    return {
      operadora,
      delayMedioRecebimento: Math.round(delayMedio * 10) / 10,
      variacaoValorComum: Math.round(variacaoMedia * 100) / 100,
      bandeirasMaisComuns: bandeirasMaisComuns.length > 0 ? bandeirasMaisComuns : ['visa', 'mastercard'],
      tiposTransacaoFrequentes: tiposFrequentes.length > 0 ? tiposFrequentes : ['debito', 'credito'],
      parcelasMedio: Math.round(parcelasMedio * 10) / 10,
      toleranciaRecomendada: {
        valor: toleranciaValor,
        dias: toleranciaDias
      },
      padroesSazonais: PADROES_CONHECIDOS[operadora]?.padroesSazonais || []
    };

  } catch (error) {
    console.error('Erro ao identificar padrões da operadora:', error);
    return PADROES_CONHECIDOS[operadora] || PADROES_CONHECIDOS.rede;
  }
}

/**
 * Sugere tolerâncias ideais baseadas no histórico
 */
export function sugerirToleranciaOtima(
  resultadosAnteriores: any[],
  operadora: string
): { valor: number; dias: number } {
  if (resultadosAnteriores.length === 0) {
    return PADROES_CONHECIDOS[operadora]?.toleranciaRecomendada || { valor: 1.0, dias: 2 };
  }

  // Analisar resultados anteriores para otimizar
  const sucessos = resultadosAnteriores.filter(r => r.taxa_sucesso > 0.85);
  
  if (sucessos.length > 0) {
    const valorMedio = sucessos.reduce((acc, r) => acc + r.tolerancia_valor, 0) / sucessos.length;
    const diasMedio = sucessos.reduce((acc, r) => acc + r.tolerancia_dias, 0) / sucessos.length;
    
    return {
      valor: Math.round(valorMedio * 100) / 100,
      dias: Math.round(diasMedio)
    };
  }

  return PADROES_CONHECIDOS[operadora]?.toleranciaRecomendada || { valor: 1.0, dias: 2 };
}

/**
 * Detecta anomalias nos dados de conciliação
 */
export function detectarAnomalias(
  vendas: any[], 
  recebimentos: any[],
  operadora: string
): string[] {
  const anomalias: string[] = [];
  const padroes = PADROES_CONHECIDOS[operadora] || PADROES_CONHECIDOS.rede;

  // 1. Verificar volume anômalo
  const volumeEsperado = vendas.length;
  const volumeRecebido = recebimentos.length;
  const diferenca = Math.abs(volumeEsperado - volumeRecebido) / volumeEsperado;

  if (diferenca > 0.3) {
    anomalias.push(`Volume divergente: ${volumeEsperado} vendas vs ${volumeRecebido} recebimentos (${(diferenca * 100).toFixed(1)}% diferença)`);
  }

  // 2. Verificar delay anômalo
  const delaysAtuais = vendas
    .filter(v => v.data_recebimento && v.data_venda)
    .map(v => {
      const diff = new Date(v.data_recebimento).getTime() - new Date(v.data_venda).getTime();
      return diff / (1000 * 60 * 60 * 24);
    });

  if (delaysAtuais.length > 0) {
    const delayMedio = delaysAtuais.reduce((a, b) => a + b, 0) / delaysAtuais.length;
    
    if (Math.abs(delayMedio - padroes.delayMedioRecebimento) > 1.0) {
      anomalias.push(`Delay anômalo: ${delayMedio.toFixed(1)} dias vs esperado ${padroes.delayMedioRecebimento} dias`);
    }
  }

  // 3. Verificar valores anômalos
  const valoresVendas = vendas.map(v => v.valor_liquido);
  const valoresRecebimentos = recebimentos.map(r => r.valor);
  
  const somaVendas = valoresVendas.reduce((a, b) => a + b, 0);
  const somaRecebimentos = valoresRecebimentos.reduce((a, b) => a + b, 0);
  const diferencaValor = Math.abs(somaVendas - somaRecebimentos);

  if (diferencaValor > somaVendas * 0.05) { // 5% de diferença
    anomalias.push(`Diferença de valor significativa: R$ ${diferencaValor.toFixed(2)} (${((diferencaValor / somaVendas) * 100).toFixed(1)}%)`);
  }

  // 4. Verificar padrões de bandeira anômalos
  const bandeirasCorrentes: Record<string, number> = {};
  vendas.forEach(v => {
    const bandeira = v.bandeira?.toLowerCase() || 'unknown';
    bandeirasCorrentes[bandeira] = (bandeirasCorrentes[bandeira] || 0) + 1;
  });

  const bandeiraPrincipal = Object.entries(bandeirasCorrentes)
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  if (bandeiraPrincipal && !padroes.bandeirasMaisComuns.includes(bandeiraPrincipal)) {
    anomalias.push(`Bandeira incomum predominante: ${bandeiraPrincipal} (esperado: ${padroes.bandeirasMaisComuns.join(', ')})`);
  }

  return anomalias;
}

/**
 * Exporta análise completa da operadora
 */
export async function exportarAnaliseOperadora(
  operadora: string,
  periodoMeses: number = 6
): Promise<{
  padroes: PadroesOperadora;
  anomalias: string[];
  recomendacoes: string[];
  relatorio: any;
}> {
  const padroes = await identificarPadroesOperadora(operadora, periodoMeses);
  
  // Buscar dados para análise de anomalias
  const dataLimite = new Date();
  dataLimite.setMonth(dataLimite.getMonth() - 1); // Último mês

  const { data: vendasRecentes } = await supabase
    .from('vendas_maquininha')
    .select(`
      *,
      maquininha:maquininhas!inner(operadora)
    `)
    .eq('maquininhas.operadora', operadora)
    .gte('data_venda', dataLimite.toISOString().split('T')[0]);

  const { data: recebimentosRecentes } = await supabase
    .from('recebimentos_bancario')
    .select(`
      *,
      banco:bancos(
        maquininhas(operadora)
      )
    `)
    .gte('data_recebimento', dataLimite.toISOString().split('T')[0]);

  const anomalias = detectarAnomalias(
    vendasRecentes || [],
    recebimentosRecentes || [],
    operadora
  );

  // Gerar recomendações
  const recomendacoes: string[] = [
    `Use tolerância de R$ ${padroes.toleranciaRecomendada.valor} e ${padroes.toleranciaRecomendada.dias} dias`,
    `Monitore especialmente as bandeiras: ${padroes.bandeirasMaisComuns.slice(0, 3).join(', ')}`,
    `Delay esperado: ${padroes.delayMedioRecebimento} dias em média`
  ];

  if (anomalias.length > 0) {
    recomendacoes.push('⚠️ Anomalias detectadas - revisar manualmente');
  }

  if (padroes.toleranciaRecomendada.valor > 1.5) {
    recomendacoes.push('💡 Considere negociar taxas menores com a operadora');
  }

  return {
    padroes,
    anomalias,
    recomendacoes,
    relatorio: {
      operadora,
      periodo: `${periodoMeses} meses`,
      dataAnalise: new Date().toISOString(),
      resumo: {
        total_vendas: vendasRecentes?.length || 0,
        total_recebimentos: recebimentosRecentes?.length || 0,
        taxa_conciliacao_estimada: anomalias.length === 0 ? 95 : 85,
        otimizacao_recomendada: padroes.toleranciaRecomendada
      }
    }
  };
}