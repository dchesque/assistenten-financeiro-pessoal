import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { 
  ContaReceber, 
  CriarContaReceber, 
  AtualizarContaReceber, 
  FiltrosContaReceber, 
  EstatisticasContaReceber,
  LancamentoLoteReceita 
} from '@/types/contaReceber';
import { useErrorHandler } from './useErrorHandler';
import { toast } from '@/hooks/use-toast';

export function useContasReceber() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const calcularStatus = (dataVencimento: string, dataRecebimento?: string): 'pendente' | 'recebido' | 'vencido' => {
    if (dataRecebimento) return 'recebido';
    
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    
    if (vencimento < hoje) return 'vencido';
    return 'pendente';
  };

  const carregarContas = async (filtros?: FiltrosContaReceber) => {
    if (!user) return;

    setLoading(true);
    try {
      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let contasFiltered: any[] = [];

      if (filtros?.busca) {
        const busca = filtros.busca.toLowerCase();
        contasFiltered = contasFiltered.filter(c =>
          c.descricao.toLowerCase().includes(busca) ||
          (c.observacoes && c.observacoes.toLowerCase().includes(busca))
        );
      }

      if (filtros?.status) {
        contasFiltered = contasFiltered.filter(c => c.status === filtros.status);
      }

      if (filtros?.pagador_id) {
        contasFiltered = contasFiltered.filter(c => c.pagador_id === filtros.pagador_id);
      }

      if (filtros?.categoria_id) {
        contasFiltered = contasFiltered.filter(c => c.categoria_id === filtros.categoria_id);
      }

      if (filtros?.banco_id) {
        contasFiltered = contasFiltered.filter(c => c.banco_id === filtros.banco_id);
      }

      if (filtros?.data_inicio) {
        contasFiltered = contasFiltered.filter(c => c.data_vencimento >= filtros.data_inicio!);
      }

      if (filtros?.data_fim) {
        contasFiltered = contasFiltered.filter(c => c.data_vencimento <= filtros.data_fim!);
      }

      if (filtros?.valor_min) {
        contasFiltered = contasFiltered.filter(c => c.valor >= filtros.valor_min!);
      }

      if (filtros?.valor_max) {
        contasFiltered = contasFiltered.filter(c => c.valor <= filtros.valor_max!);
      }

      if (filtros?.recorrente !== undefined) {
        contasFiltered = contasFiltered.filter(c => c.recorrente === filtros.recorrente);
      }

      // Atualizar status automático baseado na data
      const contasComStatus = contasFiltered.map(conta => ({
        ...conta,
        status: calcularStatus(conta.data_vencimento, conta.data_recebimento)
      }));

      // Ordenar por data de vencimento (mais recente primeiro)
      contasComStatus.sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime());

      setContas(contasComStatus);
    } catch (error) {
      const appError = handleError(error, 'useContasReceber.carregarContas');
      // Opcional: definir algum estado de erro se necessário
      // setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const criarConta = async (dados: CriarContaReceber): Promise<boolean> => {
    if (!user) return false;

    try {
      const status = calcularStatus(dados.data_vencimento, dados.data_recebimento);
      const novaConta: ContaReceber = {
        id: Date.now(),
        ...dados,
        status,
        user_id: user.id,
        recorrente: dados.recorrente ?? false,
        created_at: new Date().toISOString(),
      };

      setContas(prev => [...prev, novaConta]);
      toast({ title: 'Sucesso', description: 'Conta a receber criada com sucesso' });
      return true;
    } catch (error) {
      handleError(error, 'useContasReceber.criarConta');
      return false;
    }
  };

  const atualizarConta = async (dados: AtualizarContaReceber): Promise<boolean> => {
    try {
      const { id, ...dadosAtualizacao } = dados;
      
      if (dadosAtualizacao.data_vencimento || dadosAtualizacao.data_recebimento !== undefined) {
        const contaAtual = contas.find(c => c.id === id);
        if (contaAtual) {
          dadosAtualizacao.status = calcularStatus(
            dadosAtualizacao.data_vencimento || contaAtual.data_vencimento,
            dadosAtualizacao.data_recebimento !== undefined ? dadosAtualizacao.data_recebimento : contaAtual.data_recebimento
          );
        }
      }

      setContas(prev => prev.map(c => c.id === id ? { ...c, ...dadosAtualizacao } : c));
      toast({ title: 'Sucesso', description: 'Conta a receber atualizada com sucesso' });
      return true;
    } catch (error) {
      handleError(error, 'useContasReceber.atualizarConta');
      return false;
    }
  };

  const marcarComoRecebido = async (id: number, dataRecebimento?: string): Promise<boolean> => {
    return atualizarConta({
      id,
      data_recebimento: dataRecebimento || new Date().toISOString().split('T')[0],
      status: 'recebido'
    });
  };

  const lancamentoLote = async (dados: LancamentoLoteReceita): Promise<boolean> => {
    if (!user) return false;

    try {
      const contasNovas: ContaReceber[] = [];
      const dataInicio = new Date(dados.data_inicio);

      for (let i = 0; i < dados.quantidade_parcelas; i++) {
        const dataVencimento = new Date(dataInicio);
        
        switch (dados.periodicidade) {
          case 'mensal':
            dataVencimento.setMonth(dataVencimento.getMonth() + i);
            break;
          case 'quinzenal':
            dataVencimento.setDate(dataVencimento.getDate() + (i * 15));
            break;
          case 'semanal':
            dataVencimento.setDate(dataVencimento.getDate() + (i * 7));
            break;
        }

        const novaConta: ContaReceber = {
          id: Date.now() + i,
          descricao: `${dados.descricao_base} (${i + 1}/${dados.quantidade_parcelas})`,
          valor: dados.valor,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          pagador_id: dados.pagador_id,
          categoria_id: dados.categoria_id,
          banco_id: dados.banco_id,
          observacoes: dados.observacoes,
          recorrente: false,
          status: 'pendente',
          user_id: user.id,
          created_at: new Date().toISOString(),
        };

        contasNovas.push(novaConta);
      }

      setContas(prev => [...prev, ...contasNovas]);

      toast({
        title: 'Sucesso',
        description: `${dados.quantidade_parcelas} contas a receber criadas com sucesso`,
      });

      return true;
    } catch (error) {
      handleError(error, 'useContasReceber.lancamentoLote');
      return false;
    }
  };

  const excluirConta = async (id: number): Promise<boolean> => {
    try {
      setContas(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Sucesso', description: 'Conta a receber excluída com sucesso' });
      return true;
    } catch (error) {
      handleError(error, 'useContasReceber.excluirConta');
      return false;
    }
  };

  const obterEstatisticas = (): EstatisticasContaReceber => {
    const total_contas = contas.length;
    const valores = contas.map(c => c.valor);
    
    const total_valor = valores.reduce((acc, val) => acc + val, 0);
    const valor_pendente = contas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0);
    const valor_recebido = contas.filter(c => c.status === 'recebido').reduce((acc, c) => acc + c.valor, 0);
    const valor_vencido = contas.filter(c => c.status === 'vencido').reduce((acc, c) => acc + c.valor, 0);
    
    const pendentes = contas.filter(c => c.status === 'pendente').length;
    const recebidas = contas.filter(c => c.status === 'recebido').length;
    const vencidas = contas.filter(c => c.status === 'vencido').length;
    
    // Contas com vencimento nos próximos 7 dias
    const hoje = new Date();
    const proximos7Dias = new Date();
    proximos7Dias.setDate(hoje.getDate() + 7);
    
    const contasVencimentoProximo = contas.filter(c => {
      if (c.status !== 'pendente') return false;
      const vencimento = new Date(c.data_vencimento);
      return vencimento >= hoje && vencimento <= proximos7Dias;
    });
    
    const vencimento_proximo = contasVencimentoProximo.length;
    const valor_vencimento_proximo = contasVencimentoProximo.reduce((acc, c) => acc + c.valor, 0);
    
    const maior_conta = valores.length > 0 ? Math.max(...valores) : 0;
    const menor_conta = valores.length > 0 ? Math.min(...valores) : 0;
    const conta_media = valores.length > 0 ? total_valor / valores.length : 0;

    return {
      total_contas,
      total_valor,
      valor_pendente,
      valor_recebido,
      valor_vencido,
      pendentes,
      recebidas,
      vencidas,
      vencimento_proximo,
      valor_vencimento_proximo,
      maior_conta,
      menor_conta,
      conta_media,
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
    marcarComoRecebido,
    excluirConta,
    lancamentoLote,
    obterEstatisticas,
  };
}