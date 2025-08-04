import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  FileText,
  FileDown,
  CalendarDays,
  BarChart3,
  RefreshCw,
  Settings
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { createBreadcrumb } from "@/utils/breadcrumbUtils";
import { DreFilters } from "@/components/dre/DreFilters";
import { DreTable } from "@/components/dre/DreTable";
import { DreResumido } from "@/components/dre/relatorios/DreResumido";
import { DreDetalhado } from "@/components/dre/relatorios/DreDetalhado";
import { DreInsights } from "@/components/dre/DreInsights";
import { AnnualView } from "@/components/dre/AnnualView";
import { DadosEssenciaisModal } from "@/components/dre/DadosEssenciaisModal";
import { StatusDadosEssenciais } from "@/components/dre/StatusDadosEssenciais";
import { MetricasEssenciais } from "@/components/dre/MetricasEssenciais";
import { ExportarDreModal } from "@/components/dre/exportacao/ExportarDreModal";
import { useIntegracaoDRE } from "@/hooks/useIntegracaoDRE";
import { useCalculadoraDRE } from "@/hooks/useCalculadoraDRE";
import { useValidacoesDRE } from "@/hooks/useValidacoesDRE";
import { useDadosAnuais } from "@/hooks/useDadosAnuais";
import { toast } from "@/hooks/use-toast";

interface DreFiltros {
  ano: number;
  tipoVisualizacao: 'mensal' | 'anual';
  mesEspecifico?: number;
  compararAtivo: boolean;
  anoComparacao?: number;
  mesComparacao?: number;
  nivelDetalhamento: 'resumido' | 'detalhado' | 'analitico';
}

interface DadosEssenciaisDRE {
  id?: number;
  mes_referencia: string;
  cmv_valor: number;
  estoque_inicial_qtd?: number;
  estoque_inicial_valor?: number;
  estoque_final_qtd?: number;
  estoque_final_valor?: number;
  created_at?: string;
  updated_at?: string;
}

