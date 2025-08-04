import React, { useState, useEffect } from 'react';
import { X, Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMigracaoVendedores } from '@/hooks/useMigracaoVendedores';

interface MigracaoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso?: () => void;
}

export const MigracaoModal: React.FC<MigracaoModalProps> = ({
  aberto,
  onFechar,
  onSucesso
}) => {
  const {
    loading,
    resultado,
    executarMigracao,
    verificarNecessidadeMigracao,
    limparResultado
  } = useMigracaoVendedores();

  const [etapa, setEtapa] = useState<'verificacao' | 'execucao' | 'resultado'>('verificacao');
  const [vendas_pendentes, setVendasPendentes] = useState(0);

  useEffect(() => {
    if (aberto) {
      verificarNecessidade();
    }
    return () => {
      if (!aberto) {
        limparResultado();
        setEtapa('verificacao');
      }
    };
  }, [aberto, verificarNecessidadeMigracao, limparResultado]);

  const verificarNecessidade = async () => {
    const pendentes = await verificarNecessidadeMigracao();
    setVendasPendentes(pendentes);
  };

  const handleExecutarMigracao = async () => {
    setEtapa('execucao');
    const sucesso = await executarMigracao();
    if (sucesso) {
      setEtapa('resultado');
      if (onSucesso) onSucesso();
    } else {
      setEtapa('verificacao');
    }
  };

  const handleFechar = () => {
    limparResultado();
    setEtapa('verificacao');
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Migração de Dados de Vendedores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Etapa 1: Verificação */}
          {etapa === 'verificacao' && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Esta ferramenta migra os dados de vendedor do campo texto (legado) 
                  para a nova estrutura com relacionamento por ID.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status da Migração</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Vendas pendentes de migração:</span>
                      <Badge variant={vendas_pendentes > 0 ? 'destructive' : 'default'}>
                        {vendas_pendentes} vendas
                      </Badge>
                    </div>

                    {vendas_pendentes > 0 ? (
                      <div className="space-y-3">
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Foram encontradas {vendas_pendentes} vendas com dados de vendedor 
                            no formato antigo que precisam ser migradas.
                          </AlertDescription>
                        </Alert>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-yellow-800 mb-2">O que será feito:</h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• Buscar vendas com campo "vendedor" preenchido</li>
                            <li>• Localizar vendedor correspondente pelo nome/código</li>
                            <li>• Atualizar campo "vendedor_id" com o ID correto</li>
                            <li>• Manter dados originais para auditoria</li>
                          </ul>
                        </div>

                        <Button 
                          onClick={handleExecutarMigracao}
                          className="w-full"
                          disabled={loading}
                        >
                          Executar Migração
                        </Button>
                      </div>
                    ) : (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          ✅ Todos os dados estão atualizados! Não há necessidade de migração.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Etapa 2: Execução */}
          {etapa === 'execucao' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="h-8 w-8 text-blue-600 animate-bounce" />
                </div>
                <h3 className="text-lg font-semibold">Executando Migração...</h3>
                <p className="text-gray-600">Por favor, aguarde enquanto processamos os dados</p>
              </div>

              <Progress value={loading ? 50 : 100} className="w-full" />

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  A migração está sendo executada no banco de dados. 
                  Não feche esta janela até a conclusão.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Etapa 3: Resultado */}
          {etapa === 'resultado' && resultado && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Migração Concluída!</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{resultado.migradas}</div>
                    <div className="text-sm text-green-700">Vendas Migradas</div>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{resultado.nao_migradas}</div>
                    <div className="text-sm text-yellow-700">Não Migradas</div>
                  </CardContent>
                </Card>
              </div>

              {resultado.detalhes && resultado.detalhes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalhes da Migração</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {resultado.detalhes.map((detalhe, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{detalhe.vendedor_nome}</p>
                            {detalhe.vendas_migradas && (
                              <p className="text-sm text-gray-600">
                                {detalhe.vendas_migradas} vendas migradas
                              </p>
                            )}
                          </div>
                          <Badge variant={detalhe.status === 'migrado' ? 'default' : 'secondary'}>
                            {detalhe.status === 'migrado' ? 'Migrado' : 'Não Encontrado'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={handleFechar} className="w-full">
                Concluir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};