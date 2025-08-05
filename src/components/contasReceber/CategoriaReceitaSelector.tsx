import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCategoriasReceitas } from '@/hooks/useCategoriasReceitas';

interface CategoriaReceitaSelectorProps {
  value: number;
  onChange: (value: number) => void;
  onOpenModal?: () => void;
  placeholder?: string;
  className?: string;
}

export function CategoriaReceitaSelector({ 
  value, 
  onChange, 
  onOpenModal,
  placeholder = "Selecionar categoria...",
  className 
}: CategoriaReceitaSelectorProps) {
  const [open, setOpen] = useState(false);
  const { categorias, loading, carregarCategorias } = useCategoriasReceitas();

  useEffect(() => {
    carregarCategorias();
  }, []);

  const categoriaSelecionada = categorias.find(c => c.id === value);

  const handleSelect = (categoriaId: number) => {
    onChange(categoriaId);
    setOpen(false);
  };

  // Agrupar categorias por grupo
  const categoriasPorGrupo = categorias.reduce((acc, categoria) => {
    if (!acc[categoria.grupo]) {
      acc[categoria.grupo] = [];
    }
    acc[categoria.grupo].push(categoria);
    return acc;
  }, {} as Record<string, typeof categorias>);

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white/80 border-gray-300/50 hover:bg-white/90"
          >
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-left">
                {categoriaSelecionada ? (
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: categoriaSelecionada.cor }}
                    />
                    <span className="font-medium">{categoriaSelecionada.nome}</span>
                    <Badge variant="secondary" className="text-xs">
                      {categoriaSelecionada.grupo}
                    </Badge>
                  </div>
                ) : (
                  placeholder
                )}
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar categoria..." />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center py-6 text-center">
                  <Tag className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-4">Nenhuma categoria encontrada</p>
                  {onOpenModal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        onOpenModal();
                      }}
                      className="bg-white/80"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Categoria
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              
              {Object.entries(categoriasPorGrupo).map(([grupo, categoriasDoGrupo]) => (
                <CommandGroup key={grupo} heading={grupo}>
                  {categoriasDoGrupo.map((categoria) => (
                    <CommandItem
                      key={categoria.id}
                      value={`${categoria.nome}-${categoria.id}`}
                      onSelect={() => handleSelect(categoria.id)}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                          style={{ backgroundColor: categoria.cor }}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{categoria.nome}</span>
                          <span className="text-xs text-gray-500">{categoria.grupo}</span>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === categoria.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              
              {onOpenModal && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      onOpenModal();
                    }}
                    className="w-full justify-start hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar nova categoria
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {loading && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span>Carregando categorias...</span>
        </div>
      )}
    </div>
  );
}