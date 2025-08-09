import { useState, useEffect } from 'react';
import { X, Filter, Download, GitMerge, Plus, Link2, EyeOff } from 'lucide-react';
import { Banco, MovimentacaoOFX, STATUS_PROCESSAMENTO_LABELS } from '../../types/banco';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatarMoeda, formatarData } from '../../utils/formatters';
import { useMovimentacaoOFX } from '../../hooks/useMovimentacaoOFX';

interface ExtratoOFXModalProps {
  isOpen: boolean;
  onClose: () => void;
  banco: Banco;
  onCriarConta: (movimentacao: MovimentacaoOFX) => void;
  onVincularConta: (movimentacao: MovimentacaoOFX) => void;
  onIgnorar: (movimentacao: MovimentacaoOFX) => void;
}

export function ExtratoOFXModal({ 
  isOpen, 
  onClose, 
  banco, 
  onCriarConta, 
  onVincularConta, 
  onIgnorar 
}: ExtratoOFXModalProps) {
  const { movimentacoes, loading, vincularContaPagar, marcarComoIgnorada } = useMovimentacaoOFX(banco.id.toString());
  
  const [filtros, setFiltros] = useState({
    status: 'todos',
    tipo: 'todos',
    busca: '',
    valorMin: '',
    valorMax: ''
  });

  // Função para converter MovimentacaoOFXSupabase para MovimentacaoOFX
  const converterMovimentacao = (mov: any): MovimentacaoOFX => ({
    id: mov.id,
    banco_id: mov.banco_id,
    fitid: mov.fitid || '',
    data_transacao: mov.data_transacao,
    data_processamento: mov.data_processamento,
    tipo: mov.tipo,
    valor: mov.valor,
    descricao_original: mov.descricao,
    descricao_limpa: mov.descricao,
    status_processamento: mov.status_conciliacao === 'conciliado' ? 'vinculado' : 
                         mov.status_conciliacao === 'divergente' ? 'ignorado' : 'pendente',
    conta_pagar_id: mov.conta_pagar_id,
    observacoes: mov.categoria_automatica,
    created_at: mov.created_at
  });

  const movimentacoesConvertidas = movimentacoes.map(converterMovimentacao);
  
  const movimentacoesFiltradas = movimentacoesConvertidas.filter(mov => {
    const matchStatus = filtros.status === 'todos' || mov.status_processamento === filtros.status;
    const matchTipo = filtros.tipo === 'todos' || mov.tipo === filtros.tipo;
    const matchBusca = !filtros.busca || 
      mov.descricao_limpa.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      mov.descricao_original.toLowerCase().includes(filtros.busca.toLowerCase());
    const matchValorMin = !filtros.valorMin || mov.valor >= parseFloat(filtros.valorMin);
    const matchValorMax = !filtros.valorMax || mov.valor <= parseFloat(filtros.valorMax);
    
    return matchStatus && matchTipo && matchBusca && matchValorMin && matchValorMax;
  });

  const handleCriarConta = async (movimentacao: MovimentacaoOFX) => {
    onCriarConta(movimentacao);
  };

  const handleVincularConta = async (movimentacao: MovimentacaoOFX) => {
    onVincularConta(movimentacao);
  };

  const handleIgnorar = async (movimentacao: MovimentacaoOFX) => {
    await marcarComoIgnorada(movimentacao.id.toString(), 'Ignorada pelo usuário');
    onIgnorar(movimentacao);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pendente: 'bg-yellow-100/80 text-yellow-700',
      vinculado: 'bg-green-100/80 text-green-700',
      conta_criada: 'bg-blue-100/80 text-blue-700',
      ignorado: 'bg-gray-100/80 text-gray-700'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        <div className={`w-2 h-2 rounded-full mr-2 ${
          status === 'pendente' ? 'bg-yellow-600' :
          status === 'vinculado' ? 'bg-green-600' :
          status === 'conta_criada' ? 'bg-blue-600' :
          'bg-gray-600'
        }`}></div>
        {STATUS_PROCESSAMENTO_LABELS[status as keyof typeof STATUS_PROCESSAMENTO_LABELS]}
      </Badge>
    );
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'debito' ? 'text-red-600' : 'text-green-600';
  };

  const calcularTotais = () => {
    const creditos = movimentacoesFiltradas
      .filter(m => m.tipo === 'credito')
      .reduce((sum, m) => sum + m.valor, 0);
    
    const debitos = movimentacoesFiltradas
      .filter(m => m.tipo === 'debito')
      .reduce((sum, m) => sum + m.valor, 0);
    
    return { creditos, debitos, total: creditos - debitos };
  };

  const totais = calcularTotais();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Extrato OFX - {banco.nome}</h2>
            <p className="text-muted-foreground">
              {banco.agencia} • {banco.conta}-{banco.digito_verificador}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Resumo do Extrato */}
        <div className="p-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-gray-200/50">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Período</p>
              <p className="font-semibold text-foreground">01/01 → 15/01</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Movimentações</p>
              <p className="font-semibold text-foreground">{movimentacoesFiltradas.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Créditos</p>
              <p className="font-semibold text-green-600">{formatarMoeda(totais.creditos)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Débitos</p>
              <p className="font-semibold text-red-600">{formatarMoeda(totais.debitos)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Saldo Final</p>
              <p className="font-semibold text-foreground">{formatarMoeda(banco.saldo_atual)}</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-foreground">Filtros</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="input-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="vinculado">Vinculados</SelectItem>
                  <SelectItem value="conta_criada">Conta Criada</SelectItem>
                  <SelectItem value="ignorado">Ignorados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tipo-filter">Tipo</Label>
              <Select value={filtros.tipo} onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger className="input-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="credito">Créditos</SelectItem>
                  <SelectItem value="debito">Débitos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="busca">Buscar</Label>
              <Input
                id="busca"
                placeholder="Descrição..."
                value={filtros.busca}
                onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                className="input-base"
              />
            </div>
            
            <div>
              <Label htmlFor="valor-min">Valor Mín.</Label>
              <Input
                id="valor-min"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filtros.valorMin}
                onChange={(e) => setFiltros(prev => ({ ...prev, valorMin: e.target.value }))}
                className="input-base"
              />
            </div>
            
            <div>
              <Label htmlFor="valor-max">Valor Máx.</Label>
              <Input
                id="valor-max"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filtros.valorMax}
                onChange={(e) => setFiltros(prev => ({ ...prev, valorMax: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Movimentações */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            <table className="w-full">
              <thead className="bg-gray-50/80 sticky top-0">
                <tr className="border-b border-gray-200/50">
                  <th className="text-left p-4 font-medium text-foreground">Data</th>
                  <th className="text-left p-4 font-medium text-foreground">Descrição</th>
                  <th className="text-left p-4 font-medium text-foreground">Tipo</th>
                  <th className="text-right p-4 font-medium text-foreground">Valor</th>
                  <th className="text-center p-4 font-medium text-foreground">Status</th>
                  <th className="text-center p-4 font-medium text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoesFiltradas.map((movimentacao) => (
                  <tr key={movimentacao.id} className="border-b border-gray-100/50 hover:bg-gray-50/30">
                    <td className="p-4 text-sm text-foreground">
                      {formatarData(movimentacao.data_transacao)}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {movimentacao.descricao_limpa}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {movimentacao.descricao_original}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm font-medium ${getTipoColor(movimentacao.tipo)}`}>
                        {movimentacao.tipo === 'debito' ? 'Débito' : 'Crédito'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-semibold ${getTipoColor(movimentacao.tipo)}`}>
                        {movimentacao.tipo === 'debito' ? '-' : '+'}{formatarMoeda(movimentacao.valor)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(movimentacao.status_processamento)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        {movimentacao.status_processamento === 'pendente' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCriarConta(movimentacao)}
                              className="h-8 px-3 text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Criar Conta
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleVincularConta(movimentacao)}
                              className="h-8 px-3 text-xs"
                            >
                              <Link2 className="w-3 h-3 mr-1" />
                              Vincular
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleIgnorar(movimentacao)}
                              className="h-8 px-3 text-xs text-gray-600"
                            >
                              <EyeOff className="w-3 h-3 mr-1" />
                              Ignorar
                            </Button>
                          </>
                        )}
                        {movimentacao.status_processamento === 'vinculado' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            disabled
                          >
                            <GitMerge className="w-3 h-3 mr-1" />
                            Vinculado
                          </Button>
                        )}
                        {movimentacao.status_processamento === 'conta_criada' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            disabled
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Conta Criada
                          </Button>
                        )}
                        {movimentacao.status_processamento === 'ignorado' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 px-3 text-xs"
                            disabled
                          >
                            <EyeOff className="w-3 h-3 mr-1" />
                            Ignorado
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {movimentacoesFiltradas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma movimentação encontrada com os filtros aplicados</p>
            </div>
          )}
        </div>

        {/* Footer - Fixo */}
        <div className="p-6 border-t border-gray-200/50 bg-gray-50/30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-muted-foreground">
                {movimentacoesFiltradas.length} movimentações
              </span>
              <span className="text-green-600">
                Créditos: {formatarMoeda(totais.creditos)}
              </span>
              <span className="text-red-600">
                Débitos: {formatarMoeda(totais.debitos)}
              </span>
              <span className="font-semibold text-foreground">
                Saldo: {formatarMoeda(totais.total)}
              </span>
            </div>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}