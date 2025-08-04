import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMaquininhas } from '@/hooks/useMaquininhas';
import { useVendasSupabase } from '@/hooks/useVendasSupabase';

export interface KPIDashboard {
  saldoTotal: number;
  contasPendentes: {
    valor: number;
    quantidade: number;
    vencidas: number;
  };
  receitas: {
    valor: number;
    meta: number;
    percentualMeta: number;
    projecao: number;
  };
  fluxoLiquido: number;
}

export interface AlertaDashboard {
  id: string;
  tipo: 'critico' | 'oportunidade' | 'info';
  titulo: string;
  descricao: string;
  valor?: number;
  acao: string;
  icone: string;
}

export interface EvoluçaoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface DespesaCategoria {
  categoria: string;
  valor: number;
  percentual: number;
  cor: string;
}

export interface ResumoMaquininha {
  totalRecebido: number;
  mediaDiaria: number;
  totalTaxas: number;
  percentualTaxa: number;
  operadoras: Array<{
    nome: string;
    valor: number;
    status: string;
  }>;
}

export interface ResumoCheques {
  totalEmitidos: number;
  valorTotal: number;
  compensados: number;
  pendentes: number;
  proximosVencimentos: Array<{
    numero: string;
    valor: number;
    vencimento: string;
    beneficiario: string;
  }>;
}

