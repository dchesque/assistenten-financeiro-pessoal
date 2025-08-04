import { useMemo } from 'react';
import { Venda } from '@/types/venda';

export function useAnalyticsVendas(vendas: Venda[]) {
  const analytics = useMemo(() => {
    if (!vendas.length) {
      return {
        totalVendas: 0,
        faturamentoTotal: 0,
        ticketMedio: 0,
        crescimentoMensal: 0,
        topCategorias: [],
        topFormasPagamento: [],
        vendasPorDia: {},
        clientesRecorrentes: 0,
        taxaDevolucao: 0
      };
    }

    const totalVendas = vendas.length;
    const faturamentoTotal = vendas.reduce((acc, v) => acc + v.valor_liquido, 0);
    const ticketMedio = faturamentoTotal / totalVendas;

    // Análise por categoria
    const categorias = vendas.reduce((acc, v) => {
      const key = v.categoria_nome;
      if (!acc[key]) {
        acc[key] = { nome: key, vendas: 0, valor: 0, cor: v.categoria_cor };
      }
      acc[key].vendas++;
      acc[key].valor += v.valor_liquido;
      return acc;
    }, {} as Record<string, any>);

    const topCategorias = Object.values(categorias)
      .sort((a: any, b: any) => b.valor - a.valor)
      .slice(0, 5);

    // Análise por forma de pagamento
    const formasPagamento = vendas.reduce((acc, v) => {
      const key = v.forma_pagamento;
      if (!acc[key]) {
        acc[key] = { forma: key, vendas: 0, valor: 0 };
      }
      acc[key].vendas++;
      acc[key].valor += v.valor_liquido;
      return acc;
    }, {} as Record<string, any>);

    const topFormasPagamento = Object.values(formasPagamento)
      .sort((a: any, b: any) => b.valor - a.valor)
      .slice(0, 3);

    // Vendas por dia (últimos 30 dias)
    const vendasPorDia = vendas.reduce((acc, v) => {
      const dia = v.data_venda;
      if (!acc[dia]) {
        acc[dia] = { vendas: 0, valor: 0 };
      }
      acc[dia].vendas++;
      acc[dia].valor += v.valor_liquido;
      return acc;
    }, {} as Record<string, any>);

    // Clientes recorrentes (mais de 1 compra)
    const clientesCompras = vendas.reduce((acc, v) => {
      if (v.cliente_id) {
        acc[v.cliente_id] = (acc[v.cliente_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const clientesRecorrentes = Object.values(clientesCompras)
      .filter(compras => compras > 1).length;

    // Taxa de devolução
    const devolucoes = vendas.filter(v => v.tipo_venda === 'devolucao');
    const taxaDevolucao = (devolucoes.length / totalVendas) * 100;

    // Crescimento mensal (simulado)
    const mesAtual = new Date().getMonth();
    const mesPassado = mesAtual - 1;
    const vendasMesAtual = vendas.filter(v => 
      new Date(v.data_venda).getMonth() === mesAtual
    ).length;
    const vendasMesPassado = vendas.filter(v => 
      new Date(v.data_venda).getMonth() === mesPassado
    ).length;
    
    const crescimentoMensal = vendasMesPassado > 0 
      ? ((vendasMesAtual - vendasMesPassado) / vendasMesPassado) * 100 
      : 0;

    return {
      totalVendas,
      faturamentoTotal,
      ticketMedio,
      crescimentoMensal,
      topCategorias,
      topFormasPagamento,
      vendasPorDia,
      clientesRecorrentes,
      taxaDevolucao
    };
  }, [vendas]);

  return analytics;
}