import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usePagadores } from '@/hooks/usePagadores';

interface PagadorSelectorProps {
  value: number;
  onChange: (value: number) => void;
  onOpenModal?: () => void;
  onNewPagador?: () => void;
  placeholder?: string;
  className?: string;
}

export function PagadorSelector({ 
  value, 
  onChange, 
  onOpenModal, 
  onNewPagador,
  placeholder = "Selecionar pagador...",
  className 
}: PagadorSelectorProps) {
  const [open, setOpen] = useState(false);
  const { pagadores, loading, carregarPagadores } = usePagadores();

  useEffect(() => {
    carregarPagadores();
  }, []);

  const pagadorSelecionado = pagadores.find(p => p.id === value);

  const handleSelect = (pagadorId: number) => {
    onChange(pagadorId);
    setOpen(false);
  };

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
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-left">
                {pagadorSelecionado ? (
                  <div className="flex flex-col">
                    <span className="font-medium">{pagadorSelecionado.nome}</span>
                    <span className="text-xs text-gray-500">
                      {pagadorSelecionado.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </span>
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
            <CommandInput placeholder="Buscar pagador..." />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center py-6 text-center">
                  <User className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500 mb-4">Nenhum pagador encontrado</p>
                  {onNewPagador && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        onNewPagador();
                      }}
                      className="bg-white/80"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Pagador
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              
              <CommandGroup>
                {pagadores.map((pagador) => (
                  <CommandItem
                    key={pagador.id}
                    value={`${pagador.nome}-${pagador.id}`}
                    onSelect={() => handleSelect(pagador.id)}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{pagador.nome}</span>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{pagador.tipo === 'pessoa_fisica' ? 'PF' : 'PJ'}</span>
                          <span>•</span>
                          <span>{pagador.documento}</span>
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === pagador.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              
              {onNewPagador && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      onNewPagador();
                    }}
                    className="w-full justify-start hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar novo pagador
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
          <span>Carregando pagadores...</span>
        </div>
      )}
    </div>
  );
}