import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { UserPlan, SubscriptionStatus, FeatureLimits, PLAN_CONFIGS } from '@/types/userProfile';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export const useSubscription = () => {
  const { user } = useAuth();
  
  // Estados mockados - em produção viria do perfil do usuário
  const [plan, setPlan] = useState<UserPlan>('trial');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [limits, setLimits] = useState<FeatureLimits>(PLAN_CONFIGS.trial.limits);
  const [trialEndsAt, setTrialEndsAt] = useState<Date>(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const [daysRemaining, setDaysRemaining] = useState<number>(14);
  
  // Carregar dados do usuário
  useEffect(() => {
    if (user?.email) {
      // Mock: determinar plano baseado no email para teste
      if (user.email.includes('admin')) {
        setPlan('premium');
        setLimits(PLAN_CONFIGS.premium.limits);
      } else if (user.email.includes('premium')) {
        setPlan('premium');
        setLimits(PLAN_CONFIGS.premium.limits);
      } else if (user.email.includes('free')) {
        setPlan('free');
        setLimits(PLAN_CONFIGS.free.limits);
      } else {
        setPlan('trial');
        setLimits(PLAN_CONFIGS.trial.limits);
      }
    }
  }, [user]);

  // Calcular dias restantes do trial
  useEffect(() => {
    if (plan === 'trial' && trialEndsAt) {
      const days = differenceInDays(trialEndsAt, new Date());
      setDaysRemaining(Math.max(0, days));
    }
  }, [plan, trialEndsAt]);
  
  // Funções
  const checkLimit = (feature: keyof FeatureLimits, current: number): boolean => {
    if (typeof limits[feature] === 'boolean') {
      return limits[feature] as boolean;
    }
    const limit = limits[feature] as number;
    if (limit === -1) return true; // unlimited
    return current < limit;
  };
  
  const canUseFeature = (feature: keyof FeatureLimits): boolean => {
    if (typeof limits[feature] === 'boolean') {
      return limits[feature] as boolean;
    }
    return true; // Para features numéricas, verificar com checkLimit
  };
  
  const upgradePlan = async () => {
    toast.info("Redirecionando para WhatsApp...", {
      description: "Entre em contato para fazer upgrade"
    });
    // Abrir WhatsApp com mensagem para upgrade
    const message = encodeURIComponent("Olá! Gostaria de fazer upgrade para o plano Premium do JC Financeiro.");
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };
  
  const getRemainingItems = (feature: keyof FeatureLimits, used: number): string => {
    if (typeof limits[feature] === 'boolean') {
      return limits[feature] ? 'Disponível' : 'Indisponível';
    }
    const limit = limits[feature] as number;
    if (limit === -1) return "Ilimitado";
    return `${used}/${limit} utilizados`;
  };

  const getUsagePercentage = (feature: keyof FeatureLimits, used: number): number => {
    if (typeof limits[feature] === 'boolean') {
      return limits[feature] ? 0 : 100;
    }
    const limit = limits[feature] as number;
    if (limit === -1) return 0;
    return Math.min(100, (used / limit) * 100);
  };

  const isFeatureBlocked = (feature: keyof FeatureLimits, used: number = 0): boolean => {
    if (typeof limits[feature] === 'boolean') {
      return !(limits[feature] as boolean);
    }
    const limit = limits[feature] as number;
    if (limit === -1) return false;
    return used >= limit;
  };
  
  return {
    plan,
    status,
    limits,
    daysRemaining,
    trialEndsAt,
    checkLimit,
    canUseFeature,
    upgradePlan,
    getRemainingItems,
    getUsagePercentage,
    isFeatureBlocked,
    isPremium: plan === 'premium',
    isTrial: plan === 'trial',
    isFree: plan === 'free',
    isActive: status === 'active',
    planConfig: PLAN_CONFIGS[plan]
  };
};