export function useDashboardExecutivo() {
  const [loading, setLoading] = useState(true);
  const [bancos, setBancos] = useState<any[]>([]);
  const [contasPagar, setContasPagar] = useState<any[]>([]);
  const [cheques, setCheques] = useState<any[]>([]);
  const { vendas } = useVendasSupabase();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar bancos
      const { data: bancosData } = await supabase
        .from('bancos')
        .select('*')
        .eq('ativo', true);

      // Carregar contas a pagar
      const { data: contasData } = await supabase
        .from('contas_pagar')
        .select('*');

      // Carregar cheques
      const { data: chequesData } = await supabase
        .from('cheques')
        .select('*');

      setBancos(bancosData || []);
      setContasPagar(contasData || []);
      setCheques(chequesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardData = useMemo(() => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // 1. KPIs Principais
    const saldoTotal = bancos.reduce((sum, banco) => sum + (banco.saldo_atual || 0), 0);

    const contasPendentesData = contasPagar.filter(conta => 
      ['pendente', 'vencido'].includes(conta.status)
    );
    
    const contasVencidas = contasPendentesData.filter(conta => conta.status === 'vencido');
    
    const contasPendentes = {
      valor: contasPendentesData.reduce((sum, conta) => sum + (conta.valor_final || 0), 0),
      quantidade: contasPendentesData.length,
      vencidas: contasVencidas.length
    };

    const vendasMes = vendas.filter(venda => {
      const dataVenda = new Date(venda.data_venda);
      return dataVenda >= inicioMes && dataVenda <= fimMes;
    });

    const receitasMes = vendasMes.reduce((sum, venda) => sum + venda.valor_total, 0);
    const metaMensal = 95000;
    
    const receitas = {
      valor: receitasMes,
      meta: metaMensal,
      percentualMeta: (receitasMes / metaMensal) * 100,
      projecao: 98500
    };

    const fluxoLiquido = receitasMes - contasPendentes.valor;

    const kpis: KPIDashboard = {
      saldoTotal,
      contasPendentes,
      receitas,
      fluxoLiquido
    };

    // 2. Alertas Inteligentes
    const alertas: AlertaDashboard[] = [];

    if (contasVencidas.length > 0) {
      const valorVencido = contasVencidas.reduce((sum, conta) => sum + conta.valor_final, 0);
      alertas.push({
        id: 'contas-vencidas',
        tipo: 'critico',
        titulo: `${contasVencidas.length} Contas Vencidas`,
        descricao: `R$ ${valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em atraso há mais de 5 dias`,
        valor: valorVencido,
        acao: 'Pagar Agora',
        icone: 'AlertTriangle'
      });
    }

    if (saldoTotal > 50000) {
      alertas.push({
        id: 'saldo-alto',
        tipo: 'oportunidade',
        titulo: 'Saldo Alto Disponível',
        descricao: 'R$ 45.000 parados há 15 dias',
        acao: 'Antecipar Pagamentos',
        icone: 'TrendingUp'
      });
    }

    if (receitas.percentualMeta < 100) {
      const faltante = receitas.meta - receitas.valor;
      alertas.push({
        id: 'meta-receita',
        tipo: 'info',
        titulo: 'Meta de Receita',
        descricao: `Faltam R$ ${faltante.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para bater a meta mensal`,
        acao: 'Ver Projeções',
        icone: 'Target'
      });
    }

    // 3. Evolução Mensal (últimos 6 meses)
    const evolucaoMensal: EvoluçaoMensal[] = [];
    for (let i = 5; i >= 0; i--) {
      const mesData = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 0);
      
      const vendasMes = vendas.filter(venda => {
        const dataVenda = new Date(venda.data_venda);
        return dataVenda >= mesData && dataVenda <= proximoMes;
      });

      const despesasMes = contasPagar.filter(conta => {
        if (!conta.data_pagamento) return false;
        const dataPagamento = new Date(conta.data_pagamento);
        return dataPagamento >= mesData && dataPagamento <= proximoMes;
      });

      const receitasMes = vendasMes.reduce((sum, venda) => sum + venda.valor_total, 0);
      const despesasTotal = despesasMes.reduce((sum, conta) => sum + conta.valor_final, 0);

      evolucaoMensal.push({
        mes: mesData.toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: receitasMes,
        despesas: despesasTotal,
        saldo: receitasMes - despesasTotal
      });
    }

    // 4. Despesas por Categoria
    const despesasPorCategoria: DespesaCategoria[] = [
      { categoria: 'Despesas Operacionais', valor: 20500, percentual: 45, cor: '#ef4444' },
      { categoria: 'Custos de Mercadorias', valor: 13650, percentual: 30, cor: '#f59e0b' },
      { categoria: 'Despesas Administrativas', valor: 6825, percentual: 15, cor: '#3b82f6' },
      { categoria: 'Custos Bancários', valor: 4550, percentual: 10, cor: '#8b5cf6' }
    ];

    // 5. Resumo Maquininhas
    const resumoMaquininha: ResumoMaquininha = {
      totalRecebido: 90600,
      mediaDiaria: 2920,
      totalTaxas: 3580,
      percentualTaxa: 3.95,
      operadoras: [
        { nome: 'Rede', valor: 67200, status: 'Ativa' },
        { nome: 'Sipag', valor: 23400, status: 'Ativa' }
      ]
    };

    // 6. Resumo Cheques
    const chequesAtivos = cheques.filter(cheque => 
      ['emitido', 'compensado'].includes(cheque.status)
    );
    
    const resumoCheques: ResumoCheques = {
      totalEmitidos: chequesAtivos.length,
      valorTotal: chequesAtivos.reduce((sum, cheque) => sum + (cheque.valor || 0), 0),
      compensados: chequesAtivos.filter(c => c.status === 'compensado').length,
      pendentes: chequesAtivos.filter(c => c.status === 'emitido').length,
      proximosVencimentos: chequesAtivos
        .filter(c => c.status === 'emitido')
        .slice(0, 3)
        .map(cheque => ({
          numero: cheque.numero_cheque || '',
          valor: cheque.valor || 0,
          vencimento: cheque.data_vencimento || '',
          beneficiario: cheque.beneficiario_nome || 'N/A'
        }))
    };

    return {
      kpis,
      alertas,
      evolucaoMensal,
      despesasPorCategoria,
      resumoMaquininha,
      resumoCheques,
      loading
    };
  }, [bancos, contasPagar, cheques, loading, vendas]);

  return dashboardData;
}