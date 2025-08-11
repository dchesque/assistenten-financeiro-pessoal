import { v4 as uuidv4 } from 'uuid';

// Base para todas as entidades
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Interfaces principais
export interface ContaPagar extends BaseEntity {
  fornecedor_id: string;
  plano_conta_id: string;
  banco_id?: string;
  documento_referencia?: string;
  descricao: string;
  data_emissao?: string;
  data_vencimento: string;
  valor_original: number;
  percentual_juros?: number;
  valor_juros?: number;
  percentual_desconto?: number;
  valor_desconto?: number;
  valor_final: number;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  data_pagamento?: string;
  valor_pago?: number;
  grupo_lancamento?: string;
  parcela_atual: number;
  total_parcelas: number;
  forma_pagamento: string;
  dda: boolean;
  observacoes?: string;
}

export interface ContaReceber extends BaseEntity {
  cliente_id: string;
  categoria_id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_recebimento?: string;
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado';
  forma_recebimento?: string;
  observacoes?: string;
}

export interface Categoria extends BaseEntity {
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone: string;
  ativo: boolean;
}

export interface Contato extends BaseEntity {
  nome: string;
  tipo: 'credor' | 'pagador';
  documento: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  ativo: boolean;
}

export interface Banco extends BaseEntity {
  nome: string;
  codigo_banco: string;
  agencia?: string;
  conta?: string;
  digito_verificador: string;
  tipo_conta: 'conta_corrente' | 'poupanca' | 'conta_salario';
  saldo_inicial: number;
  saldo_atual: number;
  limite?: number;
  limite_usado: number;
  suporta_ofx: boolean;
  url_ofx?: string;
  ultimo_fitid?: string;
  data_ultima_sincronizacao?: string;
  gerente?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  ativo: boolean;
}

export interface Usuario {
  id: string;
  email: string;
  nome?: string;
  created_at: string;
}

export interface Sessao {
  user: Usuario;
  access_token: string;
}

class MockDataService {
  private static instance: MockDataService;
  private readonly prefix = 'jc_financeiro_';
  private currentUser: Usuario | null = null;

