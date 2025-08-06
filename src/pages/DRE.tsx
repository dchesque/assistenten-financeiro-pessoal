import React, { useState } from 'react';
import { Download, TrendingUp, TrendingDown, BarChart3, DollarSign, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { GraficoPremium } from '@/components/relatorios/GraficoPremium';
import { TabelaDRE } from '@/components/relatorios/TabelaDRE';
import { formatarMoeda } from '@/lib/formatacaoBrasileira';
import { format } from 'date-fns';

// Mock data - substituir pelos hooks reais
const dreDataMock = {
  receitaBruta: 500000,
  receitaLiquida: 450000,
  despesasTotais: 320000,
  resultadoLiquido: 130000
};

const evolucaoReceitasMock = [
  { periodo: 'Jan', valor: 400000 },
  { periodo: 'Fev', valor: 420000 },
  { periodo: 'Mar', valor: 450000 },
  { periodo: 'Abr', valor: 480000 },
  { periodo: 'Mai', valor: 500000 }
];

const evolucaoDespesasMock = [
  { periodo: 'Jan', valor: 280000 },
  { periodo: 'Fev', valor: 290000 },
  { periodo: 'Mar', valor: 300000 },
  { periodo: 'Abr', valor: 310000 },
  { periodo: 'Mai', valor: 320000 }
];

const dreDetalhadaMock = [
  {
    codigo: '1.0.0',
    nome: 'RECEITA BRUTA',
    nivel: 1,
    tipo: 'receita' as const,
    valorAtual: 500000,
    valorAnterior: 480000,
    variacao: 4.2,
    percentualTotal: 100,
    temFilhos: true,
    filhos: [
      {
        codigo: '1.1.0',
        nome: 'Vendas de Produtos',
        nivel: 2,
        tipo: 'receita' as const,
        valorAtual: 450000,
        valorAnterior: 430000,
        variacao: 4.7,
        percentualTotal: 90
      },
      {
        codigo: '1.2.0',
        nome: 'Vendas de Serviços',
        nivel: 2,
        tipo: 'receita' as const,
        valorAtual: 50000,
        valorAnterior: 50000,
        variacao: 0,
        percentualTotal: 10
      }
    ]
  },
  {
    codigo: '2.0.0',
    nome: 'DESPESAS OPERACIONAIS',
    nivel: 1,
    tipo: 'despesa' as const,
    valorAtual: 320000,
    valorAnterior: 310000,
    variacao: 3.2,
    percentualTotal: 64,
    temFilhos: true,
    filhos: [
      {
        codigo: '2.1.0',
        nome: 'Custos dos Produtos',
        nivel: 2,
        tipo: 'despesa' as const,
        valorAtual: 200000,
        valorAnterior: 190000,
        variacao: 5.3,
        percentualTotal: 40
      },
      {
        codigo: '2.2.0',
        nome: 'Despesas Administrativas',
        nivel: 2,
        tipo: 'despesa' as const,
        valorAtual: 120000,
        valorAnterior: 120000,
        variacao: 0,
        percentualTotal: 24
      }
    ]
  },
  {
    codigo: '3.0.0',
    nome: 'RESULTADO LÍQUIDO',
    nivel: 1,
    tipo: 'resultado' as const,
    valorAtual: 130000,
    valorAnterior: 120000,
    variacao: 8.3,
    percentualTotal: 26
  }
];

const insightsMock = [
  {
    icone: TrendingUp,
    titulo: 'Receita em Crescimento',
    descricao: 'As receitas aumentaram 4,2% em relação ao período anterior',
    valor: 20000
  },
  {
    icone: BarChart3,
    titulo: 'Margem Bruta',
    descricao: 'Margem bruta de 36% mantém-se estável',
    valor: null
  },
  {
    icone: DollarSign,
    titulo: 'Melhor Categoria',
    descricao: 'Vendas de produtos representa 90% da receita total',
    valor: 450000
  }
];

export default function DRE() {
  const [periodo, setPeriodo] = useState('mensal');
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [comparativo, setComparativo] = useState(false);
  const [loading, setLoading] = useState(false);

  const exportarDRE = () => {
    console.log('Exportar DRE para PDF');
  };

  const handlePeriodoChange = (novoPeriodo: string) => {
    console.log('Mudança de período do gráfico:', novoPeriodo);
  };

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">DRE - Demonstração do Resultado</h1>
          <p className="text-gray-600 mt-1">Análise completa do resultado financeiro</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32 bg-white/80 backdrop-blur-sm border-gray-300/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
          
          <input
            type="month"
            value={format(mesReferencia, 'yyyy-MM')}
            onChange={(e) => setMesReferencia(new Date(e.target.value))}
            className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-2 text-sm"
          />
          
          <Button 
            variant="outline" 
            onClick={() => setComparativo(!comparativo)}
            className="bg-white/80 backdrop-blur-sm border-gray-300/50"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {comparativo ? 'Simples' : 'Comparativo'}
          </Button>
          
          <Button 
            onClick={exportarDRE}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          titulo="Receita Bruta"
          valor={dreDataMock.receitaBruta}
          formato="moeda"
          icone={<TrendingUp className="w-5 h-5" />}
          cor="green"
        />
        <MetricCard
          titulo="Receita Líquida"
          valor={dreDataMock.receitaLiquida}
          formato="moeda"
          icone={<DollarSign className="w-5 h-5" />}
          cor="blue"
        />
        <MetricCard
          titulo="Despesas Totais"
          valor={dreDataMock.despesasTotais}
          formato="moeda"
          icone={<TrendingDown className="w-5 h-5" />}
          cor="red"
        />
        <MetricCard
          titulo="Resultado Líquido"
          valor={dreDataMock.resultadoLiquido}
          formato="moeda"
          icone={dreDataMock.resultadoLiquido >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          cor={dreDataMock.resultadoLiquido >= 0 ? "green" : "red"}
        />
      </div>

      {/* Gráficos de Evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoPremium
          dados={evolucaoReceitasMock}
          tipo="linha"
          titulo="Evolução das Receitas"
          subtitulo="Últimos 5 meses"
          cores={['#10B981', '#3B82F6']}
          formatacao="moeda"
          onPeriodoChange={handlePeriodoChange}
          onExportar={() => console.log('Exportar gráfico receitas')}
        />
        
        <GraficoPremium
          dados={evolucaoDespesasMock}
          tipo="linha"
          titulo="Evolução das Despesas"
          subtitulo="Últimos 5 meses"
          cores={['#EF4444', '#F59E0B']}
          formatacao="moeda"
          onPeriodoChange={handlePeriodoChange}
          onExportar={() => console.log('Exportar gráfico despesas')}
        />
      </div>

      {/* Tabela DRE Detalhada */}
      <TabelaDRE
        dados={dreDetalhadaMock}
        periodo={periodo}
        comparativo={comparativo}
        loading={loading}
        onExportar={exportarDRE}
      />

      {/* Análises e Insights */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <PieChart className="w-5 h-5 mr-2 text-blue-600" />
          Análises e Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insightsMock.map((insight, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 rounded-xl p-4 border border-blue-100/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                  <insight.icone className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {insight.titulo}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{insight.descricao}</p>
              {insight.valor && (
                <p className="text-lg font-bold text-blue-600">
                  {formatarMoeda(insight.valor)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}