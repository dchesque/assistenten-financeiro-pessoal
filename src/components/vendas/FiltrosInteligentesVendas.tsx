import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  Search, 
  X, 
  Calendar,
  DollarSign,
  User,
  CreditCard,
  Package,
  SlidersHorizontal
} from 'lucide-react';
import { type FiltrosVendaAvancados } from '@/types/venda';
import { FORMAS_PAGAMENTO, TIPOS_VENDA } from '@/types/venda';

interface FiltrosInteligentesVendasProps {
  filtros: FiltrosVendaAvancados;
  onFiltrosChange: (filtros: Partial<FiltrosVendaAvancados>) => void;
  totalResultados?: number;
  loading?: boolean;
}

export function FiltrosInteligentesVendas({ 
  filtros, 
  onFiltrosChange, 
  totalResultados = 0,
  loading = false 
}: FiltrosInteligentesVendasProps) {
  const [expandido, setExpandido] = useState(false);

  const filtrosAtivos = [
    filtros.busca && { label: `Busca: "${filtros.busca}"`, key: 'busca' },
    filtros.vendedor && { label: `Vendedor: ${filtros.vendedor}`, key: 'vendedor' },
    filtros.formaPagamento && { label: `Pagamento: ${FORMAS_PAGAMENTO.find(f => f.valor === filtros.formaPagamento)?.nome}`, key: 'formaPagamento' },
    filtros.tipoVenda && { label: `Tipo: ${TIPOS_VENDA.find(t => t.valor === filtros.tipoVenda)?.nome}`, key: 'tipoVenda' },
    filtros.status && { label: `Status: ${filtros.status}`, key: 'status' },
    filtros.dataInicio && { label: `A partir de: ${new Date(filtros.dataInicio).toLocaleDateString('pt-BR')}`, key: 'dataInicio' },
    filtros.dataFim && { label: `Até: ${new Date(filtros.dataFim).toLocaleDateString('pt-BR')}`, key: 'dataFim' },
    filtros.valorMinimo !== undefined && { label: `Valor mín: R$ ${filtros.valorMinimo.toFixed(2)}`, key: 'valorMinimo' },
    filtros.valorMaximo !== undefined && { label: `Valor máx: R$ ${filtros.valorMaximo.toFixed(2)}`, key: 'valorMaximo' }
  ].filter(Boolean) as Array<{ label: string; key: keyof FiltrosVendaAvancados }>;

  const limparFiltro = (key: keyof FiltrosVendaAvancados) => {
    const novosFiltros = { ...filtros };
    if (key === 'valorMinimo' || key === 'valorMaximo') {
      novosFiltros[key] = undefined;
    } else {
      (novosFiltros as any)[key] = '';
    }
    onFiltrosChange(novosFiltros);
  };

  const limparTodosFiltros = () => {
    onFiltrosChange({
      busca: '',
      vendedor: '',
      formaPagamento: '',
      tipoVenda: '',
      status: '',
      dataInicio: '',
      dataFim: '',
      valorMinimo: undefined,
      valorMaximo: undefined,
      pagina: 1
    });
  };

  const aplicarFiltroRapido = (tipo: string) => {
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    switch (tipo) {
      case 'hoje':
        onFiltrosChange({
          dataInicio: hoje.toISOString().split('T')[0],
          dataFim: hoje.toISOString().split('T')[0]
        });
        break;
      case 'ontem':
        onFiltrosChange({
          dataInicio: ontem.toISOString().split('T')[0],
          dataFim: ontem.toISOString().split('T')[0]
        });
        break;
      case 'semana':
        onFiltrosChange({
          dataInicio: inicioSemana.toISOString().split('T')[0],
          dataFim: hoje.toISOString().split('T')[0]
        });
        break;
      case 'mes':
        onFiltrosChange({
          dataInicio: inicioMes.toISOString().split('T')[0],
          dataFim: hoje.toISOString().split('T')[0]
        });
        break;
      case 'alto-valor':
        onFiltrosChange({
          valorMinimo: 1000,
          ordenacao: 'valor_desc'
        });
        break;
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <span>Filtros Inteligentes</span>
            {filtrosAtivos.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {filtrosAtivos.length} ativo{filtrosAtivos.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandido(!expandido)}
              className="text-xs"
            >
              <SlidersHorizontal className="w-4 h-4 mr-1" />
              {expandido ? 'Ocultar' : 'Avançado'}
            </Button>
            
            {filtrosAtivos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparTodosFiltros}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Limpar tudo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Busca Principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por cliente, vendedor ou observações..."
            value={filtros.busca}
            onChange={(e) => onFiltrosChange({ busca: e.target.value, pagina: 1 })}
            className="pl-10 bg-white/80 backdrop-blur-sm border border-gray-300/50"
          />
        </div>

        {/* Filtros Rápidos */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => aplicarFiltroRapido('hoje')}
            className="text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => aplicarFiltroRapido('ontem')}
            className="text-xs"
          >
            Ontem
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => aplicarFiltroRapido('semana')}
            className="text-xs"
          >
            Esta Semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => aplicarFiltroRapido('mes')}
            className="text-xs"
          >
            Este Mês
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => aplicarFiltroRapido('alto-valor')}
            className="text-xs"
          >
            <DollarSign className="w-3 h-3 mr-1" />
            Alto Valor
          </Button>
        </div>

        {/* Filtros Aplicados */}
        {filtrosAtivos.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
            {filtrosAtivos.map((filtro) => (
              <Badge
                key={filtro.key}
                variant="secondary"
                className="flex items-center space-x-1 bg-blue-100 text-blue-800 border-blue-200"
              >
                <span className="text-xs">{filtro.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => limparFiltro(filtro.key)}
                  className="h-3 w-3 p-0 ml-1 hover:bg-blue-200"
                >
                  <X className="w-2 h-2" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Filtros Avançados */}
        {expandido && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Vendedor */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Vendedor</label>
                <Input
                  placeholder="Nome do vendedor"
                  value={filtros.vendedor}
                  onChange={(e) => onFiltrosChange({ vendedor: e.target.value, pagina: 1 })}
                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50"
                />
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Forma de Pagamento</label>
                <Select 
                  value={filtros.formaPagamento} 
                  onValueChange={(value) => onFiltrosChange({ formaPagamento: value, pagina: 1 })}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50">
                    <SelectValue placeholder="Todas as formas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as formas</SelectItem>
                    {FORMAS_PAGAMENTO.map((forma) => (
                      <SelectItem key={forma.valor} value={forma.valor}>
                        {forma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Venda */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Tipo de Venda</label>
                <Select 
                  value={filtros.tipoVenda} 
                  onValueChange={(value) => onFiltrosChange({ tipoVenda: value, pagina: 1 })}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os tipos</SelectItem>
                    {TIPOS_VENDA.map((tipo) => (
                      <SelectItem key={tipo.valor} value={tipo.valor}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Período Customizado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Data Inicial</label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => onFiltrosChange({ dataInicio: e.target.value, pagina: 1 })}
                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Data Final</label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => onFiltrosChange({ dataFim: e.target.value, pagina: 1 })}
                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50"
                />
              </div>
            </div>

            {/* Faixa de Valor */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Valor Mínimo</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={filtros.valorMinimo || ''}
                  onChange={(e) => onFiltrosChange({ 
                    valorMinimo: e.target.value ? parseFloat(e.target.value) : undefined, 
                    pagina: 1 
                  })}
                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Valor Máximo</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$ 999.999,99"
                  value={filtros.valorMaximo || ''}
                  onChange={(e) => onFiltrosChange({ 
                    valorMaximo: e.target.value ? parseFloat(e.target.value) : undefined, 
                    pagina: 1 
                  })}
                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50"
                />
              </div>
            </div>

            {/* Ordenação */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Ordenar por</label>
              <Select 
                value={filtros.ordenacao} 
                onValueChange={(value: any) => onFiltrosChange({ ordenacao: value })}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data_desc">Data (mais recente)</SelectItem>
                  <SelectItem value="data_asc">Data (mais antiga)</SelectItem>
                  <SelectItem value="valor_desc">Valor (maior)</SelectItem>
                  <SelectItem value="valor_asc">Valor (menor)</SelectItem>
                  <SelectItem value="cliente">Cliente (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Resultado */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {loading ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Carregando...
              </span>
            ) : (
              <span>
                {totalResultados} resultado{totalResultados !== 1 ? 's' : ''} encontrado{totalResultados !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {filtros.itensPorPagina} itens por página
          </div>
        </div>
      </CardContent>
    </Card>
  );
}