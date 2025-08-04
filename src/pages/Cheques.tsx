import { useState } from 'react';
import { Cheque } from '@/types/cheque';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { useChequesSupabaseCompativel } from '@/hooks/useChequesSupabaseCompativel';
import { STATUS_CHEQUE_LABELS, STATUS_CHEQUE_COLORS } from '@/types/cheque';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CheckSquare,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Eye,
  Edit,
  Check,
  X,
  MoreVertical,
  Building2,
  User,
  DollarSign,
  Calendar,
  FilterX,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { ChequeCard } from '@/components/cheques/ChequeCard';
import { ChequeModal } from '@/components/cheques/ChequeModal';
import { ChequeVisualizarModal } from '@/components/cheques/ChequeVisualizarModal';
import { AcaoRapidaModal } from '@/components/cheques/AcaoRapidaModal';
import { ChequesSkeleton, FiltrosLoadingOverlay } from '@/components/cheques/ChequesSkeleton';

export default function Cheques() {
  const {
    cheques,
    estatisticas,
    loading,
    filtros,
    setFiltros,
    carregarCheques,
    emitirCheque,
    atualizarCheque,
    marcarCompensado,
    marcarDevolvido,
    cancelarCheque,
    buscarBancos,
    bancos
  } = useChequesSupabaseCompativel();

  // Estados derivados para compatibilidade
  const chequesFiltrados = cheques || [];
  const temFiltrosAtivos = filtros.busca !== '' || filtros.status !== 'todos' || filtros.banco_id !== 'todos' || filtros.data_inicio !== '' || filtros.data_fim !== '';
  const textoContador = `${chequesFiltrados.length} cheque(s) encontrado(s)`;
  const estados = { aplicandoFiltros: loading };
  
  const aplicarFiltros = () => carregarCheques();
  const limparFiltros = () => {
    setFiltros({
      busca: '',
      status: 'todos',
      banco_id: 'todos' as any,
      data_inicio: '',
      data_fim: ''
    });
  };

  // Dados reais do Supabase - sem mock
  const bancosDisponiveis = bancos || [];
  const fornecedoresDisponiveis = [];

  // Modais
  const [modalCheque, setModalCheque] = useState({ aberto: false, editando: null as Cheque | null });
  const [modalVisualizar, setModalVisualizar] = useState({ aberto: false, cheque: null as Cheque | null });
  const [modalAcao, setModalAcao] = useState({ 
    aberto: false, 
    tipo: 'compensar' as 'compensar' | 'cancelar' | 'devolver',
    cheque: null as Cheque | null 
  });

  // Handlers de modal
  const handleNovoCheque = () => {
    setModalCheque({ aberto: true, editando: null });
  };

  const handleEditarCheque = (cheque: Cheque) => {
    setModalCheque({ aberto: true, editando: cheque });
  };

  const handleVisualizarCheque = (cheque: Cheque) => {
    setModalVisualizar({ aberto: true, cheque });
  };

  const handleAcaoRapida = (tipo: 'compensar' | 'cancelar' | 'devolver', cheque: Cheque) => {
    setModalAcao({ aberto: true, tipo, cheque });
  };

  const handleSalvarCheque = async (dadosCheque: any) => {
    try {
      if (modalCheque.editando) {
        await atualizarCheque(modalCheque.editando.id!, dadosCheque);
      } else {
        await emitirCheque(dadosCheque);
      }
      setModalCheque({ aberto: false, editando: null });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleConfirmarAcao = async (dados: any) => {
    if (!modalAcao.cheque) return;

    try {
      switch (modalAcao.tipo) {
        case 'compensar':
          await marcarCompensado(modalAcao.cheque.id!, dados.observacoes);
          break;
        case 'cancelar':
          await cancelarCheque(modalAcao.cheque.id!, dados.motivo_cancelamento, dados.observacoes);
          break;
        case 'devolver':
          await marcarDevolvido(modalAcao.cheque.id!, dados.motivo_devolucao, dados.observacoes);
          break;
      }
      setModalAcao({ aberto: false, tipo: 'compensar', cheque: null });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  // Mostrar loading se estiver carregando
  if (loading) {
    return <ChequesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Blur abstratos de background */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute top-40 right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 p-6 space-y-6">
        {/* Page Header */}
        <PageHeader
          breadcrumb={createBreadcrumb('/cheques')}
          title="Cheques"
          subtitle="Controle de cheques • Emissão, compensação e status"
          actions={
            <Button 
              onClick={handleNovoCheque} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Emitir Cheque
            </Button>
          }
        />

        {/* Cards Estatísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{estatisticas?.total_cheques || 0}</div>
            <div className="text-sm font-medium text-gray-600">Total de Cheques</div>
            <div className="text-xs text-gray-500 mt-1">cheques emitidos</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{estatisticas?.pendentes.quantidade || 0}</div>
            <div className="text-lg font-semibold text-yellow-700 mb-1">
              {formatarMoeda(estatisticas?.pendentes.valor || 0)}
            </div>
            <div className="text-sm font-medium text-gray-600">Cheques Pendentes</div>
            <div className="text-xs text-gray-500 mt-1">aguardando compensação</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{estatisticas?.compensados.quantidade || 0}</div>
            <div className="text-lg font-semibold text-green-700 mb-1">
              {formatarMoeda(estatisticas?.compensados.valor || 0)}
            </div>
            <div className="text-sm font-medium text-gray-600">Cheques Compensados</div>
            <div className="text-xs text-gray-500 mt-1">compensados com sucesso</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 hover:scale-105 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{estatisticas?.devolvidos.quantidade || 0}</div>
            <div className="text-lg font-semibold text-red-700 mb-1">
              {formatarMoeda(estatisticas?.devolvidos.valor || 0)}
            </div>
            <div className="text-sm font-medium text-gray-600">Cheques Devolvidos</div>
            <div className="text-xs text-gray-500 mt-1">devolvidos pelo banco</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
            {/* Badges de filtros ativos */}
            {temFiltrosAtivos && (
              <div className="flex items-center space-x-2">
                {filtros.status !== 'todos' && (
                  <Badge variant="secondary" className="bg-blue-100/80 text-blue-700 border border-blue-200">
                    {STATUS_CHEQUE_LABELS[filtros.status as keyof typeof STATUS_CHEQUE_LABELS]}
                  </Badge>
                )}
                {filtros.banco_id !== 'todos' && (
                  <Badge variant="secondary" className="bg-blue-100/80 text-blue-700 border border-blue-200">
                    {bancosDisponiveis.find(b => b.id === Number(filtros.banco_id))?.nome}
                  </Badge>
                )}
                {(filtros.data_inicio || filtros.data_fim) && (
                  <Badge variant="secondary" className="bg-blue-100/80 text-blue-700 border border-blue-200">
                    {filtros.data_inicio && filtros.data_fim 
                      ? `${formatarData(filtros.data_inicio)} - ${formatarData(filtros.data_fim)}`
                      : filtros.data_inicio 
                        ? `A partir de ${formatarData(filtros.data_inicio)}`
                        : `Até ${formatarData(filtros.data_fim)}`
                    }
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Grid responsivo dos filtros - Layout 2 linhas */}
          <div className="space-y-4">
            {/* Linha 1: Busca, Status, Banco */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              {/* Busca Geral - 2fr no desktop */}
              <div className="lg:col-span-1 space-y-2">
                <Label htmlFor="busca" className="text-sm font-medium text-gray-700">Busca Geral</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="busca"
                    placeholder="Número, beneficiário, valor..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                    className={`pl-10 bg-white/80 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11 min-w-0 ${
                      filtros.busca ? 'border-blue-300' : 'border-gray-200'
                    }`}
                  />
                </div>
              </div>

              {/* Status do Cheque - 1fr */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                <Select value={filtros.status} onValueChange={(value: any) => setFiltros(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 h-11 min-w-[120px] ${
                    filtros.status !== 'todos' ? 'border-blue-300' : 'border-gray-200'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl z-50">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="compensado">Compensado</SelectItem>
                    <SelectItem value="devolvido">Devolvido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Banco - 1fr */}
              <div className="space-y-2">
                <Label htmlFor="banco" className="text-sm font-medium text-gray-700">Banco</Label>
                <Select value={filtros.banco_id.toString()} onValueChange={(value) => setFiltros(prev => ({ ...prev, banco_id: value === 'todos' ? 'todos' as any : Number(value) }))}>
                  <SelectTrigger className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 h-11 min-w-[120px] ${
                    filtros.banco_id !== 'todos' ? 'border-blue-300' : 'border-gray-200'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl z-50">
                    <SelectItem value="todos">Todos</SelectItem>
                    {bancosDisponiveis.filter(b => b.ativo).map(banco => (
                      <SelectItem key={banco.id} value={banco.id.toString()}>
                        {banco.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Datas e Botões */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Data Inicial - 1fr */}
              <div className="space-y-2">
                <Label htmlFor="data_inicial" className="text-sm font-medium text-gray-700">Data Inicial</Label>
                <Input
                  id="data_inicial"
                  type="date"
                  value={filtros.data_inicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                  className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11 min-w-[140px] ${
                    filtros.data_inicio ? 'border-blue-300' : 'border-gray-200'
                  }`}
                  placeholder="dd/mm/aaaa"
                />
              </div>

              {/* Data Final - 1fr */}
              <div className="space-y-2">
                <Label htmlFor="data_final" className="text-sm font-medium text-gray-700">Data Final</Label>
                <Input
                  id="data_final"
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                  className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11 min-w-[140px] ${
                    filtros.data_fim ? 'border-blue-300' : 'border-gray-200'
                  }`}
                  placeholder="dd/mm/aaaa"
                  min={filtros.data_inicio || undefined}
                />
                {filtros.data_inicio && filtros.data_fim && filtros.data_inicio > filtros.data_fim && (
                  <div className="text-red-500 text-xs mt-1">Data final deve ser posterior à inicial</div>
                )}
              </div>

              {/* Botão Filtrar - auto */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-transparent lg:block hidden">Ação</Label>
                <Button 
                  onClick={aplicarFiltros}
                  disabled={estados.aplicandoFiltros || (filtros.data_inicio && filtros.data_fim && filtros.data_inicio > filtros.data_fim)}
                  className="w-full lg:min-w-[100px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 h-11 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-sm"
                >
                  {estados.aplicandoFiltros ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Filtrando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Filtrar
                    </>
                  )}
                </Button>
              </div>

              {/* Botão Limpar - auto */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-transparent lg:block hidden">Limpar</Label>
                <Button 
                  variant="outline" 
                  onClick={limparFiltros}
                  disabled={!temFiltrosAtivos || estados.aplicandoFiltros}
                  className="w-full lg:min-w-[80px] bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 h-11 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm"
                >
                  <FilterX className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>

            {/* Layout mobile - responsividade específica */}
            <div className="md:hidden space-y-4">
              {/* Botões full-width no mobile */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={aplicarFiltros}
                  disabled={estados.aplicandoFiltros || (filtros.data_inicio && filtros.data_fim && filtros.data_inicio > filtros.data_fim)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 h-11 disabled:opacity-50 text-sm"
                >
                  {estados.aplicandoFiltros ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Filtrando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Filtrar
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={limparFiltros}
                  disabled={!temFiltrosAtivos || estados.aplicandoFiltros}
                  className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 h-11 disabled:opacity-50 text-sm"
                >
                  <FilterX className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </div>

          {/* Contador de resultados dinâmico */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{textoContador}</span>
            </div>
            
            {/* Loading state na contagem */}
            {estados.aplicandoFiltros && (
              <div className="flex items-center text-sm text-blue-600">
                <div className="w-3 h-3 border border-blue-600/30 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                Aplicando filtros...
              </div>
            )}
          </div>
        </div>

        {/* Lista de Cheques - Mobile Cards */}
        <div className="block lg:hidden">
          <div className="grid grid-cols-1 gap-4">
            {chequesFiltrados.map((cheque) => (
              <ChequeCard
                key={cheque.id}
                cheque={cheque}
                onView={handleVisualizarCheque}
                onEdit={handleEditarCheque}
              />
            ))}
          </div>
        </div>

        {/* Lista de Cheques - Desktop Table */}
        <div className="hidden lg:block">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Lista de Cheques</h2>
              <Button onClick={handleNovoCheque} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Novo Cheque
              </Button>
            </div>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 border-b border-gray-200/50">
                  <TableHead className="font-semibold text-gray-700">Número</TableHead>
                  <TableHead className="font-semibold text-gray-700">Banco</TableHead>
                  <TableHead className="font-semibold text-gray-700">Beneficiário</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Valor</TableHead>
                  <TableHead className="font-semibold text-gray-700">Emissão</TableHead>
                  <TableHead className="font-semibold text-gray-700">Compensação</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chequesFiltrados.map((cheque) => {
                  const banco = bancosDisponiveis.find(b => b.id === cheque.banco_id);
                  const fornecedor = cheque.tipo_beneficiario === 'fornecedor' 
                    ? fornecedoresDisponiveis.find(f => f.id === cheque.fornecedor_id)
                    : null;
                  const beneficiarioNome = fornecedor ? fornecedor.nome : cheque.beneficiario_nome;

                  return (
                    <TableRow key={cheque.id} className="hover:bg-white/60 transition-colors duration-200 odd:bg-gray-50/30">
                      <TableCell>
                        <button
                          onClick={() => handleVisualizarCheque(cheque)}
                          className="font-mono font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          #{cheque.numero_cheque}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{banco?.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            {banco?.agencia} - {banco?.conta}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{beneficiarioNome}</div>
                          {fornecedor && (
                            <Badge variant="secondary" className="text-xs mt-1">Fornecedor</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatarMoeda(cheque.valor)}
                      </TableCell>
                      <TableCell>
                        {formatarData(cheque.data_emissao)}
                      </TableCell>
                      <TableCell>
                        {cheque.data_compensacao ? formatarData(cheque.data_compensacao) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_CHEQUE_COLORS[cheque.status]} border`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            cheque.status === 'pendente' ? 'bg-yellow-600' :
                            cheque.status === 'compensado' ? 'bg-green-600' :
                            cheque.status === 'devolvido' ? 'bg-red-600' : 'bg-gray-600'
                          }`}></div>
                          {STATUS_CHEQUE_LABELS[cheque.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors duration-200">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border border-white/20">
                              <DropdownMenuItem onClick={() => handleVisualizarCheque(cheque)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                              {(cheque.status === 'pendente' || cheque.status === 'devolvido') && (
                                <DropdownMenuItem onClick={() => handleEditarCheque(cheque)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {cheque.status === 'pendente' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleAcaoRapida('compensar', cheque)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Marcar Compensado
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAcaoRapida('cancelar', cheque)}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancelar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>

        {/* Modais */}
        <ChequeModal
          isOpen={modalCheque.aberto}
          onClose={() => setModalCheque({ aberto: false, editando: null })}
          cheque={modalCheque.editando}
          onSave={handleSalvarCheque}
        />

        {modalVisualizar.cheque && (
          <ChequeVisualizarModal
            cheque={modalVisualizar.cheque}
            aberto={modalVisualizar.aberto}
            onFechar={() => setModalVisualizar({ aberto: false, cheque: null })}
          />
        )}

        {modalAcao.cheque && (
          <AcaoRapidaModal
            isOpen={modalAcao.aberto}
            onClose={() => setModalAcao({ aberto: false, tipo: 'compensar', cheque: null })}
            tipo={modalAcao.tipo}
            numeroCheque={modalAcao.cheque.numero_cheque}
            onConfirmar={handleConfirmarAcao}
          />
        )}
      </div>
    </div>
  );
}