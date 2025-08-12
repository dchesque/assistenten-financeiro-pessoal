import { supabase } from '@/integrations/supabase/client';
import { AccountReceivable, ReceiptData } from '@/types/accounts';

export const accountsReceivableService = {
  async getAccountsReceivable(): Promise<AccountReceivable[]> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select(`
        *,
        category:categories(id, name, color),
        bank_account:bank_accounts(
          id,
          agency,
          account_number,
          bank:banks(name)
        )
      `)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAccountReceivableById(id: string): Promise<AccountReceivable | null> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select(`
        *,
        category:categories(id, name, color),
        bank_account:bank_accounts(
          id,
          agency,
          account_number,
          bank:banks(name)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createAccountReceivable(
    account: Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at' | 'user_id'>
  ): Promise<AccountReceivable> {
    console.log('Creating account receivable:', account);
    
    // Update status based on due date
    const today = new Date().toISOString().split('T')[0];
    const status = account.due_date < today ? 'overdue' : account.status;

    const { data, error } = await supabase
      .from('accounts_receivable')
      .insert([{ ...account, status }])
      .select(`
        *,
        category:categories(id, name, color),
        bank_account:bank_accounts(
          id,
          agency,
          account_number,
          bank:banks(name)
        )
      `)
      .single();

    if (error) {
      console.error('Error creating account receivable:', error);
      throw error;
    }
    return data;
  },

  async updateAccountReceivable(
    id: string,
    updates: Partial<Omit<AccountReceivable, 'id' | 'created_at' | 'updated_at' | 'user_id'>>
  ): Promise<AccountReceivable> {
    // Update status based on due date if due_date is being updated
    if (updates.due_date && updates.status === 'pending') {
      const today = new Date().toISOString().split('T')[0];
      updates.status = updates.due_date < today ? 'overdue' : 'pending';
    }

    const { data, error } = await supabase
      .from('accounts_receivable')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, color),
        bank_account:bank_accounts(
          id,
          agency,
          account_number,
          bank:banks(name)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async markAsReceived(id: string, receiptData: ReceiptData): Promise<AccountReceivable> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .update({
        status: 'received',
        bank_account_id: receiptData.bank_account_id,
        received_at: receiptData.received_at
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, color),
        bank_account:bank_accounts(
          id,
          agency,
          account_number,
          bank:banks(name)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAccountReceivable(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Utility method to update overdue accounts
  async updateOverdueAccounts(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('accounts_receivable')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', today);

    if (error) throw error;
  }
};