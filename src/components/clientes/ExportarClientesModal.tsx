
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Download, FileText, Table, BarChart3, Users, Building, Mail, Phone } from "lucide-react";
import { Cliente } from '@/types/cliente';
import { useExportarClientes } from '@/hooks/useExportarClientes';
import { formatarMoeda } from '@/utils/formatters';

interface ExportarClientesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  clientesFiltrados: Cliente[];
}

export function ExportarClientesModal({ isOpen, onClose, clientes, clientesFiltrados }: ExportarClientesModalProps) {
  const [tipoExportacao, setTipoExportacao] = useState<'csv' | 'excel'>('csv');
  const [exportarFiltrados, setExportarFiltrados] = useState(true);
  const [incluirEstatisticas, setIncluirEstatisticas] = useState(false);
  
  const { exportarCSV, exportarExcel, obterEstatisticasExportacao } = useExportarClientes();

  if (!isOpen) return null;

  const clientesParaExportar = exportarFiltrados ? clientesFiltrados : clientes;
  const estatisticas = obterEstatisticasExportacao(clientesParaExportar);

  const handleExportar = () => {
    const nomeArquivo = exportarFiltrados ? 'clientes_filtrados' : 'clientes_completo';
    
    if (tipoExportacao === 'csv') {
      exportarCSV(clientesParaExportar, nomeArquivo);
    } else {
      exportarExcel(clientesParaExportar, nomeArquivo);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Download className="w-6 h-6 text-green-600" />
              Exportar Clientes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Exporte seus clientes em formato CSV ou Excel
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          
          {/* Opções de Exportação */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tipo de Arquivo */}
            <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 backdrop-blur-sm border border-blue-200/50 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Formato do Arquivo
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="csv"
                      checked={tipoExportacao === 'csv'}
                      onCheckedChange={() => setTipoExportacao('csv')}
                    />
                    <label htmlFor="csv" className="flex-1 cursor-pointer">
                      <div className="font-medium">CSV (.csv)</div>
                      <div className="text-sm text-gray-600">Compatível com Excel, Google Sheets</div>
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="excel"
                      checked={tipoExportacao === 'excel'}
                      onCheckedChange={() => setTipoExportacao('excel')}
                    />
                    <label htmlFor="excel" className="flex-1 cursor-pointer">
                      <div className="font-medium">Excel (.xlsx)</div>
                      <div className="text-sm text-gray-600">Formato nativo do Microsoft Excel</div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Escopo da Exportação */}
            <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/40 backdrop-blur-sm border border-purple-200/50 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Table className="w-5 h-5 text-purple-600" />
                  Escopo da Exportação
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="filtrados"
                      checked={exportarFiltrados}
                      onCheckedChange={(checked) => setExportarFiltrados(!!checked)}
                    />
                    <label htmlFor="filtrados" className="flex-1 cursor-pointer">
                      <div className="font-medium">Apenas filtrados</div>
                      <div className="text-sm text-gray-600">
                        {clientesFiltrados.length} cliente(s) será(ão) exportado(s)
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="todos"
                      checked={!exportarFiltrados}
                      onCheckedChange={(checked) => setExportarFiltrados(!checked)}
                    />
                    <label htmlFor="todos" className="flex-1 cursor-pointer">
                      <div className="font-medium">Todos os clientes</div>
                      <div className="text-sm text-gray-600">
                        {clientes.length} cliente(s) será(ão) exportado(s)
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prévia das Estatísticas */}
          <Card className="bg-gradient-to-br from-green-50/80 to-green-100/40 backdrop-blur-sm border border-green-200/50 rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Resumo da Exportação
              </h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{estatisticas.total}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    Total
                  </div>
                </div>
                
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-2xl font-bold text-green-700">{estatisticas.ativos}</div>
                  <div className="text-sm text-gray-600">Ativos</div>
                </div>
                
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-2xl font-bold text-blue-700">{estatisticas.pessoaFisica}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Users className="w-3 h-3" />
                    PF
                  </div>
                </div>
                
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-2xl font-bold text-purple-700">{estatisticas.pessoaJuridica}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Building className="w-3 h-3" />
                    PJ
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-lg font-bold text-blue-700">{estatisticas.percentualAtivos}%</div>
                  <div className="text-sm text-gray-600">Taxa Ativação</div>
                </div>
                
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-lg font-bold text-green-700">{estatisticas.percentualComEmail}%</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Mail className="w-3 h-3" />
                    Com Email
                  </div>
                </div>
                
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-lg font-bold text-purple-700">{estatisticas.percentualComWhatsApp}%</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3" />
                    Com WhatsApp
                  </div>
                </div>
                
                <div className="text-center p-3 bg-white/60 rounded-xl">
                  <div className="text-lg font-bold text-indigo-700">{formatarMoeda(estatisticas.ticketMedioGeral)}</div>
                  <div className="text-sm text-gray-600">Ticket Médio</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campos que serão exportados */}
          <Card className="bg-gradient-to-br from-gray-50/80 to-gray-100/40 backdrop-blur-sm border border-gray-200/50 rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Campos que serão exportados</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {[
                  'Nome', 'Documento', 'Tipo', 'RG/IE', 'Telefone', 'WhatsApp',
                  'Email', 'CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro',
                  'Cidade', 'Estado', 'Status', 'Observações', 'Receber Promoções',
                  'WhatsApp Marketing', 'Total Compras', 'Valor Total Compras',
                  'Ticket Médio', 'Data Última Compra', 'Data Cadastro'
                ].map((campo) => (
                  <Badge key={campo} variant="outline" className="text-xs bg-white/60">
                    {campo}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleExportar}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar {tipoExportacao.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
}
