import { Clock, Crown, AlertTriangle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

interface SubscriptionStatusProps {
  expanded: boolean;
  mobile?: boolean;
}

export function SubscriptionStatus({ expanded, mobile = false }: SubscriptionStatusProps) {
  const navigate = useNavigate();
  const { subscriptionData, loading } = useSubscriptionStatus();

  if (loading) {
    return (
      <div className={`${expanded || mobile ? 'px-4 py-2' : 'px-2 py-2'}`}>
        <div className={`w-full flex items-center ${expanded || mobile ? 'gap-3 p-3' : 'justify-center p-2'} rounded-lg bg-gray-800/30 animate-pulse`}>
          <div className="w-4 h-4 bg-gray-600 rounded"></div>
          {(expanded || mobile) && <div className="h-4 bg-gray-600 rounded flex-1"></div>}
        </div>
      </div>
    );
  }

  const getStatusConfig = () => {
    if (subscriptionData.role === 'admin' || subscriptionData.status === 'admin') {
      return {
        status: 'admin',
        icon: Shield,
        label: 'Administrador',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30'
      };
    }

    switch (subscriptionData.status) {
      case 'trial':
        return {
          status: 'trial',
          icon: Clock,
          label: `Trial - ${subscriptionData.trialDaysLeft} dias restantes`,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30'
        };
      case 'premium':
        return {
          status: 'premium',
          icon: Crown,
          label: `Premium - até ${subscriptionData.premiumExpiresAt ? new Date(subscriptionData.premiumExpiresAt).toLocaleDateString('pt-BR') : 'Data inválida'}`,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30'
        };
      case 'inactive':
      default:
        return {
          status: 'inactive',
          icon: AlertTriangle,
          label: 'Inativo',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30'
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const handleStatusClick = () => {
    if (config.status === 'inactive') {
      navigate('/assinatura');
    } else if (config.status === 'admin') {
      navigate('/administrador');
    } else {
      navigate('/assinatura');
    }
  };

  if (!expanded && !mobile) {
    return (
      <div className="px-2 py-2">
        <button
          onClick={handleStatusClick}
          className={`w-full flex items-center justify-center p-2 rounded-lg border transition-all duration-200 hover:scale-105 ${config.bgColor} ${config.borderColor} hover:bg-opacity-20 group relative`}
        >
          <IconComponent className={`w-4 h-4 ${config.color}`} />
          
          {/* Tooltip para modo colapsado */}
          <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-gray-700 shadow-xl">
            {config.label}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <button
        onClick={handleStatusClick}
        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${config.bgColor} ${config.borderColor} hover:bg-opacity-20`}
      >
        <IconComponent className={`w-4 h-4 ${config.color} flex-shrink-0`} />
        <div className="flex-1 text-left">
          <span className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </span>
          {config.status === 'inactive' && (
            <p className="text-xs text-gray-400 mt-1">
              Clique para gerenciar
            </p>
          )}
        </div>
      </button>
    </div>
  );
}