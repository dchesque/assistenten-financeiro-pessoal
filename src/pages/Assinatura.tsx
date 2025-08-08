import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { Calendar, Crown, CreditCard, ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Assinatura() {
  const {
    subscription,
    loading,
    refreshing,
    status,
    isActive,
    isTrialActive,
    isPremiumActive,
    isExpired,
    remainingTrialDays,
    remainingSubscriptionDays,
    trialEndsAt,
    subscriptionEndsAt,
    refreshSubscription,
    activateSubscription,
    cancelSubscription
  } = useSubscription();

  const [activating, setActivating] = useState(false);

  const handleActivateSubscription = async () => {
    setActivating(true);
    try {
      const success = await activateSubscription(1); // 1 mês
      if (success) {
        await refreshSubscription();
      }
    } finally {
      setActivating(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = confirm(
      'Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium.'
    );
    
    if (confirmed) {
      await cancelSubscription();
    }
  };

  const handleRefresh = async () => {
    await refreshSubscription();
    toast.success('Status da assinatura atualizado!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = () => {
    if (isTrialActive) return 'bg-blue-100/80 text-blue-700 border-blue-200';
    if (isPremiumActive) return 'bg-green-100/80 text-green-700 border-green-200';
    return 'bg-red-100/80 text-red-700 border-red-200';
  };

  const getStatusIcon = () => {
    if (isTrialActive) return <Calendar className="w-4 h-4" />;
    if (isPremiumActive) return <Crown className="w-4 h-4" />;
    return <CreditCard className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/assinatura')}
        title="Assinatura"
        subtitle="Gerencie sua assinatura e planos"
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Status Atual */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <span>Status da Assinatura</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </Button>
              </div>
              <Badge className={getStatusColor()}>
                {isTrialActive && 'Trial Ativo'}
                {isPremiumActive && 'Premium Ativo'}
                {isExpired && 'Expirado'}
              </Badge>
            </div>
            <CardDescription>
              Informações sobre seu plano atual e próximas renovações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-muted-foreground">Carregando informações...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status detalhado */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Detalhes do Plano</h3>
                  
                  {isTrialActive && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Plano:</span>
                        <span className="font-medium">Trial Gratuito</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Dias restantes:</span>
                        <span className="font-medium text-blue-600">{remainingTrialDays} dias</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Expira em:</span>
                        <span className="font-medium">{trialEndsAt ? formatDate(trialEndsAt) : 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  {isPremiumActive && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Plano:</span>
                        <span className="font-medium">Premium</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Dias restantes:</span>
                        <span className="font-medium text-green-600">{remainingSubscriptionDays} dias</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Próxima renovação:</span>
                        <span className="font-medium">{subscriptionEndsAt ? formatDate(subscriptionEndsAt) : 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  {isExpired && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className="font-medium text-red-600">Expirado</span>
                      </div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          Sua assinatura expirou. Renove para continuar usando todas as funcionalidades.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recursos do plano */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Recursos Inclusos</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Contas a pagar ilimitadas</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Fornecedores ilimitados</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Relatórios avançados</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Backup automático</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Suporte prioritário</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle>Ações da Assinatura</CardTitle>
            <CardDescription>
              Gerencie sua assinatura, upgrade ou cancele
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ativar Premium */}
              {(isTrialActive || isExpired) && (
                <Button
                  onClick={handleActivateSubscription}
                  disabled={activating}
                  className="btn-primary flex items-center space-x-2 h-auto p-4"
                >
                  <Crown className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">
                      {activating ? 'Ativando...' : 'Assinar Premium'}
                    </p>
                    <p className="text-xs opacity-90">
                      R$ 29,90/mês • Acesso total
                    </p>
                  </div>
                </Button>
              )}

              {/* Cancelar */}
              {isPremiumActive && (
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  className="flex items-center space-x-2 h-auto p-4"
                >
                  <CreditCard className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium">Cancelar Assinatura</p>
                    <p className="text-xs text-muted-foreground">
                      Cancele a renovação automática
                    </p>
                  </div>
                </Button>
              )}

              {/* WhatsApp */}
              <Button
                variant="outline"
                onClick={() => window.open('https://wa.me/5544999999999?text=Olá! Gostaria de informações sobre o plano Premium.', '_blank')}
                className="flex items-center space-x-2 h-auto p-4"
              >
                <ExternalLink className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Falar com Suporte</p>
                  <p className="text-xs text-muted-foreground">
                    WhatsApp para dúvidas
                  </p>
                </div>
              </Button>
            </div>

            {/* Informações adicionais */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Informações Importantes</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• O trial oferece acesso completo por 7 dias</li>
                <li>• A assinatura Premium é de R$ 29,90 por mês</li>
                <li>• Cancele a qualquer momento sem taxa</li>
                <li>• Suporte via WhatsApp incluído</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}