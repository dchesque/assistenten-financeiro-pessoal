import { useState, useEffect } from 'react';
import { dataService } from '@/services/DataServiceFactory';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { showMessage } from '@/utils/messages';


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
  const { handleError, withRetry, withTimeout } = useErrorHandler('dashboard');

  const carregarDashboard = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    const loadingToast = showMessage.loading('Carregando dashboard...');
    
    try {
      const data = await withRetry(() => 
        withTimeout(dataService.dashboard.getSummary(), 30000)
      );
      setSummary(data);
      showMessage.dismiss();
    } catch (err) {
      showMessage.dismiss();
      const appErr = handleError(err, 'carregar-dashboard');
      setError(appErr.message);
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

    return () => {
      cancelAll();
    };
  }, [user, cancelAll]);

  return {
    summary,
    loading,
    error,
    recarregar
  };
}