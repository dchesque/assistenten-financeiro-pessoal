import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LancamentoLoteFormData, ParcelaPreview } from '@/types/lancamentoLote';
import { FormaPagamento } from '@/types/formaPagamento';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ValidacaoSimples {
  isValid: boolean;
  errors: string[];
}

export interface ResultadoLancamento {
  sucesso: boolean;
  loteId?: string;
  totalParcelas?: number;
  erros?: string[];
}

export function useLancamentoLoteSimplificado() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);

  // Validação simplificada
  const validarLancamento = useCallback((
    formData: LancamentoLoteFormData,
    parcelas: ParcelaPreview[],
    formaPagamento: FormaPagamento
  ): ValidacaoSimples => {
    const errors: string[] = [];

    // Validações básicas
    if (!formData.fornecedor_id) {
      errors.push('Fornecedor é obrigatório');
    }

    if (!formData.plano_conta_id) {
      errors.push('Categoria é obrigatória');
    }

    if (!formData.descricao || formData.descricao.trim().length < 3) {
      errors.push('Descrição deve ter pelo menos 3 caracteres');
    }

    if (parcelas.length < 2) {
      errors.push('Deve ter pelo menos 2 parcelas');
    }

    if (parcelas.length > 100) {
      errors.push('Máximo de 100 parcelas permitidas');
    }

    // Validações básicas de forma de pagamento
    if (formaPagamento.tipo === 'cartao' && !formaPagamento.tipo_cartao) {
      errors.push('Tipo de cartão é obrigatório');
    }

    // Validar valores e datas
    const valorInvalido = parcelas.some(p => p.valor <= 0);
    if (valorInvalido) {
      errors.push('Todas as parcelas devem ter valor maior que zero');
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataInvalida = parcelas.some(p => new Date(p.data_vencimento) < hoje);
    if (dataInvalida) {
      errors.push('Datas de vencimento não podem ser no passado');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Executar lançamento simplificado
  const executarLancamento = useCallback(async (
    formData: LancamentoLoteFormData,
    parcelas: ParcelaPreview[],
    formaPagamento: FormaPagamento
  ): Promise<ResultadoLancamento> => {
    setLoading(true);
    setProgresso(0);

    try {
      // Verificar autenticação
      if (!user?.id) {
        return {
          sucesso: false,
          erros: ['Usuário não autenticado']
        };
      }

      setProgresso(10);

      // Validar dados
      const validacao = validarLancamento(formData, parcelas, formaPagamento);
      if (!validacao.isValid) {
        return {
          sucesso: false,
          erros: validacao.errors
        };
      }

      setProgresso(30);

      // Preparar dados para a função SQL
      const contasData = parcelas.map(parcela => ({
        fornecedor_id: formData.fornecedor_id!,
        plano_conta_id: formData.plano_conta_id!,
        documento_referencia: formData.documento_referencia || null,
        descricao: formData.descricao,
        data_vencimento: parcela.data_vencimento,
        valor_original: parcela.valor,
        valor_final: parcela.valor,
        status: 'pendente',
        parcela_atual: parcela.numero,
        total_parcelas: parcelas.length,
        forma_pagamento: formaPagamento.tipo,
        banco_id: formaPagamento.banco_id || null,
        data_emissao: formData.data_emissao
      }));

      setProgresso(50);

      // Não há mais dados de cheques
      let chequesData = null;

      setProgresso(70);

      // Chamar função SQL simplificada
      const { data: resultado, error } = await supabase
        .rpc('processar_lote_contas_simplificado', {
          contas_data: contasData,
          cheques_data: chequesData
        });

      if (error) {
        console.error('Erro na função SQL:', error);
        throw new Error(error.message);
      }

      setProgresso(90);

      // Processar resultado
      if (!resultado || !Array.isArray(resultado) || resultado.length === 0) {
        throw new Error('Função SQL não retornou dados');
      }

      const res = resultado[0] as any; // Tipo forçado para contornar limitação do Supabase types
      
      if (!res?.sucesso) {
        throw new Error(res?.erro_mensagem || 'Erro desconhecido');
      }

      setProgresso(100);

      return {
        sucesso: true,
        loteId: res.lote_id,
        totalParcelas: res.contas_criadas
      };

    } catch (error) {
      console.error('Erro no lançamento:', error);
      return {
        sucesso: false,
        erros: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    } finally {
      setLoading(false);
      setTimeout(() => setProgresso(0), 2000);
    }
  }, [user, validarLancamento]);

  return {
    loading,
    progresso,
    validarLancamento,
    executarLancamento
  };
}