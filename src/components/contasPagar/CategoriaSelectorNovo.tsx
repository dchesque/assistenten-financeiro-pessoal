import { useState, useEffect } from 'react';
import { Search, FolderTree, Plus } from 'lucide-react';
import { Category } from '@/types/category';
import { useCategories } from '@/hooks/useCategories';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';

interface CategoriaSelectorNovoProps {
  value?: Category | null;
  onSelect: (categoria: Category) => void;
  placeholder?: string;
  className?: string;
  tipo?: 'income' | 'expense' | 'all';
}

export function CategoriaSelectorNovo({ 
  value, 
  onSelect, 
  placeholder = "Selecionar categoria...",
  className = "",
  tipo = 'expense'
}: CategoriaSelectorNovoProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  
  const { categories, loading, loadCategories } = useCategories();
  const buscaDebounced = useDebounce(busca, 300);

  // Carregar categorias quando abrir o modal
  useEffect(() => {
    if (open) {
      const filters = tipo !== 'all' ? { type: tipo } : undefined;
      loadCategories(filters);
    }
  }, [open, tipo, buscaDebounced, loadCategories]);

  const handleSelect = (categoria: Category) => {
    onSelect(categoria);
    setOpen(false);
    setBusca('');
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return <FolderTree className="h-4 w-4" />;
    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<any>;
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <FolderTree className="h-4 w-4" />;
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'income' 
      ? 'bg-green-100/80 text-green-700' 
      : 'bg-red-100/80 text-red-700';
  };

  // Filtrar categorias pela busca
  const categoriasFiltradas = categories.filter(categoria => {
    if (!buscaDebounced) return true;
    return categoria.name.toLowerCase().includes(buscaDebounced.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`h-10 justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-gray-300/50 ${className}`}
          role="combobox"
          aria-expanded={open}
        >
          {value ? (
            <div className="flex items-center space-x-2">
              <div style={{ color: value.color }}>
                {getIcon(value.icon)}
              </div>
              <span className="truncate">{value.name}</span>
              <Badge variant="outline" className={getTipoColor(value.type)}>
                {value.type === 'income' ? 'Receita' : 'Despesa'}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <Search className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderTree className="h-5 w-5" />
            <span>Selecionar Categoria</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-gray-300/50"
              autoFocus
            />
          </div>

          {/* Lista de categorias */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                Carregando categorias...
              </div>
            ) : categoriasFiltradas.length > 0 ? (
              categoriasFiltradas.map((categoria) => (
                <div
                  key={categoria.id}
                  className="p-3 rounded-lg border border-gray-200/50 hover:bg-gray-50/80 cursor-pointer transition-all duration-200"
                  onClick={() => handleSelect(categoria)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div style={{ color: categoria.color }}>
                        {getIcon(categoria.icon)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {categoria.name}
                          </span>
                          <Badge variant="outline" className={getTipoColor(categoria.type)}>
                            {categoria.type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                          {categoria.is_system && (
                            <Badge variant="outline" className="bg-blue-100/80 text-blue-700">
                              Sistema
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma categoria encontrada</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            )}
          </div>

          {/* Informações adicionais */}
          <div className="border-t pt-4 text-sm text-gray-600">
            <p className="mb-2">ℹ️ Categorias ajudam a organizar e controlar seus gastos</p>
            <Button 
              className="w-full btn-primary"
              onClick={() => {
                // TODO: Implementar modal de criação de categoria
                console.log('Abrir modal de criação de categoria');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Nova Categoria
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}