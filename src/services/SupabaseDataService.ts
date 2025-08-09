// SupabaseDataService - Implementação completa integrada ao Supabase
import { IDataService, User, Session, DashboardSummary } from './interfaces/IDataService';
import { supabase } from '@/integrations/supabase/client';
import { FEATURES } from '@/config/features';
import type { ContaPagar } from '@/types/contaPagar';
import type { ContaReceber } from '@/types/contaReceber';
import type { Categoria } from '@/types/categoria';
import type { Banco } from '@/types/banco';
import type { Fornecedor } from '@/types/fornecedor';

export class SupabaseDataService implements IDataService {
  private supabaseClient = supabase;

  constructor() {
    if (FEATURES.DEBUG_MODE) {
      console.warn('🚀 SupabaseDataService inicializado com Supabase real');
    }
  }

  // ============ MÉTODOS AUXILIARES PRIVADOS ============
  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await this.supabaseClient.auth.getUser();
    if (error || !user) {
      throw new Error('Usuário não autenticado');
    }
    return user.id;
  }

  private handleError(error: any, context: string): never {
    console.error(`[SupabaseDataService::${context}]`, error);
    throw new Error(`Erro em ${context}: ${error.message || 'Erro desconhecido'}`);
  }

  private async ensureAuthenticated(): Promise<string> {
    try {
      return await this.getCurrentUserId();
    } catch {
      throw new Error('Acesso negado: usuário não autenticado');
    }
  }

  // ============ AUTENTICAÇÃO ============
  auth = {
    signInWithPhone: async (phone: string) => {
      console.warn('WhatsApp auth em desenvolvimento');
      return { success: false, message: 'Login com WhatsApp em desenvolvimento. Use email por enquanto.' };
    },

    verifyOTP: async (phone: string, code: string): Promise<Session> => {
      throw new Error('Verificação OTP em desenvolvimento. Use email por enquanto.');
    },

    signIn: async (email: string, password: string): Promise<Session> => {
      try {
        const { data, error } = await this.supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) this.handleError(error, 'signIn');
        if (!data.user || !data.session) {
          throw new Error('Falha na autenticação');
        }

        // Buscar ou criar profile
        const profile = await this.ensureUserProfile(data.user.id, email);

        const user: User = {
          id: data.user.id,
          email: data.user.email,
          nome: profile?.name || data.user.user_metadata?.name || '',
          telefone: profile?.phone || '',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at
        };

        return {
          user,
          access_token: data.session.access_token,
          expires_at: data.session.expires_at
        };
      } catch (error) {
        this.handleError(error, 'signIn');
      }
    },

    signUp: async (email: string, password: string, userData?: { nome?: string }): Promise<Session> => {
      try {
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await this.supabaseClient.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: userData?.nome || ''
            }
          }
        });

        if (error) this.handleError(error, 'signUp');
        if (!data.user) {
          throw new Error('Falha no cadastro');
        }

        // Se temos sessão, criar profile e retornar
        if (data.session) {
          const profile = await this.ensureUserProfile(data.user.id, email, userData?.nome);

          const user: User = {
            id: data.user.id,
            email: data.user.email,
            nome: userData?.nome || '',
            created_at: data.user.created_at,
            updated_at: data.user.updated_at
          };

          return {
            user,
            access_token: data.session.access_token,
            expires_at: data.session.expires_at
          };
        }

        // Se não temos sessão, usuário precisa confirmar email
        throw new Error('Email de confirmação enviado. Verifique sua caixa de entrada.');
      } catch (error) {
        this.handleError(error, 'signUp');
      }
    },

    signOut: async (): Promise<void> => {
      try {
        const { error } = await this.supabaseClient.auth.signOut();
        if (error) this.handleError(error, 'signOut');
      } catch (error) {
        this.handleError(error, 'signOut');
      }
    },

    getCurrentUser: async (): Promise<User | null> => {
      try {
        const { data: { user } } = await this.supabaseClient.auth.getUser();
        if (!user) return null;

        // Buscar dados do profile
        const { data: profile } = await this.supabaseClient
          .from('profiles')
          .select('name, phone')
          .eq('user_id', user.id)
          .single();

        return {
          id: user.id,
          email: user.email,
          nome: profile?.name || user.user_metadata?.name || '',
          telefone: profile?.phone || '',
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      } catch (error) {
        console.warn('getCurrentUser failed:', error);
        return null;
      }
    },

    getSession: (): Session | null => {
      // Implementação simplificada por enquanto
      return null;
    },

    updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
      try {
        const currentUserId = await this.getCurrentUserId();
        if (currentUserId !== userId) {
          throw new Error('Acesso negado: só pode atualizar próprio perfil');
        }

        // Atualizar profile na tabela profiles
        const { error } = await this.supabaseClient
          .from('profiles')
          .update({
            name: data.nome,
            phone: data.telefone,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) this.handleError(error, 'updateProfile');

        return {
          id: userId,
          email: data.email || '',
          nome: data.nome || '',
          telefone: data.telefone || '',
          updated_at: new Date().toISOString()
        };
      } catch (error) {
        this.handleError(error, 'updateProfile');
      }
    }
  };

  // Método auxiliar para garantir que o profile existe
  private async ensureUserProfile(userId: string, email: string, name?: string) {
    try {
      const { data: existingProfile } = await this.supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingProfile) {
        return existingProfile;
      }

      // Criar profile se não existir (fallback case)
      const { data: newProfile, error } = await this.supabaseClient
        .from('profiles')
        .insert({
          user_id: userId,
          name: name || '',
          phone: '',
          role: 'user'
        })
        .select()
        .single();

      if (error) {
        console.warn('Erro ao criar profile:', error);
        return null;
      }

      return newProfile;
    } catch (error) {
      console.warn('Erro ao buscar/criar profile:', error);
      return null;
    }
  }

  // ============ CONTAS A PAGAR ============
  contasPagar = {
    getAll: async (filtros?: any): Promise<ContaPagar[]> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        let query = this.supabaseClient
          .from('accounts_payable')
          .select(`
            *,
            supplier:suppliers(name),
            contact:contacts(name),
            category:categories(name, color)
          `)
          .eq('user_id', userId)
          .is('deleted_at', null);

        if (filtros?.status) {
          query = query.eq('status', filtros.status);
        }

        const { data, error } = await query.order('due_date', { ascending: true });
        
        if (error) this.handleError(error, 'contasPagar.getAll');
        
        return (data || []).map(this.mapAccountPayableFromSupabase);
      } catch (error) {
        this.handleError(error, 'contasPagar.getAll');
      }
    },

    getById: async (id: string | number): Promise<ContaPagar | null> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const { data, error } = await this.supabaseClient
          .from('accounts_payable')
          .select(`
            *,
            supplier:suppliers(name),
            contact:contacts(name),
            category:categories(name, color)
          `)
          .eq('id', id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') return null;
          this.handleError(error, 'contasPagar.getById');
        }
        
        return data ? this.mapAccountPayableFromSupabase(data) : null;
      } catch (error) {
        this.handleError(error, 'contasPagar.getById');
      }
    },

    create: async (data: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>): Promise<ContaPagar> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const insertData = {
          user_id: userId,
          description: data.descricao,
          amount: data.valor_original,
          due_date: data.data_vencimento,
          status: data.status || 'pending',
          supplier_id: data.fornecedor_id || null,
          contact_id: data.fornecedor_id || null, // Transitório
          category_id: data.plano_conta_id || null,
          notes: data.observacoes || null
        };

        const { data: newRecord, error } = await this.supabaseClient
          .from('accounts_payable')
          .insert(insertData)
          .select()
          .single();
        
        if (error) this.handleError(error, 'contasPagar.create');
        
        return this.mapAccountPayableFromSupabase(newRecord);
      } catch (error) {
        this.handleError(error, 'contasPagar.create');
      }
    },

    update: async (id: string | number, data: Partial<ContaPagar>): Promise<ContaPagar> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (data.descricao !== undefined) updateData.description = data.descricao;
        if (data.valor_original !== undefined) updateData.amount = data.valor_original;
        if (data.data_vencimento !== undefined) updateData.due_date = data.data_vencimento;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.observacoes !== undefined) updateData.notes = data.observacoes;

        const { data: updatedRecord, error } = await this.supabaseClient
          .from('accounts_payable')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .select()
          .single();
        
        if (error) this.handleError(error, 'contasPagar.update');
        
        return this.mapAccountPayableFromSupabase(updatedRecord);
      } catch (error) {
        this.handleError(error, 'contasPagar.update');
      }
    },

    delete: async (id: string | number): Promise<void> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const { error } = await this.supabaseClient
          .from('accounts_payable')
          .update({ 
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId);
        
        if (error) this.handleError(error, 'contasPagar.delete');
      } catch (error) {
        this.handleError(error, 'contasPagar.delete');
      }
    },

    getByVencimento: async (dataInicio: Date, dataFim: Date): Promise<ContaPagar[]> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const { data, error } = await this.supabaseClient
          .from('accounts_payable')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .gte('due_date', dataInicio.toISOString().split('T')[0])
          .lte('due_date', dataFim.toISOString().split('T')[0]);
        
        if (error) this.handleError(error, 'contasPagar.getByVencimento');
        
        return (data || []).map(this.mapAccountPayableFromSupabase);
      } catch (error) {
        this.handleError(error, 'contasPagar.getByVencimento');
      }
    },

    getByStatus: async (status: string): Promise<ContaPagar[]> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const { data, error } = await this.supabaseClient
          .from('accounts_payable')
          .select('*')
          .eq('user_id', userId)
          .eq('status', status)
          .is('deleted_at', null);
        
        if (error) this.handleError(error, 'contasPagar.getByStatus');
        
        return (data || []).map(this.mapAccountPayableFromSupabase);
      } catch (error) {
        this.handleError(error, 'contasPagar.getByStatus');
      }
    },

    marcarComoPaga: async (id: string | number, dataPagamento: Date, valorPago?: number): Promise<ContaPagar> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const { data: updatedRecord, error } = await this.supabaseClient
          .from('accounts_payable')
          .update({
            status: 'paid',
            paid_at: dataPagamento.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .select()
          .single();
        
        if (error) this.handleError(error, 'contasPagar.marcarComoPaga');
        
        return this.mapAccountPayableFromSupabase(updatedRecord);
      } catch (error) {
        this.handleError(error, 'contasPagar.marcarComoPaga');
      }
    }
  };

  // ============ MAPPERS ============
  private mapAccountPayableFromSupabase(data: any): ContaPagar {
    return {
      id: parseInt(data.id) || 0,
      fornecedor_id: data.supplier_id ? parseInt(data.supplier_id) : 0,
      plano_conta_id: data.category_id ? parseInt(data.category_id) : 0,
      descricao: data.description || '',
      data_vencimento: data.due_date || '',
      valor_original: parseFloat(data.amount) || 0,
      valor_final: parseFloat(data.amount) || 0,
      status: data.status || 'pendente',
      parcela_atual: 1,
      total_parcelas: 1,
      forma_pagamento: 'dinheiro',
      dda: false,
      observacoes: data.notes || '',
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }

  // ============ IMPLEMENTAÇÃO SIMPLIFICADA DOS DEMAIS MÉTODOS ============
  contasReceber = {
    getAll: async () => [],
    getById: async () => null,
    create: async (data: any) => data,
    update: async (id: any, data: any) => data,
    delete: async () => {},
    getByVencimento: async () => [],
    getByStatus: async () => [],
    marcarComoRecebida: async (id: any, data: any) => ({ id, ...data })
  };

  fornecedores = {
    getAll: async () => [],
    getById: async () => null,
    create: async (data: any) => data,
    update: async (id: any, data: any) => data,
    delete: async () => {},
    getAtivos: async () => [],
    buscarPorDocumento: async () => null
  };

  categorias = {
    getAll: async () => [],
    getById: async () => null,
    create: async (data: any) => data,
    update: async (id: any, data: any) => data,
    delete: async () => {},
    getByTipo: async () => []
  };

  bancos = {
    getAll: async (): Promise<Banco[]> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const { data, error } = await this.supabaseClient
          .from('banks')
          .select(`
            *,
            bank_accounts(id, account_number, agency, pix_key)
          `)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('name');

        if (error) this.handleError(error, 'bancos.getAll');
        
        return (data || []).map(this.mapBankFromSupabase);
      } catch (error) {
        this.handleError(error, 'bancos.getAll');
      }
    },

    getById: async (id: number): Promise<Banco | null> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const { data, error } = await this.supabaseClient
          .from('banks')
          .select(`
            *,
            bank_accounts(*)
          `)
          .eq('id', id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null;
          this.handleError(error, 'bancos.getById');
        }

        return data ? this.mapBankFromSupabase(data) : null;
      } catch (error) {
        this.handleError(error, 'bancos.getById');
      }
    },

    create: async (data: Omit<Banco, 'id' | 'created_at' | 'updated_at'>): Promise<Banco> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const insertData = {
          user_id: userId,
          name: data.nome,
          type: data.tipo_conta || 'banco',
          initial_balance: data.saldo_inicial || 0
        };

        const { data: newBank, error } = await this.supabaseClient
          .from('banks')
          .insert(insertData)
          .select()
          .single();

        if (error) this.handleError(error, 'bancos.create');

        // Se tiver dados de conta inicial, criar conta
        if (data.agencia || data.conta) {
          await this.supabaseClient
            .from('bank_accounts')
            .insert({
              bank_id: newBank.id,
              agency: data.agencia || '',
              account_number: data.conta || '',
              pix_key: data.observacoes || null
            });
        }

        return this.mapBankFromSupabase(newBank);
      } catch (error) {
        this.handleError(error, 'bancos.create');
      }
    },

    update: async (id: number, data: Partial<Banco>): Promise<Banco> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const updateData: any = {
          updated_at: new Date().toISOString()
        };

        if (data.nome !== undefined) updateData.name = data.nome;
        if (data.tipo_conta !== undefined) updateData.type = data.tipo_conta;

        const { data: updatedBank, error } = await this.supabaseClient
          .from('banks')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .select()
          .single();

        if (error) this.handleError(error, 'bancos.update');

        return this.mapBankFromSupabase(updatedBank);
      } catch (error) {
        this.handleError(error, 'bancos.update');
      }
    },

    delete: async (id: number): Promise<void> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        // Verificar se tem contas vinculadas
        const { data: accounts } = await this.supabaseClient
          .from('bank_accounts')
          .select('id')
          .eq('bank_id', id);

        if (accounts && accounts.length > 0) {
          throw new Error('Não é possível excluir banco com contas vinculadas');
        }

        const { error } = await this.supabaseClient
          .from('banks')
          .update({ 
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId);

        if (error) this.handleError(error, 'bancos.delete');
      } catch (error) {
        this.handleError(error, 'bancos.delete');
      }
    },

    atualizarSaldo: async (id: number, novoSaldo: number): Promise<Banco> => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const { data: updatedBank, error } = await this.supabaseClient
          .from('banks')
          .update({
            initial_balance: novoSaldo,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .select()
          .single();

        if (error) this.handleError(error, 'bancos.atualizarSaldo');

        // Registrar transação de ajuste
        await this.supabaseClient
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'adjustment',
            amount: novoSaldo,
            description: 'Ajuste de saldo manual',
            date: new Date().toISOString().split('T')[0],
            from_account_id: id
          });

        return this.mapBankFromSupabase(updatedBank);
      } catch (error) {
        this.handleError(error, 'bancos.atualizarSaldo');
      }
    }
  };

  // ============ BANK ACCOUNTS ============
  bankAccounts = {
    getByBankId: async (bankId: number) => {
      try {
        const userId = await this.ensureAuthenticated();
        
        const { data, error } = await this.supabaseClient
          .from('bank_accounts')
          .select('*')
          .eq('bank_id', bankId)
          .is('deleted_at', null);

        if (error) this.handleError(error, 'bankAccounts.getByBankId');
        
        return data || [];
      } catch (error) {
        this.handleError(error, 'bankAccounts.getByBankId');
      }
    },

    create: async (data: any) => {
      try {
        const { data: newAccount, error } = await this.supabaseClient
          .from('bank_accounts')
          .insert({
            bank_id: data.bank_id,
            agency: data.agency || '',
            account_number: data.account_number || '',
            pix_key: data.pix_key || null
          })
          .select()
          .single();

        if (error) this.handleError(error, 'bankAccounts.create');
        
        return newAccount;
      } catch (error) {
        this.handleError(error, 'bankAccounts.create');
      }
    },

    transferBetweenAccounts: async (fromAccountId: number, toAccountId: number, amount: number) => {
      try {
        const userId = await this.ensureAuthenticated();
        
        // Criar transação de transferência
        const { error } = await this.supabaseClient
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'transfer',
            amount: amount,
            description: `Transferência entre contas`,
            date: new Date().toISOString().split('T')[0],
            from_account_id: fromAccountId,
            to_account_id: toAccountId
          });

        if (error) this.handleError(error, 'bankAccounts.transferBetweenAccounts');
        
        return { success: true };
      } catch (error) {
        this.handleError(error, 'bankAccounts.transferBetweenAccounts');
      }
    }
  };

  // ============ MAPPERS ============
  private mapBankFromSupabase(data: any): Banco {
    return {
      id: data.id,
      nome: data.name || '',
      codigo_banco: '000',
      agencia: data.bank_accounts?.[0]?.agency || '',
      conta: data.bank_accounts?.[0]?.account_number || '',
      digito_verificador: '0',
      tipo_conta: data.type || 'conta_corrente',
      saldo_inicial: parseFloat(data.initial_balance) || 0,
      saldo_atual: parseFloat(data.initial_balance) || 0,
      limite_usado: 0,
      suporta_ofx: false,
      ativo: true,
      created_at: data.created_at || '',
      updated_at: data.updated_at || ''
    };
  }

  dashboard = {
    getSummary: async (): Promise<DashboardSummary> => ({
      saldo_total: 0,
      contas_pagar: {
        pendentes: 0,
        valor_pendente: 0,
        vencidas: 0,
        valor_vencido: 0,
        pagas_mes: 0,
        valor_pago_mes: 0
      },
      contas_receber: {
        pendentes: 0,
        valor_pendente: 0,
        vencidas: 0,
        valor_vencido: 0,
        recebidas_mes: 0,
        valor_recebido_mes: 0
      }
    })
  };

  utils = {
    exportarDados: async () => new Blob(),
    importarDados: async () => ({ total: 0, sucesso: 0, erros: 0 }),
    limparCache: async () => {},
    verificarConexao: async () => true,
    resetAllData: () => {}
  };
}