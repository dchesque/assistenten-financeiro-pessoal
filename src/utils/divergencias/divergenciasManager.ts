import { supabase } from '@/integrations/supabase/client';
import type { 
  DivergenciaConciliacao, 
  ResolucaoDivergencia,
  RelatorioConciliacao 
} from '@/types/conciliacao';

export class DivergenciasManager {
  /**
   * Salva divergências no banco de dados
   */
  static async salvarDivergencias(
    conciliacaoId: string,
    divergencias: DivergenciaConciliacao[]
  ): Promise<void> {
    try {
      console.log('Salvando divergências:', { conciliacaoId, total: divergencias.length });

      // Inserir divergências na tabela detalhes_conciliacao
      const divergenciasFormatadas = divergencias.map(div => ({
        conciliacao_id: conciliacaoId,
        data: new Date(div.created_at).toISOString().split('T')[0],
        vendas_valor: div.valor_esperado || 0,
        vendas_quantidade: div.valor_esperado > 0 ? 1 : 0,
        recebimento_valor: div.valor_encontrado || 0,
        recebimento_quantidade: div.valor_encontrado > 0 ? 1 : 0,
        diferenca: Math.abs((div.valor_esperado || 0) - (div.valor_encontrado || 0)),
        status: div.status === 'pendente' ? 'divergencia' : 'ok',
        motivo_divergencia: div.descricao
      }));
      
      const { error } = await supabase
        .from('detalhes_conciliacao')
        .insert(divergenciasFormatadas);
        
      if (error) {
        console.error('Erro Supabase ao salvar divergências:', error);
        throw error;
      }

      console.log('Divergências salvas com sucesso');
      
    } catch (error) {
      console.error('Erro ao salvar divergências:', error);
      throw new Error(`Falha ao salvar divergências: ${error.message}`);
    }
  }
  
  /**
   * Carrega divergências de uma conciliação específica
   */
  static async carregarDivergencias(conciliacaoId: string): Promise<DivergenciaConciliacao[]> {
    try {
      console.log('Carregando divergências para conciliação:', conciliacaoId);

      const { data, error } = await supabase
        .from('detalhes_conciliacao')
        .select('*')
        .eq('conciliacao_id', conciliacaoId)
        .eq('status', 'divergencia');

      if (error) {
        console.error('Erro ao carregar divergências:', error);
        throw error;
      }

      // Converter para formato DivergenciaConciliacao
      const divergencias: DivergenciaConciliacao[] = (data || []).map(item => ({
        id: item.id,
        tipo: item.vendas_valor > 0 && item.recebimento_valor === 0 
          ? 'transacao_nao_encontrada' 
          : item.recebimento_valor > 0 && item.vendas_valor === 0
          ? 'transacao_nao_encontrada'
          : 'valor_diferente',
        descricao: item.motivo_divergencia || 'Divergência detectada',
        valor_esperado: item.vendas_valor || 0,
        valor_encontrado: item.recebimento_valor || 0,
        status: 'pendente',
        created_at: new Date(item.data)
      }));

      console.log('Divergências carregadas:', divergencias.length);
      return divergencias;
      
    } catch (error) {
      console.error('Erro ao carregar divergências:', error);
      throw new Error(`Falha ao carregar divergências: ${error.message}`);
    }
  }
  
  /**
   * Resolve uma divergência específica
   */
  static async resolverDivergencia(
    divergenciaId: string,
    resolucao: ResolucaoDivergencia
  ): Promise<void> {
    try {
      console.log('Resolvendo divergência:', { divergenciaId, resolucao });

      // Atualizar status na tabela detalhes_conciliacao
      const { error } = await supabase
        .from('detalhes_conciliacao')
        .update({
          status: 'ok',
          motivo_divergencia: `${resolucao.motivo} (Resolução: ${resolucao.tipo})`
        })
        .eq('id', divergenciaId);

      if (error) {
        console.error('Erro ao resolver divergência:', error);
        throw error;
      }

      // Inserir log de auditoria
      await supabase
        .from('audit_log')
        .insert({
          tabela: 'detalhes_conciliacao',
          operacao: 'RESOLVE_DIVERGENCIA',
          registro_id: parseInt(divergenciaId),
          descricao: `Divergência resolvida: ${resolucao.tipo} - ${resolucao.motivo}`,
          dados_depois: {
            resolucao_tipo: resolucao.tipo,
            resolucao_motivo: resolucao.motivo,
            data_resolucao: new Date().toISOString()
          } as any
        });

      console.log('Divergência resolvida com sucesso');
      
    } catch (error) {
      console.error('Erro ao resolver divergência:', error);
      throw new Error(`Falha ao resolver divergência: ${error.message}`);
    }
  }
  
