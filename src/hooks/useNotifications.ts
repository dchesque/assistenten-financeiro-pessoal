import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationsService } from '@/services/notificationsService';
import { Notification, NotificationFilters, NotificationStats } from '@/types/notification';
import { showMessage } from '@/utils/messages';
import { toast } from 'sonner';
import { NOTIFICATION_CONFIGS } from '@/types/notification';

export function useNotifications(filters: NotificationFilters = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [notificationsList, count, notificationStats] = await Promise.all([
        NotificationsService.list(filters),
        NotificationsService.getUnreadCount(),
        NotificationsService.getStats()
      ]);

      setNotifications(notificationsList);
      setUnreadCount(count);
      setStats(notificationStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar notificações';
      setError(message);
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await NotificationsService.markAsRead(id);
      
      // Atualizar local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, status: 'read', read_at: new Date().toISOString() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      showMessage.saveSuccess('Notificação marcada como lida');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar como lida';
      showMessage.saveError(message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const updatedCount = await NotificationsService.markAllAsRead();
      
      // Atualizar local
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.map(notification => 
          ['sent', 'pending'].includes(notification.status)
            ? { ...notification, status: 'read', read_at: now }
            : notification
        )
      );
      
      setUnreadCount(0);
      
      showMessage.saveSuccess(`${updatedCount} notificações marcadas como lidas`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar todas como lidas';
      showMessage.saveError(message);
    }
  }, []);

  const dismiss = useCallback(async (id: string) => {
    try {
      await NotificationsService.dismiss(id);
      
      // Atualizar local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, status: 'dismissed' }
            : notification
        )
      );
      
      // Se era não lida, decrementar contador
      const notification = notifications.find(n => n.id === id);
      if (notification && ['sent', 'pending'].includes(notification.status)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      showMessage.saveSuccess('Notificação dispensada');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao dispensar notificação';
      showMessage.saveError(message);
    }
  }, [notifications]);

  const refresh = useCallback(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Configurar realtime para novas notificações
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            
            // Adicionar à lista local
            setNotifications(prev => [newNotification, ...prev]);
            
            // Incrementar contador se não lida
            if (['sent', 'pending'].includes(newNotification.status)) {
              setUnreadCount(prev => prev + 1);
              
              // Mostrar toast
              const config = NOTIFICATION_CONFIGS[newNotification.type];
              const actionRoute = newNotification.data?.route;
              
              toast(newNotification.title, {
                description: newNotification.message,
                icon: config?.icon,
                action: actionRoute ? {
                  label: 'Ver',
                  onClick: () => {
                    if (actionRoute.startsWith('/')) {
                      window.location.href = actionRoute;
                    }
                  }
                } : undefined,
                duration: 6000,
                onDismiss: () => {
                  // Marcar como lida quando dispensar o toast
                  markAsRead(newNotification.id);
                }
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;
            
            // Atualizar na lista local
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === updatedNotification.id 
                  ? updatedNotification 
                  : notification
              )
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, [markAsRead]);

  // Carregar notificações na inicialização
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    stats,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh
  };
}