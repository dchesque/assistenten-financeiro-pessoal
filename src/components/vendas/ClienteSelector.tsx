
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, User, Building, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientesSupabase } from '@/hooks/useClientesSupabase';
import { Cliente } from '@/types/cliente';

interface ClienteSelectorProps {
  clienteSelecionado: Cliente | null;
  onClienteChange: (cliente: Cliente | null) => void;
  className?: string;
  placeholder?: string;
  allowConsumidor?: boolean;
}

export function ClienteSelector({ 
  clienteSelecionado, 
  onClienteChange, 
  className,
  placeholder = "Clique para selecionar cliente",
  allowConsumidor = true
}: ClienteSelectorProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const { buscarClientesParaVenda, clienteConsumidor, loading } = useClientesSupabase();
  const [resultados, setResultados] = useState<Cliente[]>([]);

  useEffect(() => {
    // Usar a busca otimizada para vendas
    const resultadosBusca = buscarClientesParaVenda(busca);
    setResultados(resultadosBusca);
  }, [busca, buscarClientesParaVenda]);

  const handleSelect = (cliente: Cliente | null) => {
    onClienteChange(cliente);
    setOpen(false);
    setBusca('');
  };

  const formatarDocumento = (documento: string) => {
    if (documento.length === 11) {
      // CPF: 123.456.789-01
      return documento.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (documento.length === 14) {
      // CNPJ: 12.345.678/0001-90
      return documento.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return documento;
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
              {clienteSelecionado ? (
                <div className="flex items-center min-w-0 flex-1">
                  {clienteSelecionado.tipo === 'PF' ? (
                    <User className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Building className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
                  )}
                  <span className="truncate font-medium">{clienteSelecionado.nome}</span>
                  <Badge variant="outline" className="ml-2 text-xs flex-shrink-0">
                    {formatarDocumento(clienteSelecionado.documento)}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center text-gray-500">
                  <Search className="w-4 h-4 mr-2" />
                  <span>{placeholder}</span>
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
                placeholder="Buscar por nome, documento, email ou telefone..."
                value={busca}
                onValueChange={setBusca}
                className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                    setBusca('');
                  }
                }}
              />
            </div>
            <CommandList className="max-h-80">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  <span className="mt-2 block">Carregando clientes...</span>
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="text-center py-6">
                      <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">Nenhum cliente encontrado</p>
                      {busca && (
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-xs text-gray-400">
                            Não encontrou o cliente "{busca}"?
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            onClick={() => {
                              // Aqui poderia abrir um modal para cadastro rápido
                              console.log('Abrir modal de cadastro rápido');
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Cadastrar Cliente
                          </Button>
                        </div>
                      )}
                    </div>
                  </CommandEmpty>
                  
                  <CommandGroup>
                    {/* Lista de clientes (incluindo CONSUMIDOR) */}
                    {resultados.map((cliente) => (
                      <CommandItem
                        key={cliente.id}
                        value={cliente.id === 1 ? "consumidor" : `${cliente.nome}-${cliente.documento}`}
                        onSelect={() => handleSelect(cliente.id === 1 ? null : cliente)}
                        className="cursor-pointer py-3"
                      >
                        <div className="flex items-center w-full">
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4",
                              (cliente.id === 1 && !clienteSelecionado) || 
                              (cliente.id !== 1 && clienteSelecionado?.id === cliente.id) 
                                ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex items-center w-full">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0",
                              cliente.id === 1 
                                ? "bg-gray-100 text-gray-600"
                                : cliente.tipo === 'PF' 
                                  ? "bg-blue-100 text-blue-600" 
                                  : "bg-purple-100 text-purple-600"
                            )}>
                              {cliente.tipo === 'PF' ? (
                                <User className="w-4 h-4" />
                              ) : (
                                <Building className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium truncate">{cliente.nome}</p>
                                {cliente.id === 1 ? (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs flex-shrink-0 bg-gray-50 text-gray-700 border-gray-200"
                                  >
                                    Consumo final
                                  </Badge>
                                ) : (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs flex-shrink-0",
                                      cliente.status === 'ativo' 
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : cliente.status === 'inativo'
                                        ? "bg-gray-50 text-gray-700 border-gray-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                    )}
                                  >
                                    {cliente.status}
                                  </Badge>
                                )}
                              </div>
                              
                              {cliente.id === 1 ? (
                                <div className="text-xs text-gray-500">
                                  Venda sem cliente específico
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center text-xs text-gray-500 gap-1">
                                    <span className="font-mono">{formatarDocumento(cliente.documento)}</span>
                                    {cliente.telefone && (
                                      <>
                                        <span>•</span>
                                        <span>{cliente.telefone}</span>
                                      </>
                                    )}
                                    {cliente.email && (
                                      <>
                                        <span>•</span>
                                        <span className="truncate max-w-32">{cliente.email}</span>
                                      </>
                                    )}
                                  </div>
                                  {(cliente.totalCompras > 0 || cliente.valorTotalCompras > 0) && (
                                    <div className="flex items-center text-xs text-gray-400 gap-1 mt-1">
                                      <span>{cliente.totalCompras} compras</span>
                                      <span>•</span>
                                      <span>R$ {cliente.valorTotalCompras.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
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
