import { DadosGraficoFluxo } from '@/types/fluxoCaixa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface GraficoFluxoCaixaProps {
  dados: DadosGraficoFluxo[];
  altura?: number;
  loading?: boolean;
}

export function GraficoFluxoCaixa({ dados, altura = 400, loading = false }: GraficoFluxoCaixaProps) {
  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`w-full bg-gray-200 rounded animate-pulse`} style={{ height: altura }}></div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl p-4">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-600">{entry.dataKey === 'entradas' ? 'Entradas:' : 
                                                 entry.dataKey === 'saidas' ? 'Saídas:' : 
                                                 entry.dataKey === 'saldo_acumulado' ? 'Saldo Acumulado:' : 
                                                 'Projeção:'}</span>
              <span className="font-semibold" style={{ color: entry.color }}>
                {entry.value?.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-sm text-gray-600">{
            entry.dataKey === 'entradas' ? 'Entradas' : 
            entry.dataKey === 'saidas' ? 'Saídas' : 
            entry.dataKey === 'saldo_acumulado' ? 'Saldo Acumulado' : 
            'Projeção'
          }</span>
        </div>
      ))}
    </div>
  );

  // Processar dados para o gráfico
  const dadosProcessados = dados.map(item => ({
    ...item,
    periodo: format(item.data, 'dd/MM', { locale: ptBR }),
    entradas: item.entradas,
    saidas: -Math.abs(item.saidas), // Saídas como valores negativos para visualização
    saldo_acumulado: item.saldo_acumulado,
    saldo_projetado: item.saldo_projetado || null
  }));

  const resumo = {
    totalEntradas: dados.reduce((sum, item) => sum + item.entradas, 0),
    totalSaidas: dados.reduce((sum, item) => sum + item.saidas, 0),
    variacao: dados.length > 0 ? dados[dados.length - 1].saldo_acumulado - dados[0].saldo_acumulado : 0
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Evolução do Fluxo de Caixa
              </CardTitle>
              <p className="text-sm text-gray-500">
                Período de {format(dados[0]?.data || new Date(), 'dd/MM', { locale: ptBR })} a {format(dados[dados.length - 1]?.data || new Date(), 'dd/MM', { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className={`${resumo.variacao >= 0 ? 'bg-green-100/80 text-green-700' : 'bg-red-100/80 text-red-700'} text-xs font-medium`}
            >
              <TrendingUp className={`w-3 h-3 mr-1 ${resumo.variacao >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
              {resumo.variacao >= 0 ? '+' : ''}{resumo.variacao.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </Badge>
          </div>
        </div>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-gray-50/50 rounded-xl">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Total Entradas</p>
            <p className="text-sm font-semibold text-green-600">
              {resumo.totalEntradas.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Total Saídas</p>
            <p className="text-sm font-semibold text-red-600">
              {resumo.totalSaidas.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Resultado</p>
            <p className={`text-sm font-semibold ${resumo.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(resumo.totalEntradas - resumo.totalSaidas).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={altura}>
          <ComposedChart
            data={dadosProcessados}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis 
              dataKey="periodo" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => 
                value.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact'
                })
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            
            {/* Barras de Entradas */}
            <Bar 
              dataKey="entradas" 
              fill="#10b981" 
              name="entradas"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
            
            {/* Barras de Saídas */}
            <Bar 
              dataKey="saidas" 
              fill="#ef4444" 
              name="saidas"
              radius={[0, 0, 4, 4]}
              opacity={0.8}
            />
            
            {/* Linha do Saldo Acumulado */}
            <Line 
              type="monotone" 
              dataKey="saldo_acumulado" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="saldo_acumulado"
            />
            
            {/* Linha de Projeção */}
            <Line 
              type="monotone" 
              dataKey="saldo_projetado" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
              name="saldo_projetado"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}