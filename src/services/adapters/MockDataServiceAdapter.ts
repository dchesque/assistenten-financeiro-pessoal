// Adaptador para MockDataService que implementa IDataService
import { IDataService, DashboardSummary } from '../interfaces/IDataService';

export class MockDataServiceAdapter implements IDataService {
  
  // ============ AUTH ============
  auth = {
    signIn: async (email: string, password: string) => {
      return {
        user: { id: '1', email, name: 'Mock User', phone: '11999999999' },
        access_token: 'mock_token',
        refresh_token: 'mock_refresh',
        expires_at: Date.now() + 3600000
      };
    },

    signUp: async (email: string, password: string, userData?: any) => {
      return {
        id: '1',
        email,
        name: userData?.name || 'Mock User',
        phone: userData?.phone
      };
    },

    signOut: async () => {},

    verifyOTP: async (email: string, token: string) => {
      return {
        user: { id: '1', email, name: 'Mock User', phone: '11999999999' },
        access_token: 'mock_token',
        refresh_token: 'mock_refresh',
        expires_at: Date.now() + 3600000
      };
    },

    resendOTP: async (email: string) => {},

    updateProfile: async (data: any) => {
      return {
        id: '1',
        email: 'mock@test.com',
        name: data.name || 'Mock User',
        phone: data.phone
      };
    },

    getCurrentUser: async () => {
      return {
        id: '1',
        email: 'mock@test.com',
        name: 'Mock User',
        phone: '11999999999'
      };
    }
  };

  // ============ CONTAS A PAGAR ============
  contasPagar = {
    getAll: async () => [],
    getById: async (id: string) => null,
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {},
    getByVencimento: async (dataInicio: string, dataFim: string) => [],
    getByStatus: async (status: string) => [],
    marcarComoPaga: async (id: string, dados: any) => ({ id, ...dados })
  };

  // ============ CONTAS A RECEBER ============
  contasReceber = {
    getAll: async () => [],
    getById: async (id: string) => null,
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {},
    getByVencimento: async (dataInicio: string, dataFim: string) => [],
    getByStatus: async (status: string) => [],
    marcarComoRecebida: async (id: string, dataRecebimento: string) => ({ id })
  };

  // ============ FORNECEDORES ============
  fornecedores = {
    getAll: async () => [],
    getById: async (id: string) => null,
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {}
  };

  // ============ CONTATOS ============
  contatos = {
    getAll: async () => [],
    getById: async (id: string) => null,
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {}
  };

  // ============ CATEGORIAS ============
  categorias = {
    getAll: async () => [],
    getById: async (id: string) => null,
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {}
  };

  // ============ BANCOS ============
  bancos = {
    getAll: async () => [],
    getById: async (id: string) => null,
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {}
  };

  // ============ BANK ACCOUNTS ============
  bankAccounts = {
    getAll: async () => [],
    create: async (bankId: string, data: any) => ({ id: '1', ...data }),
    transfer: async (fromAccountId: string, toAccountId: string, amount: number, description: string) => {}
  };

  // ============ TRANSACTIONS ============
  transactions = {
    getAll: async () => [],
    create: async (data: any) => ({ id: '1', ...data }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {},
    getStatement: async (accountId: string, startDate: Date, endDate: Date) => []
  };

  // ============ DASHBOARD ============
  dashboard = {
    getSummary: async (): Promise<DashboardSummary> => ({
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
    })
  };

  // ============ UTILS ============
  utils = {
    exportData: async (format: 'json' | 'csv') => new Blob(),
    importData: async (file: File) => ({ success: true, message: 'Mock import' }),
    clearCache: async () => {},
    checkConnection: async () => true,
    resetData: async () => {}
  };
}