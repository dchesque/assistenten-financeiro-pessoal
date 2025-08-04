import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Filter,
  RotateCcw,
  CalendarDays,
  BarChart3,
  AlertCircle,
  Grid3X3,
  Settings2
} from "lucide-react";

interface DreFiltros {
  ano: number;
  tipoVisualizacao: 'mensal' | 'anual';
  mesEspecifico?: number;
  compararAtivo: boolean;
  anoComparacao?: number;
  mesComparacao?: number;
  nivelDetalhamento: 'resumido' | 'detalhado' | 'analitico';
}

interface DreFiltersProps {
  filtros: DreFiltros;
  onFiltrosChange: (filtros: DreFiltros) => void;
  onGerar: () => void;
  onLimpar: () => void;
  carregando: boolean;
  erroValidacao: string | null;
}

export function DreFilters({ 
  filtros, 
  onFiltrosChange, 
  onGerar, 
  onLimpar, 
  carregando, 
  erroValidacao 
}: DreFiltersProps) {
  const meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];

  const anos = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Filter className="w-5 h-5 text-blue-600" />
          Configurações de Análise
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Erro de Validação */}
        {erroValidacao && (
          <Alert className="bg-red-50/80 backdrop-blur-sm border-red-200/50 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 font-medium">
              {erroValidacao}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Período de Análise */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-foreground">Período de Análise</h3>
              <span className="text-destructive text-sm">*</span>
            </div>
            
            {/* Tipo de Visualização */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Visualização</label>
              <Tabs 
                value={filtros.tipoVisualizacao} 
                onValueChange={(value) => onFiltrosChange({...filtros, tipoVisualizacao: value as 'mensal' | 'anual'})}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-white/60 backdrop-blur-sm rounded-xl">
                  <TabsTrigger value="mensal" className="text-sm rounded-lg">
                    <CalendarDays className="w-4 h-4 mr-1" />
                    Mensal
                  </TabsTrigger>
                  <TabsTrigger value="anual" className="text-sm rounded-lg">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Anual
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Ano */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Ano</label>
              <Select 
                value={filtros.ano.toString()} 
                onValueChange={(value) => onFiltrosChange({...filtros, ano: parseInt(value)})}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mês (apenas se mensal) */}
            {filtros.tipoVisualizacao === 'mensal' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Mês</label>
                <Select 
                  value={filtros.mesEspecifico?.toString() || ''} 
                  onValueChange={(value) => onFiltrosChange({...filtros, mesEspecifico: parseInt(value)})}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                    {meses.map(mes => (
                      <SelectItem key={mes.valor} value={mes.valor.toString()}>
                        {mes.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Comparação */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Grid3X3 className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-foreground">Comparação</h3>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
              <Checkbox 
                id="comparar"
                checked={filtros.compararAtivo}
                onCheckedChange={(checked) => onFiltrosChange({...filtros, compararAtivo: checked as boolean})}
              />
              <label htmlFor="comparar" className="text-sm font-medium text-foreground cursor-pointer">
                Comparar períodos
              </label>
            </div>

            {filtros.compararAtivo && (
              <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50/60 to-purple-50/60 backdrop-blur-sm rounded-xl border border-blue-200/30">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Ano de Comparação</label>
                  <Select 
                    value={filtros.anoComparacao?.toString() || ''} 
                    onValueChange={(value) => onFiltrosChange({...filtros, anoComparacao: parseInt(value)})}
                  >
                    <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                      {anos.map(ano => (
                        <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {filtros.tipoVisualizacao === 'mensal' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mês de Comparação</label>
                    <Select 
                      value={filtros.mesComparacao?.toString() || ''} 
                      onValueChange={(value) => onFiltrosChange({...filtros, mesComparacao: parseInt(value)})}
                    >
                      <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                        {meses.map(mes => (
                          <SelectItem key={mes.valor} value={mes.valor.toString()}>
                            {mes.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configurações e Ações */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-foreground">Configurações</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nível de Detalhamento</label>
                <Select 
                  value={filtros.nivelDetalhamento} 
                  onValueChange={(value) => onFiltrosChange({...filtros, nivelDetalhamento: value as 'resumido' | 'detalhado' | 'analitico'})}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                    <SelectItem value="resumido">Resumido</SelectItem>
                    <SelectItem value="detalhado">Detalhado</SelectItem>
                    <SelectItem value="analitico">Analítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3 pt-4">
              <Button 
                onClick={onGerar}
                disabled={carregando}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {carregando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>}
                {carregando ? 'Gerando...' : 'Gerar DRE'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={onLimpar}
                disabled={carregando}
                className="w-full bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}