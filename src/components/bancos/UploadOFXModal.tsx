import { useState, useRef } from 'react';
import { X, Upload, File, AlertCircle, CheckCircle, Loader2, Clock } from 'lucide-react';
import { Banco } from '../../types/banco';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { formatarMoeda, formatarData } from '../../utils/formatters';
import { processarArquivoOFX, validarArquivoOFX, DadosOFX } from '../../utils/ofxParser';

interface UploadOFXModalProps {
  isOpen: boolean;
  onClose: () => void;
  bancos: Banco[];
  bancoSelecionado?: Banco;
  onUpload: (arquivo: File, bancoId: number, dadosOFX: DadosOFX) => void;
}

interface EstadosProcessamento {
  validandoArquivo: boolean;
  processandoOFX: boolean;
  uploadCompleto: boolean;
}

export function UploadOFXModal({ 
  isOpen, 
  onClose, 
  bancos, 
  bancoSelecionado, 
  onUpload 
}: UploadOFXModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [bancoId, setBancoId] = useState<string>(bancoSelecionado?.id.toString() || '');
  const [dadosOFX, setDadosOFX] = useState<DadosOFX | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<'selecao' | 'processando' | 'preview' | 'uploading'>('selecao');
  const [estados, setEstados] = useState<EstadosProcessamento>({
    validandoArquivo: false,
    processandoOFX: false,
    uploadCompleto: false
  });

  const handleFileSelect = async (file: File) => {
    setEstados(prev => ({ ...prev, validandoArquivo: true }));
    setEtapaAtual('processando');
    
    try {
      // Validar arquivo
      await validarArquivoOFX(file);
      
      setArquivo(file);
      await processarPreview(file);
      
    } catch (error: any) {
      toast({
        title: "Erro no arquivo",
        description: error.message,
        variant: "destructive"
      });
      resetModal();
    } finally {
      setEstados(prev => ({ ...prev, validandoArquivo: false }));
    }
  };

  const processarPreview = async (file: File) => {
    setEstados(prev => ({ ...prev, processandoOFX: true }));
    
    try {
      // Ler arquivo como texto
      const conteudo = await file.text();
      
      // Processar OFX real
      const dados = await processarArquivoOFX(conteudo);
      
      setDadosOFX(dados);
      setEtapaAtual('preview');
      
      toast({
        title: "Arquivo processado",
        description: `${dados.totalTransacoes} transações encontradas`,
      });
      
    } catch (error: any) {
      toast({
        title: "Erro no processamento",
        description: error.message,
        variant: "destructive"
      });
      resetModal();
    } finally {
      setEstados(prev => ({ ...prev, processandoOFX: false }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!arquivo || !bancoId || !dadosOFX) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo e um banco",
        variant: "destructive"
      });
      return;
    }

    setEtapaAtual('uploading');
    setEstados(prev => ({ ...prev, uploadCompleto: false }));
    
    try {
      // Simular delay de upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await onUpload(arquivo, parseInt(bancoId), dadosOFX);
      
      setEstados(prev => ({ ...prev, uploadCompleto: true }));
      
      toast({
        title: "Sucesso",
        description: `Extrato importado! ${dadosOFX.totalTransacoes} transações processadas.`
      });
      
      // Aguardar um pouco para mostrar sucesso antes de fechar
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao importar extrato OFX",
        variant: "destructive"
      });
      setEtapaAtual('preview');
    }
  };

  const resetModal = () => {
    setArquivo(null);
    setDadosOFX(null);
    setBancoId(bancoSelecionado?.id.toString() || '');
    setEtapaAtual('selecao');
    setEstados({
      validandoArquivo: false,
      processandoOFX: false,
      uploadCompleto: false
    });
  };

  const handleClose = () => {
    if (etapaAtual !== 'uploading') {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 flex-shrink-0">
          <h2 className="text-2xl font-bold text-foreground">Importar Extrato OFX</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className={`flex items-center space-x-2 ${etapaAtual === 'selecao' ? 'text-blue-600' : etapaAtual === 'processando' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${etapaAtual === 'selecao' || etapaAtual === 'processando' ? 'border-blue-600 bg-blue-50' : 'border-green-600 bg-green-50'}`}>
                {etapaAtual === 'processando' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : etapaAtual === 'preview' || etapaAtual === 'uploading' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-bold">1</span>
                )}
              </div>
              <span className="text-sm font-medium">Selecionar arquivo</span>
            </div>
            
            <div className={`w-8 h-1 ${etapaAtual === 'preview' || etapaAtual === 'uploading' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            
            <div className={`flex items-center space-x-2 ${etapaAtual === 'preview' ? 'text-blue-600' : etapaAtual === 'uploading' ? 'text-blue-600' : etapaAtual === 'selecao' || etapaAtual === 'processando' ? 'text-gray-400' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${etapaAtual === 'preview' || etapaAtual === 'uploading' ? 'border-blue-600 bg-blue-50' : etapaAtual === 'selecao' || etapaAtual === 'processando' ? 'border-gray-300 bg-gray-50' : 'border-green-600 bg-green-50'}`}>
                {etapaAtual === 'uploading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : estados.uploadCompleto ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-bold">2</span>
                )}
              </div>
              <span className="text-sm font-medium">Importar dados</span>
            </div>
          </div>
          {/* Seleção de Banco */}
          <div>
            <Label htmlFor="banco">Banco de Destino *</Label>
            <Select value={bancoId} onValueChange={setBancoId}>
              <SelectTrigger className="input-base">
                <SelectValue placeholder="Selecione o banco..." />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20">
                {bancos.filter(b => b.suporta_ofx).map(banco => (
                  <SelectItem key={banco.id} value={banco.id.toString()}>
                    {banco.nome} - {banco.agencia} • {banco.conta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Área de Upload */}
          <div>
            <Label>Arquivo OFX *</Label>
            <div
              className={`mt-2 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              {arquivo ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <File className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{arquivo.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(arquivo.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setArquivo(null)}
                  >
                    Remover arquivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Arraste o arquivo OFX aqui
                    </p>
                    <p className="text-muted-foreground">ou clique para selecionar</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Selecionar Arquivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ofx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Estados de Processamento */}
          {etapaAtual === 'processando' && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Processando arquivo OFX</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  {estados.validandoArquivo && (
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Validando formato do arquivo...</span>
                    </div>
                  )}
                  {estados.processandoOFX && (
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Extraindo transações e saldos...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {etapaAtual === 'uploading' && (
            <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                {estados.uploadCompleto ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-purple-900 mb-2">
                  {estados.uploadCompleto ? 'Importação concluída!' : 'Importando dados...'}
                </h3>
                <p className="text-sm text-purple-700">
                  {estados.uploadCompleto 
                    ? 'Banco atualizado com sucesso' 
                    : 'Aguarde enquanto salvamos os dados no sistema'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Preview do Extrato */}
          {etapaAtual === 'preview' && dadosOFX && (
            <div className="bg-green-50/50 border border-green-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center space-x-2 text-green-700 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Arquivo OFX processado com sucesso</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dados do Banco */}
                {dadosOFX.dadosBanco && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-800">Dados do Banco</h4>
                    <div className="text-sm space-y-1">
                      {dadosOFX.dadosBanco.codigo && (
                        <p><span className="text-muted-foreground">Código:</span> {dadosOFX.dadosBanco.codigo}</p>
                      )}
                      {dadosOFX.dadosBanco.agencia && (
                        <p><span className="text-muted-foreground">Agência:</span> {dadosOFX.dadosBanco.agencia}</p>
                      )}
                      {dadosOFX.dadosBanco.conta && (
                        <p><span className="text-muted-foreground">Conta:</span> {dadosOFX.dadosBanco.conta}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Período */}
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800">Período do Extrato</h4>
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Data do saldo:</span> {formatarData(dadosOFX.dataSaldo.toISOString())}</p>
                    {dadosOFX.fitid && (
                      <p><span className="text-muted-foreground">ID do extrato:</span> {dadosOFX.fitid}</p>
                    )}
                  </div>
                </div>

                {/* Saldo */}
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800">Saldo</h4>
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Saldo final:</span> 
                      <span className={`font-medium ml-1 ${dadosOFX.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatarMoeda(dadosOFX.saldoFinal)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Transações */}
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800">Transações</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Total:</span> {dadosOFX.totalTransacoes} transações</p>
                    <p><span className="text-muted-foreground">Créditos:</span> {dadosOFX.transacoes.filter(t => t.tipo === 'credito').length}</p>
                    <p><span className="text-muted-foreground">Débitos:</span> {dadosOFX.transacoes.filter(t => t.tipo === 'debito').length}</p>
                  </div>
                </div>
              </div>

              {/* Lista de Transações (preview) */}
              {dadosOFX.transacoes.length > 0 && (
                <div className="mt-6 pt-4 border-t border-green-200">
                  <h4 className="font-medium text-green-800 mb-3">Últimas Transações (preview)</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {dadosOFX.transacoes.slice(0, 5).map((transacao, index) => (
                      <div key={index} className="flex justify-between items-center text-sm bg-white/50 rounded p-2">
                        <div>
                          <p className="font-medium">{transacao.descricao}</p>
                          <p className="text-muted-foreground">{formatarData(transacao.data.toISOString())}</p>
                        </div>
                        <span className={`font-medium ${transacao.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                          {transacao.tipo === 'credito' ? '+' : '-'}{formatarMoeda(transacao.valor)}
                        </span>
                      </div>
                    ))}
                    {dadosOFX.transacoes.length > 5 && (
                      <p className="text-center text-muted-foreground text-xs">
                        ... e mais {dadosOFX.transacoes.length - 5} transações
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validações */}
          {(etapaAtual === 'preview' && !bancoId) && (
            <div className="flex items-center space-x-2 text-amber-700 bg-amber-50/50 border border-amber-200 rounded-xl p-3">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">Selecione o banco de destino para continuar</span>
            </div>
          )}
        </div>

        {/* Footer Actions - Fixo */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center space-x-2">
              {etapaAtual === 'preview' && dadosOFX && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Arquivo processado - pronto para importar</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={etapaAtual === 'uploading'}
              >
                {etapaAtual === 'uploading' ? 'Aguarde...' : 'Cancelar'}
              </Button>
              
              {etapaAtual === 'preview' && (
                <Button 
                  onClick={handleUpload}
                  disabled={!arquivo || !bancoId || !dadosOFX}
                  className="btn-primary min-w-[140px]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Extrato
                </Button>
              )}
              
              {etapaAtual === 'uploading' && (
                <Button 
                  disabled
                  className="btn-primary min-w-[140px]"
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}