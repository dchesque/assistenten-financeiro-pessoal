import { useState, useMemo } from 'react';
import { Search, Plus, Tag, Filter, TrendingUp, Eye, Edit, UserX, UserCheck, Grid3x3, List } from 'lucide-react';
import type { PlanoContas, FiltrosPlanoContas } from '@/types/planoContas';
import { TIPOS_DRE } from '@/types/planoContas';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { Skeleton } from '@/components/ui/skeleton';
import PlanoContasCard from '@/components/planoContas/PlanoContasCard';
import PlanoContasModal from '@/components/planoContas/PlanoContasModal';
import { formatarMoeda } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/hooks/useSidebar';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import * as LucideIcons from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';

export default function Categorias() {
  const { isDesktop } = useSidebar();
  
  // Hook integrado com Supabase
  const {
    planoContas,
    loading,
    error,
    criarPlanoContas,
    atualizarPlanoContas,
    excluirPlanoContas,
    obterEstatisticas,
    listarPlanoContas
  } = usePlanoContas();

  // Estados principais
  const [filtros, setFiltros] = useState<FiltrosPlanoContas>({
    busca: '',
    status: 'todos',
    tipo_dre: 'todos',
    aceita_lancamento: 'todos',
    nivel: 'todos'
  });
  
  // Visualização
  const [visualizacao, setVisualizacao] = useState<'cards' | 'linhas'>('linhas');
  
  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [planoContasSelecionado, setPlanoContasSelecionado] = useState<PlanoContas | null>(null);
  const [modoModal, setModoModal] = useState<'criar' | 'editar' | 'visualizar'>('criar');

  // Filtrar plano de contas
  const planoContasFiltrado = useMemo(() => {
    let resultado = planoContas.filter(plano => {
      const matchBusca = plano.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
                        plano.codigo.toLowerCase().includes(filtros.busca.toLowerCase()) ||
                        plano.descricao?.toLowerCase().includes(filtros.busca.toLowerCase());
      const matchStatus = filtros.status === 'todos' || 
                         (filtros.status === 'ativo' && plano.ativo) ||
                         (filtros.status === 'inativo' && !plano.ativo);
      const matchTipoDre = filtros.tipo_dre === 'todos' || plano.tipo_dre === filtros.tipo_dre;
      const matchAceitaLancamento = filtros.aceita_lancamento === 'todos' ||
                                   (filtros.aceita_lancamento === 'sim' && plano.aceita_lancamento) ||
                                   (filtros.aceita_lancamento === 'nao' && !plano.aceita_lancamento);
      const matchNivel = filtros.nivel === 'todos' || plano.nivel.toString() === filtros.nivel;
      
      return matchBusca && matchStatus && matchTipoDre && matchAceitaLancamento && matchNivel;
    });

    // Organizar hierarquicamente
    const organizarHierarquia = (items: PlanoContas[], paiId: number | null = null): PlanoContas[] => {
      const filhos = items.filter(item => item.plano_pai_id === paiId);
      const resultado: PlanoContas[] = [];
      
      filhos.forEach(filho => {
        resultado.push(filho);
        resultado.push(...organizarHierarquia(items, filho.id));
      });
      
      return resultado;
    };

    return organizarHierarquia(resultado);
  }, [planoContas, filtros]);

  // Estatísticas gerais
  const estatisticas = useMemo(() => {
    const total = planoContas.length;
    const ativas = planoContas.filter(c => c.ativo).length;
    const totalContas = planoContas.reduce((acc, c) => acc + c.total_contas, 0);
    const valorTotal = planoContas.reduce((acc, c) => acc + c.valor_total, 0);
    const aceitamLancamento = planoContas.filter(c => c.aceita_lancamento).length;
    
    return { total, ativas, totalContas, valorTotal, aceitamLancamento };
  }, [planoContas]);

  // Funções do modal
  const abrirModalNova = () => {
    setPlanoContasSelecionado(null);
    setModoModal('criar');
    setModalAberto(true);
  };

  const abrirModalEditar = (plano: PlanoContas) => {
    setPlanoContasSelecionado(plano);
    setModoModal('editar');
    setModalAberto(true);
  };

  const abrirModalVisualizar = (plano: PlanoContas) => {
    setPlanoContasSelecionado(plano);
    setModoModal('visualizar');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setPlanoContasSelecionado(null);
  };

  // Salvar plano
  const salvarPlanoContas = async (plano: PlanoContas) => {
    try {
      if (modoModal === 'criar') {
        await criarPlanoContas(plano);
      } else {
        await atualizarPlanoContas(plano.id, plano);
      }
      fecharModal();
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  // Toggle status
  const toggleStatus = async (id: number) => {
    try {
      const plano = planoContas.find(p => p.id === id);
      if (plano) {
        await atualizarPlanoContas(id, { ativo: !plano.ativo });
        toast.success(`Conta ${plano.ativo ? 'desativada' : 'ativada'} com sucesso!`);
      }
    } catch (error) {
      // Erro já tratado pelo hook
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:px-8 lg:py-8">
          <div className="relative">
            {/* Header Skeleton */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 sticky top-0 z-40">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <Skeleton className="h-10 w-40" />
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Filtros Skeleton */}
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Toggle Skeleton */}
              <div className="flex justify-end">
                <Skeleton className="h-10 w-20" />
              </div>

              {/* Table Skeleton */}
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/50">
                    <thead className="bg-gray-50/80">
                      <tr>
                        {[...Array(7)].map((_, i) => (
                          <th key={i} className="px-6 py-4">
                            <Skeleton className="h-4 w-20" />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white/60 divide-y divide-gray-200/50">
                      {[...Array(5)].map((_, i) => (
                        <tr key={i}>
                          {[...Array(7)].map((_, j) => (
                            <td key={j} className="px-6 py-4">
                              <Skeleton className="h-4 w-16" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/categorias')}
        title="Categorias de Despesas"
        subtitle="Organize suas despesas por categorias • Controle financeiro pessoal"
        actions={
          <Button 
            onClick={abrirModalNova}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        }
      />

      {/* Container principal com padding responsivo e max-width */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 lg:px-8 lg:py-8">
        <div className="space-y-6">
          {/* Card de filtros */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="pl-10 bg-white/80 backdrop-blur-sm border-gray-300/50 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Filtro Status */}
              <select
                value={filtros.status}
                onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value as any }))}
                className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Apenas Ativas</option>
                <option value="inativo">Apenas Inativas</option>
              </select>
            </div>
          </div>

          {/* Toggle de Visualização */}
          <div className="flex justify-end">
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-1">
              <button 
                onClick={() => setVisualizacao('cards')}
                className={`p-2 rounded-lg transition-colors ${
                  visualizacao === 'cards' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100/80'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setVisualizacao('linhas')}
                className={`p-2 rounded-lg transition-colors ${
                  visualizacao === 'linhas' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100/80'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conteúdo baseado na visualização */}
          {planoContasFiltrado.length > 0 ? (
            visualizacao === 'cards' ? (
              <div className="space-y-4">
                {planoContasFiltrado.map(plano => (
                  <PlanoContasCard
                    key={plano.id}
                    planoContas={plano}
                    onView={abrirModalVisualizar}
                    onEdit={abrirModalEditar}
                    onToggleStatus={toggleStatus}
                  />
                ))}
              </div>
            ) : (
              /* Vista em Linhas/Tabela */
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200/50">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Código / Nome
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Tipo DRE
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Aceita Lançamento
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Total Contas
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                      {planoContasFiltrado.map((plano) => {
                        const IconComponent = plano.icone ? (LucideIcons as any)[plano.icone] : LucideIcons.Tag;
                        const tipoDre = TIPOS_DRE.find(t => t.valor === plano.tipo_dre);
                        
                        return (
                          <tr key={plano.id} className="hover:bg-white/80 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                                  style={{ backgroundColor: plano.cor }}
                                >
                                  <IconComponent className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{plano.codigo} - {plano.nome}</div>
                                  {plano.descricao && (
                                    <div className="text-xs text-gray-500">{plano.descricao}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span 
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: tipoDre?.cor }}
                              >
                                {tipoDre?.nome}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {plano.aceita_lancamento ? 'Sim' : 'Não'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {plano.total_contas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatarMoeda(plano.valor_total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                plano.ativo 
                                  ? 'bg-green-100/80 text-green-700' 
                                  : 'bg-red-100/80 text-red-700'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  plano.ativo ? 'bg-green-600' : 'bg-red-600'
                                }`}></div>
                                {plano.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => abrirModalVisualizar(plano)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                  title="Visualizar"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => abrirModalEditar(plano)}
                                  className="text-gray-600 hover:text-gray-900 transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleStatus(plano.id)}
                                  className={`transition-colors ${
                                    plano.ativo
                                      ? 'text-red-600 hover:text-red-900'
                                      : 'text-green-600 hover:text-green-900'
                                  }`}
                                  title={plano.ativo ? 'Inativar' : 'Ativar'}
                                >
                                  {plano.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            // Estado vazio
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-12 text-center">
              <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Nenhuma conta encontrada
              </h3>
              <p className="text-gray-500 mb-6">
                {filtros.busca || filtros.status !== 'todos'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira conta'
                }
              </p>
              {!filtros.busca && filtros.status === 'todos' && (
                <Button 
                  onClick={abrirModalNova}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Conta
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <PlanoContasModal
        isOpen={modalAberto}
        onClose={fecharModal}
        planoContas={planoContasSelecionado}
        planosContas={planoContas}
        modo={modoModal}
        onSave={salvarPlanoContas}
      />
    </div>
  );
}