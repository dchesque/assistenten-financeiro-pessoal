import { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, CalendarDays, CheckCircle, Search, Filter, Grid, List, Plus, Eye, Edit, MoreVertical, ChevronRight, Building2, DollarSign, Download, Copy, History, Ban, Trash2, X, Loader2, FileText, Upload, Info as InfoIcon, Package } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import ContaCard from '@/components/contasPagar/ContaCard';
import { ContaCardAprimorado } from '@/components/contasPagar/ContaCardAprimorado';
import BaixarContaModal from '@/components/contasPagar/BaixarContaModal';
import ContaVisualizarModal from '@/components/contasPagar/ContaVisualizarModal';
import ContaEditarModal from '@/components/contasPagar/ContaEditarModal';
import { TabelaContasSkeleton, ContaCardsSkeleton } from '@/components/contasPagar/TabelaContasSkeleton';
import { useContasPagarOtimizado } from '@/hooks/useContasPagarOtimizado';
import { TabelaContasResponsiva } from '@/components/contasPagar/TabelaContasResponsiva';
import { TabelaContasVirtualizada } from '@/components/contasPagar/TabelaContasVirtualizada';
import { useFornecedoresSupabase } from '@/hooks/useFornecedoresSupabase';
import { usePlanoContas } from '@/hooks/usePlanoContas';

