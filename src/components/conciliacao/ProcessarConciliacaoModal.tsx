import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProcessamentoExtratoReal } from '@/hooks/useProcessamentoExtratoReal';
import { useMaquininhas } from '@/hooks/useMaquininhas';
import { formatarMoeda } from '@/utils/formatters';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle,
  Loader2,
  FileSpreadsheet,
  Database
} from 'lucide-react';

interface ProcessarConciliacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcessarConciliacaoModal({ open, onOpenChange }: ProcessarConciliacaoModalProps) {
  const { maquininhas } = useMaquininhas();
  const { 
    uploadArquivoVendas,
    uploadArquivoBancario,
    validarArquivoVendas,
    validarArquivoBancario,
    processarArquivos,
    progresso,
    loading,
    erros
  } = useProcessamentoExtratoReal();

  const [etapaAtual, setEtapaAtual] = useState<'selecao' | 'validacao' | 'processamento' | 'resultado'>('selecao');
  const [dadosProcessamento, setDadosProcessamento] = useState({
    maquininha_id: '',
    periodo: new Date().toISOString().slice(0, 7),
    arquivo_vendas: null as File | null,
    arquivo_bancario: null as File | null
  });
  const [validacaoResult, setValidacaoResult] = useState<{
    vendas: any;
    bancario: any;
  } | null>(null);
  const [processamentoResult, setProcessamentoResult] = useState<any>(null);

  const handleArquivoChange = (tipo: 'vendas' | 'bancario', file: File | null) => {
    setDadosProcessamento(prev => ({
      ...prev,
      [`arquivo_${tipo}`]: file
    }));
  };

  const handleValidar = async () => {
    if (!dadosProcessamento.arquivo_vendas || !dadosProcessamento.arquivo_bancario) {
      return;
    }

    setEtapaAtual('validacao');
    
    try {
      const resultadoVendas = await validarArquivoVendas(dadosProcessamento.arquivo_vendas);
      const resultadoBancario = await validarArquivoBancario(dadosProcessamento.arquivo_bancario);
      
      setValidacaoResult({
        vendas: resultadoVendas,
        bancario: resultadoBancario
      });
    } catch (error) {
      console.error('Erro na validação:', error);
    }
  };

  const handleProcessar = async () => {
    if (!dadosProcessamento.maquininha_id || !dadosProcessamento.arquivo_vendas || !dadosProcessamento.arquivo_bancario) {
      return;
    }

    setEtapaAtual('processamento');
    
    try {
      // Upload dos arquivos
      await uploadArquivoVendas(dadosProcessamento.arquivo_vendas);
      await uploadArquivoBancario(dadosProcessamento.arquivo_bancario);
      
      // Processar conciliação
      const resultado = await processarArquivos(dadosProcessamento.maquininha_id, dadosProcessamento.periodo);
      setProcessamentoResult(resultado);
      setEtapaAtual('resultado');
    } catch (error) {
      console.error('Erro no processamento:', error);
    }
  };

  const handleNovoProcessamento = () => {
    setEtapaAtual('selecao');
    setDadosProcessamento({
      maquininha_id: '',
      periodo: new Date().toISOString().slice(0, 7),
      arquivo_vendas: null,
      arquivo_bancario: null
    });
    setValidacaoResult(null);
    setProcessamentoResult(null);
  };

