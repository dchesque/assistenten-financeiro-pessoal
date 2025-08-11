import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Save, FolderTree } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Category, CreateCategory, EXPENSE_GROUPS, GROUP_ICONS, CATEGORY_COLORS } from '@/types/category';
import { toast } from 'sonner';

interface CadastroRapidoCategoriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryClosed: (categoria: Category | null) => void;
}

export function CadastroRapidoCategoriaSimples({ 
  open, 
  onOpenChange, 
  onCategoryClosed 
}: CadastroRapidoCategoriaModalProps) {
  const { createCategory } = useCategories();
  const [loading, setLoading] = useState(false);
  
  // Estados do formulário
  const [formData, setFormData] = useState<CreateCategory>({
    name: '',
    type: 'expense', // Fixo como despesa
    color: CATEGORY_COLORS[0],
    icon: 'FolderTree'
  });
  
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>('');

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'expense',
      color: CATEGORY_COLORS[0],
      icon: 'FolderTree'
    });
    setGrupoSelecionado('');
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const novaCategoria = await createCategory(formData);
      if (novaCategoria) {
        toast.success('Categoria criada com sucesso!');
        onCategoryClosed(novaCategoria);
        handleClose();
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrupoChange = (grupo: string) => {
    setGrupoSelecionado(grupo);
    
    // Auto-preencher nome baseado no grupo
    if (grupo && EXPENSE_GROUPS[grupo as keyof typeof EXPENSE_GROUPS]) {
      setFormData(prev => ({
        ...prev,
        name: EXPENSE_GROUPS[grupo as keyof typeof EXPENSE_GROUPS]
      }));
      
      // Auto-selecionar primeiro ícone do grupo
      const icones = GROUP_ICONS[grupo];
      if (icones && icones.length > 0) {
        setFormData(prev => ({
          ...prev,
          icon: icones[0]
        }));
      }
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <FolderTree className="w-4 h-4" />;
  };

  const gruposDisponiveis = Object.keys(EXPENSE_GROUPS);
  const iconesDoGrupo = grupoSelecionado ? GROUP_ICONS[grupoSelecionado] || [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-purple-600" />
            Nova Categoria de Despesa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grupo da Categoria */}
          <div className="space-y-2">
            <Label htmlFor="grupo">Grupo da Categoria</Label>
            <Select value={grupoSelecionado} onValueChange={handleGrupoChange}>
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50">
                <SelectValue placeholder="Selecione um grupo..." />
              </SelectTrigger>
              <SelectContent>
                {gruposDisponiveis.map((grupo) => (
                  <SelectItem key={grupo} value={grupo}>
                    {EXPENSE_GROUPS[grupo as keyof typeof EXPENSE_GROUPS]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome da Categoria */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Energia Elétrica"
              className="bg-white/80 backdrop-blur-sm border border-gray-300/50"
              required
            />
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor da Categoria</Label>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_COLORS.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    formData.color === cor 
                      ? 'border-gray-400 scale-110 shadow-lg' 
                      : 'border-gray-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: cor }}
                  onClick={() => setFormData(prev => ({ ...prev, color: cor }))}
                />
              ))}
            </div>
          </div>

          {/* Ícone */}
          {iconesDoGrupo.length > 0 && (
            <div className="space-y-2">
              <Label>Ícone da Categoria</Label>
              <div className="grid grid-cols-6 gap-2">
                {iconesDoGrupo.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    className={`p-2 rounded-lg border transition-all duration-200 ${
                      formData.icon === iconName
                        ? 'border-purple-300 bg-purple-50 text-purple-600'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, icon: iconName }))}
                  >
                    {getIconComponent(iconName)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="p-3 rounded-lg bg-gray-50/80 border border-gray-200/50">
            <Label className="text-sm text-gray-600 mb-2 block">Preview da Categoria</Label>
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: formData.color }}
              >
                {getIconComponent(formData.icon)}
              </div>
              <span className="font-medium">{formData.name || 'Nome da categoria'}</span>
              <Badge variant="secondary" className="bg-red-100/80 text-red-700 px-2 py-1">
                Despesa
              </Badge>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              disabled={loading || !formData.name.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}