// Adaptador simplificado para MockDataService
import { IDataService } from '../interfaces/IDataService';
import { mockDataService } from '../mockDataService';

export class MockDataServiceAdapter implements IDataService {
  private mockService = mockDataService;
  
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
      const contas = await this.mockService.getContasPagar();
      return contas.map(conta => ({ ...conta, id: Number(conta.id) })) as any;
    },
    
    getById: async (id: string | number) => {
      const contas = await this.mockService.getContasPagar();
      const conta = contas.find(c => c.id === String(id));
      return conta ? { ...conta, id: Number(conta.id) } as any : null;
    },
    
    create: async (data: any) => {
      const conta = await this.mockService.createContaPagar(data as any);
      return { ...conta, id: Number(conta.id) } as any;
    },
    
    update: async (id: string | number, data: any) => {
      const conta = await this.mockService.updateContaPagar(String(id), data as any);
      return { ...conta, id: Number(conta.id) } as any;
    },
    
    delete: async (id: string | number) => {
      await this.mockService.deleteContaPagar(String(id));
    },
    
    getByVencimento: async (dataInicio: Date, dataFim: Date) => {
      const todas = await this.mockService.getContasPagar();
      return todas.filter(conta => {
        const vencimento = new Date(conta.data_vencimento);
        return vencimento >= dataInicio && vencimento <= dataFim;
      }).map(conta => ({ ...conta, id: Number(conta.id) })) as any;
    },
    
    getByStatus: async (status: string) => {
      const todas = await this.mockService.getContasPagar();
      return todas.filter(conta => conta.status === status)
        .map(conta => ({ ...conta, id: Number(conta.id) })) as any;
    },
    
    marcarComoPaga: async (id: string | number, dados: { dataPagamento: Date; valorPago?: number; bankAccountId?: string; observacoes?: string; }) => {
      const conta = await this.mockService.updateContaPagar(String(id), {
        status: 'pago',
        data_pagamento: dados.dataPagamento.toISOString(),
        valor_final: dados.valorPago,
        bank_account_id: dados.bankAccountId,
        observacoes: dados.observacoes
      } as any);
      return { ...conta, id: Number(conta.id) } as any;
    }
  };
  
  // ============ CONTAS A RECEBER ============
  contasReceber = {
    getAll: async (filtros?: any) => {
      return this.mockService.getContasReceber() as any;
    },
    
    getById: async (id: string | number) => {
      const contas = await this.mockService.getContasReceber();
      return contas.find(conta => conta.id === String(id)) as any || null;
    },
    
    create: async (data: any) => {
      return this.mockService.createContaReceber(data as any) as any;
    },
    
    update: async (id: string | number, data: any) => {
      return this.mockService.updateContaReceber(String(id), data as any) as any;
    },
    
    delete: async (id: string | number) => {
      await this.mockService.deleteContaReceber(String(id));
    },
    
    getByVencimento: async (dataInicio: Date, dataFim: Date) => {
      const todas = await this.mockService.getContasReceber();
      return todas.filter(conta => {
        const vencimento = new Date(conta.data_vencimento);
        return vencimento >= dataInicio && vencimento <= dataFim;
      }) as any;
    },
    
    getByStatus: async (status: string) => {
      const todas = await this.mockService.getContasReceber();
      return todas.filter(conta => conta.status === status) as any;
    },
    
    marcarComoRecebida: async (id: string | number, dataRecebimento: Date, valorRecebido?: number) => {
      return this.mockService.updateContaReceber(String(id), {
        status: 'recebido',
        data_recebimento: dataRecebimento.toISOString(),
        valor: valorRecebido
      } as any) as any;
    }
  };
  
  // ============ FORNECEDORES/CONTATOS ============
  fornecedores = {
    getAll: async (filtros?: any) => {
      return this.mockService.getContatos() as any;
    },
    
    getById: async (id: number) => {
      const contatos = await this.mockService.getContatos();
      return contatos.find(contato => contato.id === String(id)) as any || null;
    },
    
    create: async (data: any) => {
      return this.mockService.createContato(data as any) as any;
    },
    
    update: async (id: number, data: any) => {
      return this.mockService.updateContato(String(id), data as any) as any;
    },
    
    delete: async (id: number) => {
      await this.mockService.deleteContato(String(id));
    },
    
    getAtivos: async () => {
      const todos = await this.mockService.getContatos();
      return todos.filter(contato => contato.ativo) as any;
    },
    
    buscarPorDocumento: async (documento: string) => {
      const todos = await this.mockService.getContatos();
      return todos.find(contato => contato.documento === documento) as any || null;
    }
  };
  
  // ============ CATEGORIAS ============
  categorias = {
    getAll: async (filtros?: any) => {
      return this.mockService.getCategorias() as any;
    },
    
    getById: async (id: string | number) => {
      const categorias = await this.mockService.getCategorias();
      return categorias.find(categoria => categoria.id === String(id)) as any || null;
    },
    
    create: async (data: any) => {
      return this.mockService.createCategoria(data as any) as any;
    },
    
    update: async (id: string | number, data: any) => {
      return this.mockService.updateCategoria(String(id), data as any) as any;
    },
    
    delete: async (id: string | number) => {
      await this.mockService.deleteCategoria(String(id));
    },
    
    getByTipo: async (tipo: 'receita' | 'despesa') => {
      const todas = await this.mockService.getCategorias();
      return todas.filter(categoria => categoria.tipo === tipo) as any;
    }
  };
  
  // ============ BANCOS ============
  bancos = {
    getAll: async () => {
      return this.mockService.getBancos() as any;
    },
    
    getById: async (id: number) => {
      const bancos = await this.mockService.getBancos();
      return bancos.find(banco => banco.id === String(id)) as any || null;
    },
    
    create: async (data: any) => {
      return this.mockService.createBanco(data as any) as any;
    },
    
    update: async (id: number, data: any) => {
      return this.mockService.updateBanco(String(id), data as any) as any;
    },
    
    delete: async (id: number) => {
      await this.mockService.deleteBanco(String(id));
    },
    
    atualizarSaldo: async (id: number, novoSaldo: number) => {
      return this.mockService.updateBanco(String(id), { saldo_atual: novoSaldo } as any) as any;
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
      throw new Error('Exportação não implementada no MockDataService');
    },
    
    importarDados: async (tabela: string, arquivo: File) => {
      throw new Error('Importação não implementada no MockDataService');
    },
    
    limparCache: async () => {
      return Promise.resolve();
    },
    
    verificarConexao: async () => {
      return Promise.resolve(true);
    },
    
    resetAllData: () => {
      this.mockService.resetAllData();
    }
  };
}