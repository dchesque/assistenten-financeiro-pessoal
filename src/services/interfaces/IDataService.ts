// Interface unificada para abstração de dados
import type { 
  ContaPagar, 
  Categoria, 
  Banco,
  Fornecedor
} from '@/types';
import type { ContaReceber } from '@/types/contaReceber';

export interface User {
  id: string;
  email?: string;
  nome?: string;
  telefone?: string;
  documento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  user: User;
  access_token: string;
  expires_at?: number;
}

export interface DashboardSummary {
  saldo_total: number;
  contas_pagar: {
    pendentes: number;
    valor_pendente: number;
    vencidas: number;
    valor_vencido: number;
    pagas_mes: number;
    valor_pago_mes: number;
  };
  contas_receber: {
    pendentes: number;
    valor_pendente: number;
    vencidas: number;
    valor_vencido: number;
    recebidas_mes: number;
    valor_recebido_mes: number;
  };
}

export interface IDataService {
  // ============ AUTENTICAÇÃO ============
  auth: {
    signInWithPhone(phone: string): Promise<{ success: boolean; message?: string }>;
    verifyOTP(phone: string, code: string): Promise<Session>;
    signIn(email: string, password: string): Promise<Session>;
    signUp(email: string, password: string, userData?: { nome?: string }): Promise<Session>;
    signOut(): Promise<void>;
    getCurrentUser(): Promise<User | null>;
    getSession(): Session | null;
    updateProfile(userId: string, data: Partial<User>): Promise<User>;
  };

  // ============ CONTAS A PAGAR ============
  contasPagar: {
    getAll(filtros?: any): Promise<ContaPagar[]>;
    getById(id: string | number): Promise<ContaPagar | null>;
    create(data: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>): Promise<ContaPagar>;
    update(id: string | number, data: Partial<ContaPagar>): Promise<ContaPagar>;
    delete(id: string | number): Promise<void>;
    getByVencimento(dataInicio: Date, dataFim: Date): Promise<ContaPagar[]>;
    getByStatus(status: string): Promise<ContaPagar[]>;
    marcarComoPaga(id: string | number, dataPagamento: Date, valorPago?: number): Promise<ContaPagar>;
  };

  // ============ CONTAS A RECEBER ============
  contasReceber: {
    getAll(filtros?: any): Promise<ContaReceber[]>;
    getById(id: string | number): Promise<ContaReceber | null>;
    create(data: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at'>): Promise<ContaReceber>;
    update(id: string | number, data: Partial<ContaReceber>): Promise<ContaReceber>;
    delete(id: string | number): Promise<void>;
    getByVencimento(dataInicio: Date, dataFim: Date): Promise<ContaReceber[]>;
    getByStatus(status: string): Promise<ContaReceber[]>;
    marcarComoRecebida(id: string | number, dataRecebimento: Date, valorRecebido?: number): Promise<ContaReceber>;
  };

  // ============ FORNECEDORES/CONTATOS ============
  fornecedores: {
    getAll(filtros?: any): Promise<Fornecedor[]>;
    getById(id: number): Promise<Fornecedor | null>;
    create(data: Omit<Fornecedor, 'id' | 'dataCadastro' | 'totalCompras' | 'valorTotal'>): Promise<Fornecedor>;
    update(id: number, data: Partial<Fornecedor>): Promise<Fornecedor>;
    delete(id: number): Promise<void>;
    getAtivos(): Promise<Fornecedor[]>;
    buscarPorDocumento(documento: string): Promise<Fornecedor | null>;
  };

  // ============ CATEGORIAS ============
  categorias: {
    getAll(filtros?: any): Promise<Categoria[]>;
    getById(id: string | number): Promise<Categoria | null>;
    create(data: Omit<Categoria, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Categoria>;
    update(id: string | number, data: Partial<Categoria>): Promise<Categoria>;
    delete(id: string | number): Promise<void>;
    getByTipo(tipo: 'receita' | 'despesa'): Promise<Categoria[]>;
  };

  // ============ BANCOS ============
  bancos: {
    getAll(): Promise<Banco[]>;
    getById(id: number): Promise<Banco | null>;
    create(data: Omit<Banco, 'id' | 'created_at' | 'updated_at'>): Promise<Banco>;
    update(id: number, data: Partial<Banco>): Promise<Banco>;
    delete(id: number): Promise<void>;
    atualizarSaldo(id: number, novoSaldo: number): Promise<Banco>;
  };

  // ============ DASHBOARD ============
  dashboard: {
    getSummary(): Promise<DashboardSummary>;
  };

  // ============ UTILITÁRIOS ============
  utils: {
    exportarDados(tabela: string, formato: 'json' | 'csv'): Promise<Blob>;
    importarDados(tabela: string, arquivo: File): Promise<{ total: number; sucesso: number; erros: number }>;
    limparCache(): Promise<void>;
    verificarConexao(): Promise<boolean>;
    resetAllData(): void;
  };
}