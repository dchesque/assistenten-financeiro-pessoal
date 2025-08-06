import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePagadores } from '@/hooks/usePagadores';
import { formatarMoeda } from '@/utils/formatters';
import { Users, Building2, User, Phone, Mail, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Pagadores() {
  const { pagadores, loading, obterEstatisticas } = usePagadores();
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'pessoa_fisica' | 'pessoa_juridica'>('todos');
  const [busca, setBusca] = useState('');
  
  const estatisticas = obterEstatisticas();

  const pagadoresFiltrados = pagadores.filter(pagador => {
    const passaTipo = filtroTipo === 'todos' || pagador.tipo === filtroTipo;
    const passaBusca = !busca || 
      pagador.nome.toLowerCase().includes(busca.toLowerCase()) ||
      pagador.documento.includes(busca) ||
      pagador.email.toLowerCase().includes(busca.toLowerCase());
    
    return passaTipo && passaBusca && pagador.ativo;
  });

  const getTipoLabel = (tipo: string) => {
    return tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica';
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'pessoa_fisica' ? User : Building2;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
        <PageHeader
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Cadastros', href: '#' },
            { label: 'Pagadores' }
          ]}
          title="Pagadores"
          subtitle="Gerencie pessoas e empresas que fazem pagamentos para você"
          icon={<Users className="h-8 w-8 text-blue-600" />}
        />

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pagadores</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estatisticas.total_pagadores}</div>
              <p className="text-xs text-muted-foreground">Cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pessoas Físicas</CardTitle>
              <User className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estatisticas.pessoas_fisicas}</div>
              <p className="text-xs text-muted-foreground">CPF</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pessoas Jurídicas</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{estatisticas.pessoas_juridicas}</div>
              <p className="text-xs text-muted-foreground">CNPJ</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estatisticas.ativos}</div>
              <p className="text-xs text-muted-foreground">Em atividade</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, documento ou email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
          
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pagador
          </Button>
        </div>

        <Tabs value={filtroTipo} onValueChange={(value) => setFiltroTipo(value as any)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pessoa_fisica">Pessoas Físicas</TabsTrigger>
            <TabsTrigger value="pessoa_juridica">Pessoas Jurídicas</TabsTrigger>
          </TabsList>

          <TabsContent value={filtroTipo} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pagadoresFiltrados.map((pagador) => {
                const TipoIcon = getTipoIcon(pagador.tipo);
                
                return (
                  <Card key={pagador.id} className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <TipoIcon className="h-4 w-4 text-blue-600" />
                              <h3 className="font-medium">{pagador.nome}</h3>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getTipoLabel(pagador.tipo)}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Documento:</span>
                            <span>{pagador.documento}</span>
                          </div>
                          
                          {pagador.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{pagador.email}</span>
                            </div>
                          )}
                          
                          {pagador.telefone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{pagador.telefone}</span>
                            </div>
                          )}
                          
                          {pagador.endereco && (
                            <div className="text-xs">
                              <span className="font-medium">Endereço:</span>
                              <p className="mt-1 text-muted-foreground">{pagador.endereco}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {pagadoresFiltrados.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">
                  {busca ? 'Nenhum pagador encontrado' : 'Nenhum pagador cadastrado'}
                </h3>
                <p className="text-gray-400 mb-4">
                  {busca 
                    ? 'Tente refinar sua busca ou limpar os filtros' 
                    : 'Cadastre pessoas e empresas que fazem pagamentos para você'
                  }
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Pagador
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}