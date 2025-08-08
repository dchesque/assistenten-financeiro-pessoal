import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Banco } from '@/types/banco';
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
  bancos: Banco[];
  loading: boolean;
  error: string | null;
  estatisticas: EstatisticasBanco;
  criarBanco: (banco: Omit<Banco, 'id' | 'created_at' | 'updated_at'>) => Promise<Banco>;
  atualizarBanco: (id: number, banco: Partial<Banco>) => Promise<Banco>;
  excluirBanco: (id: number) => Promise<void>;
  recarregar: () => Promise<void>;
}

// Dados mock para bancos
const mockBancos: Banco[] = [
  {
    id: 1,
    nome: 'Banco do Brasil',
    codigo_banco: '001',
    agencia: '1234-5',
    conta: '12345-6',
    tipo_conta: 'conta_corrente',
    digito_verificador: '9',
    limite_usado: 0,
    suporta_ofx: true,
    saldo_inicial: 10000.00,
    saldo_atual: 15000.00,
    ativo: true,
    observacoes: 'Conta principal da empresa',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-12-23T15:30:00Z'
  },
  {
    id: 2,
    nome: 'Itaú Unibanco',
    codigo_banco: '341',
    agencia: '5678-9',
    conta: '67890-1',
    tipo_conta: 'poupanca',
    digito_verificador: '2',
    limite_usado: 0,
    suporta_ofx: false,
    saldo_inicial: 5000.00,
    saldo_atual: 7500.00,
    ativo: true,
    observacoes: 'Conta reserva',
    created_at: '2024-02-10T14:20:00Z',
    updated_at: '2024-12-23T15:30:00Z'
  }
];

export function useBancosSupabase(): UseBancosReturn {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError, withRetry } = useErrorHandler();
  const calcularEstatisticas = (bancosList: Banco[]): EstatisticasBanco => {
    const bancosAtivos = bancosList.filter(b => b.ativo);
    const saldos = bancosAtivos.map(b => b.saldo_atual || 0);
    
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
    setLoading(true);
    setError(null);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setBancos(mockBancos);
    } catch (error) {
      const appError = handleError(error, 'useBancosSupabase.listarBancos');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const criarBanco = async (banco: Omit<Banco, 'id' | 'created_at' | 'updated_at'>): Promise<Banco> => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const novoBanco: Banco = {
        ...banco,
        id: Math.max(...bancos.map(b => b.id)) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setBancos(prev => [...prev, novoBanco]);
      toast({ title: 'Sucesso', description: 'Banco criado com sucesso!' });
      
      return novoBanco;
    } catch (error) {
      handleError(error, 'useBancosSupabase.criarBanco');
      throw error;
    }
  };

  const atualizarBanco = async (id: number, dadosAtualizacao: Partial<Banco>): Promise<Banco> => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const bancoAtualizado = bancos.find(b => b.id === id);
      if (!bancoAtualizado) {
        throw new Error('Banco não encontrado');
      }
      
      const bancoNovo = { 
        ...bancoAtualizado, 
        ...dadosAtualizacao,
        updated_at: new Date().toISOString()
      };
      
      setBancos(prev => prev.map(b => b.id === id ? bancoNovo : b));
      toast({ title: 'Sucesso', description: 'Banco atualizado com sucesso!' });
      
      return bancoNovo;
    } catch (error) {
      handleError(error, 'useBancosSupabase.atualizarBanco');
      throw error;
    }
  };

  const excluirBanco = async (id: number): Promise<void> => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
    listarBancos();
  }, []);

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