
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  FileText, 
  FileSpreadsheet, 
  Download,
  Settings,
  Eye,
  Calendar
} from "lucide-react";
import { exportarDRE, DadosDRE, ConfiguracaoExportacao, InsightsDRE } from "@/utils/exportacaoDRE";
import { useToast } from "@/hooks/use-toast";

interface ExportarDreModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodo: string;
  dadosDRE?: DadosDRE;
  insights?: InsightsDRE;
  carregando?: boolean;
}

export function ExportarDreModal({ 
  isOpen, 
  onClose, 
  periodo, 
  dadosDRE,
  insights,
  carregando = false 
}: ExportarDreModalProps) {
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [configuracao, setConfiguracao] = useState<ConfiguracaoExportacao>({
    formato: 'pdf',
    tipoRelatorio: 'detalhado',
    incluirComparacao: true,
    incluirInsights: true,
    incluirGraficos: false,
    orientacao: 'retrato',
    logoEmpresa: true
  });

  const handleExportar = async () => {
    if (!dadosDRE) {
      toast({
        title: "Erro",
        description: "Dados do DRE não disponíveis para exportação",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await exportarDRE(dadosDRE, configuracao, insights);
      
      toast({
        title: "Sucesso",
        description: `DRE exportado com sucesso em formato ${configuracao.formato.toUpperCase()}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na exportação",
        description: "Falha ao exportar o DRE. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarConfiguracao = (campo: keyof ConfiguracaoExportacao, valor: any) => {
    setConfiguracao(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Download className="w-5 h-5 text-blue-600" />
            Exportar DRE - {periodo}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          
          {/* Formato de Exportação */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Formato de Exportação
            </Label>
            <RadioGroup 
              value={configuracao.formato} 
              onValueChange={(value) => atualizarConfiguracao('formato', value)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 p-3 border border-gray-200/50 rounded-xl hover:bg-gray-50/50 transition-all duration-200">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-red-600" />
                  PDF
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border border-gray-200/50 rounded-xl hover:bg-gray-50/50 transition-all duration-200">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Excel
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Tipo de Relatório */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Tipo de Relatório
            </Label>
            <Select 
              value={configuracao.tipoRelatorio} 
              onValueChange={(value) => atualizarConfiguracao('tipoRelatorio', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                <SelectItem value="resumido">Resumido - Apenas totais</SelectItem>
                <SelectItem value="detalhado">Detalhado - Com subcategorias</SelectItem>
                <SelectItem value="analitico">Analítico - Máximo detalhamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configurações de Conteúdo */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              Conteúdo do Relatório
            </Label>
            <div className="grid grid-cols-1 gap-3">
              
              <div className="flex items-center space-x-2 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <Checkbox 
                  id="comparacao"
                  checked={configuracao.incluirComparacao}
                  onCheckedChange={(checked) => atualizarConfiguracao('incluirComparacao', checked)}
                />
                <Label htmlFor="comparacao" className="cursor-pointer">
                  Incluir dados de comparação
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <Checkbox 
                  id="insights"
                  checked={configuracao.incluirInsights}
                  onCheckedChange={(checked) => atualizarConfiguracao('incluirInsights', checked)}
                />
                <Label htmlFor="insights" className="cursor-pointer">
                  Incluir insights e recomendações
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <Checkbox 
                  id="graficos"
                  checked={configuracao.incluirGraficos}
                  onCheckedChange={(checked) => atualizarConfiguracao('incluirGraficos', checked)}
                />
                <Label htmlFor="graficos" className="cursor-pointer">
                  Incluir gráficos e visualizações
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
                <Checkbox 
                  id="logo"
                  checked={configuracao.logoEmpresa}
                  onCheckedChange={(checked) => atualizarConfiguracao('logoEmpresa', checked)}
                />
                <Label htmlFor="logo" className="cursor-pointer">
                  Incluir logo da empresa
                </Label>
              </div>
            </div>
          </div>

          {/* Orientação (apenas para PDF) */}
          {configuracao.formato === 'pdf' && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                Orientação da Página
              </Label>
              <RadioGroup 
                value={configuracao.orientacao} 
                onValueChange={(value) => atualizarConfiguracao('orientacao', value)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border border-gray-200/50 rounded-xl hover:bg-gray-50/50 transition-all duration-200">
                  <RadioGroupItem value="retrato" id="retrato" />
                  <Label htmlFor="retrato" className="cursor-pointer">
                    Retrato
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200/50 rounded-xl hover:bg-gray-50/50 transition-all duration-200">
                  <RadioGroupItem value="paisagem" id="paisagem" />
                  <Label htmlFor="paisagem" className="cursor-pointer">
                    Paisagem
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading || carregando}
              className="bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleExportar}
              disabled={loading || carregando}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {(loading || carregando) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>}
              {(loading || carregando) ? 'Exportando...' : `Exportar ${configuracao.formato.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
