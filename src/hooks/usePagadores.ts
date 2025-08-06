import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Pagador {
  id: number;
  nome: string;
  documento: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
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

export interface CriarPagador extends Omit<Pagador, 'id' | 'created_at' | 'updated_at' | 'total_recebimentos' | 'valor_total'> {}

export interface AtualizarPagador extends Partial<Omit<Pagador, 'id' | 'created_at' | 'updated_at'>> {
  id: number;
}

export interface EstatisticasPagador {
  total: number;
  ativos: number;
  inativos: number;
  totalRecebimentos: number;
  valorTotal: number;
}

// Dados mock para pagadores
const mockPagadores: Pagador[] = [
  {
    id: 1,
    nome: 'Cliente ABC Ltda',
    documento: '12.345.678/0001-90',
    tipo: 'pessoa_juridica',
    email: 'financeiro@clienteabc.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua Comercial, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    observacoes: 'Cliente principal',
    ativo: true,
    total_recebimentos: 12,
    valor_total: 45000.00,
    ultimo_recebimento: '2024-12-20',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-12-23T15:30:00Z'
  },
  {
    id: 2,
    nome: 'Maria Silva',
    documento: '123.456.789-01',
    tipo: 'pessoa_fisica',
    email: 'maria@email.com',
    telefone: '(11) 88888-8888',
    endereco: 'Av. Principal, 456',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '20000-000',
    observacoes: '',
    ativo: true,
    total_recebimentos: 5,
    valor_total: 15000.00,
    ultimo_recebimento: '2024-12-18',
    created_at: '2024-02-10T14:20:00Z',
    updated_at: '2024-12-23T15:30:00Z'
  }
];

export function usePagadores() {
  const [pagadores, setPagadores] = useState<Pagador[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarPagadores = async (filtros?: FiltrosPagador) => {
    setLoading(true);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let pagadoresFiltrados = [...mockPagadores];
      
      if (filtros?.busca) {
        const busca = filtros.busca.toLowerCase();
        pagadoresFiltrados = pagadoresFiltrados.filter(p => 
          p.nome.toLowerCase().includes(busca) ||
          p.documento.includes(busca) ||
          p.email?.toLowerCase().includes(busca)
        );
      }
      
      if (filtros?.tipo && filtros.tipo !== 'todos') {
        pagadoresFiltrados = pagadoresFiltrados.filter(p => p.tipo === filtros.tipo);
      }
      
      if (filtros?.ativo !== undefined) {
        pagadoresFiltrados = pagadoresFiltrados.filter(p => p.ativo === filtros.ativo);
      }
      
      setPagadores(pagadoresFiltrados);
    } catch (error) {
      console.error('Erro ao carregar pagadores:', error);
      toast.error('Erro ao carregar pagadores');
    } finally {
      setLoading(false);
    }
  };

  const criarPagador = async (dados: CriarPagador): Promise<boolean> => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const novoPagador: Pagador = {
        ...dados,
        id: Math.max(...pagadores.map(p => p.id)) + 1,
        total_recebimentos: 0,
        valor_total: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setPagadores(prev => [...prev, novoPagador]);
      toast.success('Pagador criado com sucesso!');
      
      return true;
    } catch (error) {
      console.error('Erro ao criar pagador:', error);
      toast.error('Erro ao criar pagador');
      return false;
    }
  };

  const atualizarPagador = async (dados: AtualizarPagador): Promise<boolean> => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPagadores(prev => prev.map(p => 
        p.id === dados.id 
          ? { ...p, ...dados, updated_at: new Date().toISOString() }
          : p
      ));
      
      toast.success('Pagador atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar pagador:', error);
      toast.error('Erro ao atualizar pagador');
      return false;
    }
  };

  const excluirPagador = async (id: number): Promise<boolean> => {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPagadores(prev => prev.filter(p => p.id !== id));
      toast.success('Pagador excluído com sucesso!');
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir pagador:', error);
      toast.error('Erro ao excluir pagador');
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
    carregarPagadores();
  }, []);

  return {
    pagadores,
    loading,
    carregarPagadores,
    criarPagador,
    atualizarPagador,
    excluirPagador,
    obterEstatisticas
  };
}