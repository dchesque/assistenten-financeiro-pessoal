import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoriaDespesa, GRUPOS_CATEGORIA } from '@/types/categoriaDespesa';
import * as LucideIcons from 'lucide-react';

interface CategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoria: CategoriaDespesa | null;
  modo: 'criar' | 'editar' | 'visualizar';
  onSave: (categoria: Omit<CategoriaDespesa, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  loading?: boolean;
}

const CORES_PADRAO = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'
];

const ICONES_PADRAO = [
  'Home', 'Car', 'ShoppingCart', 'Heart', 'BookOpen',
  'Gamepad2', 'Scissors', 'Coffee', 'Shirt', 'Package'
];

export function CategoriaModal({ isOpen, onClose, categoria, modo, onSave, loading }: CategoriaModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    grupo: 'outros' as keyof typeof GRUPOS_CATEGORIA,
    cor: CORES_PADRAO[0],
    icone: 'Package',
    ativo: true
  });

  useEffect(() => {
    if (categoria) {
      setFormData({
        nome: categoria.nome,
        grupo: categoria.grupo,
        cor: categoria.cor,
        icone: categoria.icone,
        ativo: categoria.ativo
      });
    } else {
      setFormData({
        nome: '',
        grupo: 'outros',
        cor: CORES_PADRAO[0],
        icone: 'Package',
        ativo: true
      });
    }
  }, [categoria]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'visualizar') return;
    
    onSave(formData);
  };

  const IconComponent = (LucideIcons as any)[formData.icone] || LucideIcons.Package;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {modo === 'criar' && 'Nova Categoria'}
            {modo === 'editar' && 'Editar Categoria'}
            {modo === 'visualizar' && 'Visualizar Categoria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview da categoria */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.cor }}
            >
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium">{formData.nome || 'Nome da categoria'}</p>
              <p className="text-sm text-muted-foreground">
                {GRUPOS_CATEGORIA[formData.grupo]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Mercado, Combustível..."
                disabled={modo === 'visualizar'}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo">Grupo</Label>
              <select
                id="grupo"
                value={formData.grupo}
                onChange={(e) => setFormData(prev => ({ ...prev, grupo: e.target.value as any }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={modo === 'visualizar'}
                required
              >
                {Object.entries(GRUPOS_CATEGORIA).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Seleção de cor */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-5 gap-2">
              {CORES_PADRAO.map(cor => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, cor }))}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    formData.cor === cor 
                      ? 'ring-2 ring-gray-400 ring-offset-2' 
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: cor }}
                  disabled={modo === 'visualizar'}
                />
              ))}
            </div>
          </div>

          {/* Seleção de ícone */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-5 gap-2">
              {ICONES_PADRAO.map(icone => {
                const Icon = (LucideIcons as any)[icone];
                return (
                  <button
                    key={icone}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icone }))}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      formData.icone === icone 
                        ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 ring-offset-2' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={modo === 'visualizar'}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ações */}
          {modo !== 'visualizar' && (
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : (modo === 'criar' ? 'Criar' : 'Salvar')}
              </Button>
            </div>
          )}

          {modo === 'visualizar' && (
            <div className="flex justify-end pt-4">
              <Button type="button" onClick={onClose}>
                Fechar
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}