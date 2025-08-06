import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    carregarMovimentacoes();
  }, []);

  const carregarMovimentacoes = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          id,
          descricao,
          valor_final,
          data_vencimento,
          data_pagamento,
          status,
          fornecedores(nome)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const movimentacoesFormatadas: MovimentacaoRecente[] = (data || []).map(conta => ({
        id: conta.id.toString(),
        data: new Date(conta.data_vencimento),
        fornecedor: conta.fornecedores?.nome || 'Fornecedor não informado',
        descricao: conta.descricao,
        valor: conta.valor_final,
        status: conta.status === 'vencida' ? 'vencido' : conta.status as 'pendente' | 'pago' | 'vencido'
      }));

      setMovimentacoes(movimentacoesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar movimentações recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    movimentacoes,
    loading,
    recarregar: carregarMovimentacoes
  };
};