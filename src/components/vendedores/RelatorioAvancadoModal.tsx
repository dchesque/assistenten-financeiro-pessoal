import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Target, 
  TrendingUp, 
  Users,
  Trophy,
  DollarSign,
  CheckCircle,
  X
} from 'lucide-react';
import { useRelatorioVendedores } from '@/hooks/useRelatorioVendedores';
import { useVendedores } from '@/hooks/useVendedores';
import { formatarMoeda } from '@/utils/formatters';

interface RelatorioAvancadoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

type TipoPeriodo = 'mes_atual' | 'mes_anterior' | 'trimestre_atual' | 'semestre_atual' | 'ano_atual' | 'personalizado';

const PERIODOS_PREDEFINIDOS: Array<{ valor: TipoPeriodo; nome: string }> = [
  { valor: 'mes_atual', nome: 'Mês Atual' },
  { valor: 'mes_anterior', nome: 'Mês Anterior' },
  { valor: 'trimestre_atual', nome: 'Trimestre Atual' },
  { valor: 'semestre_atual', nome: 'Semestre Atual' },
  { valor: 'ano_atual', nome: 'Ano Atual' },
  { valor: 'personalizado', nome: 'Período Personalizado' }
];

export const RelatorioAvancadoModal: React.FC<RelatorioAvancadoModalProps> = ({
  aberto,
  onFechar
}) => {
  const { vendedores } = useVendedores();
  const { relatorio, loading, gerarRelatorio, exportarRelatorio } = useRelatorioVendedores();
  
  const [filtros, setFiltros] = useState({
    periodo: 'mes_atual' as TipoPeriodo,
    dataInicio: '',
    dataFim: '',
    vendedoresSelecionados: [] as number[],
    incluirDetalhes: false
  });

  // Calcular datas baseado no período selecionado
  useEffect(() => {
    const hoje = new Date();
    let inicio: Date, fim: Date;

    switch (filtros.periodo) {
      case 'mes_atual':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
      case 'mes_anterior':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        break;
      case 'trimestre_atual':
        const trimestreAtual = Math.floor(hoje.getMonth() / 3);
        inicio = new Date(hoje.getFullYear(), trimestreAtual * 3, 1);
        fim = new Date(hoje.getFullYear(), (trimestreAtual + 1) * 3, 0);
        break;
      case 'semestre_atual':
        const semestreAtual = Math.floor(hoje.getMonth() / 6);
        inicio = new Date(hoje.getFullYear(), semestreAtual * 6, 1);
        fim = new Date(hoje.getFullYear(), (semestreAtual + 1) * 6, 0);
        break;
      case 'ano_atual':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = new Date(hoje.getFullYear(), 11, 31);
        break;
      case 'personalizado':
        return; // Para período personalizado, não alterar
    }

    setFiltros(prev => ({
      ...prev,
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: fim.toISOString().split('T')[0]
    }));
  }, [filtros.periodo]);

  const handleGerarRelatorio = () => {
    gerarRelatorio({
      periodo_inicio: filtros.dataInicio,
      periodo_fim: filtros.dataFim,
      vendedor_ids: filtros.vendedoresSelecionados.length > 0 ? filtros.vendedoresSelecionados : undefined,
      incluir_detalhes: filtros.incluirDetalhes
    });
  };

  const toggleVendedor = (vendedorId: number) => {
    setFiltros(prev => ({
      ...prev,
      vendedoresSelecionados: prev.vendedoresSelecionados.includes(vendedorId)
        ? prev.vendedoresSelecionados.filter(id => id !== vendedorId)
        : [...prev.vendedoresSelecionados, vendedorId]
    }));
  };

  const getRankingIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Trophy className="h-5 w-5 text-orange-600" />;
      default: return <span className="text-sm font-bold text-gray-600">#{posicao}</span>;
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Relatório Avançado de Vendedores
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onFechar}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros do Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="periodo">Período</Label>
                  <Select 
                    value={filtros.periodo} 
                    onValueChange={(value: TipoPeriodo) => setFiltros(prev => ({ ...prev, periodo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODOS_PREDEFINIDOS.map(periodo => (
                        <SelectItem key={periodo.valor} value={periodo.valor}>
                          {periodo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                    disabled={filtros.periodo !== 'personalizado'}
                  />
                </div>

                <div>
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                    disabled={filtros.periodo !== 'personalizado'}
                  />
                </div>
              </div>

              {/* Seleção de vendedores */}
              {vendedores.length > 0 && (
                <div>
                  <Label>Vendedores (deixe vazio para todos)</Label>
                  <div className="mt-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {vendedores.map(vendedor => (
                        <div key={vendedor.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`vendedor-${vendedor.id}`}
                            checked={filtros.vendedoresSelecionados.includes(vendedor.id)}
                            onCheckedChange={() => toggleVendedor(vendedor.id)}
                          />
                          <Label htmlFor={`vendedor-${vendedor.id}`} className="text-sm">
                            {vendedor.nome}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incluirDetalhes"
                  checked={filtros.incluirDetalhes}
                  onCheckedChange={(checked) => 
                    setFiltros(prev => ({ ...prev, incluirDetalhes: !!checked }))
                  }
                />
                <Label htmlFor="incluirDetalhes">
                  Incluir evolução diária detalhada
                </Label>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleGerarRelatorio}
                  disabled={loading || !filtros.dataInicio || !filtros.dataFim}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {loading ? 'Processando...' : 'Gerar Relatório'}
                </Button>

                {relatorio && (
                  <Button 
                    variant="outline" 
                    onClick={exportarRelatorio}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultado do Relatório */}
          {relatorio && (
            <>
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Vendedores</p>
                        <p className="text-2xl font-bold">{relatorio.estatisticas_gerais.total_vendedores}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Faturamento Total</p>
                        <p className="text-2xl font-bold">{formatarMoeda(relatorio.estatisticas_gerais.valor_total)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ticket Médio</p>
                        <p className="text-2xl font-bold">{formatarMoeda(relatorio.estatisticas_gerais.ticket_medio)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Acima da Meta</p>
                        <p className="text-2xl font-bold">{relatorio.estatisticas_gerais.vendedores_acima_meta}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance por Vendedor</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-right">Vendas</TableHead>
                        <TableHead className="text-right">Faturamento</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                        <TableHead className="text-right">% Meta</TableHead>
                        <TableHead className="text-right">Dias Produtivos</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.performance_vendedores.map((vendedor) => (
                        <TableRow key={vendedor.vendedor_id}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getRankingIcon(vendedor.ranking_posicao)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                                  {vendedor.vendedor_nome.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{vendedor.vendedor_nome}</p>
                                <p className="text-sm text-gray-600">{vendedor.vendedor_codigo}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {vendedor.total_vendas}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatarMoeda(vendedor.valor_total_vendido)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatarMoeda(vendedor.ticket_medio)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={vendedor.percentual_meta >= 100 ? 'default' : 'secondary'}
                              className={
                                vendedor.percentual_meta >= 100 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }
                            >
                              {vendedor.percentual_meta.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {vendedor.dias_produtivos}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatarMoeda(vendedor.comissao_total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};