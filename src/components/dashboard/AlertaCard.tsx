import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Target, Info } from 'lucide-react';
import { AlertaDashboard } from '@/hooks/useDashboardExecutivo';

interface AlertaCardProps {
  alerta: AlertaDashboard;
  onAcao?: () => void;
}

export function AlertaCard({ alerta, onAcao }: AlertaCardProps) {
  const getIcone = () => {
    switch (alerta.icone) {
      case 'AlertTriangle': return <AlertTriangle className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      case 'Target': return <Target className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getEstilo = () => {
    switch (alerta.tipo) {
      case 'critico':
        return {
          container: 'border-l-4 border-red-500 bg-red-50/80',
          icone: 'text-red-600 bg-red-100',
          titulo: 'text-red-900',
          botao: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'oportunidade':
        return {
          container: 'border-l-4 border-green-500 bg-green-50/80',
          icone: 'text-green-600 bg-green-100',
          titulo: 'text-green-900',
          botao: 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'info':
        return {
          container: 'border-l-4 border-blue-500 bg-blue-50/80',
          icone: 'text-blue-600 bg-blue-100',
          titulo: 'text-blue-900',
          botao: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
    }
  };

  const estilo = getEstilo();

  return (
    <Card className={`bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${estilo.container}`}>
      <CardContent className="p-4">
        {/* Header com ícone */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg ${estilo.icone}`}>
            {getIcone()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm ${estilo.titulo} mb-1`}>
              {alerta.titulo}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {alerta.descricao}
            </p>
          </div>
        </div>

        {/* Valor destacado */}
        {alerta.valor && (
          <div className="mb-3">
            <span className="text-lg font-bold text-gray-900">
              R$ {alerta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Botão de ação */}
        <Button 
          size="sm" 
          onClick={onAcao}
          className={`w-full text-xs font-medium transition-all duration-200 ${estilo.botao}`}
        >
          {alerta.acao}
        </Button>
      </CardContent>
    </Card>
  );
}