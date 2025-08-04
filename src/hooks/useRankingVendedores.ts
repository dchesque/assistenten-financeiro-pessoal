import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RankingVendedor } from '@/types/vendedor';

interface UseRankingVendedoresReturn {
  ranking: RankingVendedor[];
  loading: boolean;
  erro: string | null;
  periodo: string;
  alterarPeriodo: (novoPeriodo: string) => void;
  recarregar: () => Promise<void>;
}

export const useRankingVendedores = (): UseRankingVendedoresReturn => {
  const [ranking, setRanking] = useState<RankingVendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('mes_atual');
  const { toast } = useToast();

  const buscarRanking = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Tentar usar a função melhorada primeiro, depois a original
      let data, error;
      
      try {
        const result = await supabase
          .rpc('obter_ranking_vendedores_melhorado', {
            p_periodo: periodo,
            p_user_id: userData.user.id
          });
        data = result.data;
        error = result.error;
      } catch (err) {
        // Fallback para função original
        console.warn('Usando função original de ranking:', err);
        const result = await supabase
          .rpc('obter_ranking_vendedores', {
            p_periodo: periodo,
            p_user_id: userData.user.id
          });
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Validar e filtrar dados de ranking
      const rankingValido = (data || []).filter(item => 
        item.vendedor_id && item.vendedor_nome && item.codigo_vendedor
      );

      setRanking(rankingValido);
    } catch (error: any) {
      console.error('Erro ao buscar ranking:', error);
      setErro(error.message);
      toast({
        title: "Erro ao carregar ranking",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [periodo, toast]);

  const alterarPeriodo = (novoPeriodo: string) => {
    setPeriodo(novoPeriodo);
  };

  const recarregar = async () => {
    await buscarRanking();
  };

  useEffect(() => {
    buscarRanking();
  }, [buscarRanking]);

  return {
    ranking,
    loading,
    erro,
    periodo,
    alterarPeriodo,
    recarregar
  };
};