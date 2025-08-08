import { useState, useEffect } from 'react';

interface SystemStatus {
  isOnline: boolean;
  isDemoMode: boolean;
  lastSync: string | null;
  appVersion: string;
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    isOnline: navigator.onLine,
    isDemoMode: true, // Como estamos usando mock data
    lastSync: localStorage.getItem('lastSync'),
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0'
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      updateLastSync();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateLastSync = () => {
    const now = new Date().toLocaleString('pt-BR');
    localStorage.setItem('lastSync', now);
    setStatus(prev => ({ ...prev, lastSync: now }));
  };

  const toggleDemoMode = () => {
    setStatus(prev => ({ ...prev, isDemoMode: !prev.isDemoMode }));
  };

  return {
    ...status,
    updateLastSync,
    toggleDemoMode
  };
}