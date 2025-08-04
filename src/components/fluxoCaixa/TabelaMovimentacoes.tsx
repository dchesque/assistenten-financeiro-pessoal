import { useState, useMemo } from 'react';
import { 
  MovimentacaoFluxo, 
  STATUS_MOVIMENTO_LABELS, 
  STATUS_MOVIMENTO_COLORS,
  TIPO_MOVIMENTO_LABELS,
  TIPO_MOVIMENTO_COLORS
} from '@/types/fluxoCaixa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  List,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TabelaMovimentacoesProps {
  movimentacoes: MovimentacaoFluxo[];
  loading?: boolean;
  onVisualizarMovimentacao?: (movimentacao: MovimentacaoFluxo) => void;
  onEditarMovimentacao?: (movimentacao: MovimentacaoFluxo) => void;
  onConfirmarMovimentacao?: (movimentacao: MovimentacaoFluxo) => void;
  onExcluirMovimentacao?: (movimentacao: MovimentacaoFluxo) => void;
}

type OrdenacaoTipo = 'data' | 'descricao' | 'categoria' | 'tipo' | 'valor' | 'status' | 'saldo_acumulado';
type DirecaoOrdenacao = 'asc' | 'desc';

export function TabelaMovimentacoes({
  movimentacoes,
  loading = false,
  onVisualizarMovimentacao,
  onEditarMovimentacao,
  onConfirmarMovimentacao,
  onExcluirMovimentacao
}: TabelaMovimentacoesProps) {
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(50);
  const [ordenacao, setOrdenacao] = useState<{
    campo: OrdenacaoTipo;
    direcao: DirecaoOrdenacao;
  }>({
    campo: 'data',
    direcao: 'desc'
  });

  // Filtrar movimentações por busca
  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter(mov => 
      mov.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      mov.categoria.toLowerCase().includes(busca.toLowerCase()) ||
      mov.fornecedor_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      mov.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
      mov.documento_referencia?.toLowerCase().includes(busca.toLowerCase())
    );
  }, [movimentacoes, busca]);

  // Ordenar movimentações
  const movimentacoesOrdenadas = useMemo(() => {
    return [...movimentacoesFiltradas].sort((a, b) => {
      let resultado = 0;
      
      switch (ordenacao.campo) {
        case 'data':
          resultado = a.data.getTime() - b.data.getTime();
          break;
        case 'descricao':
          resultado = a.descricao.localeCompare(b.descricao);
          break;
        case 'categoria':
          resultado = a.categoria.localeCompare(b.categoria);
          break;
        case 'tipo':
          resultado = a.tipo.localeCompare(b.tipo);
          break;
        case 'valor':
          resultado = a.valor - b.valor;
          break;
        case 'status':
          resultado = a.status.localeCompare(b.status);
          break;
        case 'saldo_acumulado':
          resultado = a.saldo_acumulado - b.saldo_acumulado;
          break;
        default:
          resultado = 0;
      }
      
      return ordenacao.direcao === 'asc' ? resultado : -resultado;
    });
  }, [movimentacoesFiltradas, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(movimentacoesOrdenadas.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const movimentacoesPaginadas = movimentacoesOrdenadas.slice(indiceInicio, indiceFim);

  const handleOrdenar = (campo: OrdenacaoTipo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getIconeOrdenacao = (campo: OrdenacaoTipo) => {
    if (ordenacao.campo !== campo) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return ordenacao.direcao === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const formatarValor = (valor: number, tipo: MovimentacaoFluxo['tipo']) => {
    const valorFormatado = valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    
    if (tipo === 'entrada') {
      return `+${valorFormatado}`;
    } else if (tipo === 'saida') {
      return `-${valorFormatado}`;
    }
    return valorFormatado;
  };

  const truncarTexto = (texto: string, tamanho: number = 40) => {
    return texto.length > tamanho ? `${texto.substring(0, tamanho)}...` : texto;
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <List className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Movimentações Detalhadas
              </CardTitle>
              <p className="text-sm text-gray-500">
                {movimentacoesFiltradas.length} movimentação{movimentacoesFiltradas.length !== 1 ? 'ões' : ''} encontrada{movimentacoesFiltradas.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Resumo rápido */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Entradas</p>
              <p className="font-semibold text-green-600">
                {movimentacoesFiltradas
                  .filter(m => m.tipo === 'entrada')
                  .reduce((sum, m) => sum + m.valor, 0)
                  .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Saídas</p>
              <p className="font-semibold text-red-600">
                {movimentacoesFiltradas
                  .filter(m => m.tipo === 'saida')
                  .reduce((sum, m) => sum + m.valor, 0)
                  .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>
        
        {/* Busca */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar movimentações..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl"
            />
          </div>
          
          <Button 
            variant="outline"
            size="sm"
            className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Tabela Desktop */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200/50">
                <TableHead className="w-24">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOrdenar('data')}
                    className="h-8 p-0 font-medium text-gray-600 hover:text-gray-800"
                  >
                    Data
                    {getIconeOrdenacao('data')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOrdenar('descricao')}
                    className="h-8 p-0 font-medium text-gray-600 hover:text-gray-800"
                  >
                    Descrição
                    {getIconeOrdenacao('descricao')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOrdenar('categoria')}
                    className="h-8 p-0 font-medium text-gray-600 hover:text-gray-800"
                  >
                    Categoria
                    {getIconeOrdenacao('categoria')}
                  </Button>
                </TableHead>
                <TableHead className="w-20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOrdenar('tipo')}
                    className="h-8 p-0 font-medium text-gray-600 hover:text-gray-800"
                  >
                    Tipo
                    {getIconeOrdenacao('tipo')}
                  </Button>
                </TableHead>
                <TableHead className="text-right w-32">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOrdenar('valor')}
                    className="h-8 p-0 font-medium text-gray-600 hover:text-gray-800"
                  >
                    Valor
                    {getIconeOrdenacao('valor')}
                  </Button>
                </TableHead>
                <TableHead className="w-24">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOrdenar('status')}
                    className="h-8 p-0 font-medium text-gray-600 hover:text-gray-800"
                  >
                    Status
                    {getIconeOrdenacao('status')}
                  </Button>
                </TableHead>
                <TableHead className="text-right w-32">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOrdenar('saldo_acumulado')}
                    className="h-8 p-0 font-medium text-gray-600 hover:text-gray-800"
                  >
                    Saldo Acum.
                    {getIconeOrdenacao('saldo_acumulado')}
                  </Button>
                </TableHead>
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentacoesPaginadas.map((movimentacao) => (
                <TableRow key={movimentacao.id} className="border-gray-200/50 hover:bg-gray-50/50">
                  <TableCell>
                    <div className="text-sm">
                      {format(movimentacao.data, 'dd/MM/yy', { locale: ptBR })}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800 text-sm" title={movimentacao.descricao}>
                        {truncarTexto(movimentacao.descricao)}
                      </p>
                      {(movimentacao.fornecedor_nome || movimentacao.cliente_nome) && (
                        <p className="text-xs text-gray-500">
                          {movimentacao.fornecedor_nome || movimentacao.cliente_nome}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${movimentacao.categoria_cor}20`,
                        color: movimentacao.categoria_cor,
                        borderColor: `${movimentacao.categoria_cor}30`
                      }}
                    >
                      {movimentacao.categoria}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {movimentacao.tipo === 'entrada' && <span className="text-green-600">📈</span>}
                      {movimentacao.tipo === 'saida' && <span className="text-red-600">📉</span>}
                      {movimentacao.tipo === 'transferencia' && <span className="text-blue-600">🔄</span>}
                      <span className={`text-xs font-medium ${TIPO_MOVIMENTO_COLORS[movimentacao.tipo]}`}>
                        {TIPO_MOVIMENTO_LABELS[movimentacao.tipo]}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <span className={`font-semibold ${
                      movimentacao.tipo === 'entrada' ? 'text-green-600' :
                      movimentacao.tipo === 'saida' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {formatarValor(movimentacao.valor, movimentacao.tipo)}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`${STATUS_MOVIMENTO_COLORS[movimentacao.status]} text-xs font-medium`}
                    >
                      {STATUS_MOVIMENTO_LABELS[movimentacao.status]}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <span className={`font-medium text-sm ${
                      movimentacao.saldo_acumulado >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movimentacao.saldo_acumulado.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onVisualizarMovimentacao?.(movimentacao)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        {movimentacao.status === 'previsto' && movimentacao.origem === 'manual' && (
                          <DropdownMenuItem onClick={() => onEditarMovimentacao?.(movimentacao)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {movimentacao.status === 'previsto' && (
                          <DropdownMenuItem onClick={() => onConfirmarMovimentacao?.(movimentacao)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirmar
                          </DropdownMenuItem>
                        )}
                        {movimentacao.origem === 'manual' && (
                          <DropdownMenuItem 
                            onClick={() => onExcluirMovimentacao?.(movimentacao)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Cards Mobile */}
        <div className="md:hidden space-y-3">
          {movimentacoesPaginadas.map((movimentacao) => (
            <Card key={movimentacao.id} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800 text-sm">
                        {movimentacao.descricao}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(movimentacao.data, 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${
                      movimentacao.tipo === 'entrada' ? 'text-green-600' :
                      movimentacao.tipo === 'saida' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {formatarValor(movimentacao.valor, movimentacao.tipo)}
                    </span>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${movimentacao.categoria_cor}20`,
                          color: movimentacao.categoria_cor
                        }}
                      >
                        {movimentacao.categoria}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`${STATUS_MOVIMENTO_COLORS[movimentacao.status]} text-xs`}
                      >
                        {STATUS_MOVIMENTO_LABELS[movimentacao.status]}
                      </Badge>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onVisualizarMovimentacao?.(movimentacao)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Footer */}
                  <div className="flex justify-between items-center text-sm text-gray-500 pt-2 border-t border-gray-200/50">
                    <span>
                      Saldo: {movimentacao.saldo_acumulado.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </span>
                    <span className={TIPO_MOVIMENTO_COLORS[movimentacao.tipo]}>
                      {TIPO_MOVIMENTO_LABELS[movimentacao.tipo]}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50">
            <div className="text-sm text-gray-500">
              Mostrando {indiceInicio + 1}-{Math.min(indiceFim, movimentacoesOrdenadas.length)} de {movimentacoesOrdenadas.length} registros
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(1)}
                disabled={paginaAtual === 1}
                className="hidden sm:flex"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pagina;
                  if (totalPaginas <= 5) {
                    pagina = i + 1;
                  } else if (paginaAtual <= 3) {
                    pagina = i + 1;
                  } else if (paginaAtual >= totalPaginas - 2) {
                    pagina = totalPaginas - 4 + i;
                  } else {
                    pagina = paginaAtual - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pagina}
                      variant={paginaAtual === pagina ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaginaAtual(pagina)}
                      className="w-8 h-8 p-0"
                    >
                      {pagina}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(totalPaginas)}
                disabled={paginaAtual === totalPaginas}
                className="hidden sm:flex"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}