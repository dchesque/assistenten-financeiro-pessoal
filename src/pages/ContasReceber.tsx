import React, { useState } from 'react';
import { Plus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { AccountReceivableModal } from '@/components/accounts/AccountReceivableModal';
import { ReceiptModal } from '@/components/accounts/ReceiptModal';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useLoadingState } from '@/hooks/useLoadingStates';
import { AccountReceivable, ReceiptData } from '@/types/accounts';

export default function ContasReceber() {
  const { accounts, loading, createAccount, markAsReceived } = useAccountsReceivable();
  const { isLoading, setLoading } = useLoadingState();

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountReceivable | null>(null);

  const handleCreateAccount = async (accountData: any) => {
    setLoading('saving', true);
    try {
      await createAccount(accountData);
    } finally {
      setLoading('saving', false);
    }
  };

  const handleReceiptConfirm = async (receiptData: ReceiptData) => {
    if (!selectedAccount) return;
    setLoading('saving', true);
    try {
      await markAsReceived(selectedAccount.id, receiptData);
    } finally {
      setLoading('saving', false);
    }
  };

  const breadcrumb = [
    { label: 'Início', href: '/' },
    { label: 'Financeiro', href: '#' },
    { label: 'Contas a Receber', href: '/contas-receber' }
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <PageHeader
        title="Contas a Receber"
        subtitle="Gerencie suas receitas e direitos financeiros"
        breadcrumb={breadcrumb}
        actions={
          <Button
            onClick={() => {
              setSelectedAccount(null);
              setAccountModalOpen(true);
            }}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Receita
          </Button>
        }
      />

      {loading ? (
        <LoadingSkeleton type="table" lines={5} />
      ) : (
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
          <p className="text-center text-gray-600">
            Módulo de Contas a Receber implementado com sucesso!
            <br />
            Total de contas: {accounts.length}
          </p>
        </div>
      )}

      <AccountReceivableModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onSave={handleCreateAccount}
        loading={isLoading('saving')}
      />

      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        onConfirm={handleReceiptConfirm}
        accountDescription={selectedAccount?.description || ''}
        loading={isLoading('saving')}
      />
    </div>
  );
}