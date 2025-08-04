import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { VendaNotificationService, type NotificacaoVenda } from '@/services/VendaNotificationService';
import { formatarMoeda } from '@/utils/formatters';

interface NotificacoesVendasProps {
  className?: string;
}

export function NotificacoesVendas({ className = '' }: NotificacoesVendasProps) {
  const [notificacoes, setNotificacoes] = useState<NotificacaoVenda[]>([]);
  const [expanded, setExpanded] = useState(false);
  const notificationService = VendaNotificationService.getInstance();

  useEffect(() => {
    // Carregar notificações iniciais
    setNotificacoes(notificationService.obterNotificacoes());

    // Listener para mudanças
    const unsubscribe = notificationService.addListener((novasNotificacoes) => {
      setNotificacoes(novasNotificacoes);
    });

    return unsubscribe;
  }, []);

  const getIconByType = (tipo: NotificacaoVenda['tipo']) => {
    switch (tipo) {
      case 'sucesso':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'erro':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'aviso':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getColorByType = (tipo: NotificacaoVenda['tipo']) => {
    switch (tipo) {
      case 'sucesso':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'erro':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'aviso':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatarTempo = (timestamp: Date) => {
    const agora = new Date();
    const diferenca = agora.getTime() - timestamp.getTime();
    const minutos = Math.floor(diferenca / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) return `${dias}d atrás`;
    if (horas > 0) return `${horas}h atrás`;
    if (minutos > 0) return `${minutos}m atrás`;
    return 'Agora';
  };

  const notificacoesRecentes = notificacoes.slice(0, expanded ? 10 : 5);
  const naoLidas = notificacoes.filter(n => {
    const agora = new Date();
    const diferenca = agora.getTime() - n.timestamp.getTime();
    return diferenca < 3600000; // Últimas 1 hora
  }).length;

  return (
    <Card className={`bg-white/80 backdrop-blur-sm border border-white/20 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>Notificações de Vendas</span>
            {naoLidas > 0 && (
              <Badge variant="destructive" className="ml-2">
                {naoLidas}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs"
            >
              {expanded ? 'Mostrar menos' : 'Ver todas'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => notificationService.limparNotificacoes()}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {notificacoesRecentes.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Nenhuma notificação recente</p>
          </div>
        ) : (
          notificacoesRecentes.map((notificacao) => (
            <div 
              key={notificacao.id} 
              className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${getColorByType(notificacao.tipo)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIconByType(notificacao.tipo)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium truncate">
                      {notificacao.titulo}
                    </h4>
                    <span className="text-xs opacity-70 ml-2 flex-shrink-0">
                      {formatarTempo(notificacao.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm opacity-80 leading-relaxed">
                    {notificacao.mensagem}
                  </p>
                  
                  {notificacao.acao && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={notificacao.acao.callback}
                      className="mt-2 text-xs h-6 px-2"
                    >
                      {notificacao.acao.label}
                    </Button>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => notificationService.removerNotificacao(notificacao.id)}
                  className="flex-shrink-0 h-6 w-6 p-0 opacity-60 hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
        
        {notificacoes.length > 5 && !expanded && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(true)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Ver mais {notificacoes.length - 5} notificações
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}