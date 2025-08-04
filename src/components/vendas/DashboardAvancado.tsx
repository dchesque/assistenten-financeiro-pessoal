import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useVendasSupabaseAtualizado } from '@/hooks/useVendasSupabaseAtualizado';
import { formatarMoeda } from '@/utils/formatters';
import { type VendaCompleta, type EstatisticasVendasCompletas } from '@/types/venda';

interface MetaVendedor {
  vendedor: string;
  metaMensal: number;
  vendidoMes: number;
  percentualAlcancado: number;
  vendasMes: number;
  comissaoMes: number;
}

interface DashboardAvancadoProps {
  className?: string;
}

export function DashboardAvancado({ className = '' }: DashboardAvancadoProps) {
  const { vendas, estatisticas, loading, carregarVendas } = useVendasSupabaseAtualizado();
  const [metasVendedores, setMetasVendedores] = useState<MetaVendedor[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    carregarVendas();
  }, []);

  useEffect(() => {
    if (vendas.length > 0) {
      calcularMetasVendedores();
    }
  }, [vendas]);

  const calcularMetasVendedores = () => {
    const vendedoresData = vendas.reduce((acc, venda) => {
      if (!venda.vendedor || venda.vendedor === '') return acc;
      
      const vendedor = venda.vendedor;
      if (!acc[vendedor]) {
        acc[vendedor] = {
          vendedor,
          metaMensal: 50000, // Meta padrão - pode ser configurável
          vendidoMes: 0,
          vendasMes: 0,
          comissaoMes: 0,
          percentualAlcancado: 0
        };
      }
      
      // Filtrar vendas do mês atual
      const agora = new Date();
      const dataVenda = new Date(venda.data_venda);
      if (dataVenda.getMonth() === agora.getMonth() && dataVenda.getFullYear() === agora.getFullYear()) {
        acc[vendedor].vendidoMes += Number(venda.valor_liquido);
        acc[vendedor].vendasMes += 1;
        acc[vendedor].comissaoMes += Number(venda.comissao_valor || 0);
      }
      
      return acc;
    }, {} as Record<string, MetaVendedor>);

    // Calcular percentual alcançado
    Object.values(vendedoresData).forEach(vendedor => {
      vendedor.percentualAlcancado = (vendedor.vendidoMes / vendedor.metaMensal) * 100;
    });

    setMetasVendedores(Object.values(vendedoresData).sort((a, b) => b.percentualAlcancado - a.percentualAlcancado));
  };

  const obterDadosEvolucao = () => {
    const dados = vendas.reduce((acc, venda) => {
      const data = venda.data_venda;
      if (!acc[data]) {
        acc[data] = { data, vendas: 0, receita: 0 };
      }
      acc[data].vendas += 1;
      acc[data].receita += Number(venda.valor_liquido);
      return acc;
    }, {} as Record<string, { data: string; vendas: number; receita: number }>);

    return Object.values(dados)
      .sort((a, b) => a.data.localeCompare(b.data))
      .slice(-30); // Últimos 30 dias
  };

  const obterDadosFormaPagamento = () => {
    const dados = vendas.reduce((acc, venda) => {
      const forma = venda.forma_pagamento || 'Não informado';
      if (!acc[forma]) {
        acc[forma] = { name: forma, value: 0, vendas: 0 };
      }
      acc[forma].value += Number(venda.valor_liquido);
      acc[forma].vendas += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; vendas: number }>);

    return Object.values(dados).sort((a, b) => b.value - a.value);
  };

  const obterDadosTicketMedio = () => {
    const dados = vendas.reduce((acc, venda) => {
      const mes = new Date(venda.data_venda).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!acc[mes]) {
        acc[mes] = { mes, total: 0, vendas: 0, ticketMedio: 0 };
      }
      acc[mes].total += Number(venda.valor_liquido);
      acc[mes].vendas += 1;
      return acc;
    }, {} as Record<string, { mes: string; total: number; vendas: number; ticketMedio: number }>);

    return Object.values(dados).map(item => ({
      ...item,
      ticketMedio: item.vendas > 0 ? item.total / item.vendas : 0
    })).sort((a, b) => a.mes.localeCompare(b.mes));
  };

  const CORES_GRAFICOS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

  const dadosEvolucao = obterDadosEvolucao();
  const dadosFormaPagamento = obterDadosFormaPagamento();
  const dadosTicketMedio = obterDadosTicketMedio();

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center justify-between">
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Receita do Mês
              </span>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{estatisticas?.crescimentoMensal.toFixed(1) || 0}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 mb-1">
              {formatarMoeda(estatisticas?.receitaMensal || 0)}
            </div>
            <p className="text-xs text-blue-600">
              Meta: {formatarMoeda(100000)} • {((estatisticas?.receitaMensal || 0) / 100000 * 100).toFixed(1)}%
            </p>
            <Progress 
              value={((estatisticas?.receitaMensal || 0) / 100000) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center justify-between">
              <span className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Vendas do Mês
              </span>
              <Badge variant="outline" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                {estatisticas?.vendasHoje || 0} hoje
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 mb-1">
              {estatisticas?.totalVendas.toLocaleString('pt-BR') || '0'}
            </div>
            <p className="text-xs text-green-600">
              Meta: 200 vendas • {((estatisticas?.totalVendas || 0) / 200 * 100).toFixed(1)}%
            </p>
            <Progress 
              value={((estatisticas?.totalVendas || 0) / 200) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Ticket Médio
              </span>
              <Badge variant="outline" className="text-xs">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +5.2%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 mb-1">
              {formatarMoeda(estatisticas?.ticketMedio || 0)}
            </div>
            <p className="text-xs text-purple-600">
              Meta: {formatarMoeda(500)} • Excelente performance
            </p>
            <Progress 
              value={((estatisticas?.ticketMedio || 0) / 500) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center justify-between">
              <span className="flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Meta Global
              </span>
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                75%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 mb-1">
              75%
            </div>
            <p className="text-xs text-orange-600">
              Alcançada • Faltam {formatarMoeda(25000)} para 100%
            </p>
            <Progress value={75} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução de Vendas */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                Evolução de Vendas
              </span>
              <div className="flex space-x-1">
                {['7d', '30d', '90d'].map((periodo) => (
                  <Button
                    key={periodo}
                    variant={periodoSelecionado === periodo ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPeriodoSelecionado(periodo as any)}
                    className="text-xs h-7"
                  >
                    {periodo}
                  </Button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'receita' ? formatarMoeda(Number(value)) : value,
                    name === 'receita' ? 'Receita' : 'Vendas'
                  ]}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#3B82F6" 
                  fill="url(#gradienteReceita)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="gradienteReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Formas de Pagamento */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosFormaPagamento}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dadosFormaPagamento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_GRAFICOS[index % CORES_GRAFICOS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatarMoeda(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Vendedores e Ticket Médio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Vendedores */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 text-yellow-600 mr-2" />
              Ranking de Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metasVendedores.slice(0, 5).map((vendedor, index) => (
              <div key={vendedor.vendedor} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={index === 0 ? 'default' : 'outline'} 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' : ''
                    }`}
                  >
                    {index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{vendedor.vendedor}</div>
                    <div className="text-xs text-gray-600">
                      {vendedor.vendasMes} vendas • {formatarMoeda(vendedor.comissaoMes)} comissão
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{formatarMoeda(vendedor.vendidoMes)}</div>
                  <div className={`text-xs flex items-center ${
                    vendedor.percentualAlcancado >= 100 ? 'text-green-600' : 
                    vendedor.percentualAlcancado >= 75 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {vendedor.percentualAlcancado >= 100 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {vendedor.percentualAlcancado.toFixed(1)}% da meta
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Evolução do Ticket Médio */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 text-green-600 mr-2" />
              Evolução do Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dadosTicketMedio}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatarMoeda(Number(value))} />
                <Line 
                  type="monotone" 
                  dataKey="ticketMedio" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}