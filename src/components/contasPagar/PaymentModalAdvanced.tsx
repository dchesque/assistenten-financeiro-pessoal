import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, Percent } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useBanks } from '@/hooks/useBanks';

interface PaymentModalAdvancedProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: any) => Promise<void>;
  conta: {
    id: string;
    description: string;
    amount: number;
    due_date: string;
  } | null;
  loading?: boolean;
}

export function PaymentModalAdvanced({ 
  isOpen, 
  onClose, 
  onConfirm, 
  conta, 
  loading = false 
}: PaymentModalAdvancedProps) {
  const { banks } = useBanks();
  
  const [formData, setFormData] = useState({
    bank_account_id: '',
    paid_at: new Date().toISOString().split('T')[0],
    percentual_juros: 0,
    valor_juros: 0,
    percentual_desconto: 0,
    valor_desconto: 0,
    observacoes_pagamento: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculationType, setCalculationType] = useState<'juros' | 'desconto'>('juros');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && conta) {
      setFormData({
        bank_account_id: '',
        paid_at: new Date().toISOString().split('T')[0],
        percentual_juros: 0,
        valor_juros: 0,
        percentual_desconto: 0,
        valor_desconto: 0,
        observacoes_pagamento: ''
      });
      setErrors({});
    }
  }, [isOpen, conta]);

  if (!conta) return null;

  // Get all bank accounts from all banks
  const allBankAccounts = banks.flatMap(bank => 
    bank.accounts.map(account => ({
      ...account,
      bank_name: bank.name
    }))
  );

  // Cálculos automáticos
  const valorOriginal = conta.amount;
  const valorJuros = formData.valor_juros || (valorOriginal * formData.percentual_juros / 100);
  const valorDesconto = formData.valor_desconto || (valorOriginal * formData.percentual_desconto / 100);
  const valorFinal = valorOriginal + valorJuros - valorDesconto;

  const handlePercentualJurosChange = (value: string) => {
    const percentual = parseFloat(value) || 0;
    const valor = valorOriginal * percentual / 100;
    setFormData(prev => ({ 
      ...prev, 
      percentual_juros: percentual,
      valor_juros: valor,
      // Limpar desconto quando aplicar juros
      percentual_desconto: 0,
      valor_desconto: 0
    }));
  };

  const handleValorJurosChange = (value: string) => {
    const valor = parseFloat(value) || 0;
    const percentual = valorOriginal > 0 ? (valor / valorOriginal) * 100 : 0;
    setFormData(prev => ({ 
      ...prev, 
      valor_juros: valor,
      percentual_juros: percentual,
      // Limpar desconto quando aplicar juros
      percentual_desconto: 0,
      valor_desconto: 0
    }));
  };

  const handlePercentualDescontoChange = (value: string) => {
    const percentual = parseFloat(value) || 0;
    const valor = valorOriginal * percentual / 100;
    setFormData(prev => ({ 
      ...prev, 
      percentual_desconto: percentual,
      valor_desconto: valor,
      // Limpar juros quando aplicar desconto
      percentual_juros: 0,
      valor_juros: 0
    }));
  };

  const handleValorDescontoChange = (value: string) => {
    const valor = parseFloat(value) || 0;
    const percentual = valorOriginal > 0 ? (valor / valorOriginal) * 100 : 0;
    setFormData(prev => ({ 
      ...prev, 
      valor_desconto: valor,
      percentual_desconto: percentual,
      // Limpar juros quando aplicar desconto
      percentual_juros: 0,
      valor_juros: 0
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bank_account_id) {
      newErrors.bank_account_id = 'Conta bancária é obrigatória';
    }

    if (!formData.paid_at) {
      newErrors.paid_at = 'Data de pagamento é obrigatória';
    }

    if (valorFinal <= 0) {
      newErrors.valor_final = 'Valor final deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const paymentData = {
        ...formData,
        valor_original: valorOriginal,
        valor_juros: valorJuros,
        valor_desconto: valorDesconto,
        valor_final: valorFinal
      };
      
      await onConfirm(paymentData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Confirmar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-blue-50/80 rounded-lg border border-blue-200/50">
          <h4 className="font-medium text-blue-900 mb-2">Detalhes da Conta</h4>
          <p className="text-sm text-blue-800 mb-1">
            <strong>Descrição:</strong> {conta.description}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Valor Original:</strong> {formatCurrency(valorOriginal)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Conta Bancária e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_account_id">Conta Bancária *</Label>
              <Select 
                value={formData.bank_account_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account_id: value }))}
              >
                <SelectTrigger className={errors.bank_account_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {allBankAccounts.length === 0 ? (
                  <SelectItem value="nenhuma" disabled>
                    Nenhuma conta cadastrada
                  </SelectItem>
                  ) : (
                    allBankAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{account.bank_name}</span>
                          <span className="text-sm text-gray-500">
                            {account.agency && account.account_number 
                              ? `Ag: ${account.agency} | CC: ${account.account_number}`
                              : account.pix_key 
                              ? `PIX: ${account.pix_key}`
                              : 'Conta bancária'}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.bank_account_id && <p className="text-sm text-red-600">{errors.bank_account_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_at">Data de Pagamento *</Label>
              <Input
                id="paid_at"
                type="date"
                value={formData.paid_at}
                onChange={(e) => setFormData(prev => ({ ...prev, paid_at: e.target.value }))}
                className={errors.paid_at ? 'border-red-500' : ''}
              />
              {errors.paid_at && <p className="text-sm text-red-600">{errors.paid_at}</p>}
            </div>
          </div>

          <Separator />

          {/* Juros e Descontos */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ajustes de Valor
            </h4>

            {/* Tipo de Cálculo */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={calculationType === 'juros' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalculationType('juros')}
                className="flex items-center gap-1"
              >
                <Percent className="w-3 h-3" />
                Aplicar Juros
              </Button>
              <Button
                type="button"
                variant={calculationType === 'desconto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalculationType('desconto')}
                className="flex items-center gap-1"
              >
                <Percent className="w-3 h-3" />
                Aplicar Desconto
              </Button>
            </div>

            {calculationType === 'juros' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-red-50/30 rounded-lg border border-red-200/50">
                <div className="space-y-2">
                  <Label>Juros (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.percentual_juros}
                    onChange={(e) => handlePercentualJurosChange(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor dos Juros (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_juros}
                    onChange={(e) => handleValorJurosChange(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
            )}

            {calculationType === 'desconto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50/30 rounded-lg border border-green-200/50">
                <div className="space-y-2">
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.percentual_desconto}
                    onChange={(e) => handlePercentualDescontoChange(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor do Desconto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_desconto}
                    onChange={(e) => handleValorDescontoChange(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Resumo do Pagamento */}
          <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-200/50">
            <h4 className="font-medium text-gray-900 mb-3">Resumo do Pagamento</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Valor Original:</span>
                <span className="font-medium">{formatCurrency(valorOriginal)}</span>
              </div>
              {valorJuros > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>+ Juros ({formData.percentual_juros.toFixed(2)}%):</span>
                  <span className="font-medium">+{formatCurrency(valorJuros)}</span>
                </div>
              )}
              {valorDesconto > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>- Desconto ({formData.percentual_desconto.toFixed(2)}%):</span>
                  <span className="font-medium">-{formatCurrency(valorDesconto)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Valor Final:</span>
                <span className={valorFinal !== valorOriginal ? 'text-primary' : ''}>
                  {formatCurrency(valorFinal)}
                </span>
              </div>
            </div>
            {errors.valor_final && <p className="text-sm text-red-600 mt-2">{errors.valor_final}</p>}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações do Pagamento</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes_pagamento}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes_pagamento: e.target.value }))}
              placeholder="Adicione observações sobre este pagamento..."
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {loading ? 'Processando...' : `Confirmar Pagamento - ${formatCurrency(valorFinal)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}