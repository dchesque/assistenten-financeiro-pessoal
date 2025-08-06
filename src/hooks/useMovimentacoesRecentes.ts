import { useState, useEffect } from 'react';

export interface MovimentacaoRecente {
  id: string;
  data: Date;
  fornecedor: string;
  descricao: string;
  valor: number;
  status: 'pendente' | 'pago' | 'vencido';
}

// Dados mock para movimentações
const mockMovimentacoes: MovimentacaoRecente[] = [
  {
    id: '1',
    data: new Date('2024-12-22'),
    fornecedor: 'ABC Fornecimentos Ltda',
    descricao: 'Material de escritório',
    valor: 850.00,
    status: 'pago'
  },
  {
    id: '2',
    data: new Date('2024-12-21'),
    fornecedor: 'XYZ Serviços',
    descricao: 'Manutenção preventiva',
    valor: 1200.00,
    status: 'pendente'
  },
  {
    id: '3',
    data: new Date('2024-12-20'),
    fornecedor: 'Energia Elétrica SA',
    descricao: 'Conta de luz - dezembro',
    valor: 450.75,
    status: 'vencido'
  },
  {
    id: '4',
    data: new Date('2024-12-19'),
    fornecedor: 'João Silva',
    descricao: 'Serviços de consultoria',
    valor: 2500.00,
    status: 'pago'
  },
  {
    id: '5',
    data: new Date('2024-12-18'),
    fornecedor: 'TechSoft Ltda',
    descricao: 'Licença de software',
    valor: 890.00,
    status: 'pendente'
  }
];

export const useMovimentacoesRecentes = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoRecente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarMovimentacoes();
  }, []);

  const carregarMovimentacoes = async () => {
    try {
      setLoading(true);

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));

      setMovimentacoes(mockMovimentacoes);
    } catch (error) {
      console.error('Erro ao carregar movimentações recentes:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    movimentacoes,
    loading,
    recarregar: carregarMovimentacoes
  };
};