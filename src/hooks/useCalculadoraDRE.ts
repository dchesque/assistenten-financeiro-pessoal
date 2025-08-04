
import { useState, useEffect, useMemo } from 'react';
import { useDadosEssenciaisDREAtualizado } from './useDadosEssenciaisDREAtualizado';

interface DreItem {
  codigo: string;
  nome: string;
  valor: number;
  nivel: number;
  tipo: 'receita' | 'custo' | 'despesa' | 'subtotal' | 'total';
  valorComparacao?: number;
}

interface DadosEssenciaisDRE {
  mes_referencia: string;
  cmv_valor: number;
  deducoes_receita?: number;
  percentual_impostos?: number;
  percentual_devolucoes?: number;
  estoque_inicial_qtd?: number;
  estoque_inicial_valor?: number;
  estoque_final_qtd?: number;
  estoque_final_valor?: number;
}

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
}

interface ParametrosCalculoDRE {
  dadosIntegracao?: DadosIntegracao;
  dadosEssenciais?: DadosEssenciaisDRE;
  mostrarComparacao?: boolean;
  dadosComparacao?: DadosIntegracao;
}

export const useCalculadoraDRE = ({
  dadosIntegracao,
  dadosEssenciais,
  mostrarComparacao = false,
  dadosComparacao
}: ParametrosCalculoDRE) => {
  const [dreIntegrado, setDreIntegrado] = useState<any[]>([]);
  const [carregandoDre, setCarregandoDre] = useState(false);
  const { gerarDREIntegrado } = useDadosEssenciaisDREAtualizado();

  // Gerar DRE usando função integrada do banco quando disponível
  const gerarDreCompleto = async (mesReferencia?: string) => {
    if (!mesReferencia) return;
    
    setCarregandoDre(true);
    try {
      const resultado = await gerarDREIntegrado(mesReferencia);
      setDreIntegrado(resultado);
    } catch (error) {
      console.error('Erro ao gerar DRE:', error);
    } finally {
      setCarregandoDre(false);
    }
  };

  const dreCalculado = useMemo(() => {
    // Se temos DRE integrado, usar ele
    if (dreIntegrado.length > 0) {
      return dreIntegrado.map(item => ({
        codigo: item.item_codigo,
        nome: item.item_nome,
        valor: Number(item.item_valor),
        nivel: Number(item.item_nivel),
        tipo: item.item_tipo as 'receita' | 'custo' | 'despesa' | 'subtotal' | 'total'
      }));
    }

    // Fallback para cálculo manual se não há integração
    if (!dadosIntegracao) return [];

    const dre: DreItem[] = [];

    // 1. RECEITA OPERACIONAL BRUTA
    const receitaBruta = dadosIntegracao.receitas.reduce((total, r) => total + r.valor_total, 0);
    dre.push({
      codigo: '1',
      nome: 'RECEITA OPERACIONAL BRUTA',
      valor: receitaBruta,
      nivel: 0,
      tipo: 'total',
      valorComparacao: mostrarComparacao && dadosComparacao 
        ? dadosComparacao.receitas.reduce((total, r) => total + r.valor_total, 0)
        : undefined
    });

    // 1.1 Detalhamento das receitas
    dadosIntegracao.receitas.forEach((receita, index) => {
      dre.push({
        codigo: `1.${index + 1}`,
        nome: receita.categoria_nome,
        valor: receita.valor_total,
        nivel: 1,
        tipo: 'receita',
        valorComparacao: mostrarComparacao && dadosComparacao
          ? dadosComparacao.receitas.find(r => r.categoria_id === receita.categoria_id)?.valor_total || 0
          : undefined
      });
    });

    // 2. DEDUÇÕES DA RECEITA - usar dados essenciais se disponível
    const percentualImpostos = dadosEssenciais?.percentual_impostos || 8.5; // Simples Nacional médio
    const percentualDevolucoes = dadosEssenciais?.percentual_devolucoes || 1.5;
    
    const deducoes = dadosEssenciais?.deducoes_receita || 
                    (receitaBruta * -(percentualImpostos + percentualDevolucoes) / 100);
    
    dre.push({
      codigo: '2',
      nome: '(-) DEDUÇÕES DA RECEITA',
      valor: deducoes,
      nivel: 0,
      tipo: 'total',
      valorComparacao: mostrarComparacao && dadosComparacao
        ? (dadosComparacao.receitas.reduce((total, r) => total + r.valor_total, 0) * -(percentualImpostos + percentualDevolucoes) / 100)
        : undefined
    });

    // Detalhamento das deduções baseado em dados reais
    const valorImpostos = receitaBruta * -percentualImpostos / 100;
    const valorDevolucoes = receitaBruta * -percentualDevolucoes / 100;

    dre.push({
      codigo: '2.1',
      nome: 'Impostos sobre Vendas',
      valor: valorImpostos,
      nivel: 1,
      tipo: 'despesa',
      valorComparacao: mostrarComparacao && dadosComparacao
        ? (dadosComparacao.receitas.reduce((total, r) => total + r.valor_total, 0) * -percentualImpostos / 100)
        : undefined
    });

    dre.push({
      codigo: '2.2',
      nome: 'Devoluções e Abatimentos',
      valor: valorDevolucoes,
      nivel: 1,
      tipo: 'despesa',
      valorComparacao: mostrarComparacao && dadosComparacao
        ? (dadosComparacao.receitas.reduce((total, r) => total + r.valor_total, 0) * -percentualDevolucoes / 100)
        : undefined
    });

    // RECEITA LÍQUIDA
    const receitaLiquida = receitaBruta + deducoes;
    dre.push({
      codigo: 'RL',
      nome: '= RECEITA LÍQUIDA',
      valor: receitaLiquida,
      nivel: 0,
      tipo: 'subtotal',
      valorComparacao: mostrarComparacao && dadosComparacao
        ? (dadosComparacao.receitas.reduce((total, r) => total + r.valor_total, 0) + 
           (dadosComparacao.receitas.reduce((total, r) => total + r.valor_total, 0) * -(percentualImpostos + percentualDevolucoes) / 100))
        : undefined
    });

    // 3. CMV - Usar dados essenciais se disponível, senão sugestão
    const cmvValor = dadosEssenciais?.cmv_valor || dadosIntegracao.cmv_sugerido;
    dre.push({
      codigo: '3',
      nome: '(-) CUSTO DOS PRODUTOS VENDIDOS',
      valor: -cmvValor,
      nivel: 0,
      tipo: 'total',
      valorComparacao: mostrarComparacao && dadosComparacao
        ? -dadosComparacao.cmv_sugerido
        : undefined
    });

    // LUCRO BRUTO
    const lucroBruto = receitaLiquida - cmvValor;
    dre.push({
      codigo: 'LB',
      nome: '= LUCRO BRUTO',
      valor: lucroBruto,
      nivel: 0,
      tipo: 'subtotal'
    });

    // 4. DESPESAS OPERACIONAIS
    const totalDespesas = dadosIntegracao.despesas.reduce((total, d) => total + d.valor_total, 0);
    dre.push({
      codigo: '4',
      nome: '(-) DESPESAS OPERACIONAIS',
      valor: -totalDespesas,
      nivel: 0,
      tipo: 'total',
      valorComparacao: mostrarComparacao && dadosComparacao
        ? -dadosComparacao.despesas.reduce((total, d) => total + d.valor_total, 0)
        : undefined
    });

    // 4.x Detalhamento das despesas
    dadosIntegracao.despesas.forEach((despesa, index) => {
      dre.push({
        codigo: `4.${index + 1}`,
        nome: despesa.categoria_nome,
        valor: -despesa.valor_total,
        nivel: 1,
        tipo: 'despesa',
        valorComparacao: mostrarComparacao && dadosComparacao
          ? -(dadosComparacao.despesas.find(d => d.categoria_id === despesa.categoria_id)?.valor_total || 0)
          : undefined
      });
    });

    // RESULTADO LÍQUIDO
    const resultadoLiquido = lucroBruto - totalDespesas;
    dre.push({
      codigo: 'RL_FINAL',
      nome: '= RESULTADO LÍQUIDO',
      valor: resultadoLiquido,
      nivel: 0,
      tipo: 'subtotal'
    });

    return dre;
  }, [dadosIntegracao, dadosEssenciais, mostrarComparacao, dadosComparacao]);

  // Métricas calculadas
  const metricas = useMemo(() => {
    if (dreCalculado.length === 0) {
      return {
        receitaLiquida: 0,
        lucroBruto: 0,
        resultadoLiquido: 0,
        margemBruta: 0,
        margemLiquida: 0
      };
    }

    const receitaLiquida = dreCalculado.find(item => item.codigo === 'RL')?.valor || 0;
    const lucroBruto = dreCalculado.find(item => item.codigo === 'LB')?.valor || 0;
    const resultadoLiquido = dreCalculado.find(item => item.codigo === 'RL_FINAL')?.valor || 0;

    const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
    const margemLiquida = receitaLiquida > 0 ? (resultadoLiquido / receitaLiquida) * 100 : 0;

    return {
      receitaLiquida,
      lucroBruto,
      resultadoLiquido,
      margemBruta,
      margemLiquida
    };
  }, [dreCalculado]);

  return {
    dreCalculado,
    metricas,
    temDados: !!dadosIntegracao,
    carregandoDre,
    gerarDreCompleto
  };
};
