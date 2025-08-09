import { useState, useEffect } from 'react';
import { dataService } from '@/services/DataServiceFactory';
import { useAuth } from './useAuth';

export interface MovimentacaoRecente {
  id: string;
  data: Date;
  fornecedor: string;
  descricao: string;
  valor: number;
  status: 'pendente' | 'pago' | 'vencido';
}


export const useMovimentacoesRecentes = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRecente[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const carregarMovimentacoes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Buscar contas a pagar recentes do Supabase
      const contasPagar = await dataService.contasPagar.getAll();
      
      // Converter para o formato esperado
      const movimentacoesConvertidas: MovimentacaoRecente[] = contasPagar
        .slice(0, 5) // Apenas as 5 mais recentes
        .map((conta: any) => ({
          id: conta.id,
          data: new Date(conta.due_date || conta.data_vencimento),
          fornecedor: conta.supplier?.name || conta.fornecedor?.nome || 'Fornecedor',
          descricao: conta.description || conta.descricao,
          valor: conta.amount || conta.valor_original || 0,
          status: mapearStatus(conta.status)
        }));

      setMovimentacoes(movimentacoesConvertidas);
    } catch (error) {
      console.error('Erro ao carregar movimentações recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mapear status do Supabase para o formato esperado
  const mapearStatus = (status: string): 'pendente' | 'pago' | 'vencido' => {
    switch (status) {
      case 'paid': return 'pago';
      case 'overdue': return 'vencido';
      case 'pending': 
      default: return 'pendente';
    }
  };

  useEffect(() => {
    if (user) {
      carregarMovimentacoes();
    } else {
      setMovimentacoes([]);
    }
  }, [user]);

  return {
    movimentacoes,
    loading,
    recarregar: carregarMovimentacoes
  };
};