  const maquininhaSelecionada = maquininhas.find(m => m.id === dadosProcessamento.maquininha_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            Processar Extratos de Conciliação
          </DialogTitle>
          <DialogDescription>
            Faça upload e processamento de extratos de vendas e bancários para conciliação automática
          </DialogDescription>
        </DialogHeader>

        <Tabs value={etapaAtual} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100/80">
            <TabsTrigger value="selecao" disabled={etapaAtual !== 'selecao'}>
              1. Seleção
            </TabsTrigger>
            <TabsTrigger value="validacao" disabled={etapaAtual !== 'validacao'}>
              2. Validação
            </TabsTrigger>
            <TabsTrigger value="processamento" disabled={etapaAtual !== 'processamento'}>
              3. Processamento
            </TabsTrigger>
            <TabsTrigger value="resultado" disabled={etapaAtual !== 'resultado'}>
              4. Resultado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selecao" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="maquininha">Maquininha</Label>
                <Select value={dadosProcessamento.maquininha_id} onValueChange={(value) => 
                  setDadosProcessamento(prev => ({ ...prev, maquininha_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a maquininha" />
                  </SelectTrigger>
                  <SelectContent>
                    {maquininhas.map(maquininha => (
                      <SelectItem key={maquininha.id} value={maquininha.id}>
                        {maquininha.nome} ({maquininha.operadora})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="periodo">Período</Label>
                <Input
                  id="periodo"
                  type="month"
                  value={dadosProcessamento.periodo}
                  onChange={(e) => setDadosProcessamento(prev => ({ ...prev, periodo: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Arquivo de Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(e) => handleArquivoChange('vendas', e.target.files?.[0] || null)}
                    />
                    {dadosProcessamento.arquivo_vendas && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        {dadosProcessamento.arquivo_vendas.name}
                      </div>
                    )}
                    <p className="text-xs text-gray-600">
                      Formatos aceitos: CSV, XLSX
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Arquivo Bancário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept=".ofx,.csv"
                      onChange={(e) => handleArquivoChange('bancario', e.target.files?.[0] || null)}
                    />
                    {dadosProcessamento.arquivo_bancario && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        {dadosProcessamento.arquivo_bancario.name}
                      </div>
                    )}
                    <p className="text-xs text-gray-600">
                      Formatos aceitos: OFX, CSV
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleValidar}
                disabled={!dadosProcessamento.maquininha_id || !dadosProcessamento.arquivo_vendas || !dadosProcessamento.arquivo_bancario}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <FileText className="w-4 h-4 mr-2" />
                Validar Arquivos
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="validacao" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  <p>Validando arquivos...</p>
                </div>
              </div>
            ) : validacaoResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5" />
                        Arquivo de Vendas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {validacaoResult.vendas.valido ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-medium">
                            {validacaoResult.vendas.total_registros} registros encontrados
                          </span>
                        </div>
                        {validacaoResult.vendas.erros.map((erro, index) => (
                          <div key={index} className="text-sm text-red-600">
                            • {erro}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Arquivo Bancário
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {validacaoResult.bancario.valido ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-medium">
                            {validacaoResult.bancario.total_registros} registros encontrados
                          </span>
                        </div>
                        {validacaoResult.bancario.erros.map((erro, index) => (
                          <div key={index} className="text-sm text-red-600">
                            • {erro}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setEtapaAtual('selecao')}>
                    Voltar
                  </Button>
                  <Button
                    onClick={handleProcessar}
                    disabled={!validacaoResult.vendas.valido || !validacaoResult.bancario.valido}
                    className="bg-gradient-to-r from-green-600 to-blue-600"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Processar Conciliação
                  </Button>
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="processamento" className="space-y-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
                <h3 className="text-lg font-semibold">Processando Conciliação</h3>
                <p className="text-gray-600">
                  Executando matching automático e identificando divergências...
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resultado" className="space-y-6">
            {processamentoResult && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Processamento Concluído
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50/80 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {processamentoResult.vendas_processadas}
                        </div>
                        <div className="text-sm text-blue-700">Vendas Processadas</div>
                      </div>
                      <div className="text-center p-4 bg-green-50/80 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {processamentoResult.recebimentos_processados}
                        </div>
                        <div className="text-sm text-green-700">Recebimentos Processados</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50/80 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {processamentoResult.divergencias_encontradas}
                        </div>
                        <div className="text-sm text-orange-700">Divergências Encontradas</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50/80 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(((processamentoResult.vendas_processadas - processamentoResult.divergencias_encontradas) / processamentoResult.vendas_processadas) * 100)}%
                        </div>
                        <div className="text-sm text-purple-700">Taxa Conciliação</div>
                      </div>
                    </div>

                    {processamentoResult.erros.length > 0 && (
                      <div className="mt-4 p-4 bg-red-50/80 rounded-lg">
                        <h4 className="font-semibold text-red-700 mb-2">Erros Encontrados:</h4>
                        {processamentoResult.erros.map((erro, index) => (
                          <div key={index} className="text-sm text-red-600">
                            • {erro}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleNovoProcessamento}>
                    Novo Processamento
                  </Button>
                  <Button onClick={() => onOpenChange(false)}>
                    Finalizar
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}