import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PerformanceVendedor {
  vendas_periodo: number;
  valor_periodo: number;
  ticket_medio: number;
  meta_periodo: number;
  percentual_meta: number;
  vendas_por_dia: Array<{
    data: string;
    vendas: number;
    valor: number;
  }>;
}

export const usePerformanceVendedor = () => {
  const [performance, setPerformance] = useState<PerformanceVendedor | null>(null);
  const [loading, setLoading] = useState(false);

  const carregarPerformance = useCallback(async (vendedorId: number, dataInicio: string, dataFim: string) => {
    try {
      setLoading(true);

      // Buscar vendas do período
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select('data_venda, valor_final')
        .eq('vendedor_id', vendedorId)
        .eq('ativo', true)
        .gte('data_venda', dataInicio)
        .lte('data_venda', dataFim)
        .order('data_venda');

      if (error) {
        console.error('Erro ao carregar performance:', error);
        toast.error('Erro ao carregar performance do vendedor');
        return;
      }

      // Buscar dados do vendedor para meta
      const { data: vendedorData } = await supabase
        .from('vendedores')
        .select('meta_mensal')
        .eq('id', vendedorId)
        .single();

      const vendasArray = vendas || [];
      const vendas_periodo = vendasArray.length;
      const valor_periodo = vendasArray.reduce((acc, v) => acc + v.valor_final, 0);
      const ticket_medio = vendas_periodo > 0 ? valor_periodo / vendas_periodo : 0;
      const meta_periodo = vendedorData?.meta_mensal || 0;
      const percentual_meta = meta_periodo > 0 ? (valor_periodo / meta_periodo) * 100 : 0;

      // Agrupar vendas por dia
      const vendasPorDia = vendasArray.reduce((acc, venda) => {
        const data = venda.data_venda;
        if (!acc[data]) {
          acc[data] = { vendas: 0, valor: 0 };
        }
        acc[data].vendas += 1;
        acc[data].valor += venda.valor_final;
        return acc;
      }, {} as Record<string, { vendas: number; valor: number }>);

      const vendas_por_dia = Object.entries(vendasPorDia).map(([data, stats]) => ({
        data,
        vendas: stats.vendas,
        valor: stats.valor
      }));

      setPerformance({
        vendas_periodo,
        valor_periodo,
        ticket_medio,
        meta_periodo,
        percentual_meta,
        vendas_por_dia
      });

    } catch (error) {
      console.error('Erro ao carregar performance:', error);
      toast.error('Erro ao carregar performance do vendedor');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    performance,
    loading,
    carregarPerformance
  };
};