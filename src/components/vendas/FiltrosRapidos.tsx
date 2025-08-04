import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Venda } from "@/types/venda";

interface FiltrosRapidosProps {
  vendas: Venda[];
  filtroAtivo: string;
  onFiltroChange: (filtro: string) => void;
}

export function FiltrosRapidos({ vendas, filtroAtivo, onFiltroChange }: FiltrosRapidosProps) {
  // Contadores dinâmicos para os chips
  const contadores = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const inicioSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    const clientesVip = vendas.reduce((acc, v) => {
      if (v.cliente_id) {
        acc[v.cliente_id] = (acc[v.cliente_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const primeiraCompra = vendas.reduce((acc, v) => {
      if (v.cliente_id && (!acc[v.cliente_id] || new Date(v.data_venda) < new Date(acc[v.cliente_id]))) {
        acc[v.cliente_id] = v.data_venda;
      }
      return acc;
    }, {} as Record<number, string>);

    return {
      todos: vendas.length,
      hoje: vendas.filter(v => v.data_venda === hoje).length,
      semana: vendas.filter(v => v.data_venda >= inicioSemana).length,
      mes: vendas.filter(v => v.data_venda >= inicioMes).length,
      devolucoes: vendas.filter(v => v.tipo_venda === 'devolucao').length,
      vip: vendas.filter(v => v.cliente_id && clientesVip[v.cliente_id] >= 5).length,
      ticket_alto: vendas.filter(v => v.valor_liquido > 600).length,
      novos_clientes: vendas.filter(v => v.cliente_id && primeiraCompra[v.cliente_id] === v.data_venda).length
    };
  }, [vendas]);

  const FilterChip = ({ children, count, color, active, onClick }: {
    children: React.ReactNode;
    count?: number;
    color: string;
    active?: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm border ${
        active 
          ? `bg-${color}-600 text-white shadow-lg border-${color}-600` 
          : `bg-${color}-100/80 text-${color}-800 hover:bg-${color}-200 border-${color}-200/50`
      } hover:shadow-md transform hover:-translate-y-0.5`}
    >
      {children}
      {count !== undefined && (
        <span className={`ml-1 ${active ? 'text-white/90' : `text-${color}-600`}`}>
          ({count})
        </span>
      )}
    </button>
  );

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
      <CardContent className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros Rápidos</h3>
          
          <div className="flex flex-wrap gap-3">
            <FilterChip
              color="blue"
              active={filtroAtivo === 'todos'}
              onClick={() => onFiltroChange('todos')}
              count={contadores.todos}
            >
              📊 Todas
            </FilterChip>
            
            <FilterChip
              color="green"
              active={filtroAtivo === 'hoje'}
              onClick={() => onFiltroChange('hoje')}
              count={contadores.hoje}
            >
              📅 Hoje
            </FilterChip>
            
            <FilterChip
              color="blue"
              active={filtroAtivo === 'semana'}
              onClick={() => onFiltroChange('semana')}
              count={contadores.semana}
            >
              📊 Esta Semana
            </FilterChip>
            
            <FilterChip
              color="purple"
              active={filtroAtivo === 'mes'}
              onClick={() => onFiltroChange('mes')}
              count={contadores.mes}
            >
              📈 Este Mês
            </FilterChip>
            
            <FilterChip
              color="red"
              active={filtroAtivo === 'devolucoes'}
              onClick={() => onFiltroChange('devolucoes')}
              count={contadores.devolucoes}
            >
              ↩️ Devoluções
            </FilterChip>
            
            <FilterChip
              color="yellow"
              active={filtroAtivo === 'vip'}
              onClick={() => onFiltroChange('vip')}
              count={contadores.vip}
            >
              👑 Clientes VIP
            </FilterChip>
            
            <FilterChip
              color="orange"
              active={filtroAtivo === 'ticket_alto'}
              onClick={() => onFiltroChange('ticket_alto')}
              count={contadores.ticket_alto}
            >
              🔥 Ticket Alto
            </FilterChip>
            
            <FilterChip
              color="teal"
              active={filtroAtivo === 'novos_clientes'}
              onClick={() => onFiltroChange('novos_clientes')}
              count={contadores.novos_clientes}
            >
              🆕 Novos Clientes
            </FilterChip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}