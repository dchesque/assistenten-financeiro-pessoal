import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategoriasReceitas } from '@/hooks/useCategoriasReceitas';
import { GRUPOS_RECEITA } from '@/types/categoriaReceita';
import { BarChart3, DollarSign, TrendingUp, Briefcase, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CategoriasReceitas() {
  const { categorias, loading, obterEstatisticas } = useCategoriasReceitas();
  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  
  const estatisticas = obterEstatisticas();

  const categoriasFiltradas = categorias.filter(categoria => {
    const passaGrupo = filtroGrupo === 'todos' || categoria.grupo === filtroGrupo;
    const passaBusca = !busca || 
      categoria.nome.toLowerCase().includes(busca.toLowerCase());
    
    return passaGrupo && passaBusca;
  });

  const getGrupoColor = (grupo: string) => {
    switch (grupo) {
      case 'trabalho': return 'text-green-600 bg-green-50 border-green-200';
      case 'investimentos': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'outros': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGrupoIcon = (grupo: string) => {
    switch (grupo) {
      case 'trabalho': return Briefcase;
      case 'investimentos': return TrendingUp;
      case 'outros': return BarChart3;
      default: return DollarSign;
    }
  };

  const categoriasPorGrupo = categoriasFiltradas.reduce((acc, categoria) => {
    if (!acc[categoria.grupo]) {
      acc[categoria.grupo] = [];
    }
    acc[categoria.grupo].push(categoria);
    return acc;
  }, {} as Record<string, typeof categorias>);

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 pt-6">
        <PageHeader
          breadcrumb={[
            { label: 'Dashboard', href: '/' },
            { label: 'Cadastros', href: '#' },
            { label: 'Categorias de Receitas' }
          ]}
          title="Categorias de Receitas"
          subtitle="Organize suas fontes de renda e tipos de receitas"
          icon={<BarChart3 className="h-8 w-8 text-green-600" />}
        />

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estatisticas.total_categorias}</div>
              <p className="text-xs text-muted-foreground">Tipos de receita</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trabalho</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{estatisticas.por_grupo['trabalho'] || 0}</div>
              <p className="text-xs text-muted-foreground">Renda do trabalho</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{estatisticas.por_grupo['investimentos'] || 0}</div>
              <p className="text-xs text-muted-foreground">Renda passiva</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outras Receitas</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{estatisticas.por_grupo['outros'] || 0}</div>
              <p className="text-xs text-muted-foreground">Receitas diversas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar categorias..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
          
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        <Tabs value={filtroGrupo} onValueChange={setFiltroGrupo} className="space-y-4">
          <TabsList>
            <TabsTrigger value="todos">Todas</TabsTrigger>
            <TabsTrigger value="trabalho">Trabalho</TabsTrigger>
            <TabsTrigger value="investimentos">Investimentos</TabsTrigger>
            <TabsTrigger value="outros">Outros</TabsTrigger>
          </TabsList>

          <TabsContent value={filtroGrupo} className="space-y-6">
            {filtroGrupo === 'todos' ? (
              // Visualização agrupada
              Object.entries(categoriasPorGrupo).map(([grupo, categoriasDoGrupo]) => {
                const GrupoIcon = getGrupoIcon(grupo);
                
                return (
                  <div key={grupo} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <GrupoIcon className="h-5 w-5 text-gray-600" />
                      <h3 className="text-lg font-semibold capitalize">
                        {GRUPOS_RECEITA[grupo as keyof typeof GRUPOS_RECEITA] || grupo}
                      </h3>
                      <Badge variant="outline">
                        {categoriasDoGrupo.length} categoria{categoriasDoGrupo.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {categoriasDoGrupo.map((categoria) => (
                        <Card key={categoria.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: categoria.cor }}
                                />
                                <div>
                                  <p className="font-medium text-sm">{categoria.nome}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {GRUPOS_RECEITA[categoria.grupo as keyof typeof GRUPOS_RECEITA]}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                Editar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              // Visualização filtrada por grupo
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoriasFiltradas.map((categoria) => (
                  <Card key={categoria.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: categoria.cor }}
                          />
                          <div>
                            <h3 className="font-medium">{categoria.nome}</h3>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getGrupoColor(categoria.grupo)}`}
                            >
                              {GRUPOS_RECEITA[categoria.grupo as keyof typeof GRUPOS_RECEITA]}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {categoriasFiltradas.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">
                  {busca ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
                </h3>
                <p className="text-gray-400 mb-4">
                  {busca 
                    ? 'Tente refinar sua busca ou limpar os filtros' 
                    : 'Crie categorias para organizar suas fontes de renda'
                  }
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Categoria
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}