import { supabase } from '@/integrations/supabase/client';
import type { IDataService, User, Session, DashboardSummary } from '@/services/interfaces/IDataService';
import { cacheService } from '@/services/cache/cacheService';

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
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user?.id) throw new Error('Usuário não autenticado');

        let query = supabase
          .from('accounts_payable')
          .select(`
            *,
            contact:contacts(id, name, document, type),
            category:categories(id, name, color, icon),
            bank_account:bank_accounts(
              id, agency, account_number,
              bank:banks(id, name)
            )
          `)
          .is('deleted_at', null)
          .eq('user_id', user.user.id);

        // Aplicar filtros
        if (filtros?.status && filtros.status !== 'todos') {
          query = query.eq('status', filtros.status);
        }

        if (filtros?.busca?.trim()) {
          query = query.ilike('description', `%${filtros.busca}%`);
        }

        if (filtros?.contact_id && filtros.contact_id !== 'todos') {
          query = query.eq('contact_id', filtros.contact_id);
        }

        if (filtros?.data_inicio) {
          query = query.gte('due_date', filtros.data_inicio);
        }

        if (filtros?.data_fim) {
          query = query.lte('due_date', filtros.data_fim);
        }

        query = query.order('due_date', { ascending: false });

        const { data, error } = await query;
        if (error) throw new Error(`Erro ao buscar contas: ${error.message}`);

        return (data || []).map(conta => ({
          ...conta,
          credor_nome: conta.contact?.name || 'Sem credor',
          fornecedor_nome: conta.contact?.name || 'Sem credor', // manter para compatibilidade
          categoria_nome: conta.category?.name || 'Sem categoria',
          banco_nome: conta.bank_account?.bank?.name,
          amount: parseFloat(conta.amount) || 0
        }));

      } catch (error) {
        console.error('Erro no getAll:', error);
        throw error;
      }
    },

    getById: async (id: string) => {
      console.log('🔍 DEBUG getById - CHAMADO com ID:', id);
      try {
        console.log('🔍 DEBUG getById - INICIANDO...');
        const { data: user } = await supabase.auth.getUser();
        if (!user.user?.id) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
          .from('accounts_payable')
          .select(`
            *,
            contact:contacts!contact_id(id, name, document, type),
            category:categories!category_id(id, name, color, icon),
            bank_account:bank_accounts!bank_account_id(
              id, agency, account_number,
              bank:banks!bank_id(id, name)
            )
          `)
          .eq('id', id)
          .eq('user_id', user.user.id)
          .is('deleted_at', null)
          .single();

        console.log('🔍 DEBUG getById - QUERY executada, data:', data);
        console.log('🔍 DEBUG getById - ERROR da query:', error);

        if (error) throw new Error(`Erro ao buscar conta: ${error.message}`);

        console.log('🔍 DEBUG getById - Raw data:', data);
        console.log('🔍 DEBUG getById - Contact:', data.contact);
        console.log('🔍 DEBUG getById - Category:', data.category);
        console.log('🔍 DEBUG getById - Bank Account:', data.bank_account);

        return {
          ...data,
          credor_nome: data.contact?.name || 'Sem credor',
          fornecedor_nome: data.contact?.name || 'Sem credor',
          categoria_nome: data.category?.name || 'Sem categoria',
          banco_nome: data.bank_account?.bank?.name,
          amount: parseFloat(data.amount) || 0
        };

      } catch (error) {
        console.error('Erro no getById:', error);
        throw error;
      }
    },

    create: async (data: any) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user?.id) throw new Error('Usuário não autenticado');

        // Mapeamento de status português -> inglês
        const statusMap = {
          'pendente': 'pending',
          'pago': 'paid',
          'vencido': 'overdue',
          'cancelado': 'cancelled'
        };

        const insertData = {
          user_id: user.user.id,
          description: data.descricao || data.description,
          amount: parseFloat(data.valor_original || data.amount || data.valor_final),
          due_date: (() => {
            const dateStr = data.data_vencimento || data.due_date;
            if (!dateStr) return null;
            
            // Se já está no formato YYYY-MM-DD, manter
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
            
            // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
            if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              const [day, month, year] = dateStr.split('/');
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            
            return dateStr;
          })(),
          status: statusMap[data.status] || data.status || 'pending',
          contact_id: data.credor_id || data.fornecedor_id || data.contact_id || null,
          category_id: data.plano_conta_id || data.category_id || null,
          bank_account_id: data.banco_id || data.bank_account_id || null,
          notes: data.observacoes || data.notes || null,
          reference_document: data.documento_referencia || data.reference_document || null,
          issue_date: data.data_emissao || data.issue_date || null,
          original_amount: parseFloat(data.valor_original || data.original_amount || data.amount),
          final_amount: parseFloat(data.valor_final || data.final_amount || data.amount),
          dda_enabled: data.dda || data.dda_enabled || false
        };

        const { data: result, error } = await supabase
          .from('accounts_payable')
          .insert(insertData)
          .select(`
            *,
            contact:contacts(id, name, document, type),
            category:categories(id, name, color, icon),
            bank_account:bank_accounts(
              id, agency, account_number,
              bank:banks(id, name)
            )
          `)
          .single();

        if (error) throw new Error(`Erro ao criar conta: ${error.message}`);

        return {
          ...result,
          credor_nome: result.contact?.name || 'Sem credor',
          fornecedor_nome: result.contact?.name || 'Sem credor', // compatibilidade
          categoria_nome: result.category?.name || 'Sem categoria',
          banco_nome: result.bank_account?.bank?.name,
          amount: parseFloat(result.amount) || 0
        };

      } catch (error) {
        console.error('Erro no create:', error);
        throw error;
      }
    },

    update: async (id: string, data: any) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user?.id) throw new Error('Usuário não autenticado');

        // Mapeamento de status português -> inglês
        const statusMap = {
          'pendente': 'pending',
          'pago': 'paid',
          'vencido': 'overdue',
          'cancelado': 'cancelled'
        };

        const updateData = {
          description: data.descricao || data.description,
          amount: data.valor_original !== undefined ? parseFloat(data.valor_original) : (data.amount !== undefined ? parseFloat(data.amount) : undefined),
          due_date: (() => {
            const dateStr = data.data_vencimento || data.due_date;
            if (!dateStr) return undefined;
            
            // Se já está no formato YYYY-MM-DD, manter
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
            
            // Se está no formato DD/MM/YYYY, converter para YYYY-MM-DD
            if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
              const [day, month, year] = dateStr.split('/');
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            
            return dateStr;
          })(),
          status: data.status ? (statusMap[data.status] || data.status) : undefined,
          contact_id: data.credor_id || data.fornecedor_id || data.contact_id,
          category_id: data.plano_conta_id || data.category_id,
          bank_account_id: data.banco_id || data.bank_account_id,
          notes: data.observacoes || data.notes,
          reference_document: data.documento_referencia || data.reference_document,
          issue_date: data.data_emissao || data.issue_date,
          original_amount: data.valor_original !== undefined ? parseFloat(data.valor_original) : (data.original_amount !== undefined ? parseFloat(data.original_amount) : undefined),
          final_amount: data.valor_final !== undefined ? parseFloat(data.valor_final) : (data.final_amount !== undefined ? parseFloat(data.final_amount) : undefined),
          paid_amount: data.valor_pago !== undefined ? parseFloat(data.valor_pago) : (data.paid_amount !== undefined ? parseFloat(data.paid_amount) : undefined),
          paid_at: data.data_pagamento || data.paid_at,
          dda_enabled: data.dda !== undefined ? data.dda : data.dda_enabled,
          updated_at: new Date().toISOString()
        };

        // Remove campos undefined para não sobrescrever com null
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        const { data: result, error } = await supabase
          .from('accounts_payable')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.user.id)
          .select(`
            *,
            contact:contacts(id, name, document, type),
            category:categories(id, name, color, icon),
            bank_account:bank_accounts(
              id, agency, account_number,
              bank:banks(id, name)
            )
          `)
          .single();

        if (error) throw new Error(`Erro ao atualizar conta: ${error.message}`);

        return {
          ...result,
          credor_nome: result.contact?.name || 'Sem credor',
          fornecedor_nome: result.contact?.name || 'Sem credor', // compatibilidade
          categoria_nome: result.category?.name || 'Sem categoria',
          banco_nome: result.bank_account?.bank?.name,
          amount: parseFloat(result.amount) || 0
        };

      } catch (error) {
        console.error('Erro no update:', error);
        throw error;
      }
    },

    delete: async (id: string) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user?.id) throw new Error('Usuário não autenticado');

        // Soft delete - marca como deletado ao invés de remover
        const { error } = await supabase
          .from('accounts_payable')
          .update({ 
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', user.user.id);

        if (error) throw new Error(`Erro ao excluir conta: ${error.message}`);

        return { success: true };

      } catch (error) {
        console.error('Erro no delete:', error);
        throw error;
      }
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
      // Gera chave única do cache baseada nos filtros
      const cacheKey = `list_${JSON.stringify(filtros || {})}`;
      
      // Tenta recuperar do cache
      const cached = cacheService.getReceivables<any[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .is('deleted_at', null)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      
      // Armazena no cache
      const result = data || [];
      cacheService.setReceivables(cacheKey, result);
      
      return result;
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
      
      // Invalida cache após criação
      cacheService.invalidateReceivables();
      cacheService.invalidateDashboard();
      
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
      
      // Invalida cache após atualização
      cacheService.invalidateReceivables();
      cacheService.invalidateDashboard();
      
      return result;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalida cache após exclusão
      cacheService.invalidateReceivables();
      cacheService.invalidateDashboard();
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
      // Gera chave única do cache baseada nos filtros
      const cacheKey = `list_${JSON.stringify(filtros || {})}`;
      
      // Tenta recuperar do cache
      const cached = cacheService.getCategories<any[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Armazena no cache com TTL maior (10 minutos) para categorias
      const result = data || [];
      cacheService.setCategories(cacheKey, result);
      
      return result;
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
      
      // Invalida cache após criação
      cacheService.invalidateCategories();
      
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
      
      // Invalida cache após atualização
      cacheService.invalidateCategories();
      
      return result;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Invalida cache após exclusão
      cacheService.invalidateCategories();
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
      // Verifica cache primeiro - dashboard tem cache de 5 minutos
      const cached = cacheService.getDashboard<DashboardSummary>('summary');
      if (cached) {
        return cached;
      }

      // Otimização: Usar RPC única ao invés de múltiplas queries N+1
      // Chama função PostgreSQL otimizada que retorna todos os dados em uma consulta
      const { data: currentUser } = await supabase.auth.getUser();
      
      if (!currentUser.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('get_dashboard_summary', { 
        p_user_id: currentUser.user.id 
      });

      if (error) {
        console.error('Erro ao buscar dashboard summary:', error);
        throw error;
      }

      let result: DashboardSummary;

      if (!data || data.length === 0) {
        // Retorna dados vazios se não houver dados
        result = {
          totalBalance: 0,
          monthlyIncome: 0,
          monthlyExpenses: 0,
          totalAccountsPayable: 0,
          totalAccountsReceivable: 0,
          overdueAccountsPayable: 0,
          overdueAccountsReceivable: 0,
          accountsPayableCount: 0,
          accountsReceivableCount: 0,
          recentActivity: []
        };
      } else {
        // Mapear retorno da RPC para formato esperado pelo componente Dashboard
        const summary = data[0]; // RPC retorna array com um objeto
        
        result = {
          totalBalance: summary.saldo_total || 0,
          monthlyIncome: summary.receitas_mes || 0,
          monthlyExpenses: summary.despesas_mes || 0,
          totalAccountsPayable: summary.total_a_pagar || 0,
          totalAccountsReceivable: summary.total_a_receber || 0,
          overdueAccountsPayable: (summary.contas_vencidas_pagar || 0) + (summary.contas_vencidas_receber || 0),
          overdueAccountsReceivable: summary.contas_vencidas_receber || 0,
          accountsPayableCount: summary.qtd_contas_pagar || 0,
          accountsReceivableCount: summary.qtd_contas_receber || 0,
          recentActivity: [] // TODO: Implementar atividade recente se necessário
        };
      }

      // Armazena no cache
      cacheService.setDashboard('summary', result);

      return result;
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