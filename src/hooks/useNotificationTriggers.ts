import { useEffect } from 'react';
import { NotificationTriggerService } from '@/services/notificationTriggerService';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook que executa verificações de notificações automáticas
 * Deve ser usado uma vez no app (Dashboard ou Layout principal)
 */
export function useNotificationTriggers() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Executar verificações imediatamente
    NotificationTriggerService.runAllChecks();

    // Configurar intervalo para verificações periódicas (a cada 30 minutos)
    const interval = setInterval(() => {
      NotificationTriggerService.runAllChecks();
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearInterval(interval);
  }, [user]);

  // Função para executar verificações manualmente
  const runChecks = () => {
    NotificationTriggerService.runAllChecks();
  };

  return { runChecks };
}