import { useState, useEffect } from 'react';
import { Building2, CreditCard } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBancos } from '@/hooks/useBancos';
import { useBankAccounts } from '@/hooks/useBankAccounts';

interface BankAccountSelectorProps {
  value?: { banco_id?: string; conta_id?: string };
  onChange: (dados: { banco_id?: string; conta_id?: string }) => void;
  className?: string;
  disabled?: boolean;
}

export function BankAccountSelector({ 
  value, 
  onChange, 
  className = "",
  disabled = false
}: BankAccountSelectorProps) {
  const { bancos } = useBancos();
  const { bankAccounts } = useBankAccounts();
  
  // Filtrar contas do banco selecionado
  const contasDisponiveis = value?.banco_id 
    ? bankAccounts.filter(conta => conta.bank_id === value.banco_id)
    : [];

  const handleBancoChange = (bancoId: string) => {
    onChange({
      banco_id: bancoId,
      conta_id: undefined // Limpar conta quando banco muda
    });
  };

  const handleContaChange = (contaId: string) => {
    onChange({
      ...value,
      conta_id: contaId
    });
  };

  const bancoSelecionado = bancos.find(b => b.id === value?.banco_id);
  const contaSelecionada = bankAccounts.find(c => c.id === value?.conta_id);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Seletor de Banco */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Banco <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={value?.banco_id || ''} 
          onValueChange={handleBancoChange}
          disabled={disabled}
        >
          <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
            <SelectValue placeholder="Selecionar banco">
              {bancoSelecionado && (
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>{bancoSelecionado.name}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 shadow-lg">
            {bancos.filter(b => !b.deleted_at).map((banco) => (
              <SelectItem key={banco.id} value={banco.id}>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>{banco.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Seletor de Conta Bancária */}
      {value?.banco_id && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Conta Bancária <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={value?.conta_id || ''} 
            onValueChange={handleContaChange}
            disabled={disabled || contasDisponiveis.length === 0}
          >
            <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
              <SelectValue placeholder="Selecionar conta">
                {contaSelecionada && (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <span>
                      Ag: {contaSelecionada.agency} - CC: {contaSelecionada.account_number}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-lg">
              {contasDisponiveis.map((conta) => (
                <SelectItem key={conta.id} value={conta.id}>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <span>
                      Ag: {conta.agency} - CC: {conta.account_number}
                      {conta.pix_key && ` - PIX: ${conta.pix_key.slice(0, 10)}...`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {contasDisponiveis.length === 0 && value?.banco_id && (
            <p className="text-sm text-amber-600">
              Nenhuma conta cadastrada para este banco. Cadastre uma conta primeiro.
            </p>
          )}
        </div>
      )}
    </div>
  );
}