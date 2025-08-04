export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string;
  contato?: string;
  email?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
}

export interface Banco {
  id: string;
  nome: string;
  agencia?: string;
  conta?: string;
}

export interface ContaPagar {
  id: string;
  fornecedorId: string;
  fornecedor: Fornecedor;
  categoriaId: string;
  categoria: Categoria;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: 'pendente' | 'paga' | 'vencida';
  observacoes?: string;
}

export interface DashboardMetrics {
  totalPendente: number;
  contasVencidas: { quantidade: number; valor: number };
  aVencer30Dias: { quantidade: number; valor: number };
  pagasNoMes: number;
  indicadores: {
    totalPendente: number;
    contasVencidas: number;
    aVencer30Dias: number;
    pagasNoMes: number;
  };
}

export interface MovimentacaoRecente {
  id: string;
  data: Date;
  fornecedor: string;
  descricao: string;
  valor: number;
  status: 'pendente' | 'paga' | 'vencida';
}