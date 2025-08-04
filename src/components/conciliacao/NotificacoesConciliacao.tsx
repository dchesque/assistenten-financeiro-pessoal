import React from 'react';
import { Bell, AlertTriangle, Clock, Zap, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificacoesConciliacao, NotificacaoConciliacao } from '@/hooks/useNotificacoesConciliacao';

interface NotificacoesConciliacaoProps {
  onNotificacaoClick?: (notificacao: NotificacaoConciliacao) => void;
}

// Mapeamento de ícones por tipo
const ICONES_POR_TIPO = {
  divergencia_critica: AlertTriangle,
  conciliacao_pendente: Clock,
  erro_processamento: AlertTriangle,
  matching_disponivel: TrendingUp
};

// Mapeamento de cores por prioridade
const CORES_PRIORIDADE = {
  critica: 'bg-red-100 border-red-200 text-red-800 hover:bg-red-50',
  alta: 'bg-orange-100 border-orange-200 text-orange-800 hover:bg-orange-50',
  media: 'bg-yellow-100 border-yellow-200 text-yellow-800 hover:bg-yellow-50',
  baixa: 'bg-blue-100 border-blue-200 text-blue-800 hover:bg-blue-50'
};

const CORES_BADGE_PRIORIDADE = {
  critica: 'bg-red-600 text-white',
  alta: 'bg-orange-600 text-white', 
  media: 'bg-yellow-600 text-white',
  baixa: 'bg-blue-600 text-white'
};

/**
 * Formata uma data em string para tempo relativo
 */
function formatarTempoRelativo(dataString: string | Date): string {
  const data = new Date(dataString);
  const agora = new Date();
  const diferenca = agora.getTime() - data.getTime();
  
  const minutos = Math.floor(diferenca / 60000);
  const horas = Math.floor(diferenca / 3600000);
  const dias = Math.floor(diferenca / 86400000);
  
  if (minutos < 1) return 'Agora';
  if (minutos < 60) return `${minutos}min atrás`;
  if (horas < 24) return `${horas}h atrás`;
  return `${dias}d atrás`;
}

export function NotificacoesConciliacao({ onNotificacaoClick }: NotificacoesConciliacaoProps) {
  const { 
    notificacoes, 
    naoLidas, 
    loading, 
    marcarComoLida,
    marcarTodasComoLidas,
    recarregarNotificacoes 
  } = useNotificacoesConciliacao();

  const handleNotificacaoClick = (notificacao: NotificacaoConciliacao) => {
    if (!notificacao.lida) {
      marcarComoLida(notificacao.id);
    }
    onNotificacaoClick?.(notificacao);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {naoLidas > 99 ? '99+' : naoLidas}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-[80vh] bg-white/95 backdrop-blur-sm border border-white/20"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          <div className="flex items-center gap-2">
            {naoLidas > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={marcarTodasComoLidas}
                className="text-xs h-6 px-2"
              >
                Marcar todas como lidas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={recarregarNotificacoes}
              className="h-6 w-6 p-0"
            >
              <Zap className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-2 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 rounded-full mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notificacoes.map((notificacao) => {
                const IconeComponente = ICONES_POR_TIPO[notificacao.tipo] || Bell;
                const corPrioridade = CORES_PRIORIDADE[notificacao.prioridade];
                const corBadge = CORES_BADGE_PRIORIDADE[notificacao.prioridade];
                
                return (
                  <div
                    key={notificacao.id}
                    onClick={() => handleNotificacaoClick(notificacao)}
                    className={`
                      p-3 border rounded-lg cursor-pointer transition-all duration-200
                      ${corPrioridade}
                      ${!notificacao.lida ? 'border-l-4 border-l-primary' : ''}
                      hover:shadow-md
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <IconeComponente className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight">
                            {notificacao.titulo}
                          </h4>
                          
                          <div className="flex flex-col items-end gap-1">
                            <Badge 
                              className={`text-xs px-1.5 py-0.5 ${corBadge}`}
                            >
                              {notificacao.prioridade}
                            </Badge>
                            <span className="text-xs opacity-70">
                              {formatarTempoRelativo(notificacao.data_criacao)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm mt-1 leading-relaxed">
                          {notificacao.mensagem}
                        </p>
                        
                        {(notificacao.maquininha_nome || notificacao.periodo) && (
                          <div className="flex items-center gap-2 mt-2 text-xs opacity-80">
                            {notificacao.maquininha_nome && (
                              <span className="bg-white/20 px-2 py-1 rounded">
                                {notificacao.maquininha_nome}
                              </span>
                            )}
                            {notificacao.periodo && (
                              <span className="bg-white/20 px-2 py-1 rounded">
                                {notificacao.periodo}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {notificacao.valor_divergencia && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">
                              Divergência: R$ {notificacao.valor_divergencia.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}