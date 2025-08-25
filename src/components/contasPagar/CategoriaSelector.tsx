import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/category';
import * as LucideIcons from 'lucide-react';

interface CategoriaSelectorProps {
  value?: Category | null;
  onSelect: (category: Category | null) => void;
  placeholder?: string;
  className?: string;
}

export function CategoriaSelector({ 
  value, 
  onSelect, 
  placeholder = "Selecionar categoria...",
  className = ""
}: CategoriaSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  const { categories, loading } = useCategories();

  // Filtrar apenas categorias de despesa
  const categoriasExpense = categories.filter(cat => 
    cat.type === 'expense' && 
    cat.active !== false
  );

  // Filtrar categorias baseado na busca
  const categoriasFiltradas = categoriasExpense.filter(categoria =>
    categoria.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (categoria.description && categoria.description.toLowerCase().includes(searchValue.toLowerCase()))
  );

  // Agrupar categorias por group_name se existir, senão ordenar alfabeticamente
  const categoriasAgrupadas = categoriasFiltradas.reduce((grupos, categoria) => {
    const grupo = categoria.group_name || 'Outras';
    if (!grupos[grupo]) {
      grupos[grupo] = [];
    }
    grupos[grupo].push(categoria);
    return grupos;
  }, {} as Record<string, Category[]>);

  // Ordenar cada grupo alfabeticamente
  Object.keys(categoriasAgrupadas).forEach(grupo => {
    categoriasAgrupadas[grupo].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Ordenar grupos
  const gruposOrdenados = Object.keys(categoriasAgrupadas).sort();

  const getIcon = (iconName?: string) => {
    if (!iconName) return <FolderTree className="h-4 w-4" />;
    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<any>;
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <FolderTree className="h-4 w-4" />;
  };

  const handleSelect = (categoria: Category) => {
    onSelect(categoria);
    setOpen(false);
    setSearchValue("");
  };

  const handleClear = () => {
    onSelect(null);
    setOpen(false);
    setSearchValue("");
  };

  useEffect(() => {
    // Carregar categorias quando o componente monta
    if (categories.length === 0 && !loading) {
      // loadCategories se necessário
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? (
            <div className="flex items-center space-x-2">
              <div style={{ color: value.color || '#6B7280' }}>
                {getIcon(value.icon)}
              </div>
              <span className="truncate">{value.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Buscar categoria..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">Nenhuma categoria encontrada</p>
            </div>
          </CommandEmpty>
          <div className="max-h-64 overflow-y-auto">
            {value && (
              <CommandGroup>
                <CommandItem onSelect={handleClear} className="text-red-600">
                  <span>Limpar seleção</span>
                </CommandItem>
              </CommandGroup>
            )}
            {gruposOrdenados.map((nomeGrupo) => (
              <CommandGroup key={nomeGrupo} heading={nomeGrupo !== 'Outras' ? nomeGrupo : undefined}>
                {categoriasAgrupadas[nomeGrupo].map((categoria) => (
                  <CommandItem
                    key={categoria.id}
                    onSelect={() => handleSelect(categoria)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div style={{ color: categoria.color || '#6B7280' }}>
                        {getIcon(categoria.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{categoria.name}</div>
                        {categoria.description && (
                          <div className="text-xs text-gray-500">
                            {categoria.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value?.id === categoria.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}