export default function DRE() {
  // Estados dos filtros
  const [filtros, setFiltros] = useState<DreFiltros>({
    ano: new Date().getFullYear(),
    tipoVisualizacao: 'mensal',
    mesEspecifico: new Date().getMonth() + 1,
    compararAtivo: false,
    nivelDetalhamento: 'resumido'
  });

  // Estados da aplicação
  const [dreGerado, setDreGerado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [abaSelecionada, setAbaSelecionada] = useState<'relatorio' | 'anual'>('relatorio');
  
  // Estados do modal de dados essenciais
  const [modalDadosAberto, setModalDadosAberto] = useState(false);
  const [dadosEssenciais, setDadosEssenciais] = useState<DadosEssenciaisDRE[]>([]);

  // Novos estados para funcionalidades avançadas
  const [modalExportacaoAberto, setModalExportacaoAberto] = useState(false);
  const [carregandoExportacao, setCarregandoExportacao] = useState(false);

  // Hooks customizados
  const { 
    dadosIntegracao, 
    carregando: carregandoIntegracao, 
    obterDadosPorPeriodo 
  } = useIntegracaoDRE();

  // Obter dados essenciais do período atual
  const periodoAtual = useMemo(() => {
    if (filtros.tipoVisualizacao === 'anual') {
      return `${filtros.ano}-01`;
    }
    const mes = String(filtros.mesEspecifico).padStart(2, '0');
    return `${filtros.ano}-${mes}`;
  }, [filtros]);

  const dadosEssenciaisPeriodo = useMemo(() => {
    return dadosEssenciais.find(d => d.mes_referencia === periodoAtual);
  }, [dadosEssenciais, periodoAtual]);

  // Calculadora DRE
  const { dreCalculado, metricas } = useCalculadoraDRE({
    dadosIntegracao,
    dadosEssenciais: dadosEssenciaisPeriodo,
    mostrarComparacao: filtros.compararAtivo
  });

  // Novo hook de validações
  const { validarFiltros, validarExportacao, obterErroGeral, limparErros } = useValidacoesDRE();

  // Dados calculados para visão anual baseados nos dados reais
  const dadosAnuais = useDadosAnuais(filtros.ano);

  const validarFiltrosAntigo = (): boolean => {
    setErroValidacao(null);
    
    if (!filtros.ano || filtros.ano < 2000 || filtros.ano > new Date().getFullYear() + 1) {
      setErroValidacao('Ano deve estar entre 2000 e ' + (new Date().getFullYear() + 1));
      return false;
    }
    
    if (filtros.tipoVisualizacao === 'mensal' && (!filtros.mesEspecifico || filtros.mesEspecifico < 1 || filtros.mesEspecifico > 12)) {
      setErroValidacao('Mês deve estar entre 1 e 12');
      return false;
    }
    
    if (filtros.compararAtivo) {
      if (!filtros.anoComparacao) {
        setErroValidacao('Ano de comparação é obrigatório quando comparação está ativa');
        return false;
      }
    }
    
    return true;
  };

  const gerarDre = async () => {
    limparErros();
    
    if (!validarFiltros(filtros)) {
      setErroValidacao(obterErroGeral());
      return;
    }
    
    setCarregando(true);
    setErroValidacao(null);
    
    try {
      console.log('🚀 Gerando DRE com filtros:', filtros);
      
      await obterDadosPorPeriodo({
        ano: filtros.ano,
        mes: filtros.mesEspecifico,
        tipoVisualizacao: filtros.tipoVisualizacao
      });
      
      setDreGerado(true);
      
      toast({
        title: "DRE gerado com sucesso!",
        description: "Dados integrados automaticamente do sistema.",
      });
      
    } catch (error) {
      console.error('❌ Erro ao gerar DRE:', error);
      setErroValidacao('Erro ao gerar DRE. Tente novamente.');
      toast({
        title: "Erro",
        description: "Erro ao gerar DRE. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  // Preparar dados DRE para exportação
  const prepararDadosDRE = () => {
    if (!dadosIntegracao) return null;

    return {
      receitas: dadosIntegracao.receitas.map(r => ({
        categoria: r.categoria_nome,
        valor: r.valor_total,
        subcategorias: []
      })),
      despesas: dadosIntegracao.despesas.map(d => ({
        categoria: d.categoria_nome,
        valor: d.valor_total,
        subcategorias: []
      })),
      resultado: {
        receitaLiquida: dadosIntegracao.receitas.reduce((acc, r) => acc + r.valor_total, 0),
        lucroBruto: dadosIntegracao.receitas.reduce((acc, r) => acc + r.valor_total, 0) - dadosIntegracao.despesas.reduce((acc, d) => acc + d.valor_total, 0),
        lucroOperacional: dadosIntegracao.receitas.reduce((acc, r) => acc + r.valor_total, 0) - dadosIntegracao.despesas.reduce((acc, d) => acc + d.valor_total, 0),
        resultadoLiquido: dadosIntegracao.receitas.reduce((acc, r) => acc + r.valor_total, 0) - dadosIntegracao.despesas.reduce((acc, d) => acc + d.valor_total, 0),
        margemBruta: 50.0,
        margemOperacional: 25.0,
        margemLiquida: 20.0
      },
      periodo: obterPeriodoFormatado(),
      empresa: 'JC Financeiro'
    };
  };

  // Preparar insights para exportação
  const prepararInsights = () => {
    return {
      principais: [
        'Receitas apresentaram crescimento constante no período analisado',
        'Margem bruta manteve-se estável em torno de 50%',
        'Custos operacionais representam 30% da receita líquida'
      ],
      recomendacoes: [
        'Avaliar oportunidades de redução de custos variáveis',
        'Implementar controles mais rigorosos de despesas administrativas',
        'Considerar investimentos em marketing para acelerar crescimento'
      ],
      alertas: [
        'Despesas com pessoal acima da média do setor',
        'Necessário acompanhar fluxo de caixa devido ao crescimento'
      ]
    };
  };

  const limparFiltros = () => {
    setFiltros({
      ano: new Date().getFullYear(),
      tipoVisualizacao: 'mensal',
      mesEspecifico: new Date().getMonth() + 1,
      compararAtivo: false,
      nivelDetalhamento: 'resumido'
    });
    setDreGerado(false);
    setErroValidacao(null);
  };

  const exportarPdf = () => {
    if (!dreGerado) return;
    console.log('📄 Exportando DRE para PDF...');
    toast({
      title: "Função em desenvolvimento",
      description: "Exportação para PDF será implementada em breve.",
    });
  };

  const exportarExcel = () => {
    if (!dreGerado) return;
    console.log('📊 Exportando DRE para Excel...');
    toast({
      title: "Função em desenvolvimento", 
      description: "Exportação para Excel será implementada em breve.",
    });
  };

  const handleDetalheMes = (mes: number) => {
    setFiltros({
      ...filtros,
      tipoVisualizacao: 'mensal',
      mesEspecifico: mes
    });
    setAbaSelecionada('relatorio');
    // Regenerar automaticamente se já estava gerado
    if (dreGerado) {
      setTimeout(() => gerarDre(), 100);
    }
  };

  // Funções utilitárias
  const meses = [
    { valor: 1, nome: 'Janeiro' }, { valor: 2, nome: 'Fevereiro' }, { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' }, { valor: 5, nome: 'Maio' }, { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' }, { valor: 8, nome: 'Agosto' }, { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' }, { valor: 11, nome: 'Novembro' }, { valor: 12, nome: 'Dezembro' }
  ];

  const obterNomeMes = (mes: number) => {
    return meses.find(m => m.valor === mes)?.nome || '';
  };

  const obterPeriodoFormatado = () => {
    if (filtros.tipoVisualizacao === 'anual') {
      return `Ano ${filtros.ano}`;
    }
    return `${obterNomeMes(filtros.mesEspecifico!)} ${filtros.ano}`;
  };

  const obterPeriodoComparacaoFormatado = () => {
    if (!filtros.compararAtivo) return '';
    
    if (filtros.tipoVisualizacao === 'anual') {
      return `vs Ano ${filtros.anoComparacao}`;
    }
    return `vs ${obterNomeMes(filtros.mesComparacao!)} ${filtros.anoComparacao}`;
  };

  // Funções dos dados essenciais
  const abrirModalDados = () => {
    setModalDadosAberto(true);
  };

  const salvarDadosEssenciais = async (dados: DadosEssenciaisDRE) => {
    const existe = dadosEssenciais.find(d => d.mes_referencia === dados.mes_referencia);
    
    if (existe) {
      setDadosEssenciais(prev => prev.map(d => 
        d.mes_referencia === dados.mes_referencia 
          ? { ...d, ...dados, updated_at: new Date().toISOString() } 
          : d
      ));
    } else {
      setDadosEssenciais(prev => [...prev, { 
        ...dados, 
        id: Date.now(), 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    }

    // Regenerar DRE automaticamente
    if (dreGerado) {
      setTimeout(() => gerarDre(), 500);
    }
  };

  const renderizarRelatorio = () => {
    switch (filtros.nivelDetalhamento) {
      case 'resumido':
        return (
          <DreResumido
            dados={dreCalculado}
            periodo={obterPeriodoFormatado()}
            periodoComparacao={obterPeriodoComparacaoFormatado()}
            mostrarComparacao={filtros.compararAtivo}
          />
        );
      case 'detalhado':
        return (
          <DreDetalhado
            dados={dreCalculado}
            periodo={obterPeriodoFormatado()}
            periodoComparacao={obterPeriodoComparacaoFormatado()}
            mostrarComparacao={filtros.compararAtivo}
          />
        );
      case 'analitico':
        return (
          <DreTable
            dados={dreCalculado}
            periodo={obterPeriodoFormatado()}
            periodoComparacao={obterPeriodoComparacaoFormatado()}
            mostrarComparacao={filtros.compararAtivo}
            tipoVisualizacao={filtros.tipoVisualizacao}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      
      {/* Blur decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/dre')}
        title="DRE - Demonstração do Resultado"
        subtitle="Análise financeira completa • Receitas, custos e resultados"
        actions={
          <>
            <Button 
              onClick={abrirModalDados}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-white/20"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar
            </Button>
            {dreGerado && (
              <Button 
                onClick={() => setModalExportacaoAberto(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}
          </>
        }
      />

      <div className="relative z-10 p-4 lg:p-8 space-y-6">

        {/* Filtros */}
        <DreFilters
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onGerar={gerarDre}
          onLimpar={limparFiltros}
          carregando={carregando || carregandoIntegracao}
          erroValidacao={erroValidacao}
        />

        {/* Conteúdo Principal Atualizado */}
        {dreGerado && dreCalculado.length > 0 && (
          <Tabs value={abaSelecionada} onValueChange={(value) => setAbaSelecionada(value as 'relatorio' | 'anual')} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/60 backdrop-blur-sm rounded-xl">
              <TabsTrigger value="relatorio" className="rounded-lg">
                <CalendarDays className="w-4 h-4 mr-2" />
                Relatório DRE
              </TabsTrigger>
              <TabsTrigger value="anual" className="rounded-lg">
                <BarChart3 className="w-4 h-4 mr-2" />
                Visão Anual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="relatorio" className="space-y-6">
              {/* Status dos dados essenciais */}
              <StatusDadosEssenciais
                periodo={obterPeriodoFormatado()}
                dadosEssenciais={dadosEssenciaisPeriodo}
                onAbrirModal={abrirModalDados}
              />

              {/* Relatório Renderizado Dinamicamente */}
              {renderizarRelatorio()}

              <DreInsights
                receitaLiquida={metricas.receitaLiquida}
                lucroBruto={metricas.lucroBruto}
                resultadoLiquido={metricas.resultadoLiquido}
                margemBruta={metricas.margemBruta}
                margemLiquida={metricas.margemLiquida}
                tipoVisualizacao={filtros.tipoVisualizacao}
              />

              {/* Métricas essenciais */}
              <MetricasEssenciais
                dadosEssenciais={dadosEssenciaisPeriodo}
                receitaLiquida={metricas.receitaLiquida}
              />
            </TabsContent>

            <TabsContent value="anual" className="space-y-6">
              <AnnualView
                ano={filtros.ano}
                dados={dadosAnuais}
                onDetalheMes={handleDetalheMes}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Mensagem se DRE não foi gerado */}
        {!dreGerado && (
          <div className="text-center py-12">
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Configure os filtros</h3>
              <p className="text-muted-foreground">
                Selecione o período e configurações desejadas, depois clique em "Gerar DRE" para visualizar o relatório integrado.
              </p>
            </div>
          </div>
        )}

        {/* Indicador de carregamento */}
        {(carregando || carregandoIntegracao) && (
          <div className="text-center py-8">
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-6 max-w-sm mx-auto">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {carregandoIntegracao ? 'Integrando dados...' : 'Gerando DRE...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Dados Essenciais */}
      <DadosEssenciaisModal
        isOpen={modalDadosAberto}
        onClose={() => setModalDadosAberto(false)}
        dadosExistentes={dadosEssenciaisPeriodo}
        onSalvar={salvarDadosEssenciais}
        cmvSugerido={dadosIntegracao?.cmv_sugerido}
        periodoSelecionado={periodoAtual}
      />

      {/* Modal de Exportação */}
      <ExportarDreModal
        isOpen={modalExportacaoAberto}
        onClose={() => setModalExportacaoAberto(false)}
        periodo={obterPeriodoFormatado()}
        dadosDRE={prepararDadosDRE()}
        insights={prepararInsights()}
        carregando={carregandoExportacao}
      />
    </div>
  );
}
