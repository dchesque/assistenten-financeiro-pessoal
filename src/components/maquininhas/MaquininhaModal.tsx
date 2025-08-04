import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, CreditCard, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useMaquininhas } from '@/hooks/useMaquininhas';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import TaxasMaquininhaModal from './TaxasMaquininhaModal';
import type { Maquininha } from '@/types/maquininha';
import { OPERADORAS } from '@/types/maquininha';

interface MaquininhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maquininha?: Maquininha | null;
  modo: 'criar' | 'editar' | 'visualizar';
}

export default function MaquininhaModal({ 
  open, 
  onOpenChange, 
  maquininha, 
  modo 
}: MaquininhaModalProps) {
  const { salvarMaquininha, atualizarMaquininha, loading } = useMaquininhas();
  const { bancos } = useBancosSupabase();
  
  const [formData, setFormData] = useState({
    nome: '',
    operadora: 'rede' as 'rede' | 'sipag',
    codigo_estabelecimento: '',
    banco_id: 0,
    ativo: true
  });

  const [salvando, setSalvando] = useState(false);
  const [taxasModalOpen, setTaxasModalOpen] = useState(false);

  useEffect(() => {
    if (maquininha && modo !== 'criar') {
      setFormData({
        nome: maquininha.nome,
        operadora: maquininha.operadora,
        codigo_estabelecimento: maquininha.codigo_estabelecimento,
        banco_id: maquininha.banco_id,
        ativo: maquininha.ativo
      });
    } else if (modo === 'criar') {
      setFormData({
        nome: '',
        operadora: 'rede',
        codigo_estabelecimento: '',
        banco_id: 0,
        ativo: true
      });
    }
  }, [maquininha, modo, open]);


  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      toast.error('Nome da maquininha é obrigatório');
      return false;
    }
    if (!formData.codigo_estabelecimento.trim()) {
      toast.error('Código do estabelecimento é obrigatório');
      return false;
    }
    if (!formData.banco_id) {
      toast.error('Banco é obrigatório');
      return false;
    }
    return true;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) return;

    try {
      setSalvando(true);
      
      const dadosMaquininha = {
        ...formData,
        banco_nome: bancos.find(b => b.id === formData.banco_id)?.nome || '',
        taxas: []
      };

      if (modo === 'criar') {
        await salvarMaquininha(dadosMaquininha);
      } else {
        await atualizarMaquininha(maquininha!.id, dadosMaquininha);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar maquininha:', error);
    } finally {
      setSalvando(false);
    }
  };

  const isReadOnly = modo === 'visualizar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-purple-600" />
            {modo === 'criar' ? 'Nova Maquininha' : 
             modo === 'editar' ? 'Editar Maquininha' : 'Visualizar Maquininha'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-white/50 border-white/20">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Maquininha *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Rede - Loja Principal"
                    className="bg-white/80"
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operadora">Operadora *</Label>
                  <Select 
                    value={formData.operadora} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, operadora: value as 'rede' | 'sipag' }))}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="bg-white/80">
                      <SelectValue placeholder="Selecione a operadora" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OPERADORAS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo">Código do Estabelecimento *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo_estabelecimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo_estabelecimento: e.target.value }))}
                    placeholder="Ex: EC123456789"
                    className="bg-white/80"
                    disabled={isReadOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banco">Banco Vinculado *</Label>
                  <Select 
                    value={formData.banco_id.toString()} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, banco_id: parseInt(value) }))}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="bg-white/80">
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {bancos.map((banco) => (
                        <SelectItem key={banco.id} value={banco.id.toString()}>
                          {banco.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                  disabled={isReadOnly}
                />
                <Label htmlFor="ativo">Maquininha ativa</Label>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Taxas */}
          {modo !== 'criar' && (
            <Card className="bg-white/50 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configuração de Taxas</h3>
                    <p className="text-sm text-gray-600">
                      Gerencie as taxas por bandeira e tipo de transação
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTaxasModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {isReadOnly ? 'Ver Taxas' : 'Gerenciar Taxas'}
                  </Button>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200/50">
                  <div className="flex items-center gap-3">
                    <Settings className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">
                        {maquininha?.taxas?.length ? 
                          `${maquininha.taxas.length} taxa(s) configurada(s)` : 
                          'Nenhuma taxa configurada'
                        }
                      </p>
                      <p className="text-sm text-blue-700">
                        Use o botão "Gerenciar Taxas" para configurar as taxas detalhadamente
                      </p>
                    </div>
                  </div>
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
              {modo === 'criar' ? 'Cadastrar' : 'Salvar Alterações'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Modal de Taxas */}
      <TaxasMaquininhaModal
        open={taxasModalOpen}
        onOpenChange={setTaxasModalOpen}
        maquininha={maquininha}
        modo={isReadOnly ? 'visualizar' : 'editar'}
      />
    </Dialog>
  );
}