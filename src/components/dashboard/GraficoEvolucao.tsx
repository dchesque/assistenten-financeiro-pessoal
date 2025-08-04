import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { EvoluçaoMensal } from '@/hooks/useDashboardExecutivo';

interface GraficoEvolucaoProps {
  dados: EvoluçaoMensal[];
}

export function GraficoEvolucao({ dados }: GraficoEvolucaoProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              📊 Evolução Financeira
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Últimos 6 meses</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              6 meses
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              1 ano
            </Button>
            <Button variant="ghost" size="sm" className="text-xs">
              2 anos
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="receitasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="despesasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="mes" 
                className="text-xs"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number, name) => [
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : 'Saldo'
                ]}
                labelFormatter={(label) => `Mês: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                }}
              />
              
              <Area
                type="monotone"
                dataKey="receitas"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#receitasGradient)"
              />
              <Area
                type="monotone"
                dataKey="despesas"
                stroke="#ef4444"
                strokeWidth={3}
                fill="url(#despesasGradient)"
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#3b82f6"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Insights */}
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="text-center p-2 bg-green-50/50 rounded-lg">
              <p className="text-gray-600">Melhor Mês</p>
              <p className="font-semibold text-green-700">Dezembro</p>
              <p className="text-green-600">R$ 15.200 líquido</p>
            </div>
            <div className="text-center p-2 bg-blue-50/50 rounded-lg">
              <p className="text-gray-600">Tendência</p>
              <p className="font-semibold text-blue-700">Crescimento</p>
              <p className="text-blue-600">+8,5% trimestral</p>
            </div>
            <div className="text-center p-2 bg-purple-50/50 rounded-lg">
              <p className="text-gray-600">Meta Anual</p>
              <p className="font-semibold text-purple-700">76% Alcançado</p>
              <p className="text-purple-600">R$ 450k de R$ 590k</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}