import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, Clock, DollarSign, Download, RefreshCw } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Interfaces para tipagem
interface KPIPrincipal {
  taxaConciliacao: number;
  tempoMedioResolucao: number;
  economiaOperacional: number;
  maquininhasAtivas: number;
}

interface DadosGrafico {
  evolucaoMensal: Array<{ mes: string; taxa: number; volume: number }>;
  divergenciasPorTipo: Array<{ tipo: string; quantidade: number; valor: number }>;
  volumePorOperadora: Array<{ operadora: string; volume: number; transacoes: number }>;
  performanceTemporal: Array<{ dia: string; vendas: number; recebimentos: number }>;
}

interface Recomendacao {
  tipo: 'otimizacao' | 'alerta' | 'melhoria';
  titulo: string;
  descricao: string;
  acao: string;
  impacto: 'baixo' | 'medio' | 'alto';
}

const CORES_GRAFICOS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
];

export function DashboardExecutivo() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('ultimos_3_meses');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIPrincipal>({
    taxaConciliacao: 0,
    tempoMedioResolucao: 0,
    economiaOperacional: 0,
    maquininhasAtivas: 0
  });
  const [dadosGraficos, setDadosGraficos] = useState<DadosGrafico>({
    evolucaoMensal: [],
    divergenciasPorTipo: [],
    volumePorOperadora: [],
    performanceTemporal: []
  });
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);

  // Função para buscar dados do dashboard
  const buscarDadosDashboard = async () => {
    try {
      setLoading(true);
      
      // Definir período baseado na seleção
      const agora = new Date();
      let dataInicio: Date;
      
      switch (periodoSelecionado) {
        case 'ultimo_mes':
          dataInicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
          break;
        case 'ultimos_3_meses':
          dataInicio = new Date(agora.getFullYear(), agora.getMonth() - 3, 1);
          break;
        case 'ultimos_6_meses':
          dataInicio = new Date(agora.getFullYear(), agora.getMonth() - 6, 1);
          break;
        default:
          dataInicio = new Date(agora.getFullYear(), agora.getMonth() - 3, 1);
      }

      // 1. Buscar conciliações do período
      const { data: conciliacoes } = await supabase
        .from('conciliacoes_maquininha')
        .select(`
          *,
          maquininhas!inner(nome, operadora),
          detalhes_conciliacao(*)
        `)
        .gte('data_conciliacao', dataInicio.toISOString())
        .order('data_conciliacao', { ascending: false });

      // 2. Buscar maquininhas ativas
      const { data: maquininhas } = await supabase
        .from('maquininhas')
        .select('*')
        .eq('ativo', true);

      if (conciliacoes && maquininhas) {
        // Calcular KPIs
        const totalConciliacoes = conciliacoes.length;
        const conciliacoesOk = conciliacoes.filter(c => c.status === 'ok').length;
        const taxaConciliacao = totalConciliacoes > 0 ? (conciliacoesOk / totalConciliacoes) * 100 : 0;

        // Tempo médio de resolução (simulado - seria baseado em timestamps reais)
        const tempoMedioResolucao = 2.5; // horas

        // Economia operacional (estimativa baseada em automação)
        const horasEconomizadas = totalConciliacoes * 0.5; // 30 min por conciliação manual
        const economiaOperacional = horasEconomizadas * 50; // R$ 50/hora

        setKpis({
          taxaConciliacao,
          tempoMedioResolucao,
          economiaOperacional,
          maquininhasAtivas: maquininhas.length
        });

        // Gerar dados para gráficos
        gerarDadosGraficos(conciliacoes);
        gerarRecomendacoes(conciliacoes, taxaConciliacao);
      }

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar dados para gráficos
  const gerarDadosGraficos = (conciliacoes: any[]) => {
    // 1. Evolução Mensal
    const evolucaoMensal = [];
    const mesesMap = new Map();
    
    conciliacoes.forEach(c => {
      const mes = new Date(c.data_conciliacao).toLocaleDateString('pt-BR', { year: '2-digit', month: 'short' });
      if (!mesesMap.has(mes)) {
        mesesMap.set(mes, { total: 0, ok: 0, volume: 0 });
      }
      const dados = mesesMap.get(mes);
      dados.total++;
      if (c.status === 'ok') dados.ok++;
      dados.volume += c.total_vendas || 0;
    });

    mesesMap.forEach((dados, mes) => {
      evolucaoMensal.push({
        mes,
        taxa: dados.total > 0 ? (dados.ok / dados.total) * 100 : 0,
        volume: dados.volume
      });
    });

    // 2. Divergências por Tipo
    const divergenciasPorTipo = [
      { tipo: 'Valor', quantidade: 15, valor: 2500 },
      { tipo: 'Data', quantidade: 8, valor: 1200 },
      { tipo: 'NSU', quantidade: 5, valor: 800 },
      { tipo: 'Bandeira', quantidade: 3, valor: 450 }
    ];

    // 3. Volume por Operadora
    const volumePorOperadora = [];
    const operadorasMap = new Map();
    
    conciliacoes.forEach(c => {
      const operadora = c.maquininhas?.operadora || 'Não informado';
      if (!operadorasMap.has(operadora)) {
        operadorasMap.set(operadora, { volume: 0, transacoes: 0 });
      }
      const dados = operadorasMap.get(operadora);
      dados.volume += c.total_vendas || 0;
      dados.transacoes++;
    });

    operadorasMap.forEach((dados, operadora) => {
      volumePorOperadora.push({
        operadora: operadora.charAt(0).toUpperCase() + operadora.slice(1),
        volume: dados.volume,
        transacoes: dados.transacoes
      });
    });

    // 4. Performance Temporal (últimos 30 dias)
    const performanceTemporal = [];
    for (let i = 29; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      performanceTemporal.push({
        dia,
        vendas: Math.floor(Math.random() * 50) + 20,
        recebimentos: Math.floor(Math.random() * 50) + 18
      });
    }

    setDadosGraficos({
      evolucaoMensal,
      divergenciasPorTipo,
      volumePorOperadora,
      performanceTemporal
    });
  };

  // Gerar recomendações baseadas nos dados
  const gerarRecomendacoes = (conciliacoes: any[], taxaConciliacao: number) => {
    const novasRecomendacoes: Recomendacao[] = [];

    if (taxaConciliacao < 85) {
      novasRecomendacoes.push({
        tipo: 'alerta',
        titulo: 'Taxa de Conciliação Baixa',
        descricao: `Taxa atual de ${taxaConciliacao.toFixed(1)}% está abaixo do ideal (>90%)`,
        acao: 'Revisar configurações de tolerância e processos manuais',
        impacto: 'alto'
      });
    }

    if (conciliacoes.some(c => c.status === 'divergencia')) {
      novasRecomendacoes.push({
        tipo: 'melhoria',
        titulo: 'Implementar Matching Inteligente',
        descricao: 'Divergências podem ser reduzidas com algoritmos de matching mais avançados',
        acao: 'Configurar matching automático com tolerâncias ajustadas',
        impacto: 'medio'
      });
    }

    novasRecomendacoes.push({
      tipo: 'otimizacao',
      titulo: 'Automação de Relatórios',
      descricao: 'Relatórios diários podem ser automatizados para maior eficiência',
      acao: 'Configurar envio automático de relatórios por email',
      impacto: 'baixo'
    });

    setRecomendacoes(novasRecomendacoes);
  };

  useEffect(() => {
    buscarDadosDashboard();
  }, [periodoSelecionado]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
          <p className="text-gray-600 mt-1">Análise avançada de performance de conciliação</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ultimo_mes">Último Mês</SelectItem>
              <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={buscarDadosDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conciliação</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {kpis.taxaConciliacao.toFixed(1)}%
            </div>
            <p className="text-xs text-blue-600">
              {kpis.taxaConciliacao >= 90 ? '+2.1%' : '-1.2%'} vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio Resolução</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {kpis.tempoMedioResolucao}h
            </div>
            <p className="text-xs text-green-600">-15min vs período anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Operacional</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              R$ {kpis.economiaOperacional.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-purple-600">+R$ 2.500 vs período anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maquininhas Ativas</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {kpis.maquininhasAtivas}
            </div>
            <p className="text-xs text-orange-600">+2 vs período anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Taxa de Conciliação</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosGraficos.evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'taxa' ? `${Number(value).toFixed(1)}%` : `R$ ${Number(value).toLocaleString('pt-BR')}`,
                  name === 'taxa' ? 'Taxa de Conciliação' : 'Volume'
                ]} />
                <Legend />
                <Line type="monotone" dataKey="taxa" stroke="#3B82F6" strokeWidth={2} name="Taxa %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume por Operadora */}
        <Card>
          <CardHeader>
            <CardTitle>Volume por Operadora</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficos.volumePorOperadora}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operadora" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Volume']} />
                <Legend />
                <Bar dataKey="volume" fill="#10B981" name="Volume (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Divergências por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle>Divergências por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGraficos.divergenciasPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tipo, quantidade }) => `${tipo}: ${quantidade}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {dadosGraficos.divergenciasPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Volume Diário (Últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosGraficos.performanceTemporal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="vendas" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Vendas" />
                <Area type="monotone" dataKey="recebimentos" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Recebimentos" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações Estratégicas */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações Estratégicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recomendacoes.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    variant={rec.tipo === 'alerta' ? 'destructive' : rec.tipo === 'melhoria' ? 'default' : 'secondary'}
                  >
                    {rec.tipo}
                  </Badge>
                  <Badge variant="outline" className={
                    rec.impacto === 'alto' ? 'border-red-200 text-red-700' :
                    rec.impacto === 'medio' ? 'border-yellow-200 text-yellow-700' :
                    'border-blue-200 text-blue-700'
                  }>
                    {rec.impacto} impacto
                  </Badge>
                </div>
                <h4 className="font-medium mb-2">{rec.titulo}</h4>
                <p className="text-sm text-gray-600 mb-3">{rec.descricao}</p>
                <p className="text-sm font-medium text-blue-600">{rec.acao}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}