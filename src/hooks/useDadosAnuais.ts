import { useMemo } from 'react';
import { useVendasSupabase } from '@/hooks/useVendasSupabase';
import { useContasPagar } from '@/hooks/useContasPagar';

export interface DadosMensais {
  mes: number;
  nome: string;
  receitaLiquida: number;
  lucroBruto: number;
  resultadoLiquido: number;
  margemBruta: number;
  margemLiquida: number;
}

export function useDadosAnuais(ano: number): DadosMensais[] {
  const { vendas } = useVendasSupabase();
  const { contas } = useContasPagar();
  
  return useMemo(() => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return Array.from({ length: 12 }, (_, index) => {
      const mes = index + 1;
      const dataInicio = new Date(ano, index, 1);
      const dataFim = new Date(ano, index + 1, 0);

      // Filtrar vendas do mês
      const vendasMes = vendas.filter(venda => {
        const dataVenda = new Date(venda.data_venda);
        return dataVenda >= dataInicio && dataVenda <= dataFim;
      });

      // Filtrar despesas do mês
      const despesasMes = contas.filter(conta => {
        const dataVencimento = new Date(conta.data_vencimento);
        return dataVencimento >= dataInicio && dataVencimento <= dataFim && conta.status === 'pago';
      });

      // Calcular receitas
      const receitaLiquida = vendasMes.reduce((acc, venda) => acc + venda.valor_total, 0);
      
      // Calcular despesas
      const totalDespesas = despesasMes.reduce((acc, conta) => acc + conta.valor_original, 0);
      
      // Estimar CMV (Cost of Goods Sold) - aproximadamente 40% das vendas
      const cmv = receitaLiquida * 0.4;
      
      // Calcular métricas
      const lucroBruto = receitaLiquida - cmv;
      const lucroOperacional = lucroBruto - totalDespesas;
      const resultadoLiquido = lucroOperacional; // Simplificado - sem impostos e juros
      
      const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
      const margemLiquida = receitaLiquida > 0 ? (resultadoLiquido / receitaLiquida) * 100 : 0;

      return {
        mes,
        nome: meses[index],
        receitaLiquida: Math.max(0, receitaLiquida),
        lucroBruto: Math.max(0, lucroBruto),
        resultadoLiquido,
        margemBruta: Math.max(0, margemBruta),
        margemLiquida
      };
    });
  }, [ano, vendas, contas]);
}