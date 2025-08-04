
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DadosIntegracao {
  receitas: Array<{
    categoria_id: number;
    categoria_nome: string;
    valor_total: number;
    quantidade: number;
  }>;
  despesas: Array<{
    categoria_id: number;
    categoria_nome: string;
    valor_total: number;
    quantidade: number;
  }>;
  cmv_sugerido: number;
  periodo_analise: string;
}

interface FiltrosPeriodo {
  ano: number;
  mes?: number;
  tipoVisualizacao: 'mensal' | 'anual';
}

export const useIntegracaoDRE = () => {
  const [carregando, setCarregando] = useState(false);
  const [dadosIntegracao, setDadosIntegracao] = useState<DadosIntegracao | null>(null);

  const obterDadosPorPeriodo = async (filtros: FiltrosPeriodo): Promise<DadosIntegracao> => {
    setCarregando(true);
    
    try {
      const { ano, mes, tipoVisualizacao } = filtros;
      let dataInicio: string;
      let dataFim: string;

      if (tipoVisualizacao === 'mensal' && mes) {
        const mesFormatado = mes.toString().padStart(2, '0');
        dataInicio = `${ano}-${mesFormatado}-01`;
        
        // Último dia do mês
        const ultimoDia = new Date(ano, mes, 0).getDate();
        dataFim = `${ano}-${mesFormatado}-${ultimoDia}`;
      } else {
        dataInicio = `${ano}-01-01`;
        dataFim = `${ano}-12-31`;
      }

      console.log(`🔍 Analisando período: ${dataInicio} até ${dataFim}`);

      // Buscar vendas reais do Supabase
      const { data: vendasPeriodo, error: erroVendas } = await supabase
        .from('vendas')
        .select(`
          id,
          valor_final,
          data_venda,
          plano_conta_id,
          status,
          plano_contas(id, nome, codigo)
        `)
        .gte('data_venda', dataInicio)
        .lte('data_venda', dataFim)
        .eq('ativo', true)
        .eq('status', 'ativa');

      if (erroVendas) {
        console.error('Erro ao buscar vendas:', erroVendas);
        throw erroVendas;
      }

      // Buscar contas a pagar reais do Supabase
      const { data: contasPeriodo, error: erroContas } = await supabase
        .from('contas_pagar')
        .select(`
          id,
          valor_final,
          data_vencimento,
          data_pagamento,
          plano_conta_id,
          status,
          plano_contas(id, nome, codigo)
        `)
        .gte('data_vencimento', dataInicio)
        .lte('data_vencimento', dataFim);

      if (erroContas) {
        console.error('Erro ao buscar contas a pagar:', erroContas);
        throw erroContas;
      }

      console.log(`📊 Encontradas ${vendasPeriodo?.length || 0} vendas e ${contasPeriodo?.length || 0} contas`);

      // Agrupar receitas por categoria
      const receitasAgrupadas = (vendasPeriodo || [])
        .filter(venda => venda.valor_final > 0)
        .reduce((acc, venda) => {
          const planoContas = venda.plano_contas as any;
          const categoriaId = venda.plano_conta_id || 1; // Default para receita genérica
          const categoriaNome = planoContas?.nome || 'Vendas Gerais';
          
          if (!acc[categoriaId]) {
            acc[categoriaId] = {
              categoria_id: categoriaId,
              categoria_nome: categoriaNome,
              valor_total: 0,
              quantidade: 0
            };
          }
          acc[categoriaId].valor_total += venda.valor_final;
          acc[categoriaId].quantidade += 1;
          return acc;
        }, {} as Record<number, any>);

      // Agrupar despesas por categoria
      const despesasAgrupadas = (contasPeriodo || []).reduce((acc, conta) => {
        const planoContas = conta.plano_contas as any;
        const categoriaId = conta.plano_conta_id;
        const categoriaNome = planoContas?.nome || 'Categoria não encontrada';
        
        if (!acc[categoriaId]) {
          acc[categoriaId] = {
            categoria_id: categoriaId,
            categoria_nome: categoriaNome,
            valor_total: 0,
            quantidade: 0
          };
        }
        acc[categoriaId].valor_total += conta.valor_final;
        acc[categoriaId].quantidade += 1;
        return acc;
      }, {} as Record<number, any>);

      // Calcular CMV sugerido (estimativa baseada em 45% da receita líquida)
      const receitaTotal = Object.values(receitasAgrupadas).reduce(
        (sum: number, receita: any) => sum + (receita.valor_total || 0), 0
      );
      const cmvSugerido = receitaTotal * 0.45; // 45% como estimativa padrão

      const resultado: DadosIntegracao = {
        receitas: Object.values(receitasAgrupadas),
        despesas: Object.values(despesasAgrupadas),
        cmv_sugerido: cmvSugerido,
        periodo_analise: tipoVisualizacao === 'mensal' 
          ? `${mes}/${ano}` 
          : `${ano}`
      };

      console.log('💰 Dados integrados:', resultado);
      
      setDadosIntegracao(resultado);
      return resultado;

    } catch (error) {
      console.error('❌ Erro ao obter dados de integração:', error);
      throw error;
    } finally {
      setCarregando(false);
    }
  };

  const obterReceitasPorCategoria = (categoriaId?: number) => {
    if (!dadosIntegracao) return [];
    
    if (categoriaId) {
      return dadosIntegracao.receitas.filter(r => r.categoria_id === categoriaId);
    }
    
    return dadosIntegracao.receitas;
  };

  const obterTotalReceitas = () => {
    if (!dadosIntegracao) return 0;
    return dadosIntegracao.receitas.reduce((total, receita) => total + receita.valor_total, 0);
  };

  const obterTotalDespesas = () => {
    if (!dadosIntegracao) return 0;
    return dadosIntegracao.despesas.reduce((total, despesa) => total + despesa.valor_total, 0);
  };

  return {
    dadosIntegracao,
    carregando,
    obterDadosPorPeriodo,
    obterReceitasPorCategoria,
    obterTotalReceitas,
    obterTotalDespesas
  };
};
