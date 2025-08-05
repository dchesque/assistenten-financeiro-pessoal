import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContasReceber } from '@/hooks/useContasReceber';
import { formatarMoeda } from '@/utils/formatters';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { DollarSign, TrendingUp, Calendar, Clock, Plus, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContasReceber() {
  const navigate = useNavigate();
  const { contas, loading, marcarComoRecebido, obterEstatisticas } = useContasReceber();
  const estatisticas = obterEstatisticas();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recebido': return 'default';
      case 'vencido': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'recebido': return 'Recebido';
      case 'vencido': return 'Vencido';
      default: return 'Pendente';
    }
  };

  return (
    <>
      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/contas-receber', [
          { label: 'Início', href: '/dashboard' },
          { label: 'Contas a Receber' }
        ])}
        title="Contas a Receber"
        subtitle="Gerencie suas receitas e entradas financeiras • Controle de recebimentos"
        icon={<DollarSign className="h-8 w-8" />}
        actions={
          <Button 
            onClick={() => navigate('/nova-entrada')}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Entrada
          </Button>
        }
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatarMoeda(estatisticas.valor_pendente)}</div>
              <p className="text-xs text-muted-foreground">{estatisticas.pendentes} contas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Já Recebido</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatarMoeda(estatisticas.valor_recebido)}</div>
              <p className="text-xs text-muted-foreground">{estatisticas.recebidas} contas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencimento Próximo</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatarMoeda(estatisticas.valor_vencimento_proximo)}</div>
              <p className="text-xs text-muted-foreground">{estatisticas.vencimento_proximo} contas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatarMoeda(estatisticas.total_valor)}</div>
              <p className="text-xs text-muted-foreground">{estatisticas.total_contas} contas</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <Tabs defaultValue="todas" className="space-y-4">
            <div className="flex justify-between items-center p-6 pb-0">
              <TabsList className="bg-white/50 backdrop-blur-sm">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                <TabsTrigger value="recebidas">Recebidas</TabsTrigger>
                <TabsTrigger value="vencidas">Vencidas</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="todas" className="space-y-4 p-6">
              <div className="grid gap-4">
                {contas.map((conta) => (
                  <Card key={conta.id} className="bg-white/60 backdrop-blur-sm border border-white/30 hover:shadow-lg hover:bg-white/80 transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{conta.descricao}</p>
                          <p className="text-sm text-muted-foreground">
                            {conta.pagador?.nome} • Vencimento: {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge style={{ backgroundColor: conta.categoria?.cor, color: 'white' }}>
                              {conta.categoria?.nome}
                            </Badge>
                            {conta.recorrente && (
                              <Badge variant="outline">Recorrente</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-2xl font-bold text-green-600">{formatarMoeda(conta.valor)}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(conta.status)}>
                              {getStatusLabel(conta.status)}
                            </Badge>
                            {conta.status === 'pendente' && (
                              <Button 
                                size="sm" 
                                onClick={() => marcarComoRecebido(conta.id)}
                                className="btn-gradient"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Receber
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pendentes" className="space-y-4 p-6">
              <div className="grid gap-4">
                {contas.filter(c => c.status === 'pendente').map((conta) => (
                  <Card key={conta.id} className="bg-white/60 backdrop-blur-sm border border-orange-200/50 hover:shadow-lg hover:bg-white/80 transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{conta.descricao}</p>
                          <p className="text-sm text-muted-foreground">
                            {conta.pagador?.nome} • Vencimento: {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-2xl font-bold text-green-600">{formatarMoeda(conta.valor)}</p>
                          <Button 
                            size="sm" 
                            onClick={() => marcarComoRecebido(conta.id)}
                            className="btn-gradient"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Marcar como Recebido
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recebidas" className="space-y-4 p-6">
              <div className="grid gap-4">
                {contas.filter(c => c.status === 'recebido').map((conta) => (
                  <Card key={conta.id} className="bg-white/60 backdrop-blur-sm border border-green-200/50 hover:shadow-lg hover:bg-white/80 transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{conta.descricao}</p>
                          <p className="text-sm text-muted-foreground">
                            {conta.pagador?.nome} • Recebido em: {conta.data_recebimento ? new Date(conta.data_recebimento).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{formatarMoeda(conta.valor)}</p>
                          <Badge variant="default">Recebido</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="vencidas" className="space-y-4 p-6">
              <div className="grid gap-4">
                {contas.filter(c => c.status === 'vencido').map((conta) => (
                  <Card key={conta.id} className="bg-white/60 backdrop-blur-sm border border-red-200/50 hover:shadow-lg hover:bg-white/80 transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{conta.descricao}</p>
                          <p className="text-sm text-red-600">
                            {conta.pagador?.nome} • Venceu em: {new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-2xl font-bold text-red-600">{formatarMoeda(conta.valor)}</p>
                          <Button 
                            size="sm" 
                            onClick={() => marcarComoRecebido(conta.id)}
                            className="btn-gradient"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Receber Agora
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}