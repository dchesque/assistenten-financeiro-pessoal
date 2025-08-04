import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { CredorPessoal, FiltrosCredor } from '@/types/credorPessoal';
import { mockCredoresPersonais } from '@/utils/mockDadosPessoais';

export const useCredoresPessoais = () => {
  const [credores, setCredores] = useState<CredorPessoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const STORAGE_KEY = `credores_pessoais_${user?.id}`;

  const carregarCredores = (filtros?: FiltrosCredor) => {
    if (!user) return;

    try {
      setLoading(true);
      const dados = localStorage.getItem(STORAGE_KEY);
      let credoresCarregados: CredorPessoal[] = [];

      if (dados) {
        credoresCarregados = JSON.parse(dados);
      } else {
        // Criar credores padrão se não existirem
        credoresCarregados = criarCredoresDefault();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credoresCarregados));
      }

      // Aplicar filtros
      let credoresFiltrados = credoresCarregados;
      
      if (filtros?.tipo) {
        credoresFiltrados = credoresFiltrados.filter(credor => credor.tipo === filtros.tipo);
      }
      
      if (filtros?.ativo !== undefined) {
        credoresFiltrados = credoresFiltrados.filter(credor => credor.ativo === filtros.ativo);
      }

      if (filtros?.estado) {
        credoresFiltrados = credoresFiltrados.filter(credor => credor.estado === filtros.estado);
      }

      if (filtros?.busca) {
        const busca = filtros.busca.toLowerCase();
        credoresFiltrados = credoresFiltrados.filter(credor => 
          credor.nome.toLowerCase().includes(busca) ||
          credor.documento?.toLowerCase().includes(busca) ||
          credor.email?.toLowerCase().includes(busca)
        );
      }

      setCredores(credoresFiltrados.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error('Erro ao carregar credores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os credores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarCredoresDefault = (): CredorPessoal[] => {
    const agora = new Date().toISOString();
    return mockCredoresPersonais.map(credor => ({
      ...credor,
      tipo: credor.tipo as 'pessoa_fisica' | 'pessoa_juridica',
      user_id: user?.id || '',
      created_at: agora,
      updated_at: agora
    }));
  };

  const criarCredor = (credor: Omit<CredorPessoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_contas' | 'valor_total' | 'ultima_conta'>) => {
    if (!user) return null;

    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      const credoresExistentes: CredorPessoal[] = dados ? JSON.parse(dados) : [];
      
      const novoCredor: CredorPessoal = {
        ...credor,
        id: Math.max(0, ...credoresExistentes.map(c => c.id)) + 1,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_contas: 0,
        valor_total: 0
      };

      const novosCredores = [...credoresExistentes, novoCredor];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novosCredores));
      
      carregarCredores(); // Recarregar para atualizar a lista
      
      toast({
        title: "Sucesso",
        description: "Credor criado com sucesso"
      });

      return novoCredor;
    } catch (error) {
      console.error('Erro ao criar credor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o credor",
        variant: "destructive"
      });
      return null;
    }
  };

  const atualizarCredor = (id: number, dados: Partial<CredorPessoal>) => {
    if (!user) return null;

    try {
      const dadosStorage = localStorage.getItem(STORAGE_KEY);
      const credoresExistentes: CredorPessoal[] = dadosStorage ? JSON.parse(dadosStorage) : [];
      
      const indice = credoresExistentes.findIndex(c => c.id === id);
      if (indice === -1) {
        throw new Error('Credor não encontrado');
      }

      const credorAtualizado = {
        ...credoresExistentes[indice],
        ...dados,
        updated_at: new Date().toISOString()
      };

      credoresExistentes[indice] = credorAtualizado;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credoresExistentes));
      
      carregarCredores(); // Recarregar para atualizar a lista

      toast({
        title: "Sucesso",
        description: "Credor atualizado com sucesso"
      });

      return credorAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar credor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o credor",
        variant: "destructive"
      });
      return null;
    }
  };

  const excluirCredor = (id: number) => {
    if (!user) return false;

    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      const credoresExistentes: CredorPessoal[] = dados ? JSON.parse(dados) : [];
      
      const novosCredores = credoresExistentes.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novosCredores));
      
      carregarCredores(); // Recarregar para atualizar a lista
      
      toast({
        title: "Sucesso",
        description: "Credor excluído com sucesso"
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir credor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o credor",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      carregarCredores();
    }
  }, [user]);

  return {
    credores,
    loading,
    carregarCredores,
    criarCredor,
    atualizarCredor,
    excluirCredor
  };
};