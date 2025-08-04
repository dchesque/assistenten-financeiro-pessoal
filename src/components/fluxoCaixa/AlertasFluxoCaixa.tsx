import { AlertaFluxo, ALERTA_TIPO_COLORS, ALERTA_TIPO_ICONS } from '@/types/fluxoCaixa';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ChevronRight,
  Lightbulb,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertasFluxoCaixaProps {
  alertas: AlertaFluxo[];
  loading?: boolean;
  onResolverAlerta?: (alertaId: string) => void;
  onIgnorarAlerta?: (alertaId: string) => void;
}

export function AlertasFluxoCaixa({ 
  alertas, 
  loading = false, 
  onResolverAlerta,
  onIgnorarAlerta 
}: AlertasFluxoCaixaProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border border-white/20 animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Filtrar apenas alertas ativos
  const alertasAtivos = alertas.filter(alerta => alerta.status === 'ativo');

  if (alertasAtivos.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header da Seção */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Alertas Inteligentes</h3>
            <p className="text-sm text-gray-500">Monitoramento automático de riscos e oportunidades</p>
          </div>
        </div>
        
        {/* Estado Vazio */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100/80 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Tudo em ordem!</h4>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Não há alertas críticos no momento. Seu fluxo de caixa está sob controle e as projeções indicam estabilidade financeira.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPrioridadeIcon = (prioridade: AlertaFluxo['prioridade']) => {
    switch (prioridade) {
      case 'alta':
        return <AlertTriangle className="w-4 h-4" />;
      case 'media':
        return <AlertTriangle className="w-4 h-4" />;
      case 'baixa':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getPrioridadeColor = (prioridade: AlertaFluxo['prioridade']) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100/80 text-red-700 border-red-200/50';
      case 'media':
        return 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50';
      case 'baixa':
        return 'bg-blue-100/80 text-blue-700 border-blue-200/50';
      default:
        return 'bg-gray-100/80 text-gray-700 border-gray-200/50';
    }
  };

  // Agrupar alertas por prioridade
  const alertasPorPrioridade = {
    alta: alertasAtivos.filter(a => a.prioridade === 'alta'),
    media: alertasAtivos.filter(a => a.prioridade === 'media'),
    baixa: alertasAtivos.filter(a => a.prioridade === 'baixa')
  };

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Alertas Inteligentes</h3>
            <p className="text-sm text-gray-500">
              {alertasAtivos.length} alerta{alertasAtivos.length > 1 ? 's' : ''} requer{alertasAtivos.length === 1 ? '' : 'em'} atenção
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {Object.entries(alertasPorPrioridade).map(([prioridade, alertas]) => 
            alertas.length > 0 && (
              <Badge 
                key={prioridade}
                variant="secondary" 
                className={`${getPrioridadeColor(prioridade as any)} text-xs font-medium px-2 py-1`}
              >
                {prioridade.charAt(0).toUpperCase() + prioridade.slice(1)}: {alertas.length}
              </Badge>
            )
          )}
        </div>
      </div>
      
      {/* Grade de Alertas - Layout Otimizado */}
      <TooltipProvider delayDuration={300}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {alertasAtivos.map((alerta) => (
            <Card 
              key={alerta.id}
              className={`bg-white/80 backdrop-blur-sm border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${ALERTA_TIPO_COLORS[alerta.tipo]}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Ícone do Tipo */}
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${getPrioridadeColor(alerta.prioridade)}`}>
                      {ALERTA_TIPO_ICONS[alerta.tipo]}
                    </div>
                  </div>
                  
                  {/* Conteúdo Compacto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate text-sm">
                        {alerta.titulo}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={`${getPrioridadeColor(alerta.prioridade)} text-xs px-1 py-0.5 flex-shrink-0`}
                      >
                        {alerta.prioridade}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {alerta.descricao}
                    </p>
                    
                    {alerta.valor_impacto && (
                      <p className="text-lg font-bold text-gray-900 mb-2">
                        {alerta.valor_impacto.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </p>
                    )}
                    
                    {alerta.data_prevista && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>{format(alerta.data_prevista, 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    )}
                    
                    {/* Ações Compactas com Tooltip */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {onResolverAlerta && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onResolverAlerta(alerta.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 h-6 w-6 p-0"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                        {onIgnorarAlerta && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onIgnorarAlerta(alerta.id)}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Tooltip para Ações Sugeridas */}
                      {alerta.acoes_sugeridas && alerta.acoes_sugeridas.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/50 rounded-full transition-all duration-200 hover:scale-105"
                              aria-label={`Ver ${alerta.acoes_sugeridas.length} ações sugeridas para: ${alerta.titulo}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <Lightbulb className="w-3 h-3 text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">
                                  {alerta.acoes_sugeridas.length} {alerta.acoes_sugeridas.length === 1 ? 'dica' : 'dicas'}
                                </span>
                              </div>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top"
                            align="end"
                            className="max-w-sm p-4 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl rounded-xl"
                            sideOffset={8}
                            alignOffset={-10}
                          >
                            <div className="space-y-3">
                              {/* Header do tooltip */}
                              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <Lightbulb className="w-4 h-4 text-blue-600" />
                                <p className="font-semibold text-gray-900 text-sm">Ações Sugeridas</p>
                              </div>
                              
                              {/* Lista de ações */}
                              <ul className="space-y-2">
                                {alerta.acoes_sugeridas.map((acao, index) => (
                                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2.5">
                                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="leading-relaxed">{acao}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              {/* Footer opcional */}
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-500 italic">Dicas para otimizar seu fluxo de caixa</p>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}