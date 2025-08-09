import { useState, useEffect } from 'react';
import { banksService } from '@/services/banksService';
import { BankAccount } from '@/types/bank';
import { useErrorHandler } from './useErrorHandler';

export interface UseBankAccountsAllReturn {
  accounts: BankAccount[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBankAccountsAll(): UseBankAccountsAllReturn {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorHandler();

  const fetchAllAccounts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Buscar todos os bancos com suas contas
      const banks = await banksService.getBanks();
      const allAccounts: BankAccount[] = [];
      
      for (const bank of banks) {
        try {
          const bankAccounts = await banksService.getBankAccounts(bank.id);
          // Adicionar informações do banco para cada conta
          const accountsWithBank = bankAccounts.map(account => ({
            ...account,
            bank: {
              id: bank.id,
              name: bank.name
            }
          })) as any[];
          allAccounts.push(...accountsWithBank);
        } catch (err) {
          console.warn(`Erro ao buscar contas do banco ${bank.name}:`, err);
        }
      }
      
      setAccounts(allAccounts);
    } catch (err) {
      const appError = handleError(err, 'useBankAccountsAll.fetchAllAccounts');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAccounts();
  }, []);

  return {
    accounts,
    loading,
    error,
    refetch: fetchAllAccounts
  };
}