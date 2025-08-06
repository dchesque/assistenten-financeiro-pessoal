import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Download, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { formatarMoeda } from '@/lib/formatacaoBrasileira';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DREItem {
  codigo: string;
  nome: string;
  nivel: number;
  tipo: 'receita' | 'despesa' | 'resultado';
  valorAtual: number;
  valorAnterior: number;
  variacao: number;
  percentualTotal: number;
  temFilhos?: boolean;
  filhos?: DREItem[];
}

interface TabelaDREProps {
  dados: DREItem[];
  periodo: string;
  comparativo?: boolean;
  loading?: boolean;
  onExportar: () => void;
  className?: string;
}

export function TabelaDRE({ 
  dados, 
  periodo, 
  comparativo = false, 
  loading = false, 
  onExportar,
  className 
}: TabelaDREProps) {
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());

  const toggleExpansao = (codigo: string) => {
    const novasExpandidas = new Set(expandidas);
    if (novasExpandidas.has(codigo)) {
      novasExpandidas.delete(codigo);
    } else {
      novasExpandidas.add(codigo);
    }
    setExpandidas(novasExpandidas);
  };

  const getCorPorTipo = (tipo: string, valor: number) => {
    switch (tipo) {
      case 'receita':
        return 'text-green-600';
      case 'despesa':
        return 'text-red-600';
      case 'resultado':
        return valor >= 0 ? 'text-green-600' : 'text-red-600';
      default:
        return 'text-gray-800';
    }
  };

  const getIconeVariacao = (variacao: number) => {
    if (variacao > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (variacao < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getCorVariacao = (variacao: number) => {
    if (variacao > 0) return 'text-green-600';
    if (variacao < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg overflow-hidden relative",
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200/50 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              DRE Detalhada - {periodo}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Demonstração do Resultado do Exercício
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExportar}
              disabled={loading}
              className="bg-white/80 backdrop-blur-sm border-gray-300/50"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conta
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor Atual
              </th>
              {comparativo && (
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período Anterior
                </th>
              )}
              {comparativo && (
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variação
                </th>
              )}
              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Total
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200/50">
            {dados.map((item) => (
              <React.Fragment key={item.codigo}>
                {/* Linha Principal */}
                <tr className={cn(
                  "hover:bg-white/60 transition-colors duration-200",
                  item.nivel === 1 && "bg-blue-50/30 font-semibold",
                  item.nivel === 2 && "bg-gray-50/30"
                )}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.temFilhos && (
                        <button
                          onClick={() => toggleExpansao(item.codigo)}
                          className="mr-2 p-1 hover:bg-gray-200/50 rounded transition-colors"
                        >
                          {expandidas.has(item.codigo) ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      )}
                      
                      <div className={`ml-${(item.nivel - 1) * 4}`}>
                        <div className="flex items-center">
                          <span className="text-xs font-mono text-gray-500 mr-3 bg-gray-100/80 px-2 py-1 rounded">
                            {item.codigo}
                          </span>
                          <span className={cn(
                            item.nivel === 1 ? "text-base font-semibold text-gray-800" :
                            item.nivel === 2 ? "text-sm font-medium text-gray-700" :
                            "text-sm text-gray-600"
                          )}>
                            {item.nome}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "font-medium",
                      getCorPorTipo(item.tipo, item.valorAtual)
                    )}>
                      {formatarMoeda(item.valorAtual)}
                    </span>
                  </td>
                  
                  {comparativo && (
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-600">
                        {formatarMoeda(item.valorAnterior)}
                      </span>
                    </td>
                  )}
                  
                  {comparativo && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        {getIconeVariacao(item.variacao)}
                        <span className={cn(
                          "text-sm font-medium ml-1",
                          getCorVariacao(item.variacao)
                        )}>
                          {Math.abs(item.variacao).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  )}
                  
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-gray-500 bg-gray-100/80 px-2 py-1 rounded">
                      {item.percentualTotal.toFixed(1)}%
                    </span>
                  </td>
                </tr>

                {/* Linhas Filhas (se expandida) */}
                {expandidas.has(item.codigo) && item.filhos && item.filhos.map((filho) => (
                  <tr key={filho.codigo} className="bg-gray-25/50">
                    <td className="px-6 py-3">
                      <div className={`ml-${item.nivel * 4} flex items-center`}>
                        <span className="text-xs font-mono text-gray-400 mr-3 bg-gray-50/80 px-2 py-1 rounded">
                          {filho.codigo}
                        </span>
                        <span className="text-sm text-gray-600">
                          {filho.nome}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-3 text-right">
                      <span className={cn(
                        "text-sm",
                        getCorPorTipo(filho.tipo, filho.valorAtual)
                      )}>
                        {formatarMoeda(filho.valorAtual)}
                      </span>
                    </td>
                    
                    {comparativo && (
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm text-gray-500">
                          {formatarMoeda(filho.valorAnterior)}
                        </span>
                      </td>
                    )}
                    
                    {comparativo && (
                      <td className="px-6 py-3 text-right">
                        <span className={cn(
                          "text-xs",
                          getCorVariacao(filho.variacao)
                        )}>
                          {filho.variacao > 0 ? '+' : ''}{filho.variacao.toFixed(1)}%
                        </span>
                      </td>
                    )}
                    
                    <td className="px-6 py-3 text-center">
                      <span className="text-xs text-gray-400">
                        {filho.percentualTotal.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600 font-medium">
              Carregando dados da DRE...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}