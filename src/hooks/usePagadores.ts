import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import type { 
  Pagador, 
  CriarPagador, 
  AtualizarPagador, 
  FiltrosPagador, 
  EstatisticasPagador 
} from '@/types/pagador';

export function usePagadores() {
  const [pagadores, setPagadores] = useState<Pagador[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const carregarPagadores = async (filtros?: FiltrosPagador) => {
    if (!user) return;

    setLoading(true);
    try {
      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let pagadoresFiltered: any[] = [];

      if (filtros?.busca) {
        const busca = filtros.busca.toLowerCase();
        pagadoresFiltered = pagadoresFiltered.filter(p =>
          p.nome.toLowerCase().includes(busca) ||
          p.documento.includes(busca) ||
          p.email.toLowerCase().includes(busca)
        );
      }

      if (filtros?.tipo) {
        pagadoresFiltered = pagadoresFiltered.filter(p => p.tipo === filtros.tipo);
      }

      if (filtros?.ativo !== undefined) {
        pagadoresFiltered = pagadoresFiltered.filter(p => p.ativo === filtros.ativo);
      }

      // Ordenar por nome
      pagadoresFiltered.sort((a, b) => a.nome.localeCompare(b.nome));

      setPagadores(pagadoresFiltered);
    } catch (error) {
      console.error('Erro ao carregar pagadores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pagadores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const criarPagador = async (dados: CriarPagador): Promise<boolean> => {
    if (!user) return false;

    try {
      // Simular criação
      const novoPagador: Pagador = {
        id: Date.now(), // ID temporário
        ...dados,
        ativo: dados.ativo ?? true,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      setPagadores(prev => [...prev, novoPagador]);

      toast({
        title: 'Sucesso',
        description: 'Pagador criado com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar pagador:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o pagador',
        variant: 'destructive',
      });
      return false;
    }
  };

  const atualizarPagador = async (dados: AtualizarPagador): Promise<boolean> => {
    try {
      const { id, ...dadosAtualizacao } = dados;
      
      setPagadores(prev => prev.map(p => 
        p.id === id ? { ...p, ...dadosAtualizacao } : p
      ));

      toast({
        title: 'Sucesso',
        description: 'Pagador atualizado com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar pagador:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o pagador',
        variant: 'destructive',
      });
      return false;
    }
  };

  const excluirPagador = async (id: number): Promise<boolean> => {
    try {
      setPagadores(prev => prev.filter(p => p.id !== id));

      toast({
        title: 'Sucesso',
        description: 'Pagador excluído com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir pagador:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o pagador',
        variant: 'destructive',
      });
      return false;
    }
  };

  const obterEstatisticas = (): EstatisticasPagador => {
    const total_pagadores = pagadores.length;
    const pessoas_fisicas = pagadores.filter(p => p.tipo === 'pessoa_fisica').length;
    const pessoas_juridicas = pagadores.filter(p => p.tipo === 'pessoa_juridica').length;
    const ativos = pagadores.filter(p => p.ativo).length;
    const inativos = pagadores.filter(p => !p.ativo).length;

    return {
      total_pagadores,
      pessoas_fisicas,
      pessoas_juridicas,
      ativos,
      inativos,
    };
  };

  useEffect(() => {
    if (user) {
      carregarPagadores();
    }
  }, [user]);

  return {
    pagadores,
    loading,
    carregarPagadores,
    criarPagador,
    atualizarPagador,
    excluirPagador,
    obterEstatisticas,
  };
}