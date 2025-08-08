import { useState, useRef, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, CalendarDays, CheckCircle, Search, Filter, Grid, List, Plus, Eye, Edit, MoreVertical, ChevronRight, Building2, DollarSign, Download, Copy, History, Ban, Trash2, X, Loader2, FileText, Upload, Info as InfoIcon, Package } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { useLoadingStates } from '@/hooks/useLoadingStates';
import { toast } from 'sonner';

export default function ContasReceber() {
  const navigate = useNavigate();
  
  // Estados temporários para simular dados
  const [contas] = useState([]);
  const [loading] = useState(false);
  const [filtros, setFiltros] = useState({
    busca: '',
    status: 'todos',
    pagador_id: 'todos',
    plano_conta_id: 'todos',
    data_inicio: '',
    data_fim: ''
  });
  const [filtroRapido, setFiltroRapido] = useState('todos');

  // Dados fictícios para resumos
  const resumos = {
    total_a_receber: 0,
    total_contas_pendentes: 0,
    total_recebido: 0,
    total_contas_recebidas: 0,
    total_vencido: 0,
    total_contas_vencidas: 0,
    total_proximos_dias: 0,
    total_contas_proximos_dias: 0
  };

  const contasFiltradas = contas;

  const [vistaAtual, setVistaAtual] = useState<'tabela' | 'cards'>('tabela');

  // Estados dos modais
  const [modalReceber, setModalReceber] = useState(false);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [itemToCancel, setItemToCancel] = useState<any>(null);
  
  const { isDeleting, setLoading } = useLoadingStates();

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
      recebido: {
        color: 'bg-green-100/80 text-green-700',
        dot: 'bg-green-600',
        label: 'Recebido'
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
    if (conta.status === 'recebido') return null;
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
    if (filtros.pagador_id !== 'todos') contador++;
    if (filtros.plano_conta_id !== 'todos') contador++;
    if (filtros.data_inicio || filtros.data_fim) contador++;
    return contador;
  }, [filtros]);

  const handleDuplicar = (conta: any) => {
    // TODO: Duplicar conta
    setMenuAbertoId(null);
  };

  const handleLimparFiltros = () => {
    setFiltros({
      busca: '',
      status: 'todos', 
      pagador_id: 'todos',
      plano_conta_id: 'todos',
      data_inicio: '',
      data_fim: ''
    });
    
    toast.success(`${contadorFiltrosAtivos} filtro${contadorFiltrosAtivos > 1 ? 's' : ''} ${contadorFiltrosAtivos > 1 ? 'foram removidos' : 'foi removido'}`);
  };

  const handleFiltroRapido = (novoFiltro: string) => {
    setFiltroRapido(novoFiltro);
    const labels = { 
      'todos': 'todas as contas', 
      'pendente': 'contas pendentes',
      'recebido': 'contas recebidas',
      'vencido': 'contas vencidas'
    };
    
    toast.success(`Exibindo: ${labels[novoFiltro] || novoFiltro}`);
  };

  const handleCancelar = (conta: any) => {
    setItemToCancel(conta);
    setCancelDialogOpen(true);
    setMenuAbertoId(null);
  };

  const confirmCancel = async () => {
    if (!itemToCancel) return;
    
    setLoading('deleting', true);
    try {
      // Mock function para cancelar
      // TODO: Cancelar conta
      toast.success('Conta cancelada com sucesso!');
    } catch (error) {
      toast.error('Erro ao cancelar conta');
    } finally {
      setLoading('deleting', false);
      setCancelDialogOpen(false);
      setItemToCancel(null);
    }
  };

  const handleVerHistorico = (conta: any) => {
    // TODO: Ver histórico da conta
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
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full">
              {config.icone}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {titulo}
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              {mensagem}
            </p>
            
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
    setItemToDelete(conta);
    setDeleteDialogOpen(true);
    setMenuAbertoId(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setLoading('deleting', true);
    try {
      // Mock function para excluir
      console.log('Excluir conta:', itemToDelete);
      toast.success('Conta excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir conta');
    } finally {
      setLoading('deleting', false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
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
              <button
                onClick={() => handleDuplicar(conta)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicar Conta</span>
              </button>
              
              <button
                onClick={() => handleVerHistorico(conta)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span>Ver Histórico</span>
              </button>
              
              {(conta.status === 'pendente' || conta.status === 'vencido') && (
                <button
                  onClick={() => handleCancelar(conta)}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <Ban className="w-4 h-4" />
                  <span>Cancelar Conta</span>
                </button>
              )}
              
              <hr className="my-2 border-gray-200" />
              
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

  const handleReceber = (conta: any) => {
    // TODO: Marcar como recebida
  };

  const handleConfirmarRecebimento = async (dadosRecebimento: any) => {
    // TODO: Confirmar recebimento
  };

  const handleSalvarEdicao = async (dadosEdicao: any) => {
    // TODO: Salvar edição
  };

  // Loading State
  const LoadingContasAprimorado = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-center p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
        <div className="text-center">
          <div className="inline-flex items-center space-x-3 mb-3">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Carregando contas a receber</h3>
              <p className="text-sm text-gray-600">Buscando dados atualizados...</p>
            </div>
          </div>
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
          </div>
        </div>
      </div>

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

  // Estado vazio
  const EstadoVazioContas = () => {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-12 h-12 text-green-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Nenhuma conta a receber
          </h3>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Você ainda não possui contas a receber cadastradas. <br />
            Comece criando sua primeira conta.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/nova-receita')}
              className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar primeira conta
            </Button>
          </div>
          
          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start space-x-3">
              <InfoIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Dica:</p>
                <p>Gerencie seus recebimentos de forma organizada para manter o controle do fluxo de caixa.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contas a Receber</h1>
          <p className="text-gray-600">Gerencie seus recebimentos</p>
        </div>
        <LoadingContasAprimorado />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <PageHeader
        breadcrumb={createBreadcrumb('/contas-receber')}
        title="Contas a Receber"
        subtitle="Gerencie seus recebimentos • Controle financeiro"
        actions={
          <Button onClick={() => navigate('/novo-recebimento')} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        }
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total a Receber</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatarMoeda(resumos?.total_a_receber || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {resumos?.total_contas_pendentes || 0} conta{(resumos?.total_contas_pendentes || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-green-100/80 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recebido</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatarMoeda(resumos?.total_recebido || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {resumos?.total_contas_recebidas || 0} conta{(resumos?.total_contas_recebidas || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-green-100/80 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatarMoeda(resumos?.total_vencido || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {resumos?.total_contas_vencidas || 0} conta{(resumos?.total_contas_vencidas || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-red-100/80 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próx. 7 dias</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatarMoeda(resumos?.total_proximos_dias || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {resumos?.total_contas_proximos_dias || 0} conta{(resumos?.total_contas_proximos_dias || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-blue-100/80 rounded-lg">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 mb-8">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Busca */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por descrição, pagador..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="pl-10 bg-white/80 backdrop-blur-sm border-gray-300/50"
                />
              </div>
            </div>

            {/* Filtro Rápido por Status */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { valor: 'todos', label: 'Todos', cor: 'text-gray-600' },
                { valor: 'pendente', label: 'Pendentes', cor: 'text-yellow-600' },
                { valor: 'recebido', label: 'Recebidas', cor: 'text-green-600' },
                { valor: 'vencido', label: 'Vencidas', cor: 'text-red-600' }
              ].map(opcao => (
                <button
                  key={opcao.valor}
                  onClick={() => handleFiltroRapido(opcao.valor)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filtroRapido === opcao.valor
                      ? 'bg-white shadow-sm text-gray-900'
                      : `hover:bg-white/50 ${opcao.cor}`
                  }`}
                >
                  {opcao.label}
                </button>
              ))}
            </div>

            {/* Controles de Vista */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setVistaAtual('tabela')}
                className={`p-2 rounded-md transition-colors ${
                  vistaAtual === 'tabela' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-white/50'
                }`}
                title="Vista em tabela"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVistaAtual('cards')}
                className={`p-2 rounded-md transition-colors ${
                  vistaAtual === 'cards' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-white/50'
                }`}
                title="Vista em cards"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Linha de filtros avançados */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
            <Select
              value={filtros.pagador_id}
              onValueChange={(value) => setFiltros(prev => ({ ...prev, pagador_id: value }))}
            >
              <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-gray-300/50">
                <SelectValue placeholder="Todos os pagadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os pagadores</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.plano_conta_id}
              onValueChange={(value) => setFiltros(prev => ({ ...prev, plano_conta_id: value }))}
            >
              <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-gray-300/50">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                className="w-40 bg-white/80 backdrop-blur-sm border-gray-300/50"
                placeholder="Data início"
              />
              <span className="text-gray-400">até</span>
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                className="w-40 bg-white/80 backdrop-blur-sm border-gray-300/50"
                placeholder="Data fim"
              />
            </div>

            {contadorFiltrosAtivos > 0 && (
              <Button
                variant="outline"
                onClick={handleLimparFiltros}
                className="bg-white/80 hover:bg-white/90"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar ({contadorFiltrosAtivos})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      {contasFiltradas?.length === 0 ? (
        <EstadoVazioContas />
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardContent className="p-6">
            {vistaAtual === 'tabela' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200/50">
                      <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                      <TableHead className="font-semibold text-gray-700">Pagador</TableHead>
                      <TableHead className="font-semibold text-gray-700">Vencimento</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Valor</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contasFiltradas?.map((conta: any) => {
                      const statusConfig = getStatusConfig(conta.status);
                      return (
                        <TableRow key={conta.id} className="border-gray-200/30 hover:bg-gray-50/50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{conta.descricao}</p>
                              {conta.documento_referencia && (
                                <p className="text-xs text-gray-500">Ref: {conta.documento_referencia}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="font-medium text-gray-700">{conta.pagador_nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="text-gray-700">{formatarData(conta.data_vencimento)}</span>
                              {getVencimentoIndicator(conta)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-gray-900">
                              {formatarMoeda(conta.valor_final)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusConfig.color} border-none`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig.dot}`}></div>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleVisualizar(conta)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditar(conta)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {conta.status === 'pendente' && (
                                <button
                                  onClick={() => handleReceber(conta)}
                                  className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Marcar como recebido"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <DropdownMenuComponent conta={conta} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contasFiltradas?.map((conta: any) => (
                  <div key={conta.id} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{conta.descricao}</h3>
                        <p className="text-sm text-gray-600">{conta.pagador_nome}</p>
                      </div>
                      <DropdownMenuComponent conta={conta} />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vencimento:</span>
                        <div className="flex items-center">
                          <span className="text-gray-900">{formatarData(conta.data_vencimento)}</span>
                          {getVencimentoIndicator(conta)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-semibold text-gray-900">{formatarMoeda(conta.valor_final)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <Badge className={`${getStatusConfig(conta.status).color} border-none`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusConfig(conta.status).dot}`}></div>
                          {getStatusConfig(conta.status).label}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVisualizar(conta)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      {conta.status === 'pendente' && (
                        <Button
                          size="sm"
                          onClick={() => handleReceber(conta)}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Receber
                        </Button>
        )}

        {/* Diálogos de Confirmação */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Confirmar exclusão"
          description={`Tem certeza que deseja excluir "${itemToDelete?.descricao}"? Esta ação não pode ser desfeita.`}
          onConfirm={confirmDelete}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
          loading={isDeleting}
        />

        <ConfirmDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          title="Cancelar conta"
          description={`Tem certeza que deseja cancelar "${itemToCancel?.descricao}"? A conta será marcada como cancelada.`}
          onConfirm={confirmCancel}
          confirmText="Cancelar Conta"
          cancelText="Manter Conta"
          variant="destructive"
          loading={isDeleting}
        />
      </div>
    </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modais de confirmação - placeholder */}
      {modalConfirmacaoAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Modal de confirmação</p>
            <button onClick={() => setModalConfirmacaoAberto(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}