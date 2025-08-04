import { Building, TrendingUp, Users, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { RelatorioFornecedores as RelatorioFornecedoresType } from '@/hooks/useRelatoriosGerais';

interface RelatorioFornecedoresProps {
  dados: RelatorioFornecedoresType;
}

export function RelatorioFornecedores({ dados }: RelatorioFornecedoresProps) {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">🏢 Relatório de Fornecedores</CardTitle>
            <p className="text-sm text-gray-600">Análise detalhada dos fornecedores</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status de Atividade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                Ativos
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-900">
                {dados.status_atividade.ativos}
              </div>
              <div className="text-xs text-green-700">Fornecedores ativos</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/50">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Inativos
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900">
                {dados.status_atividade.inativos}
              </div>
              <div className="text-xs text-gray-700">Fornecedores inativos</div>
            </div>
          </div>
        </div>

        {/* Top Fornecedores */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top 10 Fornecedores por Valor</h3>
          </div>
          
          <div className="space-y-3">
            {dados.top_fornecedores.slice(0, 10).map((fornecedor, index) => (
              <div
                key={fornecedor.id}
                className="bg-gradient-to-r from-white/80 to-purple-50/50 rounded-lg p-4 border border-purple-200/30 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gradient-to-r from-purple-400 to-purple-600'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{fornecedor.nome}</p>
                      <p className="text-sm text-gray-600">ID: {fornecedor.id}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-purple-900">{formatarMoeda(fornecedor.valor_total)}</p>
                    <p className="text-sm text-purple-700">{formatarPercentual(fornecedor.percentual)}</p>
                  </div>
                </div>
                
                <Progress 
                  value={fornecedor.percentual} 
                  className="h-2 bg-purple-100"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Fornecedores por Tipo */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Percent className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Distribuição por Tipo</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dados.fornecedores_por_tipo.map((tipo, index) => {
              const cores = [
                'from-blue-500 to-blue-600',
                'from-green-500 to-green-600',
                'from-orange-500 to-orange-600',
                'from-red-500 to-red-600'
              ];
              
              const corBg = [
                'from-blue-50 to-blue-100/50 border-blue-200/50',
                'from-green-50 to-green-100/50 border-green-200/50',
                'from-orange-50 to-orange-100/50 border-orange-200/50',
                'from-red-50 to-red-100/50 border-red-200/50'
              ];

              return (
                <div
                  key={tipo.tipo}
                  className={`bg-gradient-to-br ${corBg[index % corBg.length]} rounded-xl p-6 border`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 bg-gradient-to-r ${cores[index % cores.length]} rounded-xl flex items-center justify-center`}>
                      <Building className="w-5 h-5 text-white" />
                    </div>
                    <Badge className={`${
                      index === 0 ? 'bg-blue-100/80 text-blue-700' : 'bg-green-100/80 text-green-700'
                    } font-medium`}>
                      {tipo.tipo}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Quantidade</p>
                      <p className="text-2xl font-bold text-gray-900">{tipo.quantidade}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatarMoeda(tipo.valor_total)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Valor Médio</p>
                      <p className="text-md font-medium text-gray-800">
                        {formatarMoeda(tipo.quantidade > 0 ? tipo.valor_total / tipo.quantidade : 0)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50/50 rounded-xl p-6 border border-purple-200/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900">Resumo da Análise</h4>
              <p className="text-sm text-purple-700">Principais insights dos fornecedores</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {dados.status_atividade.ativos + dados.status_atividade.inativos}
              </p>
              <p className="text-sm text-purple-700">Total de Fornecedores</p>
            </div>
            
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {dados.top_fornecedores.length > 0 ? formatarMoeda(dados.top_fornecedores[0].valor_total) : 'R$ 0,00'}
              </p>
              <p className="text-sm text-purple-700">Maior Fornecedor</p>
            </div>
            
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {formatarPercentual(
                  dados.status_atividade.ativos > 0 
                    ? (dados.status_atividade.ativos / (dados.status_atividade.ativos + dados.status_atividade.inativos)) * 100 
                    : 0
                )}
              </p>
              <p className="text-sm text-purple-700">Taxa de Atividade</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}