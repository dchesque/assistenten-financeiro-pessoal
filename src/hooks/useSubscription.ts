import { useState, useEffect, useCallback } from 'react';
import { SubscriptionService, UserSubscription } from '@/services/subscriptionService';
import { useAuth } from './useAuth';
import { logService } from '@/services/logService';
import { toast } from 'sonner';

export function useSubscription() {
  const { user, profile, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Função para buscar e normalizar assinatura
  const refreshSubscription = useCallback(async (userId?: string) => {
    if (!userId && !user?.id) {
      setLoading(false);
      return null;
    }

    const targetUserId = userId || user!.id;

    try {
      setRefreshing(true);
      
      // Normalizar status primeiro (expira automaticamente se necessário)
      const normalizedSubscription = await SubscriptionService.normalizeStatus(targetUserId);
      
      if (normalizedSubscription) {
        setSubscription(normalizedSubscription);
        return normalizedSubscription;
      }

      // Se não existe assinatura, buscar novamente
      const currentSubscription = await SubscriptionService.getCurrentSubscription();
      setSubscription(currentSubscription);
      
      return currentSubscription;
    } catch (error) {
      logService.logError(error, 'useSubscription.refreshSubscription');
      return null;
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [user?.id]);

  // Função para criar trial automático
  const ensureTrialExists = useCallback(async () => {
    if (!user?.id || !isAuthenticated) return;

    try {
      // Verificar se já existe assinatura
      let currentSubscription = await SubscriptionService.getCurrentSubscription();
      
      if (!currentSubscription) {
        // Criar trial automático
        logService.logInfo('Criando trial automático para novo usuário', { userId: user.id });
        
        currentSubscription = await SubscriptionService.createTrial(user.id);
        
        if (currentSubscription) {
          setSubscription(currentSubscription);
          toast.success('Bem-vindo! Você tem 7 dias grátis para testar todas as funcionalidades.');
        }
      } else {
        // Normalizar status da assinatura existente
        await refreshSubscription(user.id);
      }
    } catch (error) {
      logService.logError(error, 'useSubscription.ensureTrialExists');
    }
  }, [user?.id, isAuthenticated, refreshSubscription]);

  // Carregar assinatura ao fazer login
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      ensureTrialExists();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, ensureTrialExists]);

  // Helpers computados
  const status = subscription?.status || 'expired';
  const trialEndsAt = subscription?.trial_ends_at;
  const subscriptionEndsAt = subscription?.subscription_ends_at;

  const isActive = SubscriptionService.isActiveSubscription(subscription);
  const isTrialActive = status === 'trial' && isActive;
  const isPremiumActive = status === 'active' && isActive;
  const isExpired = status === 'expired' || !isActive;

  const remainingTrialDays = trialEndsAt 
    ? SubscriptionService.calculateRemainingTrialDays(trialEndsAt)
    : 0;

  const remainingSubscriptionDays = subscriptionEndsAt 
    ? SubscriptionService.calculateRemainingSubscriptionDays(subscriptionEndsAt)
    : 0;

  // Ações
  const activateSubscription = async (months: number = 1) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      const activated = await SubscriptionService.activateSubscription(user.id, months);
      
      if (activated) {
        setSubscription(activated);
        toast.success(`Assinatura Premium ativada por ${months} mês(es)!`);
        return true;
      } else {
        toast.error('Erro ao ativar assinatura');
        return false;
      }
    } catch (error) {
      logService.logError(error, 'useSubscription.activateSubscription');
      toast.error('Erro ao ativar assinatura');
      return false;
    }
  };

  const cancelSubscription = async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      const cancelled = await SubscriptionService.cancelSubscription(user.id);
      
      if (cancelled) {
        await refreshSubscription();
        toast.success('Assinatura cancelada com sucesso');
        return true;
      } else {
        toast.error('Erro ao cancelar assinatura');
        return false;
      }
    } catch (error) {
      logService.logError(error, 'useSubscription.cancelSubscription');
      toast.error('Erro ao cancelar assinatura');
      return false;
    }
  };

  // Badge/Status para UI
  const getStatusBadge = () => {
    if (loading) return { text: 'Carregando...', variant: 'default' as const };

    if (isTrialActive) {
      return {
        text: `Trial - ${remainingTrialDays} dias restantes`,
        variant: 'default' as const
      };
    }

    if (isPremiumActive) {
      return {
        text: `Premium - ${remainingSubscriptionDays} dias restantes`,
        variant: 'default' as const
      };
    }

    return {
      text: 'Assinatura Expirada',
      variant: 'destructive' as const
    };
  };

  return {
    // Estados
    subscription,
    loading,
    refreshing,
    
    // Status computados
    status,
    isActive,
    isTrialActive,
    isPremiumActive,
    isExpired,
    
    // Datas e contadores
    trialEndsAt,
    subscriptionEndsAt,
    remainingTrialDays,
    remainingSubscriptionDays,
    
    // Ações
    refreshSubscription,
    activateSubscription,
    cancelSubscription,
    ensureTrialExists,
    
    // UI helpers
    getStatusBadge
  };
}