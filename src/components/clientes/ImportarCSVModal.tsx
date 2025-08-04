
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, AlertTriangle, CheckCircle, Download, Users, Building, AlertCircle } from "lucide-react";
import { useImportarClientes } from '@/hooks/useImportarClientes';

interface ImportarCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (resultado: any) => void;
}

export function ImportarCSVModal({ isOpen, onClose, onImport }: ImportarCSVModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  
  const { processo, processarImportacao, gerarTemplateImportacao } = useImportarClientes();

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    const extensoesValidas = ['.csv', '.xlsx', '.xls'];
    const extensaoArquivo = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (extensoesValidas.includes(extensaoArquivo)) {
      setSelectedFile(file);
      setResultado(null);
    } else {
      alert('Por favor, selecione apenas arquivos CSV, XLS ou XLSX');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setImportando(true);
    try {
      const resultadoImportacao = await processarImportacao(selectedFile);
      setResultado(resultadoImportacao);
      
      // Sempre chama onImport com o resultado, independente do sucesso
      onImport(resultadoImportacao);
    } catch (error) {
      console.error('Erro na importação:', error);
    } finally {
      setImportando(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setResultado(null);
    setImportando(false);
    onClose();
  };

  // Mostrar resultado se houver
  if (resultado) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
               {resultado.importados > 0 ? (
                 <CheckCircle className="w-6 h-6 text-green-600" />
               ) : (
                 <AlertCircle className="w-6 h-6 text-red-600" />
               )}
               Resultado da Importação
             </h2>
             <p className="text-sm text-gray-600 mt-1">
               {resultado.importados > 0 
                 ? `${resultado.importados} cliente(s) importado(s) com sucesso!`
                 : 'Importação concluída com erros'
               }
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetModal} className="rounded-xl">
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            
            {/* Resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="bg-gradient-to-br from-green-50/80 to-green-100/40 backdrop-blur-sm rounded-2xl p-4 border border-green-200/50">
                 <div className="text-2xl font-bold text-green-700">{resultado.importados}</div>
                 <div className="text-sm text-green-600">Importados</div>
               </div>
              
              <div className="bg-gradient-to-br from-red-50/80 to-red-100/40 backdrop-blur-sm rounded-2xl p-4 border border-red-200/50">
                <div className="text-2xl font-bold text-red-700">{resultado.erros.length}</div>
                <div className="text-sm text-red-600">Erros</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50/80 to-yellow-100/40 backdrop-blur-sm rounded-2xl p-4 border border-yellow-200/50">
                <div className="text-2xl font-bold text-yellow-700">{resultado.warnings.length}</div>
                <div className="text-sm text-yellow-600">Avisos</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
                <div className="text-2xl font-bold text-blue-700">{resultado.analises.duplicatas}</div>
                <div className="text-sm text-blue-600">Duplicatas</div>
              </div>
            </div>

            {/* Análises */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/60 rounded-xl">
                <div className="text-lg font-bold text-blue-700">{resultado.analises.pessoaFisica}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  Pessoa Física
                </div>
              </div>
              
              <div className="text-center p-3 bg-white/60 rounded-xl">
                <div className="text-lg font-bold text-purple-700">{resultado.analises.pessoaJuridica}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Building className="w-3 h-3" />
                  Pessoa Jurídica
                </div>
              </div>
              
              <div className="text-center p-3 bg-white/60 rounded-xl">
                <div className="text-lg font-bold text-green-700">{resultado.analises.clientesAtivos}</div>
                <div className="text-sm text-gray-600">Ativos</div>
              </div>
              
              <div className="text-center p-3 bg-white/60 rounded-xl">
                <div className="text-lg font-bold text-gray-700">{resultado.analises.clientesInativos}</div>
                <div className="text-sm text-gray-600">Inativos</div>
              </div>
            </div>

            {/* Erros */}
            {resultado.erros.length > 0 && (
              <div className="bg-gradient-to-br from-red-50/80 to-red-100/40 backdrop-blur-sm rounded-2xl p-6 border border-red-200/50">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Erros encontrados ({resultado.erros.length})
                </h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {resultado.erros.slice(0, 10).map((erro: string, index: number) => (
                    <div key={index} className="text-sm text-red-700 bg-white/60 p-2 rounded">
                      {erro}
                    </div>
                  ))}
                  {resultado.erros.length > 10 && (
                    <div className="text-sm text-red-600 font-medium">
                      ... e mais {resultado.erros.length - 10} erro(s)
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Avisos */}
            {resultado.warnings.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-50/80 to-yellow-100/40 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200/50">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Avisos ({resultado.warnings.length})
                </h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {resultado.warnings.slice(0, 5).map((aviso: string, index: number) => (
                    <div key={index} className="text-sm text-yellow-700 bg-white/60 p-2 rounded">
                      {aviso}
                    </div>
                  ))}
                  {resultado.warnings.length > 5 && (
                    <div className="text-sm text-yellow-600 font-medium">
                      ... e mais {resultado.warnings.length - 5} aviso(s)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-Gray-200/50 flex justify-end">
            <Button 
              onClick={resetModal}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Concluir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Importar Clientes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Importe clientes via arquivo CSV ou Excel
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetModal} className="rounded-xl" disabled={importando}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          
          {/* Progresso de Importação */}
          {importando && (
            <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50">
              <div className="text-center space-y-4">
                <div className="text-lg font-semibold text-blue-800">
                  {processo.mensagem}
                </div>
                <Progress value={processo.progresso} className="w-full" />
                 <div className="text-sm text-blue-600">
                   {processo.etapa === 'aguardando' && 'Aguardando...'}
                   {processo.etapa === 'lendo' && 'Lendo arquivo...'}
                   {processo.etapa === 'validando' && 'Validando dados...'}
                   {processo.etapa === 'importando' && 'Importando clientes...'}
                   {processo.etapa === 'concluido' && 'Concluído!'}
                   {processo.etapa === 'erro' && 'Erro na importação'}
                 </div>
              </div>
            </div>
          )}

          {!importando && (
            <>
              {/* Formato do Arquivo */}
              <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Formatos Aceitos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center border border-blue-200/30">
                    <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-medium text-gray-900">CSV</div>
                    <div className="text-xs text-gray-600">Separado por vírgulas</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center border border-green-200/30">
                    <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="font-medium text-gray-900">Excel</div>
                    <div className="text-xs text-gray-600">Arquivo .xlsx</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center border border-purple-200/30">
                    <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="font-medium text-gray-900">Excel Antigo</div>
                    <div className="text-xs text-gray-600">Arquivo .xls</div>
                  </div>
                </div>
              </div>
              
              {/* Área de Upload */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-50/60' 
                    : selectedFile 
                      ? 'border-green-400 bg-green-50/60' 
                      : 'border-gray-300 bg-gray-50/30'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {selectedFile ? (
                  <div className="space-y-3">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                    <h3 className="font-semibold text-green-800">Arquivo Selecionado</h3>
                    <p className="text-sm text-green-700">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Remover arquivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <h3 className="font-semibold text-gray-900">Arraste o arquivo aqui</h3>
                    <p className="text-sm text-gray-500">ou clique para selecionar</p>
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.csv,.xlsx,.xls';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileSelect(file);
                        };
                        input.click();
                      }}
                    >
                      Selecionar Arquivo
                    </Button>
                  </div>
                )}
              </div>

              {/* Template para Download */}
              <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-gray-600" />
                  Template para Download
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Baixe um arquivo de exemplo para facilitar a importação:
                </p>
                <Button 
                  variant="outline"
                  onClick={gerarTemplateImportacao}
                  className="bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Baixar Template CSV
                </Button>
              </div>
              
              {/* Regras Importantes */}
              <div className="bg-gradient-to-br from-yellow-50/80 to-orange-50/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-200/50">
                <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Regras Importantes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <ul className="text-sm text-yellow-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span><strong>Máximo:</strong> 1000 clientes por importação</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span><strong>Duplicados:</strong> Documentos já cadastrados serão ignorados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span><strong>Obrigatórios:</strong> nome, documento e tipo</span>
                    </li>
                  </ul>
                  <ul className="text-sm text-yellow-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span><strong>Tipo:</strong> Use "PF" para Pessoa Física e "PJ" para Pessoa Jurídica</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span><strong>Status:</strong> Use "ativo", "inativo" ou "bloqueado"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span><strong>Encoding:</strong> UTF-8 para caracteres especiais</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        {!importando && (
          <div className="p-6 border-t border-gray-200/50 flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={resetModal}
              className="bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!selectedFile}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar Clientes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
