import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: ReactNode;
  subtitle?: string;
  gradient?: boolean;
  cardType?: 'blue' | 'red' | 'orange' | 'green';
}

export function MetricCard({ title, value, change, icon, subtitle, gradient, cardType }: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const getCardClass = () => {
    if (cardType) {
      return `card-premium p-8 card-${cardType}`;
    }
    return `card-premium p-8 ${gradient ? 'card-gradient' : ''}`;
  };

  const getIconBgClass = () => {
    switch (cardType) {
      case 'blue': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'red': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'orange': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      case 'green': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      default: return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getIconBgClass()}`}>
          <div className="w-5 h-5 flex items-center justify-center">
            {icon}
          </div>
        </div>
        {change !== undefined && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isPositive 
              ? 'bg-green-100/80 text-green-700' 
              : 'bg-red-100/80 text-red-700'
          }`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isPositive ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
      )}
    </div>
  );
}