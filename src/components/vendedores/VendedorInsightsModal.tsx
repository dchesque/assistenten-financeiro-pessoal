import React from 'react';
import { X, TrendingUp, Target, Trophy, BarChart3, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatarMoeda } from '@/utils/formatters';
import { Vendedor } from '@/types/vendedor';
import { useVendedorAnalytics } from '@/hooks/useVendedorAnalytics';

interface VendedorInsightsModalProps {
  aberto: boolean;
  onFechar: () => void;
  vendedor: Vendedor | null;
}

export function VendedorInsightsModal({ aberto, onFechar, vendedor }: VendedorInsightsModalProps) {
  const { 
    progressoMeta, 
    kpis, 
    insights, 
    loading, 
    dadosEvolucaoMensal 
  } = useVendedorAnalytics(vendedor?.id);

  if (!aberto || !vendedor) return null;

  // Dados de performance da meta atual
  const dadosPerformance = progressoMeta ? [
    { 
      name: 'Meta Atingida', 
      value: Math.min(progressoMeta.percentual, 100), 
      color: '#10B981' 
    },
    { 
      name: 'Restante', 
      value: Math.max(100 - progressoMeta.percentual, 0), 
      color: '#E5E7EB' 
    }
  ] : [];

  // Mapear insights para formato compatível com o componente
  const insightsFormatados = insights?.map(insight => ({
    tipo: insight.tipo,
    titulo: insight.titulo,
    descricao: insight.descricao,
    icone: insight.tipo === 'urgente' ? <Trophy className="w-5 h-5 text-red-600" /> :
           insight.tipo === 'parabens' ? <Trophy className="w-5 h-5 text-green-600" /> :
           insight.tipo === 'destaque' ? <TrendingUp className="w-5 h-5 text-purple-600" /> :
           <Target className="w-5 h-5 text-blue-600" />
  })) || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Insights & KPIs</h2>
                <p className="text-blue-100">{vendedor.nome} • Código: {vendedor.codigo_vendedor}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onFechar}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-800">Vendas Este Mês</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">
                      {formatarMoeda(progressoMeta?.realizado || 0)}
                    </div>
                    <Badge className={`mt-2 ${
                      progressoMeta?.status === 'na_frente' ? 'bg-green-200 text-green-800' :
                      progressoMeta?.status === 'critico' ? 'bg-red-200 text-red-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {progressoMeta ? `${progressoMeta.percentual.toFixed(1)}% da meta` : 'Sem dados'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">Posição Ranking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">
                      #{vendedor.ranking_atual || 1}° lugar
                    </div>
                    <Badge className="bg-blue-200 text-blue-800 mt-2">
                      Top performer
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800">Ticket Médio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatarMoeda(kpis?.ticketMedio.valor || 0)}
                    </div>
                    <Badge className={`mt-2 ${
                      (kpis?.ticketMedio.percentualDiferenca || 0) > 0 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {kpis 
                        ? `${kpis.ticketMedio.percentualDiferenca > 0 ? '+' : ''}${kpis.ticketMedio.percentualDiferenca.toFixed(1)}% vs equipe`
                        : 'Sem dados'
                      }
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800">Comissões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">
                      {formatarMoeda(vendedor.comissao_total_recebida || 0)}
                    </div>
                    <Badge className="bg-orange-200 text-orange-800 mt-2">
                      {vendedor.percentual_comissao}% rate
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Evolução de Vendas */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Evolução de Vendas vs Meta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={dadosEvolucaoMensal}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="mes" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip 
                          formatter={(value: number) => [formatarMoeda(value), '']}
                          labelStyle={{ color: '#333' }}
                          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '8px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="vendas" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          name="Vendas"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="meta" 
                          stroke="#EF4444" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                          name="Meta"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Performance vs Meta */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Performance vs Meta Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={dadosPerformance}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {dadosPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-4">
                      <div className={`text-3xl font-bold ${
                        progressoMeta?.status === 'na_frente' ? 'text-green-600' :
                        progressoMeta?.status === 'critico' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {progressoMeta ? `${progressoMeta.percentual.toFixed(0)}%` : '0%'}
                      </div>
                      <div className="text-sm text-gray-600">da meta atingida</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights Automáticos */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Insights Automáticos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insightsFormatados.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50/50">
                        <div className="flex-shrink-0 p-2 rounded-full bg-white">
                          {insight.icone}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{insight.titulo}</h4>
                          <p className="text-gray-600 text-sm">{insight.descricao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detalhes Adicionais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Dias Produtivos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {kpis ? `${kpis.consistencia.diasComVenda} / ${kpis.consistencia.diasUteis} dias` : '0 / 0 dias'}
                    </div>
                    <div className="text-sm text-gray-600">Este mês</div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {kpis ? `${(100 - kpis.taxaDevolucao.minhaTaxa).toFixed(0)}%` : '0%'}
                    </div>
                    <div className="text-sm text-gray-600">Taxa de sucesso</div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Restante da Meta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {progressoMeta && progressoMeta.meta > progressoMeta.realizado 
                        ? formatarMoeda(progressoMeta.meta - progressoMeta.realizado)
                        : formatarMoeda(0)
                      }
                    </div>
                    <div className="text-sm text-gray-600">Para atingir 100%</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}