export default function ContasPagar() {
  const navigate = useNavigate();
  
  // Hook otimizado que gerencia todas as contas a pagar
  const {
    contas,
    contasFiltradas,
    resumos,
    estados,
    filtros,
    setFiltros,
    filtroRapido,
    setFiltroRapido,
    limparFiltros,
    salvarEdicao,
    confirmarBaixa,
    excluirConta,
    cancelarConta
  } = useContasPagarOtimizado();

  // Hooks para dados de filtros
  const { fornecedores } = useFornecedoresSupabase();
  const { planoContas } = usePlanoContas();

  const [vistaAtual, setVistaAtual] = useState<'tabela' | 'cards'>('tabela');

  // Estados dos modais
  const [modalBaixar, setModalBaixar] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<any>(null);

  // Estado para menu dropdown
  const [menuAbertoId, setMenuAbertoId] = useState<number | null>(null);

  // Estados para modal de edição
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [contaParaEditar, setContaParaEditar] = useState<any>(null);

  // Estados para modal de confirmação
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState<any>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setMenuAbertoId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getStatusConfig = (status: string) => {
    const configs = {
      pendente: {
        color: 'bg-yellow-100/80 text-yellow-700',
        dot: 'bg-yellow-600',
        label: 'Pendente'
      },
      pago: {
        color: 'bg-green-100/80 text-green-700',
        dot: 'bg-green-600',
        label: 'Pago'
      },
      vencido: {
        color: 'bg-red-100/80 text-red-700',
        dot: 'bg-red-600',
        label: 'Vencido'
      },
      cancelado: {
        color: 'bg-gray-100/80 text-gray-700',
        dot: 'bg-gray-600',
        label: 'Cancelado'
      }
    };
    return configs[status as keyof typeof configs] || configs.pendente;
  };

  const getVencimentoIndicator = (conta: any) => {
    if (conta.status === 'pago') return null;
    if (conta.dias_em_atraso > 0) {
      return (
        <span className="text-xs bg-red-100/80 text-red-700 px-2 py-1 rounded-full ml-2">
          {conta.dias_em_atraso} dias atraso
        </span>
      );
    }
    if (conta.dias_para_vencimento === 0) {
      return (
        <span className="text-xs bg-yellow-100/80 text-yellow-700 px-2 py-1 rounded-full ml-2">
          HOJE
        </span>
      );
    }
    if (conta.dias_para_vencimento <= 7) {
      return (
        <span className="text-xs bg-blue-100/80 text-blue-700 px-2 py-1 rounded-full ml-2">
          {conta.dias_para_vencimento} dias
        </span>
      );
    }
    return null;
  };

  const handleVisualizar = (conta: any) => {
    setContaSelecionada(conta);
    setModalVisualizar(true);
  };

  const handleEditar = (conta: any) => {
    setContaParaEditar(conta);
    setModalEditarAberto(true);
    setMenuAbertoId(null);
  };

  // Contador de filtros ativos
  const contadorFiltrosAtivos = useMemo(() => {
    let contador = 0;
    if (filtros.busca) contador++;
    if (filtros.status !== 'todos') contador++;
    if (filtros.fornecedor_id !== 'todos') contador++;
    if (filtros.plano_conta_id !== 'todos') contador++;
    if (filtros.data_inicio || filtros.data_fim) contador++;
    return contador;
  }, [filtros]);

  const handleDuplicar = (conta: any) => {
    const novaConta = {
      ...conta,
      id: null,
      status: 'pendente',
      data_lancamento: new Date().toISOString().split('T')[0],
      data_pagamento: null,
      valor_pago: null,
      banco_id: null,
      descricao: `${conta.descricao} (Cópia)`
    };
    setContaParaEditar(novaConta);
    setModalEditarAberto(true);
    setMenuAbertoId(null);
  };

  // Melhorar feedback de filtros
  const handleLimparFiltros = () => {
    limparFiltros();
    const { toast } = require('@/hooks/use-toast');
    toast({
      title: "✨ Filtros limpos",
      description: `${contadorFiltrosAtivos} filtro${contadorFiltrosAtivos > 1 ? 's' : ''} ${contadorFiltrosAtivos > 1 ? 'foram removidos' : 'foi removido'}`,
    });
  };

  const handleFiltroRapido = (novoFiltro: string) => {
    setFiltroRapido(novoFiltro as any);
    const labels = { 
      'todos': 'todas as contas', 
      'pendente': 'contas pendentes',
      'pago': 'contas pagas',
      'vencido': 'contas vencidas'
    };
    
    const { toast } = require('@/hooks/use-toast');
    toast({
      title: "🔍 Filtro aplicado",
      description: `Exibindo: ${labels[novoFiltro] || novoFiltro}`,
    });
  };

  const handleCancelar = (conta: any) => {
    setAcaoConfirmacao({
      tipo: 'cancelar',
      conta,
      titulo: 'Cancelar Conta',
      mensagem: `Tem certeza que deseja cancelar a conta "${conta.descricao}"?`,
      acao: async () => {
        await cancelarConta(conta.id);
        setModalConfirmacaoAberto(false);
        setAcaoConfirmacao(null);
      }
    });
    setModalConfirmacaoAberto(true);
    setMenuAbertoId(null);
  };

  const handleVerHistorico = (conta: any) => {
    console.log('Ver histórico:', conta);
    // TODO: Implementar modal de histórico
    setMenuAbertoId(null);
  };

  // Modal de Confirmação
  const ModalConfirmacao = ({
    aberto,
    titulo,
    mensagem,
    tipo,
    onConfirmar,
    onCancelar
  }: any) => {
    if (!aberto) return null;
    
    const configs = {
      excluir: {
        corBotao: 'bg-red-600 hover:bg-red-700',
        icone: <Trash2 className="w-6 h-6 text-red-600" />,
        textoBotao: 'Excluir'
      },
      cancelar: {
        corBotao: 'bg-orange-600 hover:bg-orange-700',
        icone: <Ban className="w-6 h-6 text-orange-600" />,
        textoBotao: 'Cancelar Conta'
      }
    };
    const config = configs[tipo as keyof typeof configs] || configs.excluir;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-md w-full">
          <div className="p-6">
            {/* Ícone */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full">
              {config.icone}
            </div>
            
            {/* Título */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {titulo}
            </h3>
            
            {/* Mensagem */}
            <p className="text-gray-600 text-center mb-6">
              {mensagem}
            </p>
            
            {/* Botões */}
            <div className="flex space-x-3">
              <button
                onClick={onCancelar}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirmar}
                className={`flex-1 px-4 py-2 text-white rounded-xl transition-colors ${config.corBotao}`}
              >
                {config.textoBotao}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleExcluir = (conta: any) => {
    setAcaoConfirmacao({
      tipo: 'excluir',
      conta,
      titulo: 'Excluir Conta',
      mensagem: `Tem certeza que deseja EXCLUIR permanentemente a conta "${conta.descricao}"?\n\nEsta ação não pode ser desfeita.`,
      acao: async () => {
        await excluirConta(conta.id);
        setModalConfirmacaoAberto(false);
        setAcaoConfirmacao(null);
      }
    });
    setModalConfirmacaoAberto(true);
    setMenuAbertoId(null);
  };

  const DropdownMenuComponent = ({ conta }: { conta: any }) => {
    const isOpen = menuAbertoId === conta.id;
    const menuRef = useRef<HTMLDivElement>(null);
    
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuAbertoId(isOpen ? null : conta.id);
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          title="Mais ações"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-50">
            <div className="p-2">
              {/* Duplicar */}
              <button
                onClick={() => handleDuplicar(conta)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicar Conta</span>
              </button>
              
              {/* Histórico */}
              <button
                onClick={() => handleVerHistorico(conta)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span>Ver Histórico</span>
              </button>
              
              {/* Cancelar (só para pendentes/vencidos) */}
              {(conta.status === 'pendente' || conta.status === 'vencido') && (
                <button
                  onClick={() => handleCancelar(conta)}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  <span>Cancelar Conta</span>
                </button>
              )}
              
              {/* Divisor */}
              <hr className="my-2 border-gray-200" />
              
              {/* Excluir */}
              <button
                onClick={() => handleExcluir(conta)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Conta</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleBaixar = (conta: any) => {
    setContaSelecionada(conta);
    setModalBaixar(true);
  };

  const handleConfirmarBaixa = async (dadosBaixa: any) => {
    await confirmarBaixa(dadosBaixa);
    setMenuAbertoId(null);
  };

  const handleSalvarEdicao = async (dadosEdicao: any) => {
    await salvarEdicao(dadosEdicao);
  };

  // Loading State aprimorado
  const LoadingContasAprimorado = () => (
    <div className="space-y-6">
      {/* Header com loading info */}
      <div className="flex items-center justify-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 mb-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Carregando contas a pagar</h3>
              <p className="text-sm text-gray-600">Buscando dados atualizados...</p>
            </div>
          </div>
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
          </div>
        </div>
      </div>

      {/* Skeleton das cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton da tabela */}
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Estado vazio informativo
  const EstadoVazioContas = () => {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Nenhuma conta a pagar
          </h3>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Você ainda não possui contas cadastradas. <br />
            Comece criando sua primeira conta ou importe em lote.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/conta-individual')}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar primeira conta
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/lancamento-lote')}
              className="w-full sm:w-auto ml-0 sm:ml-3"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar em lote
            </Button>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <InfoIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Dica:</p>
                <p>Use o lançamento em lote para importar várias contas de uma vez, ideal para faturas parceladas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Se está carregando, mostrar loading melhorado
  if (estados.carregandoContas) {
    return (
      <div className="p-4 lg:p-8">
        {/* Header da página */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contas a Pagar</h1>
          <p className="text-gray-600">Visualize e gerencie todas as contas a pagar</p>
        </div>

        <LoadingContasAprimorado />
      </div>
    );
  }

  return (
    <>
      
      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/contas-pagar')}
        title="Contas a Pagar"
        subtitle="Gestão de obrigações financeiras • Controle de vencimentos"
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => navigate('/lancamento-lote')}
              className="bg-white/80 backdrop-blur-sm border-white/20"
            >
              <Package className="w-4 h-4 mr-2" />
              Lote
            </Button>
            <Button 
              onClick={() => navigate('/conta-individual')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </>
        }
      />
      
      {/* Container principal com margem adequada */}
      <div className="p-4 lg:p-8">
        {/* Badge de filtros ativos */}
        {contadorFiltrosAtivos > 0 && (
          <div className="mb-6">
            <Badge variant="secondary" className="animate-pulse">
              {contadorFiltrosAtivos} filtro{contadorFiltrosAtivos > 1 ? 's' : ''} ativo{contadorFiltrosAtivos > 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Pendente</CardTitle>
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatarMoeda(resumos.pendentes.valor)}</div>
              <p className="text-xs text-gray-500 mt-1">{resumos.pendentes.total} contas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Contas Vencidas</CardTitle>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatarMoeda(resumos.vencidas.valor)}</div>
              <p className="text-xs text-gray-500 mt-1">{resumos.vencidas.total} contas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">A Vencer (7 dias)</CardTitle>
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatarMoeda(resumos.vence7Dias.valor)}</div>
              <p className="text-xs text-gray-500 mt-1">{resumos.vence7Dias.total} contas</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Pagas no Mês</CardTitle>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatarMoeda(resumos.pagasMes.valor)}</div>
              <p className="text-xs text-gray-500 mt-1">{resumos.pagasMes.total} contas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Linha 1 - Filtros Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por descrição, documento, fornecedor..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                    className="pl-10 bg-white/80 backdrop-blur-sm"
                  />
                </div>
                
                <Select
                  value={filtros.status}
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl">
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="Data início"
                    value={filtros.data_inicio}
                    onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                    className="bg-white/80 backdrop-blur-sm"
                  />
                  <Input
                    type="date"
                    placeholder="Data fim"
                    value={filtros.data_fim}
                    onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                    className="bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Linha 2 - Filtros Específicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  value={filtros.fornecedor_id?.toString() || 'todos'}
                  onValueChange={(value) => setFiltros(prev => ({
                    ...prev,
                    fornecedor_id: value === 'todos' ? 'todos' : parseInt(value)
                  }))}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm">
                    <SelectValue placeholder="Fornecedor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl">
                    <SelectItem value="todos">Todos os Fornecedores</SelectItem>
                    {fornecedores.filter(f => f.ativo).map(fornecedor => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filtros.plano_conta_id?.toString() || 'todos'}
                  onValueChange={(value) => setFiltros(prev => ({
                    ...prev,
                    plano_conta_id: value === 'todos' ? 'todos' : parseInt(value)
                  }))}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl">
                    <SelectItem value="todos">Todas as Categorias</SelectItem>
                    {planoContas.filter(p => p.ativo).map(plano => (
                      <SelectItem key={plano.id} value={plano.id.toString()}>
                        {plano.codigo} - {plano.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Checkbox id="dda" />
                  <label htmlFor="dda" className="text-sm font-medium">Apenas DDA</label>
                </div>
              </div>

              {/* Ações dos Filtros */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200/50">
                <div className="flex space-x-2">
                  <Button onClick={limparFiltros} variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{contasFiltradas.length} contas</span>
                  <div className="flex border rounded-lg">
                    <Button
                      variant={vistaAtual === 'tabela' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVistaAtual('tabela')}
                      className="rounded-r-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={vistaAtual === 'cards' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVistaAtual('cards')}
                      className="rounded-l-none"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtros rápidos */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filtro rápido:</span>
            <button
              onClick={() => setFiltroRapido('todos')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroRapido === 'todos'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({contas.length})
            </button>
            <button
              onClick={() => setFiltroRapido('pendente')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroRapido === 'pendente'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
              }`}
            >
              Pendente ({contas.filter(c => c.status === 'pendente').length})
            </button>
            <button
              onClick={() => setFiltroRapido('vencido')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroRapido === 'vencido'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              Vencidas ({contas.filter(c => c.status === 'vencido').length})
            </button>
            <button
              onClick={() => setFiltroRapido('vence_7_dias')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroRapido === 'vence_7_dias'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              A Vencer 7d ({contas.filter(c => c.status === 'pendente' && c.dias_para_vencimento <= 7).length})
            </button>
          </div>
          
          <button
            onClick={() => console.log('Exportar contas')}
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Conteúdo Principal */}
        {contasFiltradas.length === 0 && !estados.carregandoContas ? (
          filtros.busca || filtros.status !== 'todos' || filtroRapido !== 'todos' ? (
            <div className="text-center p-12">
              {/* Estado filtrado sem resultados */}
              <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-2xl p-12">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma conta encontrada
                </h3>
                <p className="text-gray-500 mb-4">
                  Nenhuma conta corresponde aos filtros aplicados.
                </p>
                <Button onClick={limparFiltros} variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          ) : (
            <EstadoVazioContas />
          )
        ) : (
          /* Lista de Contas - Otimizada com Virtualization */
          <TabelaContasResponsiva
            contas={contasFiltradas}
            height={600}
            onVisualizar={handleVisualizar}
            onEditar={handleEditar}
            onBaixar={handleBaixar}
            onDuplicar={handleDuplicar}
            onExcluir={handleExcluir}
          />
        )}

        {/* Modals */}
        <BaixarContaModal
          isOpen={modalBaixar}
          onClose={() => setModalBaixar(false)}
          conta={contaSelecionada}
          onConfirm={handleConfirmarBaixa}
        />

        <ContaVisualizarModal
          isOpen={modalVisualizar}
          onClose={() => setModalVisualizar(false)}
          conta={contaSelecionada}
          onEditar={handleEditar}
          onBaixar={handleBaixar}
          onDuplicar={handleDuplicar}
          onExcluir={handleExcluir}
        />
        
        <ContaEditarModal
          isOpen={modalEditarAberto}
          onClose={() => {
            setModalEditarAberto(false);
            setContaParaEditar(null);
          }}
          conta={contaParaEditar}
          onSalvar={handleSalvarEdicao}
        />
        
        <ModalConfirmacao
          aberto={modalConfirmacaoAberto}
          titulo={acaoConfirmacao?.titulo}
          mensagem={acaoConfirmacao?.mensagem}
          tipo={acaoConfirmacao?.tipo}
          onConfirmar={acaoConfirmacao?.acao}
          onCancelar={() => {
            setModalConfirmacaoAberto(false);
            setAcaoConfirmacao(null);
          }}
        />
        
        {/* Estados de loading específicos visuais */}
        {estados.salvandoEdicao && (
          <div className="fixed top-4 right-4 bg-blue-100 border border-blue-200 rounded-lg px-4 py-2 flex items-center space-x-2 z-50">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-800">Salvando conta...</span>
          </div>
        )}

        {estados.processandoBaixa && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-200 rounded-lg px-4 py-2 flex items-center space-x-2 z-50">
            <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
            <span className="text-sm text-green-800">Processando baixa...</span>
          </div>
        )}
      </div>
    </>
  );
}