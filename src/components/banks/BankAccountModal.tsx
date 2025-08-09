import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BankAccount } from '@/types/bank';
import { MaskedInput } from '@/components/ui/MaskedInput';

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  bankId: string;
  account?: BankAccount | null;
  loading?: boolean;
}

export function BankAccountModal({ 
  isOpen, 
  onClose, 
  onSave, 
  bankId, 
  account, 
  loading = false 
}: BankAccountModalProps) {
  const [formData, setFormData] = useState({
    bank_id: bankId,
    agency: '',
    account_number: '',
    pix_key: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        bank_id: account.bank_id,
        agency: account.agency || '',
        account_number: account.account_number || '',
        pix_key: account.pix_key || ''
      });
    } else {
      setFormData({
        bank_id: bankId,
        agency: '',
        account_number: '',
        pix_key: ''
      });
    }
    setErrors({});
  }, [account, bankId, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Pelo menos um campo deve ser preenchido
    if (!formData.agency.trim() && !formData.account_number.trim() && !formData.pix_key.trim()) {
      newErrors.general = 'Preencha pelo menos um dos campos: Agência, Conta ou PIX';
    }

    // Se agência for preenchida, conta também deve ser
    if (formData.agency.trim() && !formData.account_number.trim()) {
      newErrors.account_number = 'Conta é obrigatória quando agência é informada';
    }

    // Se conta for preenchida, agência também deve ser
    if (formData.account_number.trim() && !formData.agency.trim()) {
      newErrors.agency = 'Agência é obrigatória quando conta é informada';
    }

    // Validação básica de PIX (email ou CPF/CNPJ ou telefone)
    if (formData.pix_key.trim()) {
      const pixKey = formData.pix_key.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey);
      const isCPF = /^\d{11}$/.test(pixKey.replace(/\D/g, ''));
      const isCNPJ = /^\d{14}$/.test(pixKey.replace(/\D/g, ''));
      const isPhone = /^\d{10,11}$/.test(pixKey.replace(/\D/g, ''));
      
      if (!isEmail && !isCPF && !isCNPJ && !isPhone) {
        newErrors.pix_key = 'PIX deve ser um email, CPF, CNPJ ou telefone válido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Limpar campos vazios antes de enviar
      const dataToSave = {
        bank_id: formData.bank_id,
        agency: formData.agency.trim() || undefined,
        account_number: formData.account_number.trim() || undefined,
        pix_key: formData.pix_key.trim() || undefined
      };

      console.log('🔧 BankAccountModal - Enviando dados:', dataToSave);
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('❌ Erro no modal ao salvar conta:', error);
      // Error handling is done in the parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {account ? 'Editar Conta' : 'Nova Conta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agency">Agência</Label>
              <Input
                id="agency"
                value={formData.agency}
                onChange={(e) => setFormData(prev => ({ ...prev, agency: e.target.value }))}
                placeholder="1234-5"
                className={errors.agency ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.agency && <p className="text-sm text-red-600">{errors.agency}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Conta</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                placeholder="12345-6"
                className={errors.account_number ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.account_number && <p className="text-sm text-red-600">{errors.account_number}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX</Label>
            <Input
              id="pix_key"
              value={formData.pix_key}
              onChange={(e) => setFormData(prev => ({ ...prev, pix_key: e.target.value }))}
              placeholder="email@exemplo.com ou CPF/CNPJ ou telefone"
              className={errors.pix_key ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            />
            {errors.pix_key && <p className="text-sm text-red-600">{errors.pix_key}</p>}
            <p className="text-xs text-gray-500">
              Informe sua chave PIX (email, CPF, CNPJ ou telefone)
            </p>
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