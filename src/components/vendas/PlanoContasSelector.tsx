
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { PlanoContas } from '@/types/planoContas';
import * as LucideIcons from 'lucide-react';

interface PlanoContasSelectorProps {
  categoriaSelecionada: PlanoContas | null;
  onCategoriaChange: (categoria: PlanoContas | null) => void;
  tipoVenda?: 'venda' | 'devolucao';
  className?: string;
}

export function PlanoContasSelector({ categoriaSelecionada, onCategoriaChange, tipoVenda = 'venda', className }: PlanoContasSelectorProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const { planoContas, loading, buscarContas } = usePlanoContas();
  const [resultados, setResultados] = useState<PlanoContas[]>([]);

  useEffect(() => {
    let contasFiltradas = planoContas;

    // Auto-filtro por tipo de venda
    if (tipoVenda === 'venda') {
      contasFiltradas = contasFiltradas.filter(conta => conta.codigo.startsWith('1.'));
    } else if (tipoVenda === 'devolucao') {
      contasFiltradas = contasFiltradas.filter(conta => conta.codigo.startsWith('2.'));
    }

    // Filtro de busca
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase();
      contasFiltradas = contasFiltradas.filter(conta => 
        conta.nome.toLowerCase().includes(buscaLower) ||
        conta.codigo.toLowerCase().includes(buscaLower) ||
        (conta.descricao && conta.descricao.toLowerCase().includes(buscaLower))
      );
    }

    // Apenas contas que aceitam lançamento direto
    contasFiltradas = contasFiltradas.filter(conta => conta.aceita_lancamento);

    setResultados(contasFiltradas);
  }, [busca, planoContas, tipoVenda]);

  const handleSelect = (categoria: PlanoContas) => {
    onCategoriaChange(categoria);
    setOpen(false);
    setBusca('');
  };

  const getIconeCategoria = (nomeIcone: string) => {
    const IconeComponent = (LucideIcons as any)[nomeIcone];
    return IconeComponent || LucideIcons.Package;
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-white/90"
          >
            <div className="flex items-center min-w-0 flex-1">
              {categoriaSelecionada ? (
                <div className="flex items-center min-w-0">
                  <div 
                    className="w-4 h-4 rounded mr-2 flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: categoriaSelecionada.cor }}
                  >
                    {(() => {
                      const IconeComponent = getIconeCategoria(categoriaSelecionada.icone);
                      return <IconeComponent className="w-3 h-3 text-white" />;
                    })()}
                  </div>
                  <span className="truncate text-sm">
                    {categoriaSelecionada.codigo} - {categoriaSelecionada.nome}
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-gray-500">
                  <Search className="w-4 h-4 mr-2" />
                  <span>Clique para selecionar categoria</span>
                </div>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white backdrop-blur-xl border border-white/30 z-50" align="start">
          <Command className="w-full">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Buscar por código, nome ou descrição..."
                value={busca}
                onValueChange={setBusca}
                className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <CommandList className="max-h-60">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <span className="mt-2 block">Carregando categorias...</span>
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="text-center py-4">
                      <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhuma categoria encontrada</p>
                    </div>
                  </CommandEmpty>
                  
                  <CommandGroup>
                    {resultados.map((categoria) => {
                      const IconeComponent = getIconeCategoria(categoria.icone);
                      return (
                        <CommandItem
                          key={categoria.id}
                          value={`${categoria.codigo}-${categoria.nome}-${categoria.descricao || ''}`}
                          onSelect={() => handleSelect(categoria)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center w-full">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                categoriaSelecionada?.id === categoria.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                           <div className="flex items-center w-full">
                             <div 
                               className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                               style={{ backgroundColor: categoria.cor }}
                             >
                               <IconeComponent className="w-4 h-4 text-white" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                 <Badge variant="outline" className="text-xs font-mono">
                                   {categoria.codigo}
                                 </Badge>
                                 <span 
                                   className="font-medium truncate" 
                                   style={{ 
                                     marginLeft: `${(categoria.codigo.split('.').length - 1) * 12}px` 
                                   }}
                                 >
                                   {categoria.nome}
                                 </span>
                               </div>
                               {categoria.descricao && (
                                 <p className="text-xs text-gray-500 mt-1 truncate">
                                   {categoria.descricao}
                                 </p>
                               )}
                             </div>
                           </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
