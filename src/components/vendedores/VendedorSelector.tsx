import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Search, Trophy, TrendingUp, DollarSign, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVendedores } from '@/hooks/useVendedores';
import { Vendedor } from '@/types/vendedor';

interface VendedorSelectorProps {
  vendedorSelecionado?: Vendedor | null;
  onVendedorChange: (vendedor: Vendedor | null) => void;
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
}

export function VendedorSelector({
  vendedorSelecionado,
  onVendedorChange,
  allowEmpty = true,
  placeholder = "Selecione um vendedor",
  className
}: VendedorSelectorProps) {
  const { vendedores, loading } = useVendedores();
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');

  // Filtrar vendedores ativos baseado na busca
  const vendedoresFiltrados = useMemo(() => {
    return vendedores.filter(vendedor => {
      if (!vendedor.ativo) return false;
      
      if (!busca) return true;
      
      const termoBusca = busca.toLowerCase();
      return (
        vendedor.nome.toLowerCase().includes(termoBusca) ||
        vendedor.codigo_vendedor.toLowerCase().includes(termoBusca) ||
        vendedor.email?.toLowerCase().includes(termoBusca) ||
        vendedor.telefone?.includes(busca)
      );
    });
  }, [vendedores, busca]);

  const handleSelect = (vendedor: Vendedor | null) => {
    onVendedorChange(vendedor);
    setOpen(false);
    setBusca('');
  };

  const getRankingIcon = (ranking: number) => {
    switch (ranking) {
      case 1:
        return <Trophy className="w-3 h-3 text-yellow-600" />;
      case 2:
        return <Trophy className="w-3 h-3 text-gray-500" />;
      case 3:
        return <Trophy className="w-3 h-3 text-orange-600" />;
      default:
        return <span className="text-xs font-medium text-gray-500">#{ranking}</span>;
    }
  };

  const getRankingClass = (ranking: number) => {
    switch (ranking) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-500/20 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-orange-400/20 to-orange-600/20 border-orange-300';
      default:
        return 'bg-white/80 border-gray-200';
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(valor);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11",
            className
          )}
        >
          {vendedorSelecionado ? (
            <div className="flex items-center space-x-2 flex-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src={vendedorSelecionado.foto_url || ''} />
                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                  {vendedorSelecionado.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-medium text-gray-900 truncate">
                  {vendedorSelecionado.nome}
                </span>
                <span className="text-xs text-gray-500">
                  {vendedorSelecionado.codigo_vendedor}
                </span>
              </div>
              {vendedorSelecionado.ranking_atual > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {getRankingIcon(vendedorSelecionado.ranking_atual)}
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500">
              <User className="w-4 h-4" />
              <span>{placeholder}</span>
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[400px] p-0 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
        {/* Header com busca */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, código ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 rounded-xl"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            Carregando vendedores...
          </div>
        )}

        {/* Lista de vendedores */}
        {!loading && (
          <div className="max-h-64 overflow-y-auto">
            {/* Opção "Nenhum vendedor" */}
            {allowEmpty && (
              <div
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                onClick={() => handleSelect(null)}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <X className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-gray-600 font-medium">Nenhum vendedor</span>
                {!vendedorSelecionado && (
                  <Check className="ml-auto w-4 h-4 text-blue-600" />
                )}
              </div>
            )}

            {/* Vendedores filtrados */}
            {vendedoresFiltrados.length > 0 ? (
              vendedoresFiltrados.map(vendedor => (
                <div
                  key={vendedor.id}
                  className={cn(
                    "flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0",
                    vendedorSelecionado?.id === vendedor.id && "bg-blue-50"
                  )}
                  onClick={() => handleSelect(vendedor)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Avatar */}
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={vendedor.foto_url || ''} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {vendedor.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Informações principais */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate">
                          {vendedor.nome}
                        </span>
                        {vendedor.ranking_atual > 0 && vendedor.ranking_atual <= 3 && (
                          <div className="flex items-center space-x-1">
                            {getRankingIcon(vendedor.ranking_atual)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Código: {vendedor.codigo_vendedor}</span>
                        {vendedor.email && (
                          <>
                            <span>•</span>
                            <span className="truncate">{vendedor.email}</span>
                          </>
                        )}
                      </div>

                      {/* Preview de estatísticas */}
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <div className="flex items-center space-x-1 text-green-600">
                          <TrendingUp className="w-3 h-3" />
                          <span>{vendedor.total_vendas} vendas</span>
                        </div>
                        <div className="flex items-center space-x-1 text-blue-600">
                          <DollarSign className="w-3 h-3" />
                          <span>{formatarValor(vendedor.valor_total_vendido)}</span>
                        </div>
                        {vendedor.ranking_atual > 0 && (
                          <Badge variant="outline" className="h-5 text-xs">
                            #{vendedor.ranking_atual}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Check mark se selecionado */}
                    {vendedorSelecionado?.id === vendedor.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium mb-1">Nenhum vendedor encontrado</p>
                <p className="text-sm">
                  {busca ? 'Tente ajustar os termos de busca' : 'Nenhum vendedor ativo cadastrado'}
                </p>
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}