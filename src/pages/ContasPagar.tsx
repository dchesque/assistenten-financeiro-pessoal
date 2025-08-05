import { useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContasPessoais } from '@/hooks/useContasPessoais';
import { formatarMoeda } from '@/utils/formatters';

export default function ContasPagar() {
  const { contas, loading, obterEstatisticas } = useContasPessoais();
  const estatisticas = obterEstatisticas();

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 space-y-4 p-4 pt-6">
          <PageHeader
            breadcrumb={createBreadcrumb('/contas-pagar')}
            title="Contas a Pagar"
            subtitle="Carregando contas..."
            icon={<CreditCard className="h-8 w-8 text-primary" />}
          />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-8 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 pt-6">
        <PageHeader
          breadcrumb={createBreadcrumb('/contas-pagar')}
          title="Contas a Pagar"
          subtitle="Gerencie suas contas pessoais"
          icon={<CreditCard className="h-8 w-8 text-primary" />}
          actions={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          }
        />

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatarMoeda(estatisticas.valor_pendente)}</div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatarMoeda(estatisticas.valor_vencido)}</div>
              <p className="text-sm text-muted-foreground">Vencidas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatarMoeda(estatisticas.valor_pago)}</div>
              <p className="text-sm text-muted-foreground">Pagas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatarMoeda(estatisticas.total_valor)}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Contas */}
        <div className="space-y-4">
          {contas.map((conta) => (
            <Card key={conta.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{conta.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {new Date(conta.data_vencimento).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatarMoeda(conta.valor)}</p>
                    <Badge variant={
                      conta.status === 'paga' ? 'default' : 
                      conta.status === 'vencida' ? 'destructive' : 'secondary'
                    }>
                      {conta.status === 'paga' ? 'Paga' : 
                       conta.status === 'vencida' ? 'Vencida' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}