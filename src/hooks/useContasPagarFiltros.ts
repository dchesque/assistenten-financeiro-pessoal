import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { FiltrosContaPagar, ContaEnriquecida } from '@/types/contaPagar';

export function useContasPagarFiltros() {
  const [filtros, setFiltros] = useState<FiltrosContaPagar>({
    busca: '',
    status: 'todos',
    contact_id: 'todos', // Mudança de fornecedor_id para contact_id
    category_id: 'todos', // Mudança de plano_conta_id para category_id
    data_inicio: '',
    data_fim: ''
  });

  const [filtroRapido, setFiltroRapido] = useState<'todos' | 'pendente' | 'vencido' | 'vence_7_dias'>('todos');

  // Debounce na busca para otimizar performance
  const buscaDebounced = useDebounce(filtros.busca, 300);

  // Filtros otimizados com memoização
  const filtrosOtimizados = useMemo(() => ({
    ...filtros,
    busca: buscaDebounced
  }), [filtros, buscaDebounced]);

  // Função para aplicar filtros nas contas
  const aplicarFiltros = useMemo(() => (contas: ContaEnriquecida[]) => {
    return contas.filter(conta => {
      // Filtro rápido
      if (filtroRapido !== 'todos') {
        switch (filtroRapido) {
          case 'pendente':
            if (conta.status !== 'pendente') return false;
            break;
          case 'vencido':
            if (conta.status !== 'pendente' || conta.dias_em_atraso === 0) return false;
            break;
          case 'vence_7_dias':
            if (conta.status !== 'pendente' || conta.dias_para_vencimento > 7) return false;
            break;
        }
      }

      // Filtro por busca
      if (filtrosOtimizados.busca) {
        const busca = filtrosOtimizados.busca.toLowerCase();
        const matchDescricao = conta.descricao.toLowerCase().includes(busca);
        const matchContato = conta.contact_nome?.toLowerCase().includes(busca); // Mudança de fornecedor_nome para contact_nome
        const matchDocumento = conta.documento_referencia?.toLowerCase().includes(busca);
        
        if (!matchDescricao && !matchContato && !matchDocumento) return false;
      }

      // Filtro por status
      if (filtrosOtimizados.status !== 'todos' && conta.status !== filtrosOtimizados.status) {
        return false;
      }

      // Filtro por contato (ex-fornecedor)
      if (filtrosOtimizados.contact_id !== 'todos' && conta.contact_id !== filtrosOtimizados.contact_id) {
        return false;
      }

      // Filtro por categoria (ex-plano de conta)
      if (filtrosOtimizados.category_id !== 'todos' && conta.category_id !== filtrosOtimizados.category_id) {
        return false;
      }

      // Filtro por data de vencimento
      if (filtrosOtimizados.data_inicio) {
        if (conta.data_vencimento < filtrosOtimizados.data_inicio) return false;
      }

      if (filtrosOtimizados.data_fim) {
        if (conta.data_vencimento > filtrosOtimizados.data_fim) return false;
      }

      return true;
    });
  }, [filtrosOtimizados, filtroRapido]);

  const limparFiltros = () => {
    setFiltros({
      busca: '',
      status: 'todos',
      contact_id: 'todos', // Mudança de fornecedor_id para contact_id
      category_id: 'todos', // Mudança de plano_conta_id para category_id
      data_inicio: '',
      data_fim: ''
    });
    setFiltroRapido('todos');
  };

  return {
    filtros,
    setFiltros,
    filtroRapido,
    setFiltroRapido,
    filtrosOtimizados,
    aplicarFiltros,
    limparFiltros
  };
}