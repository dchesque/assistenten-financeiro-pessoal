import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Filter
} from 'lucide-react';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { DivergenciasManager } from '@/utils/divergencias/divergenciasManager';
import { useMaquininhas } from '@/hooks/useMaquininhas';

interface FiltrosRelatorio {
  periodo_inicio: string;
  periodo_fim: string;
  maquininha_id?: string;
  operadora?: 'todos' | 'rede' | 'sipag';
  tipo_relatorio: 'divergencias' | 'performance' | 'executivo';
}

export const RelatoriosConciliacao: React.FC = () => {
  const { maquininhas, recarregar } = useMaquininhas();
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    periodo_inicio: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    periodo_fim: new Date().toISOString().split('T')[0],
    tipo_relatorio: 'divergencias'
  });
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [relatorioGerado, setRelatorioGerado] = useState<any>(null);

  useEffect(() => {
    recarregar();
  }, []);

  useEffect(() => {
    if (filtros.periodo_inicio && filtros.periodo_fim) {
      carregarEstatisticas();
    }
  }, [filtros.periodo_inicio, filtros.periodo_fim]);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      const stats = await DivergenciasManager.obterEstatisticasPerformance();
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioDivergencias = async () => {
    try {
      setLoading(true);
      toast.info('Gerando relatório de divergências...');

      const relatorios = [];
      const maquininhasSelecionadas = filtros.maquininha_id 
        ? [maquininhas.find(m => m.id === filtros.maquininha_id)]
        : maquininhas.filter(m => m.ativo);

      for (const maquininha of maquininhasSelecionadas) {
        if (!maquininha) continue;

        // Gerar relatório para cada mês no período
        const inicio = new Date(filtros.periodo_inicio);
        const fim = new Date(filtros.periodo_fim);
        
        for (let data = new Date(inicio); data <= fim; data.setMonth(data.getMonth() + 1)) {
          const periodo = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
          
          try {
            const relatorio = await DivergenciasManager.gerarRelatorioReconciliacao(
              maquininha.id, 
              periodo
            );
            relatorios.push({ ...relatorio, maquininha: maquininha.nome });
          } catch (error) {
            console.warn(`Erro ao gerar relatório para ${maquininha.nome} - ${periodo}:`, error);
          }
        }
      }

      // Consolidar dados
      const relatorioConsolidado = {
        periodo: `${filtros.periodo_inicio} a ${filtros.periodo_fim}`,
        total_relatorios: relatorios.length,
        total_divergencias: relatorios.reduce((sum, r) => sum + r.divergencias.length, 0),
        valor_total_divergencias: relatorios.reduce((sum, r) => 
          sum + r.divergencias.reduce((divSum, div) => 
            divSum + Math.abs(div.valor_esperado - div.valor_encontrado), 0
          ), 0
        ),
        taxa_conciliacao_media: relatorios.length > 0 
          ? relatorios.reduce((sum, r) => sum + r.taxa_conciliacao, 0) / relatorios.length 
          : 0,
        detalhes: relatorios
      };

      setRelatorioGerado(relatorioConsolidado);
      toast.success('Relatório de divergências gerado com sucesso!');

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório de divergências');
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioPerformance = async () => {
    try {
      setLoading(true);
      toast.info('Gerando relatório de performance...');

      const stats = await DivergenciasManager.obterEstatisticasPerformance();
      
      const relatorioPerformance = {
        periodo: `${filtros.periodo_inicio} a ${filtros.periodo_fim}`,
        metricas_principais: {
          taxa_conciliacao_media: stats.taxa_conciliacao_media,
          tempo_medio_resolucao: stats.tempo_medio_resolucao,
          total_divergencias: Object.values(stats.divergencias_por_tipo).reduce((sum, val) => sum + val, 0)
        },
        performance_por_operadora: stats.performance_por_operadora,
        divergencias_por_tipo: stats.divergencias_por_tipo,
        recomendacoes: gerarRecomendacoes(stats)
      };

      setRelatorioGerado(relatorioPerformance);
      toast.success('Relatório de performance gerado com sucesso!');

    } catch (error) {
      console.error('Erro ao gerar relatório de performance:', error);
      toast.error('Erro ao gerar relatório de performance');
    } finally {
      setLoading(false);
    }
  };

  const gerarRelatorioExecutivo = async () => {
    try {
      setLoading(true);
      toast.info('Gerando relatório executivo...');

      const stats = await DivergenciasManager.obterEstatisticasPerformance();
      const totalMaquininhas = maquininhas.filter(m => m.ativo).length;
      
      const relatorioExecutivo = {
        periodo: `${filtros.periodo_inicio} a ${filtros.periodo_fim}`,
        resumo_executivo: {
          total_maquininhas: totalMaquininhas,
          taxa_conciliacao_global: stats.taxa_conciliacao_media,
          economia_operacional: calcularEconomiaOperacional(stats),
          status_geral: stats.taxa_conciliacao_media >= 95 ? 'Excelente' : 
                       stats.taxa_conciliacao_media >= 85 ? 'Bom' : 'Requer Atenção'
        },
        indicadores_chave: {
          eficiencia_conciliacao: `${stats.taxa_conciliacao_media.toFixed(1)}%`,
          tempo_resolucao: `${stats.tempo_medio_resolucao} dias`,
          divergencias_criticas: Object.values(stats.divergencias_por_tipo).reduce((sum, val) => sum + val, 0),
          operadoras_performance: stats.performance_por_operadora
        },
        tendencias: {
          melhoria_mensal: '+2.3%', // Placeholder
          reducao_divergencias: '-15%', // Placeholder
          otimizacao_tempo: '-0.5 dias' // Placeholder
        },
        acoes_recomendadas: gerarAcoesRecomendadas(stats)
      };

      setRelatorioGerado(relatorioExecutivo);
      toast.success('Relatório executivo gerado com sucesso!');

    } catch (error) {
      console.error('Erro ao gerar relatório executivo:', error);
      toast.error('Erro ao gerar relatório executivo');
    } finally {
      setLoading(false);
    }
  };

  const gerarRecomendacoes = (stats: any): string[] => {
    const recomendacoes = [];
    
    if (stats.taxa_conciliacao_media < 90) {
      recomendacoes.push('Revisar processos de conciliação para aumentar taxa de sucesso');
    }
    
    if (stats.tempo_medio_resolucao > 3) {
      recomendacoes.push('Implementar workflow automatizado para reduzir tempo de resolução');
    }
    
    if (stats.divergencias_por_tipo.venda_sem_recebimento > 10) {
      recomendacoes.push('Verificar integração com operadoras para melhorar matching');
    }
    
    return recomendacoes;
  };

  const calcularEconomiaOperacional = (stats: any): number => {
    // Cálculo estimado baseado na redução de trabalho manual
    const horasEconomizadas = stats.taxa_conciliacao_media * 0.1; // Placeholder
    const custoHora = 50; // R$/hora placeholder
    return horasEconomizadas * custoHora;
  };

  const gerarAcoesRecomendadas = (stats: any): string[] => {
    const acoes = [];
    
    // Análise das operadoras
    Object.entries(stats.performance_por_operadora).forEach(([operadora, data]: [string, any]) => {
      if (data.taxa < 85) {
        acoes.push(`Revisar configurações de tolerância para ${operadora}`);
      }
    });
    
    // Análise de divergências
    if (stats.divergencias_por_tipo.valor_diferente > 20) {
      acoes.push('Ajustar tolerâncias de valor para reduzir falsos positivos');
    }
    
    acoes.push('Implementar monitoramento contínuo de performance');
    acoes.push('Estabelecer metas trimestrais de melhoria');
    
    return acoes;
  };

  const exportarRelatorio = async (formato: 'json' | 'csv' = 'json') => {
    if (!relatorioGerado) {
      toast.error('Nenhum relatório foi gerado ainda');
      return;
    }

    try {
      const dataStr = formato === 'json' 
        ? JSON.stringify(relatorioGerado, null, 2)
        : convertToCSV(relatorioGerado);

      const blob = new Blob([dataStr], { 
        type: formato === 'json' ? 'application/json' : 'text/csv' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${filtros.tipo_relatorio}_${new Date().toISOString().split('T')[0]}.${formato}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Relatório exportado em ${formato.toUpperCase()}`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const convertToCSV = (data: any): string => {
    // Implementação simplificada de conversão para CSV
    const headers = Object.keys(data);
    const csvContent = headers.join(',') + '\n' + 
      headers.map(header => JSON.stringify(data[header])).join(',');
    return csvContent;
  };

  const executarRelatorio = () => {
    switch (filtros.tipo_relatorio) {
      case 'divergencias':
        gerarRelatorioDivergencias();
        break;
      case 'performance':
        gerarRelatorioPerformance();
        break;
      case 'executivo':
        gerarRelatorioExecutivo();
        break;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Relatórios de Conciliação
          </h1>
          <p className="text-gray-600 mt-2">Análises avançadas e insights de performance</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="tipo_relatorio">Tipo de Relatório</Label>
              <Select 
                value={filtros.tipo_relatorio} 
                onValueChange={(value: any) => setFiltros(prev => ({ ...prev, tipo_relatorio: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="divergencias">Relatório de Divergências</SelectItem>
                  <SelectItem value="performance">Relatório de Performance</SelectItem>
                  <SelectItem value="executivo">Relatório Executivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="periodo_inicio">Período Início</Label>
              <Input
                id="periodo_inicio"
                type="date"
                value={filtros.periodo_inicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, periodo_inicio: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="periodo_fim">Período Fim</Label>
              <Input
                id="periodo_fim"
                type="date"
                value={filtros.periodo_fim}
                onChange={(e) => setFiltros(prev => ({ ...prev, periodo_fim: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="maquininha">Maquininha (Opcional)</Label>
              <Select 
                value={filtros.maquininha_id || 'todas'} 
                onValueChange={(value) => setFiltros(prev => ({ 
                  ...prev, 
                  maquininha_id: value === 'todas' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Maquininhas</SelectItem>
                  {maquininhas.filter(m => m.ativo).map(maquininha => (
                    <SelectItem key={maquininha.id} value={maquininha.id}>
                      {maquininha.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button 
              onClick={executarRelatorio}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>

            {relatorioGerado && (
              <>
                <Button variant="outline" onClick={() => exportarRelatorio('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar JSON
                </Button>
                <Button variant="outline" onClick={() => exportarRelatorio('csv')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Taxa de Conciliação</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {estatisticas.taxa_conciliacao_media.toFixed(1)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <Progress value={estatisticas.taxa_conciliacao_media} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Tempo Médio</p>
                  <p className="text-2xl font-bold text-green-700">
                    {estatisticas.tempo_medio_resolucao} dias
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Divergências Ativas</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {(() => {
                      if (!estatisticas?.divergencias_por_tipo) return 0;
                      return Object.values(estatisticas.divergencias_por_tipo)
                        .filter((val): val is number => typeof val === 'number')
                        .reduce((sum, val) => sum + val, 0);
                    })()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Economia Est.</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatarMoeda(calcularEconomiaOperacional(estatisticas))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados do Relatório */}
      {relatorioGerado && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultados do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(relatorioGerado, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};