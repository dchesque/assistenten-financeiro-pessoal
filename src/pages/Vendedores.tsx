import React, { useState } from 'react';
import { Plus, Users, TrendingUp, BarChart3, Grid3X3, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useVendedores } from '@/hooks/useVendedores';
import { VendedorCard } from '@/components/vendedores/VendedorCard';
import { VendedorModal } from '@/components/vendedores/VendedorModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { RankingVendedoresModal } from '@/components/vendedores/RankingVendedoresModal';
import { VendedorDetailsModal } from '@/components/vendedores/VendedorDetailsModal';
import { VendedorInsightsModal } from '@/components/vendedores/VendedorInsightsModal';
import { TabelaVendedores } from '@/components/vendedores/TabelaVendedores';
import { RelatorioAvancadoModal } from '@/components/vendedores/RelatorioAvancadoModal';
import { STATUS_VENDEDOR, NIVEIS_ACESSO, Vendedor } from '@/types/vendedor';
import { formatarMoeda } from '@/utils/formatters';
import { LoadingStates } from '@/components/ui/LoadingStates';

export default function Vendedores() {
  const {
    vendedores,
    vendedoresFiltrados,
    loading,
    resumos,
    filtros,
    setFiltros,
    criarVendedor,
    atualizarVendedor,
    excluirVendedor,
    toggleStatus,
    gerarProximoCodigo,
    recarregar
  } = useVendedores();
  
  const { toast } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<Vendedor | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [rankingAberto, setRankingAberto] = useState(false);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [insightsAberto, setInsightsAberto] = useState(false);
  const [relatorioAberto, setRelatorioAberto] = useState(false);
  const [visualizacao, setVisualizacao] = useState<'cards' | 'lista'>('cards');

  // Handlers para modal
  const abrirNovoVendedor = async () => {
    setVendedorSelecionado(null);
    setModoEdicao(false);
    setModalAberto(true);
  };

  const abrirEditarVendedor = (vendedor: Vendedor) => {
    setVendedorSelecionado(vendedor);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const abrirDetalhesVendedor = (vendedor: Vendedor) => {
    setVendedorSelecionado(vendedor);
    setDetalhesAberto(true);
  };

  const fecharModais = () => {
    setModalAberto(false);
    setDetalhesAberto(false);
    setVendedorSelecionado(null);
    setModoEdicao(false);
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstrato */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/vendedores')}
        title="Vendedores"
        subtitle="Gestão completa da equipe de vendas • Performance e metas"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setRankingAberto(true)}
              className="bg-white/80 backdrop-blur-sm border-white/20"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Ranking
            </Button>
            <Button
              variant="outline"
              onClick={() => setRelatorioAberto(true)}
              className="bg-white/80 backdrop-blur-sm border-white/20"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Relatório Avançado
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Se não há vendedores, mostrar mensagem
                if (vendedoresFiltrados.length === 0) {
                  toast({
                    title: "Sem vendedores",
                    description: "Adicione vendedores para visualizar insights",
                    variant: "destructive"
                  });
                  return;
                }
                // Selecionar o melhor vendedor ou primeiro da lista
                const melhorVendedor = vendedoresFiltrados.reduce((melhor, atual) => {
                  return (atual.valor_total_vendido || 0) > (melhor.valor_total_vendido || 0) ? atual : melhor;
                }, vendedoresFiltrados[0]);
                setVendedorSelecionado(melhorVendedor);
                setInsightsAberto(true);
              }}
              className="bg-white/80 backdrop-blur-sm border-white/20"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Insights & KPI
            </Button>
            <Button
              onClick={abrirNovoVendedor}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Vendedor
            </Button>
          </>
        }
      />

      <div className="p-4 lg:p-8">

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendedores</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumos.total_vendedores}</div>
              <p className="text-xs text-muted-foreground">
                {resumos.vendedores_ativos} ativos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(resumos.total_vendido)}</div>
              <p className="text-xs text-muted-foreground">
                Todas as vendas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(resumos.total_comissoes)}</div>
              <p className="text-xs text-muted-foreground">
                Total acumulado
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarMoeda(resumos.ticket_medio_geral)}</div>
              <p className="text-xs text-muted-foreground">
                Por vendedor
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Controles */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Use os filtros para encontrar vendedores específicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Buscar por nome, código, email..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                  className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                />
              </div>
              
              <Select 
                value={filtros.status} 
                onValueChange={(value) => setFiltros({...filtros, status: value as any})}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {STATUS_VENDEDOR.map(status => (
                    <SelectItem key={status.valor} value={status.valor}>
                      {status.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filtros.nivel_acesso} 
                onValueChange={(value) => setFiltros({...filtros, nivel_acesso: value as any})}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {NIVEIS_ACESSO.map(nivel => (
                    <SelectItem key={nivel.valor} value={nivel.valor}>
                      {nivel.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Departamento"
                value={filtros.departamento}
                onChange={(e) => setFiltros({...filtros, departamento: e.target.value})}
                className="bg-white/80 backdrop-blur-sm border-gray-300/50"
              />

              <div className="flex gap-2">
                <Button
                  variant={visualizacao === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVisualizacao('cards')}
                  className="flex-1"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={visualizacao === 'lista' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVisualizacao('lista')}
                  className="flex-1"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {vendedoresFiltrados.length} vendedor{vendedoresFiltrados.length !== 1 ? 'es' : ''}
            </h2>
            {filtros.busca && (
              <p className="text-sm text-gray-600">
                Resultados para "{filtros.busca}"
              </p>
            )}
          </div>
        </div>

        {/* Lista de Vendedores */}
        {vendedoresFiltrados.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {vendedores.length === 0 ? 'Nenhum vendedor cadastrado' : 'Nenhum vendedor encontrado'}
              </h3>
              <p className="text-gray-600 text-center mb-6">
                {vendedores.length === 0 
                  ? 'Comece cadastrando seu primeiro vendedor'
                  : 'Tente ajustar os filtros para encontrar o que procura'
                }
              </p>
              {vendedores.length === 0 && (
                <Button onClick={abrirNovoVendedor}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Vendedor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : visualizacao === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendedoresFiltrados.map(vendedor => (
              <VendedorCard
                key={vendedor.id}
                vendedor={vendedor}
                onEditar={abrirEditarVendedor}
                onVisualizar={abrirDetalhesVendedor}
                onToggleStatus={toggleStatus}
                onExcluir={excluirVendedor}
              />
            ))}
          </div>
        ) : (
          <TabelaVendedores
            vendedores={vendedoresFiltrados}
            onEditar={abrirEditarVendedor}
            onVisualizar={abrirDetalhesVendedor}
            onToggleStatus={toggleStatus}
            onExcluir={excluirVendedor}
          />
        )}
      </div>

      {/* Modais */}
      <VendedorModal
        aberto={modalAberto}
        onFechar={fecharModais}
        vendedor={vendedorSelecionado}
        modoEdicao={modoEdicao}
        onSalvar={modoEdicao 
          ? (vendedor: any) => atualizarVendedor(vendedorSelecionado!.id, vendedor)
          : criarVendedor
        }
        gerarProximoCodigo={gerarProximoCodigo}
      />

      <VendedorDetailsModal
        aberto={detalhesAberto}
        onFechar={fecharModais}
        vendedor={vendedorSelecionado}
        onEditar={() => {
          setDetalhesAberto(false);
          setModoEdicao(true);
          setModalAberto(true);
        }}
      />

      <RankingVendedoresModal
        aberto={rankingAberto}
        onFechar={() => setRankingAberto(false)}
      />

      <VendedorInsightsModal
        aberto={insightsAberto}
        onFechar={() => setInsightsAberto(false)}
        vendedor={vendedorSelecionado}
      />

      <RelatorioAvancadoModal
        aberto={relatorioAberto}
        onFechar={() => setRelatorioAberto(false)}
      />
    </div>
  );
}