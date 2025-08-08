export type UserRole = 'admin' | 'user';

export type UserPlan = 'trial' | 'free' | 'premium';

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired';

export interface FeatureLimits {
  contas_pagar: number; // -1 for unlimited
  fornecedores: number;
  categorias: number;
  relatorios: boolean;
  exportacao: boolean;
  backup: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  phone: string;
  name?: string;
  email?: string;
  role: UserRole;
  plan: UserPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  features_limit: FeatureLimits;
  created_at: string;
  updated_at: string;
  ativo: boolean;
}

export interface PlanFeatures {
  trial: {
    duration_days: number;
    limits: FeatureLimits;
  };
  free: {
    limits: FeatureLimits;
  };
  premium: {
    price_monthly: number;
    limits: FeatureLimits;
  };
}

export const PLAN_FEATURES: PlanFeatures = {
  trial: {
    duration_days: 14,
    limits: {
      contas_pagar: 50,
      fornecedores: 20,
      categorias: 10,
      relatorios: true,
      exportacao: false,
      backup: false
    }
  },
  free: {
    limits: {
      contas_pagar: 10,
      fornecedores: 5,
      categorias: 5,
      relatorios: false,
      exportacao: false,
      backup: false
    }
  },
  premium: {
    price_monthly: 29.90,
    limits: {
      contas_pagar: -1, // unlimited
      fornecedores: -1,
      categorias: -1,
      relatorios: true,
      exportacao: true,
      backup: true
    }
  }
};