import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  CategoriaDespesa, 
  FiltrosCategoria,
  GRUPOS_CATEGORIA 
} from '@/types/categoriaDespesa';

export const useCategoriasDespesasPessoais = () => {
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const STORAGE_KEY = `categorias_pessoais_${user?.id}`;

  const carregarCategorias = (filtros?: FiltrosCategoria) => {
    if (!user) return;

    try {
      setLoading(true);
      const dados = localStorage.getItem(STORAGE_KEY);
      let categoriasCarregadas: CategoriaDespesa[] = [];

      if (dados) {
        categoriasCarregadas = JSON.parse(dados);
      } else {
        // Criar categorias padrão se não existirem
        categoriasCarregadas = criarCategoriasDefault();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(categoriasCarregadas));
      }

      // Aplicar filtros
      let categoriasFiltradas = categoriasCarregadas;
      
      if (filtros?.grupo) {
        categoriasFiltradas = categoriasFiltradas.filter(cat => cat.grupo === filtros.grupo);
      }
      
      if (filtros?.ativo !== undefined) {
        categoriasFiltradas = categoriasFiltradas.filter(cat => cat.ativo === filtros.ativo);
      }

      if (filtros?.busca) {
        const busca = filtros.busca.toLowerCase();
        categoriasFiltradas = categoriasFiltradas.filter(cat => 
          cat.nome.toLowerCase().includes(busca)
        );
      }

      setCategorias(categoriasFiltradas.sort((a, b) => {
        if (a.grupo !== b.grupo) {
          return a.grupo.localeCompare(b.grupo);
        }
        return a.nome.localeCompare(b.nome);
      }));
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarCategoriasDefault = (): CategoriaDespesa[] => {
    const agora = new Date().toISOString();
    return [
      // Moradia
      { id: 1, nome: 'Aluguel/Financiamento', grupo: 'moradia', cor: '#3B82F6', icone: 'Home', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 2, nome: 'Condomínio', grupo: 'moradia', cor: '#3B82F6', icone: 'Building', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 3, nome: 'Energia Elétrica', grupo: 'moradia', cor: '#F59E0B', icone: 'Zap', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 4, nome: 'Água e Esgoto', grupo: 'moradia', cor: '#06B6D4', icone: 'Droplets', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 5, nome: 'Gás', grupo: 'moradia', cor: '#EF4444', icone: 'Flame', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 6, nome: 'Internet e TV', grupo: 'moradia', cor: '#8B5CF6', icone: 'Wifi', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      
      // Transporte
      { id: 7, nome: 'Combustível', grupo: 'transporte', cor: '#059669', icone: 'Fuel', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 8, nome: 'Transporte Público', grupo: 'transporte', cor: '#0EA5E9', icone: 'Bus', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 9, nome: 'Manutenção Veículo', grupo: 'transporte', cor: '#DC2626', icone: 'Wrench', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 10, nome: 'Estacionamento', grupo: 'transporte', cor: '#7C3AED', icone: 'ParkingCircle', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      
      // Alimentação
      { id: 11, nome: 'Supermercado', grupo: 'alimentacao', cor: '#16A34A', icone: 'ShoppingCart', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 12, nome: 'Restaurantes', grupo: 'alimentacao', cor: '#EA580C', icone: 'UtensilsCrossed', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 13, nome: 'Delivery', grupo: 'alimentacao', cor: '#DB2777', icone: 'Bike', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      
      // Saúde
      { id: 14, nome: 'Plano de Saúde', grupo: 'saude', cor: '#DC2626', icone: 'Heart', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 15, nome: 'Consultas Médicas', grupo: 'saude', cor: '#059669', icone: 'Stethoscope', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 16, nome: 'Medicamentos', grupo: 'saude', cor: '#7C3AED', icone: 'Pill', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 17, nome: 'Academia/Exercícios', grupo: 'saude', cor: '#EA580C', icone: 'Dumbbell', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      
      // Educação
      { id: 18, nome: 'Cursos', grupo: 'educacao', cor: '#0EA5E9', icone: 'GraduationCap', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 19, nome: 'Livros', grupo: 'educacao', cor: '#8B5CF6', icone: 'Book', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 20, nome: 'Material Escolar', grupo: 'educacao', cor: '#F59E0B', icone: 'PenTool', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      
      // Lazer
      { id: 21, nome: 'Cinema/Teatro', grupo: 'lazer', cor: '#DB2777', icone: 'Film', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 22, nome: 'Streaming', grupo: 'lazer', cor: '#EF4444', icone: 'Play', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 23, nome: 'Viagens', grupo: 'lazer', cor: '#06B6D4', icone: 'Plane', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      
      // Cuidados Pessoais
      { id: 24, nome: 'Produtos de Higiene', grupo: 'cuidados', cor: '#10B981', icone: 'Sparkles', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 25, nome: 'Salão de Beleza', grupo: 'cuidados', cor: '#F59E0B', icone: 'Scissors', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      { id: 26, nome: 'Roupas', grupo: 'cuidados', cor: '#8B5CF6', icone: 'Shirt', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true },
      
      // Outros
      { id: 27, nome: 'Diversos', grupo: 'outros', cor: '#6B7280', icone: 'Package', user_id: user?.id || '', created_at: agora, updated_at: agora, ativo: true }
    ];
  };

  const criarCategoria = (categoria: Omit<CategoriaDespesa, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      const categoriasExistentes: CategoriaDespesa[] = dados ? JSON.parse(dados) : [];
      
      const novaCategoria: CategoriaDespesa = {
        ...categoria,
        id: Math.max(0, ...categoriasExistentes.map(c => c.id)) + 1,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const novasCategorias = [...categoriasExistentes, novaCategoria];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novasCategorias));
      
      carregarCategorias(); // Recarregar para atualizar a lista
      
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso"
      });

      return novaCategoria;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a categoria",
        variant: "destructive"
      });
      return null;
    }
  };

  const atualizarCategoria = (id: number, dados: Partial<CategoriaDespesa>) => {
    if (!user) return null;

    try {
      const dadosStorage = localStorage.getItem(STORAGE_KEY);
      const categoriasExistentes: CategoriaDespesa[] = dadosStorage ? JSON.parse(dadosStorage) : [];
      
      const indice = categoriasExistentes.findIndex(c => c.id === id);
      if (indice === -1) {
        throw new Error('Categoria não encontrada');
      }

      const categoriaAtualizada = {
        ...categoriasExistentes[indice],
        ...dados,
        updated_at: new Date().toISOString()
      };

      categoriasExistentes[indice] = categoriaAtualizada;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categoriasExistentes));
      
      carregarCategorias(); // Recarregar para atualizar a lista

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso"
      });

      return categoriaAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria",
        variant: "destructive"
      });
      return null;
    }
  };

  const excluirCategoria = (id: number) => {
    if (!user) return false;

    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      const categoriasExistentes: CategoriaDespesa[] = dados ? JSON.parse(dados) : [];
      
      const novasCategorias = categoriasExistentes.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novasCategorias));
      
      carregarCategorias(); // Recarregar para atualizar a lista
      
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso"
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a categoria",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      carregarCategorias();
    }
  }, [user]);

  return {
    categorias,
    loading,
    carregarCategorias,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria
  };
};