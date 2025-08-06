import { useState, useEffect } from 'react';
import { mockDataService } from '@/services/mockDataService';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DashboardSummary {
  saldo_total: number;
  contas_pagar: {
    pendentes: number;
    valor_pendente: number;
    vencidas: number;
    valor_vencido: number;
    pagas_mes: number;
    valor_pago_mes: number;
  };
  contas_receber: {
    pendentes: number;
    valor_pendente: number;
    vencidas: number;
    valor_vencido: number;
    recebidas_mes: number;
    valor_recebido_mes: number;
  };
}

export interface UseDashboardReturn {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  recarregar: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const carregarDashboard = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await mockDataService.getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setError('Erro ao carregar dashboard');
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const recarregar = async (): Promise<void> => {
    await carregarDashboard();
  };

  useEffect(() => {
    if (user) {
      carregarDashboard();
    } else {
      setSummary(null);
    }
  }, [user]);

  return {
    summary,
    loading,
    error,
    recarregar
  };
}