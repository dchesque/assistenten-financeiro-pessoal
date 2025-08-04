import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';

interface SyncIndicatorProps {
  autoSync?: boolean;
  interval?: number; // em segundos
  compact?: boolean;
}

export function SyncIndicator({ autoSync = true, interval = 30, compact = false }: SyncIndicatorProps) {
  const [issyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const { sincronizarSistema } = useCacheInvalidation();

  useEffect(() => {
    if (!autoSync) return;

    const intervalId = setInterval(async () => {
      if (!issyncing) {
        await handleSync();
      }
    }, interval * 1000);

    return () => clearInterval(intervalId);
  }, [autoSync, interval, issyncing]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      await sincronizarSistema();
      setLastSync(new Date());
      setSyncStatus('success');
      
      // Reset status após 3 segundos
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'border-blue-300 bg-blue-50/80';
      case 'success':
        return 'border-green-300 bg-green-50/80';
      case 'error':
        return 'border-red-300 bg-red-50/80';
      default:
        return 'border-gray-300 bg-white/80';
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return 'Sincronizado';
      case 'error':
        return 'Erro na sincronização';
      default:
        return lastSync ? `Última sinc: ${lastSync.toLocaleTimeString()}` : 'Aguardando';
    }
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSync}
        disabled={issyncing}
        className={`${getStatusColor()} backdrop-blur-sm transition-all duration-300 hover:scale-105`}
      >
        {getStatusIcon()}
      </Button>
    );
  }

  return (
    <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl border ${getStatusColor()} backdrop-blur-sm transition-all duration-300`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSync}
        disabled={issyncing}
        className="p-1 h-auto hover:bg-transparent"
      >
        {getStatusIcon()}
      </Button>
      
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-700">
          {getStatusText()}
        </span>
        {autoSync && (
          <span className="text-xs text-gray-500">
            Auto-sync a cada {interval}s
          </span>
        )}
      </div>
    </div>
  );
}