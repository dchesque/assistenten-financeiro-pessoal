import React, { useState } from 'react';
import { useIntegracaoModulos } from '@/hooks/useIntegracaoModulos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRightLeft, 
  FileText, 
  TrendingUp, 
  Shuffle, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calculator,
  Banknote,
  Download
} from 'lucide-react';
import { formatarMoeda, formatarData } from '@/utils/formatters';

export default function IntegracaoModulos() {
  const {
    loading,
    erro,
    lancarVendaFluxoCaixa,
    classificarVendaDRE,
    reconciliarMovimentacoes,
    gerarRelatorioGerencial,
    processarLoteVendas,
    reprocessarVendasExistentes,
    verificarStatusIntegracao
  } = useIntegracaoModulos();

  const [vendaId, setVendaId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [bancoId, setBancoId] = useState('');
  const [resultadoReconciliacao, setResultadoReconciliacao] = useState<any>(null);
  const [relatorioGerencial, setRelatorioGerencial] = useState<any>(null);
  const [statusIntegracao, setStatusIntegracao] = useState<any>(null);

  const handleReconciliacao = async () => {
    if (!dataInicio || !dataFim) {
      alert('Por favor, informe o período para reconciliação');
      return;
    }

    const resultado = await reconciliarMovimentacoes(
      dataInicio,
      dataFim,
      bancoId ? parseInt(bancoId) : undefined
    );
    
    if (resultado) {
      setResultadoReconciliacao(resultado);
    }
  };

  const handleRelatorio = async () => {
    if (!dataInicio || !dataFim) {
      alert('Por favor, informe o período para o relatório');
      return;
    }

    const relatorio = await gerarRelatorioGerencial(dataInicio, dataFim);
    
    if (relatorio) {
      setRelatorioGerencial(relatorio);
    }
  };

  const handleVerificarStatus = async () => {
    if (!vendaId) {
      alert('Por favor, informe o ID da venda');
      return;
    }

    const status = await verificarStatusIntegracao(parseInt(vendaId));
    setStatusIntegracao(status);
  };

  const exportarRelatorio = () => {
    if (!relatorioGerencial) return;

    const dadosExportacao = {
      periodo: relatorioGerencial.periodo,
      metricas_basicas: {
        total_vendas: relatorioGerencial.total_vendas,
        receita_bruta: relatorioGerencial.receita_bruta,
        receita_liquida: relatorioGerencial.receita_liquida,
        ticket_medio: relatorioGerencial.ticket_medio
      },
      vendas_por_forma_pagamento: relatorioGerencial.vendas_por_forma_pagamento,
      top_categorias: relatorioGerencial.top_categorias,
      performance_vendedores: relatorioGerencial.performance_vendedores,
      indicadores_dre: relatorioGerencial.indicadores_dre
    };

    const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_gerencial_${relatorioGerencial.periodo.replace(' a ', '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Integração de Módulos
          </h1>
          <p className="text-muted-foreground">
            Integração automática entre Vendas, Fluxo de Caixa e DRE
          </p>
        </div>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">Erro:</span>
            <span className="text-red-700">{erro}</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="fluxo-caixa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fluxo-caixa">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="reconciliacao">Reconciliação</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Aba Fluxo de Caixa */}
        <TabsContent value="fluxo-caixa" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lançamentos Automáticos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Lançamentos Automáticos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="venda-id">ID da Venda</Label>
                  <Input
                    id="venda-id"
                    value={vendaId}
                    onChange={(e) => setVendaId(e.target.value)}
                    placeholder="Digite o ID da venda"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => vendaId && lancarVendaFluxoCaixa(parseInt(vendaId))}
                    disabled={loading || !vendaId}
                    className="flex-1"
                  >
                    <Banknote className="w-4 h-4 mr-2" />
                    Lançar no Fluxo
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleVerificarStatus}
                    disabled={loading || !vendaId}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verificar Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reprocessamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Reprocessamento em Lote
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="data-inicio">Data Início</Label>
                    <Input
                      id="data-inicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data-fim">Data Fim</Label>
                    <Input
                      id="data-fim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={() => reprocessarVendasExistentes(dataInicio, dataFim)}
                  disabled={loading || !dataInicio || !dataFim}
                  className="w-full"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  {loading ? 'Processando...' : 'Reprocessar Vendas'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Status da Integração */}
          {statusIntegracao && (
            <Card>
              <CardHeader>
                <CardTitle>Status da Integração - Venda #{vendaId}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={statusIntegracao.temFluxoCaixa ? "default" : "secondary"}
                        className={statusIntegracao.temFluxoCaixa ? "bg-green-500" : "bg-red-500"}
                      >
                        {statusIntegracao.temFluxoCaixa ? "Integrado" : "Não Integrado"}
                      </Badge>
                      <span className="font-medium">Fluxo de Caixa</span>
                    </div>
                    
                    {statusIntegracao.dadosMovimentacao && (
                      <div className="ml-4 text-sm text-muted-foreground">
                        <p>Valor: {formatarMoeda(statusIntegracao.dadosMovimentacao.valor)}</p>
                        <p>Data: {formatarData(statusIntegracao.dadosMovimentacao.data_movimentacao)}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={statusIntegracao.temClassificacaoDRE ? "default" : "secondary"}
                        className={statusIntegracao.temClassificacaoDRE ? "bg-green-500" : "bg-red-500"}
                      >
                        {statusIntegracao.temClassificacaoDRE ? "Classificado" : "Não Classificado"}
                      </Badge>
                      <span className="font-medium">DRE</span>
                    </div>
                    
                    {statusIntegracao.classificacaoDRE && (
                      <div className="ml-4 text-sm text-muted-foreground">
                        <p>Categoria: {statusIntegracao.classificacaoDRE.nome}</p>
                        <p>Tipo DRE: {statusIntegracao.classificacaoDRE.tipo_dre}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba DRE */}
        <TabsContent value="dre" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Classificação Automática DRE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="venda-id-dre">ID da Venda</Label>
                <Input
                  id="venda-id-dre"
                  value={vendaId}
                  onChange={(e) => setVendaId(e.target.value)}
                  placeholder="Digite o ID da venda"
                />
              </div>
              
              <Button
                onClick={() => vendaId && classificarVendaDRE(parseInt(vendaId))}
                disabled={loading || !vendaId}
                className="w-full"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Classificar na DRE
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <h4 className="font-medium mb-2">Classificação Automática:</h4>
                <ul className="space-y-1">
                  <li>• <strong>Produto:</strong> Receita de Vendas - Produtos</li>
                  <li>• <strong>Serviço:</strong> Receita de Vendas - Serviços</li>
                  <li>• <strong>Devolução:</strong> Devoluções de Vendas</li>
                  <li>• <strong>Outros:</strong> Outras Receitas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Reconciliação */}
        <TabsContent value="reconciliacao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  Reconciliação Bancária
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="reconciliacao-inicio">Data Início</Label>
                    <Input
                      id="reconciliacao-inicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reconciliacao-fim">Data Fim</Label>
                    <Input
                      id="reconciliacao-fim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="banco-id">Banco (Opcional)</Label>
                  <Input
                    id="banco-id"
                    value={bancoId}
                    onChange={(e) => setBancoId(e.target.value)}
                    placeholder="ID do banco (deixe vazio para todos)"
                  />
                </div>
                
                <Button
                  onClick={handleReconciliacao}
                  disabled={loading || !dataInicio || !dataFim}
                  className="w-full"
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  {loading ? 'Reconciliando...' : 'Executar Reconciliação'}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado */}
            {resultadoReconciliacao && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultado da Reconciliação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {resultadoReconciliacao.movimentacoes_reconciliadas}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Movimentações Reconciliadas
                      </div>
                    </div>
                    
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatarMoeda(resultadoReconciliacao.valor_total_reconciliado)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Valor Total
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Aba Relatórios */}
        <TabsContent value="relatorios" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geração de Relatório */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Relatório Gerencial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="relatorio-inicio">Data Início</Label>
                    <Input
                      id="relatorio-inicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="relatorio-fim">Data Fim</Label>
                    <Input
                      id="relatorio-fim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleRelatorio}
                    disabled={loading || !dataInicio || !dataFim}
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {loading ? 'Gerando...' : 'Gerar Relatório'}
                  </Button>
                  
                  {relatorioGerencial && (
                    <Button
                      variant="outline"
                      onClick={exportarRelatorio}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preview do Relatório */}
            {relatorioGerencial && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Relatório</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold text-primary">
                          {relatorioGerencial.total_vendas}
                        </div>
                        <div className="text-xs text-muted-foreground">Vendas</div>
                      </div>
                      
                      <div className="text-center p-3 border rounded">
                        <div className="text-lg font-bold text-green-600">
                          {formatarMoeda(relatorioGerencial.receita_liquida)}
                        </div>
                        <div className="text-xs text-muted-foreground">Receita Líquida</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Período:</strong> {relatorioGerencial.periodo}</p>
                      <p><strong>Ticket Médio:</strong> {formatarMoeda(relatorioGerencial.ticket_medio)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}