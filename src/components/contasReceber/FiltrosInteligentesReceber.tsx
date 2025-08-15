
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronDown, ChevronUp, Search, Calendar, Building2, Tag } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FiltrosContasReceber, EstatisticasContasReceber } from '@/hooks/useContasReceberOtimizado';

interface FiltrosInteligentesReceberProps {
  filtros: FiltrosContasReceber;
  setFiltros: (filtros: FiltrosContasReceber) => void;
  filtroRapido: string;
  setFiltroRapido: (filtro: string) => void;
  clientes: Array<{ id: string; nome: string }>;
  categorias: Array<{ id: string; name: string; color?: string }>;
  estatisticas: EstatisticasContasReceber;
  onLimparFiltros: () => void;
}

export const FiltrosInteligentesReceber: React.FC<FiltrosInteligentesReceberProps> = ({
  filtros,
  setFiltros,
  filtroRapido,
  setFiltroRapido,
  clientes,
  categorias,
  estatisticas,
  onLimparFiltros
}) => {
  const [filtrosAvancadosAbertos, setFiltrosAvancadosAbertos] = React.useState(false);

  const filtrosRapidos = [
    {
      id: 'todos',
      label: 'Todos',
      count: estatisticas.total,
      className: 'bg-blue-100/80 text-blue-700 hover:bg-blue-200/80'
    },
    {
      id: 'pendente',
      label: 'Pendentes',
      count: estatisticas.pendentes,
      className: 'bg-yellow-100/80 text-yellow-700 hover:bg-yellow-200/80'
    },
    {
      id: 'vencendo',
      label: 'Vencendo (7 dias)',
      count: estatisticas.vencendoProximo || 0,
      className: 'bg-orange-100/80 text-orange-700 hover:bg-orange-200/80'
    },
    {
      id: 'vencido',
      label: 'Vencidas',
      count: estatisticas.vencidas,
      className: 'bg-red-100/80 text-red-700 hover:bg-red-200/80'
    },
    {
      id: 'recebido',
      label: 'Recebidas',
      count: estatisticas.recebidas,
      className: 'bg-green-100/80 text-green-700 hover:bg-green-200/80'
    }
  ];

  const handleFiltroRapido = (novoFiltro: string) => {
    setFiltroRapido(novoFiltro);
    
    const novosFiltros = { ...filtros };
    
    if (novoFiltro === 'todos') {
      novosFiltros.status = 'todos';
      novosFiltros.vencendo_em = '';
    } else if (novoFiltro === 'vencendo') {
      novosFiltros.status = 'pendente';
      novosFiltros.vencendo_em = '7';
    } else {
      novosFiltros.status = novoFiltro as 'pendente' | 'recebido' | 'vencido';
      novosFiltros.vencendo_em = '';
    }
    
    setFiltros(novosFiltros);
  };

  const gerarOpcoesAno = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    for (let ano = anoAtual - 1; ano <= anoAtual + 1; ano++) {
      anos.push(ano);
    }
    return anos;
  };

  const gerarOpcoesMes = () => {
    const meses = [];
    const anos = gerarOpcoesAno();
    
    anos.forEach(ano => {
      for (let mes = 1; mes <= 12; mes++) {
        const mesFormatado = mes.toString().padStart(2, '0');
        const valor = `${ano}-${mesFormatado}`;
        const label = new Date(ano, mes - 1).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric'
        });
        meses.push({ valor, label: label.charAt(0).toUpperCase() + label.slice(1) });
      }
    });
    
    return meses;
  };

  const temFiltrosAtivos = () => {
    return (
      filtros.busca !== '' ||
      filtros.status !== 'todos' ||
      filtros.cliente_id !== '' ||
      filtros.categoria_id !== '' ||
      filtros.data_inicio !== '' ||
      filtros.data_fim !== '' ||
      filtros.valor_min !== '' ||
      filtros.valor_max !== '' ||
      filtros.mes_referencia !== '' ||
      filtros.vencendo_em !== ''
    );
  };

  return (
    <Card className="card-base mb-6">
      <CardContent className="p-6">
        {/* Filtros Rápidos */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filtrosRapidos.map((filtro) => (
            <Button
              key={filtro.id}
              variant={filtroRapido === filtro.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleFiltroRapido(filtro.id)}
              className={`flex items-center space-x-2 transition-all duration-200 ${
                filtroRapido === filtro.id 
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg' 
                  : filtro.className
              }`}
            >
              <span>{filtro.label}</span>
              <Badge variant="secondary" className="ml-1 bg-white/20 text-current">
                {filtro.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Filtros Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por descrição, cliente..."
              value={filtros.busca}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              className="input-base pl-10"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <Select
              value={filtros.mes_referencia}
              onValueChange={(value) => setFiltros({ ...filtros, mes_referencia: value })}
            >
              <SelectTrigger className="input-base pl-10">
                <SelectValue placeholder="Mês de referência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os meses</SelectItem>
                {gerarOpcoesMes().map(({ valor, label }) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <Select
              value={filtros.cliente_id}
              onValueChange={(value) => setFiltros({ ...filtros, cliente_id: value })}
            >
              <SelectTrigger className="input-base pl-10">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <Select
              value={filtros.categoria_id}
              onValueChange={(value) => setFiltros({ ...filtros, categoria_id: value })}
            >
              <SelectTrigger className="input-base pl-10">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: categoria.color || '#6b7280' }}
                      />
                      <span>{categoria.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Avançados */}
        <Collapsible open={filtrosAvancadosAbertos} onOpenChange={setFiltrosAvancadosAbertos}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <span>Filtros avançados</span>
              {filtrosAvancadosAbertos ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Data de vencimento</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="Data inicial"
                    value={filtros.data_inicio}
                    onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                    className="input-base"
                  />
                  <Input
                    type="date"
                    placeholder="Data final"
                    value={filtros.data_fim}
                    onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Faixa de valor</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Valor mínimo"
                    value={filtros.valor_min}
                    onChange={(e) => setFiltros({ ...filtros, valor_min: e.target.value })}
                    className="input-base"
                  />
                  <Input
                    type="number"
                    placeholder="Valor máximo"
                    value={filtros.valor_max}
                    onChange={(e) => setFiltros({ ...filtros, valor_max: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Botão Limpar Filtros */}
        {temFiltrosAtivos() && (
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onLimparFiltros}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
              <span>Limpar filtros</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
