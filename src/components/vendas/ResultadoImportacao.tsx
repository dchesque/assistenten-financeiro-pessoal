
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, Users, DollarSign, CreditCard, Tag } from 'lucide-react';

interface ResultadoImportacao {
  sucessos: number;
  erros: string[];
  warnings: string[];
  vendasCriadas: any[];
  clientesCriados: any[];
  analises: {
    totalLinhas: number;
    linhasValidas: number;
    linhasComErro: number;
    clientesNovos: number;
    clientesExistentes: number;
    valorTotal: number;
    formasPagamento: Record<string, number>;
    categorias: Record<string, number>;
  };
}

interface ResultadoImportacaoProps {
  resultado: ResultadoImportacao;
}

export function ResultadoImportacao({ resultado }: ResultadoImportacaoProps) {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const percentualSucesso = (resultado.sucessos / resultado.analises.totalLinhas) * 100;

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200/50 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span>Importação Concluída</span>
            <Badge className="bg-green-100 text-green-700 ml-auto">
              {percentualSucesso.toFixed(1)}% sucesso
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{resultado.sucessos}</div>
              <div className="text-sm text-gray-600">Vendas Importadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{resultado.analises.clientesNovos}</div>
              <div className="text-sm text-gray-600">Clientes Criados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{formatarMoeda(resultado.analises.valorTotal)}</div>
              <div className="text-sm text-gray-600">Valor Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{resultado.erros.length}</div>
              <div className="text-sm text-gray-600">Erros</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análise por Forma de Pagamento */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Formas de Pagamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(resultado.analises.formasPagamento).map(([forma, quantidade]) => (
                <div key={forma} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium capitalize">{forma.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {quantidade}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Análise por Categoria */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-purple-600" />
              <span>Categorias</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(resultado.analises.categorias).map(([categoria, quantidade]) => (
                <div key={categoria} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">{categoria}</span>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    {quantidade}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Criados */}
      {resultado.clientesCriados.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Clientes Criados ({resultado.clientesCriados.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
              {resultado.clientesCriados.map((cliente, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{cliente.nome}</div>
                    <div className="text-sm text-gray-600">{cliente.documento}</div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    {cliente.tipo}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avisos */}
      {resultado.warnings.length > 0 && (
        <Card className="bg-orange-50 border border-orange-200 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span>Avisos ({resultado.warnings.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {resultado.warnings.map((warning, index) => (
                <div key={index} className="text-sm text-orange-700 flex items-start space-x-2">
                  <div className="w-1 h-1 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erros */}
      {resultado.erros.length > 0 && (
        <Card className="bg-red-50 border border-red-200 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Erros ({resultado.erros.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {resultado.erros.map((erro, index) => (
                <div key={index} className="text-sm text-red-700 flex items-start space-x-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{erro}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