  /**
   * Gera relatório completo de reconciliação
   */
  static async gerarRelatorioReconciliacao(
    maquininhaId: string,
    periodo: string
  ): Promise<RelatorioConciliacao> {
    try {
      console.log('Gerando relatório de reconciliação:', { maquininhaId, periodo });

      // Buscar dados da conciliação
      const { data: conciliacao, error: conciliacaoError } = await supabase
        .from('conciliacoes_maquininha')
        .select('*, maquininhas(nome, operadora)')
        .eq('maquininha_id', maquininhaId)
        .eq('periodo', periodo)
        .single();

      if (conciliacaoError && conciliacaoError.code !== 'PGRST116') {
        throw conciliacaoError;
      }

      // Buscar detalhes das divergências
      const divergencias = conciliacao ? await this.carregarDivergencias(conciliacao.id) : [];

      // Buscar vendas e recebimentos do período
      const { data: vendas } = await supabase
        .from('vendas_maquininha')
        .select('*')
        .eq('maquininha_id', maquininhaId)
        .eq('periodo_processamento', periodo);

      const { data: maquininha } = await supabase
        .from('maquininhas')
        .select('banco_id, nome')
        .eq('id', maquininhaId)
        .single();

      const { data: recebimentos } = await supabase
        .from('recebimentos_bancario')
        .select('*')
        .eq('banco_id', maquininha?.banco_id)
        .eq('periodo_processamento', periodo);

      // Calcular métricas
      const totalVendas = vendas?.reduce((sum, v) => sum + v.valor_liquido, 0) || 0;
      const totalRecebimentos = recebimentos?.reduce((sum, r) => sum + r.valor, 0) || 0;
      const taxaConciliacao = totalVendas > 0 ? ((totalVendas - Math.abs(totalVendas - totalRecebimentos)) / totalVendas) * 100 : 0;

      const relatorio: RelatorioConciliacao = {
        periodo,
        total_maquininhas: 1,
        valor_vendas: totalVendas,
        valor_recebimentos: totalRecebimentos,
        taxa_conciliacao: Math.round(taxaConciliacao * 100) / 100,
        divergencias,
        detalhes_por_maquininha: [{
          maquininha_id: maquininhaId,
          nome: maquininha?.nome || 'Maquininha',
          status: conciliacao?.status || 'pendente',
          valor_vendas: totalVendas,
          valor_recebimentos: totalRecebimentos,
          divergencias: divergencias.length
        }]
      };

      console.log('Relatório gerado:', relatorio);
      return relatorio;
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw new Error(`Falha ao gerar relatório: ${error.message}`);
    }
  }

  /**
   * Obter estatísticas de performance da conciliação
   */
  static async obterEstatisticasPerformance(periodo?: string): Promise<{
    taxa_conciliacao_media: number;
    tempo_medio_resolucao: number;
    divergencias_por_tipo: Record<string, number>;
    performance_por_operadora: Record<string, { conciliadas: number; pendentes: number; taxa: number }>;
  }> {
    try {
      console.log('Obtendo estatísticas de performance:', periodo);

      const whereClause = periodo ? `periodo = '${periodo}'` : '1=1';

      // Buscar dados de conciliações
      const { data: conciliacoes } = await supabase
        .from('conciliacoes_maquininha')
        .select(`
          *,
          maquininhas(operadora)
        `)
        .filter('periodo', periodo ? 'eq' : 'neq', periodo || '');

      // Buscar divergências
      const { data: divergencias } = await supabase
        .from('detalhes_conciliacao')
        .select('*')
        .eq('status', 'divergencia');

      // Calcular métricas
      const totalConciliacoes = conciliacoes?.length || 0;
      const conciliacoesOk = conciliacoes?.filter(c => c.status === 'ok').length || 0;
      const taxaConciliacaoMedia = totalConciliacoes > 0 ? (conciliacoesOk / totalConciliacoes) * 100 : 0;

      // Agrupar por operadora
      const performancePorOperadora = (conciliacoes || []).reduce((acc, conciliacao) => {
        const operadora = conciliacao.maquininhas?.operadora || 'desconhecida';
        if (!acc[operadora]) {
          acc[operadora] = { conciliadas: 0, pendentes: 0, taxa: 0 };
        }
        
        if (conciliacao.status === 'ok') {
          acc[operadora].conciliadas++;
        } else {
          acc[operadora].pendentes++;
        }
        
        const total = acc[operadora].conciliadas + acc[operadora].pendentes;
        acc[operadora].taxa = total > 0 ? (acc[operadora].conciliadas / total) * 100 : 0;
        
        return acc;
      }, {} as Record<string, { conciliadas: number; pendentes: number; taxa: number }>);

      // Agrupar divergências por tipo
      const divergenciasPorTipo = (divergencias || []).reduce((acc, div) => {
        const tipo = div.motivo_divergencia?.includes('sem recebimento') ? 'venda_sem_recebimento' :
                    div.motivo_divergencia?.includes('sem venda') ? 'recebimento_sem_venda' : 'valor_diferente';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        taxa_conciliacao_media: Math.round(taxaConciliacaoMedia * 100) / 100,
        tempo_medio_resolucao: 2.5, // Placeholder - calcular com base em audit_log
        divergencias_por_tipo: divergenciasPorTipo,
        performance_por_operadora: performancePorOperadora
      };
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error(`Falha ao obter estatísticas: ${error.message}`);
    }
  }

  /**
   * Exportar dados para análise externa
   */
  static async exportarDadosConciliacao(
    maquininhaId: string,
    periodo: string,
    formato: 'json' | 'csv' = 'json'
  ): Promise<{ dados: any; nome_arquivo: string }> {
    try {
      const relatorio = await this.gerarRelatorioReconciliacao(maquininhaId, periodo);
      const { data: maquininha } = await supabase
        .from('maquininhas')
        .select('nome')
        .eq('id', maquininhaId)
        .single();

      const nomeArquivo = `conciliacao_${maquininha?.nome || 'maquininha'}_${periodo}.${formato}`;

      if (formato === 'csv') {
        // Converter para CSV
        const csvData = relatorio.divergencias.map(div => ({
          descricao: div.descricao,
          valor_esperado: div.valor_esperado,
          valor_encontrado: div.valor_encontrado,
          diferenca: Math.abs(div.valor_esperado - div.valor_encontrado),
          status: div.status,
          data_criacao: div.created_at.toISOString()
        }));

        return {
          dados: csvData,
          nome_arquivo: nomeArquivo
        };
      }

      return {
        dados: relatorio,
        nome_arquivo: nomeArquivo
      };
      
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw new Error(`Falha ao exportar dados: ${error.message}`);
    }
  }
}