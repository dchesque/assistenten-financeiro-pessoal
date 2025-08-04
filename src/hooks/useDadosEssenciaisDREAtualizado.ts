import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DadosEssenciaisDRE {
  id?: number;
  mes_referencia: string;
  cmv_valor: number;
  deducoes_receita?: number;
  percentual_impostos?: number;
  percentual_devolucoes?: number;
  estoque_inicial_qtd?: number;
  estoque_inicial_valor?: number;
  estoque_final_qtd?: number;
  estoque_final_valor?: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useDadosEssenciaisDREAtualizado() {
  const [dadosEssenciais, setDadosEssenciais] = useState<DadosEssenciaisDRE[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados essenciais
  const carregarDadosEssenciais = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dados_essenciais_dre')
        .select('*')
        .order('mes_referencia', { ascending: false });

      if (error) throw error;

      setDadosEssenciais(data || []);

    } catch (error) {
      console.error('Erro ao carregar dados essenciais DRE:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados essenciais da DRE",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar dados essenciais
  const salvarDadosEssenciais = async (dados: Partial<DadosEssenciaisDRE>) => {
    try {
      const { data, error } = await supabase
        .from('dados_essenciais_dre')
        .upsert([{
          mes_referencia: dados.mes_referencia!,
          cmv_valor: dados.cmv_valor || 0,
          deducoes_receita: dados.deducoes_receita,
          percentual_impostos: dados.percentual_impostos || 8.5,
          percentual_devolucoes: dados.percentual_devolucoes || 1.5,
          estoque_inicial_qtd: dados.estoque_inicial_qtd || 0,
          estoque_inicial_valor: dados.estoque_inicial_valor || 0,
          estoque_final_qtd: dados.estoque_final_qtd || 0,
          estoque_final_valor: dados.estoque_final_valor || 0,
          observacoes: dados.observacoes
        }], {
          onConflict: 'mes_referencia'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados essenciais salvos com sucesso!",
      });

      await carregarDadosEssenciais();
      return data;

    } catch (error) {
      console.error('Erro ao salvar dados essenciais:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados essenciais",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Buscar dados por período
  const buscarDadosPorPeriodo = async (mesReferencia: string): Promise<DadosEssenciaisDRE | null> => {
    try {
      const { data, error } = await supabase
        .from('dados_essenciais_dre')
        .select('*')
        .eq('mes_referencia', mesReferencia)
        .maybeSingle();

      if (error) throw error;

      return data;

    } catch (error) {
      console.error('Erro ao buscar dados por período:', error);
      return null;
    }
  };

  // Gerar DRE integrado
  const gerarDREIntegrado = async (mesReferencia: string) => {
    try {
      const { data, error } = await supabase
        .rpc('gerar_dre_integrado', { p_mes_referencia: mesReferencia });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Erro ao gerar DRE integrado:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar DRE integrado",
        variant: "destructive"
      });
      return [];
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    carregarDadosEssenciais();
  }, []);

  return {
    dadosEssenciais,
    loading,
    carregarDadosEssenciais,
    salvarDadosEssenciais,
    buscarDadosPorPeriodo,
    gerarDREIntegrado
  };
}