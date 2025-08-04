import { useRelatoriosGerais } from '@/hooks/useRelatoriosGerais';
import { FiltrosRelatorio } from '@/components/relatorios/FiltrosRelatorio';
import { ResumoExecutivo } from '@/components/relatorios/ResumoExecutivo';
import { RelatorioFornecedores } from '@/components/relatorios/RelatorioFornecedores';
import { AnaliseContasPagar } from '@/components/relatorios/AnaliseContasPagar';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';

export default function RelatoriosGerais() {
  const {
    filtros,
    setFiltros,
    loading,
    error,
    dados,
    resumoExecutivo,
    relatorioFornecedores,
    analiseContasPagar,
    gerarRelatorio,
    exportarPDF,
    exportarExcel,
    aplicarPeriodoRapido,
    PERIODOS_RAPIDOS
  } = useRelatoriosGerais();

  // Blur abstratos de fundo
  const BlurAbstracts = () => (
    <>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
    </>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 overflow-hidden">
      <BlurAbstracts />
      
      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/relatorios-gerais')}
        title="Relatórios Gerais"
        subtitle="Central de análises e relatórios operacionais • Dados consolidados"
      />
      
      <div className="relative z-10 p-4 lg:p-8 space-y-6">

        {/* Filtros */}
        <FiltrosRelatorio
          filtros={filtros}
          onFiltrosChange={(novosFiltros) => setFiltros(prev => ({ ...prev, ...novosFiltros }))}
          onGerarRelatorio={gerarRelatorio}
          onExportarPDF={exportarPDF}
          onExportarExcel={exportarExcel}
          loading={loading}
          periodosRapidos={PERIODOS_RAPIDOS}
          onAplicarPeriodoRapido={aplicarPeriodoRapido}
        />

        {/* Estado de Erro */}
        {error && (
          <Card className="bg-red-50/80 backdrop-blur-sm border border-red-200">
            <CardContent className="p-4">
              <p className="text-red-700 text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Conteúdo dos Relatórios */}
        {dados && (
          <div className="space-y-6">
            {/* Resumo Executivo */}
            <ResumoExecutivo 
              dados={resumoExecutivo}
              periodo={dados.periodo}
            />

            {/* Grid de Relatórios */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <RelatorioFornecedores dados={relatorioFornecedores} />
              <AnaliseContasPagar dados={analiseContasPagar} />
            </div>
          </div>
        )}

        {/* Estado de Loading */}
        {loading && !dados && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}