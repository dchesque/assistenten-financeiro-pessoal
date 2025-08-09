import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, CheckCheck, X, Filter, Search, Calendar } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationFilters, NOTIFICATION_CONFIGS } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Notificacoes() {
  const [filters, setFilters] = useState<NotificationFilters>({
    limit: 25,
    offset: 0
  });
  
  const { 
    notifications, 
    unreadCount, 
    stats, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    dismiss,
    refresh 
  } = useNotifications(filters);
  
  const navigate = useNavigate();

  const handleFilterChange = (key: keyof NotificationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleNotificationClick = (notification: any) => {
    if (['sent', 'pending'].includes(notification.status)) {
      markAsRead(notification.id);
    }
    
    // Navegar para a rota se existir
    const route = notification.data?.route;
    if (route) {
      navigate(route);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'success': return 'default';
      default: return 'secondary';
    }
  };

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Notificações</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refresh}>
            Atualizar
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
                <div className="text-sm text-muted-foreground">Não lidas</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.bySeverity.error || 0}
                </div>
                <div className="text-sm text-muted-foreground">Críticas</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status || ''} 
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="sent">Enviadas</SelectItem>
                  <SelectItem value="read">Lidas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="dismissed">Dispensadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={filters.type || ''} 
                onValueChange={(value) => handleFilterChange('type', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="bill_due_soon">Conta vencendo</SelectItem>
                  <SelectItem value="bill_overdue">Conta vencida</SelectItem>
                  <SelectItem value="trial_expiring">Trial expirando</SelectItem>
                  <SelectItem value="payment_failed">Falha pagamento</SelectItem>
                  <SelectItem value="info">Informação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severidade</Label>
              <Select 
                value={filters.severity || ''} 
                onValueChange={(value) => handleFilterChange('severity', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Limpar filtros</Label>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ limit: 25, offset: 0 })}
                className="w-full"
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            {notifications.length} notificações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton lines={5} height="h-20" type="list" />
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma notificação encontrada
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const config = NOTIFICATION_CONFIGS[notification.type];
                const isUnread = ['sent', 'pending'].includes(notification.status);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      getSeverityColor(notification.severity)
                    } ${isUnread ? 'border-l-4 border-l-primary' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl">
                          {config?.icon || '📬'}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {notification.title}
                            </h3>
                            {isUnread && (
                              <Badge variant="secondary" className="text-xs">
                                Nova
                              </Badge>
                            )}
                            <Badge variant={getSeverityBadgeVariant(notification.severity)} className="text-xs">
                              {notification.severity}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                            <span className="capitalize">
                              {notification.type.replace('_', ' ')}
                            </span>
                            <span className="capitalize">
                              {notification.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {isUnread && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            title="Marcar como lida"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(notification.id);
                          }}
                          title="Dispensar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}