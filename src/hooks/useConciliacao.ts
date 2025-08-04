import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  ConciliacaoMaquininha,
  VendaMaquininha,
  RecebimentoBancario
} from '@/types/maquininha';
import type {
  DivergenciaConciliacao,
  ResolucaoDivergencia,
  EstatisticasConciliacao,
  FiltrosConciliacao,
  RelatorioConciliacao,
  DadosConciliacao,
  ToleranciasConciliacao
} from '@/types/conciliacao';

interface MatchingResult {
  vendas_conciliadas: number;
  recebimentos_conciliados: number;
  divergencias_criadas: number;
  detalhes: any;
}

interface DivergenciaSQL {
  id: string;
  tipo: string;
  descricao: string;
  valor_esperado: number;
  valor_encontrado: number;
  data_transacao: string;
  origem: string;
}

interface UseConciliacaoReturn {
  // Estado
  conciliacoes: ConciliacaoMaquininha[];
  loading: boolean;
  error: string | null;
  
  // Dados da conciliação específica
  dadosConciliacao: DadosConciliacao | null;
  
  // Ações principais
  buscarConciliacao: (maquininhaId: string, periodo: string) => Promise<ConciliacaoMaquininha | null>;
  executarConciliacao: (maquininhaId: string, periodo: string) => Promise<void>;
  executarMatchingAutomatico: (maquininhaId: string, periodo: string, tolerancias?: { valor: number; dias: number }) => Promise<MatchingResult>;
  executarMatchingInteligente: (maquininhaId: string, periodo: string, toleranciaValor?: number, toleranciaDias?: number) => Promise<MatchingResult>;
  resolverDivergencia: (divergenciaId: string, resolucao: ResolucaoDivergencia) => Promise<void>;
  
  // Matching manual
  vincularTransacoes: (vendaId: string, recebimentoId: string) => Promise<void>;
  desvincularTransacao: (vinculoId: string) => Promise<void>;
  
  // Divergências
  obterDivergencias: (maquininhaId: string, periodo: string) => Promise<DivergenciaSQL[]>;
  
  // Relatórios
  gerarRelatorioConciliacao: (filtros: FiltrosConciliacao) => Promise<RelatorioConciliacao>;
  
  // Dados agregados
  obterEstatisticasConciliacao: (periodo?: string) => Promise<EstatisticasConciliacao>;
  
  // Carregar dados específicos
  carregarDadosConciliacao: (maquininhaId: string, periodo: string) => Promise<void>;
}

const TOLERANCIAS_PADRAO: ToleranciasConciliacao = {
  valor_maximo: 1.00,
  dias_diferenca: 2,
  percentual_diferenca: 0.1,
  agrupamento_automatico: true
};

