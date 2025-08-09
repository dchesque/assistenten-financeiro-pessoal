import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { customersService, Customer, CreateCustomerData, UpdateCustomerData, CustomerFilters } from '@/services/customersService';
import { showMessage } from '@/utils/messages';
import { useErrorHandler } from './useErrorHandler';

export interface Pagador {
  id: string;
  nome: string;
  documento?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica' | 'other';
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  ativo: boolean;
  total_recebimentos: number;
  valor_total: number;
  ultimo_recebimento?: string;
  created_at: string;
  updated_at: string;
}

export interface FiltrosPagador {
  busca?: string;
  tipo?: string;
  ativo?: boolean;
}

export interface CriarPagador {
  nome: string;
  documento?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica' | 'other';
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  ativo?: boolean;
}

export interface AtualizarPagador extends Partial<CriarPagador> {
  id: string;
}

export interface EstatisticasPagador {
  total: number;
  ativos: number;
  inativos: number;
  totalRecebimentos: number;
  valorTotal: number;
}

// Converter Customer para Pagador
const customerToPagador = (customer: Customer): Pagador => ({
  id: customer.id,
  nome: customer.name,
  documento: customer.document,
  tipo: customer.type,
  email: customer.email,
  telefone: customer.phone,
  endereco: customer.address,
  cidade: customer.city,
  estado: customer.state,
  cep: customer.zip,
  observacoes: customer.notes,
  ativo: customer.active,
  total_recebimentos: customer.metadata?.total_recebimentos || 0,
  valor_total: customer.metadata?.valor_total || 0,
  ultimo_recebimento: customer.metadata?.ultimo_recebimento,
  created_at: customer.created_at,
  updated_at: customer.updated_at
});

// Converter Pagador para Customer (Create)
const pagadorToCreateCustomer = (pagador: CriarPagador): CreateCustomerData => ({
  name: pagador.nome,
  document: pagador.documento,
  document_type: pagador.tipo === 'pessoa_fisica' ? 'cpf' : pagador.tipo === 'pessoa_juridica' ? 'cnpj' : 'other',
  type: pagador.tipo,
  email: pagador.email,
  phone: pagador.telefone,
  address: pagador.endereco,
  city: pagador.cidade,
  state: pagador.estado,
  zip: pagador.cep,
  notes: pagador.observacoes,
  active: pagador.ativo ?? true
});

// Converter Pagador para Customer (Update)
const pagadorToUpdateCustomer = (pagador: Omit<AtualizarPagador, 'id'>): UpdateCustomerData => ({
  name: pagador.nome,
  document: pagador.documento,
  document_type: pagador.tipo === 'pessoa_fisica' ? 'cpf' : pagador.tipo === 'pessoa_juridica' ? 'cnpj' : 'other',
  type: pagador.tipo,
  email: pagador.email,
  phone: pagador.telefone,
  address: pagador.endereco,
  city: pagador.cidade,
  state: pagador.estado,
  zip: pagador.cep,
  notes: pagador.observacoes,
  active: pagador.ativo
});

export function usePagadores() {
  const [pagadores, setPagadores] = useState<Pagador[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { handleError } = useErrorHandler();

  const carregarPagadores = async (filtros?: FiltrosPagador) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const customerFilters: CustomerFilters = {};
      
      if (filtros?.busca) {
        customerFilters.search = filtros.busca;
      }
      
      if (filtros?.tipo && filtros.tipo !== 'todos') {
        customerFilters.type = filtros.tipo;
      }
      
      if (filtros?.ativo !== undefined) {
        customerFilters.active = filtros.ativo;
      }
      
      const customers = await customersService.getCustomers(customerFilters);
      const pagadoresData = customers.map(customerToPagador);
      setPagadores(pagadoresData);
    } catch (err) {
      const appError = handleError(err, 'usePagadores.carregarPagadores');
      setError(appError.message);
      showMessage.saveError('Erro ao carregar pagadores');
    } finally {
      setLoading(false);
    }
  };

  const criarPagador = async (dados: CriarPagador): Promise<boolean> => {
    try {
      const customerData = pagadorToCreateCustomer(dados);
      await customersService.createCustomer(customerData);
      await carregarPagadores(); // Refresh the list
      showMessage.saveSuccess('Pagador criado com sucesso!');
      return true;
    } catch (err) {
      handleError(err, 'usePagadores.criarPagador');
      showMessage.saveError('Erro ao criar pagador');
      return false;
    }
  };

  const atualizarPagador = async (dados: AtualizarPagador): Promise<boolean> => {
    try {
      const { id, ...updateData } = dados;
      const customerData = pagadorToUpdateCustomer(updateData);
      await customersService.updateCustomer(id, customerData);
      await carregarPagadores(); // Refresh the list
      showMessage.saveSuccess('Pagador atualizado com sucesso!');
      return true;
    } catch (err) {
      handleError(err, 'usePagadores.atualizarPagador');
      showMessage.saveError('Erro ao atualizar pagador');
      return false;
    }
  };

  const excluirPagador = async (id: string): Promise<boolean> => {
    try {
      await customersService.deleteCustomer(id);
      await carregarPagadores(); // Refresh the list
      showMessage.deleteSuccess('Pagador excluído com sucesso!');
      return true;
    } catch (err) {
      handleError(err, 'usePagadores.excluirPagador');
      showMessage.deleteError('Erro ao excluir pagador');
      return false;
    }
  };

  const obterEstatisticas = (): EstatisticasPagador => {
    const ativos = pagadores.filter(p => p.ativo);
    const inativos = pagadores.filter(p => !p.ativo);
    
    return {
      total: pagadores.length,
      ativos: ativos.length,
      inativos: inativos.length,
      totalRecebimentos: pagadores.reduce((acc, p) => acc + p.total_recebimentos, 0),
      valorTotal: pagadores.reduce((acc, p) => acc + p.valor_total, 0)
    };
  };

  useEffect(() => {
    if (user) {
      carregarPagadores();
    } else {
      setPagadores([]);
    }
  }, [user]);

  return {
    pagadores,
    loading,
    error,
    carregarPagadores,
    criarPagador,
    atualizarPagador,
    excluirPagador,
    obterEstatisticas
  };
}