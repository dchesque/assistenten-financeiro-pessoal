import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Interface para compatibilidade com componentes existentes
interface ChequeSupabaseAdaptado {
  id: number;
  numero_cheque: string;
  valor: number;
  data_emissao: string;
  data_vencimento?: string | null;
  status: 'emitido' | 'compensado' | 'devolvido' | 'cancelado';
  beneficiario_nome: string;
  beneficiario_documento?: string | null;
  observacoes?: string | null;
  banco_id: number;
  conta_pagar_id?: number | null;
  created_at: string | null;
  updated_at: string | null;
  // Campos adicionais para compatibilidade
  tipo_beneficiario: 'fornecedor' | 'outros';
  fornecedor_id?: number;
  data_compensacao?: string;
}

interface EstatisticasChequesSupabase {
  total_cheques: number;
  total_valor: number;
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

interface FiltrosChequesSupabase {
  busca: string;
  status: 'todos' | 'emitido' | 'compensado' | 'devolvido' | 'cancelado';
  banco_id: 'todos' | number;
  data_inicio: string;
  data_fim: string;
}

export function useChequesSupabase() {
  const { user } = useAuth();
  const [cheques, setCheques] = useState<ChequeSupabaseAdaptado[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasChequesSupabase | null>(null);
  const [loading, setLoading] = useState(false);
  const [bancos, setBancos] = useState<any[]>([]);

  const [filtros, setFiltros] = useState<FiltrosChequesSupabase>({
    busca: '',
    status: 'todos',
    banco_id: 'todos',
    data_inicio: '',
    data_fim: ''
  });

  // Carregar cheques do Supabase
  const carregarCheques = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cheques')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }

      if (filtros.banco_id !== 'todos') {
        query = query.eq('banco_id', filtros.banco_id);
      }

      if (filtros.data_inicio) {
        query = query.gte('data_emissao', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        query = query.lte('data_emissao', filtros.data_fim);
      }

      if (filtros.busca) {
        query = query.or(`numero_cheque.ilike.%${filtros.busca}%,beneficiario_nome.ilike.%${filtros.busca}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Adaptar dados para compatibilidade
      const chequesAdaptados: ChequeSupabaseAdaptado[] = (data || []).map(cheque => ({
        ...cheque,
        status: cheque.status as 'emitido' | 'compensado' | 'devolvido' | 'cancelado',
        tipo_beneficiario: 'outros' as const,
        data_compensacao: cheque.status === 'compensado' ? cheque.updated_at : undefined
      }));

      setCheques(chequesAdaptados);
      await calcularEstatisticas();

    } catch (error) {
      console.error('Erro ao carregar cheques:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cheques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const calcularEstatisticas = async () => {
    try {
      const { data, error } = await supabase
        .from('cheques')
        .select('status, valor');

      if (error) throw error;

      const stats = {
        total_cheques: data?.length || 0,
        total_valor: data?.reduce((acc, c) => acc + c.valor, 0) || 0,
        pendentes: {
          quantidade: data?.filter(c => c.status === 'emitido').length || 0,
          valor: data?.filter(c => c.status === 'emitido').reduce((acc, c) => acc + c.valor, 0) || 0
        },
        compensados: {
          quantidade: data?.filter(c => c.status === 'compensado').length || 0,
          valor: data?.filter(c => c.status === 'compensado').reduce((acc, c) => acc + c.valor, 0) || 0
        },
        devolvidos: {
          quantidade: data?.filter(c => c.status === 'devolvido').length || 0,
          valor: data?.filter(c => c.status === 'devolvido').reduce((acc, c) => acc + c.valor, 0) || 0
        },
        cancelados: {
          quantidade: data?.filter(c => c.status === 'cancelado').length || 0,
          valor: data?.filter(c => c.status === 'cancelado').reduce((acc, c) => acc + c.valor, 0) || 0
        }
      };

      setEstatisticas(stats);

    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };

  // Emitir novo cheque
  const emitirCheque = async (dadosCheque: any) => {
    try {
      const { data, error } = await supabase
        .from('cheques')
        .insert([{
          numero_cheque: dadosCheque.numero_cheque,
          valor: dadosCheque.valor,
          data_emissao: dadosCheque.data_emissao,
          data_vencimento: dadosCheque.data_vencimento,
          beneficiario_nome: dadosCheque.beneficiario_nome,
          beneficiario_documento: dadosCheque.beneficiario_documento,
          banco_id: dadosCheque.banco_id,
          observacoes: dadosCheque.observacoes,
          status: 'emitido',
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cheque emitido com sucesso!",
      });

      await carregarCheques();
      return data;

    } catch (error) {
      console.error('Erro ao emitir cheque:', error);
      toast({
        title: "Erro",
        description: "Erro ao emitir cheque",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Atualizar cheque
  const atualizarCheque = async (id: number, dadosCheque: any) => {
    try {
      const { data, error } = await supabase
        .from('cheques')
        .update(dadosCheque)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cheque atualizado com sucesso!",
      });

      await carregarCheques();
      return data;

    } catch (error) {
      console.error('Erro ao atualizar cheque:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar cheque",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Marcar como compensado
  const marcarCompensado = async (id: number, observacoes?: string) => {
    try {
      const { error } = await supabase
        .from('cheques')
        .update({ 
          status: 'compensado',
          observacoes: observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cheque marcado como compensado!",
      });

      await carregarCheques();

    } catch (error) {
      console.error('Erro ao marcar cheque como compensado:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar cheque como compensado",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Marcar como devolvido
  const marcarDevolvido = async (id: number, motivo: string, observacoes?: string) => {
    try {
      const { error } = await supabase
        .from('cheques')
        .update({ 
          status: 'devolvido',
          observacoes: `${motivo}${observacoes ? ` - ${observacoes}` : ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cheque marcado como devolvido!",
      });

      await carregarCheques();

    } catch (error) {
      console.error('Erro ao marcar cheque como devolvido:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar cheque como devolvido",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Cancelar cheque
  const cancelarCheque = async (id: number, motivo: string, observacoes?: string) => {
    try {
      const { error } = await supabase
        .from('cheques')
        .update({ 
          status: 'cancelado',
          observacoes: `${motivo}${observacoes ? ` - ${observacoes}` : ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cheque cancelado com sucesso!",
      });

      await carregarCheques();

    } catch (error) {
      console.error('Erro ao cancelar cheque:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar cheque",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Buscar bancos
  const buscarBancos = async () => {
    try {
      const { data, error } = await supabase
        .from('bancos')
        .select('id, nome, agencia, conta')
        .eq('ativo', true);

      if (error) throw error;
      setBancos(data || []);

    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    carregarCheques();
    buscarBancos();
  }, []);

  // Recarregar quando filtros mudarem
  useEffect(() => {
    carregarCheques();
  }, [filtros]);

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
    bancos
  };
}