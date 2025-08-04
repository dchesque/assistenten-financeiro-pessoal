import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  Trophy, 
  Star, 
  Bell,
  X,
  RefreshCw,
  Filter,
  Eye,
  CheckCircle
} from 'lucide-react';
import { useAlertasVendedores } from '@/hooks/useAlertasVendedores';
import { formatarMoeda } from '@/utils/formatters';

export const AlertasInteligentesWidget: React.FC = () => {
  const { 
    alertas, 
    estatisticas, 
    loading, 
    carregarAlertas,
    alertasCriticos,
    alertasPositivos,
    marcarComoLido
  } = useAlertasVendedores();

  const [filtroSeveridade, setFiltroSeveridade] = useState<string>('todos');
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  const getIconeAlerta = (tipo: string, severidade: string) => {
    switch (tipo) {
      case 'meta_critica':
      case 'performance_baixa':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'inatividade':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'meta_atingida':
        return <Trophy className="h-5 w-5 text-green-600" />;
      case 'destaque_mes':
        return <Star className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const getCorSeveridade = (severidade: string) => {
    switch (severidade) {
      case 'critica': return 'from-red-500 to-red-600';
      case 'alta': return 'from-orange-500 to-orange-600';
      case 'media': return 'from-yellow-500 to-yellow-600';
      case 'baixa': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const alertasFiltrados = alertas.filter(alerta => {
    if (filtroSeveridade === 'todos') return true;
    return alerta.severidade === filtroSeveridade;
  });

  const alertasPrioritarios = alertas
    .filter(a => a.severidade === 'critica' || a.severidade === 'alta')
    .slice(0, 3);

  if (loading && alertas.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-48"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Alertas Inteligentes
          </CardTitle>
          <div className="flex items-center gap-2">
            {estatisticas && (
              <Badge 
                variant="outline" 
                className={
                  estatisticas.alertas_criticos > 0 
                    ? 'bg-red-50 text-red-700 border-red-200' 
                    : 'bg-green-50 text-green-700 border-green-200'
                }
              >
                {estatisticas.total_alertas} alertas
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={carregarAlertas}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo Rápido */}
        {estatisticas && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {estatisticas.vendedores_em_risco}
              </div>
              <div className="text-xs text-gray-600">Em Risco</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {estatisticas.vendedores_inativos}
              </div>
              <div className="text-xs text-gray-600">Inativos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {estatisticas.vendedores_destaque}
              </div>
              <div className="text-xs text-gray-600">Destaque</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <div className="flex gap-1">
            {['todos', 'critica', 'alta', 'media', 'baixa'].map(severidade => (
              <Button
                key={severidade}
                variant={filtroSeveridade === severidade ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroSeveridade(severidade)}
                className="h-7 px-2 text-xs"
              >
                {severidade === 'todos' ? 'Todos' : severidade}
              </Button>
            ))}
          </div>
        </div>

        {/* Lista de Alertas Prioritários */}
        <div className="space-y-3">
          {alertasPrioritarios.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Nenhum alerta crítico!</p>
              <p className="text-xs text-gray-400">Todos os vendedores estão bem</p>
            </div>
          ) : (
            alertasPrioritarios.map((alerta, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl bg-gradient-to-r ${getCorSeveridade(alerta.severidade)} text-white`}
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 rounded-lg p-2">
                    {getIconeAlerta(alerta.tipo_alerta, alerta.severidade)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm">{alerta.titulo}</h4>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {alerta.severidade}
                      </Badge>
                    </div>
                    <p className="text-sm opacity-90 mb-2">{alerta.descricao}</p>
                    <p className="text-xs opacity-75 mb-2">💡 {alerta.acao_sugerida}</p>
                    
                    {alerta.valor_referencia && (
                      <div className="text-xs opacity-75">
                        Valor: {formatarMoeda(alerta.valor_referencia)}
                        {alerta.percentual_referencia && ` (${alerta.percentual_referencia.toFixed(1)}%)`}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => marcarComoLido(index)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botão Ver Todos */}
        {alertas.length > 3 && (
          <div className="pt-2 border-t border-gray-200">
            <Button 
              variant="outline" 
              className="w-full group"
              onClick={() => setMostrarDetalhes(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Todos os Alertas ({alertas.length})
            </Button>
          </div>
        )}

        {/* Alertas Positivos */}
        {alertasPositivos.length > 0 && (
          <div className="pt-2 border-t border-green-200">
            <div className="text-sm font-medium text-green-700 mb-2">
              🎉 Conquistas Recentes
            </div>
            <div className="space-y-2">
              {alertasPositivos.slice(0, 2).map((alerta, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                  <Trophy className="h-4 w-4 text-green-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-green-800">{alerta.vendedor_nome}</p>
                    <p className="text-xs text-green-600">{alerta.titulo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};