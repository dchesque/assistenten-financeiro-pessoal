import { supabase } from '@/integrations/supabase/client';
import { Transaction, CreateTransaction, UpdateTransaction, TransactionFilters } from '@/types/transaction';

export const transactionsService = {
  async getAll(filters?: TransactionFilters): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        from_account:bank_accounts!transactions_from_account_id_fkey(
          id,
          agency,
          account_number,
          bank:banks(name)
        ),
        to_account:bank_accounts!transactions_to_account_id_fkey(
          id,
          agency,
          account_number,
          bank:banks(name)
        ),
        accounts_payable(id, description),
        accounts_receivable(id, description)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters?.search) {
      query = query.or(`description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    if (filters?.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters?.account_id && filters.account_id !== 'all') {
      query = query.or(`from_account_id.eq.${filters.account_id},to_account_id.eq.${filters.account_id}`);
    }

    if (filters?.date_start) {
      query = query.gte('date', filters.date_start);
    }

    if (filters?.date_end) {
      query = query.lte('date', filters.date_end);
    }

    if (filters?.amount_min) {
      query = query.gte('amount', filters.amount_min);
    }

    if (filters?.amount_max) {
      query = query.lte('amount', filters.amount_max);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar transações:', error);
      throw new Error('Erro ao carregar transações');
    }

    return data || [];
  },

  async getById(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        from_account:bank_accounts!transactions_from_account_id_fkey(
          id,
          agency,
          account_number,
          bank:banks(name)
        ),
        to_account:bank_accounts!transactions_to_account_id_fkey(
          id,
          agency,
          account_number,
          bank:banks(name)
        ),
        accounts_payable(id, description),
        accounts_receivable(id, description)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar transação:', error);
      throw new Error('Erro ao carregar transação');
    }

    return data;
  },

  async create(transaction: CreateTransaction): Promise<Transaction> {
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        user_id: userData.user.id
      })
      .select(`
        *,
        from_account:bank_accounts!transactions_from_account_id_fkey(
          id,
          agency,
          account_number,
          bank:banks(name)
        ),
        to_account:bank_accounts!transactions_to_account_id_fkey(
          id,
          agency,
          account_number,
          bank:banks(name)
        ),
        accounts_payable(id, description),
        accounts_receivable(id, description)
      `)
      .single();

    if (error) {
      console.error('Erro ao criar transação:', error);
      throw new Error('Erro ao criar transação');
    }

    return data;
  },

  async update(id: string, updates: Partial<UpdateTransaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        from_account:bank_accounts!transactions_from_account_id_fkey(
          id,
          agency,
          account_number,
          bank:banks(name)
        ),
        to_account:bank_accounts!transactions_to_account_id_fkey(
          id,
          agency,
          account_number,
          bank:banks(name)
        ),
        accounts_payable(id, description),
        accounts_receivable(id, description)
      `)
      .single();

    if (error) {
      console.error('Erro ao atualizar transação:', error);
      throw new Error('Erro ao atualizar transação');
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir transação:', error);
      throw new Error('Erro ao excluir transação');
    }
  },

  async getStatistics() {
    const { data, error } = await supabase
      .from('transactions')
      .select('type, amount')
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Erro ao carregar estatísticas');
    }

    const income = data?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const expense = data?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const transfer = data?.filter(t => t.type === 'transfer').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    return {
      total: data?.length || 0,
      income,
      expense,
      transfer,
      balance: income - expense
    };
  }
};