  private constructor() {
    this.initializeData();
  }

  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  // Simulação de latência de rede
  private async simulateLatency(min = 100, max = 500): Promise<void> {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const secureRandom = array[0] / (0xFFFFFFFF + 1);
    const delay = secureRandom * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Utilitários de localStorage
  private getStorageKey(entity: string): string {
    return `${this.prefix}${entity}`;
  }

  private getData<T>(entity: string): T[] {
    const key = this.getStorageKey(entity);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private setData<T>(entity: string, data: T[]): void {
    const key = this.getStorageKey(entity);
    localStorage.setItem(key, JSON.stringify(data));
  }

  private createEntity<T extends BaseEntity>(entity: string, data: Omit<T, keyof BaseEntity>): T {
    const now = new Date().toISOString();
    const newEntity = {
      ...data,
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      user_id: this.currentUser?.id || 'mock-user'
    } as T;

    const existingData = this.getData<T>(entity);
    existingData.push(newEntity);
    this.setData(entity, existingData);

    return newEntity;
  }

  private updateEntity<T extends BaseEntity>(entity: string, id: string, updates: Partial<T>): T | null {
    const data = this.getData<T>(entity);
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) return null;

    const updatedEntity = {
      ...data[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    data[index] = updatedEntity;
    this.setData(entity, data);

    return updatedEntity;
  }

  private deleteEntity(entity: string, id: string): boolean {
    const data = this.getData(entity);
    const index = data.findIndex((item: any) => item.id === id);
    
    if (index === -1) return false;

    data.splice(index, 1);
    this.setData(entity, data);
    return true;
  }

  // Inicialização de dados de exemplo
  private initializeData(): void {
    // Verificar se já existem dados
    if (localStorage.getItem(this.getStorageKey('initialized'))) {
      return;
    }

    const now = new Date().toISOString();
    const userId = 'mock-user-id';

    // Categorias de exemplo
    const categorias: Categoria[] = [
      {
        id: uuidv4(),
        nome: 'Alimentação',
        tipo: 'despesa',
        cor: '#ef4444',
        icone: 'Utensils',
        ativo: true,
        created_at: now,
        updated_at: now,
        user_id: userId
      },
      {
        id: uuidv4(),
        nome: 'Transporte',
        tipo: 'despesa',
        cor: '#3b82f6',
        icone: 'Car',
        ativo: true,
        created_at: now,
        updated_at: now,
        user_id: userId
      },
      {
        id: uuidv4(),
        nome: 'Moradia',
        tipo: 'despesa',
        cor: '#f59e0b',
        icone: 'Home',
        ativo: true,
        created_at: now,
        updated_at: now,
        user_id: userId
      },
      {
        id: uuidv4(),
        nome: 'Salário',
        tipo: 'receita',
        cor: '#10b981',
        icone: 'DollarSign',
        ativo: true,
        created_at: now,
        updated_at: now,
        user_id: userId
      },
      {
        id: uuidv4(),
        nome: 'Freelance',
        tipo: 'receita',
        cor: '#8b5cf6',
        icone: 'Briefcase',
        ativo: true,
        created_at: now,
        updated_at: now,
        user_id: userId
      }
    ];

    // Contatos de exemplo
    const contatos: Contato[] = [
      {
        id: uuidv4(),
        nome: 'Supermercado Central',
        tipo: 'credor',
        documento: '12.345.678/0001-90',
        email: 'contato@supercentral.com.br',
        telefone: '(11) 99999-0001',
        ativo: true,
        created_at: now,
        updated_at: now,
        user_id: userId
      },
      {
        id: uuidv4(),
        nome: 'João Silva',
        tipo: 'pagador',
        documento: '123.456.789-00',
        email: 'joao.silva@email.com',
        telefone: '(11) 99999-0002',
        ativo: true,
        created_at: now,
        updated_at: now,
        user_id: userId
      }
    ];

    // Bancos de exemplo
    const bancos: Banco[] = [
      {
        id: uuidv4(),
        nome: 'Banco do Brasil',
        codigo_banco: '001',
        agencia: '1234-5',
        conta: '12345-6',
        digito_verificador: '6',
        tipo_conta: 'conta_corrente',
        saldo_inicial: 5000,
        saldo_atual: 5000,
        limite: 1000,
        limite_usado: 0,
        suporta_ofx: true,
        ativo: true,
        created_at: now,
        updated_at: now,
        user_id: userId
      },
      {
        id: uuidv4(),
        nome: 'Nubank',
        codigo_banco: '260',
        digito_verificador: '0',
        tipo_conta: 'conta_corrente',
        saldo_inicial: 0,
        saldo_atual: 0,
        limite: 2000,
        limite_usado: 0,
        suporta_ofx: false,
        ativo: true,
        created_at: now,
        updated_at: now,
        user_id: userId
      }
    ];

    // Contas a pagar de exemplo
    const hoje = new Date();
    const contasPagar: ContaPagar[] = [
      {
        id: uuidv4(),
        fornecedor_id: contatos[0].id,
        plano_conta_id: categorias[0].id,
        descricao: 'Compras do mês',
        valor_original: 350.00,
        valor_final: 350.00,
        data_vencimento: new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pendente',
        forma_pagamento: 'PIX',
        parcela_atual: 1,
        total_parcelas: 1,
        dda: false,
        created_at: now,
        updated_at: now,
        user_id: userId
      },
      {
        id: uuidv4(),
        fornecedor_id: contatos[0].id,
        plano_conta_id: categorias[2].id,
        descricao: 'Aluguel',
        valor_original: 1200.00,
        valor_final: 1200.00,
        data_vencimento: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'vencido',
        forma_pagamento: 'Transferência',
        parcela_atual: 1,
        total_parcelas: 1,
        dda: false,
        created_at: now,
        updated_at: now,
        user_id: userId
      }
    ];

    // Salvar dados iniciais
    this.setData('categorias', categorias);
    this.setData('contatos', contatos);
    this.setData('bancos', bancos);
    this.setData('contas_pagar', contasPagar);
    this.setData('contas_receber', []);
    
    // Marcar como inicializado
    localStorage.setItem(this.getStorageKey('initialized'), 'true');
  }

  // Métodos de autenticação
  async signIn(email: string, password: string): Promise<Sessao> {
    await this.simulateLatency();

    // Simular autenticação
    const user: Usuario = {
      id: 'mock-user-id',
      email,
      nome: email.split('@')[0],
      created_at: new Date().toISOString()
    };

    this.currentUser = user;

    const session: Sessao = {
      user,
      access_token: 'mock-access-token'
    };

    localStorage.setItem(this.getStorageKey('session'), JSON.stringify(session));
    return session;
  }

  async signUp(email: string, password: string, userData?: { nome?: string }): Promise<Sessao> {
    await this.simulateLatency();

    const user: Usuario = {
      id: uuidv4(),
      email,
      nome: userData?.nome || email.split('@')[0],
      created_at: new Date().toISOString()
    };

    this.currentUser = user;

    const session: Sessao = {
      user,
      access_token: 'mock-access-token'
    };

    localStorage.setItem(this.getStorageKey('session'), JSON.stringify(session));
    return session;
  }

  async signOut(): Promise<void> {
    await this.simulateLatency(50, 100);
    this.currentUser = null;
    localStorage.removeItem(this.getStorageKey('session'));
  }

  getSession(): Sessao | null {
    const sessionData = localStorage.getItem(this.getStorageKey('session'));
    if (sessionData) {
      const session = JSON.parse(sessionData);
      this.currentUser = session.user;
      return session;
    }
    return null;
  }

  checkExistingWhatsAppUser(whatsapp: string): boolean {
    const cleanPhone = whatsapp.replace(/\D/g, '');
    // Mock: considerar alguns números como existentes
    const existingNumbers = ['11999999999', '11888888888', '11777777777'];
    return existingNumbers.includes(cleanPhone);
  }

  async signInWithWhatsApp(whatsapp: string): Promise<Sessao> {
    await this.simulateLatency();
    
    const cleanPhone = whatsapp.replace(/\D/g, '');
    
    // Simular usuário existente ou criar novo
    const user: Usuario = {
      id: Date.now().toString(),
      email: `user${cleanPhone}@whatsapp.mock`,
      nome: `Usuário ${cleanPhone.slice(-4)}`,
      created_at: new Date().toISOString()
    };

    this.currentUser = user;

    const session: Sessao = {
      user,
      access_token: 'mock-token-' + Date.now()
    };

    localStorage.setItem(this.getStorageKey('session'), JSON.stringify(session));
    return session;
  }

  // CRUD Categorias
  async getCategorias(): Promise<Categoria[]> {
    await this.simulateLatency();
    return this.getData<Categoria>('categorias');
  }

  async createCategoria(data: Omit<Categoria, keyof BaseEntity>): Promise<Categoria> {
    await this.simulateLatency();
    return this.createEntity<Categoria>('categorias', data);
  }

  async updateCategoria(id: string, updates: Partial<Categoria>): Promise<Categoria | null> {
    await this.simulateLatency();
    return this.updateEntity<Categoria>('categorias', id, updates);
  }

  async deleteCategoria(id: string): Promise<boolean> {
    await this.simulateLatency();
    return this.deleteEntity('categorias', id);
  }

  // CRUD Contatos
  async getContatos(): Promise<Contato[]> {
    await this.simulateLatency();
    return this.getData<Contato>('contatos');
  }

  async createContato(data: Omit<Contato, keyof BaseEntity>): Promise<Contato> {
    await this.simulateLatency();
    return this.createEntity<Contato>('contatos', data);
  }

  async updateContato(id: string, updates: Partial<Contato>): Promise<Contato | null> {
    await this.simulateLatency();
    return this.updateEntity<Contato>('contatos', id, updates);
  }

  async deleteContato(id: string): Promise<boolean> {
    await this.simulateLatency();
    return this.deleteEntity('contatos', id);
  }

  // CRUD Bancos
  async getBancos(): Promise<Banco[]> {
    await this.simulateLatency();
    return this.getData<Banco>('bancos');
  }

  async createBanco(data: Omit<Banco, keyof BaseEntity>): Promise<Banco> {
    await this.simulateLatency();
    return this.createEntity<Banco>('bancos', data);
  }

  async updateBanco(id: string, updates: Partial<Banco>): Promise<Banco | null> {
    await this.simulateLatency();
    return this.updateEntity<Banco>('bancos', id, updates);
  }

  async deleteBanco(id: string): Promise<boolean> {
    await this.simulateLatency();
    return this.deleteEntity('bancos', id);
  }

  // CRUD Contas a Pagar
  async getContasPagar(): Promise<ContaPagar[]> {
    await this.simulateLatency();
    const contas = this.getData<ContaPagar>('contas_pagar');
    
    // Atualizar status vencidas automaticamente
    const hoje = new Date().toISOString().split('T')[0];
    const contasAtualizadas = contas.map(conta => {
      if (conta.status === 'pendente' && conta.data_vencimento < hoje) {
        return { ...conta, status: 'vencido' as const };
      }
      return conta;
    });

    // Salvar mudanças se houver
    if (contasAtualizadas.some((conta, index) => conta.status !== contas[index].status)) {
      this.setData('contas_pagar', contasAtualizadas);
    }

    return contasAtualizadas;
  }

  async createContaPagar(data: Omit<ContaPagar, keyof BaseEntity>): Promise<ContaPagar> {
    await this.simulateLatency();
    return this.createEntity<ContaPagar>('contas_pagar', data);
  }

  async updateContaPagar(id: string, updates: Partial<ContaPagar>): Promise<ContaPagar | null> {
    await this.simulateLatency();
    return this.updateEntity<ContaPagar>('contas_pagar', id, updates);
  }

  async deleteContaPagar(id: string): Promise<boolean> {
    await this.simulateLatency();
    return this.deleteEntity('contas_pagar', id);
  }

  // CRUD Contas a Receber
  async getContasReceber(): Promise<ContaReceber[]> {
    await this.simulateLatency();
    const contas = this.getData<ContaReceber>('contas_receber');
    
    // Atualizar status vencidas automaticamente
    const hoje = new Date().toISOString().split('T')[0];
    const contasAtualizadas = contas.map(conta => {
      if (conta.status === 'pendente' && conta.data_vencimento < hoje) {
        return { ...conta, status: 'vencido' as const };
      }
      return conta;
    });

    // Salvar mudanças se houver
    if (contasAtualizadas.some((conta, index) => conta.status !== contas[index].status)) {
      this.setData('contas_receber', contasAtualizadas);
    }

    return contasAtualizadas;
  }

  async createContaReceber(data: Omit<ContaReceber, keyof BaseEntity>): Promise<ContaReceber> {
    await this.simulateLatency();
    return this.createEntity<ContaReceber>('contas_receber', data);
  }

  async updateContaReceber(id: string, updates: Partial<ContaReceber>): Promise<ContaReceber | null> {
    await this.simulateLatency();
    return this.updateEntity<ContaReceber>('contas_receber', id, updates);
  }

  async deleteContaReceber(id: string): Promise<boolean> {
    await this.simulateLatency();
    return this.deleteEntity('contas_receber', id);
  }

  // Dashboard Summary
  async getDashboardSummary() {
    await this.simulateLatency();
    
    const contasPagar = await this.getContasPagar();
    const contasReceber = await this.getContasReceber();
    const bancos = await this.getBancos();

    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Cálculos contas a pagar
    const contasPendentes = contasPagar.filter(c => c.status === 'pendente');
    const contasVencidas = contasPagar.filter(c => c.status === 'vencido');
    const contasPagasMes = contasPagar.filter(c => 
      c.status === 'pago' && 
      c.data_pagamento &&
      new Date(c.data_pagamento) >= primeiroDiaMes &&
      new Date(c.data_pagamento) <= ultimoDiaMes
    );

    // Cálculos contas a receber
    const receitasPendentes = contasReceber.filter(c => c.status === 'pendente');
    const receitasVencidas = contasReceber.filter(c => c.status === 'vencido');
    const receitasRecebidasMes = contasReceber.filter(c => 
      c.status === 'recebido' && 
      c.data_recebimento &&
      new Date(c.data_recebimento) >= primeiroDiaMes &&
      new Date(c.data_recebimento) <= ultimoDiaMes
    );

    // Saldos bancários
    const saldoTotal = bancos.reduce((total, banco) => total + banco.saldo_atual, 0);

    return {
      saldo_total: saldoTotal,
      contas_pagar: {
        pendentes: contasPendentes.length,
        valor_pendente: contasPendentes.reduce((sum, c) => sum + c.valor_original, 0),
        vencidas: contasVencidas.length,
        valor_vencido: contasVencidas.reduce((sum, c) => sum + c.valor_original, 0),
        pagas_mes: contasPagasMes.length,
        valor_pago_mes: contasPagasMes.reduce((sum, c) => sum + (c.valor_pago || c.valor_original), 0)
      },
      contas_receber: {
        pendentes: receitasPendentes.length,
        valor_pendente: receitasPendentes.reduce((sum, c) => sum + c.valor, 0),
        vencidas: receitasVencidas.length,
        valor_vencido: receitasVencidas.reduce((sum, c) => sum + c.valor, 0),
        recebidas_mes: receitasRecebidasMes.length,
        valor_recebido_mes: receitasRecebidasMes.reduce((sum, c) => sum + c.valor, 0)
      }
    };
  }

  // Reset completo dos dados
  resetAllData(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
    this.currentUser = null;
    this.initializeData();
  }
}

// Exportar instância singleton
export const mockDataService = MockDataService.getInstance();
export default mockDataService;