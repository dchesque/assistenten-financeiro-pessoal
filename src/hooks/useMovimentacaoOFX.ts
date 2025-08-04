import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface MovimentacaoOFXSupabase {
  id: number;
  banco_id: number;
  fitid: string | null;
  data_transacao: string;
  data_processamento: string;
  tipo: 'debito' | 'credito';
  valor: number;
  descricao: string;
  categoria_automatica?: string | null;
  conta_pagar_id?: number | null;
  origem: 'manual' | 'ofx';
  status_conciliacao: 'conciliado' | 'pendente' | 'divergente';
  created_at: string;
  updated_at: string;
}

export const useMovimentacaoOFX = (bancoId?: number) => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoOFXSupabase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const listarMovimentacoes = async (bancoIdParam?: number) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('movimentacoes_bancarias_ofx')
        .select('*')
        .order('data_transacao', { ascending: false });

      if (bancoIdParam || bancoId) {
        query = query.eq('banco_id', bancoIdParam || bancoId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMovimentacoes((data || []) as MovimentacaoOFXSupabase[]);
    } catch (error: any) {
      console.error('Erro ao listar movimentações OFX:', error);
      setError(error.message);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as movimentações OFX.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarMovimentacao = async (movimentacao: Omit<MovimentacaoOFXSupabase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_bancarias_ofx')
        .insert([movimentacao])
        .select()
        .single();

      if (error) throw error;

      setMovimentacoes(prev => [data as MovimentacaoOFXSupabase, ...prev]);
      return data as MovimentacaoOFXSupabase;
    } catch (error: any) {
      console.error('Erro ao criar movimentação OFX:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a movimentação OFX.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const atualizarMovimentacao = async (id: number, updates: Partial<MovimentacaoOFXSupabase>) => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_bancarias_ofx')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setMovimentacoes(prev => prev.map(m => m.id === id ? data as MovimentacaoOFXSupabase : m));
      return data as MovimentacaoOFXSupabase;
    } catch (error: any) {
      console.error('Erro ao atualizar movimentação OFX:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a movimentação OFX.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const vincularContaPagar = async (movimentacaoId: number, contaPagarId: number) => {
    try {
      await atualizarMovimentacao(movimentacaoId, {
        conta_pagar_id: contaPagarId,
        status_conciliacao: 'conciliado'
      });

      toast({
        title: "Sucesso",
        description: "Movimentação vinculada à conta a pagar.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível vincular a movimentação.",
        variant: "destructive"
      });
    }
  };

  const marcarComoIgnorada = async (movimentacaoId: number, observacao?: string) => {
    try {
      await atualizarMovimentacao(movimentacaoId, {
        status_conciliacao: 'divergente',
        categoria_automatica: observacao || 'Ignorada pelo usuário'
      });

      toast({
        title: "Sucesso",
        description: "Movimentação marcada como ignorada.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar como ignorada.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (bancoId) {
      listarMovimentacoes(bancoId);
    }
  }, [bancoId]);

  return {
    movimentacoes,
    loading,
    error,
    listarMovimentacoes,
    criarMovimentacao,
    atualizarMovimentacao,
    vincularContaPagar,
    marcarComoIgnorada
  };
};