import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, CheckCircle, Star, Calendar, Zap, Home } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

export default function Assinatura() {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({ subscribed: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Simulação de verificação de assinatura
      // Em produção, aqui faria a chamada para supabase.functions.invoke('check-subscription')
      setTimeout(() => {
        setSubscriptionStatus({ subscribed: false });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      toast({ title: 'Erro', description: 'Erro ao verificar status da assinatura', variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;

    try {
      setActionLoading(true);
      // Simulação de criação de checkout
      // Em produção, aqui faria a chamada para supabase.functions.invoke('create-checkout')
      setTimeout(() => {
        toast({ title: 'Sucesso', description: 'Funcionalidade de pagamento será integrada com Stripe em produção' });
        setActionLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      toast({ title: 'Erro', description: 'Erro ao processar pagamento', variant: 'destructive' });
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      setActionLoading(true);
      // Simulação de abertura do portal do cliente
      // Em produção, aqui faria a chamada para supabase.functions.invoke('customer-portal')
      setTimeout(() => {
        toast({ title: 'Sucesso', description: 'Portal de gerenciamento será integrado com Stripe em produção' });
        setActionLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao abrir portal do cliente:', error);
      toast({ title: 'Erro', description: 'Erro ao abrir portal de gerenciamento', variant: 'destructive' });
      setActionLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[
          { label: 'Início', href: '/dashboard', icon: <Home className="w-4 h-4" /> },
          { label: 'Assinatura' }
        ]}
        title="Minha Assinatura"
        subtitle="Gerencie sua assinatura e acesse recursos premium"
        icon={<CreditCard className="w-7 h-7 text-primary" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Atual */}
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <span>Status da Assinatura</span>
            </CardTitle>
            <CardDescription>
              Informações sobre sua assinatura atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <Badge variant={subscriptionStatus.subscribed ? "default" : "secondary"}>
                {subscriptionStatus.subscribed ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            
            {subscriptionStatus.subscribed && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Plano:</span>
                  <span className="font-medium">Premium</span>
                </div>
                
                {subscriptionStatus.subscription_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Renovação:</span>
                    <span className="font-medium">{formatDate(subscriptionStatus.subscription_end)}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={checkSubscription}
              variant="outline" 
              size="sm"
              className="w-full"
              disabled={loading}
            >
              Atualizar Status
            </Button>
          </CardFooter>
        </Card>

        {/* Plano Premium */}
        <Card className="card-base border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-primary" />
              <span>Plano Premium</span>
            </CardTitle>
            <CardDescription>
              Acesso completo a todos os recursos do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-primary">
              R$ 29,90<span className="text-lg font-normal text-muted-foreground">/mês</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Contas a pagar ilimitadas</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Contas a receber ilimitadas</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Relatórios avançados</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Integração bancária (OFX)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Suporte prioritário</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            {subscriptionStatus.subscribed ? (
              <Button 
                onClick={handleManageSubscription}
                className="w-full btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Carregando...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Gerenciar Assinatura
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleSubscribe}
                className="w-full btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Assinar Agora
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card className="card-base mt-8">
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ul className="space-y-2">
            <li>• A assinatura é renovada automaticamente todo mês</li>
            <li>• Você pode cancelar a qualquer momento sem multa</li>
            <li>• O cancelamento será efetivo no final do período atual</li>
            <li>• Todos os dados são mantidos mesmo após o cancelamento</li>
            <li>• Pagamentos processados com segurança via Stripe</li>
          </ul>
        </CardContent>
      </Card>
    </PageContainer>
  );
}