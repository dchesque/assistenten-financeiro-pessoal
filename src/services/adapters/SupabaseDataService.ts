// Stub para SupabaseDataService - será implementado na próxima fase
import { IDataService } from '../interfaces/IDataService';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DATABASE_CONFIG } from '@/config/database.config';

export class SupabaseDataService implements IDataService {
  private supabase: SupabaseClient;
  
  constructor() {
    // Inicializar cliente Supabase
    this.supabase = createClient(
      DATABASE_CONFIG.SUPABASE_URL,
      DATABASE_CONFIG.SUPABASE_ANON_KEY
    );
    
    if (DATABASE_CONFIG.ENABLE_LOGGING) {
      console.warn('🚀 SupabaseDataService inicializado');
    }
  }
  
  // ============ AUTENTICAÇÃO ============
  auth = {
    signInWithPhone: async (phone: string) => {
      // TODO: Implementar com Supabase Auth
      throw new Error('🚧 Supabase Auth não implementado ainda - usar MockDataService');
    },
    
    verifyOTP: async (phone: string, code: string) => {
      throw new Error('🚧 Supabase Auth não implementado ainda - usar MockDataService');
    },
    
    signIn: async (email: string, password: string) => {
      throw new Error('🚧 Supabase Auth não implementado ainda - usar MockDataService');
    },
    
    signUp: async (email: string, password: string, userData?: { nome?: string }) => {
      throw new Error('🚧 Supabase Auth não implementado ainda - usar MockDataService');
    },
    
    signOut: async () => {
      throw new Error('🚧 Supabase Auth não implementado ainda - usar MockDataService');
    },
    
    getCurrentUser: async () => {
      throw new Error('🚧 Supabase Auth não implementado ainda - usar MockDataService');
    },
    
    getSession: () => {
      throw new Error('🚧 Supabase Auth não implementado ainda - usar MockDataService');
    },
    
    updateProfile: async (userId: string, data: any) => {
      throw new Error('🚧 Supabase Auth não implementado ainda - usar MockDataService');
    }
  };
  
  // ============ CONTAS A PAGAR ============
  contasPagar = {
    getAll: async (filtros?: any) => {
      throw new Error('🚧 Supabase CRUD não implementado ainda - usar MockDataService');
    },
    
    getById: async (id: string | number) => {
      throw new Error('🚧 Supabase CRUD não implementado ainda - usar MockDataService');
    },
    
    create: async (data: any) => {
      throw new Error('🚧 Supabase CRUD não implementado ainda - usar MockDataService');
    },
    
    update: async (id: string | number, data: any) => {
      throw new Error('🚧 Supabase CRUD não implementado ainda - usar MockDataService');
    },
    
    delete: async (id: string | number) => {
      throw new Error('🚧 Supabase CRUD não implementado ainda - usar MockDataService');
    },
    
    getByVencimento: async (dataInicio: Date, dataFim: Date) => {
      throw new Error('🚧 Supabase CRUD não implementado ainda - usar MockDataService');
    },
    
    getByStatus: async (status: string) => {
      throw new Error('🚧 Supabase CRUD não implementado ainda - usar MockDataService');
    },
    
    marcarComoPaga: async (id: string | number, dataPagamento: Date, valorPago?: number) => {
      throw new Error('🚧 Supabase CRUD não implementado ainda - usar MockDataService');
    }
  };
  
  // ============ CONTAS A RECEBER ============
  contasReceber = {
    getAll: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    getById: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    create: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    update: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    delete: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    getByVencimento: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    getByStatus: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    marcarComoRecebida: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); }
  };
  
  // ============ FORNECEDORES/CONTATOS ============
  fornecedores = {
    getAll: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    getById: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    create: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    update: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    delete: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    getAtivos: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    buscarPorDocumento: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); }
  };
  
  // ============ CATEGORIAS ============
  categorias = {
    getAll: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    getById: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    create: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    update: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    delete: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    getByTipo: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); }
  };
  
  // ============ BANCOS ============
  bancos = {
    getAll: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    getById: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    create: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    update: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    delete: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    atualizarSaldo: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); }
  };
  
  // ============ DASHBOARD ============
  dashboard = {
    getSummary: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); }
  };
  
  // ============ UTILITÁRIOS ============
  utils = {
    exportarDados: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    importarDados: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    limparCache: async () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); },
    verificarConexao: async () => { 
      try {
        // Verificar conexão básica com Supabase
        const { data, error } = await this.supabase.from('profiles').select('count').limit(1);
        return !error;
      } catch {
        return false;
      }
    },
    resetAllData: () => { throw new Error('🚧 Não implementado ainda - usar MockDataService'); }
  };
}