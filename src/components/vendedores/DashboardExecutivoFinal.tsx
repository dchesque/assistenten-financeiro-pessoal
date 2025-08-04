import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVendedoresAvancado } from '@/hooks/useVendedoresAvancado';
import { useAlertasVendedores } from '@/hooks/useAlertasVendedores';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Users, DollarSign, Target, BarChart3 } from 'lucide-react';

export const DashboardExecutivoFinal = () => {
  const { 
    resumos, 
    loading, 
    sincronizarComVendas, 
    gerarRelatorioExecutivo, 
    otimizarPerformance 
  } = useVendedoresAvancado();
  
  const { 
    alertas, 
    estatisticas, 
    alertasCriticos, 
    alertasPositivos 
  } = useAlertasVendedores();

  const [relatorioExecutivo, setRelatorioExecutivo] = useState<any>(null);

  useEffect(() => {
    const carregarRelatorio = async () => {
      try {
        const relatorio = await gerarRelatorioExecutivo();
        setRelatorioExecutivo(relatorio);
      } catch (error) {
        console.error('Erro ao carregar relatório:', error);
      }
    };

    carregarRelatorio();
  }, [gerarRelatorioExecutivo]);

  const handleSincronizar = async () => {
    await sincronizarComVendas();
    if (relatorioExecutivo) {
      const novoRelatorio = await gerarRelatorioExecutivo();
      setRelatorioExecutivo(novoRelatorio);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header Executivo */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Executivo - Vendedores</h1>
          <p className="text-gray-600">Visão completa e analytics avançados</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleSincronizar}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Sincronizar
          </Button>
          <Button 
            onClick={otimizarPerformance}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Otimizar
          </Button>
        </div>
      </div>

      {/* Alertas Críticos */}
      {alertasCriticos.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50/50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">
              Alertas Críticos ({alertasCriticos.length})
            </h3>
          </div>
          <div className="space-y-2">
            {alertasCriticos.slice(0, 3).map((alerta, index) => (
              <div key={index} className="text-sm text-red-700">
                <strong>{alerta.vendedor_nome}</strong>: {alerta.titulo}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Vendedores</p>
              <p className="text-2xl font-bold">{resumos.total_vendedores}</p>
              <p className="text-xs text-green-600">{resumos.vendedores_ativos} ativos</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Vendido</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(resumos.total_vendido)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Comissões Pagas</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(resumos.total_comissoes)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(resumos.ticket_medio_geral)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Insights e Performance */}
      {relatorioExecutivo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Vendedores */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Top 5 Vendedores</h3>
            <div className="space-y-3">
              {relatorioExecutivo.top_vendedores.map((vendedor: any, index: number) => (
                <div key={vendedor.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{vendedor.nome}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(vendedor.valor_total_vendido || 0)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Vendedores em Risco */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-red-600">Vendedores em Risco</h3>
            {relatorioExecutivo.vendedores_risco.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum vendedor em situação de risco</p>
            ) : (
              <div className="space-y-3">
                {relatorioExecutivo.vendedores_risco.slice(0, 5).map((vendedor: any) => (
                  <div key={vendedor.id} className="flex items-center justify-between">
                    <span className="font-medium">{vendedor.nome}</span>
                    <Badge variant="destructive">
                      {vendedor.meta_mensal ? 
                        `${Math.round(((vendedor.valor_total_vendido || 0) / vendedor.meta_mensal) * 100)}%` 
                        : 'Sem meta'
                      }
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Alertas Positivos */}
      {alertasPositivos.length > 0 && (
        <Card className="p-6 border-green-200 bg-green-50/50">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">
              Conquistas Recentes ({alertasPositivos.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {alertasPositivos.map((alerta, index) => (
              <div key={index} className="text-sm text-green-700">
                <strong>{alerta.vendedor_nome}</strong>: {alerta.titulo}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};