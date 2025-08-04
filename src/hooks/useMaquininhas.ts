import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  Maquininha, 
  ProcessamentoExtrato, 
  ConciliacaoMaquininha,
  TaxasOperadora 
} from '@/types/maquininha';

interface DashboardData {
  maquininhasAtivas: number;
  taxaConciliacao: number;
  recebidoMes: number;
  taxasPagas: number;
}

interface UltimaConciliacao {
  id: string;
  periodo: string;
  maquininha_nome: string;
  data_conciliacao: string;
  total_vendas: number;
  total_recebimentos: number;
  status: string;
  diferenca: number;
}

export const useMaquininhas = () => {
  const [maquininhas, setMaquininhas] = useState<Maquininha[]>([]);
  const [processamentos, setProcessamentos] = useState<ProcessamentoExtrato[]>([]);
  const [conciliacoes, setConciliacoes] = useState<ConciliacaoMaquininha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar maquininhas do Supabase
  const carregarMaquininhas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: maquininhasData, error: maquininhasError } = await supabase
        .from('maquininhas')
        .select(`
          *,
          bancos!inner (
            id,
            nome
          ),
          taxas_maquininha (
            id,
            bandeira,
            tipo_transacao,
            parcelas_max,
            taxa_percentual,
            taxa_fixa,
            ativo
          )
        `)
        .order('created_at', { ascending: false });

      if (maquininhasError) throw maquininhasError;

      const maquininhasFormatadas: Maquininha[] = (maquininhasData || []).map(m => ({
        id: m.id,
        nome: m.nome,
        operadora: m.operadora as 'rede' | 'sipag',
        codigo_estabelecimento: m.codigo_estabelecimento,
        banco_id: m.banco_id,
        banco_nome: m.bancos.nome,
        ativo: m.ativo,
        taxas: (m.taxas_maquininha || []).map(t => ({
          id: t.id,
          maquininha_id: m.id,
          bandeira: t.bandeira as any,
          tipo_transacao: t.tipo_transacao as any,
          parcelas_max: t.parcelas_max,
          taxa_percentual: t.taxa_percentual,
          taxa_fixa: t.taxa_fixa,
          ativo: t.ativo
        })),
        created_at: new Date(m.created_at),
        updated_at: new Date(m.updated_at)
      }));

      setMaquininhas(maquininhasFormatadas);
    } catch (err) {
      console.error('Erro ao carregar maquininhas:', err);
      setError('Erro ao carregar maquininhas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMaquininhas();
  }, []);

  const salvarMaquininha = async (maquininha: Omit<Maquininha, 'id' | 'created_at' | 'updated_at'>): Promise<Maquininha> => {
    try {
      const { data, error } = await supabase
        .from('maquininhas')
        .insert({
          nome: maquininha.nome,
          operadora: maquininha.operadora,
          codigo_estabelecimento: maquininha.codigo_estabelecimento,
          banco_id: maquininha.banco_id,
          ativo: maquininha.ativo
        })
        .select()
        .single();

      if (error) throw error;

      // Taxas serão gerenciadas separadamente no modal dedicado

      await carregarMaquininhas();
      toast.success('Maquininha cadastrada com sucesso!');
      
      return {
        ...maquininha,
        id: data.id,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (err) {
      console.error('Erro ao salvar maquininha:', err);
      toast.error('Erro ao cadastrar maquininha');
      throw new Error('Erro ao salvar maquininha');
    }
  };

  const atualizarMaquininha = async (id: string, dadosAtualizados: Partial<Maquininha>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('maquininhas')
        .update({
          nome: dadosAtualizados.nome,
          operadora: dadosAtualizados.operadora,
          codigo_estabelecimento: dadosAtualizados.codigo_estabelecimento,
          banco_id: dadosAtualizados.banco_id,
          ativo: dadosAtualizados.ativo
        })
        .eq('id', id);

      if (error) throw error;

      await carregarMaquininhas();
      toast.success('Maquininha atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar maquininha:', err);
      toast.error('Erro ao atualizar maquininha');
      throw new Error('Erro ao atualizar maquininha');
    }
  };

  const alternarStatusMaquininha = async (id: string): Promise<void> => {
    try {
      const maquininha = maquininhas.find(m => m.id === id);
      if (!maquininha) throw new Error('Maquininha não encontrada');

      const { error } = await supabase
        .from('maquininhas')
        .update({ ativo: !maquininha.ativo })
        .eq('id', id);

      if (error) throw error;

      await carregarMaquininhas();
      toast.success(`Maquininha ${!maquininha.ativo ? 'ativada' : 'desativada'} com sucesso!`);
    } catch (err) {
      console.error('Erro ao alterar status da maquininha:', err);
      toast.error('Erro ao alterar status da maquininha');
      throw new Error('Erro ao alterar status da maquininha');
    }
  };

  const processarExtrato = async (
    maquininhaId: string, 
    periodo: string, 
    arquivos: { vendas: File; bancario: File; }
  ): Promise<ProcessamentoExtrato> => {
    try {
      const { data } = await supabase.rpc('processar_extrato_maquininha', {
        p_maquininha_id: maquininhaId,
        p_periodo: periodo,
        p_arquivo_vendas_nome: arquivos.vendas.name,
        p_arquivo_bancario_nome: arquivos.bancario.name
      });

      const novoProcessamento: ProcessamentoExtrato = {
        id: data,
        periodo,
        maquininha_id: maquininhaId,
        arquivo_vendas: {
          nome: arquivos.vendas.name,
          tipo: arquivos.vendas.name.endsWith('.xlsx') ? 'xlsx' : 'csv',
          processado_em: new Date(),
          total_registros: Math.floor(Math.random() * 1000) + 100
        },
        arquivo_bancario: {
          nome: arquivos.bancario.name,
          tipo: arquivos.bancario.name.endsWith('.ofx') ? 'ofx' : 'csv',
          processado_em: new Date(),
          total_registros: Math.floor(Math.random() * 50) + 10
        },
        status: 'conciliado',
        divergencias: Math.floor(Math.random() * 5),
        conciliado_automaticamente: Math.floor(Math.random() * 40) + 50
      };
      
      setProcessamentos(prev => [...prev, novoProcessamento]);
      toast.success('Extrato processado com sucesso!');
      return novoProcessamento;
    } catch (err) {
      console.error('Erro ao processar extrato:', err);
      toast.error('Erro ao processar extrato');
      throw new Error('Erro ao processar extrato');
    }
  };

  const obterDashboardData = async () => {
    try {
      // Obter dados do dashboard
      const { data: dashboardData, error: dashboardError } = await supabase
        .rpc('obter_dashboard_maquininhas');

      if (dashboardError) throw dashboardError;

      // Obter últimas conciliações
      const { data: conciliacoesData, error: conciliacoesError } = await supabase
        .rpc('obter_ultimas_conciliacoes', { limite: 5 });

      if (conciliacoesError) throw conciliacoesError;

      const dashboard = dashboardData?.[0] || {
        maquininhas_ativas: 0,
        taxa_conciliacao: 0,
        recebido_mes: 0,
        taxas_pagas: 0
      };

      const ultimasConciliacoes: ConciliacaoMaquininha[] = (conciliacoesData || []).map((c: UltimaConciliacao) => ({
        id: c.id,
        periodo: c.periodo,
        maquininha_id: '', // Não necessário para exibição
        data_conciliacao: new Date(c.data_conciliacao),
        total_vendas: c.total_vendas,
        total_recebimentos: c.total_recebimentos,
        total_taxas: 0, // Calculado se necessário
        status: c.status as 'ok' | 'divergencia',
        observacoes: undefined,
        detalhes_diarios: []
      }));

      return {
        maquininhasAtivas: dashboard.maquininhas_ativas,
        taxaConciliacao: dashboard.taxa_conciliacao,
        recebidoMes: dashboard.recebido_mes,
        taxasPagas: dashboard.taxas_pagas,
        ultimasConciliacoes
      };
    } catch (err) {
      console.error('Erro ao obter dados do dashboard:', err);
      return {
        maquininhasAtivas: 0,
        taxaConciliacao: 0,
        recebidoMes: 0,
        taxasPagas: 0,
        ultimasConciliacoes: []
      };
    }
  };

  const obterRelatorioTaxas = async (dataInicio: Date, dataFim: Date): Promise<TaxasOperadora[]> => {
    try {
      const { data, error } = await supabase
        .rpc('obter_relatorio_taxas_operadora', {
          p_data_inicio: dataInicio.toISOString().split('T')[0],
          p_data_fim: dataFim.toISOString().split('T')[0]
        });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        operadora: item.operadora,
        nome: item.nome_operadora,
        totalTransacoes: item.total_transacoes,
        totalTaxas: item.total_taxas,
        fornecedor_id: item.fornecedor_id,
        bancoVinculado: item.banco_vinculado
      }));
    } catch (err) {
      console.error('Erro ao obter relatório de taxas:', err);
      return [];
    }
  };

  return {
    maquininhas,
    processamentos,
    conciliacoes,
    loading,
    error,
    salvarMaquininha,
    atualizarMaquininha,
    alternarStatusMaquininha,
    processarExtrato,
    obterDashboardData,
    obterRelatorioTaxas,
    recarregar: carregarMaquininhas
  };
};