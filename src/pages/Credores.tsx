import { useState, useMemo } from 'react';
import { Search, Plus, Building, Grid3x3, List, Eye, Edit, UserX, UserCheck, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Fornecedor, FiltrosFornecedor } from '@/types/fornecedor';
import { CredorCard } from '@/components/credores/CredorCard';
import { FornecedorModal } from '@/components/fornecedores/FornecedorModal';
import { formatarMoeda } from '@/utils/formatters';
import { useCredores } from '@/hooks/useCredores';
import { useDadosExemplo } from '@/hooks/useDadosExemplo';
import { FornecedorCardSkeletonGrid, FornecedorTableSkeleton, EmptyState, LoadingOverlay } from '@/components/ui/LoadingStates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
export default function Credores() {
  const {
    toast
  } = useToast();

  // Custom hook para operações CRUD
  const {
    credores,
    loading,
    error,
    criarCredor,
    atualizarCredor,
    excluirCredor
  } = useCredores();

  // Hook para integrar dados de exemplo
  const { dadosExemploCarregados } = useDadosExemplo();

  // Estados locais
  const [filtros, setFiltros] = useState<FiltrosFornecedor>({
    busca: '',
    status: 'todos',
    tipo: 'todos',
    tipo_fornecedor: 'todos'
  });

  // Visualização - Padrão lista
  const [visualizacao, setVisualizacao] = useState<'cards' | 'linhas'>('linhas');

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [credorSelecionado, setCredorSelecionado] = useState<Fornecedor | null>(null);
  const [modoModal, setModoModal] = useState<'criar' | 'editar' | 'visualizar'>('criar');

  // Estados de loading específicos
  const [salvandoCredor, setSalvandoCredor] = useState(false);
  const [excluindoCredor, setExcluindoCredor] = useState<number | null>(null);

  // Filtrar credores
  const credoresFiltrados = useMemo(() => {
    return credores.filter(credor => {
      const matchBusca = !filtros.busca || credor.nome.toLowerCase().includes(filtros.busca.toLowerCase()) || credor.documento.includes(filtros.busca) || credor.telefone?.includes(filtros.busca) || credor.email?.toLowerCase().includes(filtros.busca.toLowerCase());
      const matchStatus = filtros.status === 'todos' || filtros.status === 'ativo' && credor.ativo || filtros.status === 'inativo' && !credor.ativo;
      const matchTipo = filtros.tipo === 'todos' || credor.tipo === filtros.tipo;
      const matchTipoFornecedor = filtros.tipo_fornecedor === 'todos' || credor.tipo_fornecedor === filtros.tipo_fornecedor;
      return matchBusca && matchStatus && matchTipo && matchTipoFornecedor;
    });
  }, [credores, filtros]);

  // Funções do modal
  const abrirModalNovo = () => {
    setCredorSelecionado(null);
    setModoModal('criar');
    setModalAberto(true);
  };
  const abrirModalEditar = (credor: Fornecedor) => {
    setCredorSelecionado(credor);
    setModoModal('editar');
    setModalAberto(true);
  };
  const abrirModalVisualizar = (credor: Fornecedor) => {
    setCredorSelecionado(credor);
    setModoModal('visualizar');
    setModalAberto(true);
  };
  const fecharModal = () => {
    setModalAberto(false);
    setCredorSelecionado(null);
  };

  // Salvar credor
  const salvarCredor = async (credor: Fornecedor) => {
    try {
      setSalvandoCredor(true);
      if (modoModal === 'criar') {
        await criarCredor(credor);
        toast({
          title: "Sucesso!",
          description: "Credor criado com sucesso!"
        });
      } else {
        await atualizarCredor(credor.id, credor);
        toast({
          title: "Sucesso!",
          description: "Credor atualizado com sucesso!"
        });
      }
      fecharModal();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar credor",
        variant: "destructive"
      });
    } finally {
      setSalvandoCredor(false);
    }
  };

  // Toggle status
  const toggleStatus = async (id: number) => {
    try {
      const credor = credores.find(f => f.id === id);
      if (!credor) return;
      await atualizarCredor(id, {
        ativo: !credor.ativo
      });
      toast({
        title: "Status atualizado!",
        description: `Credor ${credor.ativo ? 'inativado' : 'ativado'} com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do credor",
        variant: "destructive"
      });
    }
  };

  // Excluir credor com confirmação
  const confirmarExclusao = (credor: Fornecedor) => {
    const confirmar = window.confirm(`Tem certeza que deseja excluir o credor "${credor.nome}"?\n\nEsta ação não pode ser desfeita.`);
    if (confirmar) {
      handleExcluirCredor(credor.id);
    }
  };
  const handleExcluirCredor = async (id: number) => {
    try {
      setExcluindoCredor(id);
      await excluirCredor(id);
      toast({
        title: "Credor excluído",
        description: "Credor excluído com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir credor",
        variant: "destructive"
      });
    } finally {
      setExcluindoCredor(null);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      
      {/* Background abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-green-400/15 to-blue-400/15 rounded-full blur-3xl"></div>
      </div>

      {/* Container principal */}
      <div>
        {/* Page Header */}
        <PageHeader
          breadcrumb={createBreadcrumb('/credores')}
          title="Credores"
          subtitle="Gestão de credores pessoais • Controle de despesas"
          actions={
            <Button onClick={abrirModalNovo} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Credor
            </Button>
          }
        />

        {/* Conteúdo principal */}
        <div className="p-6 space-y-6">
          {/* Card de filtros com toggle reorganizado */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Busca - linha completa em mobile */}
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar por nome, documento, telefone..." value={filtros.busca} onChange={e => setFiltros(prev => ({
                ...prev,
                busca: e.target.value
              }))} className="pl-10 bg-white/80 backdrop-blur-sm border-gray-300/50 focus:ring-2 focus:ring-blue-500" />
              </div>
              
              {/* Filtro Status */}
              <select value={filtros.status} onChange={e => setFiltros(prev => ({
              ...prev,
              status: e.target.value as any
            }))} className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                <option value="todos">Todos os Status</option>
                <option value="ativo">Apenas Ativos</option>
                <option value="inativo">Apenas Inativos</option>
              </select>
              
              {/* Filtro Tipo */}
              <select value={filtros.tipo} onChange={e => setFiltros(prev => ({
              ...prev,
              tipo: e.target.value as any
            }))} className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                <option value="todos">Todos os Tipos</option>
                <option value="pessoa_fisica">Pessoa Física</option>
                <option value="pessoa_juridica">Pessoa Jurídica</option>
              </select>
              
              {/* Toggle de Visualização - integrado nos filtros */}
              <div className="flex justify-end">
                <div className="flex items-center space-x-2 bg-gray-100/80 backdrop-blur-sm rounded-xl p-1">
                  <button onClick={() => setVisualizacao('cards')} className={`p-2 rounded-lg transition-all duration-200 ${visualizacao === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} title="Visualização em Cards">
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setVisualizacao('linhas')} className={`p-2 rounded-lg transition-all duration-200 ${visualizacao === 'linhas' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} title="Visualização em Lista">
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo baseado na visualização */}
          {loading ?
        // Estados de loading
        visualizacao === 'cards' ? <FornecedorCardSkeletonGrid count={6} /> : <FornecedorTableSkeleton /> : error ?
        // Estado de erro
        <EmptyState title="Erro ao carregar credores" description={error} action={<Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Tentar Novamente
                </Button>} /> : credoresFiltrados.length > 0 ?
        // Conteúdo com dados
        <LoadingOverlay loading={!!excluindoCredor}>
              {visualizacao === 'cards' ? <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {credoresFiltrados.map(credor => <CredorCard key={credor.id} credor={credor} onView={abrirModalVisualizar} onEdit={abrirModalEditar} onToggleStatus={toggleStatus} />)}
                </div> : (/* Vista em Linhas/Tabela */
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200/50">
                      <thead className="bg-gray-50/80 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Credor
                          </th>
                          <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Documento
                          </th>
                          <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Contato
                          </th>
                          <th className="hidden xl:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Transações
                          </th>
                          <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Valor Total
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/60 divide-y divide-gray-200/50">
                        {credoresFiltrados.map(credor => <tr key={credor.id} className="hover:bg-white/80 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                                  <Building className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{credor.nome}</div>
                                  <div className="text-sm text-gray-500">{credor.cidade}, {credor.estado}</div>
                                </div>
                              </div>
                            </td>
                            <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${credor.tipo === 'pessoa_juridica' ? 'bg-blue-100/80 text-blue-700' : 'bg-green-100/80 text-green-700'}`}>
                                  {credor.tipo === 'pessoa_juridica' ? 'CNPJ' : 'CPF'}
                                </span>
                                <span>{credor.documento}</span>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>{credor.telefone}</div>
                              <div>{credor.email}</div>
                            </td>
                            <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {credor.totalCompras}
                            </td>
                            <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatarMoeda(credor.valorTotal)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${credor.ativo ? 'bg-green-100/80 text-green-700' : 'bg-red-100/80 text-red-700'}`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${credor.ativo ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                {credor.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button onClick={() => abrirModalVisualizar(credor)} className="text-blue-600 hover:text-blue-900 transition-colors" title="Visualizar" disabled={loading}>
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => abrirModalEditar(credor)} className="text-gray-600 hover:text-gray-900 transition-colors" title="Editar" disabled={loading}>
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => toggleStatus(credor.id)} className={`transition-colors ${credor.ativo ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`} title={credor.ativo ? 'Inativar' : 'Ativar'} disabled={loading}>
                                  {credor.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </button>
                                <button onClick={() => confirmarExclusao(credor)} className="text-red-600 hover:text-red-900 transition-colors" title="Excluir" disabled={loading || excluindoCredor === credor.id}>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>
                </div>)}
            </LoadingOverlay> :
        // Estado vazio
        <EmptyState icon={<Building className="w-16 h-16 text-gray-400" />} title="Nenhum credor encontrado" description={filtros.busca || filtros.status !== 'todos' || filtros.tipo !== 'todos' ? 'Tente ajustar os filtros de busca' : 'Comece criando seu primeiro credor'} action={!filtros.busca && filtros.status === 'todos' && filtros.tipo === 'todos' && filtros.tipo_fornecedor === 'todos' && <Button onClick={abrirModalNovo} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Credor
                  </Button>} />}
        </div>
      </div>

      {/* Modal */}
      <FornecedorModal isOpen={modalAberto} onClose={fecharModal} fornecedor={credorSelecionado} modo={modoModal} onSave={salvarCredor} loading={salvandoCredor} />
    </div>;
}