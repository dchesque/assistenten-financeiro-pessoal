import React from 'react';
import { usePerformanceAvancado } from '@/hooks/usePerformanceAvancado';
import { useAuditoria } from '@/hooks/useAuditoria';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Database, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  BarChart3
} from 'lucide-react';
import { formatarMoeda, formatarData } from '@/utils/formatters';

export default function MonitoramentoPerformance() {
  const {
    loading: loadingPerf,
    optimizing,
    estatisticas,
    metricas,
    infoCache,
    analise,
    carregarTodosDados,
    limparCache,
    otimizarSistema,
    preCarregarDados
  } = usePerformanceAvancado();

  const {
    logs,
    estatisticas: statsAuditoria,
    loading: loadingAudit,
    buscarLogs,
    exportarLogs,
    limparLogsAntigos
  } = useAuditoria();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'otimo': return 'bg-green-500';
      case 'bom': return 'bg-blue-500';
      case 'regular': return 'bg-yellow-500';
      case 'atencao': return 'bg-orange-500';
      case 'critico': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'otimo': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'bom': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'regular': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'atencao': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'critico': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Monitoramento de Performance
          </h1>
          <p className="text-muted-foreground">
            Análise completa de performance, cache e auditoria do sistema
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={carregarTodosDados}
            disabled={loadingPerf}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingPerf ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            onClick={otimizarSistema}
            disabled={optimizing}
          >
            <Zap className={`w-4 h-4 mr-2 ${optimizing ? 'animate-pulse' : ''}`} />
            {optimizing ? 'Otimizando...' : 'Otimizar Sistema'}
          </Button>
        </div>
      </div>

      {/* Score Geral */}
      {analise && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Score Geral do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {analise.scoreGeral}%
                </div>
                <div className="text-sm text-muted-foreground">Score Geral</div>
                <Progress value={analise.scoreGeral} className="mt-2" />
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {analise.sucessos}
                </div>
                <div className="text-sm text-muted-foreground">Métricas OK</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {analise.problemas}
                </div>
                <div className="text-sm text-muted-foreground">Problemas</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {analise.hitRateCache.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métricas de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Métricas do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPerf ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Carregando métricas...</p>
                  </div>
                ) : metricas.length > 0 ? (
                  metricas.map((metrica, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(metrica.status)}
                        <div>
                          <div className="font-medium">{metrica.metrica.replace(/_/g, ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {metrica.recomendacao}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {metrica.valor.toLocaleString('pt-BR')} {metrica.unidade}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(metrica.status)} text-white`}
                        >
                          {metrica.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma métrica disponível
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Estatísticas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {estatisticas.total_vendas_mes || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Vendas/Mês</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatarMoeda(estatisticas.valor_total_mes || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Faturamento</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {estatisticas.contas_pendentes || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Contas Pendentes</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {estatisticas.clientes_ativos || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Clientes Ativos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Cache */}
        <TabsContent value="cache" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Gerenciamento de Cache
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do Cache */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {infoCache.totalItens || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Itens Cached</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(infoCache.hitRate || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Hit Rate</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {((infoCache.memoryUsage || 0) / 1024).toFixed(1)} KB
                  </div>
                  <div className="text-sm text-muted-foreground">Uso Memória</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {infoCache.totalHits || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Hits</div>
                </div>
              </div>

              {/* Ações de Cache */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={preCarregarDados}
                  disabled={loadingPerf}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Pré-carregar Dados
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => limparCache()}
                  disabled={loadingPerf}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Todo Cache
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => limparCache('vendas')}
                  disabled={loadingPerf}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Cache Vendas
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => limparCache('clientes')}
                  disabled={loadingPerf}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Cache Clientes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Auditoria */}
        <TabsContent value="auditoria" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estatísticas de Auditoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Estatísticas de Auditoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {statsAuditoria.total_operacoes}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Operações</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {statsAuditoria.atividade_recente}
                    </div>
                    <div className="text-sm text-muted-foreground">Últimas 24h</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {statsAuditoria.usuarios_ativos}
                    </div>
                    <div className="text-sm text-muted-foreground">Usuários Ativos</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {statsAuditoria.operacoes_por_tabela.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Tabelas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações de Auditoria */}
            <Card>
              <CardHeader>
                <CardTitle>Ações de Auditoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => buscarLogs()}
                  disabled={loadingAudit}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingAudit ? 'animate-spin' : ''}`} />
                  Carregar Logs Recentes
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => exportarLogs()}
                  disabled={loadingAudit}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Logs
                </Button>
                
                <Button
                  variant="outline"
                  onClick={limparLogsAntigos}
                  disabled={loadingAudit}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Logs Antigos (90+ dias)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Logs Recentes */}
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Logs Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {logs.slice(0, 10).map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="secondary">{log.operacao}</Badge>
                          <span className="ml-2 font-medium">{log.tabela}</span>
                          {log.descricao && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              - {log.descricao}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatarData(log.data_operacao)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Operações por Tabela */}
            <Card>
              <CardHeader>
                <CardTitle>Operações por Tabela</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statsAuditoria.operacoes_por_tabela.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{item.tabela}</span>
                      <Badge variant="secondary">{item.total}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Operações por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Operações por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statsAuditoria.operacoes_por_tipo.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{item.operacao}</span>
                      <Badge variant="secondary">{item.total}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}