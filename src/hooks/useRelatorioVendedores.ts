import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PerformanceVendedor {
  vendedor_id: number;
  vendedor_nome: string;
  vendedor_codigo: string;
  total_vendas: number;
  valor_total_vendido: number;
  comissao_total: number;
  ticket_medio: number;
  meta_periodo: number;
  percentual_meta: number;
  ranking_posicao: number;
  dias_produtivos: number;
  vendas_por_forma_pagamento: Record<string, number>;
  evolucao_diaria?: Array<{
    data: string;
    vendas: number;
    valor: number;
  }>;
}

interface EstatisticasGerais {
  total_vendedores: number;
  total_vendas: number;
  valor_total: number;
  comissao_total: number;
  ticket_medio: number;
  melhor_vendedor: PerformanceVendedor | null;
  vendedores_acima_meta: number;
}

interface RelatorioVendedores {
  estatisticas_gerais: EstatisticasGerais;
  performance_vendedores: PerformanceVendedor[];
  periodo: {
    inicio: string;
    fim: string;
  };
  gerado_em: string;
}

interface UseRelatorioVendedoresReturn {
  relatorio: RelatorioVendedores | null;
  loading: boolean;
  erro: string | null;
  gerarRelatorio: (params: {
    periodo_inicio: string;
    periodo_fim: string;
    vendedor_ids?: number[];
    incluir_detalhes?: boolean;
  }) => Promise<void>;
  exportarRelatorio: () => void;
}

export const useRelatorioVendedores = (): UseRelatorioVendedoresReturn => {
  const [relatorio, setRelatorio] = useState<RelatorioVendedores | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { toast } = useToast();

  const gerarRelatorio = useCallback(async (params: {
    periodo_inicio: string;
    periodo_fim: string;
    vendedor_ids?: number[];
    incluir_detalhes?: boolean;
  }) => {
    try {
      setLoading(true);
      setErro(null);

      console.log('Chamando edge function relatorio-vendedores...', params);

      const { data, error } = await supabase.functions.invoke('relatorio-vendedores', {
        body: params
      });

      if (error) {
        console.error('Erro na edge function:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Nenhum dado retornado pela função');
      }

      setRelatorio(data);
      
      toast({
        title: "Relatório gerado com sucesso!",
        description: `${data.performance_vendedores.length} vendedores processados`,
      });

    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      setErro(error.message || 'Erro ao gerar relatório');
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || 'Tente novamente',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const exportarRelatorio = useCallback(() => {
    if (!relatorio) return;

    const csvContent = [
      // Cabeçalho
      [
        'Ranking',
        'Código',
        'Nome',
        'Total Vendas',
        'Valor Vendido',
        'Comissão',
        'Ticket Médio',
        'Meta Período',
        '% Meta',
        'Dias Produtivos'
      ].join(','),
      
      // Dados
      ...relatorio.performance_vendedores.map(vendedor => [
        vendedor.ranking_posicao,
        vendedor.vendedor_codigo,
        `"${vendedor.vendedor_nome}"`,
        vendedor.total_vendas,
        vendedor.valor_total_vendido.toFixed(2),
        vendedor.comissao_total.toFixed(2),
        vendedor.ticket_medio.toFixed(2),
        vendedor.meta_periodo.toFixed(2),
        vendedor.percentual_meta.toFixed(1),
        vendedor.dias_produtivos
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-vendedores-${relatorio.periodo.inicio}-${relatorio.periodo.fim}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Relatório exportado!",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  }, [relatorio, toast]);

  return {
    relatorio,
    loading,
    erro,
    gerarRelatorio,
    exportarRelatorio
  };
};