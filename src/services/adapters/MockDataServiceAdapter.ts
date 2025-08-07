// Adaptador para MockDataService - mantém compatibilidade total
import { IDataService } from '../interfaces/IDataService';
import { mockDataService } from '../mockDataService';
import type { 
  ContaPagar, 
  Categoria, 
  Banco,
  Fornecedor
} from '@/types';
import type { ContaReceber } from '@/types/contaReceber';

export class MockDataServiceAdapter implements IDataService {
  private mockService = mockDataService;
  
  constructor() {
    // MockDataService já inicializa automaticamente
  }
  
  // ============ AUTENTICAÇÃO ============
  auth = {
    signInWithPhone: async (phone: string) => {
      return { success: true, message: 'Mock login com telefone' };
    },
    
    verifyOTP: async (phone: string, code: string) => {
      return this.mockService.signIn('mock@test.com', '123456');
    },
    
    signIn: async (email: string, password: string) => {
      return this.mockService.signIn(email, password);
    },
    
    signUp: async (email: string, password: string, userData?: { nome?: string }) => {
      return this.mockService.signUp(email, password, userData);
    },
    
    signOut: async () => {
      return this.mockService.signOut();
    },
    
    getCurrentUser: async () => {
      const session = this.mockService.getSession();
      return session ? session.user : null;
    },
    
    getSession: () => {
      return this.mockService.getSession();
    },
    
    updateProfile: async (userId: string, data: any) => {
      // Mock implementation
      const session = this.mockService.getSession();
      if (session) {
        return { ...session.user, ...data };
      }
      throw new Error('Usuário não encontrado');
    }
  };
  
  // ============ CONTAS A PAGAR ============
  contasPagar = {
    getAll: async (filtros?: any) => {
      return this.mockService.getContasPagar() as any;
    },
    
    getById: async (id: string | number) => {
      const contas = await this.mockService.getContasPagar();
      return contas.find(conta => conta.id === Number(id)) || null;
    },
    
    create: async (data: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>) => {
      return this.mockService.createContaPagar(data);
    },
    
    update: async (id: string | number, data: Partial<ContaPagar>) => {
      return this.mockService.updateContaPagar(Number(id), data);
    },
    
    delete: async (id: string | number) => {
      return this.mockService.deleteContaPagar(Number(id));
    },
    
    getByVencimento: async (dataInicio: Date, dataFim: Date) => {
      const todas = await this.mockService.getContasPagar();
      return todas.filter(conta => {
        const vencimento = new Date(conta.data_vencimento);
        return vencimento >= dataInicio && vencimento <= dataFim;
      });
    },
    
    getByStatus: async (status: string) => {
      const todas = await this.mockService.getContasPagar();
      return todas.filter(conta => conta.status === status);
    },
    
    marcarComoPaga: async (id: string | number, dataPagamento: Date, valorPago?: number) => {
      const conta = await this.contasPagar.getById(id);
      if (!conta) {
        throw new Error('Conta não encontrada');
      }
      
      return this.mockService.updateContaPagar(Number(id), {
        status: 'pago',
        data_pagamento: dataPagamento.toISOString(),
        valor_final: valorPago || conta.valor_final
      });
    }
  };
  
  // ============ CONTAS A RECEBER ============
  contasReceber = {
    getAll: async (filtros?: any) => {
      return this.mockService.getContasReceber(filtros);
    },
    
    getById: async (id: string | number) => {
      const contas = await this.mockService.getContasReceber();
      return contas.find(conta => conta.id === Number(id)) || null;
    },
    
    create: async (data: Omit<ContaReceber, 'id' | 'created_at' | 'updated_at'>) => {
      return this.mockService.createContaReceber(data);
    },
    
    update: async (id: string | number, data: Partial<ContaReceber>) => {
      return this.mockService.updateContaReceber(Number(id), data);
    },
    
    delete: async (id: string | number) => {
      return this.mockService.deleteContaReceber(Number(id));
    },
    
    getByVencimento: async (dataInicio: Date, dataFim: Date) => {
      const todas = await this.mockService.getContasReceber();
      return todas.filter(conta => {
        const vencimento = new Date(conta.data_vencimento);
        return vencimento >= dataInicio && vencimento <= dataFim;
      });
    },
    
    getByStatus: async (status: string) => {
      const todas = await this.mockService.getContasReceber();
      return todas.filter(conta => conta.status === status);
    },
    
    marcarComoRecebida: async (id: string | number, dataRecebimento: Date, valorRecebido?: number) => {
      const conta = await this.contasReceber.getById(id);
      if (!conta) {
        throw new Error('Conta não encontrada');
      }
      
      return this.mockService.updateContaReceber(Number(id), {
        status: 'recebido',
        data_recebimento: dataRecebimento.toISOString(),
        valor_final: valorRecebido || conta.valor_final
      });
    }
  };
  
