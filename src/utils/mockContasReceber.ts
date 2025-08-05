import type { ContaReceber } from '@/types/contaReceber';
import type { Pagador } from '@/types/pagador';
import type { CategoriaReceita } from '@/types/categoriaReceita';

// Mock de Pagadores
export const mockPagadores: Pagador[] = [
  {
    id: 1,
    nome: 'Empresa ABC Ltda',
    tipo: 'pessoa_juridica',
    documento: '12.345.678/0001-90',
    email: 'rh@empresaabc.com.br',
    telefone: '(11) 9999-8888',
    endereco: 'Av. Paulista, 1000 - São Paulo/SP',
    ativo: true,
    user_id: '1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    nome: 'Banco Itaú',
    tipo: 'pessoa_juridica',
    documento: '60.701.190/0001-04',
    email: 'investimentos@itau.com.br',
    telefone: '(11) 4004-4828',
    endereco: 'Praça Alfredo Egydio de Souza Aranha, 100',
    ativo: true,
    user_id: '1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    nome: 'Maria Silva',
    tipo: 'pessoa_fisica',
    documento: '123.456.789-00',
    email: 'maria.silva@email.com',
    telefone: '(11) 99999-7777',
    endereco: 'Rua das Flores, 123 - São Paulo/SP',
    ativo: true,
    user_id: '1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    nome: 'Nubank',
    tipo: 'pessoa_juridica',
    documento: '18.236.120/0001-58',
    email: 'cashback@nubank.com.br',
    telefone: '0800-608-6116',
    endereco: 'Rua Capote Valente, 39 - São Paulo/SP',
    ativo: true,
    user_id: '1',
    created_at: '2024-01-01T00:00:00Z'
  }
];

// Mock de Categorias de Receita
export const mockCategoriasReceitas: CategoriaReceita[] = [
  // TRABALHO
  { id: 1, nome: 'Salário Mensal', grupo: 'trabalho', cor: '#10B981', icone: 'DollarSign', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  { id: 2, nome: 'Décimo Terceiro', grupo: 'trabalho', cor: '#059669', icone: 'Gift', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  { id: 3, nome: 'Bônus/Premiação', grupo: 'trabalho', cor: '#047857', icone: 'Award', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  { id: 4, nome: 'Horas Extras', grupo: 'trabalho', cor: '#065F46', icone: 'Clock', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  { id: 5, nome: 'Freelances', grupo: 'trabalho', cor: '#064E3B', icone: 'Briefcase', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  
  // INVESTIMENTOS
  { id: 6, nome: 'Dividendos', grupo: 'investimentos', cor: '#3B82F6', icone: 'TrendingUp', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  { id: 7, nome: 'Juros Poupança', grupo: 'investimentos', cor: '#2563EB', icone: 'PiggyBank', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  { id: 8, nome: 'Rendimento CDB', grupo: 'investimentos', cor: '#1D4ED8', icone: 'CreditCard', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  { id: 9, nome: 'Ganho Ações', grupo: 'investimentos', cor: '#1E40AF', icone: 'BarChart', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  
  // OUTROS
  { id: 10, nome: 'Presentes em Dinheiro', grupo: 'outros', cor: '#8B5CF6', icone: 'Gift', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  { id: 11, nome: 'Vendas Pessoais', grupo: 'outros', cor: '#7C3AED', icone: 'ShoppingBag', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
  { id: 12, nome: 'Cashback', grupo: 'outros', cor: '#5B21B6', icone: 'Percent', user_id: '1', created_at: '2024-01-01T00:00:00Z' },
];

// Mock de Contas a Receber
export const mockContasReceber: ContaReceber[] = [
  {
    id: 1,
    descricao: 'Salário Janeiro 2025',
    valor: 8500.00,
    data_vencimento: '2025-01-05',
    status: 'recebido',
    data_recebimento: '2025-01-05',
    pagador_id: 1,
    categoria_id: 1,
    banco_id: 1,
    recorrente: true,
    user_id: '1',
    created_at: '2024-12-01T00:00:00Z',
    pagador: { id: 1, nome: 'Empresa ABC Ltda', tipo: 'pessoa_juridica' },
    categoria: { id: 1, nome: 'Salário Mensal', grupo: 'trabalho', cor: '#10B981' },
    banco: { id: 1, nome: 'Nubank' }
  },
  {
    id: 2,
    descricao: 'Freelance - Site E-commerce',
    valor: 3200.00,
    data_vencimento: '2025-01-15',
    status: 'pendente',
    pagador_id: 3,
    categoria_id: 5,
    banco_id: 1,
    recorrente: false,
    observacoes: 'Desenvolvimento de site responsivo',
    user_id: '1',
    created_at: '2024-12-15T00:00:00Z',
    pagador: { id: 3, nome: 'Maria Silva', tipo: 'pessoa_fisica' },
    categoria: { id: 5, nome: 'Freelances', grupo: 'trabalho', cor: '#064E3B' },
    banco: { id: 1, nome: 'Nubank' }
  },
  {
    id: 3,
    descricao: 'Dividendos ITSA4',
    valor: 156.78,
    data_vencimento: '2025-01-10',
    status: 'pendente',
    pagador_id: 2,
    categoria_id: 6,
    banco_id: 2,
    recorrente: false,
    user_id: '1',
    created_at: '2024-12-20T00:00:00Z',
    pagador: { id: 2, nome: 'Banco Itaú', tipo: 'pessoa_juridica' },
    categoria: { id: 6, nome: 'Dividendos', grupo: 'investimentos', cor: '#3B82F6' },
    banco: { id: 2, nome: 'Banco Inter' }
  },
  {
    id: 4,
    descricao: 'Cashback Cartão Dezembro',
    valor: 89.43,
    data_vencimento: '2025-01-08',
    status: 'pendente',
    pagador_id: 4,
    categoria_id: 12,
    banco_id: 1,
    recorrente: false,
    user_id: '1',
    created_at: '2024-12-30T00:00:00Z',
    pagador: { id: 4, nome: 'Nubank', tipo: 'pessoa_juridica' },
    categoria: { id: 12, nome: 'Cashback', grupo: 'outros', cor: '#5B21B6' },
    banco: { id: 1, nome: 'Nubank' }
  },
  {
    id: 5,
    descricao: 'Bônus Performance Q4 2024',
    valor: 2800.00,
    data_vencimento: '2025-01-20',
    status: 'pendente',
    pagador_id: 1,
    categoria_id: 3,
    banco_id: 1,
    recorrente: false,
    observacoes: 'Bônus trimestral por atingir metas',
    user_id: '1',
    created_at: '2024-12-28T00:00:00Z',
    pagador: { id: 1, nome: 'Empresa ABC Ltda', tipo: 'pessoa_juridica' },
    categoria: { id: 3, nome: 'Bônus/Premiação', grupo: 'trabalho', cor: '#047857' },
    banco: { id: 1, nome: 'Nubank' }
  },
  {
    id: 6,
    descricao: 'Juros Poupança',
    valor: 45.67,
    data_vencimento: '2024-12-30',
    status: 'vencido',
    pagador_id: 2,
    categoria_id: 7,
    banco_id: 2,
    recorrente: true,
    user_id: '1',
    created_at: '2024-12-01T00:00:00Z',
    pagador: { id: 2, nome: 'Banco Itaú', tipo: 'pessoa_juridica' },
    categoria: { id: 7, nome: 'Juros Poupança', grupo: 'investimentos', cor: '#2563EB' },
    banco: { id: 2, nome: 'Banco Inter' }
  }
];