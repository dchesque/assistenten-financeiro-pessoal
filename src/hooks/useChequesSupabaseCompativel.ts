import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Cheque, FiltrosCheque, EstatisticasCheque } from '@/types/cheque';
import { useAuth } from '@/hooks/useAuth';

export function useChequesSupabaseCompativel() {
  const { user } = useAuth();
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasCheque | null>(null);
  const [loading, setLoading] = useState(false);
  const [bancos, setBancos] = useState<any[]>([]);

  const [filtros, setFiltros] = useState<FiltrosCheque>({
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
        // Status já padronizado no banco
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

      // Adaptar dados para compatibilidade completa
      const chequesAdaptados: Cheque[] = (data || []).map(cheque => ({
        id: cheque.id,
        numero_cheque: cheque.numero_cheque,
        valor: cheque.valor,
        data_emissao: cheque.data_emissao,
        data_vencimento: cheque.data_vencimento,
        status: cheque.status as any,
        beneficiario_nome: cheque.beneficiario_nome,
        beneficiario_documento: cheque.beneficiario_documento,
        observacoes: cheque.observacoes,
        banco_id: cheque.banco_id,
        conta_pagar_id: cheque.conta_pagar_id,
        fornecedor_id: cheque.fornecedor_id,
        tipo_beneficiario: (cheque.tipo_beneficiario as 'fornecedor' | 'outros') || 'outros',
        finalidade: cheque.finalidade,
        motivo_cancelamento: cheque.motivo_cancelamento,
        motivo_devolucao: cheque.motivo_devolucao,
        data_compensacao: cheque.data_compensacao,
        created_at: cheque.created_at,
        updated_at: cheque.updated_at
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

  // Calcular estatísticas usando função otimizada
  const calcularEstatisticas = async () => {
    try {
      const { data, error } = await supabase
        .rpc('obter_estatisticas_cheques');

      if (error) throw error;

      const resultado = data?.[0];
      if (resultado) {
        const stats: EstatisticasCheque = {
          total_cheques: Number(resultado.total_cheques),
          total_valor: Number(resultado.total_valor),
          pendentes: {
            quantidade: Number(resultado.pendentes_quantidade),
            valor: Number(resultado.pendentes_valor)
          },
          compensados: {
            quantidade: Number(resultado.compensados_quantidade),
            valor: Number(resultado.compensados_valor)
          },
          devolvidos: {
            quantidade: Number(resultado.devolvidos_quantidade),
            valor: Number(resultado.devolvidos_valor)
          },
          cancelados: {
            quantidade: Number(resultado.cancelados_quantidade),
            valor: Number(resultado.cancelados_valor)
          }
        };

        setEstatisticas(stats);
      }

    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };

  // Emitir novo cheque
  const emitirCheque = async (dadosCheque: Partial<Cheque>) => {
    try {
    const { data, error } = await supabase
      .from('cheques')
      .insert([{
        numero_cheque: dadosCheque.numero_cheque!,
        valor: dadosCheque.valor!,
        data_emissao: dadosCheque.data_emissao!,
        data_vencimento: dadosCheque.data_vencimento,
        beneficiario_nome: dadosCheque.beneficiario_nome!,
        beneficiario_documento: dadosCheque.beneficiario_documento,
        banco_id: dadosCheque.banco_id!,
        observacoes: dadosCheque.observacoes,
        status: 'pendente',
        tipo_beneficiario: dadosCheque.tipo_beneficiario || 'outros',
        fornecedor_id: dadosCheque.fornecedor_id,
        finalidade: dadosCheque.finalidade,
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
  const atualizarCheque = async (id: number, dadosCheque: Partial<Cheque>) => {
    try {
      const updateData: any = { ...dadosCheque };
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;

      const { data, error } = await supabase
        .from('cheques')
        .update(updateData)
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