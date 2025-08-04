import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ResultadoReconciliacao {
  movimentacoes_reconciliadas: number;
  vendas_encontradas: number;
  valor_total_reconciliado: number;
  detalhes: any;
}

export interface RelatorioGerencial {
  periodo: string;
  total_vendas: number;
  receita_bruta: number;
  receita_liquida: number;
  ticket_medio: number;
  vendas_por_forma_pagamento: any;
  evolucao_diaria: any;
  top_categorias: any;
  performance_vendedores: any;
  indicadores_dre: any;
}

export function useIntegracaoModulos() {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Lançar venda no fluxo de caixa manualmente
  const lancarVendaFluxoCaixa = useCallback(async (vendaId: number) => {
    try {
      setLoading(true);
      setErro(null);
      
      const { data, error } = await supabase
        .rpc('lancar_venda_fluxo_caixa', { venda_id: vendaId });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Lançamento realizado",
        description: `Venda #${vendaId} lançada no fluxo de caixa com sucesso`
      });
      
      return true;
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao lançar no fluxo de caixa';
      setErro(mensagemErro);
      
      toast({
        title: "Erro no lançamento",
        description: mensagemErro,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Classificar venda na DRE manualmente
  const classificarVendaDRE = useCallback(async (vendaId: number) => {
    try {
      setLoading(true);
      setErro(null);
      
      const { data, error } = await supabase
        .rpc('classificar_venda_dre', { venda_id: vendaId });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Classificação realizada",
        description: `Venda #${vendaId} classificada na DRE com sucesso`
      });
      
      return true;
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao classificar na DRE';
      setErro(mensagemErro);
      
      toast({
        title: "Erro na classificação",
        description: mensagemErro,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Reconciliação bancária automática
  const reconciliarMovimentacoes = useCallback(async (
    dataInicio: string,
    dataFim: string,
    bancoId?: number
  ): Promise<ResultadoReconciliacao | null> => {
    try {
      setLoading(true);
      setErro(null);
      
      const { data, error } = await supabase
        .rpc('reconciliar_movimentacao_automatica', {
          p_data_inicio: dataInicio,
          p_data_fim: dataFim,
          p_banco_id: bancoId
        });
      
      if (error) {
        throw error;
      }
      
      const resultado = data[0];
      
      if (resultado.movimentacoes_reconciliadas > 0) {
        toast({
          title: "Reconciliação concluída",
          description: `${resultado.movimentacoes_reconciliadas} movimentações reconciliadas automaticamente`
        });
      } else {
        toast({
          title: "Nenhuma reconciliação",
          description: "Não foram encontradas movimentações para reconciliar no período",
          variant: "destructive"
        });
      }
      
      return resultado;
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro na reconciliação';
      setErro(mensagemErro);
      
      toast({
        title: "Erro na reconciliação",
        description: mensagemErro,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Gerar relatório gerencial
  const gerarRelatorioGerencial = useCallback(async (
    dataInicio: string,
    dataFim: string
  ): Promise<RelatorioGerencial | null> => {
    try {
      setLoading(true);
      setErro(null);
      
      const { data, error } = await supabase
        .rpc('gerar_relatorio_gerencial_periodo', {
          p_data_inicio: dataInicio,
          p_data_fim: dataFim
        });
      
      if (error) {
        throw error;
      }
      
      const relatorio = data[0];
      
      toast({
        title: "Relatório gerado",
        description: `Relatório do período ${relatorio.periodo} gerado com sucesso`
      });
      
      return relatorio;
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao gerar relatório';
      setErro(mensagemErro);
      
      toast({
        title: "Erro no relatório",
        description: mensagemErro,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Processar lote de vendas (integração completa)
  const processarLoteVendas = useCallback(async (vendasIds: number[]) => {
    try {
      setLoading(true);
      setErro(null);
      
      let sucessos = 0;
      let erros = 0;
      
      for (const vendaId of vendasIds) {
        try {
          // Classificar na DRE
          await supabase.rpc('classificar_venda_dre', { venda_id: vendaId });
          
          // Lançar no fluxo de caixa
          await supabase.rpc('lancar_venda_fluxo_caixa', { venda_id: vendaId });
          
          sucessos++;
        } catch (error) {
          console.error(`Erro ao processar venda ${vendaId}:`, error);
          erros++;
        }
      }
      
      if (sucessos > 0) {
        toast({
          title: "Processamento concluído",
          description: `${sucessos} vendas processadas com sucesso${erros > 0 ? ` (${erros} erros)` : ''}`
        });
      }
      
      if (erros > 0 && sucessos === 0) {
        toast({
          title: "Erro no processamento",
          description: `Falha ao processar ${erros} vendas`,
          variant: "destructive"
        });
      }
      
      return { sucessos, erros };
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro no processamento em lote';
      setErro(mensagemErro);
      
      toast({
        title: "Erro no processamento",
        description: mensagemErro,
        variant: "destructive"
      });
      
      return { sucessos: 0, erros: vendasIds.length };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Verificar status da integração de uma venda
  const verificarStatusIntegracao = useCallback(async (vendaId: number) => {
    try {
      // Verificar se tem lançamento no fluxo de caixa
      const { data: movimentacao } = await supabase
        .from('movimentacoes_bancarias')
        .select('id, valor, data_movimentacao')
        .eq('documento_referencia', `VENDA-${vendaId}`)
        .eq('ativo', true)
        .single();
      
      // Verificar classificação DRE
      const { data: venda } = await supabase
        .from('vendas')
        .select('plano_conta_id, plano_contas(nome, tipo_dre)')
        .eq('id', vendaId)
        .single();
      
      return {
        temFluxoCaixa: !!movimentacao,
        temClassificacaoDRE: !!(venda?.plano_conta_id),
        dadosMovimentacao: movimentacao,
        classificacaoDRE: venda?.plano_contas
      };
      
    } catch (error) {
      console.error('Erro ao verificar status da integração:', error);
      return {
        temFluxoCaixa: false,
        temClassificacaoDRE: false,
        dadosMovimentacao: null,
        classificacaoDRE: null
      };
    }
  }, []);

  // Reprocessar vendas existentes (migração)
  const reprocessarVendasExistentes = useCallback(async (
    dataInicio?: string,
    dataFim?: string
  ) => {
    try {
      setLoading(true);
      setErro(null);
      
      // Buscar vendas no período
      let query = supabase
        .from('vendas')
        .select('id')
        .eq('ativo', true);
      
      if (dataInicio) {
        query = query.gte('data_venda', dataInicio);
      }
      
      if (dataFim) {
        query = query.lte('data_venda', dataFim);
      }
      
      const { data: vendas, error } = await query.limit(100); // Processar em lotes
      
      if (error) {
        throw error;
      }
      
      if (!vendas || vendas.length === 0) {
        toast({
          title: "Nenhuma venda encontrada",
          description: "Não há vendas para reprocessar no período especificado"
        });
        return { sucessos: 0, erros: 0 };
      }
      
      const vendasIds = vendas.map(v => v.id);
      return await processarLoteVendas(vendasIds);
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao reprocessar vendas';
      setErro(mensagemErro);
      
      toast({
        title: "Erro no reprocessamento",
        description: mensagemErro,
        variant: "destructive"
      });
      
      return { sucessos: 0, erros: 0 };
    } finally {
      setLoading(false);
    }
  }, [toast, processarLoteVendas]);

  return {
    // Estado
    loading,
    erro,
    
    // Ações individuais
    lancarVendaFluxoCaixa,
    classificarVendaDRE,
    reconciliarMovimentacoes,
    gerarRelatorioGerencial,
    
    // Ações em lote
    processarLoteVendas,
    reprocessarVendasExistentes,
    
    // Verificação
    verificarStatusIntegracao
  };
}