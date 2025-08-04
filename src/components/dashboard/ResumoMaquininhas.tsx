import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3, Settings } from 'lucide-react';
import { ResumoMaquininha } from '@/hooks/useDashboardExecutivo';
import { useNavigate } from 'react-router-dom';

interface ResumoMaquininhsProps {
  resumo: ResumoMaquininha;
}

export function ResumoMaquininhas({ resumo }: ResumoMaquininhsProps) {
  const navigate = useNavigate();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          💳 Resumo de Maquininhas
        </CardTitle>
        <p className="text-sm text-gray-600">Janeiro 2025</p>
      </CardHeader>
      
      <CardContent className="pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Operadoras */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Operadoras</h4>
            {resumo.operadoras.map((operadora, index) => (
              <div key={index} className="p-3 bg-gray-50/80 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{operadora.nome}</span>
                  <span className="text-xs px-2 py-1 bg-green-100/80 text-green-700 rounded-full">
                    ✅ {operadora.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  R$ {operadora.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebido
                </p>
              </div>
            ))}
            <div className="mt-2 p-2 bg-blue-50/50 rounded-lg text-center">
              <span className="text-xs font-medium text-blue-700">100% conciliado</span>
            </div>
          </div>

          {/* Recebimentos */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recebimentos</h4>
            <div className="space-y-2">
              <div className="p-3 bg-green-50/80 rounded-xl">
                <p className="text-xs text-gray-600">Total do Mês</p>
                <p className="text-lg font-bold text-green-700">
                  R$ {resumo.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-blue-50/80 rounded-xl">
                <p className="text-xs text-gray-600">Média Diária</p>
                <p className="text-lg font-bold text-blue-700">
                  R$ {resumo.mediaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-purple-50/80 rounded-xl">
                <p className="text-xs text-gray-600">Maior Dia</p>
                <p className="text-sm font-semibold text-purple-700">R$ 5.680,00 (15/01)</p>
              </div>
            </div>
          </div>

          {/* Taxas */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Taxas</h4>
            <div className="space-y-2">
              <div className="p-3 bg-orange-50/80 rounded-xl">
                <p className="text-xs text-gray-600">Total Pago</p>
                <p className="text-lg font-bold text-orange-700">
                  R$ {resumo.totalTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-red-50/80 rounded-xl">
                <p className="text-xs text-gray-600">% do Volume</p>
                <p className="text-lg font-bold text-red-700">{resumo.percentualTaxa}%</p>
              </div>
              <div className="p-3 bg-cyan-50/80 rounded-xl">
                <p className="text-xs text-gray-600">Taxa Média</p>
                <p className="text-sm font-semibold text-cyan-700">3,89%</p>
              </div>
            </div>
            <div className="mt-2 p-2 bg-green-50/50 rounded-lg text-center">
              <span className="text-xs font-medium text-green-700">
                ✅ Dentro do esperado
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Ações</h4>
            <div className="space-y-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/conciliacao/upload')}
                className="w-full text-xs bg-blue-50/50 border-blue-300/50 text-blue-700 hover:bg-blue-100/50"
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload Extratos
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/conciliacao')}
                className="w-full text-xs bg-purple-50/50 border-purple-300/50 text-purple-700 hover:bg-purple-100/50"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Relatório Taxas
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/maquininhas')}
                className="w-full text-xs bg-gray-50/50 border-gray-300/50 text-gray-700 hover:bg-gray-100/50"
              >
                <Settings className="w-3 h-3 mr-1" />
                Gerenciar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}