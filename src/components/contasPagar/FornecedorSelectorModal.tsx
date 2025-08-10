import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useValidacoesFornecedor } from '@/hooks/useValidacoesFornecedor';
import { useMascaras } from '@/hooks/useMascaras';
import { Fornecedor } from '@/types/fornecedor';
import { Building2, User, Plus, Search, Check } from 'lucide-react';

interface FornecedorSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fornecedor: Fornecedor) => void;
  onCreateNew: () => void;
}

export const FornecedorSelectorModal: React.FC<FornecedorSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onCreateNew
}) => {
  const { fornecedores, loading } = useFornecedores();
  const [busca, setBusca] = useState('');

  const fornecedoresFiltrados = fornecedores.filter(fornecedor =>
    fornecedor.ativo && (
      fornecedor.nome.toLowerCase().includes(busca.toLowerCase()) ||
      fornecedor.nome_fantasia?.toLowerCase().includes(busca.toLowerCase()) ||
      fornecedor.documento.includes(busca) ||
      fornecedor.email?.toLowerCase().includes(busca.toLowerCase())
    )
  );

  const handleSelect = (fornecedor: Fornecedor) => {
    onSelect(fornecedor);
    onClose();
  };

  const handleCreateNew = () => {
    onCreateNew();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Selecionar Fornecedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-white/20"
            />
          </div>

          {/* Botão Criar Novo */}
          <Button
            onClick={handleCreateNew}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Fornecedor
          </Button>

          <Separator />

          {/* Lista de Fornecedores */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-muted-foreground">Carregando fornecedores...</p>
              </div>
            ) : fornecedoresFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {busca ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
                </p>
              </div>
            ) : (
              fornecedoresFiltrados.map((fornecedor) => (
                <div
                  key={fornecedor.id}
                  className="card-base p-4 cursor-pointer hover:bg-white/90 transition-all duration-200"
                  onClick={() => handleSelect(fornecedor)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {fornecedor.tipo === 'pessoa_fisica' ? (
                          <User className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Building2 className="w-4 h-4 text-purple-600" />
                        )}
                        <h3 className="font-medium text-gray-900">{fornecedor.nome}</h3>
                        {fornecedor.nome_fantasia && (
                          <span className="text-sm text-muted-foreground">
                            ({fornecedor.nome_fantasia})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{fornecedor.documento}</span>
                        {fornecedor.email && <span>{fornecedor.email}</span>}
                        {fornecedor.telefone && <span>{fornecedor.telefone}</span>}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={fornecedor.tipo_fornecedor === 'receita' ? 'default' : 'secondary'}>
                          {fornecedor.tipo_fornecedor === 'receita' ? 'Receita' : 'Despesa'}
                        </Badge>
                        
                        <Badge variant="outline">
                          {fornecedor.tipo === 'pessoa_fisica' ? 'PF' : 'PJ'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};