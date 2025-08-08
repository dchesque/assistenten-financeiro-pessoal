import { useState, useEffect } from 'react';
import { mockDataService, type Banco } from '@/services/mockDataService';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { toast } from '@/hooks/use-toast';
export interface UseBancosReturn {
  bancos: Banco[];
  loading: boolean;
  error: string | null;
  criarBanco: (banco: Omit<Banco, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Banco>;
  atualizarBanco: (id: string, banco: Partial<Banco>) => Promise<Banco | null>;
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
    saldo_total: bancos.reduce((total, banco) => total + banco.saldo_atual, 0),
    contas_ativas: bancos.filter(banco => banco.ativo).length,
    contas_inativas: bancos.filter(banco => !banco.ativo).length
  };

  const carregarBancos = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await withRetry(() => mockDataService.getBancos());
      setBancos(data);
    } catch (error) {
      const appError = handleError(error, 'useBancos.carregarBancos');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const criarBanco = async (dadosBanco: Omit<Banco, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Banco> => {
    try {
      setLoading(true);
      
      // Verificar se já existe banco com mesmo nome e agencia/conta
      if (dadosBanco.agencia && dadosBanco.conta) {
        const existente = bancos.find(banco => 
          banco.nome.toLowerCase() === dadosBanco.nome.toLowerCase() &&
          banco.agencia === dadosBanco.agencia &&
          banco.conta === dadosBanco.conta
        );
        
        if (existente) {
          throw new Error('Já existe um banco com este nome e conta/agência');
        }
      }

      // Definir saldo_atual igual ao saldo_inicial se não informado
      const dadosCompletos = {
        ...dadosBanco,
        saldo_atual: dadosBanco.saldo_atual ?? dadosBanco.saldo_inicial
      };

      const novoBanco = await mockDataService.createBanco(dadosCompletos);
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

  const atualizarBanco = async (id: string, dadosAtualizacao: Partial<Banco>): Promise<Banco | null> => {
    try {
      setLoading(true);
      
      // Verificar se novo nome/conta já existe (se estiver sendo alterado)
      if (dadosAtualizacao.nome || dadosAtualizacao.agencia || dadosAtualizacao.conta) {
        const bancoAtual = bancos.find(banco => banco.id === id);
        if (bancoAtual) {
          const nome = dadosAtualizacao.nome || bancoAtual.nome;
          const agencia = dadosAtualizacao.agencia || bancoAtual.agencia;
          const conta = dadosAtualizacao.conta || bancoAtual.conta;
          
          if (agencia && conta) {
            const existente = bancos.find(banco => 
              banco.id !== id &&
              banco.nome.toLowerCase() === nome.toLowerCase() &&
              banco.agencia === agencia &&
              banco.conta === conta
            );
            
            if (existente) {
              throw new Error('Já existe um banco com este nome e conta/agência');
            }
          }
        }
      }

      const bancoAtualizado = await mockDataService.updateBanco(id, dadosAtualizacao);
      
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
      
      const sucesso = await mockDataService.deleteBanco(id);
      
      if (sucesso) {
        setBancos(prev => prev.filter(banco => banco.id !== id));
        toast({ title: 'Sucesso', description: 'Banco excluído com sucesso!' });
      } else {
        throw new Error('Banco não encontrado');
      }
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