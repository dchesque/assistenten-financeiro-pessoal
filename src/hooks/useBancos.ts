import { useState, useEffect } from 'react';
import { dataService } from '@/services/DataServiceFactory';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { toast } from '@/hooks/use-toast';

// Usando tipos do Supabase diretamente
import type { Database } from '@/integrations/supabase/types';

type Banco = Database['public']['Tables']['banks']['Row'];
type BancoInsert = Database['public']['Tables']['banks']['Insert'];
type BancoUpdate = Database['public']['Tables']['banks']['Update'];

export interface UseBancosReturn {
  bancos: Banco[];
  loading: boolean;
  error: string | null;
  criarBanco: (banco: Omit<BancoInsert, 'user_id'>) => Promise<Banco>;
  atualizarBanco: (id: string, banco: BancoUpdate) => Promise<Banco | null>;
  excluirBanco: (id: string) => Promise<void>;
  recarregar: () => Promise<void>;
  estatisticas: {
    total_bancos: number;
    saldo_total: number;
    contas_ativas: number;
    contas_inativas: number;
  };
}

export function useBancos(): UseBancosReturn {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { handleError, withRetry } = useErrorHandler();

  // Calcular estatísticas
  const estatisticas = {
    total_bancos: bancos.length,
    saldo_total: bancos.reduce((total, banco) => total + (banco.initial_balance || 0), 0),
    contas_ativas: bancos.filter(banco => !banco.deleted_at).length,
    contas_inativas: bancos.filter(banco => banco.deleted_at).length
  };

  const carregarBancos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await withRetry(() => dataService.bancos.getAll());
      setBancos(data);
    } catch (error) {
      const appError = handleError(error, 'useBancos.carregarBancos');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const criarBanco = async (dadosBanco: Omit<BancoInsert, 'user_id'>): Promise<Banco> => {
    try {
      setLoading(true);
      
      // Verificar se já existe banco com mesmo nome
      const existente = bancos.find(banco => 
        banco.name.toLowerCase() === dadosBanco.name.toLowerCase()
      );
      
      if (existente) {
        throw new Error('Já existe um banco com este nome');
      }

      const novoBanco = await dataService.bancos.create(dadosBanco);
      setBancos(prev => [...prev, novoBanco]);
      
      toast({ title: 'Sucesso', description: 'Banco criado com sucesso!' });
      return novoBanco;
    } catch (error) {
      const appError = handleError(error, 'useBancos.criarBanco');
      setError(appError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarBanco = async (id: string, dadosAtualizacao: BancoUpdate): Promise<Banco | null> => {
    try {
      setLoading(true);
      
      // Verificar se novo nome já existe (se estiver sendo alterado)
      if (dadosAtualizacao.name) {
        const bancoAtual = bancos.find(banco => banco.id === id);
        if (bancoAtual) {
          const nome = dadosAtualizacao.name || bancoAtual.name;
          
          const existente = bancos.find(banco => 
            banco.id !== id &&
            banco.name.toLowerCase() === nome.toLowerCase()
          );
          
          if (existente) {
            throw new Error('Já existe um banco com este nome');
          }
        }
      }

      const bancoAtualizado = await dataService.bancos.update(id, dadosAtualizacao);
      
      if (bancoAtualizado) {
        setBancos(prev => 
          prev.map(banco => banco.id === id ? bancoAtualizado : banco)
        );
        toast({ title: 'Sucesso', description: 'Banco atualizado com sucesso!' });
      }
      
      return bancoAtualizado;
    } catch (error) {
      const appError = handleError(error, 'useBancos.atualizarBanco');
      setError(appError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const excluirBanco = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Verificar se banco está sendo usado (implementar quando houver movimentações)
      // Por enquanto, permitir exclusão
      
      await dataService.bancos.delete(id);
      setBancos(prev => prev.filter(banco => banco.id !== id));
      toast({ title: 'Sucesso', description: 'Banco excluído com sucesso!' });
    } catch (error) {
      const appError = handleError(error, 'useBancos.excluirBanco');
      setError(appError.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const recarregar = async (): Promise<void> => {
    await carregarBancos();
  };

  useEffect(() => {
    if (user) {
      carregarBancos();
    } else {
      setBancos([]);
    }
  }, [user]);

  return {
    bancos,
    loading,
    error,
    criarBanco,
    atualizarBanco,
    excluirBanco,
    recarregar,
    estatisticas
  };
}