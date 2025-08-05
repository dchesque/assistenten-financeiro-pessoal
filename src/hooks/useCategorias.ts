import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCategoriasDespesas } from './useCategoriasDespesas';
import { useCategoriasReceitas } from './useCategoriasReceitas';
import type { 
  Categoria, 
  CriarCategoria, 
  AtualizarCategoria, 
  FiltrosCategoria,
  EstatisticasCategoria 
} from '@/types/categoria';
import type { CategoriaDespesa } from '@/types/categoriaDespesa';
import type { CategoriaReceita } from '@/types/categoriaReceita';

export function useCategorias() {
  const {
    categorias: categoriasDespesas,
    loading: loadingDespesas,
    error: errorDespesas,
    carregarCategorias: carregarDespesas,
    criarCategoria: criarDespesa,
    atualizarCategoria: atualizarDespesa,
    excluirCategoria: excluirDespesa,
    buscarCategorias: buscarDespesas
  } = useCategoriasDespesas();

  const {
    categorias: categoriasReceitas,
    loading: loadingReceitas,
    carregarCategorias: carregarReceitas,
    criarCategoria: criarReceita,
    atualizarCategoria: atualizarReceita,
    excluirCategoria: excluirReceita,
    obterEstatisticas: estatisticasReceitas
  } = useCategoriasReceitas();

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Converter CategoriaDespesa para Categoria
  const despesaParaCategoria = (despesa: CategoriaDespesa): Categoria => ({
    id: despesa.id,
    nome: despesa.nome,
    tipo: 'despesa' as const,
    grupo: despesa.grupo,
    cor: despesa.cor,
    icone: despesa.icone,
    user_id: despesa.user_id,
    created_at: despesa.created_at,
    updated_at: despesa.updated_at,
    ativo: despesa.ativo
  });

  // Converter CategoriaReceita para Categoria
  const receitaParaCategoria = (receita: CategoriaReceita): Categoria => ({
    id: receita.id,
    nome: receita.nome,
    tipo: 'receita' as const,
    grupo: receita.grupo,
    cor: receita.cor,
    icone: receita.icone,
    user_id: receita.user_id,
    created_at: receita.created_at,
    updated_at: receita.updated_at || receita.created_at,
    ativo: true
  });

  // Computar estados derivados
  const loading = loadingDespesas || loadingReceitas;
  const error = errorDespesas;

  // Atualizar lista unificada quando as categorias individuais mudarem
  useEffect(() => {
    const despesasConvertidas = categoriasDespesas.map(despesaParaCategoria);
    const receitasConvertidas = categoriasReceitas.map(receitaParaCategoria);
    
    const todasCategorias = [...despesasConvertidas, ...receitasConvertidas];
    
    // Ordenar por tipo, depois por grupo, depois por nome
    todasCategorias.sort((a, b) => {
      if (a.tipo !== b.tipo) {
        return a.tipo === 'despesa' ? -1 : 1;
      }
      if (a.grupo !== b.grupo) {
        return a.grupo.localeCompare(b.grupo);
      }
      return a.nome.localeCompare(b.nome);
    });
    
    setCategorias(todasCategorias);
  }, [categoriasDespesas, categoriasReceitas]);

  const carregarCategorias = async (filtros?: FiltrosCategoria) => {
    const promises = [];
    
    if (!filtros?.tipo || filtros.tipo === 'todos' || filtros.tipo === 'despesa') {
      const filtrosDespesas = {
        busca: filtros?.busca,
        grupo: filtros?.grupo,
        ativo: filtros?.ativo
      };
      promises.push(carregarDespesas(filtrosDespesas));
    }
    
    if (!filtros?.tipo || filtros.tipo === 'todos' || filtros.tipo === 'receita') {
      const filtrosReceitas = {
        busca: filtros?.busca,
        grupo: filtros?.grupo
      };
      promises.push(carregarReceitas(filtrosReceitas));
    }
    
    await Promise.all(promises);
  };

  const criarCategoria = async (dados: CriarCategoria): Promise<boolean> => {
    try {
      if (dados.tipo === 'despesa') {
        await criarDespesa({
          nome: dados.nome,
          grupo: dados.grupo as any,
          cor: dados.cor,
          icone: dados.icone,
          ativo: true
        });
      } else {
        await criarReceita({
          nome: dados.nome,
          grupo: dados.grupo,
          cor: dados.cor,
          icone: dados.icone
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const atualizarCategoria = async (dados: AtualizarCategoria): Promise<boolean> => {
    try {
      const categoriaAtual = categorias.find(c => c.id === dados.id);
      if (!categoriaAtual) {
        toast.error('Categoria não encontrada');
        return false;
      }

      if (categoriaAtual.tipo === 'despesa') {
        const dadosAtualizacao: any = {};
        if (dados.nome) dadosAtualizacao.nome = dados.nome;
        if (dados.grupo) dadosAtualizacao.grupo = dados.grupo;
        if (dados.cor) dadosAtualizacao.cor = dados.cor;
        if (dados.icone) dadosAtualizacao.icone = dados.icone;
        
        await atualizarDespesa(dados.id, dadosAtualizacao);
      } else {
        await atualizarReceita(dados);
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const excluirCategoria = async (id: number): Promise<boolean> => {
    try {
      const categoriaAtual = categorias.find(c => c.id === id);
      if (!categoriaAtual) {
        toast.error('Categoria não encontrada');
        return false;
      }

      if (categoriaAtual.tipo === 'despesa') {
        await excluirDespesa(id);
      } else {
        await excluirReceita(id);
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const buscarCategorias = async (termo?: string, tipo?: 'despesa' | 'receita', grupo?: string): Promise<Categoria[]> => {
    const resultados: Categoria[] = [];
    
    if (!tipo || tipo === 'despesa') {
      const despesas = await buscarDespesas(termo, grupo);
      resultados.push(...despesas.map(despesaParaCategoria));
    }
    
    if (!tipo || tipo === 'receita') {
      const receitas = categoriasReceitas.filter(r => {
        if (termo && !r.nome.toLowerCase().includes(termo.toLowerCase())) return false;
        if (grupo && r.grupo !== grupo) return false;
        return true;
      });
      resultados.push(...receitas.map(receitaParaCategoria));
    }
    
    return resultados;
  };

  const obterEstatisticas = (): EstatisticasCategoria => {
    const despesas = categorias.filter(c => c.tipo === 'despesa');
    const receitas = categorias.filter(c => c.tipo === 'receita');
    
    const porGrupo: Record<string, number> = {};
    categorias.forEach(categoria => {
      const chave = `${categoria.tipo}_${categoria.grupo}`;
      porGrupo[chave] = (porGrupo[chave] || 0) + 1;
    });

    return {
      total_categorias: categorias.length,
      total_despesas: despesas.length,
      total_receitas: receitas.length,
      por_grupo: porGrupo
    };
  };

  return {
    categorias,
    loading,
    error,
    carregarCategorias,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
    buscarCategorias,
    obterEstatisticas
  };
}