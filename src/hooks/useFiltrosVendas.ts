import { useState, useMemo } from 'react';
import { Venda, FiltrosVenda } from '@/types/venda';

export function useFiltrosVendas(vendas: Venda[]) {
  const [filtros, setFiltros] = useState<FiltrosVenda>({
    busca: '',
    cliente_id: 'todos',
    tipo_venda: 'todos',
    forma_pagamento: 'todos',
    data_inicio: '',
    data_fim: ''
  });

  const [filtroAtivo, setFiltroAtivo] = useState<string>('todos');
  const [ticketFiltro, setTicketFiltro] = useState<string>('todos');
  const [filtrosAplicados, setFiltrosAplicados] = useState<Array<{id: string, label: string, tipo: string}>>([]);

  // Função para aplicar filtros nas vendas
  const vendasFiltradas = useMemo(() => {
    let resultado = [...vendas];

    // Filtro por busca geral
    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      resultado = resultado.filter(venda => 
        venda.cliente_nome.toLowerCase().includes(busca) ||
        venda.categoria_nome.toLowerCase().includes(busca) ||
        venda.documento_referencia?.toLowerCase().includes(busca) ||
        venda.observacoes?.toLowerCase().includes(busca)
      );
    }

    // Filtro por cliente
    if (filtros.cliente_id !== 'todos') {
      if (filtros.cliente_id === 'consumidor') {
        resultado = resultado.filter(venda => !venda.cliente_id);
      } else if (filtros.cliente_id === 'vip') {
        // Clientes com 5+ compras
        const clientesVip = vendas.reduce((acc, v) => {
          if (v.cliente_id) {
            acc[v.cliente_id] = (acc[v.cliente_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<number, number>);
        resultado = resultado.filter(venda => 
          venda.cliente_id && clientesVip[venda.cliente_id] >= 5
        );
      } else if (filtros.cliente_id === 'novos') {
        // Primeira compra do cliente
        const primeiraCompra = vendas.reduce((acc, v) => {
          if (v.cliente_id && (!acc[v.cliente_id] || new Date(v.data_venda) < new Date(acc[v.cliente_id]))) {
            acc[v.cliente_id] = v.data_venda;
          }
          return acc;
        }, {} as Record<number, string>);
        resultado = resultado.filter(venda => 
          venda.cliente_id && primeiraCompra[venda.cliente_id] === venda.data_venda
        );
      } else {
        resultado = resultado.filter(venda => venda.cliente_id?.toString() === filtros.cliente_id);
      }
    }

    // Filtro por tipo de venda
    if (filtros.tipo_venda !== 'todos') {
      resultado = resultado.filter(venda => venda.tipo_venda === filtros.tipo_venda);
    }

    // Filtro por forma de pagamento
    if (filtros.forma_pagamento !== 'todos') {
      resultado = resultado.filter(venda => venda.forma_pagamento === filtros.forma_pagamento);
    }

    // Filtro por período
    if (filtros.data_inicio) {
      resultado = resultado.filter(venda => venda.data_venda >= filtros.data_inicio);
    }
    if (filtros.data_fim) {
      resultado = resultado.filter(venda => venda.data_venda <= filtros.data_fim);
    }

    // Filtros rápidos (chips)
    if (filtroAtivo !== 'todos') {
      const hoje = new Date().toISOString().split('T')[0];
      const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      switch (filtroAtivo) {
        case 'hoje':
          resultado = resultado.filter(venda => venda.data_venda === hoje);
          break;
        case 'semana':
          resultado = resultado.filter(venda => venda.data_venda >= inicioSemana);
          break;
        case 'mes':
          resultado = resultado.filter(venda => venda.data_venda >= inicioMes);
          break;
        case 'devolucoes':
          resultado = resultado.filter(venda => venda.tipo_venda === 'devolucao');
          break;
        case 'vip':
          const clientesVip = vendas.reduce((acc, v) => {
            if (v.cliente_id) {
              acc[v.cliente_id] = (acc[v.cliente_id] || 0) + 1;
            }
            return acc;
          }, {} as Record<number, number>);
          resultado = resultado.filter(venda => 
            venda.cliente_id && clientesVip[venda.cliente_id] >= 5
          );
          break;
        case 'ticket_alto':
          resultado = resultado.filter(venda => venda.valor_liquido > 600);
          break;
        case 'novos_clientes':
          const primeiraCompra = vendas.reduce((acc, v) => {
            if (v.cliente_id && (!acc[v.cliente_id] || new Date(v.data_venda) < new Date(acc[v.cliente_id]))) {
              acc[v.cliente_id] = v.data_venda;
            }
            return acc;
          }, {} as Record<number, string>);
          resultado = resultado.filter(venda => 
            venda.cliente_id && primeiraCompra[venda.cliente_id] === venda.data_venda
          );
          break;
      }
    }

    // Filtro por ticket médio
    if (ticketFiltro !== 'todos') {
      switch (ticketFiltro) {
        case 'alto':
          resultado = resultado.filter(venda => venda.valor_liquido > 600);
          break;
        case 'medio':
          resultado = resultado.filter(venda => venda.valor_liquido >= 300 && venda.valor_liquido <= 600);
          break;
        case 'baixo':
          resultado = resultado.filter(venda => venda.valor_liquido < 300);
          break;
      }
    }

    return resultado;
  }, [vendas, filtros, filtroAtivo, ticketFiltro]);

  const atualizarFiltro = (campo: keyof FiltrosVenda, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const aplicarFiltroRapido = (filtro: string) => {
    setFiltroAtivo(filtro);
    
    // Adicionar/remover dos filtros aplicados
    const novoFiltro = {
      id: filtro,
      label: getFiltroLabel(filtro),
      tipo: 'rapido'
    };
    
    setFiltrosAplicados(prev => {
      const existe = prev.find(f => f.id === filtro);
      if (existe) {
        return prev.filter(f => f.id !== filtro);
      }
      return [...prev.filter(f => f.tipo !== 'rapido'), novoFiltro];
    });
  };

  const getFiltroLabel = (filtro: string) => {
    const labels: Record<string, string> = {
      'todos': '📊 Todas as Vendas',
      'hoje': '📅 Hoje',
      'semana': '📊 Esta Semana', 
      'mes': '📈 Este Mês',
      'devolucoes': '↩️ Devoluções',
      'vip': '👑 Clientes VIP',
      'ticket_alto': '🔥 Ticket Alto',
      'novos_clientes': '🆕 Novos Clientes'
    };
    return labels[filtro] || filtro;
  };

  const removerFiltro = (id: string) => {
    setFiltrosAplicados(prev => prev.filter(f => f.id !== id));
    if (filtroAtivo === id) {
      setFiltroAtivo('todos');
    }
  };

  const limparTodosFiltros = () => {
    setFiltrosAplicados([]);
    setFiltroAtivo('todos');
    setTicketFiltro('todos');
    setFiltros({
      busca: '',
      cliente_id: 'todos',
      tipo_venda: 'todos',
      forma_pagamento: 'todos',
      data_inicio: '',
      data_fim: ''
    });
  };

  return {
    filtros,
    filtroAtivo,
    ticketFiltro,
    filtrosAplicados,
    vendasFiltradas,
    atualizarFiltro,
    aplicarFiltroRapido,
    removerFiltro,
    limparTodosFiltros,
    setTicketFiltro
  };
}