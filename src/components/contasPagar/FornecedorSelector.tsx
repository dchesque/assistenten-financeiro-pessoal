import { useState, useEffect } from 'react';
import { Search, Building2, User, Plus } from 'lucide-react';
import { Fornecedor } from '@/types/fornecedor';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CadastroRapidoFornecedorModal } from './CadastroRapidoFornecedorModal';

interface FornecedorSelectorProps {
  value?: Fornecedor | null;
  onSelect: (fornecedor: Fornecedor) => void;
  placeholder?: string;
  className?: string;
}

export function FornecedorSelector({ 
  value, 
  onSelect, 
  placeholder = "Selecionar fornecedor...",
  className = ""
}: FornecedorSelectorProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [cadastroRapidoOpen, setCadastroRapidoOpen] = useState(false);
  
  const { fornecedores, loading } = useFornecedores();
  const buscaDebounced = useDebounce(busca, 300);
  
  // Log para debug
  useEffect(() => {
    console.log('FornecedorSelector - Fornecedores carregados:', fornecedores.length);
  }, [fornecedores]);
  
  const fornecedoresFiltrados = fornecedores.filter(fornecedor =>
    fornecedor.ativo && (
      fornecedor.nome.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
      fornecedor.documento.includes(buscaDebounced) ||
      fornecedor.email?.toLowerCase().includes(buscaDebounced.toLowerCase())
    )
  ).slice(0, 15);

  const handleSelect = (fornecedor: Fornecedor) => {
    onSelect(fornecedor);
    setOpen(false);
    setBusca('');
  };

  const handleFornecedorCriado = (fornecedor: Fornecedor) => {
    onSelect(fornecedor);
    setOpen(false);
  };

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
              {value.tipo === 'pessoa_juridica' ? (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate">{value.nome}</span>
              <Badge variant="outline" className="text-xs">
                {value.documento}
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
            <Search className="h-5 w-5" />
            <span>Selecionar Fornecedor</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, documento ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-gray-300/50"
              autoFocus
            />
          </div>

          {/* Lista de fornecedores */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                Carregando fornecedores...
              </div>
            ) : fornecedoresFiltrados.length > 0 ? (
              fornecedoresFiltrados.map((fornecedor) => (
                <div
                  key={fornecedor.id}
                  className="p-3 rounded-lg border border-gray-200/50 hover:bg-gray-50/80 cursor-pointer transition-all duration-200"
                  onClick={() => handleSelect(fornecedor)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {fornecedor.tipo === 'pessoa_juridica' ? (
                        <Building2 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <User className="h-5 w-5 text-green-600" />
                      )}
                      
                      <div>
                        <div className="font-medium text-gray-900">{fornecedor.nome}</div>
                        <div className="text-sm text-gray-500">
                          {fornecedor.documento} • {fornecedor.email || 'Sem email'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {fornecedor.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {fornecedor.totalCompras} compras
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : !loading && (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum fornecedor encontrado</p>
                <p className="text-sm">
                  {busca ? 'Tente ajustar sua busca' : 'Cadastre um novo fornecedor para começar'}
                </p>
              </div>
            )}
          </div>

          {/* Botão novo fornecedor */}
          <div className="border-t pt-4">
            <Button 
              className="w-full btn-primary"
              onClick={() => setCadastroRapidoOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Novo Fornecedor
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal de Cadastro Rápido */}
      <CadastroRapidoFornecedorModal
        open={cadastroRapidoOpen}
        onOpenChange={setCadastroRapidoOpen}
        onFornecedorCriado={handleFornecedorCriado}
      />
    </Dialog>
  );
}