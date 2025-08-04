import { useState, useEffect } from 'react';
import type { FiltrosFluxoCaixa } from '@/types/fluxoCaixa';
import { PERIODOS_RAPIDOS } from '@/types/fluxoCaixa';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Filter, Calendar, Download, RotateCcw, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FiltrosFluxoCaixaProps {
  filtros: FiltrosFluxoCaixa;
  onFiltrosChange: (filtros: FiltrosFluxoCaixa) => void;
  onAplicarPeriodoRapido: (periodo: FiltrosFluxoCaixa['periodo_rapido']) => void;
  onLimparFiltros: () => void;
  onExportar: () => void;
}

export function FiltrosFluxoCaixa({ 
  filtros, 
  onFiltrosChange, 
  onAplicarPeriodoRapido,
  onLimparFiltros,
  onExportar 
}: FiltrosFluxoCaixaProps) {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [bancos, setBancos] = useState<any[]>([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState({
    tipo: false,
    categoria: false,
    status: false,
    origem: false,
    banco: false
  });

  // Carregar dados do Supabase
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar plano de contas
        const { data: planoContas } = await supabase
          .from('plano_contas')
          .select('id, nome, codigo')
          .eq('ativo', true)
          .order('codigo');
        
        if (planoContas) {
          setCategorias(planoContas);
        }

        // Carregar bancos
        const { data: bancosData } = await supabase
          .from('bancos')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');
        
        if (bancosData) {
          setBancos(bancosData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados dos filtros:', error);
      }
    };

    carregarDados();
  }, []);

  const tiposMovimento = [
    { valor: 'entrada', label: 'Entradas' },
    { valor: 'saida', label: 'Saídas' },
    { valor: 'transferencia', label: 'Transferências' }
  ];

  const statusMovimento = [
    { valor: 'realizado', label: 'Realizado' },
    { valor: 'previsto', label: 'Previsto' },
    { valor: 'em_atraso', label: 'Em Atraso' }
  ];

  const origemMovimento = [
    { valor: 'contas_pagar', label: 'Contas a Pagar' },
    { valor: 'vendas', label: 'Vendas' },
    { valor: 'bancos', label: 'Bancos' },
    { valor: 'manual', label: 'Manual' }
  ];

  const handleTipoChange = (valor: string, checked: boolean) => {
    const novosTipos = checked
      ? [...filtros.tipo_movimento, valor as any]
      : filtros.tipo_movimento.filter(t => t !== valor);
    
    onFiltrosChange({ ...filtros, tipo_movimento: novosTipos });
  };

  const handleStatusChange = (valor: string, checked: boolean) => {
    const novosStatus = checked
      ? [...filtros.status, valor as any]
      : filtros.status.filter(s => s !== valor);
    
    onFiltrosChange({ ...filtros, status: novosStatus });
  };

  const handleOrigemChange = (valor: string, checked: boolean) => {
    const novasOrigens = checked
      ? [...filtros.origem, valor as any]
      : filtros.origem.filter(o => o !== valor);
    
    onFiltrosChange({ ...filtros, origem: novasOrigens });
  };

  const handleCategoriaChange = (categoriaId: number, checked: boolean) => {
    const novasCategorias = checked
      ? [...filtros.categoria_ids, categoriaId]
      : filtros.categoria_ids.filter(id => id !== categoriaId);
    
    onFiltrosChange({ ...filtros, categoria_ids: novasCategorias });
  };

  const handleBancoChange = (bancoId: number, checked: boolean) => {
    const novosBancos = checked
      ? [...filtros.banco_ids, bancoId]
      : filtros.banco_ids.filter(id => id !== bancoId);
    
    onFiltrosChange({ ...filtros, banco_ids: novosBancos });
  };

  const contarFiltrosAtivos = () => {
    let count = 0;
    if (filtros.tipo_movimento.length < 3) count++;
    if (filtros.status.length < 3) count++;
    if (filtros.origem.length < 4) count++;
    if (filtros.categoria_ids.length > 0) count++;
    if (filtros.banco_ids.length > 0) count++;
    return count;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header dos Filtros */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
              {contarFiltrosAtivos() > 0 && (
                <Badge variant="secondary" className="bg-blue-100/80 text-blue-700">
                  {contarFiltrosAtivos()} ativo{contarFiltrosAtivos() > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onLimparFiltros}
              className="text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          </div>

          {/* Grid de Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Período Rápido */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Período</Label>
              <Select
                value={filtros.periodo_rapido}
                onValueChange={(value) => onAplicarPeriodoRapido(value as any)}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS_RAPIDOS.map(periodo => (
                    <SelectItem key={periodo.valor} value={periodo.valor}>
                      {periodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período Personalizado */}
            {filtros.periodo_rapido === 'personalizado' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Data Início</Label>
                  <Input
                    type="date"
                    value={filtros.data_inicio}
                    onChange={(e) => onFiltrosChange({ ...filtros, data_inicio: e.target.value })}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Data Fim</Label>
                  <Input
                    type="date"
                    value={filtros.data_fim}
                    onChange={(e) => onFiltrosChange({ ...filtros, data_fim: e.target.value })}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl"
                  />
                </div>
              </>
            )}

            {/* Tipo de Movimento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Tipo</Label>
              <Popover open={filtrosAbertos.tipo} onOpenChange={(open) => setFiltrosAbertos(prev => ({ ...prev, tipo: open }))}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl"
                  >
                    <span className="text-sm">
                      {filtros.tipo_movimento.length === 3 
                        ? 'Todos' 
                        : `${filtros.tipo_movimento.length} selecionado${filtros.tipo_movimento.length > 1 ? 's' : ''}`
                      }
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3">
                  <div className="space-y-2">
                    {tiposMovimento.map(tipo => (
                      <div key={tipo.valor} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tipo-${tipo.valor}`}
                          checked={filtros.tipo_movimento.includes(tipo.valor as any)}
                          onCheckedChange={(checked) => handleTipoChange(tipo.valor, checked as boolean)}
                        />
                        <Label htmlFor={`tipo-${tipo.valor}`} className="text-sm">
                          {tipo.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Status</Label>
              <Popover open={filtrosAbertos.status} onOpenChange={(open) => setFiltrosAbertos(prev => ({ ...prev, status: open }))}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl"
                  >
                    <span className="text-sm">
                      {filtros.status.length === 3 
                        ? 'Todos' 
                        : `${filtros.status.length} selecionado${filtros.status.length > 1 ? 's' : ''}`
                      }
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3">
                  <div className="space-y-2">
                    {statusMovimento.map(status => (
                      <div key={status.valor} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status.valor}`}
                          checked={filtros.status.includes(status.valor as any)}
                          onCheckedChange={(checked) => handleStatusChange(status.valor, checked as boolean)}
                        />
                        <Label htmlFor={`status-${status.valor}`} className="text-sm">
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Categoria</Label>
              <Popover open={filtrosAbertos.categoria} onOpenChange={(open) => setFiltrosAbertos(prev => ({ ...prev, categoria: open }))}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl"
                  >
                    <span className="text-sm">
                      {filtros.categoria_ids.length === 0 
                        ? 'Todas' 
                        : `${filtros.categoria_ids.length} selecionada${filtros.categoria_ids.length > 1 ? 's' : ''}`
                      }
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {categorias.map(categoria => (
                      <div key={categoria.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`categoria-${categoria.id}`}
                          checked={filtros.categoria_ids.includes(categoria.id)}
                          onCheckedChange={(checked) => handleCategoriaChange(categoria.id, checked as boolean)}
                        />
                        <Label htmlFor={`categoria-${categoria.id}`} className="text-sm">
                          {categoria.codigo} - {categoria.nome}
                        </Label>
                      </div>
                    ))}
                    {categorias.length === 0 && (
                      <div className="text-sm text-gray-500 py-2">
                        Carregando categorias...
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200/50">
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => {}} // Os filtros já são aplicados automaticamente
            >
              <Filter className="w-4 h-4 mr-2" />
              Aplicar Filtros
            </Button>
            
            <Button 
              variant="outline"
              onClick={onExportar}
              className="bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}