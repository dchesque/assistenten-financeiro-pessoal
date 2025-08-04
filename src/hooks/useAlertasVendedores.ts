import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AlertaVendedor {
  vendedor_id: number;
  vendedor_nome: string;
  tipo_alerta: 'meta_critica' | 'performance_baixa' | 'inatividade' | 'meta_atingida' | 'destaque_mes';
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  descricao: string;
  valor_referencia?: number;
  percentual_referencia?: number;
  dias_referencia?: number;
  acao_sugerida: string;
  data_criacao: string;
}

interface EstatisticasAlertas {
  total_alertas: number;
  alertas_criticos: number;
  alertas_altos: number;
  alertas_medios: number;
  alertas_baixos: number;
  vendedores_em_risco: number;
  vendedores_inativos: number;
  vendedores_destaque: number;
}

interface UseAlertasVendedoresReturn {
  alertas: AlertaVendedor[];
  estatisticas: EstatisticasAlertas | null;
  loading: boolean;
  erro: string | null;
  carregarAlertas: () => Promise<void>;
  alertasCriticos: AlertaVendedor[];
  alertasPositivos: AlertaVendedor[];
  marcarComoLido: (alertaIndex: number) => void;
}

export const useAlertasVendedores = (): UseAlertasVendedoresReturn => {
  const [alertas, setAlertas] = useState<AlertaVendedor[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasAlertas | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [alertasLidos, setAlertasLidos] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const carregarAlertas = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      console.log('Carregando alertas de vendedores...');

      // Primeiro verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Tentar chamar a edge function
      const { data, error } = await supabase.functions.invoke('alertas-vendedores', {
        body: {},
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Erro na edge function alertas-vendedores:', error);
        
        // Fallback: gerar alertas básicos localmente
        const alertasBasicos = await gerarAlertasBasicos();
        setAlertas(alertasBasicos.alertas);
        setEstatisticas(alertasBasicos.estatisticas);
        return;
      }

      if (!data) {
        throw new Error('Nenhum dado retornado pela função de alertas');
      }

      setAlertas(data.alertas || []);
      setEstatisticas(data.estatisticas || {
        total_alertas: 0,
        alertas_criticos: 0,
        alertas_altos: 0,
        alertas_medios: 0,
        alertas_baixos: 0,
        vendedores_em_risco: 0,
        vendedores_inativos: 0,
        vendedores_destaque: 0
      });

      // Notificar sobre alertas críticos
      const alertasCriticos = data.alertas?.filter((a: AlertaVendedor) => a.severidade === 'critica') || [];
      if (alertasCriticos.length > 0) {
        toast({
          title: `⚠️ ${alertasCriticos.length} Alerta(s) Crítico(s)`,
          description: 'Alguns vendedores precisam de atenção urgente',
          variant: "destructive",
          duration: 6000
        });
      }

      // Notificar sobre conquistas
      const alertasPositivos = data.alertas?.filter((a: AlertaVendedor) => 
        a.tipo_alerta === 'meta_atingida' || a.tipo_alerta === 'destaque_mes'
      ) || [];
      
      if (alertasPositivos.length > 0) {
        toast({
          title: `🎉 ${alertasPositivos.length} Conquista(s)`,
          description: 'Vendedores atingiram suas metas!',
          duration: 4000
        });
      }

    } catch (error: any) {
      console.error('Erro ao carregar alertas:', error);
      
      // Fallback: gerar alertas básicos localmente em caso de erro
      try {
        const alertasBasicos = await gerarAlertasBasicos();
        setAlertas(alertasBasicos.alertas);
        setEstatisticas(alertasBasicos.estatisticas);
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
        setErro(error.message || 'Erro ao carregar alertas');
        // Definir dados vazios para não quebrar a interface
        setAlertas([]);
        setEstatisticas({
          total_alertas: 0,
          alertas_criticos: 0,
          alertas_altos: 0,
          alertas_medios: 0,
          alertas_baixos: 0,
          vendedores_em_risco: 0,
          vendedores_inativos: 0,
          vendedores_destaque: 0
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Função fallback para gerar alertas básicos localmente
  const gerarAlertasBasicos = useCallback(async () => {
    const { data: vendedores } = await supabase
      .from('vendedores')
      .select('*')
      .eq('ativo', true);

    const alertas: AlertaVendedor[] = [];
    
    // Gerar alertas básicos baseados nos dados dos vendedores
    if (vendedores) {
      for (const vendedor of vendedores) {
        // Alerta se vendedor não tem meta definida
        if (!vendedor.meta_mensal || vendedor.meta_mensal === 0) {
          alertas.push({
            vendedor_id: vendedor.id,
            vendedor_nome: vendedor.nome,
            tipo_alerta: 'performance_baixa',
            severidade: 'media',
            titulo: 'Meta não definida',
            descricao: `${vendedor.nome} não possui meta mensal definida`,
            acao_sugerida: 'Definir meta mensal para acompanhamento',
            data_criacao: new Date().toISOString()
          });
        }

        // Alerta se vendedor está inativo há muito tempo
        if (vendedor.data_ultima_venda) {
          const ultimaVenda = new Date(vendedor.data_ultima_venda);
          const diasSemVenda = Math.floor((Date.now() - ultimaVenda.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diasSemVenda > 30) {
            alertas.push({
              vendedor_id: vendedor.id,
              vendedor_nome: vendedor.nome,
              tipo_alerta: 'inatividade',
              severidade: 'alta',
              titulo: 'Longo período inativo',
              descricao: `${vendedor.nome} não vende há ${diasSemVenda} dias`,
              dias_referencia: diasSemVenda,
              acao_sugerida: 'Verificar situação do vendedor',
              data_criacao: new Date().toISOString()
            });
          }
        }
      }
    }

    const estatisticas = {
      total_alertas: alertas.length,
      alertas_criticos: alertas.filter(a => a.severidade === 'critica').length,
      alertas_altos: alertas.filter(a => a.severidade === 'alta').length,
      alertas_medios: alertas.filter(a => a.severidade === 'media').length,
      alertas_baixos: alertas.filter(a => a.severidade === 'baixa').length,
      vendedores_em_risco: alertas.filter(a => ['meta_critica', 'performance_baixa'].includes(a.tipo_alerta)).length,
      vendedores_inativos: alertas.filter(a => a.tipo_alerta === 'inatividade').length,
      vendedores_destaque: alertas.filter(a => ['meta_atingida', 'destaque_mes'].includes(a.tipo_alerta)).length
    };

    return { alertas, estatisticas };
  }, []);

  // Carregar alertas automaticamente
  useEffect(() => {
    carregarAlertas();
    
    // Configurar reload automático a cada 5 minutos
    const interval = setInterval(carregarAlertas, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [carregarAlertas]);

  // Real-time updates para vendas (que podem gerar novos alertas)
  useEffect(() => {
    console.log('Configurando real-time updates para vendas...');
    
    const channel = supabase
      .channel('vendas-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendas'
        },
        (payload) => {
          console.log('Venda atualizada, recarregando alertas:', payload);
          // Recarregar alertas quando houver mudanças nas vendas
          setTimeout(carregarAlertas, 2000); // Delay para processamento
        }
      )
      .subscribe();

    return () => {
      console.log('Removendo canal real-time');
      supabase.removeChannel(channel);
    };
  }, [carregarAlertas]);

  const marcarComoLido = useCallback((alertaIndex: number) => {
    setAlertasLidos(prev => new Set([...prev, alertaIndex]));
  }, []);

  // Filtros úteis
  const alertasCriticos = alertas.filter(a => a.severidade === 'critica' || a.severidade === 'alta');
  const alertasPositivos = alertas.filter(a => a.tipo_alerta === 'meta_atingida' || a.tipo_alerta === 'destaque_mes');

  return {
    alertas,
    estatisticas,
    loading,
    erro,
    carregarAlertas,
    alertasCriticos,
    alertasPositivos,
    marcarComoLido
  };
};