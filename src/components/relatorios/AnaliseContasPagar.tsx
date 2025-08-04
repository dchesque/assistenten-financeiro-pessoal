import { CreditCard, Clock, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { AnaliseContasPagar as AnaliseContasPagarType } from '@/hooks/useRelatoriosGerais';

interface AnaliseContasPagarProps {
  dados: AnaliseContasPagarType;
}

export function AnaliseContasPagar({ dados }: AnaliseContasPagarProps) {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  const coresAging = ['#10B981', '#F59E0B', '#EF4444', '#7C2D12'];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">💸 Análise de Contas a Pagar</CardTitle>
            <p className="text-sm text-gray-600">Status e aging das obrigações</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contas por Status */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Distribuição por Status</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dados.contas_por_status.map((status, index) => (
              <div
                key={status.status}
                className="bg-gradient-to-br from-white/80 to-gray-50/50 rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.cor }}
                  ></div>
                  <Badge 
                    className="text-xs font-medium"
                    style={{ 
                      backgroundColor: `${status.cor}20`, 
                      color: status.cor,
                      border: `1px solid ${status.cor}40`
                    }}
                  >
                    {status.status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600">Valor</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatarMoeda(status.valor)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-600">Quantidade</p>
                    <p className="text-md font-semibold text-gray-800">
                      {status.quantidade} contas
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Pizza - Status */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200/50">
          <h4 className="text-md font-semibold text-blue-900 mb-4">Distribuição Visual por Status</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dados.contas_por_status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, value }) => `${status}: ${formatarMoeda(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {dados.contas_por_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                  labelFormatter={(label) => `Status: ${label}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aging de Contas */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Aging de Contas Vencidas</h3>
          </div>
          
          <div className="space-y-3">
            {dados.aging_contas.map((faixa, index) => (
              <div
                key={faixa.faixa}
                className="bg-gradient-to-r from-white/80 to-orange-50/50 rounded-lg p-4 border border-orange-200/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: coresAging[index] }}
                    ></div>
                    <span className="font-medium text-gray-900">{faixa.faixa}</span>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-orange-900">{formatarMoeda(faixa.valor)}</p>
                    <p className="text-sm text-orange-700">{faixa.quantidade} contas</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Percentual</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatarPercentual(faixa.percentual)}
                    </span>
                  </div>
                  <Progress 
                    value={faixa.percentual} 
                    className="h-2"
                    style={{ 
                      backgroundColor: '#f3f4f6',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Valor Médio */}
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 border border-green-200/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Valor Médio por Conta</h4>
              <p className="text-sm text-green-700">Ticket médio das obrigações</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-3xl font-bold text-green-900 mb-2">
              {formatarMoeda(dados.valor_medio_conta)}
            </p>
            <p className="text-sm text-green-700">
              Baseado em {dados.contas_por_status.reduce((acc, s) => acc + s.quantidade, 0)} contas
            </p>
          </div>
        </div>

        {/* Evolução Temporal */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Evolução Temporal (Últimos 6 Meses)</h3>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 border border-purple-200/50">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dados.evolucao_temporal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => formatarMoeda(value)}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatarMoeda(value), '']}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pagas" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Pagas"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pendentes" 
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    name="Pendentes"
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vencidas" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    name="Vencidas"
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {dados.aging_contas.some(a => a.faixa.includes('+90') && a.quantidade > 0) && (
          <div className="bg-gradient-to-r from-red-50 to-red-100/50 rounded-xl p-6 border border-red-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-red-900">Atenção Necessária</h4>
                <p className="text-sm text-red-700">Contas com atraso significativo</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {dados.aging_contas
                .filter(a => a.faixa.includes('+90') && a.quantidade > 0)
                .map(faixa => (
                  <div key={faixa.faixa} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <p className="text-red-900 font-medium">
                      {faixa.quantidade} contas com mais de 90 dias de atraso
                    </p>
                    <p className="text-red-800 font-bold">
                      {formatarMoeda(faixa.valor)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}