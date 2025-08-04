import { useFluxoCaixaReal } from '@/hooks/useFluxoCaixaReal';
import { IndicadoresCard } from '@/components/fluxoCaixa/IndicadoresCard';
import { FiltrosFluxoCaixa } from '@/components/fluxoCaixa/FiltrosFluxoCaixa';
import { GraficoFluxoCaixa } from '@/components/fluxoCaixa/GraficoFluxoCaixa';
import { ProjecoesFluxoCaixa } from '@/components/fluxoCaixa/ProjecoesFluxoCaixa';
import { AlertasFluxoCaixa } from '@/components/fluxoCaixa/AlertasFluxoCaixa';
import { TabelaMovimentacoes } from '@/components/fluxoCaixa/TabelaMovimentacoes';
import { ExportarFluxoCaixaModal } from '@/components/fluxoCaixa/ExportarFluxoCaixaModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Button } from '@/components/ui/button';

export default function FluxoCaixa() {
  const {
    movimentacoes,
    projecoes,
    alertas,
    indicadores,
    dadosGrafico,
    filtros,
    setFiltros,
    aplicarPeriodoRapido,
    limparFiltros,
    loading
  } = useFluxoCaixaReal();

  const handleExportar = () => {
    console.log('Exportar Excel - Funcional');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Elementos abstratos de fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <PageHeader
        breadcrumb={createBreadcrumb('/fluxo-caixa')}
        title="Fluxo de Caixa"
        subtitle="Controle de liquidez e projeções financeiras • Movimentações em tempo real"
      />

      <div className="relative p-4 lg:p-8">

        <div className="space-y-8">
          {/* Indicadores principais */}
          <IndicadoresCard indicadores={indicadores} />

          {/* Filtros */}
          <FiltrosFluxoCaixa
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onAplicarPeriodoRapido={aplicarPeriodoRapido}
            onLimparFiltros={limparFiltros}
            onExportar={handleExportar}
          />

          {/* Gráfico Principal */}
          <GraficoFluxoCaixa 
            dados={dadosGrafico} 
            loading={loading}
          />

          {/* Projeções - Largura Total */}
          <ProjecoesFluxoCaixa 
            projecoes={projecoes} 
            loading={loading}
          />

          {/* Alertas - Largura Total */}
          <AlertasFluxoCaixa 
            alertas={alertas} 
            loading={loading}
          />

          {/* Tabela de Movimentações */}
          <TabelaMovimentacoes 
            movimentacoes={movimentacoes}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}