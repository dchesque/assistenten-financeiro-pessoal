import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface NotificacaoConciliacao {
  id: string;
  tipo: 'divergencia_critica' | 'conciliacao_pendente' | 'erro_processamento' | 'matching_disponivel';
  titulo: string;
  mensagem: string;
  maquininha_id?: string;
  maquininha_nome?: string;
  periodo?: string;
  valor_divergencia?: number;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  data_criacao: Date;
  lida: boolean;
}

export interface UseNotificacoesConciliacaoReturn {
  notificacoes: NotificacaoConciliacao[];
  naoLidas: number;
  loading: boolean;
  marcarComoLida: (id: string) => void;
  marcarTodasComoLidas: () => void;
  recarregarNotificacoes: () => void;
}

export function useNotificacoesConciliacao(): UseNotificacoesConciliacaoReturn {
  const [notificacoes, setNotificacoes] = useState<NotificacaoConciliacao[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      const novasNotificacoes: NotificacaoConciliacao[] = [];

      // 1. Divergências críticas (> R$ 500)
      const { data: divergenciasCriticas } = await supabase
        .from('detalhes_conciliacao')
        .select(`
          *,
          conciliacoes_maquininha!inner(
            maquininha_id,
            periodo,
            maquininhas!inner(nome)
          )
        `)
        .eq('status', 'divergencia')
        .gt('diferenca', 500)
        .order('data', { ascending: false })
        .limit(10);

      if (divergenciasCriticas) {
        divergenciasCriticas.forEach((div: any) => {
          novasNotificacoes.push({
            id: `div-${div.id}`,
            tipo: 'divergencia_critica',
            titulo: 'Divergência Crítica Detectada',
            mensagem: `Diferença de R$ ${div.diferenca?.toFixed(2)} encontrada na ${div.conciliacoes_maquininha.maquininhas.nome}`,
            maquininha_id: div.conciliacoes_maquininha.maquininha_id,
            maquininha_nome: div.conciliacoes_maquininha.maquininhas.nome,
            periodo: div.conciliacoes_maquininha.periodo,
            valor_divergencia: div.diferenca,
            prioridade: 'critica',
            data_criacao: new Date(div.data),
            lida: false
          });
        });
      }

      // 2. Conciliações pendentes há mais de 3 dias
      const tresDiasAtras = new Date();
      tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);

      const { data: conciliacoesPendentes } = await supabase
        .from('processamentos_extrato')
        .select(`
          *,
          maquininhas!inner(nome)
        `)
        .eq('status', 'processando')
        .lt('created_at', tresDiasAtras.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (conciliacoesPendentes) {
        conciliacoesPendentes.forEach((proc: any) => {
          novasNotificacoes.push({
            id: `pend-${proc.id}`,
            tipo: 'conciliacao_pendente',
            titulo: 'Conciliação Pendente',
            mensagem: `Processamento da ${proc.maquininhas.nome} está pendente há mais de 3 dias`,
            maquininha_id: proc.maquininha_id,
            maquininha_nome: proc.maquininhas.nome,
            periodo: proc.periodo,
            prioridade: 'alta',
            data_criacao: new Date(proc.created_at),
            lida: false
          });
        });
      }

      // 3. Erros de processamento
      const { data: errosProcessamento } = await supabase
        .from('processamentos_extrato')
        .select(`
          *,
          maquininhas!inner(nome)
        `)
        .eq('status', 'erro')
        .order('created_at', { ascending: false })
        .limit(5);

      if (errosProcessamento) {
        errosProcessamento.forEach((erro: any) => {
          novasNotificacoes.push({
            id: `erro-${erro.id}`,
            tipo: 'erro_processamento',
            titulo: 'Erro no Processamento',
            mensagem: `Falha ao processar arquivos da ${erro.maquininhas.nome}`,
            maquininha_id: erro.maquininha_id,
            maquininha_nome: erro.maquininhas.nome,
            periodo: erro.periodo,
            prioridade: 'media',
            data_criacao: new Date(erro.created_at),
            lida: false
          });
        });
      }

      // 4. Oportunidades de matching (vendas não conciliadas > 24h)
      const ontemData = new Date();
      ontemData.setDate(ontemData.getDate() - 1);

      const { data: vendasPendentes } = await supabase
        .from('vendas_maquininha')
        .select(`
          maquininha_id,
          maquininhas!inner(nome),
          periodo_processamento
        `)
        .eq('status', 'pendente')
        .lt('created_at', ontemData.toISOString())
        .limit(5);

      if (vendasPendentes) {
        // Agrupar por maquininha
        const agrupadas = vendasPendentes.reduce((acc: any, venda: any) => {
          const key = `${venda.maquininha_id}-${venda.periodo_processamento}`;
          if (!acc[key]) {
            acc[key] = {
              maquininha_id: venda.maquininha_id,
              maquininha_nome: venda.maquininhas.nome,
              periodo: venda.periodo_processamento,
              quantidade: 0
            };
          }
          acc[key].quantidade++;
          return acc;
        }, {});

        Object.values(agrupadas).forEach((grupo: any) => {
          novasNotificacoes.push({
            id: `match-${grupo.maquininha_id}-${grupo.periodo}`,
            tipo: 'matching_disponivel',
            titulo: 'Matching Disponível',
            mensagem: `${grupo.quantidade} vendas pendentes podem ser conciliadas na ${grupo.maquininha_nome}`,
            maquininha_id: grupo.maquininha_id,
            maquininha_nome: grupo.maquininha_nome,
            periodo: grupo.periodo,
            prioridade: 'baixa',
            data_criacao: new Date(),
            lida: false
          });
        });
      }

      // Ordenar por prioridade e data
      const prioridadeOrdem = { critica: 4, alta: 3, media: 2, baixa: 1 };
      novasNotificacoes.sort((a, b) => {
        if (prioridadeOrdem[a.prioridade] !== prioridadeOrdem[b.prioridade]) {
          return prioridadeOrdem[b.prioridade] - prioridadeOrdem[a.prioridade];
        }
        return new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime();
      });

      setNotificacoes(novasNotificacoes);

      // Toast para notificações críticas
      const criticas = novasNotificacoes.filter(n => n.prioridade === 'critica');
      if (criticas.length > 0) {
        criticas.forEach(critica => {
          toast({
            title: critica.titulo,
            description: critica.mensagem,
            variant: "destructive",
            duration: 10000
          });
        });
      }

    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar notificações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarComoLida = useCallback((id: string) => {
    setNotificacoes(prev => 
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
  }, []);

  const marcarTodasComoLidas = useCallback(() => {
    setNotificacoes(prev => 
      prev.map(n => ({ ...n, lida: true }))
    );
  }, []);

  const recarregarNotificacoes = useCallback(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    carregarNotificacoes();
    
    const interval = setInterval(() => {
      carregarNotificacoes();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [carregarNotificacoes]);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return {
    notificacoes,
    naoLidas,
    loading,
    marcarComoLida,
    marcarTodasComoLidas,
    recarregarNotificacoes
  };
}