import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LogAuditoria {
  id: number;
  tabela: string;
  operacao: string;
  registro_id?: number;
  dados_antes?: any;
  dados_depois?: any;
  usuario_id?: string;
  ip_address?: string;
  user_agent?: string;
  descricao?: string;
  data_operacao: string;
  tempo_execucao?: string;
}

export interface FiltrosAuditoria {
  tabela?: string;
  operacao?: string;
  data_inicio?: string;
  data_fim?: string;
  usuario_id?: string;
  limite?: number;
}

export interface EstatisticasAuditoria {
  total_operacoes: number;
  operacoes_por_tabela: { tabela: string; total: number }[];
  operacoes_por_tipo: { operacao: string; total: number }[];
  atividade_recente: number;
  usuarios_ativos: number;
}

export function useAuditoria() {
  const { toast } = useToast();
  
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAuditoria>({
    total_operacoes: 0,
    operacoes_por_tabela: [],
    operacoes_por_tipo: [],
    atividade_recente: 0,
    usuarios_ativos: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Buscar logs de auditoria
  const buscarLogs = useCallback(async (filtros: FiltrosAuditoria = {}) => {
    try {
      setLoading(true);
      setErro(null);
      
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('data_operacao', { ascending: false });
      
      // Aplicar filtros
      if (filtros.tabela) {
        query = query.eq('tabela', filtros.tabela);
      }
      
      if (filtros.operacao) {
        query = query.eq('operacao', filtros.operacao);
      }
      
      if (filtros.data_inicio) {
        query = query.gte('data_operacao', filtros.data_inicio);
      }
      
      if (filtros.data_fim) {
        query = query.lte('data_operacao', filtros.data_fim);
      }
      
      if (filtros.usuario_id) {
        query = query.eq('usuario_id', filtros.usuario_id);
      }
      
      // Limitar resultados
      const limite = filtros.limite || 100;
      query = query.limit(limite);
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setLogs((data || []).map(item => ({
        ...item,
        ip_address: item.ip_address?.toString(),
        user_agent: item.user_agent?.toString() || undefined,
        tempo_execucao: item.tempo_execucao?.toString() || undefined
      })));
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao buscar logs';
      setErro(mensagemErro);
      
      toast({
        title: "Erro ao carregar logs",
        description: mensagemErro,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Buscar estatísticas de auditoria
  const buscarEstatisticas = useCallback(async () => {
    try {
      // Buscar totais
      const { data: totalData } = await supabase
        .from('audit_log')
        .select('id', { count: 'exact', head: true });
      
      // Buscar por tabela
      const { data: porTabela } = await supabase
        .from('audit_log')
        .select('tabela')
        .gte('data_operacao', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      // Buscar por operação
      const { data: porOperacao } = await supabase
        .from('audit_log')
        .select('operacao')
        .gte('data_operacao', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      // Buscar atividade recente (últimas 24h)
      const { data: atividadeRecente } = await supabase
        .from('audit_log')
        .select('id', { count: 'exact', head: true })
        .gte('data_operacao', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      // Buscar usuários únicos
      const { data: usuariosUnicos } = await supabase
        .from('audit_log')
        .select('usuario_id')
        .not('usuario_id', 'is', null)
        .gte('data_operacao', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      // Processar estatísticas
      const operacoesPorTabela = (porTabela || []).reduce((acc, log) => {
        const index = acc.findIndex(item => item.tabela === log.tabela);
        if (index >= 0) {
          acc[index].total++;
        } else {
          acc.push({ tabela: log.tabela, total: 1 });
        }
        return acc;
      }, [] as { tabela: string; total: number }[]);
      
      const operacoesPorTipo = (porOperacao || []).reduce((acc, log) => {
        const index = acc.findIndex(item => item.operacao === log.operacao);
        if (index >= 0) {
          acc[index].total++;
        } else {
          acc.push({ operacao: log.operacao, total: 1 });
        }
        return acc;
      }, [] as { operacao: string; total: number }[]);
      
      const usuariosAtivosUnicos = new Set(
        (usuariosUnicos || []).map(u => u.usuario_id).filter(Boolean)
      ).size;
      
      setEstatisticas({
        total_operacoes: totalData?.length || 0,
        operacoes_por_tabela: operacoesPorTabela.sort((a, b) => b.total - a.total),
        operacoes_por_tipo: operacoesPorTipo.sort((a, b) => b.total - a.total),
        atividade_recente: atividadeRecente?.length || 0,
        usuarios_ativos: usuariosAtivosUnicos
      });
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas de auditoria:', error);
    }
  }, []);

  // Registrar log manual
  const registrarLog = useCallback(async (
    tabela: string,
    operacao: string,
    descricao: string,
    registroId?: number,
    dadosAntes?: any,
    dadosDepois?: any
  ) => {
    try {
      const { error } = await supabase
        .from('audit_log')
        .insert({
          tabela,
          operacao,
          registro_id: registroId,
          dados_antes: dadosAntes,
          dados_depois: dadosDepois,
          descricao,
          data_operacao: new Date().toISOString()
        });
      
      if (error) {
        throw error;
      }
      
      // Atualizar logs se estão sendo exibidos
      if (logs.length > 0) {
        await buscarLogs();
      }
      
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }, [logs.length, buscarLogs]);

  // Exportar logs
  const exportarLogs = useCallback(async (filtros: FiltrosAuditoria = {}) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('data_operacao', { ascending: false });
      
      // Aplicar filtros
      if (filtros.tabela) {
        query = query.eq('tabela', filtros.tabela);
      }
      
      if (filtros.operacao) {
        query = query.eq('operacao', filtros.operacao);
      }
      
      if (filtros.data_inicio) {
        query = query.gte('data_operacao', filtros.data_inicio);
      }
      
      if (filtros.data_fim) {
        query = query.lte('data_operacao', filtros.data_fim);
      }
      
      // Limite máximo para exportação
      query = query.limit(5000);
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Converter para CSV
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
          Object.values(row).map(value => 
            typeof value === 'object' ? JSON.stringify(value) : String(value)
          ).join(',')
        );
        
        const csv = [headers, ...rows].join('\n');
        
        // Download do arquivo
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Logs exportados",
          description: `${data.length} registros exportados com sucesso`
        });
      } else {
        toast({
          title: "Nenhum log encontrado",
          description: "Não há logs para exportar com os filtros aplicados",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao exportar logs';
      
      toast({
        title: "Erro na exportação",
        description: mensagemErro,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Limpar logs antigos (manter apenas últimos 90 dias)
  const limparLogsAntigos = useCallback(async () => {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 90);
      
      const { error } = await supabase
        .from('audit_log')
        .delete()
        .lt('data_operacao', dataLimite.toISOString());
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Logs antigos removidos",
        description: "Logs com mais de 90 dias foram removidos"
      });
      
      // Atualizar estatísticas
      await buscarEstatisticas();
      
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : 'Erro ao limpar logs';
      
      toast({
        title: "Erro ao limpar logs",
        description: mensagemErro,
        variant: "destructive"
      });
    }
  }, [toast, buscarEstatisticas]);

  // Carregar dados iniciais
  useEffect(() => {
    buscarEstatisticas();
  }, [buscarEstatisticas]);

  return {
    // Estado
    logs,
    estatisticas,
    loading,
    erro,
    
    // Ações
    buscarLogs,
    buscarEstatisticas,
    registrarLog,
    exportarLogs,
    limparLogsAntigos
  };
}