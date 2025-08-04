import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConciliacao } from '@/hooks/useConciliacao';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Link2, 
  Unlink,
  FileCheck,
  TrendingUp,
  DollarSign,
  Calendar,
  Loader2
} from 'lucide-react';
import type { Maquininha, ConciliacaoMaquininha } from '@/types/maquininha';
import type { ResolucaoDivergencia } from '@/types/conciliacao';

interface ConciliarMaquininhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maquininha: Maquininha | null;
  periodo: string; // "2025-01"
  conciliacao?: ConciliacaoMaquininha | null;
}

export const ConciliarMaquininhaModal = ({
  open,
  onOpenChange,
  maquininha,
  periodo,
  conciliacao
}: ConciliarMaquininhaModalProps) => {
  const {
    dadosConciliacao,
    loading,
    carregarDadosConciliacao,
    executarConciliacao,
    resolverDivergencia,
    vincularTransacoes
  } = useConciliacao();

  const [observacoes, setObservacoes] = useState('');
  const [vendaSelecionada, setVendaSelecionada] = useState<string | null>(null);
  const [recebimentoSelecionado, setRecebimentoSelecionado] = useState<string | null>(null);

  useEffect(() => {
    if (open && maquininha?.id && periodo) {
      carregarDadosConciliacao(maquininha.id, periodo);
    }
  }, [open, maquininha?.id, periodo, carregarDadosConciliacao]);

  const handleConciliarAutomaticamente = async () => {
    if (!maquininha?.id) return;
    
    try {
      await executarConciliacao(maquininha.id, periodo);
    } catch (err) {
      console.error('Erro ao conciliar:', err);
    }
  };

  const handleVincularManual = async () => {
    if (!vendaSelecionada || !recebimentoSelecionado) return;
    
    try {
      await vincularTransacoes(vendaSelecionada, recebimentoSelecionado);
      setVendaSelecionada(null);
      setRecebimentoSelecionado(null);
    } catch (err) {
      console.error('Erro ao vincular:', err);
    }
  };

  const handleResolverDivergencia = async (divergenciaId: string, tipo: ResolucaoDivergencia['tipo']) => {
    const resolucao: ResolucaoDivergencia = {
      tipo,
      motivo: observacoes || 'Resolvido manualmente',
      data_resolucao: new Date()
    };

    try {
      await resolverDivergencia(divergenciaId, resolucao);
      setObservacoes('');
    } catch (err) {
      console.error('Erro ao resolver divergência:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
      case 'conciliado':
        return <Badge className="bg-green-100/80 text-green-700">✅ Conciliado</Badge>;
      case 'divergencia':
      case 'pendente':
        return <Badge className="bg-orange-100/80 text-orange-700">⚠️ Divergência</Badge>;
      default:
        return <Badge className="bg-gray-100/80 text-gray-700">⏳ Pendente</Badge>;
    }
  };

  if (!maquininha) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <FileCheck className="w-6 h-6 text-blue-600" />
            Conciliação - {maquininha.nome}
            <Badge className="bg-blue-100/80 text-blue-700">{periodo}</Badge>
            {conciliacao && getStatusBadge(conciliacao.status)}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="space-y-6">
            {/* Resumo Geral */}
            {dadosConciliacao && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      Total Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {formatarMoeda(dadosConciliacao.resumo.total_vendas)}
                    </p>
                    <p className="text-xs text-gray-500">{dadosConciliacao.vendas.length} transações</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      Recebimentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatarMoeda(dadosConciliacao.resumo.total_recebimentos)}
                    </p>
                    <p className="text-xs text-gray-500">{dadosConciliacao.recebimentos.length} recebimentos</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      Diferença
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${dadosConciliacao.resumo.diferenca > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatarMoeda(dadosConciliacao.resumo.diferenca)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {dadosConciliacao.divergencias.length} divergências
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      Taxa Conciliação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">
                      {dadosConciliacao.resumo.taxa_conciliacao.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Automática</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                <span>Carregando dados de conciliação...</span>
              </div>
            )}

            {dadosConciliacao && (
              <Tabs defaultValue="comparativo" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
                  <TabsTrigger value="divergencias">
                    Divergências ({dadosConciliacao.divergencias.length})
                  </TabsTrigger>
                  <TabsTrigger value="matching">Matching Manual</TabsTrigger>
                </TabsList>

                <TabsContent value="comparativo" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dados de Vendas */}
                    <Card className="bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-green-600">Dados de Vendas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>NSU</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dadosConciliacao.vendas.map((venda) => (
                                <TableRow 
                                  key={venda.id}
                                  className={`cursor-pointer hover:bg-gray-50 ${
                                    vendaSelecionada === venda.id ? 'bg-blue-50' : ''
                                  }`}
                                  onClick={() => setVendaSelecionada(venda.id)}
                                >
                                  <TableCell className="font-mono text-sm">{venda.nsu}</TableCell>
                                  <TableCell>{formatarData(venda.data_venda.toISOString())}</TableCell>
                                  <TableCell>{formatarMoeda(venda.valor_liquido)}</TableCell>
                                  <TableCell>
                                    {venda.status === 'conciliado' ? (
                                      <Badge className="bg-green-100/80 text-green-700">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Conciliado
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-gray-100/80 text-gray-700">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Pendente
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Recebimentos Bancários */}
                    <Card className="bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-blue-600">Recebimentos Bancários</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dadosConciliacao.recebimentos.map((recebimento) => (
                                <TableRow 
                                  key={recebimento.id}
                                  className={`cursor-pointer hover:bg-gray-50 ${
                                    recebimentoSelecionado === recebimento.id ? 'bg-blue-50' : ''
                                  }`}
                                  onClick={() => setRecebimentoSelecionado(recebimento.id)}
                                >
                                  <TableCell>{formatarData(recebimento.data_recebimento.toISOString())}</TableCell>
                                  <TableCell>{formatarMoeda(recebimento.valor)}</TableCell>
                                  <TableCell className="truncate max-w-32">{recebimento.descricao}</TableCell>
                                  <TableCell>
                                    {recebimento.status === 'conciliado' ? (
                                      <Badge className="bg-green-100/80 text-green-700">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Conciliado
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-gray-100/80 text-gray-700">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Pendente
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="divergencias" className="space-y-4">
                  {dadosConciliacao.divergencias.length === 0 ? (
                    <Card className="bg-white/80 backdrop-blur-sm">
                      <CardContent className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-600">Nenhuma divergência encontrada!</h3>
                        <p className="text-gray-600">Todas as transações foram conciliadas automaticamente.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {dadosConciliacao.divergencias.map((divergencia) => (
                        <Card key={divergencia.id} className="bg-white/80 backdrop-blur-sm">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                {divergencia.descricao}
                              </CardTitle>
                              <Badge className={
                                divergencia.status === 'resolvida' 
                                  ? 'bg-green-100/80 text-green-700'
                                  : 'bg-orange-100/80 text-orange-700'
                              }>
                                {divergencia.status === 'resolvida' ? 'Resolvida' : 'Pendente'}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600">Valor Esperado</p>
                                <p className="font-semibold text-green-600">
                                  {formatarMoeda(divergencia.valor_esperado)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Valor Encontrado</p>
                                <p className="font-semibold text-blue-600">
                                  {formatarMoeda(divergencia.valor_encontrado)}
                                </p>
                              </div>
                            </div>
                            
                            {divergencia.status === 'pendente' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleResolverDivergencia(divergencia.id, 'justificativa')}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Justificar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleResolverDivergencia(divergencia.id, 'ajuste_manual')}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Ajustar
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="matching" className="space-y-4">
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Matching Manual de Transações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Venda Selecionada:</p>
                            <p className="font-mono text-sm">
                              {vendaSelecionada ? 
                                dadosConciliacao.vendas.find(v => v.id === vendaSelecionada)?.nsu || 'N/A'
                                : 'Nenhuma venda selecionada'
                              }
                            </p>
                          </div>
                          <Link2 className="w-6 h-6 text-blue-600" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-1">Recebimento Selecionado:</p>
                            <p className="font-mono text-sm">
                              {recebimentoSelecionado ? 
                                formatarMoeda(dadosConciliacao.recebimentos.find(r => r.id === recebimentoSelecionado)?.valor || 0)
                                : 'Nenhum recebimento selecionado'
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleVincularManual}
                            disabled={!vendaSelecionada || !recebimentoSelecionado}
                            className="bg-gradient-to-r from-blue-600 to-purple-600"
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            Vincular Selecionados
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setVendaSelecionada(null);
                              setRecebimentoSelecionado(null);
                            }}
                          >
                            <Unlink className="w-4 h-4 mr-2" />
                            Limpar Seleção
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* Observações */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm">Observações da Conciliação</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Adicione observações sobre esta conciliação..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="min-h-20"
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleConciliarAutomaticamente}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Conciliar Automaticamente
            </Button>
            <Button 
              className="bg-gradient-to-r from-green-600 to-blue-600"
              onClick={() => {
                // Implementar aprovação final
                onOpenChange(false);
              }}
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Aprovar Conciliação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};