import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DadosEssenciaisCalculados {
  mes_referencia: string;
  cmv_valor: number;
  deducoes_receita: number;
  percentual_impostos: number;
  percentual_devolucoes: number;
  margem_bruta_objetivo: number;
  margem_liquida_objetivo: number;
}

export interface ParametrosDeducoes {
  percentual_impostos: number;
  percentual_devolucoes: number;
  valor_fixo_impostos?: number;
  valor_fixo_devolucoes?: number;
}

export const useDadosEssenciaisDRE = (mesReferencia: string) => {
  const [loading, setLoading] = useState(true);
  const [dadosEssenciais, setDadosEssenciais] = useState<DadosEssenciaisCalculados | null>(null);
  const [parametrosDeducoes, setParametrosDeducoes] = useState<ParametrosDeducoes>({
    percentual_impostos: 8.5, // Simples Nacional médio
    percentual_devolucoes: 1.5,
    valor_fixo_impostos: 0,
    valor_fixo_devolucoes: 0
  });

  useEffect(() => {
    if (mesReferencia) {
      carregarDadosEssenciais();
    }
  }, [mesReferencia]);

  const carregarDadosEssenciais = async () => {
    try {
      setLoading(true);

      // Buscar dados de CMV baseados em contas pagas do plano de contas tipo 'cmv'
      const { data: contasCMV, error: cmvError } = await supabase
        .from('contas_pagar')
        .select(`
          valor_final,
          data_pagamento,
          plano_contas(tipo_dre)
        `)
        .eq('status', 'pago')
        .eq('plano_contas.tipo_dre', 'cmv')
        .gte('data_pagamento', `${mesReferencia}-01`)
        .lt('data_pagamento', getProximoMes(mesReferencia));

      if (cmvError) throw cmvError;

      const cmvValor = (contasCMV || []).reduce((acc, conta) => acc + conta.valor_final, 0);

      // Buscar receitas do mês para calcular proporções
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('valor_total, desconto')
        .eq('ativo', true)
        .gte('data_venda', `${mesReferencia}-01`)
        .lt('data_venda', getProximoMes(mesReferencia));

      if (vendasError) throw vendasError;

      const receitaBruta = (vendas || []).reduce((acc, venda) => acc + venda.valor_total, 0);
      const totalDescontos = (vendas || []).reduce((acc, venda) => acc + (venda.desconto || 0), 0);

      // Calcular deduções reais baseadas nos dados
      const deducoesReais = totalDescontos + (receitaBruta * parametrosDeducoes.percentual_impostos / 100);

      const dadosCalculados: DadosEssenciaisCalculados = {
        mes_referencia: mesReferencia,
        cmv_valor: cmvValor,
        deducoes_receita: deducoesReais,
        percentual_impostos: parametrosDeducoes.percentual_impostos,
        percentual_devolucoes: parametrosDeducoes.percentual_devolucoes,
        margem_bruta_objetivo: 45, // Meta da empresa
        margem_liquida_objetivo: 15  // Meta da empresa
      };

      setDadosEssenciais(dadosCalculados);

    } catch (error) {
      console.error('Erro ao carregar dados essenciais do DRE:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarParametrosDeducoes = async (novosParametros: Partial<ParametrosDeducoes>) => {
    setParametrosDeducoes(prev => ({ ...prev, ...novosParametros }));
    
    // Recalcular dados essenciais com novos parâmetros
    if (mesReferencia) {
      await carregarDadosEssenciais();
    }
  };

  const calcularCMVSugerido = useMemo(() => {
    if (!dadosEssenciais) return 0;

    // Buscar receita bruta do mês
    return async () => {
      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor_total')
        .eq('ativo', true)
        .gte('data_venda', `${mesReferencia}-01`)
        .lt('data_venda', getProximoMes(mesReferencia));

      const receitaBruta = (vendas || []).reduce((acc, venda) => acc + venda.valor_total, 0);
      
      // Sugerir CMV baseado na margem bruta objetivo (ex: 45%)
      const receitaLiquida = receitaBruta - dadosEssenciais.deducoes_receita;
      return receitaLiquida * (1 - dadosEssenciais.margem_bruta_objetivo / 100);
    };
  }, [dadosEssenciais, mesReferencia]);

  return {
    dadosEssenciais,
    parametrosDeducoes,
    loading,
    atualizarParametrosDeducoes,
    calcularCMVSugerido,
    recarregar: carregarDadosEssenciais
  };
};

// Função auxiliar para calcular próximo mês
const getProximoMes = (mesReferencia: string): string => {
  const [ano, mes] = mesReferencia.split('-').map(Number);
  const proximaData = new Date(ano, mes, 1); // mes já é 0-indexed após +1
  return proximaData.toISOString().substring(0, 7);
};