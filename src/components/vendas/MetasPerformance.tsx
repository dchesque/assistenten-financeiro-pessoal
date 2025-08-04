import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Settings,
  Plus,
  Edit,
  Save,
  X,
  Calendar,
  DollarSign,
  BarChart3,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda } from '@/utils/formatters';

interface Meta {
  id: string;
  vendedor: string;
  metaMensal: number;
  metaTrimestral: number;
  metaAnual: number;
  periodo: 'mensal' | 'trimestral' | 'anual';
  ativa: boolean;
  criadaEm: Date;
}

interface PerformanceVendedor {
  vendedor: string;
  metaAtual: number;
  vendidoAtual: number;
  percentualAlcancado: number;
  vendasQuantidade: number;
  comissaoTotal: number;
  ticketMedio: number;
  tendencia: 'crescendo' | 'estavel' | 'decrescendo';
  posicaoRanking: number;
}

interface MetasPerformanceProps {
  vendedores: string[];
  vendas: any[];
  className?: string;
}

export function MetasPerformance({ vendedores, vendas, className = '' }: MetasPerformanceProps) {
  const { toast } = useToast();
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [performances, setPerformances] = useState<PerformanceVendedor[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoMeta, setEditandoMeta] = useState<Meta | null>(null);
  const [periodoVisualizado, setPeriodoVisualizado] = useState<'mensal' | 'trimestral' | 'anual'>('mensal');

  const [novaMeta, setNovaMeta] = useState({
    vendedor: '',
    metaMensal: 0,
    metaTrimestral: 0,
    metaAnual: 0,
    periodo: 'mensal' as 'mensal' | 'trimestral' | 'anual'
  });

  useEffect(() => {
    carregarMetas();
  }, []);

  useEffect(() => {
    if (metas.length > 0 && vendas.length > 0) {
      calcularPerformances();
    }
  }, [metas, vendas, periodoVisualizado]);

  const carregarMetas = () => {
    // Simular carregamento de metas do localStorage ou API
    const metasSalvas = localStorage.getItem('metas-vendedores');
    if (metasSalvas) {
      const metasParseadas = JSON.parse(metasSalvas).map((meta: any) => ({
        ...meta,
        criadaEm: new Date(meta.criadaEm)
      }));
      setMetas(metasParseadas);
    } else {
      // Criar metas padrão para vendedores existentes
      const metasDefault = vendedores.map(vendedor => ({
        id: `meta-${vendedor}-${Date.now()}`,
        vendedor,
        metaMensal: 30000,
        metaTrimestral: 90000,
        metaAnual: 360000,
        periodo: 'mensal' as const,
        ativa: true,
        criadaEm: new Date()
      }));
      setMetas(metasDefault);
      salvarMetas(metasDefault);
    }
  };

  const salvarMetas = (metasParaSalvar: Meta[]) => {
    localStorage.setItem('metas-vendedores', JSON.stringify(metasParaSalvar));
  };

  const calcularPerformances = () => {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioTrimestre = new Date(agora.getFullYear(), Math.floor(agora.getMonth() / 3) * 3, 1);
    const inicioAno = new Date(agora.getFullYear(), 0, 1);

    const performancesCalculadas = metas
      .filter(meta => meta.ativa)
      .map(meta => {
        // Filtrar vendas do período
        let vendasPeriodo = vendas.filter(venda => {
          const dataVenda = new Date(venda.data_venda);
          if (periodoVisualizado === 'mensal') {
            return dataVenda >= inicioMes && venda.vendedor === meta.vendedor;
          } else if (periodoVisualizado === 'trimestral') {
            return dataVenda >= inicioTrimestre && venda.vendedor === meta.vendedor;
          } else {
            return dataVenda >= inicioAno && venda.vendedor === meta.vendedor;
          }
        });

        const vendidoAtual = vendasPeriodo.reduce((sum, venda) => sum + Number(venda.valor_liquido || venda.valor_final), 0);
        const vendasQuantidade = vendasPeriodo.length;
        const comissaoTotal = vendasPeriodo.reduce((sum, venda) => sum + Number(venda.comissao_valor || 0), 0);
        const ticketMedio = vendasQuantidade > 0 ? vendidoAtual / vendasQuantidade : 0;

        let metaAtual = meta.metaMensal;
        if (periodoVisualizado === 'trimestral') metaAtual = meta.metaTrimestral;
        if (periodoVisualizado === 'anual') metaAtual = meta.metaAnual;

        const percentualAlcancado = (vendidoAtual / metaAtual) * 100;

        // Calcular tendência (comparar com período anterior)
        let tendencia: 'crescendo' | 'estavel' | 'decrescendo' = 'estavel';
        // Simplificado - pode ser melhorado com dados reais do período anterior
        if (percentualAlcancado > 80) tendencia = 'crescendo';
        else if (percentualAlcancado < 50) tendencia = 'decrescendo';

        return {
          vendedor: meta.vendedor,
          metaAtual,
          vendidoAtual,
          percentualAlcancado,
          vendasQuantidade,
          comissaoTotal,
          ticketMedio,
          tendencia,
          posicaoRanking: 0 // Será calculado após ordenação
        };
      })
      .sort((a, b) => b.percentualAlcancado - a.percentualAlcancado)
      .map((performance, index) => ({ ...performance, posicaoRanking: index + 1 }));

    setPerformances(performancesCalculadas);
  };

  const handleSalvarMeta = () => {
    try {
      if (!novaMeta.vendedor || novaMeta.metaMensal <= 0) {
        toast({
          title: "Erro",
          description: "Vendedor e meta mensal são obrigatórios",
          variant: "destructive"
        });
        return;
      }

      const meta: Meta = {
        id: editandoMeta?.id || `meta-${novaMeta.vendedor}-${Date.now()}`,
        vendedor: novaMeta.vendedor,
        metaMensal: novaMeta.metaMensal,
        metaTrimestral: novaMeta.metaTrimestral || novaMeta.metaMensal * 3,
        metaAnual: novaMeta.metaAnual || novaMeta.metaMensal * 12,
        periodo: novaMeta.periodo,
        ativa: true,
        criadaEm: editandoMeta?.criadaEm || new Date()
      };

      let novasMetas: Meta[];
      if (editandoMeta) {
        novasMetas = metas.map(m => m.id === editandoMeta.id ? meta : m);
      } else {
        novasMetas = [...metas, meta];
      }

      setMetas(novasMetas);
      salvarMetas(novasMetas);

      toast({
        title: "Sucesso",
        description: `Meta ${editandoMeta ? 'atualizada' : 'criada'} com sucesso!`
      });

      setModalAberto(false);
      setEditandoMeta(null);
      setNovaMeta({ vendedor: '', metaMensal: 0, metaTrimestral: 0, metaAnual: 0, periodo: 'mensal' });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar meta",
        variant: "destructive"
      });
    }
  };

  const handleEditarMeta = (meta: Meta) => {
    setEditandoMeta(meta);
    setNovaMeta({
      vendedor: meta.vendedor,
      metaMensal: meta.metaMensal,
      metaTrimestral: meta.metaTrimestral,
      metaAnual: meta.metaAnual,
      periodo: meta.periodo
    });
    setModalAberto(true);
  };

  const handleDesativarMeta = (metaId: string) => {
    const novasMetas = metas.map(meta => 
      meta.id === metaId ? { ...meta, ativa: false } : meta
    );
    setMetas(novasMetas);
    salvarMetas(novasMetas);

    toast({
      title: "Meta Desativada",
      description: "Meta foi desativada com sucesso"
    });
  };

  const obterCorPorPerformance = (percentual: number) => {
    if (percentual >= 100) return 'text-green-600 bg-green-50 border-green-200';
    if (percentual >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentual >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const obterIconeTendencia = (tendencia: string) => {
    switch (tendencia) {
      case 'crescendo': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decrescendo': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Target className="w-6 h-6 mr-2 text-blue-600" />
            Metas e Performance
          </h2>
          <p className="text-gray-600 mt-1">Acompanhe o desempenho da equipe de vendas</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Seletor de Período */}
          <Select value={periodoVisualizado} onValueChange={setPeriodoVisualizado as any}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>

          {/* Botão Nova Meta */}
          <Dialog open={modalAberto} onOpenChange={setModalAberto}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>
                  {editandoMeta ? 'Editar Meta' : 'Nova Meta de Vendas'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Vendedor</Label>
                  <Select value={novaMeta.vendedor} onValueChange={(value) => setNovaMeta(prev => ({ ...prev, vendedor: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendedores.map(vendedor => (
                        <SelectItem key={vendedor} value={vendedor}>{vendedor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Meta Mensal</Label>
                    <Input
                      type="number"
                      value={novaMeta.metaMensal}
                      onChange={(e) => setNovaMeta(prev => ({ ...prev, metaMensal: Number(e.target.value) }))}
                      placeholder="30000"
                    />
                  </div>

                  <div>
                    <Label>Meta Trimestral</Label>
                    <Input
                      type="number"
                      value={novaMeta.metaTrimestral}
                      onChange={(e) => setNovaMeta(prev => ({ ...prev, metaTrimestral: Number(e.target.value) }))}
                      placeholder="90000"
                    />
                  </div>

                  <div>
                    <Label>Meta Anual</Label>
                    <Input
                      type="number"
                      value={novaMeta.metaAnual}
                      onChange={(e) => setNovaMeta(prev => ({ ...prev, metaAnual: Number(e.target.value) }))}
                      placeholder="360000"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setModalAberto(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSalvarMeta}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performances.map((performance) => (
          <Card key={performance.vendedor} className={`hover:shadow-lg transition-all duration-300 border-2 ${obterCorPorPerformance(performance.percentualAlcancado)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Badge className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-xs font-bold">
                    #{performance.posicaoRanking}
                  </Badge>
                  {performance.vendedor}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {obterIconeTendencia(performance.tendencia)}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditarMeta(metas.find(m => m.vendedor === performance.vendedor)!)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Meta {periodoVisualizado}</span>
                  <span className="font-bold">{performance.percentualAlcancado.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={Math.min(performance.percentualAlcancado, 100)} 
                  className="h-2 mb-2"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{formatarMoeda(performance.vendidoAtual)}</span>
                  <span>{formatarMoeda(performance.metaAtual)}</span>
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Vendas</div>
                  <div className="font-bold flex items-center">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {performance.vendasQuantidade}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Comissão</div>
                  <div className="font-bold flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {formatarMoeda(performance.comissaoTotal)}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-600">Ticket Médio</div>
                  <div className="font-bold">{formatarMoeda(performance.ticketMedio)}</div>
                </div>
              </div>

              {/* Status */}
              <div className="pt-2 border-t">
                <Badge 
                  variant={performance.percentualAlcancado >= 100 ? 'default' : 'outline'}
                  className={`w-full justify-center ${
                    performance.percentualAlcancado >= 100 ? 'bg-green-600 text-white' :
                    performance.percentualAlcancado >= 75 ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}
                >
                  {performance.percentualAlcancado >= 100 ? (
                    <>
                      <Award className="w-3 h-3 mr-1" />
                      Meta Alcançada!
                    </>
                  ) : (
                    `Faltam ${formatarMoeda(performance.metaAtual - performance.vendidoAtual)}`
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo Geral */}
      {performances.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 text-indigo-600 mr-2" />
              Resumo da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-900">
                  {performances.filter(p => p.percentualAlcancado >= 100).length}
                </div>
                <div className="text-sm text-indigo-600">Metas Alcançadas</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-900">
                  {(performances.reduce((sum, p) => sum + p.percentualAlcancado, 0) / performances.length).toFixed(1)}%
                </div>
                <div className="text-sm text-indigo-600">Performance Média</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-900">
                  {formatarMoeda(performances.reduce((sum, p) => sum + p.vendidoAtual, 0))}
                </div>
                <div className="text-sm text-indigo-600">Total Vendido</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-900">
                  {formatarMoeda(performances.reduce((sum, p) => sum + p.comissaoTotal, 0))}
                </div>
                <div className="text-sm text-indigo-600">Total Comissões</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}