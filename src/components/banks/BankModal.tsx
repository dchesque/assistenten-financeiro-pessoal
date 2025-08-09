import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Bank, BankType, BANK_TYPE_OPTIONS } from '@/types/bank';
import { formatCurrency } from '@/lib/formatacaoBrasileira';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Bank, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  bank?: Bank | null;
  loading?: boolean;
}

export function BankModal({ isOpen, onClose, onSave, bank, loading = false }: BankModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'banco' as BankType,
    initial_balance: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bank) {
      setFormData({
        name: bank.name,
        type: bank.type,
        initial_balance: bank.initial_balance
      });
    } else {
      setFormData({
        name: '',
        type: 'banco',
        initial_balance: 0
      });
    }
    setErrors({});
  }, [bank, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (formData.initial_balance < 0) {
      newErrors.initial_balance = 'Saldo inicial não pode ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleBalanceChange = (value: string) => {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '');
    // Converte vírgula para ponto para parseFloat
    const numericValue = parseFloat(cleanValue.replace(',', '.')) || 0;
    setFormData(prev => ({ ...prev, initial_balance: numericValue }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {bank ? 'Editar Banco' : 'Novo Banco'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Banco do Brasil"
              className={errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={formData.type} onValueChange={(value: BankType) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {BANK_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial_balance">Saldo Inicial</Label>
            <Input
              id="initial_balance"
              value={formatCurrency(formData.initial_balance)}
              onChange={(e) => handleBalanceChange(e.target.value)}
              placeholder="R$ 0,00"
              className={errors.initial_balance ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            />
            {errors.initial_balance && <p className="text-sm text-red-600">{errors.initial_balance}</p>}
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}