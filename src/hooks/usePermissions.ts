import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';

export const usePermissions = () => {
  const { profile, isAdmin } = useAuth();
  const { checkLimit, canUseFeature, upgradePlan } = useSubscription();

  const permissions = {
    // Admin tem acesso total
    isAdmin,

    // Permissões por feature
    canCreateConta: (currentCount: number = 0) => {
      if (isAdmin) return true;
      return checkLimit('contas_pagar', currentCount);
    },

    canCreateFornecedor: (currentCount: number = 0) => {
      if (isAdmin) return true;
      return checkLimit('fornecedores', currentCount);
    },

    canExport: () => {
      if (isAdmin) return true;
      return canUseFeature('exportacao');
    },

    canBackup: () => {
      if (isAdmin) return true;
      return canUseFeature('backup');
    },

    canViewReports: () => {
      if (isAdmin) return true;
      return canUseFeature('relatorios');
    },

    canDeleteBulk: () => {
      return isAdmin;
    },

    canManageUsers: () => {
      return isAdmin;
    },

    // Helpers para UI
    getPermissionError: (feature: string) => {
      return `Recurso disponível apenas no plano Premium. Faça upgrade para usar ${feature}.`;
    },

    promptUpgrade: (feature: string) => {
      upgradePlan();
    }
  };

  return permissions;
};