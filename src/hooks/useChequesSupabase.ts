import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface ChequeSupabase {
  id: number;
  banco_id: number;
  numero_cheque: string;
  beneficiario_nome: string;
  beneficiario_documento?: string;
  valor: number;
  data_emissao: string;
  data_vencimento?: string;
  status: 'emitido' | 'compensado' | 'devolvido' | 'cancelado';
  observacoes?: string;
  conta_pagar_id?: number;
  created_at: string;
  updated_at: string;
}

export interface EstatisticasCheques {
  totalCheques: number;
  valorTotal: number;
  pendentes: {
    quantidade: number;
    valor: number;
  };
  compensados: {
    quantidade: number;
    valor: number;
  };
  devolvidos: {
    quantidade: number;
    valor: number;
  };
  cancelados: {
    quantidade: number;
    valor: number;
  };
}

export interface FiltrosCheques {
  busca: string;
  status: string;
  bancoId?: number;
  dataInicio: string;
  dataFim: string;
}

export const useChequesSupabase = () => {
  const { user } = useAuth();
  const [cheques, setCheques] = useState<ChequeSupabase[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasCheques>({
    totalCheques: 0,
    valorTotal: 0,
    pendentes: { quantidade: 0, valor: 0 },
    compensados: { quantidade: 0, valor: 0 },
    devolvidos: { quantidade: 0, valor: 0 },
    cancelados: { quantidade: 0, valor: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosCheques>({
    busca: '',
    status: 'todos',
    dataInicio: '',
    dataFim: ''
  });

  // Carregar cheques
  const carregarCheques = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('cheques')
        .select(`
          *,
          bancos!inner(id, nome, agencia, conta)
        `)
        .order('data_emissao', { ascending: false });

      // Aplicar filtros
      if (filtros.busca) {
        query = query.or(`numero_cheque.ilike.%${filtros.busca}%,beneficiario_nome.ilike.%${filtros.busca}%,observacoes.ilike.%${filtros.busca}%`);
      }

      if (filtros.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }

      if (filtros.bancoId) {
        query = query.eq('banco_id', filtros.bancoId);
      }

      if (filtros.dataInicio) {
        query = query.gte('data_emissao', filtros.dataInicio);
      }

      if (filtros.dataFim) {
        query = query.lte('data_emissao', filtros.dataFim);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar cheques:', error);
        toast.error('Erro ao carregar cheques');
        return;
      }

      setCheques((data as ChequeSupabase[]) || []);
    } catch (error) {
      console.error('Erro ao carregar cheques:', error);
      toast.error('Erro ao carregar cheques');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Calcular estatísticas
  const calcularEstatisticas = useCallback(async () => {
    try {
      const { data: todosCheques, error } = await supabase
        .from('cheques')
        .select('*');

      if (error) {
        console.error('Erro ao carregar estatísticas:', error);
        return;
      }

      const cheques = todosCheques || [];
      
      const estatisticas = cheques.reduce((acc, cheque) => {
        acc.totalCheques++;
        acc.valorTotal += cheque.valor;

        switch (cheque.status) {
          case 'emitido':
            acc.pendentes.quantidade++;
            acc.pendentes.valor += cheque.valor;
            break;
          case 'compensado':
            acc.compensados.quantidade++;
            acc.compensados.valor += cheque.valor;
            break;
          case 'devolvido':
            acc.devolvidos.quantidade++;
            acc.devolvidos.valor += cheque.valor;
            break;
          case 'cancelado':
            acc.cancelados.quantidade++;
            acc.cancelados.valor += cheque.valor;
            break;
        }

        return acc;
      }, {
        totalCheques: 0,
        valorTotal: 0,
        pendentes: { quantidade: 0, valor: 0 },
        compensados: { quantidade: 0, valor: 0 },
        devolvidos: { quantidade: 0, valor: 0 },
        cancelados: { quantidade: 0, valor: 0 }
      });

      setEstatisticas(estatisticas);
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  }, []);

  // Emitir cheque
  const emitirCheque = async (dadosCheque: Omit<ChequeSupabase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);

      // Verificar se número do cheque já existe para o banco
      const { data: chequeExistente } = await supabase
        .from('cheques')
        .select('id')
        .eq('banco_id', dadosCheque.banco_id)
        .eq('numero_cheque', dadosCheque.numero_cheque)
        .single();

      if (chequeExistente) {
        toast.error('Já existe um cheque com este número para o banco selecionado');
        return null;
      }

      const { data, error } = await supabase
        .from('cheques')
        .insert([{
          ...dadosCheque,
          status: 'emitido',
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao emitir cheque:', error);
        toast.error('Erro ao emitir cheque');
        return null;
      }

      toast.success('Cheque emitido com sucesso!');
      await carregarCheques();
      await calcularEstatisticas();
      return data;
    } catch (error) {
      console.error('Erro ao emitir cheque:', error);
      toast.error('Erro ao emitir cheque');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar cheque
  const atualizarCheque = async (id: number, dadosCheque: Partial<ChequeSupabase>) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cheques')
        .update({
          ...dadosCheque,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cheque:', error);
        toast.error('Erro ao atualizar cheque');
        return false;
      }

      toast.success('Cheque atualizado com sucesso!');
      await carregarCheques();
      await calcularEstatisticas();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cheque:', error);
      toast.error('Erro ao atualizar cheque');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Marcar como compensado
  const marcarCompensado = async (id: number, observacoes?: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('cheques')
        .update({ 
          status: 'compensado',
          observacoes: observacoes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao marcar cheque como compensado:', error);
        toast.error('Erro ao marcar cheque como compensado');
        return false;
      }

      toast.success('Cheque marcado como compensado!');
      await carregarCheques();
      await calcularEstatisticas();
      return true;
    } catch (error) {
      console.error('Erro ao marcar cheque como compensado:', error);
      toast.error('Erro ao marcar cheque como compensado');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Marcar como devolvido
  const marcarDevolvido = async (id: number, motivo: string, observacoes?: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('cheques')
        .update({ 
          status: 'devolvido',
          observacoes: `Motivo: ${motivo}${observacoes ? ` - ${observacoes}` : ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao marcar cheque como devolvido:', error);
        toast.error('Erro ao marcar cheque como devolvido');
        return false;
      }

      toast.success('Cheque marcado como devolvido!');
      await carregarCheques();
      await calcularEstatisticas();
      return true;
    } catch (error) {
      console.error('Erro ao marcar cheque como devolvido:', error);
      toast.error('Erro ao marcar cheque como devolvido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Cancelar cheque
  const cancelarCheque = async (id: number, motivo: string, observacoes?: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('cheques')
        .update({ 
          status: 'cancelado',
          observacoes: `Motivo: ${motivo}${observacoes ? ` - ${observacoes}` : ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao cancelar cheque:', error);
        toast.error('Erro ao cancelar cheque');
        return false;
      }

      toast.success('Cheque cancelado com sucesso!');
      await carregarCheques();
      await calcularEstatisticas();
      return true;
    } catch (error) {
      console.error('Erro ao cancelar cheque:', error);
      toast.error('Erro ao cancelar cheque');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar bancos
  const buscarBancos = async () => {
    try {
      const { data, error } = await supabase
        .from('bancos')
        .select('id, nome, agencia, conta')
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao buscar bancos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
      return [];
    }
  };

  // Effect para carregar dados iniciais
  useEffect(() => {
    carregarCheques();
  }, [carregarCheques]);

  useEffect(() => {
    calcularEstatisticas();
  }, [calcularEstatisticas]);

  return {
    cheques,
    estatisticas,
    loading,
    filtros,
    setFiltros,
    carregarCheques,
    emitirCheque,
    atualizarCheque,
    marcarCompensado,
    marcarDevolvido,
    cancelarCheque,
    buscarBancos,
    calcularEstatisticas
  };
};