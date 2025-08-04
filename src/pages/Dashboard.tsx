import { DollarSign, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { KPICard } from '@/components/dashboard/KPICard';
import { AlertaCard } from '@/components/dashboard/AlertaCard';
import { GraficoEvolucao } from '@/components/dashboard/GraficoEvolucao';
import { GraficoDistribuicao } from '@/components/dashboard/GraficoDistribuicao';
import { ResumoMaquininhas } from '@/components/dashboard/ResumoMaquininhas';
import { ResumoCheques } from '@/components/dashboard/ResumoCheques';
import { VendedoresWidget } from '@/components/dashboard/VendedoresWidget';
import { AlertasInteligentesWidget } from '@/components/vendedores/AlertasInteligentesWidget';
import { DashboardExecutivoVendedores } from '@/components/vendedores/DashboardExecutivoVendedores';
import { AcoesRapidas } from '@/components/dashboard/AcoesRapidas';
import { useDashboardExecutivo } from '@/hooks/useDashboardExecutivo';

export default function Dashboard() {
  const { kpis, alertas, evolucaoMensal, despesasPorCategoria, resumoMaquininha, resumoCheques, loading } = useDashboardExecutivo();

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Blur background abstrato */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <PageHeader
        breadcrumb={createBreadcrumb('/dashboard')}
        title="Dashboard Executivo"
        subtitle="Visão geral completa do negócio • Indicadores em tempo real"
      />
      
      <div className="relative p-4 lg:p-8">
        
        {/* SEÇÃO 1: KPIs Principais */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            titulo="Saldo Total"
            valor={`R$ ${kpis.saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            variacao={{ valor: "+8,2% vs mês anterior", tipo: "positiva" }}
            detalhes={["Itaú: R$ 85.200,00", "Bradesco: R$ 42.250,00"]}
            status="saudavel"
            icone={<DollarSign className="w-6 h-6" />}
            gradiente="from-green-500 to-green-600"
          />
          
          <KPICard
            titulo="Contas Pendentes"
            valor={`R$ ${kpis.contasPendentes.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtitulo={`${kpis.contasPendentes.quantidade} contas · ${kpis.contasPendentes.vencidas} vencidas`}
            detalhes={["Próximo vencimento: Amanhã - R$ 2.500"]}
            status={kpis.contasPendentes.vencidas > 0 ? "critico" : "atencao"}
            icone={<AlertTriangle className="w-6 h-6" />}
            gradiente="from-red-500 to-red-600"
          />
          
          <KPICard
            titulo="Receitas Recebidas"
            valor={`R$ ${kpis.receitas.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtitulo={`Meta: R$ ${kpis.receitas.meta.toLocaleString('pt-BR')} (${kpis.receitas.percentualMeta.toFixed(0)}%)`}
            detalhes={[`Projeção fim mês: R$ ${kpis.receitas.projecao.toLocaleString('pt-BR')}`]}
            variacao={{ valor: "+12,5% vs mês anterior", tipo: "positiva" }}
            icone={<Calendar className="w-6 h-6" />}
            gradiente="from-blue-500 to-blue-600"
          />
          
          <KPICard
            titulo="Fluxo Líquido"
            valor={`R$ ${kpis.fluxoLiquido >= 0 ? '+' : ''}${kpis.fluxoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtitulo="Entradas - Saídas"
            detalhes={["Projeção 30 dias: R$ +67.200,00"]}
            status={kpis.fluxoLiquido > 0 ? "saudavel" : "critico"}
            icone={<CheckCircle className="w-6 h-6" />}
            gradiente="from-purple-500 to-purple-600"
          />
        </div>

        {/* SEÇÃO 2: Gráficos */}
        <div className="relative grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          <GraficoEvolucao dados={evolucaoMensal} />
          <GraficoDistribuicao dados={despesasPorCategoria} />
        </div>

        {/* SEÇÃO 3: Alertas Inteligentes */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {alertas.map((alerta) => (
            <AlertaCard key={alerta.id} alerta={alerta} />
          ))}
        </div>

        {/* SEÇÃO 4: Conciliação e Maquininhas */}
        <div className="relative mb-6">
          <ResumoMaquininhas resumo={resumoMaquininha} />
        </div>

        {/* SEÇÃO 5: Controle de Cheques */}
        <div className="relative mb-6">
          <ResumoCheques resumo={resumoCheques} />
        </div>

        {/* SEÇÃO 6: Dashboard Executivo de Vendedores */}
        <div className="relative mb-6">
          <DashboardExecutivoVendedores />
        </div>

        {/* SEÇÃO 7: Alertas Inteligentes de Vendedores e Widget */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <AlertasInteligentesWidget />
          </div>
          <div>
            <VendedoresWidget />
          </div>
        </div>

        {/* SEÇÃO 8: Ações Rápidas */}
        <div className="relative">
          <AcoesRapidas />
        </div>
      </div>
    </div>
  );
}