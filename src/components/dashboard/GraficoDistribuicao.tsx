import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DespesaCategoria } from '@/hooks/useDashboardExecutivo';

interface GraficoDistribuicaoProps {
  dados: DespesaCategoria[];
}

export function GraficoDistribuicao({ dados }: GraficoDistribuicaoProps) {
  const totalDespesas = dados.reduce((sum, item) => sum + item.valor, 0);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              🎯 Despesas por Categoria
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Janeiro 2025</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-blue-50/50 border-blue-300/50 text-blue-700 hover:bg-blue-100/50"
          >
            📋 Ver Detalhes no DRE
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dados}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="valor"
                >
                  {dados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    ''
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Lista de categorias */}
          <div className="space-y-3">
            {dados.map((categoria, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoria.cor }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {categoria.categoria}
                    </p>
                    <p className="text-xs text-gray-600">
                      {categoria.percentual}% do total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    R$ {categoria.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Resumo */}
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <div className="bg-blue-50/50 rounded-xl p-3">
                <p className="text-sm text-gray-600 mb-1">Maior categoria:</p>
                <p className="font-semibold text-blue-700">
                  {dados[0]?.categoria}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Crescimento: +5% vs mês anterior
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}