import { useState, useEffect } from 'react';
import { Search, FolderTree, Plus } from 'lucide-react';
import { PlanoContas } from '@/types/planoContas';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { CadastroRapidoCategoriaModal } from './CadastroRapidoCategoriaModal';

interface PlanoContasSelectorProps {
  value?: PlanoContas | null;
  onSelect: (conta: PlanoContas) => void;
  placeholder?: string;
  className?: string;
}

export function PlanoContasSelector({ 
  value, 
  onSelect, 
  placeholder = "Selecionar categoria...",
  className = ""
}: PlanoContasSelectorProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [contasAnaliticas, setContasAnaliticas] = useState<PlanoContas[]>([]);
  const [loading, setLoading] = useState(false);
  const [cadastroModalOpen, setCadastroModalOpen] = useState(false);
  
  const { buscarContasAnaliticas } = usePlanoContas();
  const buscaDebounced = useDebounce(busca, 300);

  // Carregar contas analíticas do Supabase
  const carregarContas = async () => {
    if (!open) return;
    
    setLoading(true);
    try {
      const contas = await buscarContasAnaliticas(buscaDebounced || undefined);
      setContasAnaliticas(contas);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      setContasAnaliticas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarContas();
  }, [open, buscaDebounced, buscarContasAnaliticas]);

  const handleSelect = (conta: PlanoContas) => {
    onSelect(conta);
    setOpen(false);
    setBusca('');
  };

  const handleCategoriaCriada = (novaCategoria: PlanoContas) => {
    onSelect(novaCategoria);
    setOpen(false);
    setBusca('');
    // Recarregar lista
    carregarContas();
  };

  const getIcon = (iconName: string) => {
    const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<any>;
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <FolderTree className="h-4 w-4" />;
  };

  const getTipoDreColor = (tipo: string) => {
    const colors = {
      'receita': 'bg-green-100/80 text-green-700',
      'custo': 'bg-blue-100/80 text-blue-700',
      'despesa_administrativa': 'bg-purple-100/80 text-purple-700',
      'despesa_comercial': 'bg-pink-100/80 text-pink-700',
      'despesa_financeira': 'bg-orange-100/80 text-orange-700'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100/80 text-gray-700';
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
              <div style={{ color: value.cor }}>
                {getIcon(value.icone)}
              </div>
              <span className="truncate font-mono text-sm">{value.codigo}</span>
              <span className="truncate">{value.nome}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <Search className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderTree className="h-5 w-5" />
            <span>Selecionar Categoria do Plano de Contas</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por código, nome ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-gray-300/50"
              autoFocus
            />
          </div>

          {/* Lista de contas */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                Carregando contas...
              </div>
            ) : contasAnaliticas.length > 0 ? (
              contasAnaliticas.map((conta) => (
                <div
                  key={conta.id}
                  className="p-3 rounded-lg border border-gray-200/50 hover:bg-gray-50/80 cursor-pointer transition-all duration-200"
                  onClick={() => handleSelect(conta)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div style={{ color: conta.cor }}>
                        {getIcon(conta.icone)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {conta.codigo}
                          </span>
                          <Badge variant="outline" className={getTipoDreColor(conta.tipo_dre)}>
                            Nível {conta.nivel}
                          </Badge>
                        </div>
                        <div className="font-medium text-gray-900">{conta.nome}</div>
                        {(conta as any).observacoes && (
                          <div className="text-sm text-gray-500">{(conta as any).observacoes}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {conta.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {conta.total_contas} lançamentos
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma categoria encontrada</p>
                <p className="text-sm">Apenas contas analíticas podem receber lançamentos</p>
              </div>
            )}
          </div>

          {/* Informações adicionais */}
          <div className="border-t pt-4 text-sm text-gray-600">
            <p className="mb-2">ℹ️ Apenas contas analíticas (nível 3) podem receber lançamentos diretos</p>
            <Button 
              className="w-full btn-primary"
              onClick={() => setCadastroModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Plano de Contas
            </Button>
          </div>
        </div>
      </DialogContent>

      <CadastroRapidoCategoriaModal
        open={cadastroModalOpen}
        onOpenChange={setCadastroModalOpen}
        onCategoriaCriada={handleCategoriaCriada}
        tipoDrePadrao="despesa_pessoal"
      />
    </Dialog>
  );
}