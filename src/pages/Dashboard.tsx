import { DollarSign, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { KPICard } from '@/components/dashboard/KPICard';
import { AcoesRapidas } from '@/components/dashboard/AcoesRapidas';
import { useContasPagarOtimizado } from '@/hooks/useContasPagarOtimizado';

export default function Dashboard() {
  const { resumos, estados } = useContasPagarOtimizado();

  if (estados.carregandoContas) {
    return <div className="p-8">Carregando...</div>;
  }

  // Dados simulados para KPIs pessoais
  const kpisPersonal = {
    saldoTotal: 127450.00,
    gastosMes: resumos.pendentes.valor + resumos.vencidas.valor,
    metaMensal: 8000.00,
    fluxoLiquido: 4250.00
  };

  const percentualMeta = (kpisPersonal.gastosMes / kpisPersonal.metaMensal) * 100;

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
        title="Assistente Financeiro Pessoal"
        subtitle="Controle suas despesas pessoais • Indicadores em tempo real"
      />
      
      <div className="relative p-4 lg:p-8">
        
        {/* KPIs Principais */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            titulo="Saldo Total"
            valor={`R$ ${kpisPersonal.saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            variacao={{ valor: "+3,2% vs mês anterior", tipo: "positiva" }}
            detalhes={["Contas correntes e poupança"]}
            status="saudavel"
            icone={<DollarSign className="w-6 h-6" />}
            gradiente="from-green-500 to-green-600"
          />
          
          <KPICard
            titulo="Contas a Pagar"
            valor={`R$ ${resumos.pendentes.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtitulo={`${resumos.pendentes.total} contas • ${resumos.vencidas.total} vencidas`}
            detalhes={[`Vence em 7 dias: ${resumos.vence7Dias.total} contas`]}
            status={resumos.vencidas.total > 0 ? "critico" : "atencao"}
            icone={<AlertTriangle className="w-6 h-6" />}
            gradiente="from-red-500 to-red-600"
          />
          
          <KPICard
            titulo="Gastos do Mês"
            valor={`R$ ${kpisPersonal.gastosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtitulo={`Meta: R$ ${kpisPersonal.metaMensal.toLocaleString('pt-BR')} (${percentualMeta.toFixed(0)}%)`}
            detalhes={[`${percentualMeta > 100 ? 'Acima' : 'Dentro'} da meta mensal`]}
            variacao={{ valor: percentualMeta > 100 ? "Meta ultrapassada" : "Dentro da meta", tipo: percentualMeta > 100 ? "negativa" : "positiva" }}
            icone={<Calendar className="w-6 h-6" />}
            gradiente="from-blue-500 to-blue-600"
          />
          
          <KPICard
            titulo="Saldo Líquido"
            valor={`R$ ${kpisPersonal.fluxoLiquido >= 0 ? '+' : ''}${kpisPersonal.fluxoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtitulo="Rendimentos - Gastos"
            detalhes={["Controle mensal"]}
            status={kpisPersonal.fluxoLiquido > 0 ? "saudavel" : "critico"}
            icone={<CheckCircle className="w-6 h-6" />}
            gradiente="from-purple-500 to-purple-600"
          />
        </div>

        {/* Resumo de Contas por Status */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Contas Pendentes</h3>
            <p className="text-2xl font-bold text-blue-600">{resumos.pendentes.total}</p>
            <p className="text-sm text-gray-600">R$ {resumos.pendentes.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Vencidas</h3>
            <p className="text-2xl font-bold text-red-600">{resumos.vencidas.total}</p>
            <p className="text-sm text-gray-600">R$ {resumos.vencidas.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Vence em 7 dias</h3>
            <p className="text-2xl font-bold text-yellow-600">{resumos.vence7Dias.total}</p>
            <p className="text-sm text-gray-600">R$ {resumos.vence7Dias.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Pagas no Mês</h3>
            <p className="text-2xl font-bold text-green-600">{resumos.pagasMes.total}</p>
            <p className="text-sm text-gray-600">R$ {resumos.pagasMes.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="relative">
          <AcoesRapidas />
        </div>
      </div>
    </div>
  );
}