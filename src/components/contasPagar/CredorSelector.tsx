import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useContacts } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Contact = Database['public']['Tables']['contacts']['Row'];

interface CredorSelectorProps {
  value?: Contact | null;
  onSelect: (contact: Contact | null) => void;
  placeholder?: string;
  className?: string;
}

export function CredorSelector({ 
  value, 
  onSelect, 
  placeholder = "Selecionar credor...",
  className = ""
}: CredorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  const { contacts: allContacts, loading } = useContacts();
  
  // Filtrar apenas credores (suppliers)
  const credores = allContacts.filter(contact => 
    contact.type === 'supplier' && 
    contact.active !== false
  );

  // Filtrar credores baseado na busca
  const credoresFiltrados = credores.filter(credor =>
    credor.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (credor.document && credor.document.includes(searchValue)) ||
    (credor.email && credor.email.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const handleSelect = (credor: Contact) => {
    onSelect(credor);
    setOpen(false);
    setSearchValue("");
  };

  const handleClear = () => {
    onSelect(null);
    setOpen(false);
    setSearchValue("");
  };

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
              <Building2 className="h-4 w-4 text-gray-400" />
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
            placeholder="Buscar credor..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">Nenhum credor encontrado</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Cadastrar novo credor
              </Button>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {value && (
              <CommandItem onSelect={handleClear} className="text-red-600">
                <span>Limpar seleção</span>
              </CommandItem>
            )}
            {credoresFiltrados.map((credor) => (
              <CommandItem
                key={credor.id}
                onSelect={() => handleSelect(credor)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium">{credor.name}</div>
                    {credor.document && (
                      <div className="text-xs text-gray-500">
                        {credor.document}
                      </div>
                    )}
                  </div>
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value?.id === credor.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}