import { useState, useEffect, useMemo } from 'react';

export interface ChartDataCategoria {
  categoria: string;
  valor: number;
  cor: string;
}

export interface ChartDataFluxoMensal {
  mes: string;
  valor: number;
  meta?: number;
}

export interface ChartDataStatus {
  status: string;
  quantidade: number;
  cor: string;
}

export interface ChartData {
  categorias: ChartDataCategoria[];
  fluxoMensal: ChartDataFluxoMensal[];
  statusContas: ChartDataStatus[];
}

// Dados mock para os gráficos
const mockChartData: ChartData = {
  categorias: [
    { categoria: 'Fornecedores', valor: 15000, cor: '#3b82f6' },
    { categoria: 'Serviços', valor: 8500, cor: '#10b981' },
    { categoria: 'Material de Escritório', valor: 3200, cor: '#f59e0b' },
    { categoria: 'Energia', valor: 2800, cor: '#ef4444' },
    { categoria: 'Telecomunicações', valor: 1800, cor: '#8b5cf6' }
  ],
  fluxoMensal: [
    { mes: 'Out', valor: 25000, meta: 30000 },
    { mes: 'Nov', valor: 28000, meta: 30000 },
    { mes: 'Dez', valor: 31300, meta: 30000 }
  ],
  statusContas: [
    { status: 'Pago', quantidade: 45, cor: '#10b981' },
    { status: 'Pendente', quantidade: 23, cor: '#f59e0b' },
    { status: 'Vencido', quantidade: 8, cor: '#ef4444' }
  ]
};

export const useDashboardCharts = () => {
  const [loading, setLoading] = useState(true);

  const chartData = useMemo(() => mockChartData, []);

  useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const recarregar = async () => {
    setLoading(true);
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  };

  return {
    chartData,
    loading,
    recarregar
  };
};