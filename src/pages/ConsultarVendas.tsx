import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useFiltrosVendas } from '@/hooks/useFiltrosVendas';
import { useAnalyticsVendas } from '@/hooks/useAnalyticsVendas';
import { Plus, Download, Upload } from 'lucide-react';

import { useVendasSupabase } from '@/hooks/useVendasSupabase';
import { Venda, FORMAS_PAGAMENTO, EstatisticasVendas } from '@/types/venda';

import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Button } from '@/components/ui/button';
import { FiltrosVendas } from '@/components/vendas/FiltrosVendas';
import { FiltrosRapidos } from '@/components/vendas/FiltrosRapidos';
import { TabelaVendas } from '@/components/vendas/TabelaVendas';
import { DashboardAnalytics } from '@/components/vendas/DashboardAnalytics';
import { VendaVisualizarModal } from '@/components/vendas/VendaVisualizarModal';
import { VendaEditarModal } from '@/components/vendas/VendaEditarModal';
import { VendaDuplicarModal } from '@/components/vendas/VendaDuplicarModal';

export default function ConsultarVendas() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { vendas: vendasSupabase, excluirVenda } = useVendasSupabase();
  
  // Estado das vendas (conversão do Supabase)
  const [vendas, setVendas] = useState<Venda[]>([]);
  
  // Estados dos modais
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [modalVisualizar, setModalVisualizar] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalDuplicar, setModalDuplicar] = useState(false);

  // Hook customizado para filtros
  const {
    filtros,
    filtroAtivo,
    filtrosAplicados,
    vendasFiltradas,
    atualizarFiltro,
    aplicarFiltroRapido,
    removerFiltro,
    limparTodosFiltros
  } = useFiltrosVendas(vendas);

  // Analytics das vendas
  const analytics = useAnalyticsVendas(vendasFiltradas);

  // Converter dados do Supabase para o formato esperado
  useEffect(() => {
    const vendasConvertidas: Venda[] = vendasSupabase.map(venda => ({
      id: venda.id,
      data_venda: venda.data_venda,
      hora_venda: venda.hora_venda || '00:00',
      cliente_id: venda.cliente_id || undefined,
      cliente_nome: 'VAREJO', // TODO: buscar do relacionamento
      cliente_documento: undefined,
      categoria_id: venda.plano_conta_id || 0,
      categoria_nome: venda.vendedor || 'Categoria',
      categoria_codigo: '',
      categoria_cor: '#6366f1',
      valor_bruto: venda.valor_total,
      desconto_percentual: venda.desconto > 0 ? ((venda.desconto / venda.valor_total) * 100) : 0,
      desconto_valor: venda.desconto,
      valor_liquido: venda.valor_final,
      forma_pagamento: venda.forma_pagamento as any,
      banco_id: undefined,
      banco_nome: undefined,
      tipo_venda: venda.tipo_venda === 'produto' ? 'venda' : venda.tipo_venda as any,
      documento_referencia: undefined,
      observacoes: venda.observacoes,
      ativo: venda.ativo,
      created_at: venda.created_at,
      updated_at: venda.updated_at
    }));
    setVendas(vendasConvertidas);
  }, [vendasSupabase]);

  const estatisticas: EstatisticasVendas = {
    totalVendas: vendas.length,
    valorTotal: vendas.reduce((acc, v) => acc + v.valor_liquido, 0),
    ticketMedio: vendas.length > 0 ? vendas.reduce((acc, v) => acc + v.valor_liquido, 0) / vendas.length : 0,
    crescimentoMensal: 0,
    faturamento_mensal: vendas.reduce((acc, v) => acc + v.valor_liquido, 0),
    faturamento_crescimento: 0,
    vendas_realizadas: vendas.length,
    vendas_por_dia: vendas.length > 0 ? vendas.length / 30 : 0,
    ticket_medio: vendas.length > 0 ? vendas.reduce((acc, v) => acc + v.valor_liquido, 0) / vendas.length : 0,
    ticket_crescimento: 0,
    devolucoes_valor: 0,
    devolucoes_percentual: 0,
    melhor_forma_pagamento: 'pix',
    crescimento_vendas: 0,
    meta_mensal: 100000
  };

  // Função de exportação CSV
  const exportarCSV = () => {
    const headers = ['data', 'cliente', 'categoria', 'valor_bruto', 'desconto', 'valor_liquido', 'forma_pagamento', 'tipo', 'documento'];
    const rows = vendasFiltradas.map(venda => [
      venda.data_venda,
      venda.cliente_nome,
      venda.categoria_nome,
      venda.valor_bruto.toString(),
      venda.desconto_valor.toString(),
      venda.valor_liquido.toString(),
      FORMAS_PAGAMENTO.find(f => f.valor === venda.forma_pagamento)?.nome || venda.forma_pagamento,
      venda.tipo_venda === 'venda' ? 'Venda' : venda.tipo_venda === 'devolucao' ? 'Devolução' : 'Desconto',
      venda.documento_referencia || ''
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vendas_jc_financeiro_${new Date().toISOString().split('T')[0].replace(/-/g, '-')}.csv`;
    link.click();

    toast({
      title: "Sucesso",
      description: "Arquivo exportado com sucesso!",
      variant: "default"
    });
  };

  // Funções dos modais
  const abrirModalVisualizar = (venda: Venda) => {
    setVendaSelecionada(venda);
    setModalVisualizar(true);
  };

  const abrirModalEditar = (venda: Venda) => {
    setVendaSelecionada(venda);
    setModalEditar(true);
  };

  const abrirModalDuplicar = (venda: Venda) => {
    setVendaSelecionada(venda);
    setModalDuplicar(true);
  };

  const handleSalvarVenda = (vendaAtualizada: Venda) => {
    setVendas(prev => prev.map(v => v.id === vendaAtualizada.id ? vendaAtualizada : v));
    setModalEditar(false);
    setVendaSelecionada(null);
    
    toast({
      title: "Sucesso",
      description: "Venda atualizada com sucesso!",
      variant: "default"
    });
  };

  const handleDuplicarVenda = (novaVenda: Venda) => {
    setVendas(prev => [...prev, novaVenda]);
    setModalDuplicar(false);
    setVendaSelecionada(null);
    
    toast({
      title: "Sucesso",
      description: "Venda duplicada com sucesso!",
      variant: "default"
    });
  };

  const handleExcluirVenda = async (vendaId: number) => {
    try {
      const sucesso = await excluirVenda(vendaId);
      if (sucesso) {
        // A atualização dos dados será feita automaticamente pelo hook
        // através do carregarVendas() que é chamado no excluirVenda
      }
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir venda. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Círculos blur abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/consultar-vendas')}
        title="Vendas e Receitas"
        subtitle="Gestão de receitas e análise de vendas • Histórico completo"
        actions={
          <>
            <Button
              onClick={() => navigate('/nova-venda')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </Button>
            
            <Button
              onClick={() => navigate('/importar-vendas')}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-white/20"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            
            <Button
              onClick={exportarCSV}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </>
        }
      />

      <div className="relative p-4 lg:p-8 space-y-6">

        {/* Dashboard Analytics */}
        <DashboardAnalytics analytics={analytics} />

        {/* Filtros rápidos */}
        <FiltrosRapidos
          vendas={vendas}
          filtroAtivo={filtroAtivo}
          onFiltroChange={aplicarFiltroRapido}
        />

        {/* Filtros de pesquisa */}
        <FiltrosVendas
          filtros={filtros}
          onFiltroChange={atualizarFiltro}
          onLimparFiltros={limparTodosFiltros}
          filtrosAplicados={filtrosAplicados}
          onRemoverFiltro={removerFiltro}
        />

        {/* Tabela de vendas */}
        <TabelaVendas
          vendas={vendasFiltradas}
          onVisualizarVenda={abrirModalVisualizar}
          onEditarVenda={abrirModalEditar}
          onExcluirVenda={handleExcluirVenda}
        />
      </div>

      {/* Modais */}
      <VendaVisualizarModal
        venda={vendaSelecionada}
        isOpen={modalVisualizar}
        onClose={() => {
          setModalVisualizar(false);
          setVendaSelecionada(null);
        }}
        onEdit={(venda) => {
          setModalVisualizar(false);
          abrirModalEditar(venda);
        }}
      />

      <VendaEditarModal
        venda={vendaSelecionada}
        isOpen={modalEditar}
        onClose={() => {
          setModalEditar(false);
          setVendaSelecionada(null);
        }}
        onSave={handleSalvarVenda}
      />

      <VendaDuplicarModal
        vendaOriginal={vendaSelecionada}
        isOpen={modalDuplicar}
        onClose={() => {
          setModalDuplicar(false);
          setVendaSelecionada(null);
        }}
        onSave={handleDuplicarVenda}
      />
    </div>
  );
}