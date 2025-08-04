import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Banco } from '@/types/banco';

// Estatísticas bancárias
export interface EstatisticasBanco {
  total_bancos: number;
  bancos_ativos: number;
  saldo_total: number;
  movimentacoes_mes: number;
  maior_saldo: number;
  menor_saldo: number;
}

interface UseBancosReturn {
  bancos: Banco[];
  loading: boolean;
  error: string | null;
  estatisticas: EstatisticasBanco;
  criarBanco: (banco: Omit<Banco, 'id' | 'created_at' | 'updated_at'>) => Promise<Banco>;
  atualizarBanco: (id: number, banco: Partial<Banco>) => Promise<Banco>;
  excluirBanco: (id: number) => Promise<void>;
  recarregar: () => Promise<void>;
}

export const useBancosSupabase = (): UseBancosReturn => {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasBanco>({
    total_bancos: 0,
    bancos_ativos: 0,
    saldo_total: 0,
    movimentacoes_mes: 0,
    maior_saldo: 0,
    menor_saldo: 0
  });
  const { toast } = useToast();

  // Converter dados do Supabase para Banco
  const supabaseToBanco = (data: any): Banco => ({
    id: data.id,
    nome: data.nome,
    agencia: data.agencia,
    conta: data.conta,
    codigo_banco: data.codigo_banco,
    digito_verificador: data.digito_verificador || '',
    tipo_conta: data.tipo_conta || 'conta_corrente',
    saldo_inicial: Number(data.saldo_inicial || 0),
    saldo_atual: Number(data.saldo_atual || 0),
    limite: Number(data.limite_conta || 0),
    limite_usado: 0,
    suporta_ofx: data.suporta_ofx || false,
    url_ofx: data.url_ofx,
    ultimo_fitid: data.ultimo_fitid,
    data_ultima_sincronizacao: data.data_ultima_sincronizacao,
    gerente: data.gerente,
    telefone: data.telefone,
    email: data.email,
    observacoes: data.observacoes,
    ativo: data.ativo,
    created_at: data.created_at,
    updated_at: data.updated_at
  });

  // Converter Banco para dados do Supabase
  const bancoToSupabase = (banco: Partial<Banco>) => {
    const dados: any = {};
    
    if (banco.nome !== undefined) dados.nome = banco.nome;
    if (banco.agencia !== undefined) dados.agencia = banco.agencia;
    if (banco.conta !== undefined) dados.conta = banco.conta;
    if (banco.codigo_banco !== undefined) dados.codigo_banco = banco.codigo_banco;
    if (banco.tipo_conta !== undefined) dados.tipo_conta = banco.tipo_conta;
    if (banco.saldo_inicial !== undefined) dados.saldo_inicial = banco.saldo_inicial;
    if (banco.saldo_atual !== undefined) dados.saldo_atual = banco.saldo_atual;
    if (banco.limite !== undefined) dados.limite_conta = banco.limite;
    if (banco.observacoes !== undefined) dados.observacoes = banco.observacoes;
    if (banco.ativo !== undefined) dados.ativo = banco.ativo;

    return dados;
  };

  // Carregar lista de bancos
  const listarBancos = async () => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('bancos')
        .select('*')
        .order('nome');

      if (supabaseError) {
        throw supabaseError;
      }

      const bancosConvertidos = data?.map(supabaseToBanco) || [];
      setBancos(bancosConvertidos);
      calcularEstatisticas(bancosConvertidos);
    } catch (err: any) {
      const mensagemErro = 'Erro ao carregar bancos';
      setError(mensagemErro);
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive"
      });
      console.error('Erro ao listar bancos:', err);
    }
  };

  // Calcular estatísticas
  const calcularEstatisticas = (bancosData: Banco[]) => {
    const total = bancosData.length;
    const ativos = bancosData.filter(b => b.ativo).length;
    const saldoTotal = bancosData.reduce((sum, b) => sum + (b.saldo_atual || 0), 0);
    const saldos = bancosData.map(b => b.saldo_atual || 0);
    const maiorSaldo = saldos.length > 0 ? Math.max(...saldos) : 0;
    const menorSaldo = saldos.length > 0 ? Math.min(...saldos) : 0;

    setEstatisticas({
      total_bancos: total,
      bancos_ativos: ativos,
      saldo_total: saldoTotal,
      movimentacoes_mes: 0, // Será calculado depois
      maior_saldo: maiorSaldo,
      menor_saldo: menorSaldo
    });
  };

  // Criar banco
  const criarBanco = async (bancoData: Omit<Banco, 'id' | 'created_at' | 'updated_at'>): Promise<Banco> => {
    try {
      const dadosSupabase = bancoToSupabase(bancoData);

      const { data, error: supabaseError } = await supabase
        .from('bancos')
        .insert(dadosSupabase)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const novoBanco = supabaseToBanco(data);
      
      toast({
        title: "Sucesso",
        description: "Banco criado com sucesso!",
        variant: "default"
      });

      await recarregar();
      return novoBanco;
    } catch (err: any) {
      const mensagemErro = err.message || 'Erro ao criar banco';
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Atualizar banco
  const atualizarBanco = async (id: number, bancoData: Partial<Banco>): Promise<Banco> => {
    try {
      const dadosSupabase = bancoToSupabase(bancoData);

      const { data, error: supabaseError } = await supabase
        .from('bancos')
        .update(dadosSupabase)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      const bancoAtualizado = supabaseToBanco(data);
      
      toast({
        title: "Sucesso",
        description: "Banco atualizado com sucesso!",
        variant: "default"
      });

      await recarregar();
      return bancoAtualizado;
    } catch (err: any) {
      const mensagemErro = err.message || 'Erro ao atualizar banco';
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Excluir banco
  const excluirBanco = async (id: number): Promise<void> => {
    try {
      // Verificar se existem movimentações vinculadas
      const { data: movimentacoes, error: errorMovimentacoes } = await supabase
        .from('movimentacoes_bancarias')
        .select('id')
        .eq('banco_id', id)
        .limit(1);

      if (errorMovimentacoes) {
        throw errorMovimentacoes;
      }

      if (movimentacoes && movimentacoes.length > 0) {
        throw new Error('Não é possível excluir o banco pois existem movimentações vinculadas');
      }

      const { error: supabaseError } = await supabase
        .from('bancos')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      toast({
        title: "Sucesso",
        description: "Banco excluído com sucesso!",
        variant: "default"
      });

      await recarregar();
    } catch (err: any) {
      const mensagemErro = err.message || 'Erro ao excluir banco';
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Recarregar todos os dados
  const recarregar = async () => {
    setLoading(true);
    await listarBancos();
    setLoading(false);
  };

  // Carregar dados iniciais
  useEffect(() => {
    recarregar();
  }, []);

  return {
    bancos,
    loading,
    error,
    estatisticas,
    criarBanco,
    atualizarBanco,
    excluirBanco,
    recarregar
  };
};