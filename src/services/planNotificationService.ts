import { UserProfile } from '@/types/userProfile';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export const checkPlanNotifications = (userProfile?: UserProfile | null) => {
  if (!userProfile) return;

  // Verificar trial expirando
  if (userProfile.plan === 'trial' && userProfile.trial_ends_at) {
    const daysLeft = differenceInDays(new Date(userProfile.trial_ends_at), new Date());
    
    if (daysLeft <= 3 && daysLeft > 0) {
      toast.warning(`Seu trial expira em ${daysLeft} dias`, {
        description: 'Considere fazer upgrade para continuar usando todos os recursos',
        action: {
          label: 'Ver planos',
          onClick: () => window.location.href = '/planos'
        },
        duration: 8000
      });
    }
    
    if (daysLeft <= 0) {
      toast.error('Seu trial expirou!', {
        description: 'Faça upgrade para continuar usando todos os recursos',
        action: {
          label: 'Fazer upgrade',
          onClick: () => window.location.href = '/planos'
        },
        duration: 10000
      });
    }
  }
  
  // Verificar limites próximos para plano free
  if (userProfile.plan === 'free') {
    // Mock: calcular uso atual (em produção, viria do backend)
    const mockUsage = calculateMockUsage(userProfile);
    
    Object.entries(mockUsage).forEach(([feature, percentage]) => {
      if (percentage > 80) {
        toast.info(`Você está próximo do limite de ${feature}`, {
          description: `${percentage.toFixed(0)}% do limite utilizado. Considere fazer upgrade.`,
          action: {
            label: 'Ver planos',
            onClick: () => window.location.href = '/planos'
          },
          duration: 6000
        });
      }
    });
  }
};

// Mock function para calcular uso atual
const calculateMockUsage = (userProfile: UserProfile): Record<string, number> => {
  // Em produção, isso viria de consultas reais ao banco
  return {
    contas_pagar: Math.random() * 100,
    fornecedores: Math.random() * 100,
    categorias: Math.random() * 100
  };
};

export const showUpgradePrompt = (feature: string, description?: string) => {
  toast.error(`Recurso ${feature} indisponível`, {
    description: description || 'Este recurso está disponível apenas para planos superiores',
    action: {
      label: 'Fazer upgrade',
      onClick: () => {
        const message = encodeURIComponent(`Olá! Gostaria de fazer upgrade para usar o recurso: ${feature}`);
        window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
      }
    },
    duration: 8000
  });
};

export const showLimitReached = (feature: string, current: number, limit: number) => {
  toast.warning(`Limite atingido: ${feature}`, {
    description: `Você atingiu o limite de ${limit} ${feature}. Atual: ${current}/${limit}`,
    action: {
      label: 'Fazer upgrade',
      onClick: () => window.location.href = '/planos'
    },
    duration: 8000
  });
};