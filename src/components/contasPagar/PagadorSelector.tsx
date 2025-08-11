import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePagadores } from '@/hooks/usePagadores';
import { Pagador } from '@/types/pagador';
import { User, Building2, Search, Plus } from 'lucide-react';
import { PagadorSelectorModal } from './PagadorSelectorModal';
import { CadastroRapidoPagadorModal } from './CadastroRapidoPagadorModal';

interface PagadorSelectorProps {
  value?: Pagador | null;
  onSelect: (pagador: Pagador) => void;
  className?: string;
}

export const PagadorSelector: React.FC<PagadorSelectorProps> = ({
  value,
  onSelect,
  className = ''
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);

  const handleSelect = (pagador: Pagador) => {
    onSelect(pagador);
    setModalAberto(false);
  };

  const handleCreateNew = () => {
    setModalAberto(false);
    setModalCadastroAberto(true);
  };

  const handlePagadorCriado = (novoPagador: Pagador) => {
    onSelect(novoPagador);
    setModalCadastroAberto(false);
  };

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700">
          Pagador *
        </label>
        
        {value ? (
          <div className="card-base p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {value.tipo === 'pessoa_fisica' ? (
                  <User className="w-5 h-5 text-blue-600" />
                ) : (
                  <Building2 className="w-5 h-5 text-purple-600" />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{value.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">{value.documento}</span>
                    <Badge variant="outline" className="text-xs">
                      {value.tipo === 'pessoa_fisica' ? 'PF' : 'PJ'}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalAberto(true)}
                className="bg-white/80 hover:bg-white/90"
              >
                Alterar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setModalAberto(true)}
            className="w-full h-12 bg-white/80 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200"
          >
            <Search className="w-4 h-4 mr-2" />
            Selecionar Pagador
          </Button>
        )}
      </div>

      <PagadorSelectorModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSelect={handleSelect}
        onCreateNew={handleCreateNew}
      />

      <CadastroRapidoPagadorModal
        isOpen={modalCadastroAberto}
        onClose={() => setModalCadastroAberto(false)}
        onPagadorCriado={handlePagadorCriado}
      />
    </>
  );
};