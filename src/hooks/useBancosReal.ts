import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { dataService } from '@/services/DataServiceFactory';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
export interface EstatisticasBanco {
  totalBancos: number;
  bancosAtivos: number;
  saldoTotal: number;
  movimentacoesMes: number;
  maiorSaldo: number;
  menorSaldo: number;
}

export interface UseBancosReturn {
  bancos: any[];
  loading: boolean;
  error: string | null;
  estatisticas: EstatisticasBanco;
  criarBanco: (banco: any) => Promise<any>;
  atualizarBanco: (id: string, banco: any) => Promise<any>;
  excluirBanco: (id: string) => Promise<void>;
  recarregar: () => Promise<void>;
}


export function useBancosSupabase(): UseBancosReturn {
  const [bancos, setBancos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { handleError, withRetry } = useErrorHandler();
  const calcularEstatisticas = (bancosList: any[]): EstatisticasBanco => {
    const bancosAtivos = bancosList.filter(b => b.ativo || b.active !== false);
    const saldos = bancosAtivos.map(b => b.saldo_atual || b.initial_balance || 0);
    
    return {
      totalBancos: bancosList.length,
      bancosAtivos: bancosAtivos.length,
      saldoTotal: saldos.reduce((acc, saldo) => acc + saldo, 0),
      movimentacoesMes: 45, // Mock
      maiorSaldo: saldos.length > 0 ? Math.max(...saldos) : 0,
      menorSaldo: saldos.length > 0 ? Math.min(...saldos) : 0
    };
  };

  const listarBancos = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await dataService.bancos.getAll();
      setBancos(data);
    } catch (error) {
      const appError = handleError(error, 'useBancosSupabase.listarBancos');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const criarBanco = async (banco: any): Promise<any> => {
    try {
      const novoBanco = await dataService.bancos.create(banco);
      setBancos(prev => [...prev, novoBanco]);
      toast({ title: 'Sucesso', description: 'Banco criado com sucesso!' });
      return novoBanco;
    } catch (error) {
      handleError(error, 'useBancosSupabase.criarBanco');
      throw error;
    }
  };

  const atualizarBanco = async (id: string, dadosAtualizacao: any): Promise<any> => {
    try {
      const bancoAtualizado = await dataService.bancos.update(id, dadosAtualizacao);
      setBancos(prev => prev.map(b => b.id === id ? bancoAtualizado : b));
      toast({ title: 'Sucesso', description: 'Banco atualizado com sucesso!' });
      return bancoAtualizado;
    } catch (error) {
      handleError(error, 'useBancosSupabase.atualizarBanco');
      throw error;
    }
  };

  const excluirBanco = async (id: string): Promise<void> => {
    try {
      await dataService.bancos.delete(id);
      setBancos(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Sucesso', description: 'Banco excluído com sucesso!' });
    } catch (error) {
      handleError(error, 'useBancosSupabase.excluirBanco');
      throw error;
    }
  };

  const recarregar = async (): Promise<void> => {
    await listarBancos();
  };

  useEffect(() => {
    if (user) {
      listarBancos();
    } else {
      setBancos([]);
    }
  }, [user]);

  return {
    bancos,
    loading,
    error,
    estatisticas: calcularEstatisticas(bancos),
    criarBanco,
    atualizarBanco,
    excluirBanco,
    recarregar
  };
}