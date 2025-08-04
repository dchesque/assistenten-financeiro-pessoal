import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResultadoMigracao {
  migradas: number;
  nao_migradas: number;
  detalhes: Array<{
    vendedor_nome: string;
    vendedor_id?: number;
    vendas_migradas?: number;
    vendas_nao_migradas?: number;
    status: 'migrado' | 'nao_encontrado';
  }>;
}

export const useMigracaoVendedores = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoMigracao | null>(null);

  const executarMigracao = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Chamar função SQL de migração
      const { data, error } = await supabase
        .rpc('migrar_vendedor_texto_para_id');

      if (error) {
        console.error('Erro na migração:', error);
        toast.error('Erro ao executar migração');
        return false;
      }

      const resultado = data[0] as ResultadoMigracao;
      setResultado(resultado);

      if (resultado.migradas > 0) {
        toast.success(`Migração concluída! ${resultado.migradas} vendas migradas com sucesso.`);
      } else {
        toast.info('Nenhuma venda precisava ser migrada.');
      }

      return true;
    } catch (error) {
      console.error('Erro na migração:', error);
      toast.error('Erro ao executar migração');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verificarNecessidadeMigracao = useCallback(async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('id', { count: 'exact' })
        .not('vendedor', 'is', null)
        .is('vendedor_id', null);

      if (error) {
        console.error('Erro ao verificar migração:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Erro ao verificar migração:', error);
      return 0;
    }
  }, []);

  const limparResultado = useCallback(() => {
    setResultado(null);
  }, []);

  return {
    loading,
    resultado,
    executarMigracao,
    verificarNecessidadeMigracao,
    limparResultado
  };
};