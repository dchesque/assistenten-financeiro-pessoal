import { useState } from 'react';
import { Search, Filter, X, Calendar, DollarSign, Building2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FiltrosInteligentesProps {
  filtros: any;
  setFiltros: (filtros: any) => void;
  filtroRapido: string;
  setFiltroRapido: (filtro: string) => void;
  fornecedores: Array<{ id: string; name: string }>;
  categorias: Array<{ id: string; name: string; color?: string }>;
  estatisticas: {
    total: number;
    pending: number;
    overdue: number;
    paid: number;
  };
  onLimparFiltros: () => void;
}

export function FiltrosInteligentes({
  filtros,
  setFiltros,
  filtroRapido,
  setFiltroRapido,
  fornecedores,
  categorias,
  estatisticas,
  onLimparFiltros
}: FiltrosInteligentesProps) {
  const [filtrosAvancadosAbertos, setFiltrosAvancadosAbertos] = useState(false);

  const filtrosRapidos = [
    { 
      id: 'todos', 
      label: 'Todas', 
      count: estatisticas.total,
      className: 'border-gray-200 text-gray-700 hover:bg-gray-50'
    },
    { 
      id: 'pending', 
      label: 'Pendentes', 
      count: estatisticas.pending,
      className: 'border-blue-200 text-blue-700 hover:bg-blue-50'
    },
    { 
      id: 'overdue', 
      label: 'Vencidas', 
      count: estatisticas.overdue,
      className: 'border-red-200 text-red-700 hover:bg-red-50'
    },
    { 
      id: 'vence_7_dias', 
      label: 'Vencendo (7 dias)', 
      count: 0, // será calculado dinamicamente
      className: 'border-orange-200 text-orange-700 hover:bg-orange-50'
    },
    { 
      id: 'paid', 
      label: 'Pagas', 
      count: estatisticas.paid,
      className: 'border-green-200 text-green-700 hover:bg-green-50'
    }
  ];

  const handleFiltroRapido = (filtroId: string) => {
    setFiltroRapido(filtroId);
    
    // Ajustar filtros baseado no filtro rápido
    if (filtroId === 'todos') {
      setFiltros(prev => ({ ...prev, status: '' }));
    } else if (filtroId === 'vence_7_dias') {
      setFiltros(prev => ({ ...prev, status: 'pending' }));
    } else {
      setFiltros(prev => ({ ...prev, status: filtroId }));
    }
  };

  const temFiltrosAtivos = () => {
    return (
      filtros.busca ||
      filtros.status ||
      filtros.fornecedor_id ||
      filtros.categoria_id ||
      filtros.data_inicio ||
      filtros.data_fim ||
      filtros.valor_min ||
      filtros.valor_max
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros Rápidos */}
      <div className="flex flex-wrap gap-2">
        {filtrosRapidos.map((filtro) => (
          <Button
            key={filtro.id}
            variant={filtroRapido === filtro.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleFiltroRapido(filtro.id)}
            className={`${filtro.className} ${
              filtroRapido === filtro.id 
                ? 'bg-primary text-primary-foreground' 
                : ''
            }`}
          >
            {filtro.label}
            <Badge 
              variant="secondary" 
              className="ml-2 bg-white/20 text-current border-0"
            >
              {filtro.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Filtros Principais */}
      <Card className="card-base">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar contas..."
                value={filtros.busca || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                className="pl-10 input-base"
              />
            </div>

            {/* Filtro por Mês */}
            <Select 
              value={filtros.mes || ''} 
              onValueChange={(value) => setFiltros({ ...filtros, mes: value })}
            >
              <SelectTrigger className="input-base">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Selecionar mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos_meses">Todos os meses</SelectItem>
                <SelectItem value="2024-01">Janeiro 2024</SelectItem>
                <SelectItem value="2024-02">Fevereiro 2024</SelectItem>
                <SelectItem value="2024-03">Março 2024</SelectItem>
                <SelectItem value="2024-04">Abril 2024</SelectItem>
                <SelectItem value="2024-05">Maio 2024</SelectItem>
                <SelectItem value="2024-06">Junho 2024</SelectItem>
                <SelectItem value="2024-07">Julho 2024</SelectItem>
                <SelectItem value="2024-08">Agosto 2024</SelectItem>
                <SelectItem value="2024-09">Setembro 2024</SelectItem>
                <SelectItem value="2024-10">Outubro 2024</SelectItem>
                <SelectItem value="2024-11">Novembro 2024</SelectItem>
                <SelectItem value="2024-12">Dezembro 2024</SelectItem>
                <SelectItem value="2025-01">Janeiro 2025</SelectItem>
                <SelectItem value="2025-02">Fevereiro 2025</SelectItem>
                <SelectItem value="2025-03">Março 2025</SelectItem>
                <SelectItem value="2025-04">Abril 2025</SelectItem>
                <SelectItem value="2025-05">Maio 2025</SelectItem>
                <SelectItem value="2025-06">Junho 2025</SelectItem>
                <SelectItem value="2025-07">Julho 2025</SelectItem>
                <SelectItem value="2025-08">Agosto 2025</SelectItem>
                <SelectItem value="2025-09">Setembro 2025</SelectItem>
                <SelectItem value="2025-10">Outubro 2025</SelectItem>
                <SelectItem value="2025-11">Novembro 2025</SelectItem>
                <SelectItem value="2025-12">Dezembro 2025</SelectItem>
              </SelectContent>
            </Select>

            {/* Fornecedor */}
            <Select 
              value={filtros.fornecedor_id || ''} 
              onValueChange={(value) => setFiltros(prev => ({ ...prev, fornecedor_id: value }))}
            >
              <SelectTrigger className="input-base">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os fornecedores</SelectItem>
                {fornecedores.map((fornecedor) => (
                  <SelectItem key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Categoria */}
            <Select 
              value={filtros.categoria_id || ''} 
              onValueChange={(value) => setFiltros(prev => ({ ...prev, categoria_id: value }))}
            >
              <SelectTrigger className="input-base">
                <Tag className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoria.color || '#6B7280' }}
                      />
                      {categoria.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtros Avançados Toggle */}
            <Collapsible
              open={filtrosAvancadosAbertos}
              onOpenChange={setFiltrosAvancadosAbertos}
            >
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros Avançados
                  {temFiltrosAtivos() && (
                    <Badge variant="secondary" className="ml-1">
                      Ativos
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Filtros Avançados */}
          <Collapsible
            open={filtrosAvancadosAbertos}
            onOpenChange={setFiltrosAvancadosAbertos}
          >
            <CollapsibleContent className="mt-4 pt-4 border-t border-gray-200/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Período */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Data Início
                  </label>
                  <Input
                    type="date"
                    value={filtros.data_inicio || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                    className="input-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={filtros.data_fim || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                    className="input-base"
                  />
                </div>

                {/* Valores */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Valor Mínimo
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={filtros.valor_min || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, valor_min: parseFloat(e.target.value) || 0 }))}
                    className="input-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Valor Máximo
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={filtros.valor_max || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, valor_max: parseFloat(e.target.value) || 0 }))}
                    className="input-base"
                  />
                </div>
              </div>

              {/* Ações dos Filtros */}
              {temFiltrosAtivos() && (
                <div className="flex justify-end mt-4 pt-4 border-t border-gray-200/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLimparFiltros}
                    className="flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}