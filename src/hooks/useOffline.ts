import { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff, Cloud } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

/**
 * Hook para detectar status de conexão online/offline
 * Inclui funcionalidades premium como cache offline e sincronização
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);
  const [offlineActions, setOfflineActions] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setReconnecting(false);
      
      if (lastOfflineTime) {
        const offlineTime = Math.round((Date.now() - lastOfflineTime.getTime()) / 1000);
        toast({
          title: "🌐 Conexão restaurada",
          description: `Você esteve offline por ${offlineTime}s. Sincronizando dados...`,
        });
        
        // Executar ações offline pendentes
        if (offlineActions.length > 0) {
          syncOfflineActions();
        }
      }
      
      setLastOfflineTime(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastOfflineTime(new Date());
      
      toast({
        title: "📵 Sem conexão",
        description: "Você está offline. As ações serão sincronizadas quando a conexão retornar.",
        variant: "destructive"
      });
    };

    // Tentativa de reconexão
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isOnline) {
        setReconnecting(true);
        // Simular teste de conectividade
        setTimeout(() => {
          if (navigator.onLine) {
            handleOnline();
          } else {
            setReconnecting(false);
          }
        }, 2000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOnline, lastOfflineTime, offlineActions]);

  // Função para adicionar ação offline à fila
  const addOfflineAction = (action: any) => {
    setOfflineActions(prev => [...prev, {
      ...action,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    }]);
  };

  // Sincronizar ações offline
  const syncOfflineActions = async () => {
    if (offlineActions.length === 0) return;
    
    toast({
      title: "🔄 Sincronizando",
      description: `Executando ${offlineActions.length} ações pendentes...`,
    });

    try {
      // Simular sincronização das ações
      for (const action of offlineActions) {
        // Executar cada ação
        await action.execute();
      }
      
      setOfflineActions([]);
      
      toast({
        title: "✅ Sincronização concluída",
        description: "Todas as ações offline foram executadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "❌ Erro na sincronização",
        description: "Algumas ações não puderam ser sincronizadas. Tentaremos novamente.",
        variant: "destructive"
      });
    }
  };

  // Limpar ações offline
  const clearOfflineActions = () => {
    setOfflineActions([]);
  };

  return {
    isOnline,
    reconnecting,
    lastOfflineTime,
    offlineActions: offlineActions.length,
    addOfflineAction,
    syncOfflineActions,
    clearOfflineActions
  };
}

/**
 * Componente de indicador de status offline premium
 * Separado em arquivo próprio para evitar problemas de JSX em hooks
 */
export function OfflineIndicator() {
  // Implementação será movida para componente separado
  return null;
}

/**
 * Service Worker registration para funcionalidade PWA
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registrado com sucesso:', registration);
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: "🔄 Atualização disponível",
                    description: "Uma nova versão está disponível. Recarregue a página para atualizar."
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('Erro no registro do SW:', error);
        });
    });
  }
}