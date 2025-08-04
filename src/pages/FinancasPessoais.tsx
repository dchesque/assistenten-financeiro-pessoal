import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContasPessoais } from '@/hooks/useContasPessoais';
import { useCredoresPessoais } from '@/hooks/useCredoresPessoais';
import { useCategoriasDespesasPessoais } from '@/hooks/useCategoriasDespesasPessoais';
import { formatCurrency } from '@/utils/formatters';
import { Home, CreditCard, Users, PieChart, Plus } from 'lucide-react';

export default function FinancasPessoais() {
  const { contas, loading: loadingContas, obterEstatisticas } = useContasPessoais();
  const { credores, loading: loadingCredores } = useCredoresPessoais();
  const { categorias, loading: loadingCategorias } = useCategoriasDespesasPessoais();

  const estatisticas = obterEstatisticas();

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 pt-6">
        <PageHeader
          title="Finanças Pessoais"
          description="Gerencie suas despesas pessoais, credores e categorias"
        />

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Contas</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(estatisticas.total_valor)}</div>
              <p className="text-xs text-muted-foreground">{estatisticas.total_contas} contas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(estatisticas.valor_pendente)}</div>
              <p className="text-xs text-muted-foreground">{estatisticas.pendentes} contas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencimento Próximo</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(estatisticas.valor_vencimento_proximo)}</div>
              <p className="text-xs text-muted-foreground">{estatisticas.vencimento_proximo} contas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credores.length}</div>
              <p className="text-xs text-muted-foreground">Cadastrados</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contas">Contas</TabsTrigger>
            <TabsTrigger value="credores">Credores</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
          </TabsList>

          <TabsContent value="contas" className="space-y-4">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium">Contas a Pagar</h3>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </div>
            
            <div className="grid gap-4">
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
                        <p className="font-bold">{formatCurrency(conta.valor)}</p>
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
          </TabsContent>

          <TabsContent value="credores" className="space-y-4">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium">Credores</h3>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Credor
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {credores.map((credor) => (
                <Card key={credor.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="font-medium">{credor.nome}</p>
                      <p className="text-sm text-muted-foreground">{credor.email}</p>
                      <p className="text-sm text-muted-foreground">{credor.telefone}</p>
                      <Badge variant="outline">
                        {credor.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium">Categorias</h3>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {categorias.map((categoria) => (
                <Card key={categoria.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: categoria.cor }}
                      />
                      <div>
                        <p className="font-medium">{categoria.nome}</p>
                        <p className="text-sm text-muted-foreground capitalize">{categoria.grupo}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}