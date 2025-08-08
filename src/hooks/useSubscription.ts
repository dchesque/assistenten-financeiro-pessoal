import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { UserPlan, SubscriptionStatus, FeatureLimits, PLAN_FEATURES } from '@/types/userProfile';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export const useSubscription = () => {
  const { profile } = useAuth();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.plan === 'trial' && profile.trial_ends_at) {
      const days = differenceInDays(new Date(profile.trial_ends_at), new Date());
      setDaysRemaining(Math.max(0, days));
    } else {
      setDaysRemaining(null);
    }
  }, [profile]);

  const checkLimit = (feature: keyof FeatureLimits, current: number): boolean => {
    if (!profile) return false;
    
    const limit = profile.features_limit[feature];
    if (typeof limit === 'boolean') return limit;
    if (limit === -1) return true; // unlimited
    return current < limit;
  };

  const canUseFeature = (feature: keyof FeatureLimits): boolean => {
    if (!profile) return false;
    
    const limit = profile.features_limit[feature];
    return typeof limit === 'boolean' ? limit : limit > 0;
  };

  const upgradePlan = () => {
    toast.info("Redirecionando para WhatsApp...");
    const message = encodeURIComponent("Olá! Gostaria de fazer upgrade para o plano Premium do JC Financeiro.");
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  const getRemainingItems = (feature: keyof FeatureLimits, used: number): string => {
    if (!profile) return "0/0";
    
    const limit = profile.features_limit[feature];
    if (typeof limit === 'boolean') return limit ? "Disponível" : "Indisponível";
    if (limit === -1) return "Ilimitado";
    return `${used}/${limit}`;
  };

  const getUsagePercentage = (feature: keyof FeatureLimits, used: number): number => {
    if (!profile) return 0;
    
    const limit = profile.features_limit[feature];
    if (typeof limit === 'boolean' || limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const shouldShowUpgradePrompt = (feature: keyof FeatureLimits, used: number): boolean => {
    if (!profile) return false;
    
    const percentage = getUsagePercentage(feature, used);
    return percentage >= 80 && profile.plan !== 'premium';
  };

  return {
    plan: profile?.plan || 'free',
    status: profile?.subscription_status || 'inactive',
    limits: profile?.features_limit,
    daysRemaining,
    checkLimit,
    canUseFeature,
    upgradePlan,
    getRemainingItems,
    getUsagePercentage,
    shouldShowUpgradePrompt,
    isPremium: profile?.plan === 'premium',
    isActive: profile?.subscription_status === 'active',
    isTrial: profile?.plan === 'trial',
    isFree: profile?.plan === 'free',
    planFeatures: PLAN_FEATURES
  };
};