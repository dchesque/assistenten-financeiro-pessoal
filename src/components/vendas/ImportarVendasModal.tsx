import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/toast-system';
import { useImportarVendas } from '@/hooks/useImportarVendas';
import { ImportacaoProgresso } from './ImportacaoProgresso';
import { ResultadoImportacao } from './ResultadoImportacao';

interface ImportarVendasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (vendasImportadas: any[]) => void;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function ImportarVendasModal({ isOpen, onClose, onImportSuccess }: ImportarVendasModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { processo, processarImportacao } = useImportarVendas();
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'result'>('upload');
  const [resultadoImportacao, setResultadoImportacao] = useState<any>(null);

  const formatoEsperado = [
    'data,cliente,categoria,valor_bruto,desconto,valor_liquido,forma_pagamento,tipo,documento,banco',
    '2025-01-14,João Silva Santos,Receita de Vendas,850.00,42.50,807.50,PIX,Venda,NF-001,Banco do Brasil',
    '2025-01-14,VAREJO,Receita de Serviços,320.00,0.00,320.00,Dinheiro,Venda,,',
    '2025-01-13,Maria Costa,Receita de Vendas,200.00,0.00,-200.00,PIX,Devolução,DEV-001,Itaú'
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validações do arquivo
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Apenas arquivos CSV são aceitos');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setFile(selectedFile);
    processFile(selectedFile);
  };

  const processFile = async (file: File) => {
    setLoading(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Arquivo deve conter pelo menos cabeçalho e uma linha de dados');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1, 6).map(line => line.split(',').map(cell => cell.trim()));

      const previewData: PreviewData = {
        headers,
        rows,
        totalRows: lines.length - 1
      };

      setPreview(previewData);
      
      // Validar estrutura
      const validation = validateFile(previewData, lines);
      setValidation(validation);
      
      setStep('preview');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (preview: PreviewData, allLines: string[]): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar cabeçalhos obrigatórios
    const requiredHeaders = ['data', 'cliente', 'categoria', 'valor_bruto', 'forma_pagamento'];
    const missingHeaders = requiredHeaders.filter(h => 
      !preview.headers.some(header => header.toLowerCase().includes(h))
    );

    if (missingHeaders.length > 0) {
      errors.push(`Colunas obrigatórias ausentes: ${missingHeaders.join(', ')}`);
    }

    // Validar algumas linhas de exemplo
    allLines.slice(1, 11).forEach((line, index) => {
      const cells = line.split(',').map(c => c.trim());
      
      if (cells.length < 6) {
        warnings.push(`Linha ${index + 2}: Dados insuficientes`);
      }

      // Validar data
      if (cells[0] && !cells[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
        warnings.push(`Linha ${index + 2}: Data inválida (${cells[0]})`);
      }

      // Validar valor
      if (cells[3] && isNaN(parseFloat(cells[3].replace(',', '.')))) {
        warnings.push(`Linha ${index + 2}: Valor inválido (${cells[3]})`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.slice(0, 10) // Limitar avisos para não poluir
    };
  };

  const handleImport = async () => {
    if (!file || !validation?.valid) return;

    setLoading(true);
    setStep('processing');

    try {
      const resultado = await processarImportacao(file);
      setResultadoImportacao(resultado);
      setStep('result');

      if (resultado.sucessos > 0) {
        toast.success(`${resultado.sucessos} vendas importadas com sucesso!`);
        onImportSuccess(resultado.vendasCriadas);
      }
    } catch (error) {
      toast.error('Erro durante a importação');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = formatoEsperado.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_importacao_vendas.csv';
    link.click();
  };

  const resetModal = () => {
    setFile(null);
    setPreview(null);
    setValidation(null);
    setStep('upload');
    setResultadoImportacao(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Vendas"
      subtitle="Importe vendas em lote através de arquivo CSV"
      size="xl"
      className="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: Instruções */}
        <div className="space-y-4">
          <Card className="bg-blue-50/50 border border-blue-200/50 rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Instruções de Importação</span>
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📋 Formato do Arquivo:</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Arquivo CSV com encoding UTF-8</li>
                    <li>Separador: vírgula (,)</li>
                    <li>Primeira linha deve conter cabeçalhos</li>
                    <li>Tamanho máximo: 5MB</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📝 Colunas Obrigatórias:</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><strong>data:</strong> YYYY-MM-DD</li>
                    <li><strong>cliente:</strong> Nome do cliente ou VAREJO</li>
                    <li><strong>categoria:</strong> Nome da categoria</li>
                    <li><strong>valor_bruto:</strong> Valor em reais (999.99)</li>
                    <li><strong>forma_pagamento:</strong> PIX, Cartão, etc.</li>
                    <li><strong>tipo:</strong> Venda, Devolução, Desconto</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📊 Exemplo de Formato:</h4>
                  <div className="bg-gray-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                    {formatoEsperado.map((line, index) => (
                      <div key={index} className={index === 0 ? 'font-bold text-blue-700' : 'text-gray-700'}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={downloadTemplate}
                  className="w-full bg-white border-2 border-blue-300 text-blue-700 rounded-xl font-medium hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Conteúdo dinâmico baseado no step */}
        <div className="space-y-4">
          {step === 'upload' && (
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-green-600" />
                  <span>Selecionar Arquivo</span>
                </h3>

                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Arraste o arquivo CSV aqui
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    ou clique para selecionar
                  </p>
                  
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg"
                  >
                    Selecionar Arquivo
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {loading && (
                  <div className="flex items-center justify-center space-x-2 mt-4">
                    <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Processando arquivo...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 'preview' && preview && validation && (
            <div className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Preview do Arquivo</span>
                  </h3>

                  {/* Status da Validação */}
                  <div className="mb-4">
                    {validation.valid ? (
                      <Badge className="bg-green-100 text-green-700 rounded-full mb-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Arquivo válido
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 rounded-full mb-2">
                        <XCircle className="w-3 h-3 mr-1" />
                        Erros encontrados
                      </Badge>
                    )}

                    <p className="text-sm text-gray-600">
                      {preview.totalRows} linhas detectadas • Mostrando primeiras 5
                    </p>
                  </div>

                  {/* Erros */}
                  {validation.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <h4 className="font-medium text-red-900 flex items-center space-x-1 mb-2">
                        <XCircle className="w-4 h-4" />
                        <span>Erros Críticos:</span>
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {validation.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <h4 className="font-medium text-yellow-900 flex items-center space-x-1 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Avisos ({validation.warnings.length}):</span>
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1 max-h-20 overflow-y-auto">
                        {validation.warnings.slice(0, 5).map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                        {validation.warnings.length > 5 && (
                          <li className="font-medium">... e mais {validation.warnings.length - 5} avisos</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Preview da Tabela */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            {preview.headers.map((header, index) => (
                              <th key={index} className="px-2 py-2 text-left font-medium text-gray-700 border-r border-gray-200">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-gray-100">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-2 py-2 text-gray-900 border-r border-gray-100">
                                  {cell || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={resetModal}
                  className="bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Novo Arquivo</span>
                </Button>
                
                <Button 
                  onClick={handleImport}
                  disabled={!validation.valid || loading}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Importando...
                    </>
                  ) : (
                    'Importar Vendas'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <ImportacaoProgresso 
              processo={processo} 
              analises={resultadoImportacao?.analises}
            />
          )}

          {step === 'result' && resultadoImportacao && (
            <div className="space-y-4">
              <ResultadoImportacao resultado={resultadoImportacao} />
              
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={resetModal}
                  className="bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Importar Mais Vendas
                </Button>
                
                <Button 
                  onClick={handleClose}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg"
                >
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
