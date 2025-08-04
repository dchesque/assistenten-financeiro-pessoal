import { useState, useEffect, useCallback } from 'react';
import { PlanoContas, PlanoContasSupabase, planoContasToSupabase, supabaseToPlanoContas } from '@/types/planoContas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface EstatisticasPlanoContas {
  totalContas: number;
  contasAtivas: number;
  contasAnaliticas: number;
  valorTotal: number;
}

export const usePlanoContas = () => {
  const { user } = useAuth();
  const [planoContas, setPlanoContas] = useState<PlanoContas[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    listarPlanoContas();
  }, []);

  const listarPlanoContas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('plano_contas')
        .select(`
          *,
          plano_pai:plano_pai_id(id, codigo, nome)
        `)
        .eq('ativo', true)
        .order('codigo');
      
      if (error) throw error;
      
      const contasConvertidas = (data || []).map(item => supabaseToPlanoContas({
        ...item,
        tipo_dre: 'despesa_pessoal',
        total_contas: item.total_contas || 0,
        valor_total: item.valor_total || 0,
        descricao: item.descricao || undefined
      }));
      setPlanoContas(contasConvertidas);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar plano de contas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const criarPlanoContas = async (novoPlano: Omit<PlanoContas, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    
    try {
      // Validações
      if (await buscarPorCodigo(novoPlano.codigo)) {
        throw new Error('Código já existe no sistema');
      }

      if (novoPlano.plano_pai_id && !(await validarHierarquia(novoPlano.plano_pai_id))) {
        throw new Error('Conta pai deve ser sintética (não aceitar lançamentos)');
      }

      const dadosSupabase = planoContasToSupabase({
        ...novoPlano,
        id: 0,
        total_contas: 0,
        valor_total: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from('plano_contas')
        .insert({
          ...dadosSupabase,
          user_id: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const contaCriada = supabaseToPlanoContas({
        ...data,
        tipo_dre: 'despesa_pessoal',
        total_contas: data.total_contas || 0,
        valor_total: data.valor_total || 0,
        descricao: data.descricao || undefined
      });

      await listarPlanoContas();
      toast.success("Conta criada com sucesso!");

      return contaCriada;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar conta';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const atualizarPlanoContas = async (id: number, dadosAtualizados: Partial<PlanoContas>) => {
    setLoading(true);
    
    try {
      // Validações
      if (dadosAtualizados.codigo) {
        const contaExistente = await buscarPorCodigo(dadosAtualizados.codigo);
        if (contaExistente && contaExistente.id !== id) {
          throw new Error('Código já existe no sistema');
        }
      }

      if (dadosAtualizados.plano_pai_id && !(await validarHierarquia(dadosAtualizados.plano_pai_id))) {
        throw new Error('Conta pai deve ser sintética (não aceitar lançamentos)');
      }

      const { data, error } = await supabase
        .from('plano_contas')
        .update({
          codigo: dadosAtualizados.codigo,
          nome: dadosAtualizados.nome,
          tipo_dre: dadosAtualizados.tipo_dre,
          cor: dadosAtualizados.cor,
          icone: dadosAtualizados.icone,
          nivel: dadosAtualizados.nivel,
          plano_pai_id: dadosAtualizados.plano_pai_id,
          aceita_lancamento: dadosAtualizados.aceita_lancamento,
          
          ativo: dadosAtualizados.ativo
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      const contaAtualizada: PlanoContas = {
        id: data.id,
        codigo: data.codigo,
        nome: data.nome,
        tipo_dre: 'despesa_pessoal',
        cor: data.cor || '#6B7280',
        icone: data.icone || 'Package',
        nivel: data.nivel,
        plano_pai_id: data.plano_pai_id,
        aceita_lancamento: data.aceita_lancamento,
        ativo: data.ativo,
        total_contas: 0,
        valor_total: 0,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      await listarPlanoContas();
      toast.success("Conta atualizada com sucesso!");

      return contaAtualizada;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar conta';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const excluirPlanoContas = async (id: number) => {
    setLoading(true);
    
    try {
      // Verificar dependências
      const temFilhas = planoContas.some(p => p.plano_pai_id === id);
      if (temFilhas) {
        throw new Error('Não é possível excluir conta que possui contas filhas');
      }

      // Verificar lançamentos vinculados no Supabase
      const { data: lancamentos } = await supabase
        .from('contas_pagar')
        .select('id')
        .eq('plano_conta_id', id)
        .limit(1);
      
      if (lancamentos && lancamentos.length > 0) {
        throw new Error('Não é possível excluir conta que possui lançamentos vinculados');
      }

      const { error } = await supabase
        .from('plano_contas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      await listarPlanoContas();
      toast.success("Conta excluída com sucesso!");
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir conta';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const buscarPorCodigo = async (codigo: string): Promise<PlanoContas | null> => {
    try {
      const { data, error } = await supabase
        .from('plano_contas')
        .select('*')
        .eq('codigo', codigo)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;

      return {
        id: data.id,
        codigo: data.codigo,
        nome: data.nome,
        tipo_dre: 'despesa_pessoal',
        cor: data.cor || '#6B7280',
        icone: data.icone || 'Package',
        nivel: data.nivel,
        plano_pai_id: data.plano_pai_id,
        aceita_lancamento: data.aceita_lancamento,
        
        ativo: data.ativo,
        total_contas: 0,
        valor_total: 0,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao buscar por código:', error);
      return null;
    }
  };

  const validarHierarquia = async (paiId: number): Promise<boolean> => {
    // Pai deve ser sintético (aceita_lancamento = false)
    const pai = planoContas.find(p => p.id === paiId);
    return pai ? !pai.aceita_lancamento : false;
  };

  const atualizarTotaisPai = async (paiId: number) => {
    try {
      await supabase.rpc('atualizar_totais_plano_pai', { plano_id: paiId });
    } catch (error) {
      console.error('Erro ao atualizar totais do pai:', error);
    }
  };

  const gerarProximoCodigo = async (paiId?: number): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('gerar_proximo_codigo_plano_contas', { pai_id: paiId });
      if (error) throw error;
      return data || '1';
    } catch (error) {
      console.error('Erro ao gerar próximo código:', error);
      return '1';
    }
  };

  const buscarContas = (termo: string): PlanoContas[] => {
    if (!termo) return planoContas.slice(0, 20);
    
    const termoLower = termo.toLowerCase();
    return planoContas
      .filter(conta => 
        conta.nome.toLowerCase().includes(termoLower) ||
        conta.codigo.toLowerCase().includes(termoLower) ||
        (conta as any).descricao?.toLowerCase().includes(termoLower)
      )
      .slice(0, 20);
  };

  const obterEstatisticas = (): EstatisticasPlanoContas => {
    return {
      totalContas: planoContas.length,
      contasAtivas: planoContas.filter(p => p.ativo).length,
      contasAnaliticas: planoContas.filter(p => p.aceita_lancamento).length,
      valorTotal: planoContas.reduce((acc, p) => acc + p.valor_total, 0)
    };
  };

  const obterContasPai = (): PlanoContas[] => {
    // Retorna apenas contas sintéticas (que não aceitam lançamento)
    return planoContas.filter(p => !p.aceita_lancamento && p.ativo);
  };

  const buscarContasAnaliticas = useCallback(async (termo?: string, tipoFornecedor?: 'receita' | 'despesa', tipoDreEspecifico?: string): Promise<PlanoContas[]> => {
    try {
      let query = supabase
        .from('plano_contas')
        .select('*')
        .eq('ativo', true)
        .eq('aceita_lancamento', true)
        .order('codigo');

      // Se há um tipo DRE específico, usar ele primeiro
      if (tipoDreEspecifico) {
        query = query.eq('tipo_dre', tipoDreEspecifico);
      } else if (tipoFornecedor === 'receita') {
        // Para receita, usar despesa_pessoal também (sistema só tem despesas agora)
        query = query.eq('tipo_dre', 'despesa_pessoal');
      } else if (tipoFornecedor === 'despesa') {
        query = query.eq('tipo_dre', 'despesa_pessoal');
      }

      // Filtrar por termo de busca se especificado
      if (termo && termo.trim()) {
        query = query.or(`nome.ilike.%${termo}%,codigo.ilike.%${termo}%,observacoes.ilike.%${termo}%`);
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        codigo: item.codigo,
        nome: item.nome,
        tipo_dre: 'despesa_pessoal',
        cor: item.cor || '#6B7280',
        icone: item.icone || 'Package',
        nivel: item.nivel,
        plano_pai_id: item.plano_pai_id,
        aceita_lancamento: item.aceita_lancamento,
        ativo: item.ativo,
        total_contas: 0,
        valor_total: 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Erro ao buscar contas analíticas:', error);
      return [];
    }
  }, []);

  return {
    planoContas,
    loading,
    error,
    listarPlanoContas,
    criarPlanoContas,
    atualizarPlanoContas,
    excluirPlanoContas,
    buscarPorCodigo,
    validarHierarquia,
    atualizarTotaisPai,
    gerarProximoCodigo,
    buscarContas,
    obterEstatisticas,
    obterContasPai,
    buscarContasAnaliticas
  };
};