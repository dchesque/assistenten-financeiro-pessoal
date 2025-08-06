import { DollarSign, AlertTriangle, Calendar, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { MetricCard } from '@/components/dashboard/MetricCard';
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
    <div className="p-4 lg:p-8">
      <div className="space-y-8">
      {/* Header Premium */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Financeiro</h1>
          <p className="text-gray-600 mt-1">Visão geral das suas finanças pessoais</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <select className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Últimos 30 dias</option>
            <option>Últimos 7 dias</option>
            <option>Últimos 90 dias</option>
          </select>
        </div>
      </div>
      
      {/* Métricas Premium - Grid Responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          titulo="Saldo Total"
          valor={kpisPersonal.saldoTotal}
          formato="moeda"
          icone={<DollarSign className="w-6 h-6 text-blue-600" />}
          cor="blue"
          trend="up"
        />
        
        <MetricCard
          titulo="Contas a Pagar"
          valor={resumos.pendentes.valor}
          formato="moeda"
          icone={<AlertTriangle className="w-6 h-6 text-red-600" />}
          cor="red"
        />
        
        <MetricCard
          titulo="Gastos do Mês"
          valor={kpisPersonal.gastosMes}
          formato="moeda"
          icone={<Calendar className="w-6 h-6 text-blue-600" />}
          cor="blue"
        />
        
        <MetricCard
          titulo="Saldo Líquido"
          valor={kpisPersonal.fluxoLiquido}
          formato="moeda"
          icone={<CheckCircle className="w-6 h-6 text-green-600" />}
          cor="green"
        />
      </div>

      {/* Resumo Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Contas Pendentes</h3>
          <p className="text-2xl font-bold text-blue-600">{resumos.pendentes.total}</p>
          <p className="text-sm text-gray-600">R$ {resumos.pendentes.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Vencidas</h3>
          <p className="text-2xl font-bold text-red-600">{resumos.vencidas.total}</p>
          <p className="text-sm text-gray-600">R$ {resumos.vencidas.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Vence em 7 dias</h3>
          <p className="text-2xl font-bold text-yellow-600">{resumos.vence7Dias.total}</p>
          <p className="text-sm text-gray-600">R$ {resumos.vence7Dias.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Pagas no Mês</h3>
          <p className="text-2xl font-bold text-green-600">{resumos.pagasMes.total}</p>
          <p className="text-sm text-gray-600">R$ {resumos.pagasMes.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div>
        <AcoesRapidas />
      </div>
    </div>
    </div>
  );
}