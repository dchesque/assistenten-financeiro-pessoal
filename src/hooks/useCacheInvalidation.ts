import { useCallback } from 'react';
import { cache, DomainCache } from '@/services/cacheService';
import { performanceService } from '@/services/PerformanceService';
import { useToast } from '@/hooks/use-toast';

export function useCacheInvalidation() {
  const { toast } = useToast();

  // Invalidar cache após operações CRUD
  const invalidarAposCRUD = useCallback((entidade: string, operacao: 'criar' | 'atualizar' | 'excluir') => {
    try {
      // Invalidar cache da entidade específica
      DomainCache.invalidateAfterOperation(operacao, entidade);
      
      // Invalidar cache do performance service também
      performanceService.invalidarCache(entidade);
      
      // Log da operação
      console.log(`Cache invalidado: ${operacao} em ${entidade}`);
      
      // Toast de sucesso para operações importantes
      if (operacao === 'criar') {
        toast({
          title: "Dados atualizados",
          description: "As informações foram sincronizadas automaticamente.",
        });
      }
    } catch (error) {
      console.error('Erro ao invalidar cache:', error);
    }
  }, [toast]);

  // Refresh automático de dados específicos
  const atualizarDados = useCallback(async (entidade: string) => {
    try {
      switch (entidade) {
        case 'fornecedores':
          await performanceService.obterFornecedoresAtivos();
          break;
        case 'clientes':
          await performanceService.obterClientesAtivos();
          break;
        case 'plano_contas':
          await performanceService.obterPlanoContasLancamento();
          break;
        case 'dashboard':
          await performanceService.obterEstatisticasRapidas();
          break;
      }
    } catch (error) {
      console.error(`Erro ao atualizar dados de ${entidade}:`, error);
    }
  }, []);

  // Sync completo do sistema
  const sincronizarSistema = useCallback(async () => {
    try {
      toast({
        title: "Sincronizando dados...",
        description: "Atualizando informações do sistema.",
      });

      // Limpar todo o cache
      cache.clear();
      performanceService.invalidarCache();
      
      // Pré-carregar dados críticos
      await performanceService.preCarregarDadosCriticos();
      
      toast({
        title: "Sincronização concluída",
        description: "Todos os dados foram atualizados com sucesso.",
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível atualizar alguns dados. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    invalidarAposCRUD,
    atualizarDados,
    sincronizarSistema
  };
}