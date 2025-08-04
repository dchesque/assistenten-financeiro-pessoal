import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChartDataCategoria {
  name: string;
  value: number;
  color: string;
}

interface ChartDataFluxoMensal {
  mes: string;
  material: number;
  servicos: number;
  aluguel: number;
  outros: number;
}

interface ChartDataStatus {
  name: string;
  value: number;
  color: string;
}

interface ChartData {
  categorias: ChartDataCategoria[];
  fluxoMensal: ChartDataFluxoMensal[];
  statusContas: ChartDataStatus[];
}

export const useDashboardCharts = () => {
  const [loading, setLoading] = useState(true);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [planoContas, setPlanoContas] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Buscar contas a pagar
      const { data: contas, error: contasError } = await supabase
        .from('contas_pagar')
        .select('*');

      if (contasError) throw contasError;

      // Buscar plano de contas
      const { data: planos, error: planosError } = await supabase
        .from('plano_contas')
        .select('*')
        .eq('ativo', true);

      if (planosError) throw planosError;

      setContasPagar(contas || []);
      setPlanoContas(planos || []);
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData: ChartData = useMemo(() => {
    if (!contasPagar.length || !planoContas.length) {
      return {
        categorias: [],
        fluxoMensal: [],
        statusContas: []
      };
    }

    // Dados por categoria - buscar categoria do plano de contas
    const categoriaMap = new Map<string, { valor: number; cor: string }>();
    
    contasPagar.forEach(conta => {
      const planoConta = planoContas.find(p => p.id === conta.plano_conta_id);
      const categoria = planoConta?.nome || 'Outros';
      const valor = conta.valor_final || 0;
      
      if (categoriaMap.has(categoria)) {
        categoriaMap.get(categoria)!.valor += valor;
      } else {
        const cor = getCategoryCor(categoria, planoConta?.tipo_dre);
        categoriaMap.set(categoria, { valor, cor });
      }
    });

    const categorias: ChartDataCategoria[] = Array.from(categoriaMap.entries()).map(([name, data]) => ({
      name,
      value: data.valor,
      color: data.cor
    }));

    // Fluxo mensal (últimos 3 meses)
    const hoje = new Date();
    const fluxoMensal: ChartDataFluxoMensal[] = [];

    for (let i = 2; i >= 0; i--) {
      const mesData = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0);
      const mesNome = mesData.toLocaleString('pt-BR', { month: 'short' });

      const contasMes = contasPagar.filter(conta => {
        const dataVencimento = new Date(conta.data_vencimento);
        return dataVencimento >= mesData && dataVencimento <= proximoMes;
      });

      let material = 0, servicos = 0, aluguel = 0, outros = 0;

      contasMes.forEach(conta => {
        const planoConta = planoContas.find(p => p.id === conta.plano_conta_id);
        const nomeCategoria = planoConta?.nome?.toLowerCase() || '';
        const valor = conta.valor_final || 0;

        if (planoConta?.tipo_dre === 'cmv' || nomeCategoria.includes('material')) {
          material += valor;
        } else if (nomeCategoria.includes('servi')) {
          servicos += valor;
        } else if (nomeCategoria.includes('aluguel')) {
          aluguel += valor;
        } else {
          outros += valor;
        }
      });

      fluxoMensal.push({
        mes: mesNome,
        material,
        servicos,
        aluguel,
        outros
      });
    }

    // Status das contas
    const statusMap = new Map<string, number>();
    contasPagar.forEach(conta => {
      const status = getStatusLabel(conta.status);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const statusContas: ChartDataStatus[] = Array.from(statusMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: getStatusColor(name)
    }));

    return {
      categorias,
      fluxoMensal,
      statusContas
    };
  }, [contasPagar, planoContas]);

  return {
    chartData,
    loading,
    recarregar: carregarDados
  };
};

// Funções auxiliares
const getCategoryCor = (categoria: string, tipoDre?: string): string => {
  const cores = {
    'material': '#10B981',
    'cmv': '#10B981',
    'servi': '#06B6D4',
    'aluguel': '#8B5CF6',
    'energia': '#F59E0B',
    'outros': '#EF4444'
  };

  const categoriaLower = categoria.toLowerCase();
  
  if (tipoDre === 'cmv' || categoriaLower.includes('material')) return cores.material;
  if (categoriaLower.includes('servi')) return cores.servi;
  if (categoriaLower.includes('aluguel')) return cores.aluguel;
  if (categoriaLower.includes('energia')) return cores.energia;
  
  return cores.outros;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pendente': 'Pendentes',
    'pago': 'Pagas',
    'vencido': 'Vencidas',
    'cancelado': 'Canceladas'
  };
  
  return labels[status] || 'Outros';
};

const getStatusColor = (status: string): string => {
  const cores: Record<string, string> = {
    'Pendentes': '#4F46E5',
    'Pagas': '#10B981',
    'Vencidas': '#EF4444',
    'Canceladas': '#6B7280'
  };
  
  return cores[status] || '#6B7280';
};