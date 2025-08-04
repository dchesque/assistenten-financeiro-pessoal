import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Target, TrendingUp, DollarSign, Calendar, Trophy, AlertTriangle, CheckCircle } from 'lucide-react';
import { useVendedorAnalytics } from '@/hooks/useVendedorAnalytics';

export default function VendedorAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vendedorId = parseInt(id || '0');
  
  const [periodo, setPeriodo] = useState('mes_atual');
  const { vendedor, progressoMeta, kpis, insights, loading } = useVendedorAnalytics(vendedorId, periodo);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!vendedor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-4 lg:p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendedor não encontrado</h1>
          <Button onClick={() => navigate('/vendedores')}>
            Voltar para Vendedores
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critico': return 'from-red-500 to-red-600';
      case 'em_risco': return 'from-yellow-500 to-yellow-600';
      case 'no_ritmo': return 'from-blue-500 to-blue-600';
      case 'na_frente': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critico': return <AlertTriangle className="w-6 h-6" />;
      case 'em_risco': return <Target className="w-6 h-6" />;
      case 'no_ritmo': return <TrendingUp className="w-6 h-6" />;
      case 'na_frente': return <CheckCircle className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstratos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      <PageHeader
        breadcrumb={createBreadcrumb(`/vendedor-analytics/${id}`)}
        title={`Analytics - ${vendedor?.nome || 'Vendedor'}`}
        subtitle="Análise detalhada de performance • Métricas e insights individuais"
      />

      <div className="relative p-4 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/vendedores')}
              className="bg-white/80 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={vendedor.foto_url || ''} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                  {vendedor.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{vendedor.nome}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <Badge variant="outline">{vendedor.codigo_vendedor}</Badge>
                  <Badge variant="outline">#{vendedor.ranking_atual || '-'} Ranking</Badge>
                  <span className="text-gray-600">{vendedor.cargo}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_atual">Mês Atual</SelectItem>
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="semestre">Semestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seção Meta Destaque */}
        {progressoMeta && (
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg mb-6">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Velocímetro da Meta */}
                <div className="text-center">
                  <div className="relative w-48 h-48 mx-auto mb-4">
                    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${Math.min(progressoMeta.percentual * 2.51, 251)} 251`}
                        className={`text-gradient bg-gradient-to-r ${getStatusColor(progressoMeta.status)}`}
                        style={{
                          background: `linear-gradient(45deg, ${progressoMeta.status === 'critico' ? '#ef4444' : 
                            progressoMeta.status === 'em_risco' ? '#f59e0b' :
                            progressoMeta.status === 'no_ritmo' ? '#3b82f6' : '#22c55e'}, ${
                            progressoMeta.status === 'critico' ? '#dc2626' : 
                            progressoMeta.status === 'em_risco' ? '#d97706' :
                            progressoMeta.status === 'no_ritmo' ? '#2563eb' : '#16a34a'})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getStatusColor(progressoMeta.status)} flex items-center justify-center text-white mb-2`}>
                        {getStatusIcon(progressoMeta.status)}
                      </div>
                      <span className="text-3xl font-bold text-gray-900">
                        {progressoMeta.percentual.toFixed(0)}%
                      </span>
                      <span className="text-sm text-gray-600">da meta</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Progresso da Meta</h3>
                  <p className="text-gray-600">
                    {formatarMoeda(progressoMeta.realizado)} de {formatarMoeda(progressoMeta.meta)}
                  </p>
                </div>

                {/* Detalhes da Meta */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Situação Atual</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600">Dias Restantes</p>
                      <p className="text-2xl font-bold text-gray-900">{progressoMeta.diasRestantes}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600">Ritmo Atual</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatarMoeda(progressoMeta.ritmoAtual)}/dia
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600">Ritmo Necessário</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatarMoeda(progressoMeta.ritmoNecessario)}/dia
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600">Projeção Final</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatarMoeda(progressoMeta.projecaoFinal)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Probabilidade e Status */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Probabilidade</h3>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {progressoMeta.probabilidade}%
                    </div>
                    <p className="text-gray-600 mb-4">chance de atingir a meta</p>
                    
                    <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden`}>
                      <div 
                        className={`h-full bg-gradient-to-r ${getStatusColor(progressoMeta.status)} transition-all duration-500`}
                        style={{ width: `${progressoMeta.probabilidade}%` }}
                      />
                    </div>
                  </div>

                  <div className={`mt-4 p-4 rounded-xl bg-gradient-to-r ${getStatusColor(progressoMeta.status)} text-white`}>
                    <p className="font-semibold">
                      {progressoMeta.status === 'critico' && '🚨 Ação Urgente Necessária'}
                      {progressoMeta.status === 'em_risco' && '⚠️ Acelere o Ritmo'}
                      {progressoMeta.status === 'no_ritmo' && '👍 No Ritmo Certo'}
                      {progressoMeta.status === 'na_frente' && '🏆 Você está Voando!'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Principais */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Ticket Médio */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ticket Médio</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatarMoeda(kpis.ticketMedio.valor)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">vs Equipe</span>
                  <Badge variant={kpis.ticketMedio.percentualDiferenca > 0 ? 'default' : 'secondary'}>
                    {kpis.ticketMedio.percentualDiferenca > 0 ? '+' : ''}
                    {kpis.ticketMedio.percentualDiferenca.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Participação Faturamento */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Participação</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpis.participacaoFaturamento.percentual.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {formatarMoeda(kpis.participacaoFaturamento.meuFaturamento)} de {formatarMoeda(kpis.participacaoFaturamento.faturamentoEquipe)}
                </div>
              </CardContent>
            </Card>

            {/* Taxa Devolução */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taxa Devolução</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpis.taxaDevolucao.minhaTaxa.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">vs Equipe: {kpis.taxaDevolucao.taxaEquipe.toFixed(1)}%</span>
                  <Badge variant={kpis.taxaDevolucao.minhaTaxa < kpis.taxaDevolucao.taxaEquipe ? 'default' : 'secondary'}>
                    {kpis.taxaDevolucao.minhaTaxa < kpis.taxaDevolucao.taxaEquipe ? 'Melhor' : 'Atenção'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Consistência */}
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Consistência</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpis.consistencia.percentual.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {kpis.consistencia.diasComVenda} de {kpis.consistencia.diasUteis} dias úteis
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Insights Automáticos */}
        {insights.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                Insights Automáticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl bg-gradient-to-r ${insight.cor} text-white`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{insight.icone}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{insight.titulo}</h4>
                        <p className="text-sm opacity-90 mb-2">{insight.descricao}</p>
                        <p className="text-sm font-medium">{insight.acao}</p>
                        {insight.impacto && (
                          <p className="text-xs opacity-75 mt-1">💡 {insight.impacto}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}