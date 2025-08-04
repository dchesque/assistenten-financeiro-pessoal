import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { useMaquininhas } from '@/hooks/useMaquininhas';
import { useProcessamentoExtrato } from '@/hooks/useProcessamentoExtrato';
import { ProcessarConciliacaoModal } from '@/components/conciliacao/ProcessarConciliacaoModal';
import { Upload, FileText, CheckCircle, AlertCircle, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function UploadExtratos() {
  const { maquininhas } = useMaquininhas();
  const { uploadArquivoVendas, uploadArquivoBancario, loading } = useProcessamentoExtrato();
  const [periodoSelecionado, setPeriodoSelecionado] = useState('2025-01');
  const [uploads, setUploads] = useState<Record<string, {
    vendas?: File;
    bancario?: File;
    processando?: boolean;
    progresso?: number;
  }>>({});
  const [modalProcessamento, setModalProcessamento] = useState(false);

  const handleFileUpload = (maquininhaId: string, tipo: 'vendas' | 'bancario', file: File) => {
    setUploads(prev => ({
      ...prev,
      [maquininhaId]: {
        ...prev[maquininhaId],
        [tipo]: file
      }
    }));
  };

  const handleProcessar = async (maquininhaId: string) => {
    const upload = uploads[maquininhaId];
    if (!upload?.vendas || !upload?.bancario) {
      toast.error('Selecione ambos os arquivos para processar');
      return;
    }

    setUploads(prev => ({
      ...prev,
      [maquininhaId]: {
        ...prev[maquininhaId],
        processando: true,
        progresso: 0
      }
    }));

    // Simular progresso
    const interval = setInterval(() => {
      setUploads(prev => ({
        ...prev,
        [maquininhaId]: {
          ...prev[maquininhaId],
          progresso: Math.min((prev[maquininhaId]?.progresso || 0) + 10, 90)
        }
      }));
    }, 300);

    try {
      await uploadArquivoVendas(upload.vendas, maquininhaId, periodoSelecionado);
      await uploadArquivoBancario(upload.bancario, maquininhaId, periodoSelecionado);

      clearInterval(interval);
      setUploads(prev => ({
        ...prev,
        [maquininhaId]: {
          ...prev[maquininhaId],
          processando: false,
          progresso: 100
        }
      }));

      setTimeout(() => {
        setUploads(prev => ({
          ...prev,
          [maquininhaId]: {}
        }));
      }, 3000);

    } catch (error) {
      clearInterval(interval);
      setUploads(prev => ({
        ...prev,
        [maquininhaId]: {
          ...prev[maquininhaId],
          processando: false,
          progresso: 0
        }
      }));
    }
  };

  const DropZone = ({ 
    title, 
    accept, 
    onFileSelect, 
    file,
    icon: Icon = FileText
  }: {
    title: string;
    accept: string;
    onFileSelect: (file: File) => void;
    file?: File;
    icon?: any;
  }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50/50 hover:bg-gray-50/80 transition-all duration-200">
      <Icon className="w-8 h-8 mx-auto mb-3 text-gray-400" />
      <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
      {file ? (
        <div className="flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">{file.name}</span>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Arraste o arquivo ou clique para selecionar
          </p>
          <Input
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
            className="hidden"
            id={`file-${title}`}
          />
          <Label
            htmlFor={`file-${title}`}
            className="cursor-pointer bg-white/80 border border-gray-300 rounded-lg px-4 py-2 text-sm hover:bg-white transition-colors"
          >
            Selecionar Arquivo
          </Label>
        </>
      )}
    </div>
  );

  const MaquininhaUploadCard = ({ maquininha }: { maquininha: any }) => {
    const upload = uploads[maquininha.id] || {};
    const podeProcessar = upload.vendas && upload.bancario && !upload.processando;
    const processando = upload.processando;

    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                maquininha.operadora === 'rede' 
                  ? 'bg-red-100 text-red-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{maquininha.nome}</h3>
                <p className="text-sm text-gray-600">{maquininha.operadora.toUpperCase()}</p>
              </div>
            </div>
            <Badge className="bg-blue-100/80 text-blue-700">
              {maquininha.banco_nome}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DropZone
              title="Extrato de Vendas"
              accept=".csv,.xlsx"
              file={upload.vendas}
              onFileSelect={(file) => handleFileUpload(maquininha.id, 'vendas', file)}
              icon={FileText}
            />

            <DropZone
              title="Extrato Bancário"
              accept=".ofx,.csv"
              file={upload.bancario}
              onFileSelect={(file) => handleFileUpload(maquininha.id, 'bancario', file)}
              icon={FileText}
            />
          </div>

          {processando && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Processando conciliação...</span>
                <span className="text-blue-600">{upload.progresso}%</span>
              </div>
              <Progress value={upload.progresso} className="h-2" />
            </div>
          )}

          <Button
            onClick={() => handleProcessar(maquininha.id)}
            disabled={!podeProcessar}
            className={`w-full ${
              podeProcessar 
                ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {processando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Processando...
              </>
            ) : upload.progresso === 100 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Conciliado com Sucesso!
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Processar Conciliação
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl"></div>
      </div>

      <PageHeader
        breadcrumb={createBreadcrumb('/upload-extratos')}
        title="Upload de Extratos"
        subtitle="Faça upload dos extratos para conciliação automática • Processamento inteligente"
        actions={
          <Button 
            onClick={() => setModalProcessamento(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Processamento Avançado
          </Button>
        }
      />

      <div className="relative p-4 lg:p-8">

        {/* Seletor de Período */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 mb-8 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <Label htmlFor="periodo" className="text-lg font-medium text-gray-900">
                Período para Conciliação:
              </Label>
              <Input
                id="periodo"
                type="month"
                value={periodoSelecionado}
                onChange={(e) => setPeriodoSelecionado(e.target.value)}
                className="w-40 bg-white/80 border-gray-300/50"
              />
              <Badge className="bg-blue-100/80 text-blue-700">
                {new Date(periodoSelecionado + '-01').toLocaleDateString('pt-BR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Maquininhas */}
        {maquininhas.filter(m => m.ativo).length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {maquininhas
              .filter(m => m.ativo)
              .map((maquininha) => (
                <MaquininhaUploadCard key={maquininha.id} maquininha={maquininha} />
              ))
            }
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma maquininha ativa
              </h3>
              <p className="text-gray-600 mb-6">
                Você precisa ter pelo menos uma maquininha ativa para fazer upload de extratos.
              </p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <CreditCard className="w-4 h-4 mr-2" />
                Cadastrar Maquininha
              </Button>
            </CardContent>
          </Card>
        )}

        <ProcessarConciliacaoModal 
          open={modalProcessamento}
          onOpenChange={setModalProcessamento}
        />
      </div>
    </div>
  );
}