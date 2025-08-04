import { useState } from 'react';
import { useIntegracaoCompleta } from '@/hooks/useIntegracaoCompleta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Play, BarChart3 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

export default function TesteIntegracaoCompleta() {
  const integracaoHook = useIntegracaoCompleta();
  const [testando, setTestando] = useState(false);

  const executarTeste = async () => {
    setTestando(true);
    await integracaoHook.testarConexaoCompleta();
    setTestando(false);
  };

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const StatusBadge = ({ status }: { status: boolean }) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'} className="ml-2">
        {status ? 'Conectado' : 'Desconectado'}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🧪 Teste de Integração Completa
            </h1>
            <p className="text-gray-600 mt-1">
              Verificar se todos os módulos estão conectados e funcionando
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={integracaoHook.recarregarTudo}
              disabled={integracaoHook.loading}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar Tudo
            </Button>
            
            <Button
              onClick={executarTeste}
              disabled={testando || integracaoHook.loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              {testando ? 'Testando...' : 'Executar Teste'}
            </Button>
          </div>
        </div>

        {/* Status Geral */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Status Geral do Sistema
            </CardTitle>
            <CardDescription>
              {integracaoHook.sistemaIntegrado 
                ? '✅ Todos os módulos estão integrados e funcionando'
                : '⚠️ Alguns módulos precisam de atenção'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Sistema Integrado</span>
                <Badge variant={integracaoHook.sistemaIntegrado ? 'default' : 'destructive'}>
                  {integracaoHook.sistemaIntegrado ? 'SIM' : 'NÃO'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Módulos Carregados</span>
                <Badge variant={integracaoHook.modulosCarregados ? 'default' : 'secondary'}>
                  {integracaoHook.modulosCarregados ? 'SIM' : 'CARREGANDO...'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Estado</span>
                <Badge variant={integracaoHook.loading ? 'secondary' : 'default'}>
                  {integracaoHook.loading ? 'PROCESSANDO' : 'PRONTO'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status por Módulo */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle>Status dos Módulos</CardTitle>
            <CardDescription>
              Verificação detalhada de cada módulo do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Vendas */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center">
                    <StatusIcon status={integracaoHook.statusIntegracao.vendas} />
                    <span className="ml-2">Vendas</span>
                  </h3>
                  <StatusBadge status={integracaoHook.statusIntegracao.vendas} />
                </div>
                <p className="text-sm text-gray-600">
                  {integracaoHook.vendas.vendas.length} vendas carregadas
                </p>
                <p className="text-xs text-gray-500">
                  Loading: {integracaoHook.vendas.loading ? 'Sim' : 'Não'}
                </p>
              </div>

              {/* Fornecedores */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center">
                    <StatusIcon status={integracaoHook.statusIntegracao.fornecedores} />
                    <span className="ml-2">Fornecedores</span>
                  </h3>
                  <StatusBadge status={integracaoHook.statusIntegracao.fornecedores} />
                </div>
                <p className="text-sm text-gray-600">
                  {integracaoHook.fornecedores.fornecedores.length} fornecedores carregados
                </p>
                <p className="text-xs text-gray-500">
                  Loading: {integracaoHook.fornecedores.loading ? 'Sim' : 'Não'}
                </p>
              </div>

              {/* Contas a Pagar */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center">
                    <StatusIcon status={integracaoHook.statusIntegracao.contas_pagar} />
                    <span className="ml-2">Contas a Pagar</span>
                  </h3>
                  <StatusBadge status={integracaoHook.statusIntegracao.contas_pagar} />
                </div>
                <p className="text-sm text-gray-600">
                  {integracaoHook.contasPagar.contas.length} contas carregadas
                </p>
                <p className="text-xs text-gray-500">
                  Loading: {integracaoHook.contasPagar.estados.carregandoContas ? 'Sim' : 'Não'}
                </p>
              </div>

              {/* Plano de Contas */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center">
                    <StatusIcon status={integracaoHook.statusIntegracao.plano_contas} />
                    <span className="ml-2">Plano de Contas</span>
                  </h3>
                  <StatusBadge status={integracaoHook.statusIntegracao.plano_contas} />
                </div>
                <p className="text-sm text-gray-600">
                  {integracaoHook.planoContas.planoContas.length} categorias carregadas
                </p>
                <p className="text-xs text-gray-500">
                  Loading: {integracaoHook.planoContas.loading ? 'Sim' : 'Não'}
                </p>
              </div>

              {/* DRE */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center">
                    <StatusIcon status={integracaoHook.statusIntegracao.dre} />
                    <span className="ml-2">DRE</span>
                  </h3>
                  <StatusBadge status={integracaoHook.statusIntegracao.dre} />
                </div>
                <p className="text-sm text-gray-600">
                  {integracaoHook.dreHook.dadosEssenciais.length} períodos com dados
                </p>
                <p className="text-xs text-gray-500">
                  Loading: {integracaoHook.dreHook.loading ? 'Sim' : 'Não'}
                </p>
              </div>

              {/* Fluxo de Caixa */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center">
                    <StatusIcon status={integracaoHook.statusIntegracao.fluxo_caixa} />
                    <span className="ml-2">Fluxo de Caixa</span>
                  </h3>
                  <StatusBadge status={integracaoHook.statusIntegracao.fluxo_caixa} />
                </div>
                <p className="text-sm text-gray-600">
                  Integração automática ativa
                </p>
                <p className="text-xs text-gray-500">
                  Status: Conectado ao sistema de vendas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle>Estatísticas do Sistema</CardTitle>
            <CardDescription>
              Dados consolidados de todos os módulos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {integracaoHook.estatisticasGerais.vendas_mes}
                </div>
                <div className="text-sm text-blue-800">Vendas no Mês</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  R$ {integracaoHook.estatisticasGerais.receita_mes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-green-800">Receita do Mês</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {integracaoHook.estatisticasGerais.contas_pendentes}
                </div>
                <div className="text-sm text-red-800">Contas Pendentes</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  R$ {integracaoHook.estatisticasGerais.valor_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-orange-800">Valor Pendente</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {integracaoHook.estatisticasGerais.fornecedores_ativos}
                </div>
                <div className="text-sm text-purple-800">Fornecedores Ativos</div>
              </div>
              
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {integracaoHook.estatisticasGerais.categorias_ativas}
                </div>
                <div className="text-sm text-indigo-800">Categorias Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="bg-yellow-50 border border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              Como usar este teste
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-700">
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>Recarregar Tudo:</strong> Força o recarregamento de todos os módulos do sistema</li>
              <li><strong>Executar Teste:</strong> Executa uma bateria de testes para verificar a conectividade</li>
              <li><strong>Status dos Módulos:</strong> Mostra se cada módulo está conectado ao Supabase</li>
              <li><strong>Estatísticas:</strong> Dados consolidados de todos os módulos integrados</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}