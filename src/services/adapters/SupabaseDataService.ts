import { supabase } from '@/integrations/supabase/client';
import type { IDataService, User, Session, DashboardSummary } from '@/services/interfaces/IDataService';

export class SupabaseDataService implements IDataService {
  
  // ============ AUTH ============
  auth = {
    signIn: async (email: string, password: string): Promise<Session> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
          phone: data.user.phone,
          created_at: data.user.created_at
        },
        access_token: data.session?.access_token || '',
        refresh_token: data.session?.refresh_token || '',
        expires_at: data.session?.expires_at || 0
      };
    },

    signUp: async (email: string, password: string, userData?: any): Promise<User> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      
      return {
        id: data.user?.id || '',
        email: data.user?.email || '',
        name: userData?.name,
        phone: userData?.phone,
        created_at: data.user?.created_at
      };
    },

    signOut: async (): Promise<void> => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },

    verifyOTP: async (email: string, token: string): Promise<Session> => {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      
      if (error) throw error;
      
      return {
        user: {
          id: data.user?.id || '',
          email: data.user?.email || '',
          name: data.user?.user_metadata?.name,
          phone: data.user?.phone,
          created_at: data.user?.created_at
        },
        access_token: data.session?.access_token || '',
        refresh_token: data.session?.refresh_token || '',
        expires_at: data.session?.expires_at || 0
      };
    },

    resendOTP: async (email: string): Promise<void> => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      if (error) throw error;
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
      const { data: updatedUser, error } = await supabase.auth.updateUser({
        data: {
          name: data.name,
          phone: data.phone
        }
      });
      
      if (error) throw error;
      
      return {
        id: updatedUser.user.id,
        email: updatedUser.user.email || '',
        name: data.name || updatedUser.user.user_metadata?.name,
        phone: data.phone || updatedUser.user.phone,
        created_at: updatedUser.user.created_at
      };
    },

    getCurrentUser: async (): Promise<User | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name,
        phone: user.phone,
        created_at: user.created_at
      };
    }
  };

  // ============ CONTAS A PAGAR ============
  contasPagar = {
    getAll: async (filtros?: any): Promise<any[]> => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .is('deleted_at', null)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },

    getById: async (id: string): Promise<any> => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    create: async (data: any): Promise<any> => {
      // Mapear campos do ContaPagar para accounts_payable
      const mappedData = {
        description: data.descricao,
        amount: data.valor_original || data.valor_final,
        due_date: data.data_vencimento,
        status: data.status === 'pendente' ? 'pending' : 
                data.status === 'pago' ? 'paid' : 
                data.status === 'vencido' ? 'overdue' : 'pending',
        notes: data.observacoes,
        contact_id: data.fornecedor_id,
        supplier_id: data.fornecedor_id, 
        category_id: data.plano_conta_id,
        bank_account_id: data.banco_id,
        paid_at: data.data_pagamento,
        user_id: data.user_id
      };

      console.log('🔥 Dados mapeados para inserção:', mappedData);

      const { data: result, error } = await supabase
        .from('accounts_payable')
        .insert([mappedData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao inserir conta:', error);
        throw error;
      }
      
      console.log('✅ Conta criada:', result);
      return result;
    },

    update: async (id: string, data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('accounts_payable')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('accounts_payable')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },

    getByVencimento: async (dataInicio: string, dataFim: string): Promise<any[]> => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .gte('due_date', dataInicio)
        .lte('due_date', dataFim)
        .is('deleted_at', null);
      
      if (error) throw error;
      return data || [];
    },

    getByStatus: async (status: string): Promise<any[]> => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .eq('status', status)
        .is('deleted_at', null);
      
      if (error) throw error;
      return data || [];
    },

    marcarComoPaga: async (id: string, dados: any): Promise<any> => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .update({
          status: 'paid',
          paid_at: dados.dataPagamento
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  };

  // ============ CONTAS A RECEBER ============
  contasReceber = {
    getAll: async (filtros?: any): Promise<any[]> => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .is('deleted_at', null)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },

    getById: async (id: string): Promise<any | null> => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    create: async (data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('accounts_receivable')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    update: async (id: string, data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('accounts_receivable')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },

    getByVencimento: async (dataInicio: string, dataFim: string): Promise<any[]> => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .gte('due_date', dataInicio)
        .lte('due_date', dataFim)
        .is('deleted_at', null);
      
      if (error) throw error;
      return data || [];
    },

    getByStatus: async (status: string): Promise<any[]> => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .eq('status', status)
        .is('deleted_at', null);
      
      if (error) throw error;
      return data || [];
    },

    marcarComoRecebida: async (id: string, dataRecebimento: string, valorRecebido?: number): Promise<any> => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .update({
          status: 'received',
          received_at: dataRecebimento
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  };

  // ============ FORNECEDORES ============
  fornecedores = {
    getAll: async (filtros?: any): Promise<any[]> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('type', 'supplier')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    getById: async (id: string): Promise<any | null> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .eq('type', 'supplier')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    create: async (data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('contacts')
        .insert([{ ...data, type: 'supplier' }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    update: async (id: string, data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    }
  };

  // ============ CONTATOS ============
  contatos = {
    getAll: async (filtros?: any): Promise<any[]> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    getById: async (id: string): Promise<any | null> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    create: async (data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('contacts')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    update: async (id: string, data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    }
  };

  // ============ CATEGORIAS ============
  categorias = {
    getAll: async (filtros?: any): Promise<any[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    getById: async (id: string): Promise<any | null> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    create: async (data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('categories')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    update: async (id: string, data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    }
  };

  // ============ BANCOS ============
  bancos = {
    getAll: async (filtros?: any): Promise<any[]> => {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    getById: async (id: string): Promise<any | null> => {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },

    create: async (data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('banks')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    update: async (id: string, data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('banks')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('banks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    }
  };

  // ============ BANK ACCOUNTS ============
  bankAccounts = {
    getAll: async (): Promise<any[]> => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .is('deleted_at', null);
      
      if (error) throw error;
      return data || [];
    },

    create: async (bankId: string, data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('bank_accounts')
        .insert([{ ...data, bank_id: bankId }])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    transfer: async (fromAccountId: string, toAccountId: string, amount: number, description: string): Promise<any> => {
      // Implementar transferência entre contas
      throw new Error('Transfer not implemented yet');
    }
  };

  // ============ TRANSACTIONS ============
  transactions = {
    getAll: async (filters?: any): Promise<any[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },

    create: async (data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('transactions')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    update: async (id: string, data: any): Promise<any> => {
      const { data: result, error } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },

    getStatement: async (accountId: string, startDate: Date, endDate: Date): Promise<any[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('from_account_id', accountId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString())
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  };

  // ============ DASHBOARD ============
  dashboard = {
    getSummary: async (): Promise<DashboardSummary> => {
      // Buscar dados básicos
      const [accountsPayable, accountsReceivable, banks] = await Promise.all([
        this.contasPagar.getAll(),
        this.contasReceber.getAll(),
        this.bancos.getAll()
      ]);

      const totalBalance = banks.reduce((sum, bank) => sum + (bank.initial_balance || 0), 0);
      
      return {
        totalBalance,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        totalAccountsPayable: accountsPayable.reduce((sum, acc) => sum + acc.amount, 0),
        totalAccountsReceivable: accountsReceivable.reduce((sum, acc) => sum + acc.amount, 0),
        overdueAccountsPayable: accountsPayable.filter(acc => acc.status === 'overdue').length,
        overdueAccountsReceivable: accountsReceivable.filter(acc => acc.status === 'overdue').length,
        accountsPayableCount: accountsPayable.length,
        accountsReceivableCount: accountsReceivable.length,
        recentActivity: []
      };
    }
  };

  // ============ UTILS ============
  utils = {
    exportData: async (format: 'json' | 'csv'): Promise<Blob> => {
      throw new Error('Export not implemented yet');
    },

    importData: async (file: File): Promise<{ success: boolean; message: string }> => {
      throw new Error('Import not implemented yet');
    },

    clearCache: async (): Promise<void> => {
      // Implementar limpeza de cache
    },

    checkConnection: async (): Promise<boolean> => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        return !error;
      } catch {
        return false;
      }
    },

    resetData: async (): Promise<void> => {
      throw new Error('Reset data not implemented yet');
    }
  };
}