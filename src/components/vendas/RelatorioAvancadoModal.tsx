import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Filter, 
  Search, 
  Download, 
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { RelatorioVendasService, type RelatorioConfig, type DadosRelatorio } from '@/services/RelatorioVendasService';
import { useToast } from '@/components/ui/use-toast';
import { formatarMoeda } from '@/utils/formatters';

interface RelatorioAvancadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RelatorioAvancadoModal({ open, onOpenChange }: RelatorioAvancadoModalProps) {
  const { toast } = useToast();
  
  const [config, setConfig] = useState<RelatorioConfig>({
    dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    formato: 'excel'
  });
  
  const [relatorio, setRelatorio] = useState<DadosRelatorio | null>(null);
  const [loading, setLoading] = useState(false);
  const [etapa, setEtapa] = useState<'configuracao' | 'visualizacao'>('configuracao');

  const handleGerarRelatorio = async () => {
    try {
      setLoading(true);
      
      const dados = await RelatorioVendasService.gerarRelatorio(config);
      setRelatorio(dados);
      setEtapa('visualizacao');
      
      toast({
        title: "Relatório Gerado",
        description: `Relatório com ${dados.resumo.totalVendas} vendas processado com sucesso!`
      });
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportarExcel = async () => {
    if (!relatorio) return;
    
    try {
      setLoading(true);
      await RelatorioVendasService.exportarExcel(relatorio, 'relatorio-vendas-avancado');
      
      toast({
        title: "Exportação Concluída",
        description: "Relatório exportado para Excel com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportarCSV = async () => {
    if (!relatorio) return;
    
    try {
      setLoading(true);
      await RelatorioVendasService.exportarCSV(relatorio, 'vendas-detalhadas');
      
      toast({
        title: "Exportação Concluída",
        description: "Dados exportados para CSV com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro", 
        description: "Erro ao exportar CSV",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setEtapa('configuracao');
    setRelatorio(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetModal();
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Relatório Avançado de Vendas</span>
          </DialogTitle>
        </DialogHeader>

        {etapa === 'configuracao' && (
          <div className="space-y-6">
            {/* Período */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Período</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Data Inicial</Label>
                  <Input
                    type="date"
                    value={config.dataInicio}
                    onChange={(e) => setConfig(prev => ({ ...prev, dataInicio: e.target.value }))}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Data Final</Label>
                  <Input
                    type="date"
                    value={config.dataFim}
                    onChange={(e) => setConfig(prev => ({ ...prev, dataFim: e.target.value }))}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50"
                  />
                </div>
              </div>
            </div>

            {/* Filtros Opcionais */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vendedor (Opcional)</Label>
                <Input
                  placeholder="Nome do vendedor"
                  value={config.vendedor || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, vendedor: e.target.value || undefined }))}
                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Formato de Exportação</Label>
                <Select 
                  value={config.formato || 'excel'} 
                  onValueChange={(value: 'excel' | 'csv') => setConfig(prev => ({ ...prev, formato: value }))}
                >
                  <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Opções Avançadas */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Opções do Relatório</Label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.incluirDetalhes || false}
                    onChange={(e) => setConfig(prev => ({ ...prev, incluirDetalhes: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Incluir vendas detalhadas</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.incluirGraficos || false}
                    onChange={(e) => setConfig(prev => ({ ...prev, incluirGraficos: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Incluir dados para gráficos</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="border-gray-300"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleGerarRelatorio}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                {loading ? 'Gerando...' : 'Gerar Relatório'}
              </Button>
            </div>
          </div>
        )}

        {etapa === 'visualizacao' && relatorio && (
          <div className="space-y-6">
            {/* Resumo Executivo */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    Receita Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatarMoeda(relatorio.resumo.valorLiquido)}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Crescimento: {relatorio.comparacoes.periodoAnterior.crescimento.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Total de Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    {relatorio.resumo.totalVendas}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Período selecionado
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Ticket Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">
                    {formatarMoeda(relatorio.resumo.ticketMedio)}
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    Por venda
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Comissões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    {formatarMoeda(relatorio.resumo.totalComissoes)}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Total do período
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Análises por Categoria */}
            <div className="grid grid-cols-2 gap-6">
              {/* Top Formas de Pagamento */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Top Formas de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatorio.graficos.vendasPorFormaPagamento.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{item.forma}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatarMoeda(item.valor)}</div>
                        <div className="text-xs text-gray-600">{item.quantidade} vendas</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Vendedores */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Top Vendedores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatorio.graficos.vendasPorVendedor.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{item.vendedor}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatarMoeda(item.valor)}</div>
                        <div className="text-xs text-gray-600">{item.quantidade} vendas</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Comparações */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-lg text-indigo-900">Comparações de Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-indigo-800 mb-2">vs. Período Anterior</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Vendas:</span>
                        <span className="font-medium">{relatorio.comparacoes.periodoAnterior.vendas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Receita:</span>
                        <span className="font-medium">{formatarMoeda(relatorio.comparacoes.periodoAnterior.valor)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crescimento:</span>
                        <span className={`font-bold ${relatorio.comparacoes.periodoAnterior.crescimento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {relatorio.comparacoes.periodoAnterior.crescimento.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-indigo-800 mb-2">vs. Ano Anterior</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Vendas:</span>
                        <span className="font-medium">{relatorio.comparacoes.anoAnterior.vendas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Receita:</span>
                        <span className="font-medium">{formatarMoeda(relatorio.comparacoes.anoAnterior.valor)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crescimento:</span>
                        <span className={`font-bold ${relatorio.comparacoes.anoAnterior.crescimento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {relatorio.comparacoes.anoAnterior.crescimento.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={resetModal}
                className="border-gray-300"
              >
                Nova Consulta
              </Button>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleExportarCSV}
                  disabled={loading}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button 
                  onClick={handleExportarExcel}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}