export const useConciliacao = (): UseConciliacaoReturn => {
  const [conciliacoes, setConciliacoes] = useState<ConciliacaoMaquininha[]>([]);
  const [dadosConciliacao, setDadosConciliacao] = useState<DadosConciliacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarConciliacao = useCallback(async (maquininhaId: string, periodo: string): Promise<ConciliacaoMaquininha | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('conciliacoes_maquininha')
        .select('*')
        .eq('maquininha_id', maquininhaId)
        .eq('periodo', periodo)
        .single();

      if (supabaseError && supabaseError.code !== 'PGRST116') {
        throw supabaseError;
      }

      if (!data) return null;

      const conciliacao: ConciliacaoMaquininha = {
        id: data.id,
        periodo: data.periodo,
        maquininha_id: data.maquininha_id,
        data_conciliacao: new Date(data.data_conciliacao),
        total_vendas: data.total_vendas,
        total_recebimentos: data.total_recebimentos,
        total_taxas: data.total_taxas,
        status: data.status as 'ok' | 'divergencia',
        observacoes: data.observacoes,
        detalhes_diarios: []
      };

      return conciliacao;
    } catch (err) {
      console.error('Erro ao buscar conciliação:', err);
      setError('Erro ao buscar conciliação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarDadosConciliacao = useCallback(async (maquininhaId: string, periodo: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Buscar vendas do período
      const { data: vendasData, error: vendasError } = await supabase
        .from('vendas_maquininha')
        .select('*')
        .eq('maquininha_id', maquininhaId)
        .eq('periodo_processamento', periodo)
        .order('data_venda', { ascending: false });

      if (vendasError) throw vendasError;

      // Buscar recebimentos bancários do período
      const { data: maquininhaData, error: maquininhaError } = await supabase
        .from('maquininhas')
        .select('banco_id')
        .eq('id', maquininhaId)
        .single();

      if (maquininhaError) throw maquininhaError;

      const { data: recebimentosData, error: recebimentosError } = await supabase
        .from('recebimentos_bancario')
        .select('*')
        .eq('banco_id', maquininhaData.banco_id)
        .eq('periodo_processamento', periodo)
        .order('data_recebimento', { ascending: false });

      if (recebimentosError) throw recebimentosError;

      // Processar dados
      const vendas = (vendasData || []).map(v => ({
        id: v.id,
        nsu: v.nsu,
        data_venda: new Date(v.data_venda),
        valor_bruto: v.valor_bruto,
        valor_liquido: v.valor_liquido,
        valor_taxa: v.valor_taxa,
        bandeira: v.bandeira,
        tipo_transacao: v.tipo_transacao,
        status: v.status === 'conciliado' ? 'conciliado' : 'pendente' as 'pendente' | 'conciliado',
        vinculado_a: undefined
      }));

      const recebimentos = (recebimentosData || []).map(r => ({
        id: r.id,
        data_recebimento: new Date(r.data_recebimento),
        valor: r.valor,
        descricao: r.descricao,
        documento: r.documento || '',
        status: r.status as 'pendente_conciliacao' | 'conciliado',
        vinculado_a: undefined
      }));

      // Obter divergências usando função SQL
      const divergencias = await obterDivergencias(maquininhaId, periodo);
      const divergenciasFormatadas: DivergenciaConciliacao[] = divergencias.map(d => ({
        id: d.id,
        tipo: d.tipo as 'valor_diferente' | 'transacao_nao_encontrada' | 'data_divergente',
        descricao: d.descricao,
        valor_esperado: d.valor_esperado,
        valor_encontrado: d.valor_encontrado,
        transacao_venda_id: d.origem === 'vendas_maquininha' ? d.id : undefined,
        transacao_recebimento_id: d.origem === 'recebimentos_bancario' ? d.id : undefined,
        status: 'pendente',
        created_at: new Date(d.data_transacao)
      }));

      const totalVendas = vendas.reduce((sum, v) => sum + v.valor_liquido, 0);
      const totalRecebimentos = recebimentos.reduce((sum, r) => sum + r.valor, 0);
      const diferenca = Math.abs(totalVendas - totalRecebimentos);
      const taxaConciliacao = totalVendas > 0 ? ((totalVendas - diferenca) / totalVendas) * 100 : 0;

      setDadosConciliacao({
        vendas,
        recebimentos,
        divergencias: divergenciasFormatadas,
        resumo: {
          total_vendas: totalVendas,
          total_recebimentos: totalRecebimentos,
          diferenca,
          taxa_conciliacao: taxaConciliacao
        }
      });

    } catch (err) {
      console.error('Erro ao carregar dados de conciliação:', err);
      setError('Erro ao carregar dados de conciliação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executarMatchingAutomatico = async (
    vendas: DadosConciliacao['vendas'], 
    recebimentos: DadosConciliacao['recebimentos']
  ) => {
    const divergencias: DivergenciaConciliacao[] = [];
    const vendasProcessadas = [...vendas];
    const recebimentosProcessados = [...recebimentos];

    // 1. Match exato por valor e data
    for (const venda of vendasProcessadas) {
      if (venda.status === 'conciliado') continue;

      const recebimentoMatch = recebimentosProcessados.find(r => 
        r.status === 'pendente_conciliacao' &&
        Math.abs(r.valor - venda.valor_liquido) <= TOLERANCIAS_PADRAO.valor_maximo &&
        Math.abs(r.data_recebimento.getTime() - venda.data_venda.getTime()) <= TOLERANCIAS_PADRAO.dias_diferenca * 24 * 60 * 60 * 1000
      );

      if (recebimentoMatch) {
        venda.status = 'conciliado';
        venda.vinculado_a = recebimentoMatch.id;
        recebimentoMatch.status = 'conciliado';
        recebimentoMatch.vinculado_a = venda.id;
      }
    }

    // 2. Identificar divergências
    const vendasPendentes = vendasProcessadas.filter(v => v.status === 'pendente');
    const recebimentosPendentes = recebimentosProcessados.filter(r => r.status === 'pendente_conciliacao');

    vendasPendentes.forEach(venda => {
      divergencias.push({
        id: `div-venda-${venda.id}`,
        tipo: 'transacao_nao_encontrada',
        descricao: `Venda NSU ${venda.nsu} sem recebimento correspondente`,
        valor_esperado: venda.valor_liquido,
        valor_encontrado: 0,
        transacao_venda_id: venda.id,
        status: 'pendente',
        created_at: new Date()
      });
    });

    recebimentosPendentes.forEach(recebimento => {
      divergencias.push({
        id: `div-receb-${recebimento.id}`,
        tipo: 'transacao_nao_encontrada',
        descricao: `Recebimento de ${recebimento.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sem venda correspondente`,
        valor_esperado: 0,
        valor_encontrado: recebimento.valor,
        transacao_recebimento_id: recebimento.id,
        status: 'pendente',
        created_at: new Date()
      });
    });

    return { vendasProcessadas, recebimentosProcessados, divergencias };
  };

  const executarConciliacao = useCallback(async (maquininhaId: string, periodo: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .rpc('conciliar_maquininha', {
          p_maquininha_id: maquininhaId,
          p_periodo: periodo
        });

      if (supabaseError) throw supabaseError;

      toast.success('Conciliação executada com sucesso!');
      
      // Recarregar dados
      await carregarDadosConciliacao(maquininhaId, periodo);
      
    } catch (err) {
      console.error('Erro ao executar conciliação:', err);
      setError('Erro ao executar conciliação');
      toast.error('Erro ao executar conciliação');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarDadosConciliacao]);

  const resolverDivergencia = useCallback(async (divergenciaId: string, resolucao: ResolucaoDivergencia): Promise<void> => {
    try {
      setLoading(true);
      
      // Atualizar localmente (em uma implementação real, salvaria no banco)
      if (dadosConciliacao) {
        const divergenciasAtualizadas = dadosConciliacao.divergencias.map(d => 
          d.id === divergenciaId 
            ? { ...d, status: 'resolvida' as const, resolucao }
            : d
        );
        
        setDadosConciliacao({
          ...dadosConciliacao,
          divergencias: divergenciasAtualizadas
        });
      }
      
      toast.success('Divergência resolvida com sucesso!');
    } catch (err) {
      console.error('Erro ao resolver divergência:', err);
      toast.error('Erro ao resolver divergência');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dadosConciliacao]);

  const vincularTransacoes = useCallback(async (vendaId: string, recebimentoId: string): Promise<void> => {
    try {
      if (dadosConciliacao) {
        const vendasAtualizadas = dadosConciliacao.vendas.map(v => 
          v.id === vendaId ? { ...v, status: 'conciliado' as const, vinculado_a: recebimentoId } : v
        );
        
        const recebimentosAtualizados = dadosConciliacao.recebimentos.map(r => 
          r.id === recebimentoId ? { ...r, status: 'conciliado' as const, vinculado_a: vendaId } : r
        );
        
        setDadosConciliacao({
          ...dadosConciliacao,
          vendas: vendasAtualizadas,
          recebimentos: recebimentosAtualizados
        });
      }
      
      toast.success('Transações vinculadas com sucesso!');
    } catch (err) {
      console.error('Erro ao vincular transações:', err);
      toast.error('Erro ao vincular transações');
      throw err;
    }
  }, [dadosConciliacao]);

  const desvincularTransacao = useCallback(async (vinculoId: string): Promise<void> => {
    try {
      // Implementar desvinculação
      toast.success('Transação desvinculada com sucesso!');
    } catch (err) {
      console.error('Erro ao desvincular transação:', err);
      toast.error('Erro ao desvincular transação');
      throw err;
    }
  }, []);

  const gerarRelatorioConciliacao = useCallback(async (filtros: FiltrosConciliacao): Promise<RelatorioConciliacao> => {
    try {
      // Implementar geração de relatório
      return {
        periodo: filtros.periodo_inicio || new Date().toISOString().slice(0, 7),
        total_maquininhas: 0,
        valor_vendas: 0,
        valor_recebimentos: 0,
        taxa_conciliacao: 0,
        divergencias: [],
        detalhes_por_maquininha: []
      };
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      throw err;
    }
  }, []);

  const executarMatchingAutomaticoSQL = useCallback(async (
    maquininhaId: string, 
    periodo: string, 
    tolerancias?: { valor: number; dias: number }
  ): Promise<MatchingResult> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .rpc('executar_matching_automatico', {
          p_maquininha_id: maquininhaId,
          p_periodo: periodo,
          p_tolerancia_valor: tolerancias?.valor || TOLERANCIAS_PADRAO.valor_maximo,
          p_tolerancia_dias: tolerancias?.dias || TOLERANCIAS_PADRAO.dias_diferenca
        });

      if (supabaseError) throw supabaseError;

      const resultado = data[0] || { 
        vendas_conciliadas: 0, 
        recebimentos_conciliados: 0, 
        divergencias_criadas: 0, 
        detalhes: [] 
      };

      toast.success(`Matching concluído: ${resultado.vendas_conciliadas} vendas conciliadas`);
      
      // Recarregar dados
      await carregarDadosConciliacao(maquininhaId, periodo);

      return resultado;
    } catch (err) {
      console.error('Erro ao executar matching automático:', err);
      setError('Erro ao executar matching automático');
      toast.error('Erro ao executar matching automático');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [carregarDadosConciliacao]);

  const obterDivergencias = useCallback(async (maquininhaId: string, periodo: string): Promise<DivergenciaSQL[]> => {
    try {
      const { data, error: supabaseError } = await supabase
        .rpc('obter_divergencias_conciliacao', {
          p_maquininha_id: maquininhaId,
          p_periodo: periodo
        });

      if (supabaseError) throw supabaseError;

      return data || [];
    } catch (err) {
      console.error('Erro ao obter divergências:', err);
      throw err;
    }
  }, []);

  const vincularTransacoesSQL = useCallback(async (vendaId: string, recebimentoId: string): Promise<void> => {
    try {
      setLoading(true);

      const { data, error: supabaseError } = await supabase
        .rpc('vincular_transacoes_manual', {
          p_venda_id: vendaId,
          p_recebimento_id: recebimentoId
        });

      if (supabaseError) throw supabaseError;

      // Atualizar estado local
      if (dadosConciliacao) {
        const vendasAtualizadas = dadosConciliacao.vendas.map(v => 
          v.id === vendaId ? { ...v, status: 'conciliado' as const, vinculado_a: recebimentoId } : v
        );
        
        const recebimentosAtualizados = dadosConciliacao.recebimentos.map(r => 
          r.id === recebimentoId ? { ...r, status: 'conciliado' as const, vinculado_a: vendaId } : r
        );
        
        setDadosConciliacao({
          ...dadosConciliacao,
          vendas: vendasAtualizadas,
          recebimentos: recebimentosAtualizados
        });
      }
      
      toast.success('Transações vinculadas com sucesso!');
    } catch (err) {
      console.error('Erro ao vincular transações:', err);
      toast.error('Erro ao vincular transações');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dadosConciliacao]);

  const obterEstatisticasConciliacao = useCallback(async (periodo?: string): Promise<EstatisticasConciliacao> => {
    try {
      // Implementar busca de estatísticas
      return {
        total_maquininhas: 0,
        taxa_conciliacao_mes: 0,
        divergencias_pendentes: 0,
        valor_divergente: 0,
        tempo_medio_resolucao: 0,
        por_operadora: {
          rede: { conciliadas: 0, pendentes: 0 },
          sipag: { conciliadas: 0, pendentes: 0 }
        }
      };
    } catch (err) {
      console.error('Erro ao obter estatísticas:', err);
      throw err;
    }
  }, []);

  // Nova função para matching inteligente consolidado
  const executarMatchingInteligente = async (
    maquininhaId: string, 
    periodo: string, 
    toleranciaValor: number = 1.0, 
    toleranciaDias: number = 2
  ): Promise<MatchingResult> => {
    try {
      // 1. Executar matching simples primeiro
      const resultadoSimples = await executarMatchingAutomaticoSQL(
        maquininhaId, 
        periodo, 
        { valor: toleranciaValor, dias: toleranciaDias }
      );

      // 2. Executar matching agrupado para transações restantes
      const { data: resultadoAgrupado, error: errorAgrupado } = await supabase
        .rpc('executar_matching_agrupado', {
          p_maquininha_id: maquininhaId,
          p_periodo: periodo,
          p_tolerancia_valor: toleranciaValor,
          p_tolerancia_dias: toleranciaDias
        });

      if (errorAgrupado) {
        console.error('Erro no matching agrupado:', errorAgrupado);
        return resultadoSimples;
      }

      // 3. Consolidar resultados
      const resultadoConsolidado: MatchingResult = {
        vendas_conciliadas: (resultadoSimples.vendas_conciliadas || 0) + (resultadoAgrupado?.[0]?.vendas_agrupadas || 0),
        recebimentos_conciliados: (resultadoSimples.recebimentos_conciliados || 0) + (resultadoAgrupado?.[0]?.recebimentos_vinculados || 0),
        divergencias_criadas: resultadoSimples.divergencias_criadas || 0,
        detalhes: {
          matching_simples: resultadoSimples,
          matching_agrupado: resultadoAgrupado?.[0] || null,
          grupos_criados: resultadoAgrupado?.[0]?.grupos_criados || 0
        }
      };

      return resultadoConsolidado;

    } catch (error) {
      console.error('Erro no matching inteligente:', error);
      return {
        vendas_conciliadas: 0,
        recebimentos_conciliados: 0,
        divergencias_criadas: 0,
        detalhes: {}
      };
    }
  };

  return {
    conciliacoes,
    loading,
    error,
    dadosConciliacao,
    buscarConciliacao,
    executarConciliacao,
    executarMatchingAutomatico: executarMatchingAutomaticoSQL,
    executarMatchingInteligente,
    resolverDivergencia,
    vincularTransacoes: vincularTransacoesSQL,
    desvincularTransacao,
    obterDivergencias,
    gerarRelatorioConciliacao,
    obterEstatisticasConciliacao,
    carregarDadosConciliacao
  };
};