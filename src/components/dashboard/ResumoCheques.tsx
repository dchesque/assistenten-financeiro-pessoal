import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus } from 'lucide-react';
import { ResumoCheques as ResumoChequesType } from '@/hooks/useDashboardExecutivo';
import { useNavigate } from 'react-router-dom';

interface ResumoChequesProps {
  resumo: ResumoChequesType;
}

export function ResumoCheques({ resumo }: ResumoChequesProps) {
  const navigate = useNavigate();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          📋 Situação dos Cheques
        </CardTitle>
        <p className="text-sm text-gray-600">Janeiro 2025</p>
      </CardHeader>
      
      <CardContent className="pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumo */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Resumo</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50/80 rounded-xl text-center">
                <p className="text-xs text-gray-600">Total Emitidos</p>
                <p className="text-lg font-bold text-blue-700">{resumo.totalEmitidos}</p>
                <p className="text-xs text-blue-600">cheques</p>
              </div>
              
              <div className="p-3 bg-purple-50/80 rounded-xl text-center">
                <p className="text-xs text-gray-600">Valor Total</p>
                <p className="text-lg font-bold text-purple-700">
                  R$ {resumo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="p-3 bg-green-50/80 rounded-xl text-center">
                <p className="text-xs text-gray-600">Compensados</p>
                <p className="text-lg font-bold text-green-700">{resumo.compensados}</p>
                <p className="text-xs text-green-600">cheques</p>
              </div>
              
              <div className="p-3 bg-orange-50/80 rounded-xl text-center">
                <p className="text-xs text-gray-600">Pendentes</p>
                <p className="text-lg font-bold text-orange-700">{resumo.pendentes}</p>
                <p className="text-xs text-orange-600">cheques</p>
              </div>
            </div>
          </div>

          {/* Próximos Vencimentos */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Próximos Vencimentos</h4>
            
            <div className="space-y-2">
              {resumo.proximosVencimentos.map((cheque, index) => (
                <div key={index} className="p-3 bg-gray-50/80 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      CHQ {cheque.numero}
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      R$ {cheque.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {new Date(cheque.vencimento).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {cheque.beneficiario}
                  </p>
                </div>
              ))}
              
              {resumo.proximosVencimentos.length === 0 && (
                <div className="p-4 text-center text-gray-500 bg-gray-50/50 rounded-xl">
                  <p className="text-sm">Nenhum cheque pendente</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Ações */}
        <div className="mt-6 pt-4 border-t border-gray-200/50">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/cheques')}
              className="flex-1 bg-blue-50/50 border-blue-300/50 text-blue-700 hover:bg-blue-100/50"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Gerenciar Cheques
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/cheques')}
              className="flex-1 bg-green-50/50 border-green-300/50 text-green-700 hover:bg-green-100/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cheque
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}