import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Edit, Eye, Trash2 } from 'lucide-react';
import { CategoriaModal } from '@/components/categorias/CategoriaModal';
import { useCategorias } from '@/hooks/useCategorias';
import { LoadingStates } from '@/components/ui/LoadingStates';
import type { Categoria, CriarCategoria, AtualizarCategoria } from '@/types/categoria';
import { obterGrupos } from '@/types/categoria';

export default function CategoriasUnificadas() {
  const { categorias, loading, carregarCategorias, criarCategoria, atualizarCategoria, excluirCategoria, obterEstatisticas } = useCategorias();
  
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'despesa' | 'receita'>('todos');
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);
  const [modoModal, setModoModal] = useState<'criar' | 'editar' | 'visualizar'>('criar');

  const categoriasFiltradas = useMemo(() => {
    return categorias.filter(categoria => {
      const matchBusca = !busca || categoria.nome.toLowerCase().includes(busca.toLowerCase());
      const matchTipo = filtroTipo === 'todos' || categoria.tipo === filtroTipo;
      const matchGrupo = filtroGrupo === 'todos' || categoria.grupo === filtroGrupo;
      return matchBusca && matchTipo && matchGrupo;
    });
  }, [categorias, busca, filtroTipo, filtroGrupo]);

  const estatisticas = obterEstatisticas();

  const abrirModalNova = () => {
    setCategoriaSelecionada(null);
    setModoModal('criar');
    setModalAberto(true);
  };

  const abrirModalEditar = (categoria: Categoria) => {
    setCategoriaSelecionada(categoria);
    setModoModal('editar');
    setModalAberto(true);
  };

  const abrirModalVisualizar = (categoria: Categoria) => {
    setCategoriaSelecionada(categoria);
    setModoModal('visualizar');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setCategoriaSelecionada(null);
  };

  const handleSalvar = async (dados: CriarCategoria | AtualizarCategoria) => {
    if ('id' in dados) {
      return await atualizarCategoria(dados);
    } else {
      return await criarCategoria(dados);
    }
  };

  const handleExcluir = async (categoria: Categoria) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${categoria.nome}"?`)) {
      await excluirCategoria(categoria.id);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 lg:p-8">
          <LoadingStates.CardSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 lg:p-8">
        <PageHeader
          breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Categorias' }
          ]}
          title="Categorias"
          subtitle="Gerencie categorias de despesas e receitas"
          actions={
            <Button onClick={abrirModalNova} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          }
        />

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{estatisticas.total_categorias}</p>
                <p className="text-sm text-muted-foreground">Total de Categorias</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{estatisticas.total_despesas}</p>
                <p className="text-sm text-muted-foreground">Categorias de Despesa</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-base">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{estatisticas.total_receitas}</p>
                <p className="text-sm text-muted-foreground">Categorias de Receita</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar categorias..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 input-base"
            />
          </div>
          <Select value={filtroTipo} onValueChange={(value: any) => setFiltroTipo(value)}>
            <SelectTrigger className="input-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
            <SelectTrigger className="input-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os grupos</SelectItem>
              {filtroTipo !== 'todos' && Object.entries(obterGrupos(filtroTipo)).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriasFiltradas.map((categoria) => (
            <Card key={categoria.id} className="card-base">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: categoria.cor }}
                    >
                      {categoria.icone}
                    </div>
                    <div>
                      <h3 className="font-medium">{categoria.nome}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={categoria.tipo === 'despesa' ? 'destructive' : 'default'}>
                          {categoria.tipo === 'despesa' ? 'Despesa' : 'Receita'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {obterGrupos(categoria.tipo)[categoria.grupo as keyof typeof obterGrupos]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => abrirModalVisualizar(categoria)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => abrirModalEditar(categoria)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleExcluir(categoria)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {categoriasFiltradas.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma categoria encontrada</p>
          </div>
        )}

        <CategoriaModal
          aberto={modalAberto}
          categoria={categoriaSelecionada}
          modo={modoModal}
          onFechar={fecharModal}
          onSalvar={handleSalvar}
        />
      </div>
    </Layout>
  );
}