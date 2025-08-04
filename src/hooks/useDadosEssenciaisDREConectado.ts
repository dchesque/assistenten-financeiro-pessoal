import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DadosEssenciaisDRE {
  id?: number;
  mes_referencia: string;
  cmv_valor: number;
  estoque_inicial_qtd?: number;
  estoque_inicial_valor?: number;
  estoque_final_qtd?: number;
  estoque_final_valor?: number;
  deducoes_receita?: number;
  percentual_impostos?: number;
  percentual_devolucoes?: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DadosIntegracaoDRE {
  receita_bruta: number;
  receita_liquida: number;
  vendas_periodo: number;
  despesas_periodo: number;
  cmv_sugerido: number;
}

export const useDadosEssenciaisDREConectado = () => {
  const { toast } = useToast();
  const [dadosEssenciais, setDadosEssenciais] = useState<DadosEssenciaisDRE[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados essenciais
  const carregarDadosEssenciais = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('dados_essenciais_dre')
        .select('*')
        .order('mes_referencia', { ascending: false });

      if (error) throw error;

      setDadosEssenciais(data || []);
    } catch (error) {
      console.error('Erro ao carregar dados essenciais:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados essenciais do DRE",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar dados essenciais (upsert baseado no mês de referência)
  const salvarDadosEssenciais = async (dados: Omit<DadosEssenciaisDRE, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('dados_essenciais_dre')
        .upsert({
          mes_referencia: dados.mes_referencia,
          cmv_valor: dados.cmv_valor,
          estoque_inicial_qtd: dados.estoque_inicial_qtd,
          estoque_inicial_valor: dados.estoque_inicial_valor,
          estoque_final_qtd: dados.estoque_final_qtd,
          estoque_final_valor: dados.estoque_final_valor,
          deducoes_receita: dados.deducoes_receita,
          percentual_impostos: dados.percentual_impostos,
          percentual_devolucoes: dados.percentual_devolucoes,
          observacoes: dados.observacoes
        }, {
          onConflict: 'mes_referencia'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados essenciais salvos com sucesso!"
      });

      await carregarDadosEssenciais();
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados essenciais:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados essenciais",
        variant: "destructive"
      });
      return false;
    }
  };

  // Buscar dados por período específico
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

  // Obter dados de integração do período (vendas + despesas reais)
  const obterDadosIntegracao = async (mesReferencia: string): Promise<DadosIntegracaoDRE> => {
    try {
      const [ano, mes] = mesReferencia.split('-');
      const dataInicio = `${ano}-${mes}-01`;
      const dataFim = `${ano}-${mes.padStart(2, '0')}-31`;

      // Buscar vendas do período
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select('valor_total, valor_final, desconto, tipo_venda')
        .gte('data_venda', dataInicio)
        .lte('data_venda', dataFim)
        .eq('ativo', true);

      if (vendasError) throw vendasError;

      // Buscar despesas do período (contas pagas)
      const { data: despesas, error: despesasError } = await supabase
        .from('contas_pagar')
        .select('valor_final, status')
        .gte('data_vencimento', dataInicio)
        .lte('data_vencimento', dataFim)
        .eq('status', 'pago');

      if (despesasError) throw despesasError;

      // Calcular métricas
      const vendasValidas = vendas?.filter(v => v.tipo_venda !== 'devolucao') || [];
      const devolucoes = vendas?.filter(v => v.tipo_venda === 'devolucao') || [];
      
      const receita_bruta = vendasValidas.reduce((acc, v) => acc + Number(v.valor_total), 0);
      const totalDevolucoes = devolucoes.reduce((acc, v) => acc + Number(v.valor_final), 0);
      const totalDescontos = vendasValidas.reduce((acc, v) => acc + Number(v.desconto || 0), 0);
      
      const receita_liquida = receita_bruta - totalDevolucoes - totalDescontos;
      const vendas_periodo = vendasValidas.length;
      const despesas_periodo = despesas?.reduce((acc, d) => acc + Number(d.valor_final), 0) || 0;
      
      // Sugerir CMV como 60% da receita líquida (padrão para varejo)
      const cmv_sugerido = receita_liquida * 0.60;

      return {
        receita_bruta,
        receita_liquida,
        vendas_periodo,
        despesas_periodo,
        cmv_sugerido
      };
    } catch (error) {
      console.error('Erro ao obter dados de integração:', error);
      return {
        receita_bruta: 0,
        receita_liquida: 0,
        vendas_periodo: 0,
        despesas_periodo: 0,
        cmv_sugerido: 0
      };
    }
  };

  // Gerar DRE integrado usando função do Supabase
  const gerarDREIntegrado = async (mesReferencia: string) => {
    try {
      const { data, error } = await supabase.rpc('gerar_dre_integrado', {
        p_mes_referencia: mesReferencia
      });

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

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosEssenciais();
  }, []);

  return {
    dadosEssenciais,
    loading,
    carregarDadosEssenciais,
    salvarDadosEssenciais,
    buscarDadosPorPeriodo,
    obterDadosIntegracao,
    gerarDREIntegrado
  };
};