import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, Edit, Trash2, FileText,
  QrCode, CreditCard, Banknote, ArrowRightLeft, TrendingUp 
} from "lucide-react";
import { Venda, FORMAS_PAGAMENTO, TIPOS_VENDA } from "@/types/venda";
import { formatarMoeda, formatarData, getClasseValorMonetario } from "@/utils/formatters";

interface TabelaVendasProps {
  vendas: Venda[];
  onVisualizarVenda: (venda: Venda) => void;
  onEditarVenda: (venda: Venda) => void;
  onExcluirVenda: (vendaId: number) => void;
}

export function TabelaVendas({ 
  vendas, 
  onVisualizarVenda, 
  onEditarVenda, 
  onExcluirVenda 
}: TabelaVendasProps) {
  
  const getFormaPagamentoIcon = (forma: string) => {
    switch (forma) {
      case 'pix':
        return <QrCode className="w-4 h-4" />;
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="w-4 h-4" />;
      case 'dinheiro':
        return <Banknote className="w-4 h-4" />;
      case 'boleto':
        return <FileText className="w-4 h-4" />;
      case 'transferencia':
        return <ArrowRightLeft className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getTipoVendaBadge = (tipo: string, valor: number) => {
    const tipoConfig = TIPOS_VENDA.find(t => t.valor === tipo);
    return (
      <Badge 
        className={`rounded-full text-xs font-medium px-2 py-1 backdrop-blur-sm border ${
          tipo === 'venda' 
            ? 'bg-green-100/80 text-green-700 border border-green-200/50' 
            : tipo === 'devolucao' 
            ? 'bg-red-100/80 text-red-700 border border-red-200/50' 
            : 'bg-orange-100/80 text-orange-700 border border-orange-200/50'
        }`}
      >
        {tipoConfig?.nome || tipo}
      </Badge>
    );
  };

  const handleExcluir = (vendaId: number) => {
    if (confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
      onExcluirVenda(vendaId);
    }
  };

  if (vendas.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma venda encontrada
              </h3>
              <p className="text-gray-600">
                Não há vendas que correspondam aos filtros aplicados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Lista de Vendas ({vendas.length} {vendas.length === 1 ? 'registro' : 'registros'})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data / Cliente
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valores
                </th>
                <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {vendas.map((venda) => (
                <tr key={venda.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatarData(venda.data_venda)} às {venda.hora_venda}
                      </div>
                      <div className="text-sm text-gray-600">
                        {venda.cliente_nome}
                        {venda.cliente_documento && (
                          <span className="text-gray-400 ml-1">
                            ({venda.cliente_documento})
                          </span>
                        )}
                      </div>
                      {venda.documento_referencia && (
                        <div className="text-xs text-gray-500 mt-1">
                          Doc: {venda.documento_referencia}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border"
                      style={{ 
                        backgroundColor: `${venda.categoria_cor}20`,
                        color: venda.categoria_cor,
                        borderColor: `${venda.categoria_cor}40`
                      }}
                    >
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: venda.categoria_cor }}></span>
                      {venda.categoria_nome}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      Código: {venda.categoria_codigo}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatarMoeda(venda.valor_bruto)}
                    </div>
                    {venda.desconto_valor > 0 && (
                      <div className="text-xs text-red-600">
                        -{formatarMoeda(venda.desconto_valor)}
                        {venda.desconto_percentual > 0 && (
                          <span className="text-gray-400 ml-1">
                            ({venda.desconto_percentual}%)
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`text-sm font-bold ${getClasseValorMonetario(venda.valor_liquido)}`}>
                      {formatarMoeda(venda.valor_liquido)}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge className="bg-indigo-100/80 text-indigo-700 border border-indigo-200/50 rounded-full text-xs font-medium px-2 py-1 backdrop-blur-sm">
                      <span className="flex items-center space-x-1">
                        {getFormaPagamentoIcon(venda.forma_pagamento)}
                        <span>{FORMAS_PAGAMENTO.find(f => f.valor === venda.forma_pagamento)?.nome}</span>
                      </span>
                    </Badge>
                    {venda.banco_nome && (
                      <div className="text-xs text-gray-500 mt-1">{venda.banco_nome}</div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {getTipoVendaBadge(venda.tipo_venda, venda.valor_liquido)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Visualizar */}
                      <button 
                        onClick={() => onVisualizarVenda(venda)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Visualizar venda"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Editar */}
                      <button 
                        onClick={() => onEditarVenda(venda)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Editar venda"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {/* Excluir */}
                      <button 
                        onClick={() => handleExcluir(venda.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir venda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}