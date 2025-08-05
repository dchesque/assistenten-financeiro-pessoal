import { useState, useMemo } from 'react';
import { Search, Plus, Tag, Grid3x3, List, Eye, Edit, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCategoriasDespesasPessoais } from '@/hooks/useCategoriasDespesasPessoais';
import { CategoriaDespesa, FiltrosCategoria, GRUPOS_CATEGORIA } from '@/types/categoriaDespesa';
import { CategoriaModal } from '@/components/categorias/CategoriaModal';
import * as LucideIcons from 'lucide-react';

export default function Categorias() {
  const { toast } = useToast();
  
  // Hook para categorias pessoais
  const {
    categorias,
    loading,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria
  } = useCategoriasDespesasPessoais();

  // Estados principais
  const [filtros, setFiltros] = useState<FiltrosCategoria>({
    busca: '',
    grupo: '',
    ativo: true
  });
  
  // Visualização
  const [visualizacao, setVisualizacao] = useState<'cards' | 'linhas'>('cards');
  
  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<CategoriaDespesa | null>(null);
  const [modoModal, setModoModal] = useState<'criar' | 'editar' | 'visualizar'>('criar');

  // Filtrar categorias
  const categoriasFiltradas = useMemo(() => {
    return categorias.filter(categoria => {
      const matchBusca = !filtros.busca || 
                        categoria.nome.toLowerCase().includes(filtros.busca.toLowerCase());
      const matchGrupo = !filtros.grupo || categoria.grupo === filtros.grupo;
      const matchAtivo = filtros.ativo === undefined || categoria.ativo === filtros.ativo;
      
      return matchBusca && matchGrupo && matchAtivo;
    });
  }, [categorias, filtros]);

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    const total = categorias.length;
    const ativas = categorias.filter(c => c.ativo).length;
    const porGrupo = Object.entries(GRUPOS_CATEGORIA).map(([key, label]) => ({
      grupo: key,
      label,
      count: categorias.filter(c => c.grupo === key).length
    }));
    
    return { total, ativas, porGrupo };
  }, [categorias]);

  // Funções do modal
  const abrirModalNova = () => {
    setCategoriaSelecionada(null);
    setModoModal('criar');
    setModalAberto(true);
  };

  const abrirModalEditar = (categoria: CategoriaDespesa) => {
    setCategoriaSelecionada(categoria);
    setModoModal('editar');
    setModalAberto(true);
  };

  const abrirModalVisualizar = (categoria: CategoriaDespesa) => {
    setCategoriaSelecionada(categoria);
    setModoModal('visualizar');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setCategoriaSelecionada(null);
  };

  // Salvar categoria
  const salvarCategoria = async (categoria: Omit<CategoriaDespesa, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (modoModal === 'criar') {
        await criarCategoria(categoria);
        toast({
          title: "Sucesso!",
          description: "Categoria criada com sucesso!"
        });
      } else if (categoriaSelecionada) {
        await atualizarCategoria(categoriaSelecionada.id, categoria);
        toast({
          title: "Sucesso!",
          description: "Categoria atualizada com sucesso!"
        });
      }
      fecharModal();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar categoria",
        variant: "destructive"
      });
    }
  };

  // Toggle status
  const toggleStatus = async (id: number) => {
    try {
      const categoria = categorias.find(c => c.id === id);
      if (categoria) {
        await atualizarCategoria(id, { ativo: !categoria.ativo });
        toast({
          title: "Status atualizado!",
          description: `Categoria ${categoria.ativo ? 'desativada' : 'ativada'} com sucesso!`
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    }
  };

  // Excluir categoria
  const handleExcluir = async (id: number) => {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return;

    const confirmar = window.confirm(`Tem certeza que deseja excluir a categoria "${categoria.nome}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmar) return;

    try {
      await excluirCategoria(id);
      toast({
        title: "Categoria excluída",
        description: "Categoria excluída com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 space-y-4 p-4 pt-6">
          <PageHeader
            breadcrumb={createBreadcrumb('/categorias')}
            title="Categorias de Despesas"
            subtitle="Carregando categorias..."
            icon={<Tag className="h-8 w-8 text-primary" />}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200" />
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
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

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 pt-6">
        <PageHeader
          breadcrumb={createBreadcrumb('/categorias')}
          title="Categorias de Despesas"
          subtitle="Organize suas despesas pessoais por categorias"
          icon={<Tag className="h-8 w-8 text-primary" />}
          actions={
            <Button onClick={abrirModalNova}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          }
        />

        {/* Card de filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar categorias..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="pl-10"
                />
              </div>
              
              <select
                value={filtros.grupo || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, grupo: e.target.value }))}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os grupos</option>
                {Object.entries(GRUPOS_CATEGORIA).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setVisualizacao('cards')}
                  className={`p-2 rounded-lg transition-colors ${
                    visualizacao === 'cards' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setVisualizacao('linhas')}
                  className={`p-2 rounded-lg transition-colors ${
                    visualizacao === 'linhas' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo baseado na visualização */}
        {categoriasFiltradas.length > 0 ? (
          visualizacao === 'cards' ? (
            <div className="grid gap-4 md:grid-cols-3">
              {categoriasFiltradas.map(categoria => {
                const IconComponent = (LucideIcons as any)[categoria.icone] || Tag;
                return (
                  <Card key={categoria.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: categoria.cor }}
                          >
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{categoria.nome}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {GRUPOS_CATEGORIA[categoria.grupo as keyof typeof GRUPOS_CATEGORIA]}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalVisualizar(categoria)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalEditar(categoria)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExcluir(categoria.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Vista em tabela
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Categoria</th>
                        <th className="text-left py-2">Grupo</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriasFiltradas.map(categoria => {
                        const IconComponent = (LucideIcons as any)[categoria.icone] || Tag;
                        return (
                          <tr key={categoria.id} className="border-b hover:bg-gray-50">
                            <td className="py-3">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-6 h-6 rounded flex items-center justify-center"
                                  style={{ backgroundColor: categoria.cor }}
                                >
                                  <IconComponent className="w-3 h-3 text-white" />
                                </div>
                                <span className="font-medium">{categoria.nome}</span>
                              </div>
                            </td>
                            <td className="py-3 text-sm text-muted-foreground">
                              {GRUPOS_CATEGORIA[categoria.grupo as keyof typeof GRUPOS_CATEGORIA]}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                categoria.ativo 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {categoria.ativo ? 'Ativa' : 'Inativa'}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => abrirModalVisualizar(categoria)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => abrirModalEditar(categoria)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleExcluir(categoria.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Tag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma categoria encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filtros.busca || filtros.grupo ? 'Tente ajustar os filtros' : 'Comece criando sua primeira categoria'}
                </p>
                {!filtros.busca && !filtros.grupo && (
                  <div className="mt-6">
                    <Button onClick={abrirModalNova}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Categoria
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal */}
        <CategoriaModal
          isOpen={modalAberto}
          onClose={fecharModal}
          categoria={categoriaSelecionada}
          modo={modoModal}
          onSave={salvarCategoria}
        />
      </div>
    </Layout>
  );
}