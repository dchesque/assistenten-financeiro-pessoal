import { supabase } from '@/integrations/supabase/client';
import { logService } from './logService';

export interface UserSubscription {
  id: string;
  user_id: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_ends_at?: string;
  subscription_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export class SubscriptionService {
  
  /**
   * Busca a assinatura do usuário atual
   */
  static async getCurrentSubscription(): Promise<UserSubscription | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      return this.getByUserId(user.id);
    } catch (error) {
      logService.logError(error, 'SubscriptionService.getCurrentSubscription');
      return null;
    }
  }

  /**
   * Busca assinatura por user_id
   */
  static async getByUserId(userId: string): Promise<UserSubscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logService.logError(error, 'SubscriptionService.getByUserId');
        return null;
      }

      return subscription;
    } catch (error) {
      logService.logError(error, 'SubscriptionService.getByUserId');
      return null;
    }
  }

  /**
   * Cria trial automático para novo usuário
   */
  static async createTrial(userId: string): Promise<UserSubscription | null> {
    try {
      // Usar função RPC para criar trial de forma segura
      const { data: subscription, error } = await supabase
        .rpc('create_trial_subscription', {
          p_user_id: userId
        });

      if (error) {
        logService.logError(error, 'SubscriptionService.createTrial');
        return null;
      }

      // Logar criação do trial
      logService.logInfo(`Trial criado para usuário ${userId}`, { 
        subscription_id: subscription?.id,
        trial_ends_at: subscription?.trial_ends_at
      });
      
      return subscription;
    } catch (error) {
      logService.logError(error, 'SubscriptionService.createTrial');
      return null;
    }
  }

  /**
   * Ativa assinatura premium
   */
  static async activateSubscription(userId: string, months: number = 1): Promise<UserSubscription | null> {
    try {
      const subscriptionEndsAt = new Date();
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + months);

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          subscription_ends_at: subscriptionEndsAt.toISOString().split('T')[0], // YYYY-MM-DD
          trial_ends_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logService.logError(error, 'SubscriptionService.activateSubscription');
        return null;
      }

      // Logar ativação
      logService.logInfo(`Assinatura ativada para usuário ${userId}`, { 
        subscription_id: subscription.id,
        months,
        subscription_ends_at: subscription.subscription_ends_at 
      });

      return subscription;
    } catch (error) {
      logService.logError(error, 'SubscriptionService.activateSubscription');
      return null;
    }
  }

  /**
   * Cancela assinatura
   */
  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        logService.logError(error, 'SubscriptionService.cancelSubscription');
        return false;
      }

      // Logar cancelamento
      logService.logInfo(`Assinatura cancelada para usuário ${userId}`);
      
      return true;
    } catch (error) {
      logService.logError(error, 'SubscriptionService.cancelSubscription');
      return false;
    }
  }

  /**
   * Marca assinatura como expirada
   */
  static async expireSubscription(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        logService.logError(error, 'SubscriptionService.expireSubscription');
        return false;
      }

      // Logar expiração
      logService.logInfo(`Assinatura expirada para usuário ${userId}`);
      
      return true;
    } catch (error) {
      logService.logError(error, 'SubscriptionService.expireSubscription');
      return false;
    }
  }

  /**
   * Normaliza status da assinatura (expira se necessário)
   */
  static async normalizeStatus(userId: string): Promise<UserSubscription | null> {
    try {
      // Usar função RPC para normalizar status
      const { data: subscription, error } = await supabase
        .rpc('normalize_subscription_status', {
          p_user_id: userId
        });

      if (error) {
        logService.logError(error, 'SubscriptionService.normalizeStatus');
        return null;
      }

      return subscription;
    } catch (error) {
      logService.logError(error, 'SubscriptionService.normalizeStatus');
      return null;
    }
  }

  /**
   * Calcula dias restantes do trial
   */
  static calculateRemainingTrialDays(trialEndsAt: string): number {
    try {
      const trialEnd = new Date(trialEndsAt);
      const today = new Date();
      const diffTime = trialEnd.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch (error) {
      logService.logError(error, 'SubscriptionService.calculateRemainingTrialDays');
      return 0;
    }
  }

  /**
   * Calcula dias restantes da assinatura ativa
   */
  static calculateRemainingSubscriptionDays(subscriptionEndsAt: string): number {
    try {
      const subscriptionEnd = new Date(subscriptionEndsAt);
      const today = new Date();
      const diffTime = subscriptionEnd.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch (error) {
      logService.logError(error, 'SubscriptionService.calculateRemainingSubscriptionDays');
      return 0;
    }
  }

  /**
   * Verifica se a assinatura está ativa
   */
  static isActiveSubscription(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;

    const today = new Date();
    
    // Trial ativo
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      return trialEnd >= today;
    }
    
    // Assinatura ativa
    if (subscription.status === 'active' && subscription.subscription_ends_at) {
      const subscriptionEnd = new Date(subscription.subscription_ends_at);
      return subscriptionEnd >= today;
    }

    return false;
  }

  /**
   * Busca todas as assinaturas (apenas para admins)
   */
  static async getAllSubscriptions(): Promise<UserSubscription[]> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles:user_id (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        logService.logError(error, 'SubscriptionService.getAllSubscriptions');
        return [];
      }

      return subscriptions || [];
    } catch (error) {
      logService.logError(error, 'SubscriptionService.getAllSubscriptions');
      return [];
    }
  }
}