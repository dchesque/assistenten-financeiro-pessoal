import { Calendar, Filter, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FiltrosRelatorio } from '@/hooks/useRelatoriosGerais';

interface FiltrosRelatorioProps {
  filtros: FiltrosRelatorio;
  onFiltrosChange: (filtros: Partial<FiltrosRelatorio>) => void;
  onGerarRelatorio: () => void;
  onExportarPDF: () => void;
  onExportarExcel: () => void;
  loading: boolean;
  periodosRapidos: Array<{ label: string; valor: string }>;
  onAplicarPeriodoRapido: (periodo: string) => void;
}

export function FiltrosRelatorio({
  filtros,
  onFiltrosChange,
  onGerarRelatorio,
  onExportarPDF,
  onExportarExcel,
  loading,
  periodosRapidos,
  onAplicarPeriodoRapido
}: FiltrosRelatorioProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
      <CardContent className="p-6">
        {/* Header do Card */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filtros do Relatório</h3>
              <p className="text-sm text-gray-600">Configure os parâmetros para geração</p>
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={onGerarRelatorio}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
            
            <Button
              onClick={onExportarPDF}
              disabled={loading}
              variant="outline"
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            
            <Button
              onClick={onExportarExcel}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Grid de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Período */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">Período *</label>
            
            {/* Períodos Rápidos */}
            <div className="grid grid-cols-2 gap-2">
              {periodosRapidos.map((periodo) => (
                <Button
                  key={periodo.valor}
                  variant="outline"
                  size="sm"
                  onClick={() => onAplicarPeriodoRapido(periodo.valor)}
                  className="text-xs hover:bg-blue-50 hover:border-blue-300"
                >
                  {periodo.label}
                </Button>
              ))}
            </div>
            
            {/* Seletores de Data */}
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filtros.periodo_inicio && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filtros.periodo_inicio ? (
                        format(filtros.periodo_inicio, "dd/MM/yyyy")
                      ) : (
                        <span>Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filtros.periodo_inicio}
                      onSelect={(date) => date && onFiltrosChange({ periodo_inicio: date })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filtros.periodo_fim && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filtros.periodo_fim ? (
                        format(filtros.periodo_fim, "dd/MM/yyyy")
                      ) : (
                        <span>Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filtros.periodo_fim}
                      onSelect={(date) => date && onFiltrosChange({ periodo_fim: date })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Tipo de Relatório */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo de Relatório *</label>
            <Select
              value={filtros.tipo_relatorio}
              onValueChange={(value: any) => onFiltrosChange({ tipo_relatorio: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resumo">Resumo Executivo</SelectItem>
                <SelectItem value="fornecedores">Fornecedores</SelectItem>
                <SelectItem value="contas">Contas a Pagar</SelectItem>
                <SelectItem value="fluxo">Fluxo de Caixa</SelectItem>
                <SelectItem value="categorias">Por Categoria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Agrupamento */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Agrupamento</label>
            <Select
              value={filtros.agrupamento}
              onValueChange={(value: any) => onFiltrosChange({ agrupamento: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar agrupamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="categoria">Por Categoria</SelectItem>
                <SelectItem value="fornecedor">Por Fornecedor</SelectItem>
                <SelectItem value="status">Por Status</SelectItem>
                <SelectItem value="vencimento">Por Vencimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Formato de Saída */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Formato de Saída</label>
            <Select
              value={filtros.formato_saida}
              onValueChange={(value: any) => onFiltrosChange({ formato_saida: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visualizar">Visualizar</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Período Selecionado */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Período selecionado:</span>
            <span className="font-medium text-gray-900">
              {format(filtros.periodo_inicio, 'dd/MM/yyyy')} até {format(filtros.periodo_fim, 'dd/MM/yyyy')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}