  // ============ FORNECEDORES/CONTATOS ============
  fornecedores = {
    getAll: async (filtros?: any) => {
      return this.mockService.getContatos(filtros);
    },
    
    getById: async (id: number) => {
      const contatos = await this.mockService.getContatos();
      return contatos.find(contato => contato.id === id) || null;
    },
    
    create: async (data: Omit<Fornecedor, 'id' | 'dataCadastro' | 'totalCompras' | 'valorTotal'>) => {
      return this.mockService.createContato({
        ...data,
        dataCadastro: new Date().toISOString(),
        totalCompras: 0,
        valorTotal: 0
      });
    },
    
    update: async (id: number, data: Partial<Fornecedor>) => {
      return this.mockService.updateContato(id, data);
    },
    
    delete: async (id: number) => {
      return this.mockService.deleteContato(id);
    },
    
    getAtivos: async () => {
      const todos = await this.mockService.getContatos();
      return todos.filter(contato => contato.ativo);
    },
    
    buscarPorDocumento: async (documento: string) => {
      const todos = await this.mockService.getContatos();
      return todos.find(contato => contato.documento === documento) || null;
    }
  };
  
  // ============ CATEGORIAS ============
  categorias = {
    getAll: async (filtros?: any) => {
      return this.mockService.getCategorias(filtros);
    },
    
    getById: async (id: string | number) => {
      const categorias = await this.mockService.getCategorias();
      return categorias.find(categoria => categoria.id === String(id)) || null;
    },
    
    create: async (data: Omit<Categoria, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      return this.mockService.createCategoria(data);
    },
    
    update: async (id: string | number, data: Partial<Categoria>) => {
      return this.mockService.updateCategoria(String(id), data);
    },
    
    delete: async (id: string | number) => {
      return this.mockService.deleteCategoria(String(id));
    },
    
    getByTipo: async (tipo: 'receita' | 'despesa') => {
      const todas = await this.mockService.getCategorias();
      return todas.filter(categoria => categoria.tipo === tipo);
    }
  };
  
  // ============ BANCOS ============
  bancos = {
    getAll: async () => {
      return this.mockService.getBancos();
    },
    
    getById: async (id: number) => {
      const bancos = await this.mockService.getBancos();
      return bancos.find(banco => banco.id === id) || null;
    },
    
    create: async (data: Omit<Banco, 'id' | 'created_at' | 'updated_at'>) => {
      return this.mockService.createBanco(data);
    },
    
    update: async (id: number, data: Partial<Banco>) => {
      return this.mockService.updateBanco(id, data);
    },
    
    delete: async (id: number) => {
      return this.mockService.deleteBanco(id);
    },
    
    atualizarSaldo: async (id: number, novoSaldo: number) => {
      return this.mockService.updateBanco(id, { saldo_atual: novoSaldo });
    }
  };
  
  // ============ DASHBOARD ============
  dashboard = {
    getSummary: async () => {
      return this.mockService.getDashboardSummary();
    }
  };
  
  // ============ UTILITÁRIOS ============
  utils = {
    exportarDados: async (tabela: string, formato: 'json' | 'csv') => {
      // Implementar exportação mock se necessário
      throw new Error('Exportação não implementada no MockDataService');
    },
    
    importarDados: async (tabela: string, arquivo: File) => {
      // Implementar importação mock se necessário
      throw new Error('Importação não implementada no MockDataService');
    },
    
    limparCache: async () => {
      // Mock não tem cache específico
      return Promise.resolve();
    },
    
    verificarConexao: async () => {
      // Mock sempre está "conectado"
      return Promise.resolve(true);
    },
    
    resetAllData: () => {
      this.mockService.resetAllData();
    }
  };
}