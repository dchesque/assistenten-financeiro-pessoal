import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useConciliacao } from '@/hooks/useConciliacao';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import type { DivergenciaConciliacao, ResolucaoDivergencia } from '@/types/conciliacao';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Edit3,
  X,
  DollarSign,
  Calendar,
  Search,
  Filter
} from 'lucide-react';

interface DivergenciasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maquininhaId?: string;
  periodo?: string;
}

export function DivergenciasModal({ open, onOpenChange, maquininhaId, periodo }: DivergenciasModalProps) {
  const { 
    dadosConciliacao, 
    resolverDivergencia, 
    executarMatchingAutomatico,
    obterDivergencias,
    vincularTransacoes,
    carregarDadosConciliacao,
    loading 
  } = useConciliacao();
  const [divergenciaSelecionada, setDivergenciaSelecionada] = useState<DivergenciaConciliacao | null>(null);
  const [modalResolucao, setModalResolucao] = useState(false);
  const [modalVinculacao, setModalVinculacao] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'resolvida' | 'justificada'>('todos');
  const [busca, setBusca] = useState('');
  const [divergenciasAvancadas, setDivergenciasAvancadas] = useState<any[]>([]);

  const [resolucao, setResolucao] = useState<Partial<ResolucaoDivergencia>>({
    tipo: 'justificativa',
    motivo: '',
    valor_ajuste: 0
  });

  useEffect(() => {
    if (!open) {
      setDivergenciaSelecionada(null);
      setModalResolucao(false);
      setResolucao({
        tipo: 'justificativa',
        motivo: '',
        valor_ajuste: 0
      });
    }
  }, [open]);

  const divergenciasFiltradas = dadosConciliacao?.divergencias.filter(div => {
    const matchStatus = filtroStatus === 'todos' || div.status === filtroStatus;
    const matchBusca = !busca || div.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchStatus && matchBusca;
  }) || [];

  const handleResolverDivergencia = async () => {
    if (!divergenciaSelecionada || !resolucao.motivo) return;

    const resolucaoCompleta: ResolucaoDivergencia = {
      tipo: resolucao.tipo as 'ajuste_manual' | 'justificativa' | 'exclusao',
      motivo: resolucao.motivo,
      valor_ajuste: resolucao.valor_ajuste || 0,
      data_resolucao: new Date()
    };

    try {
      await resolverDivergencia(divergenciaSelecionada.id, resolucaoCompleta);
      setModalResolucao(false);
      setDivergenciaSelecionada(null);
    } catch (error) {
      console.error('Erro ao resolver divergência:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-orange-100/80 text-orange-700';
      case 'resolvida':
        return 'bg-green-100/80 text-green-700';
      case 'justificada':
        return 'bg-blue-100/80 text-blue-700';
      default:
        return 'bg-gray-100/80 text-gray-700';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'valor_diferente':
        return <DollarSign className="w-4 h-4" />;
      case 'data_divergente':
        return <Calendar className="w-4 h-4" />;
      case 'transacao_nao_encontrada':
        return <FileText className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl bg-white/95 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Gerenciar Divergências
            </DialogTitle>
            <DialogDescription>
              Visualize, analise e resolva divergências encontradas durante a conciliação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Ações e Filtros */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={async () => {
                    if (maquininhaId && periodo) {
                      try {
                        const resultado = await executarMatchingAutomatico(maquininhaId, periodo);
                        // Recarregar dados após matching
                        await carregarDadosConciliacao(maquininhaId, periodo);
                      } catch (error) {
                        console.error('Erro no matching:', error);
                      }
                    }
                  }}
                  disabled={loading || !maquininhaId || !periodo}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Executar Matching Automático
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="busca">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="busca"
                      placeholder="Buscar por descrição..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="status">Status</Label>
                  <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="resolvida">Resolvida</SelectItem>
                      <SelectItem value="justificada">Justificada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {dadosConciliacao?.divergencias.filter(d => d.status === 'pendente').length || 0}
                  </div>
                  <div className="text-sm text-orange-700">Pendentes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dadosConciliacao?.divergencias.filter(d => d.status === 'resolvida').length || 0}
                  </div>
                  <div className="text-sm text-green-700">Resolvidas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dadosConciliacao?.divergencias.filter(d => d.status === 'justificada').length || 0}
                  </div>
                  <div className="text-sm text-blue-700">Justificadas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatarMoeda(dadosConciliacao?.divergencias.reduce((sum, d) => 
                      sum + Math.abs(d.valor_esperado - d.valor_encontrado), 0
                    ) || 0)}
                  </div>
                  <div className="text-sm text-red-700">Valor Total</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Divergências */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Divergências ({divergenciasFiltradas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {divergenciasFiltradas.map((divergencia) => (
                      <Card key={divergencia.id} className="border-l-4 border-l-orange-400">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                {getTipoIcon(divergencia.tipo)}
                                <span className="font-medium">{divergencia.descricao}</span>
                                <Badge className={getStatusColor(divergencia.status)}>
                                  {divergencia.status === 'pendente' ? 'Pendente' : 
                                   divergencia.status === 'resolvida' ? 'Resolvida' : 'Justificada'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Valor Esperado:</span>
                                  <span className="ml-2 font-medium text-green-600">
                                    {formatarMoeda(divergencia.valor_esperado)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Valor Encontrado:</span>
                                  <span className="ml-2 font-medium text-red-600">
                                    {formatarMoeda(divergencia.valor_encontrado)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-sm text-gray-600">
                                Criada em: {formatarData(divergencia.created_at.toString())}
                              </div>

                              {divergencia.resolucao && (
                                <div className="p-3 bg-blue-50/80 rounded-lg text-sm">
                                  <strong>Resolução:</strong> {divergencia.resolucao.motivo}
                                  {divergencia.resolucao.data_resolucao && (
                                    <div className="text-gray-600">
                                      Resolvida em: {formatarData(divergencia.resolucao.data_resolucao.toString())}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {divergencia.status === 'pendente' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setDivergenciaSelecionada(divergencia);
                                  setModalResolucao(true);
                                }}
                                className="ml-4"
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Resolver
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {divergenciasFiltradas.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        Nenhuma divergência encontrada
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Resolução */}
      <Dialog open={modalResolucao} onOpenChange={setModalResolucao}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Resolver Divergência
            </DialogTitle>
            <DialogDescription>
              Defina como esta divergência deve ser tratada e resolvida
            </DialogDescription>
          </DialogHeader>

          {divergenciaSelecionada && (
            <div className="space-y-6">
              {/* Resumo da Divergência */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="font-medium">{divergenciaSelecionada.descricao}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Valor Esperado:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {formatarMoeda(divergenciaSelecionada.valor_esperado)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor Encontrado:</span>
                        <span className="ml-2 font-medium text-red-600">
                          {formatarMoeda(divergenciaSelecionada.valor_encontrado)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="text-gray-600">Diferença:</span>
                      <span className="ml-2 font-medium text-orange-600">
                        {formatarMoeda(Math.abs(divergenciaSelecionada.valor_esperado - divergenciaSelecionada.valor_encontrado))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulário de Resolução */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tipo_resolucao">Tipo de Resolução</Label>
                  <Select 
                    value={resolucao.tipo} 
                    onValueChange={(value: any) => setResolucao(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="justificativa">Justificativa</SelectItem>
                      <SelectItem value="ajuste_manual">Ajuste Manual</SelectItem>
                      <SelectItem value="exclusao">Exclusão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {resolucao.tipo === 'ajuste_manual' && (
                  <div>
                    <Label htmlFor="valor_ajuste">Valor do Ajuste</Label>
                    <Input
                      id="valor_ajuste"
                      type="number"
                      step="0.01"
                      value={resolucao.valor_ajuste || ''}
                      onChange={(e) => setResolucao(prev => ({ 
                        ...prev, 
                        valor_ajuste: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="0,00"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="motivo">Motivo/Justificativa *</Label>
                  <Textarea
                    id="motivo"
                    value={resolucao.motivo}
                    onChange={(e) => setResolucao(prev => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Descreva o motivo da resolução..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setModalResolucao(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleResolverDivergencia}
                  disabled={loading || !resolucao.motivo}
                  className="bg-gradient-to-r from-green-600 to-blue-600"
                >
                  {loading ? (
                    <>
                      <X className="w-4 h-4 mr-2 animate-spin" />
                      Resolvendo...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Resolver Divergência
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}