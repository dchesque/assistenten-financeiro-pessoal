import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TaxaMaquininha } from '@/types/maquininha';

export const useTaxasMaquininha = () => {
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Carregar taxas de uma maquininha específica
  const carregarTaxasMaquininha = async (maquininhaId: string): Promise<TaxaMaquininha[]> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('taxas_maquininha')
        .select('*')
        .eq('maquininha_id', maquininhaId)
        .eq('ativo', true)
        .order('bandeira, tipo_transacao');

      if (error) throw error;

      return (data || []).map(taxa => ({
        id: taxa.id,
        maquininha_id: taxa.maquininha_id,
        bandeira: taxa.bandeira as any,
        tipo_transacao: taxa.tipo_transacao as any,
        parcelas_max: taxa.parcelas_max,
        taxa_percentual: taxa.taxa_percentual,
        taxa_fixa: taxa.taxa_fixa || 0,
        ativo: taxa.ativo
      }));
    } catch (err) {
      console.error('Erro ao carregar taxas:', err);
      toast.error('Erro ao carregar taxas da maquininha');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Salvar todas as taxas de uma maquininha
  const salvarTaxasMaquininha = async (
    maquininhaId: string, 
    taxas: Omit<TaxaMaquininha, 'id' | 'maquininha_id'>[]
  ): Promise<void> => {
    try {
      setSalvando(true);

      // Primeiro, desativar todas as taxas existentes
      const { error: desativarError } = await supabase
        .from('taxas_maquininha')
        .update({ ativo: false })
        .eq('maquininha_id', maquininhaId);

      if (desativarError) throw desativarError;

      // Inserir novas taxas
      if (taxas.length > 0) {
        const taxasData = taxas.map(taxa => ({
          maquininha_id: maquininhaId,
          bandeira: taxa.bandeira,
          tipo_transacao: taxa.tipo_transacao,
          parcelas_max: taxa.parcelas_max,
          taxa_percentual: taxa.taxa_percentual,
          taxa_fixa: taxa.taxa_fixa || 0,
          ativo: true
        }));

        const { error: inserirError } = await supabase
          .from('taxas_maquininha')
          .insert(taxasData);

        if (inserirError) throw inserirError;
      }

      toast.success('Taxas atualizadas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar taxas:', err);
      toast.error('Erro ao salvar taxas da maquininha');
      throw err;
    } finally {
      setSalvando(false);
    }
  };

  // Atualizar uma taxa específica
  const atualizarTaxa = async (
    taxaId: string, 
    dadosAtualizados: Partial<Omit<TaxaMaquininha, 'id' | 'maquininha_id'>>
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from('taxas_maquininha')
        .update(dadosAtualizados)
        .eq('id', taxaId);

      if (error) throw error;

      toast.success('Taxa atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar taxa:', err);
      toast.error('Erro ao atualizar taxa');
      throw err;
    }
  };

  // Excluir uma taxa
  const excluirTaxa = async (taxaId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('taxas_maquininha')
        .update({ ativo: false })
        .eq('id', taxaId);

      if (error) throw error;

      toast.success('Taxa removida com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir taxa:', err);
      toast.error('Erro ao remover taxa');
      throw err;
    }
  };

  return {
    loading,
    salvando,
    carregarTaxasMaquininha,
    salvarTaxasMaquininha,
    atualizarTaxa,
    excluirTaxa
  };
};