import { TrendingUp, TrendingDown, Users, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ResumoExecutivo as ResumoExecutivoType } from '@/hooks/useRelatoriosGerais';

interface ResumoExecutivoProps {
  dados: ResumoExecutivoType;
  periodo: {
    inicio: string;
    fim: string;
  };
}

export function ResumoExecutivo({ dados, periodo }: ResumoExecutivoProps) {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const obterCorLiquidez = (status: string) => {
    switch (status) {
      case 'alto':
        return 'bg-green-100/80 text-green-700';
      case 'medio':
        return 'bg-yellow-100/80 text-yellow-700';
      case 'baixo':
        return 'bg-red-100/80 text-red-700';
      default:
        return 'bg-gray-100/80 text-gray-700';
    }
  };

  const obterIconeLiquidez = (status: string) => {
    switch (status) {
      case 'alto':
        return <TrendingUp className="w-4 h-4" />;
      case 'medio':
        return <DollarSign className="w-4 h-4" />;
      case 'baixo':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const obterTextoLiquidez = (status: string) => {
    switch (status) {
      case 'alto':
        return 'Alta';
      case 'medio':
        return 'Média';
      case 'baixo':
        return 'Baixa';
      default:
        return 'Indefinida';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">📊 Resumo Executivo</CardTitle>
              <p className="text-sm text-gray-600">Visão geral do período</p>
            </div>
          </div>
          
          <Badge className="bg-blue-100/80 text-blue-700 font-medium">
            <Calendar className="w-3 h-3 mr-1" />
            {periodo.inicio} - {periodo.fim}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Grid de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total de Fornecedores Ativos */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                Fornecedores
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-900">
                {dados.total_fornecedores_ativos}
              </div>
              <div className="text-xs text-blue-700">Fornecedores ativos</div>
            </div>
          </div>

          {/* Contas Pendentes */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4 border border-yellow-200/50">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-yellow-600 uppercase tracking-wide">
                Pendentes
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-yellow-900">
                {formatarMoeda(dados.contas_pendentes.valor)}
              </div>
              <div className="text-xs text-yellow-700">
                {dados.contas_pendentes.quantidade} contas pendentes
              </div>
            </div>
          </div>

          {/* Próximos Vencimentos */}
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200/50">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                Próximos 7 dias
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-900">
                {formatarMoeda(dados.proximos_vencimentos.valor)}
              </div>
              <div className="text-xs text-red-700">
                {dados.proximos_vencimentos.quantidade} contas vencendo
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Secundárias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          {/* Ticket Médio */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 border border-green-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Ticket Médio por Fornecedor</h4>
                <p className="text-sm text-green-700">Valor médio gasto por fornecedor</p>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-900 mb-2">
              {formatarMoeda(dados.ticket_medio_fornecedor)}
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                Baseado em {dados.total_fornecedores_ativos} fornecedores ativos
              </span>
            </div>
          </div>

          {/* Status de Liquidez */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 border border-purple-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                {obterIconeLiquidez(dados.status_liquidez)}
              </div>
              <div>
                <h4 className="font-semibold text-purple-900">Status de Liquidez</h4>
                <p className="text-sm text-purple-700">Capacidade atual de pagamento</p>
              </div>
            </div>
            <div className="space-y-3">
              <Badge className={`${obterCorLiquidez(dados.status_liquidez)} px-4 py-2 text-base font-medium`}>
                {obterIconeLiquidez(dados.status_liquidez)}
                <span className="ml-2">Liquidez {obterTextoLiquidez(dados.status_liquidez)}</span>
              </Badge>
              <p className="text-sm text-purple-700">
                {dados.status_liquidez === 'alto' && 'Excelente capacidade de pagamento das obrigações'}
                {dados.status_liquidez === 'medio' && 'Capacidade moderada de pagamento das obrigações'}
                {dados.status_liquidez === 'baixo' && 'Atenção necessária para gestão do fluxo de caixa'}
              </p>
            </div>
          </div>
        </div>

        {/* Alertas e Recomendações */}
        {(dados.proximos_vencimentos.quantidade > 0 || dados.status_liquidez === 'baixo') && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl p-6 border border-orange-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-orange-900">Alertas e Recomendações</h4>
                <p className="text-sm text-orange-700">Pontos que requerem atenção</p>
              </div>
            </div>
            <div className="space-y-3">
              {dados.proximos_vencimentos.quantidade > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Vencimentos Próximos</p>
                    <p className="text-sm text-orange-700">
                      {dados.proximos_vencimentos.quantidade} contas vencem nos próximos 7 dias.
                      Recomenda-se revisar o fluxo de caixa.
                    </p>
                  </div>
                </div>
              )}
              {dados.status_liquidez === 'baixo' && (
                <div className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Liquidez Baixa</p>
                    <p className="text-sm text-orange-700">
                      Considere renegociar prazos de pagamento ou buscar fontes de financiamento.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}