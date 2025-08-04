import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVendas } from '@/hooks/useVendas';
import { formatarMoeda, formatarPercentual } from '@/utils/formatters';
import { 
  TrendingUp, TrendingDown, Target, Clock, 
  Users, Calendar, DollarSign, BarChart3,
  AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MetricaPerformance {
  id: string;
  nome: string;
  valor: number;
  meta: number;
  formato: 'moeda' | 'numero' | 'percentual';
  tendencia: 'up' | 'down' | 'stable';
  variacao: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
}

interface InsightAutomatico {
  tipo: 'positivo' | 'neutro' | 'atencao';
  titulo: string;
  descricao: string;
  acao?: string;
}

export function AnalisePerformance() {
  const { vendas } = useVendas();
  const [metricas, setMetricas] = useState<MetricaPerformance[]>([]);
  const [insights, setInsights] = useState<InsightAutomatico[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (vendas.length === 0) return;

    const agora = new Date();
    const diasPeriodo = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90;
    const dataInicio = new Date(agora.getTime() - diasPeriodo * 24 * 60 * 60 * 1000);
    
    const vendasPeriodo = vendas.filter(v => 
      new Date(v.data_venda) >= dataInicio && v.ativo
    );

    const vendasPeriodoAnterior = vendas.filter(v => {
      const dataVenda = new Date(v.data_venda);
      const inicioAnterior = new Date(dataInicio.getTime() - diasPeriodo * 24 * 60 * 60 * 1000);
      return dataVenda >= inicioAnterior && dataVenda < dataInicio && v.ativo;
    });

    // Calcular métricas
    const totalVendas = vendasPeriodo.length;
    const totalVendasAnterior = vendasPeriodoAnterior.length;
    const faturamento = vendasPeriodo.reduce((sum, v) => sum + v.valor_final, 0);
    const faturamentoAnterior = vendasPeriodoAnterior.reduce((sum, v) => sum + v.valor_final, 0);
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;
    const ticketMedioAnterior = totalVendasAnterior > 0 ? faturamentoAnterior / totalVendasAnterior : 0;
    
    const clientesUnicos = new Set(vendasPeriodo.map(v => v.cliente_id)).size;
    const clientesUnicosAnterior = new Set(vendasPeriodoAnterior.map(v => v.cliente_id)).size;

    const novasMetricas: MetricaPerformance[] = [
      {
        id: 'faturamento',
        nome: 'Faturamento',
        valor: faturamento,
        meta: faturamentoAnterior * 1.1, // Meta: 10% de crescimento
        formato: 'moeda',
        tendencia: faturamento >= faturamentoAnterior ? 'up' : 'down',
        variacao: faturamentoAnterior > 0 ? ((faturamento - faturamentoAnterior) / faturamentoAnterior) * 100 : 0,
        status: faturamento >= faturamentoAnterior * 1.2 ? 'excelente' : 
                faturamento >= faturamentoAnterior * 1.1 ? 'bom' :
                faturamento >= faturamentoAnterior * 0.9 ? 'atencao' : 'critico'
      },
      {
        id: 'vendas',
        nome: 'Total de Vendas',
        valor: totalVendas,
        meta: Math.round(totalVendasAnterior * 1.15), // Meta: 15% de crescimento
        formato: 'numero',
        tendencia: totalVendas >= totalVendasAnterior ? 'up' : 'down',
        variacao: totalVendasAnterior > 0 ? ((totalVendas - totalVendasAnterior) / totalVendasAnterior) * 100 : 0,
        status: totalVendas >= totalVendasAnterior * 1.2 ? 'excelente' : 
                totalVendas >= totalVendasAnterior * 1.1 ? 'bom' :
                totalVendas >= totalVendasAnterior * 0.9 ? 'atencao' : 'critico'
      },
      {
        id: 'ticket_medio',
        nome: 'Ticket Médio',
        valor: ticketMedio,
        meta: ticketMedioAnterior * 1.05, // Meta: 5% de crescimento
        formato: 'moeda',
        tendencia: ticketMedio >= ticketMedioAnterior ? 'up' : 'down',
        variacao: ticketMedioAnterior > 0 ? ((ticketMedio - ticketMedioAnterior) / ticketMedioAnterior) * 100 : 0,
        status: ticketMedio >= ticketMedioAnterior * 1.1 ? 'excelente' : 
                ticketMedio >= ticketMedioAnterior * 1.05 ? 'bom' :
                ticketMedio >= ticketMedioAnterior * 0.95 ? 'atencao' : 'critico'
      },
      {
        id: 'clientes',
        nome: 'Clientes Únicos',
        valor: clientesUnicos,
        meta: Math.round(clientesUnicosAnterior * 1.1), // Meta: 10% de crescimento
        formato: 'numero',
        tendencia: clientesUnicos >= clientesUnicosAnterior ? 'up' : 'down',
        variacao: clientesUnicosAnterior > 0 ? ((clientesUnicos - clientesUnicosAnterior) / clientesUnicosAnterior) * 100 : 0,
        status: clientesUnicos >= clientesUnicosAnterior * 1.15 ? 'excelente' : 
                clientesUnicos >= clientesUnicosAnterior * 1.1 ? 'bom' :
                clientesUnicos >= clientesUnicosAnterior * 0.9 ? 'atencao' : 'critico'
      }
    ];

    setMetricas(novasMetricas);

    // Gerar insights automáticos
    const novosInsights: InsightAutomatico[] = [];

    // Insight sobre crescimento
    if (novasMetricas[0].variacao > 20) {
      novosInsights.push({
        tipo: 'positivo',
        titulo: 'Crescimento Excepcional!',
        descricao: `Faturamento cresceu ${formatarPercentual(novasMetricas[0].variacao)} em relação ao período anterior.`,
        acao: 'Continue com as estratégias atuais e considere expandir.'
      });
    } else if (novasMetricas[0].variacao < -10) {
      novosInsights.push({
        tipo: 'atencao',
        titulo: 'Queda no Faturamento',
        descricao: `Faturamento reduziu ${formatarPercentual(Math.abs(novasMetricas[0].variacao))} comparado ao período anterior.`,
        acao: 'Revisar estratégias de vendas e promoções.'
      });
    }

    // Insight sobre ticket médio
    if (novasMetricas[2].variacao > 10) {
      novosInsights.push({
        tipo: 'positivo',
        titulo: 'Ticket Médio em Alta',
        descricao: `Clientes estão comprando mais por transação (${formatarPercentual(novasMetricas[2].variacao)} de aumento).`,
        acao: 'Aproveite para fazer cross-selling.'
      });
    }

    // Insight sobre novos clientes vs recorrentes
    const clientesRecorrentes = vendasPeriodo.filter(v => 
      vendasPeriodoAnterior.some(va => va.cliente_id === v.cliente_id)
    );
    const taxaRecorrencia = clientesUnicos > 0 ? (clientesRecorrentes.length / vendasPeriodo.length) * 100 : 0;

    if (taxaRecorrencia > 60) {
      novosInsights.push({
        tipo: 'positivo',
        titulo: 'Alta Fidelização',
        descricao: `${formatarPercentual(taxaRecorrencia)} das vendas são de clientes recorrentes.`,
        acao: 'Implemente programa de fidelidade.'
      });
    } else if (taxaRecorrencia < 30) {
      novosInsights.push({
        tipo: 'atencao',
        titulo: 'Baixa Recorrência',
        descricao: `Apenas ${formatarPercentual(taxaRecorrencia)} das vendas são de clientes recorrentes.`,
        acao: 'Foque em estratégias de retenção.'
      });
    }

    setInsights(novosInsights);

    // Dados para gráfico de evolução diária
    const diasGrafico = [];
    for (let i = diasPeriodo - 1; i >= 0; i--) {
      const data = new Date(agora.getTime() - i * 24 * 60 * 60 * 1000);
      const vendasDia = vendasPeriodo.filter(v => 
        new Date(v.data_venda).toDateString() === data.toDateString()
      );
      
      diasGrafico.push({
        data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        vendas: vendasDia.length,
        faturamento: vendasDia.reduce((sum, v) => sum + v.valor_final, 0)
      });
    }

    setDadosGrafico(diasGrafico);
  }, [vendas, periodo]);

  const formatarValor = (valor: number, formato: string) => {
    switch (formato) {
      case 'moeda': return formatarMoeda(valor);
      case 'percentual': return formatarPercentual(valor);
      default: return valor.toLocaleString('pt-BR');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excelente': return 'text-green-600 bg-green-50';
      case 'bom': return 'text-blue-600 bg-blue-50';
      case 'atencao': return 'text-yellow-600 bg-yellow-50';
      case 'critico': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getInsightIcon = (tipo: string) => {
    switch (tipo) {
      case 'positivo': return CheckCircle;
      case 'atencao': return AlertTriangle;
      default: return Info;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Análise de Performance</h2>
        <div className="flex space-x-2">
          {[
            { key: '7d', label: '7 dias' },
            { key: '30d', label: '30 dias' },
            { key: '90d', label: '90 dias' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={periodo === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriodo(key as any)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="metricas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="metricas" className="space-y-6">
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricas.map((metrica) => (
              <Card key={metrica.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metrica.nome}
                    </CardTitle>
                    <Badge className={getStatusColor(metrica.status)}>
                      {metrica.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {formatarValor(metrica.valor, metrica.formato)}
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      {metrica.tendencia === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : metrica.tendencia === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : (
                        <Target className="w-4 h-4 text-gray-600" />
                      )}
                      <span className={`${
                        metrica.variacao >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metrica.variacao >= 0 ? '+' : ''}{formatarPercentual(metrica.variacao)}
                      </span>
                      <span className="text-muted-foreground">vs período anterior</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Meta: {formatarValor(metrica.meta, metrica.formato)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progresso das Metas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Progresso das Metas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metricas.map((metrica) => {
                  const progresso = Math.min((metrica.valor / metrica.meta) * 100, 100);
                  return (
                    <div key={metrica.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{metrica.nome}</span>
                        <span>{formatarPercentual(progresso)} da meta</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progresso >= 100 ? 'bg-green-500' :
                            progresso >= 80 ? 'bg-blue-500' :
                            progresso >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(progresso, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-4">
            {insights.map((insight, index) => {
              const IconeInsight = getInsightIcon(insight.tipo);
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${
                        insight.tipo === 'positivo' ? 'bg-green-100' :
                        insight.tipo === 'atencao' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        <IconeInsight className={`w-5 h-5 ${
                          insight.tipo === 'positivo' ? 'text-green-600' :
                          insight.tipo === 'atencao' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{insight.titulo}</h3>
                        <p className="text-muted-foreground mt-1">{insight.descricao}</p>
                        {insight.acao && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium">💡 Ação recomendada:</p>
                            <p className="text-sm text-muted-foreground">{insight.acao}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="evolucao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Vendas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Evolução de Vendas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="vendas" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Faturamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Evolução do Faturamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatarMoeda(value), 'Faturamento']}
                    />
                    <Bar 
                      dataKey="faturamento" 
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}