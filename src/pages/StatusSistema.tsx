import { useEffect } from 'react';
import { useValidacaoSistema } from '@/hooks/useValidacaoSistema';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Shield, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingStates } from '@/components/ui/LoadingStates';

export default function StatusSistema() {
  const { validacao, loading, sistemaEstaFuncional, validarModulo, revalidar } = useValidacaoSistema();

  useEffect(() => {
    document.title = 'Status do Sistema - JC Financeiro';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <LoadingStates.CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-6 h-6 text-green-600" />
    ) : (
      <XCircle className="w-6 h-6 text-red-600" />
    );
  };

  const getStatusColor = (status: boolean) => {
    return status 
      ? 'bg-green-100/80 text-green-700 border-green-200/50'
      : 'bg-red-100/80 text-red-700 border-red-200/50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl"></div>
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Status do Sistema</h1>
                <p className="text-gray-600">Validação completa da integridade e funcionalidade do sistema</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  sistemaEstaFuncional 
                    ? 'bg-green-100/80 text-green-700' 
                    : 'bg-red-100/80 text-red-700'
                }`}>
                  {sistemaEstaFuncional ? '✅ Sistema Operacional' : '⚠️ Problemas Detectados'}
                </div>
                
                <Button onClick={revalidar} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Revalidar
                </Button>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tabelas e Dados */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100/80 rounded-xl">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Banco de Dados</h3>
                    <p className="text-sm text-gray-600">Tabelas e estrutura de dados</p>
                  </div>
                </div>
                {getStatusIcon(validacao.tabelas_criadas && validacao.dados_minimos)}
              </div>
              
              <div className="space-y-3">
                <div className={`px-3 py-2 rounded-lg text-sm ${getStatusColor(validacao.tabelas_criadas)}`}>
                  Tabelas criadas: {validacao.tabelas_criadas ? 'Sim' : 'Não'}
                </div>
                <div className={`px-3 py-2 rounded-lg text-sm ${getStatusColor(validacao.dados_minimos)}`}>
                  Dados mínimos: {validacao.dados_minimos ? 'Sim' : 'Não'}
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100/80 rounded-xl">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Segurança</h3>
                    <p className="text-sm text-gray-600">RLS e autenticação</p>
                  </div>
                </div>
                {getStatusIcon(validacao.policies_configuradas && validacao.usuarios_autenticados)}
              </div>
              
              <div className="space-y-3">
                <div className={`px-3 py-2 rounded-lg text-sm ${getStatusColor(validacao.policies_configuradas)}`}>
                  RLS Policies: {validacao.policies_configuradas ? 'Ativo' : 'Problema'}
                </div>
                <div className={`px-3 py-2 rounded-lg text-sm ${getStatusColor(validacao.usuarios_autenticados)}`}>
                  Autenticação: {validacao.usuarios_autenticados ? 'Ativo' : 'Problema'}
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100/80 rounded-xl">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                    <p className="text-sm text-gray-600">Triggers e otimizações</p>
                  </div>
                </div>
                {getStatusIcon(validacao.triggers_ativos)}
              </div>
              
              <div className="space-y-3">
                <div className={`px-3 py-2 rounded-lg text-sm ${getStatusColor(validacao.triggers_ativos)}`}>
                  Triggers: {validacao.triggers_ativos ? 'Ativos' : 'Problemas'}
                </div>
                <div className="px-3 py-2 rounded-lg text-sm bg-blue-100/80 text-blue-700">
                  Integrações: {validacao.integracoes_ativas.length} módulos
                </div>
              </div>
            </div>

            {/* Integrações */}
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100/80 rounded-xl">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Módulos Ativos</h3>
                    <p className="text-sm text-gray-600">Integrações funcionais</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">{validacao.integracoes_ativas.length}</span>
              </div>
              
              <div className="space-y-2">
                {validacao.integracoes_ativas.length > 0 ? (
                  validacao.integracoes_ativas.map((integracao, index) => (
                    <div key={index} className="px-3 py-2 rounded-lg text-sm bg-green-100/80 text-green-700">
                      ✅ {integracao}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 rounded-lg text-sm bg-yellow-100/80 text-yellow-700">
                    Nenhum módulo ativo ainda
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Problemas Encontrados */}
          {validacao.problemas_encontrados.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm border border-red-200/50 rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Problemas Encontrados</h3>
              </div>
              
              <div className="space-y-2">
                {validacao.problemas_encontrados.map((problema, index) => (
                  <div key={index} className="px-4 py-3 rounded-lg bg-red-50/80 text-red-700 text-sm">
                    🚨 {problema}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendações */}
          {validacao.recomendacoes.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100/80 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Recomendações</h3>
              </div>
              
              <div className="space-y-2">
                {validacao.recomendacoes.map((recomendacao, index) => (
                  <div key={index} className="px-4 py-3 rounded-lg bg-blue-50/80 text-blue-700 text-sm">
                    💡 {recomendacao}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => validarModulo('fluxo-caixa')}
                variant="outline"
                className="justify-start"
              >
                Validar Fluxo de Caixa
              </Button>
              
              <Button 
                onClick={() => validarModulo('dre')}
                variant="outline"
                className="justify-start"
              >
                Validar DRE
              </Button>
              
              <Button 
                onClick={() => validarModulo('lancamento-lote')}
                variant="outline"
                className="justify-start"
              >
                Validar Lançamentos
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}