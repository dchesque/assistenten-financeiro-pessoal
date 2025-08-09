import { useState, useCallback } from 'react';
import { Download, Upload, FileText, Shield, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBackup } from '@/hooks/useBackup';
import { BackupFile, ImportOptions, ValidationIssue } from '@/types/backup';
import { toast } from 'sonner';

const BackupPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<BackupFile | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [confirmStrategy, setConfirmStrategy] = useState<'merge' | 'replace'>('merge');
  
  const {
    isExporting,
    isImporting,
    validationReport,
    importResult,
    exportBackup,
    validateFile,
    importBackup,
    resetState
  } = useBackup();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      toast.error('Por favor, selecione um arquivo JSON');
      return;
    }

    setSelectedFile(file);
    
    try {
      const report = await validateFile(file);
      
      if (report.valid) {
        const text = await file.text();
        const backup = JSON.parse(text) as BackupFile;
        setBackupData(backup);
        setImportModalOpen(true);
      } else {
        toast.error('Arquivo de backup inválido');
      }
    } catch (error) {
      toast.error('Erro ao processar arquivo');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleImportConfirm = async () => {
    if (!backupData) return;

    const options: ImportOptions = {
      strategy: confirmStrategy,
      dryRun: false
    };

    const result = await importBackup(backupData, options);
    
    if (result.success) {
      setImportModalOpen(false);
      resetState();
      setSelectedFile(null);
      setBackupData(null);
    }
  };

  const getIssueIcon = (issue: ValidationIssue) => {
    switch (issue.level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Backup & Importação</h1>
        <p className="text-gray-600 mt-1">Gerencie seus dados com segurança</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exportação */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5 text-blue-600" />
              <span>Exportar Dados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Faça backup completo dos seus dados em formato JSON seguro.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Último backup:</span>
                <Badge variant="secondary">Nunca</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tamanho estimado:</span>
                <Badge variant="secondary">~50KB</Badge>
              </div>
            </div>

            <Alert>
              <Shield className="w-4 h-4" />
              <AlertDescription>
                O backup inclui categorias, fornecedores, bancos, contas e transações.
                Dados sensíveis são automaticamente excluídos.
              </AlertDescription>
            </Alert>

            <Button
              onClick={exportBackup}
              disabled={isExporting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {isExporting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Gerando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Exportar JSON</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Importação */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-green-600" />
              <span>Importar Dados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Restaure seus dados a partir de um backup JSON.
            </p>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Arraste um arquivo JSON aqui ou
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleInputChange}
                className="hidden"
                id="backup-file"
              />
              <label htmlFor="backup-file">
                <Button variant="outline" className="cursor-pointer">
                  Selecionar Arquivo
                </Button>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      resetState();
                    }}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            )}

            {validationReport && !validationReport.valid && (
              <Alert variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>
                  Arquivo inválido. Verifique os erros antes de continuar.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Importação */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Importação</DialogTitle>
          </DialogHeader>

          {validationReport && backupData && (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">Prévia</TabsTrigger>
                <TabsTrigger value="validation">Validação</TabsTrigger>
                <TabsTrigger value="options">Opções</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(validationReport.preview.recordCounts).map(([key, count]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {key.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Informações do Backup:</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Exportado em:</span>
                      <span>{new Date(backupData.exported_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Versão:</span>
                      <span>{backupData.schema_version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de registros:</span>
                      <span>{validationReport.preview.totalRecords}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="validation" className="space-y-4">
                {validationReport.issues.length === 0 ? (
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Nenhum problema encontrado. O backup está válido para importação.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {validationReport.issues.map((issue, index) => (
                      <Alert key={index} variant={issue.level === 'error' ? 'destructive' : 'default'}>
                        {getIssueIcon(issue)}
                        <AlertDescription>{issue.message}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Estratégia de Importação:</p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="merge"
                          checked={confirmStrategy === 'merge'}
                          onChange={(e) => setConfirmStrategy(e.target.value as 'merge')}
                        />
                        <div>
                          <div className="font-medium">Merge (Recomendado)</div>
                          <div className="text-sm text-gray-600">
                            Mescla dados novos com existentes, mantendo registros únicos
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="replace"
                          checked={confirmStrategy === 'replace'}
                          onChange={(e) => setConfirmStrategy(e.target.value as 'replace')}
                          disabled
                        />
                        <div>
                          <div className="font-medium text-gray-400">Replace (Em breve)</div>
                          <div className="text-sm text-gray-400">
                            Substitui todos os dados existentes
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Importando...</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="w-full" />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(false)}
              disabled={isImporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportConfirm}
              disabled={!validationReport?.valid || isImporting}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white"
            >
              {isImporting ? 'Importando...' : 'Confirmar Importação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupPage;