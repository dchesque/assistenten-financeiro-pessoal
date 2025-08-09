import { useState, useEffect, useMemo } from 'react';
import { dataService } from '@/services/DataServiceFactory';
import { useAuth } from './useAuth';

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

const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export const useDashboardCharts = () => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData>({
    categorias: [],
    fluxoMensal: [],
    statusContas: []
  });
  const { user } = useAuth();

  const carregarDadosGraficos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Buscar contas a pagar e receber para gerar dados dos gráficos
      const [contasPagar, contasReceber, categorias] = await Promise.all([
        dataService.contasPagar.getAll(),
        dataService.contasReceber.getAll(),
        dataService.categorias.getAll()
      ]);

      // Dados por categoria (contas a pagar)
      const categoriaMap = new Map();
      contasPagar.forEach((conta: any) => {
        if (conta.category) {
          const existing = categoriaMap.get(conta.category.name) || 0;
          categoriaMap.set(conta.category.name, existing + Number(conta.amount));
        }
      });

      const dadosCategorias = Array.from(categoriaMap.entries())
        .map(([categoria, valor], index) => ({
          categoria,
          valor,
          cor: cores[index % cores.length]
        }))
        .slice(0, 5); // Top 5 categorias

      // Dados de status das contas
      const statusMap = {
        pending: { status: 'Pendente', quantidade: 0, cor: '#f59e0b' },
        paid: { status: 'Pago', quantidade: 0, cor: '#10b981' },
        overdue: { status: 'Vencido', quantidade: 0, cor: '#ef4444' }
      };

      contasPagar.forEach((conta: any) => {
        if (statusMap[conta.status as keyof typeof statusMap]) {
          statusMap[conta.status as keyof typeof statusMap].quantidade++;
        }
      });

      // Fluxo mensal (últimos 3 meses)
      const hoje = new Date();
      const fluxoMensal = [];
      for (let i = 2; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mes = data.toLocaleDateString('pt-BR', { month: 'short' });
        const valor = Math.random() * 30000 + 20000; // Mock data por enquanto
        fluxoMensal.push({ mes, valor, meta: 30000 });
      }

      setChartData({
        categorias: dadosCategorias,
        fluxoMensal,
        statusContas: Object.values(statusMap)
      });
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
      // Manter dados vazios em caso de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosGraficos();
  }, [user]);

  const recarregar = async () => {
    await carregarDadosGraficos();
  };

  return {
    chartData,
    loading,
    recarregar
  };
};