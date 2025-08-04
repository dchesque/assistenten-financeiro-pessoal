import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Settings } from 'lucide-react';
import { toast } from 'sonner';
import TabelaTaxas from './TabelaTaxas';
import { useTaxasMaquininha } from '@/hooks/useTaxasMaquininha';
import type { Maquininha, TaxaMaquininha } from '@/types/maquininha';
import { OPERADORAS } from '@/types/maquininha';

interface TaxasMaquininhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maquininha: Maquininha | null;
  modo?: 'editar' | 'visualizar';
}

export default function TaxasMaquininhaModal({ 
  open, 
  onOpenChange, 
  maquininha,
  modo = 'editar'
}: TaxasMaquininhaModalProps) {
  const { 
    loading, 
    salvando, 
    carregarTaxasMaquininha, 
    salvarTaxasMaquininha 
  } = useTaxasMaquininha();

  const [taxas, setTaxas] = useState<Omit<TaxaMaquininha, 'id' | 'maquininha_id'>[]>([]);

  // Carregar taxas quando o modal abrir
  useEffect(() => {
    if (open && maquininha?.id) {
      carregarTaxasMaquininha(maquininha.id).then(taxasCarregadas => {
        setTaxas(taxasCarregadas.map(taxa => ({
          bandeira: taxa.bandeira,
          tipo_transacao: taxa.tipo_transacao,
          parcelas_max: taxa.parcelas_max,
          taxa_percentual: taxa.taxa_percentual,
          taxa_fixa: taxa.taxa_fixa,
          ativo: taxa.ativo
        })));
      });
    }
  }, [open, maquininha?.id]);

  const handleSalvar = async () => {
    if (!maquininha?.id) return;

    try {
      await salvarTaxasMaquininha(maquininha.id, taxas);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar taxas:', error);
    }
  };

  const isReadOnly = modo === 'visualizar';

  if (!maquininha) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-600" />
            {isReadOnly ? 'Visualizar Taxas' : 'Gerenciar Taxas'} - {maquininha.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Maquininha */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Informações da Maquininha
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Operadora</p>
                  <p className="text-base font-semibold text-gray-900">
                    {OPERADORAS[maquininha.operadora]}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 font-medium">Código Estabelecimento</p>
                  <p className="text-base font-mono text-gray-900">
                    {maquininha.codigo_estabelecimento}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 font-medium">Banco Vinculado</p>
                  <p className="text-base font-semibold text-gray-900">
                    {maquininha.banco_nome}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 font-medium">Status</p>
                  <Badge variant={maquininha.ativo ? 'default' : 'secondary'}>
                    {maquininha.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Carregando taxas...</span>
            </div>
          )}

          {/* Tabela de Taxas */}
          {!loading && (
            <Card className="bg-white/50 border-white/20">
              <CardContent className="p-6">
                <TabelaTaxas
                  taxas={taxas}
                  onTaxasChange={setTaxas}
                  readonly={isReadOnly}
                />
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          {!isReadOnly && !loading && (
            <Card className="bg-blue-50/50 border-blue-200/50">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Instruções</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Configure uma taxa para cada combinação de bandeira e tipo de transação</p>
                  <p>• Para crédito parcelado, defina o número máximo de parcelas aceitas</p>
                  <p>• Taxa percentual é obrigatória, taxa fixa é opcional</p>
                  <p>• As taxas serão aplicadas automaticamente na conciliação</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            {isReadOnly ? 'Fechar' : 'Cancelar'}
          </Button>
          
          {!isReadOnly && (
            <Button 
              onClick={handleSalvar}
              disabled={salvando || loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Taxas
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}