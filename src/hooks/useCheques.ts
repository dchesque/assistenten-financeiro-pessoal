import { useState, useMemo, useCallback, useEffect } from 'react';
import { Cheque, FiltrosCheque } from '@/types/cheque';
import { useChequesSupabase } from '@/hooks/useChequesSupabase';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/hooks/use-toast';

export interface EstadosLoading {
  carregandoCheques: boolean;
  emitindoCheque: boolean;
  editandoCheque: boolean;
  marcandoCompensado: boolean;
  cancelandoCheque: boolean;
  devolvendoCheque: boolean;
  excluindoCheque: boolean;
  aplicandoFiltros: boolean;
  carregandoEstatisticas: boolean;
}

export function useCheques() {
  const { cheques: chequesSupabase, loading: loadingCheques } = useChequesSupabase();
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [filtros, setFiltros] = useState<FiltrosCheque>({
    busca: '',
    status: 'todos',
    banco_id: 'todos',
    data_inicio: '',
    data_fim: ''
  });

  const [estados, setEstados] = useState<EstadosLoading>({
    carregandoCheques: false,
    emitindoCheque: false,
    editandoCheque: false,
    marcandoCompensado: false,
    cancelandoCheque: false,
    devolvendoCheque: false,
    excluindoCheque: false,
    aplicandoFiltros: false,
    carregandoEstatisticas: false
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState(false);
  const [historicoOperacoes, setHistoricoOperacoes] = useState<Array<{
    id: number;
    cheque_id: number;
    acao: string;
    detalhes: string;
    data: string;
    usuario: string;
  }>>([]);

  // Sincronizar com dados do Supabase (converter tipos)
  useEffect(() => {
    const chequesConvertidos = chequesSupabase.map(cheque => ({
      ...cheque,
      tipo_beneficiario: 'fornecedor' as const,
      status: cheque.status === 'emitido' ? 'pendente' as const : cheque.status
    }));
    setCheques(chequesConvertidos);
  }, [chequesSupabase]);

  // Debounce da busca para melhor performance
  const buscaDebounced = useDebounce(filtros.busca, 300);

  // Filtrar cheques com memoização
  const chequesFiltrados = useMemo(() => {
    return cheques.filter(cheque => {
      // Busca por número, beneficiário, valor
      const termoBusca = buscaDebounced.toLowerCase();
      const matchBusca = !termoBusca || 
        cheque.numero_cheque.includes(termoBusca) ||
        (cheque.beneficiario_nome && cheque.beneficiario_nome.toLowerCase().includes(termoBusca)) ||
        cheque.valor.toString().includes(termoBusca);

      // Filtro por status
      const matchStatus = filtros.status === 'todos' || cheque.status === filtros.status;

      // Filtro por banco
      const matchBanco = filtros.banco_id === 'todos' || cheque.banco_id === Number(filtros.banco_id);

      // Filtro por período de emissão
      const matchPeriodo = (!filtros.data_inicio || cheque.data_emissao >= filtros.data_inicio) &&
        (!filtros.data_fim || cheque.data_emissao <= filtros.data_fim);

      return matchBusca && matchStatus && matchBanco && matchPeriodo;
    });
  }, [cheques, buscaDebounced, filtros.status, filtros.banco_id, filtros.data_inicio, filtros.data_fim]);

  // Registrar histórico de operações
  const registrarHistorico = useCallback((chequeId: number, acao: string, detalhes: string) => {
    const historicoItem = {
      id: Date.now(),
      cheque_id: chequeId,
      acao,
      detalhes,
      data: new Date().toISOString(),
      usuario: 'Sistema' // TODO: Pegar usuário logado
    };
    
    setHistoricoOperacoes(prev => [historicoItem, ...prev]);
  }, []);

  // Atualizar estado de loading específico
  const setLoadingState = useCallback((key: keyof EstadosLoading, valor: boolean) => {
    setEstados(prev => ({ ...prev, [key]: valor }));
  }, []);

  // Emitir novo cheque
  const emitirCheque = useCallback(async (dadosCheque: Omit<Cheque, 'id' | 'created_at' | 'updated_at'>) => {
    setLoadingState('emitindoCheque', true);
    
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const novoCheque: Cheque = {
        ...dadosCheque,
        id: Math.max(...cheques.map(c => c.id || 0)) + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setCheques(prev => [novoCheque, ...prev]);
      registrarHistorico(novoCheque.id!, 'emitido', `Cheque #${dadosCheque.numero_cheque} emitido no valor de R$ ${dadosCheque.valor.toFixed(2)}`);
      
      toast({
        title: "Cheque emitido com sucesso!",
        description: `Cheque #${dadosCheque.numero_cheque} foi registrado no sistema.`,
      });

      return novoCheque;
    } catch (error) {
      toast({
        title: "Erro ao emitir cheque",
        description: "Ocorreu um erro ao processar a operação. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoadingState('emitindoCheque', false);
    }
  }, [cheques, registrarHistorico, setLoadingState, toast]);

  // Editar cheque
  const editarCheque = useCallback(async (id: number, dadosCheque: Partial<Cheque>) => {
    setLoadingState('editandoCheque', true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      setCheques(prev => prev.map(c => 
        c.id === id 
          ? { ...c, ...dadosCheque, updated_at: new Date().toISOString() }
          : c
      ));

      registrarHistorico(id, 'editado', `Cheque alterado - dados atualizados`);
      
      toast({
        title: "Cheque atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao editar cheque",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoadingState('editandoCheque', false);
    }
  }, [registrarHistorico, setLoadingState, toast]);

  // Marcar como compensado
  const marcarCompensado = useCallback(async (id: number, dadosCompensacao: { data_compensacao: string; observacoes?: string }) => {
    setLoadingState('marcandoCompensado', true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCheques(prev => prev.map(c => 
        c.id === id 
          ? { 
              ...c, 
              status: 'compensado' as const,
              data_compensacao: dadosCompensacao.data_compensacao,
              observacoes: dadosCompensacao.observacoes || c.observacoes,
              updated_at: new Date().toISOString()
            }
          : c
      ));

      registrarHistorico(id, 'compensado', `Cheque compensado em ${dadosCompensacao.data_compensacao}`);
      
      toast({
        title: "Cheque compensado!",
        description: "O status foi atualizado para compensado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao marcar compensação",
        description: "Não foi possível atualizar o status do cheque.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoadingState('marcandoCompensado', false);
    }
  }, [registrarHistorico, setLoadingState, toast]);

  // Cancelar cheque
  const cancelarCheque = useCallback(async (id: number, motivo: string, observacoes?: string) => {
    setLoadingState('cancelandoCheque', true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCheques(prev => prev.map(c => 
        c.id === id 
          ? { 
              ...c, 
              status: 'cancelado' as const,
              motivo_cancelamento: motivo,
              observacoes: observacoes || c.observacoes,
              updated_at: new Date().toISOString()
            }
          : c
      ));

      registrarHistorico(id, 'cancelado', `Cheque cancelado - Motivo: ${motivo}`);
      
      toast({
        title: "Cheque cancelado!",
        description: "O cheque foi cancelado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao cancelar cheque",
        description: "Não foi possível cancelar o cheque.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoadingState('cancelandoCheque', false);
    }
  }, [registrarHistorico, setLoadingState, toast]);

  // Devolver cheque
  const devolverCheque = useCallback(async (id: number, motivo: string, observacoes?: string) => {
    setLoadingState('devolvendoCheque', true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCheques(prev => prev.map(c => 
        c.id === id 
          ? { 
              ...c, 
              status: 'devolvido' as const,
              motivo_devolucao: motivo,
              observacoes: observacoes || c.observacoes,
              updated_at: new Date().toISOString()
            }
          : c
      ));

      registrarHistorico(id, 'devolvido', `Cheque devolvido - Motivo: ${motivo}`);
      
      toast({
        title: "Cheque marcado como devolvido!",
        description: "O status foi atualizado para devolvido.",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro ao marcar devolução",
        description: "Não foi possível atualizar o status do cheque.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoadingState('devolvendoCheque', false);
    }
  }, [registrarHistorico, setLoadingState, toast]);

  // Aplicar filtros
  const aplicarFiltros = useCallback(async () => {
    setLoadingState('aplicandoFiltros', true);
    
    // Validação do período
    if (filtros.data_inicio && filtros.data_fim && filtros.data_inicio > filtros.data_fim) {
      toast({
        title: "Período inválido",
        description: "A data inicial não pode ser maior que a data final.",
        variant: "destructive"
      });
      setLoadingState('aplicandoFiltros', false);
      return;
    }
    
    try {
      // Simular delay para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setFiltrosAplicados(true);
      
      toast({
        title: "Filtros aplicados!",
        description: `${chequesFiltrados.length} cheques encontrados.`,
      });
    } finally {
      setLoadingState('aplicandoFiltros', false);
    }
  }, [filtros, chequesFiltrados.length, setLoadingState, toast]);

  // Limpar filtros
  const limparFiltros = useCallback(() => {
    setFiltros({
      busca: '',
      status: 'todos',
      banco_id: 'todos',
      data_inicio: '',
      data_fim: ''
    });
    setFiltrosAplicados(false);
    
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos.",
    });
  }, [toast]);

  // Verificar se há filtros ativos
  const temFiltrosAtivos = useMemo(() => {
    return filtros.busca || 
           filtros.status !== 'todos' || 
           filtros.banco_id !== 'todos' || 
           filtros.data_inicio || 
           filtros.data_fim;
  }, [filtros]);

  // Contador de resultados dinâmico
  const textoContador = useMemo(() => {
    if (!temFiltrosAtivos) {
      return `Mostrando ${chequesFiltrados.length} cheques`;
    }
    
    if (chequesFiltrados.length === 0) {
      return 'Nenhum cheque encontrado';
    }
    
    if (chequesFiltrados.length < cheques.length) {
      return `Mostrando ${chequesFiltrados.length} de ${cheques.length} cheques`;
    }
    
    return `${chequesFiltrados.length} cheques encontrados`;
  }, [temFiltrosAtivos, chequesFiltrados.length, cheques.length]);

  // Exportar dados dos cheques filtrados
  const exportarCheques = useCallback(() => {
    const dadosExportacao = chequesFiltrados.map(cheque => ({
      'Número': cheque.numero_cheque,
      'Banco': `Banco ID: ${cheque.banco_id}`, // TODO: Buscar nome real do banco
      'Beneficiário': cheque.beneficiario_nome || `Fornecedor ID: ${cheque.fornecedor_id}`,
      'Valor': `R$ ${cheque.valor.toFixed(2).replace('.', ',')}`,
      'Emissão': cheque.data_emissao,
      'Vencimento': cheque.data_vencimento || '-',
      'Compensação': cheque.data_compensacao || '-',
      'Status': cheque.status.toUpperCase(),
      'Finalidade': cheque.finalidade || '-'
    }));
    
    // TODO: Implementar exportação CSV/Excel real
    console.log('Exportando cheques:', dadosExportacao);
    
    toast({
      title: "Dados exportados!",
      description: `${dadosExportacao.length} cheques foram preparados para exportação.`,
    });
    
    return dadosExportacao;
  }, [chequesFiltrados, toast]);

  return {
    // Dados
    cheques,
    chequesFiltrados,
    filtros,
    estados,
    filtrosAplicados,
    historicoOperacoes,
    
    // Computadas
    temFiltrosAtivos,
    textoContador,
    
    // Ações
    setFiltros,
    emitirCheque,
    editarCheque,
    marcarCompensado,
    cancelarCheque,
    devolverCheque,
    aplicarFiltros,
    limparFiltros,
    exportarCheques,
    setLoadingState
  };
}