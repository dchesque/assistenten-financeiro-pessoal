import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  ContaPessoal, 
  FiltrosConta, 
  EstatisticasContas, 
  ResumoPorCategoria 
} from '@/types/contaPessoal';
import { mockContasPessoais } from '@/utils/mockDadosPessoais';

export const useContasPessoais = () => {
  const [contas, setContas] = useState<ContaPessoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const STORAGE_KEY = `contas_pessoais_${user?.id}`;

  const carregarContas = (filtros?: FiltrosConta) => {
    if (!user) return;

    try {
      setLoading(true);
      const dados = localStorage.getItem(STORAGE_KEY);
      let contasCarregadas: ContaPessoal[] = [];

      if (dados) {
        contasCarregadas = JSON.parse(dados);
      } else {
        // Criar contas padrão se não existirem
        contasCarregadas = criarContasDefault();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(contasCarregadas));
      }

      // Aplicar filtros
      let contasFiltradas = contasCarregadas;
      
      if (filtros?.status && filtros.status !== 'todos') {
        contasFiltradas = contasFiltradas.filter(conta => conta.status === filtros.status);
      }
      
      if (filtros?.categoria_id) {
        contasFiltradas = contasFiltradas.filter(conta => conta.categoria_id === filtros.categoria_id);
      }

      if (filtros?.credor_id) {
        contasFiltradas = contasFiltradas.filter(conta => conta.credor_id === filtros.credor_id);
      }

      if (filtros?.data_inicio) {
        contasFiltradas = contasFiltradas.filter(conta => 
          conta.data_vencimento >= filtros.data_inicio!
        );
      }

      if (filtros?.data_fim) {
        contasFiltradas = contasFiltradas.filter(conta => 
          conta.data_vencimento <= filtros.data_fim!
        );
      }

      if (filtros?.valor_min) {
        contasFiltradas = contasFiltradas.filter(conta => conta.valor >= filtros.valor_min!);
      }

      if (filtros?.valor_max) {
        contasFiltradas = contasFiltradas.filter(conta => conta.valor <= filtros.valor_max!);
      }

      if (filtros?.vencimento_proximo) {
        const proximosDias = new Date();
        proximosDias.setDate(proximosDias.getDate() + 7);
        const proximosDiasStr = proximosDias.toISOString().split('T')[0];
        
        contasFiltradas = contasFiltradas.filter(conta => 
          conta.data_vencimento <= proximosDiasStr && conta.status === 'pendente'
        );
      }

      if (filtros?.busca) {
        const busca = filtros.busca.toLowerCase();
        contasFiltradas = contasFiltradas.filter(conta => 
          conta.descricao.toLowerCase().includes(busca) ||
          conta.observacoes?.toLowerCase().includes(busca)
        );
      }

      setContas(contasFiltradas.sort((a, b) => 
        new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
      ));
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarContasDefault = (): ContaPessoal[] => {
    const agora = new Date().toISOString();
    return mockContasPessoais.map(conta => ({
      ...conta,
      status: conta.status as 'pendente' | 'paga' | 'vencida',
      categoria_id: conta.plano_conta_id,
      credor_id: conta.fornecedor_id,
      user_id: user?.id || '',
      created_at: agora,
      updated_at: agora
    }));
  };

  const criarConta = (conta: Omit<ContaPessoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      const contasExistentes: ContaPessoal[] = dados ? JSON.parse(dados) : [];
      
      const novaConta: ContaPessoal = {
        ...conta,
        id: Math.max(0, ...contasExistentes.map(c => c.id)) + 1,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const novasContas = [...contasExistentes, novaConta];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novasContas));
      
      carregarContas(); // Recarregar para atualizar a lista
      
      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso"
      });

      return novaConta;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta",
        variant: "destructive"
      });
      return null;
    }
  };

  const atualizarConta = (id: number, dados: Partial<ContaPessoal>) => {
    if (!user) return null;

    try {
      const dadosStorage = localStorage.getItem(STORAGE_KEY);
      const contasExistentes: ContaPessoal[] = dadosStorage ? JSON.parse(dadosStorage) : [];
      
      const indice = contasExistentes.findIndex(c => c.id === id);
      if (indice === -1) {
        throw new Error('Conta não encontrada');
      }

      const contaAtualizada = {
        ...contasExistentes[indice],
        ...dados,
        updated_at: new Date().toISOString()
      };

      contasExistentes[indice] = contaAtualizada;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contasExistentes));
      
      carregarContas(); // Recarregar para atualizar a lista

      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso"
      });

      return contaAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta",
        variant: "destructive"
      });
      return null;
    }
  };

  const excluirConta = (id: number) => {
    if (!user) return false;

    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      const contasExistentes: ContaPessoal[] = dados ? JSON.parse(dados) : [];
      
      const novasContas = contasExistentes.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novasContas));
      
      carregarContas(); // Recarregar para atualizar a lista
      
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso"
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta",
        variant: "destructive"
      });
      return false;
    }
  };

  const pagarConta = (id: number, dataPagamento?: string) => {
    const dados = {
      status: 'paga' as const,
      data_pagamento: dataPagamento || new Date().toISOString().split('T')[0]
    };
    return atualizarConta(id, dados);
  };

  const obterEstatisticas = (): EstatisticasContas => {
    const hoje = new Date().toISOString().split('T')[0];
    const proximosDias = new Date();
    proximosDias.setDate(proximosDias.getDate() + 7);
    const proximosDiasStr = proximosDias.toISOString().split('T')[0];

    const pendentes = contas.filter(c => c.status === 'pendente');
    const pagas = contas.filter(c => c.status === 'paga');
    const vencidas = contas.filter(c => c.status === 'vencida' || (c.status === 'pendente' && c.data_vencimento < hoje));
    const vencimentoProximo = contas.filter(c => 
      c.status === 'pendente' && c.data_vencimento <= proximosDiasStr && c.data_vencimento >= hoje
    );

    return {
      total_contas: contas.length,
      total_valor: contas.reduce((acc, c) => acc + c.valor, 0),
      pendentes: pendentes.length,
      valor_pendente: pendentes.reduce((acc, c) => acc + c.valor, 0),
      pagas: pagas.length,
      valor_pago: pagas.reduce((acc, c) => acc + c.valor, 0),
      vencidas: vencidas.length,
      valor_vencido: vencidas.reduce((acc, c) => acc + c.valor, 0),
      vencimento_proximo: vencimentoProximo.length,
      valor_vencimento_proximo: vencimentoProximo.reduce((acc, c) => acc + c.valor, 0)
    };
  };

  useEffect(() => {
    if (user) {
      carregarContas();
    }
  }, [user]);

  return {
    contas,
    loading,
    carregarContas,
    criarConta,
    atualizarConta,
    excluirConta,
    pagarConta,
    obterEstatisticas
  };
};