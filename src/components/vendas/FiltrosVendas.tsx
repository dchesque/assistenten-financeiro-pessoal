import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Calendar } from "lucide-react";
import { FiltrosVenda, FORMAS_PAGAMENTO, TIPOS_VENDA } from "@/types/venda";
import { useClientesSupabase } from '@/hooks/useClientesSupabase';

interface FiltrosVendasProps {
  filtros: FiltrosVenda;
  onFiltroChange: (campo: keyof FiltrosVenda, valor: string) => void;
  onLimparFiltros: () => void;
  filtrosAplicados: Array<{id: string, label: string, tipo: string}>;
  onRemoverFiltro: (id: string) => void;
}

export function FiltrosVendas({ 
  filtros, 
  onFiltroChange, 
  onLimparFiltros,
  filtrosAplicados,
  onRemoverFiltro 
}: FiltrosVendasProps) {
  const [filtrosExpanded, setFiltrosExpanded] = useState(false);
  const { clientes } = useClientesSupabase();

  const FilterTag = ({ children, onRemove }: {
    children: React.ReactNode;
    onRemove: () => void;
  }) => (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100/80 text-blue-800 border border-blue-200/50 backdrop-blur-sm">
      {children}
      <button 
        onClick={onRemove}
        className="ml-1 text-blue-600 hover:text-blue-800"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            Filtros de Pesquisa
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltrosExpanded(!filtrosExpanded)}
            className="text-gray-600"
          >
            {filtrosExpanded ? 'Recolher' : 'Expandir'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Busca principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar por cliente, categoria, documento..."
            value={filtros.busca}
            onChange={(e) => onFiltroChange('busca', e.target.value)}
            className="pl-10 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filtros aplicados */}
        {filtrosAplicados.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Filtros aplicados:</p>
            <div className="flex flex-wrap gap-2">
              {filtrosAplicados.map(filtro => (
                <FilterTag 
                  key={filtro.id} 
                  onRemove={() => onRemoverFiltro(filtro.id)}
                >
                  {filtro.label}
                </FilterTag>
              ))}
              <Button
                variant="outline" 
                size="sm"
                onClick={onLimparFiltros}
                className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                Limpar todos
              </Button>
            </div>
          </div>
        )}

        {/* Filtros expandidos */}
        {filtrosExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200/50">
            {/* Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Cliente</label>
              <Select value={filtros.cliente_id} onValueChange={(value) => onFiltroChange('cliente_id', value)}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl border border-gray-200 shadow-xl z-50">
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  <SelectItem value="varejo">🛒 Vendas no Varejo</SelectItem>
                  <SelectItem value="vip">👑 Clientes VIP</SelectItem>
                  <SelectItem value="novos">🆕 Novos Clientes</SelectItem>
                  {clientes
                    .filter(cliente => cliente.ativo)
                    .map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.nome}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Venda */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo de Venda</label>
              <Select value={filtros.tipo_venda} onValueChange={(value) => onFiltroChange('tipo_venda', value)}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl border border-gray-200 shadow-xl z-50">
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {TIPOS_VENDA.map(tipo => (
                    <SelectItem key={tipo.valor} value={tipo.valor}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Forma de Pagamento</label>
              <Select value={filtros.forma_pagamento} onValueChange={(value) => onFiltroChange('forma_pagamento', value)}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                  <SelectValue placeholder="Todas as formas" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl border border-gray-200 shadow-xl z-50">
                  <SelectItem value="todos">Todas as formas</SelectItem>
                  {FORMAS_PAGAMENTO.map(forma => (
                    <SelectItem key={forma.valor} value={forma.valor}>
                      {forma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data Início</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  value={filtros.data_inicio}
                  onChange={(e) => onFiltroChange('data_inicio', e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data Fim</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="date"
                  value={filtros.data_fim}
                  onChange={(e) => onFiltroChange('data_fim', e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}