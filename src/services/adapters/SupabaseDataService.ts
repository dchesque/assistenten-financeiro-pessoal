// SupabaseDataService - Implementação real integrada ao Supabase
import { IDataService, User, Session, DashboardSummary } from '../interfaces/IDataService';
import { supabase } from '@/integrations/supabase/client';
import { FEATURES } from '@/config/features';

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

        const user: User = {
          id: data.user.id,
          email: data.user.email,
          nome: data.user.user_metadata?.name || '',
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
        const { data, error } = await this.supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: userData?.nome || ''
            }
          }
        });

        if (error) this.handleError(error, 'signUp');
        if (!data.user || !data.session) {
          throw new Error('Falha no cadastro');
        }

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

        return {
          id: user.id,
          email: user.email,
          nome: user.user_metadata?.name || '',
          created_at: user.created_at,
          updated_at: user.updated_at
        };
      } catch (error) {
        console.warn('getCurrentUser failed:', error);
        return null;
      }
    },

    getSession: (): Session | null => {
      // Implementação simplificada
      return null;
    },

    updateProfile: async (userId: string, data: Partial<User>): Promise<User> => {
      try {
        const currentUserId = await this.getCurrentUserId();
        if (currentUserId !== userId) {
          throw new Error('Acesso negado: só pode atualizar próprio perfil');
        }

        return {
          id: userId,
          email: data.email || '',
          nome: data.nome || '',
          updated_at: new Date().toISOString()
        };
      } catch (error) {
        this.handleError(error, 'updateProfile');
      }
    }
  };

  // ============ CONTAS A PAGAR ============
  contasPagar = {
    getAll: async () => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('accounts_payable')
          .select(`
            *,
            category:categories(id, name, color),
            supplier:suppliers(id, name, document),
            contact:contacts(id, name, type)
          `)
          .order('due_date', { ascending: true });

        if (error) this.handleError(error, 'contasPagar.getAll');
        return data || [];
      } catch (error) {
        this.handleError(error, 'contasPagar.getAll');
      }
    },

    getById: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('accounts_payable')
          .select(`
            *,
            category:categories(id, name, color),
            supplier:suppliers(id, name, document),
            contact:contacts(id, name, type)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) this.handleError(error, 'contasPagar.getById');
        return data;
      } catch (error) {
        this.handleError(error, 'contasPagar.getById');
      }
    },

    create: async (data: any) => {
      const userId = await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('accounts_payable')
          .insert([{ ...data, user_id: userId }])
          .select(`
            *,
            category:categories(id, name, color),
            supplier:suppliers(id, name, document),
            contact:contacts(id, name, type)
          `)
          .single();

        if (error) this.handleError(error, 'contasPagar.create');
        return result;
      } catch (error) {
        this.handleError(error, 'contasPagar.create');
      }
    },

    update: async (id: string, data: any) => {
      await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('accounts_payable')
          .update(data)
          .eq('id', id)
          .select(`
            *,
            category:categories(id, name, color),
            supplier:suppliers(id, name, document),
            contact:contacts(id, name, type)
          `)
          .single();

        if (error) this.handleError(error, 'contasPagar.update');
        return result;
      } catch (error) {
        this.handleError(error, 'contasPagar.update');
      }
    },

    delete: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { error } = await this.supabaseClient
          .from('accounts_payable')
          .delete()
          .eq('id', id);

        if (error) this.handleError(error, 'contasPagar.delete');
      } catch (error) {
        this.handleError(error, 'contasPagar.delete');
      }
    },

    getByVencimento: async (dataInicio: string, dataFim: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('accounts_payable')
          .select(`
            *,
            category:categories(id, name, color),
            supplier:suppliers(id, name, document),
            contact:contacts(id, name, type)
          `)
          .gte('due_date', dataInicio)
          .lte('due_date', dataFim)
          .order('due_date', { ascending: true });

        if (error) this.handleError(error, 'contasPagar.getByVencimento');
        return data || [];
      } catch (error) {
        this.handleError(error, 'contasPagar.getByVencimento');
      }
    },

    getByStatus: async (status: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('accounts_payable')
          .select(`
            *,
            category:categories(id, name, color),
            supplier:suppliers(id, name, document),
            contact:contacts(id, name, type)
          `)
          .eq('status', status)
          .order('due_date', { ascending: true });

        if (error) this.handleError(error, 'contasPagar.getByStatus');
        return data || [];
      } catch (error) {
        this.handleError(error, 'contasPagar.getByStatus');
      }
    },

    marcarComoPaga: async (id: string, paymentData: any) => {
      await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('accounts_payable')
          .update({
            status: 'paid',
            paid_at: paymentData.paid_at || new Date().toISOString().split('T')[0],
            bank_account_id: paymentData.bank_account_id
          })
          .eq('id', id)
          .select(`
            *,
            category:categories(id, name, color),
            supplier:suppliers(id, name, document),
            contact:contacts(id, name, type)
          `)
          .single();

        if (error) this.handleError(error, 'contasPagar.marcarComoPaga');
        return result;
      } catch (error) {
        this.handleError(error, 'contasPagar.marcarComoPaga');
      }
    }
  };

  contasReceber = {
    getAll: async () => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('accounts_receivable')
          .select(`
            *,
            category:categories(id, name, color),
            contact:contacts(id, name, type)
          `)
          .order('due_date', { ascending: true });

        if (error) this.handleError(error, 'contasReceber.getAll');
        return data || [];
      } catch (error) {
        this.handleError(error, 'contasReceber.getAll');
      }
    },

    getById: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('accounts_receivable')
          .select(`
            *,
            category:categories(id, name, color),
            contact:contacts(id, name, type)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) this.handleError(error, 'contasReceber.getById');
        return data;
      } catch (error) {
        this.handleError(error, 'contasReceber.getById');
      }
    },

    create: async (data: any) => {
      const userId = await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('accounts_receivable')
          .insert([{ ...data, user_id: userId }])
          .select(`
            *,
            category:categories(id, name, color),
            contact:contacts(id, name, type)
          `)
          .single();

        if (error) this.handleError(error, 'contasReceber.create');
        return result;
      } catch (error) {
        this.handleError(error, 'contasReceber.create');
      }
    },

    update: async (id: string, data: any) => {
      await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('accounts_receivable')
          .update(data)
          .eq('id', id)
          .select(`
            *,
            category:categories(id, name, color),
            contact:contacts(id, name, type)
          `)
          .single();

        if (error) this.handleError(error, 'contasReceber.update');
        return result;
      } catch (error) {
        this.handleError(error, 'contasReceber.update');
      }
    },

    delete: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { error } = await this.supabaseClient
          .from('accounts_receivable')
          .delete()
          .eq('id', id);

        if (error) this.handleError(error, 'contasReceber.delete');
      } catch (error) {
        this.handleError(error, 'contasReceber.delete');
      }
    },

    getByVencimento: async (dataInicio: string, dataFim: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('accounts_receivable')
          .select(`
            *,
            category:categories(id, name, color),
            contact:contacts(id, name, type)
          `)
          .gte('due_date', dataInicio)
          .lte('due_date', dataFim)
          .order('due_date', { ascending: true });

        if (error) this.handleError(error, 'contasReceber.getByVencimento');
        return data || [];
      } catch (error) {
        this.handleError(error, 'contasReceber.getByVencimento');
      }
    },

    getByStatus: async (status: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('accounts_receivable')
          .select(`
            *,
            category:categories(id, name, color),
            contact:contacts(id, name, type)
          `)
          .eq('status', status)
          .order('due_date', { ascending: true });

        if (error) this.handleError(error, 'contasReceber.getByStatus');
        return data || [];
      } catch (error) {
        this.handleError(error, 'contasReceber.getByStatus');
      }
    },

    marcarComoRecebida: async (id: string, receiptData: any) => {
      await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('accounts_receivable')
          .update({
            status: 'received',
            received_at: receiptData.received_at || new Date().toISOString().split('T')[0],
            bank_account_id: receiptData.bank_account_id
          })
          .eq('id', id)
          .select(`
            *,
            category:categories(id, name, color),
            contact:contacts(id, name, type)
          `)
          .single();

        if (error) this.handleError(error, 'contasReceber.marcarComoRecebida');
        return result;
      } catch (error) {
        this.handleError(error, 'contasReceber.marcarComoRecebida');
      }
    }
  };

  fornecedores = {
    getAll: async () => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('contacts')
          .select('*')
          .order('name', { ascending: true });

        if (error) this.handleError(error, 'fornecedores.getAll');
        return data || [];
      } catch (error) {
        this.handleError(error, 'fornecedores.getAll');
      }
    },

    getById: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('contacts')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) this.handleError(error, 'fornecedores.getById');
        return data;
      } catch (error) {
        this.handleError(error, 'fornecedores.getById');
      }
    },

    create: async (data: any) => {
      const userId = await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('contacts')
          .insert([{ ...data, user_id: userId }])
          .select('*')
          .single();

        if (error) this.handleError(error, 'fornecedores.create');
        return result;
      } catch (error) {
        this.handleError(error, 'fornecedores.create');
      }
    },

    update: async (id: string, data: any) => {
      await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('contacts')
          .update(data)
          .eq('id', id)
          .select('*')
          .single();

        if (error) this.handleError(error, 'fornecedores.update');
        return result;
      } catch (error) {
        this.handleError(error, 'fornecedores.update');
      }
    },

    delete: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { error } = await this.supabaseClient
          .from('contacts')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);

        if (error) this.handleError(error, 'fornecedores.delete');
      } catch (error) {
        this.handleError(error, 'fornecedores.delete');
      }
    },

    getAtivos: async () => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('contacts')
          .select('*')
          .eq('active', true)
          .is('deleted_at', null)
          .order('name', { ascending: true });

        if (error) this.handleError(error, 'fornecedores.getAtivos');
        return data || [];
      } catch (error) {
        this.handleError(error, 'fornecedores.getAtivos');
      }
    },

    buscarPorDocumento: async (documento: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('contacts')
          .select('*')
          .eq('document', documento)
          .maybeSingle();

        if (error) this.handleError(error, 'fornecedores.buscarPorDocumento');
        return data;
      } catch (error) {
        this.handleError(error, 'fornecedores.buscarPorDocumento');
      }
    }
  };

  categorias = {
    getAll: async () => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('categories')
          .select('*')
          .order('name', { ascending: true });

        if (error) this.handleError(error, 'categorias.getAll');
        return data || [];
      } catch (error) {
        this.handleError(error, 'categorias.getAll');
      }
    },

    getById: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('categories')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) this.handleError(error, 'categorias.getById');
        return data;
      } catch (error) {
        this.handleError(error, 'categorias.getById');
      }
    },

    create: async (data: any) => {
      const userId = await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('categories')
          .insert([{ ...data, user_id: userId }])
          .select('*')
          .single();

        if (error) this.handleError(error, 'categorias.create');
        return result;
      } catch (error) {
        this.handleError(error, 'categorias.create');
      }
    },

    update: async (id: string, data: any) => {
      await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('categories')
          .update(data)
          .eq('id', id)
          .select('*')
          .single();

        if (error) this.handleError(error, 'categorias.update');
        return result;
      } catch (error) {
        this.handleError(error, 'categorias.update');
      }
    },

    delete: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { error } = await this.supabaseClient
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) this.handleError(error, 'categorias.delete');
      } catch (error) {
        this.handleError(error, 'categorias.delete');
      }
    },

    getByTipo: async (tipo: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('categories')
          .select('*')
          .eq('type', tipo)
          .order('name', { ascending: true });

        if (error) this.handleError(error, 'categorias.getByTipo');
        return data || [];
      } catch (error) {
        this.handleError(error, 'categorias.getByTipo');
      }
    }
  };

  bancos = {
    getAll: async () => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('banks')
          .select('*')
          .order('name', { ascending: true });

        if (error) this.handleError(error, 'bancos.getAll');
        return data || [];
      } catch (error) {
        this.handleError(error, 'bancos.getAll');
      }
    },

    getById: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { data, error } = await this.supabaseClient
          .from('banks')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) this.handleError(error, 'bancos.getById');
        return data;
      } catch (error) {
        this.handleError(error, 'bancos.getById');
      }
    },

    create: async (data: any) => {
      const userId = await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('banks')
          .insert([{ ...data, user_id: userId }])
          .select('*')
          .single();

        if (error) this.handleError(error, 'bancos.create');
        return result;
      } catch (error) {
        this.handleError(error, 'bancos.create');
      }
    },

    update: async (id: string, data: any) => {
      await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('banks')
          .update(data)
          .eq('id', id)
          .select('*')
          .single();

        if (error) this.handleError(error, 'bancos.update');
        return result;
      } catch (error) {
        this.handleError(error, 'bancos.update');
      }
    },

    delete: async (id: string) => {
      await this.ensureAuthenticated();
      try {
        const { error } = await this.supabaseClient
          .from('banks')
          .delete()
          .eq('id', id);

        if (error) this.handleError(error, 'bancos.delete');
      } catch (error) {
        this.handleError(error, 'bancos.delete');
      }
    },

    atualizarSaldo: async (id: string, novoSaldo: number) => {
      await this.ensureAuthenticated();
      try {
        const { data: result, error } = await this.supabaseClient
          .from('banks')
          .update({ initial_balance: novoSaldo })
          .eq('id', id)
          .select('*')
          .single();

        if (error) this.handleError(error, 'bancos.atualizarSaldo');
        return result;
      } catch (error) {
        this.handleError(error, 'bancos.atualizarSaldo');
      }
    }
  };

  dashboard = {
    getSummary: async (): Promise<DashboardSummary> => {
      await this.ensureAuthenticated();
      try {
        const hoje = new Date().toISOString().split('T')[0];
        const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

        // Buscar todas as contas a pagar
        const { data: contasPagar, error: errorPagar } = await this.supabaseClient
          .from('accounts_payable')
          .select('amount, status, due_date, paid_at');

        if (errorPagar) this.handleError(errorPagar, 'dashboard.getSummary.contasPagar');

        // Buscar todas as contas a receber
        const { data: contasReceber, error: errorReceber } = await this.supabaseClient
          .from('accounts_receivable')
          .select('amount, status, due_date, received_at');

        if (errorReceber) this.handleError(errorReceber, 'dashboard.getSummary.contasReceber');

        // Buscar saldo total dos bancos
        const { data: bancos, error: errorBancos } = await this.supabaseClient
          .from('banks')
          .select('initial_balance');

        if (errorBancos) this.handleError(errorBancos, 'dashboard.getSummary.bancos');

        const saldo_total = bancos?.reduce((total, banco) => total + Number(banco.initial_balance || 0), 0) || 0;

        // Calcular estatísticas das contas a pagar
        const contasPagarData = contasPagar || [];
        const pendentes = contasPagarData.filter(c => c.status === 'pending').length;
        const valor_pendente = contasPagarData.filter(c => c.status === 'pending').reduce((total, c) => total + Number(c.amount), 0);
        const vencidas = contasPagarData.filter(c => c.status === 'pending' && c.due_date < hoje).length;
        const valor_vencido = contasPagarData.filter(c => c.status === 'pending' && c.due_date < hoje).reduce((total, c) => total + Number(c.amount), 0);
        const pagas_mes = contasPagarData.filter(c => c.status === 'paid' && c.paid_at >= inicioMes && c.paid_at <= fimMes).length;
        const valor_pago_mes = contasPagarData.filter(c => c.status === 'paid' && c.paid_at >= inicioMes && c.paid_at <= fimMes).reduce((total, c) => total + Number(c.amount), 0);

        // Calcular estatísticas das contas a receber
        const contasReceberData = contasReceber || [];
        const pendentesReceber = contasReceberData.filter(c => c.status === 'pending').length;
        const valor_pendente_receber = contasReceberData.filter(c => c.status === 'pending').reduce((total, c) => total + Number(c.amount), 0);
        const vencidas_receber = contasReceberData.filter(c => c.status === 'pending' && c.due_date < hoje).length;
        const valor_vencido_receber = contasReceberData.filter(c => c.status === 'pending' && c.due_date < hoje).reduce((total, c) => total + Number(c.amount), 0);
        const recebidas_mes = contasReceberData.filter(c => c.status === 'received' && c.received_at >= inicioMes && c.received_at <= fimMes).length;
        const valor_recebido_mes = contasReceberData.filter(c => c.status === 'received' && c.received_at >= inicioMes && c.received_at <= fimMes).reduce((total, c) => total + Number(c.amount), 0);

        return {
          saldo_total,
          contas_pagar: {
            pendentes,
            valor_pendente,
            vencidas,
            valor_vencido,
            pagas_mes,
            valor_pago_mes
          },
          contas_receber: {
            pendentes: pendentesReceber,
            valor_pendente: valor_pendente_receber,
            vencidas: vencidas_receber,
            valor_vencido: valor_vencido_receber,
            recebidas_mes,
            valor_recebido_mes
          }
        };
      } catch (error) {
        this.handleError(error, 'dashboard.getSummary');
      }
    }
  };

  utils = {
    exportarDados: async () => new Blob(),
    importarDados: async () => ({ total: 0, sucesso: 0, erros: 0 }),
    limparCache: async () => {},
    verificarConexao: async () => true,
    resetAllData: () => {}
  };

  // ============ BANK ACCOUNTS ============
  bankAccounts = {
    getByBankId: async (bankId: number) => {
      return [];
    },
    
    create: async (data: any) => {
      return { id: '1', ...data };
    },
    
    transferBetweenAccounts: async (from: string, to: string, amount: number) => {
      return Promise.resolve();
    }
  };

  // ============ TRANSAÇÕES ============
  transactions = {
    getAll: async (filtros?: any) => {
      return [];
    },
    
    getById: async (id: string | number) => {
      return null;
    },
    
    create: async (data: any) => {
      return { id: '1', ...data };
    },
    
    update: async (id: string | number, data: any) => {
      return { id, ...data };
    },
    
    delete: async (id: string | number) => {
      return Promise.resolve();
    },
    
    getExtrato: async (accountId: string, periodo: { inicio: Date; fim: Date }) => {
      return {
        transacoes: [],
        saldoInicial: 0,
        saldoFinal: 0,
        totalEntradas: 0,
        totalSaidas: 0
      };
    },
    
    getByAccount: async (accountId: string, limit?: number) => {
      return [];
    }
  };
}