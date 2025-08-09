import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useCategories } from '@/hooks/useCategories';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { CategoriaCard } from '@/components/categorias/CategoriaCard';
import { Plus, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { Category, CreateCategory, CATEGORY_COLORS, getDefaultColorByType } from '@/types/category';
import { toast } from '@/hooks/use-toast';
import * as LucideIcons from 'lucide-react';

const breadcrumbs = [
  { label: 'Início', href: '/' },
  { label: 'Categorias', href: '/categorias' }
];

const AVAILABLE_ICONS = [
  'Circle', 'Plus', 'MoreHorizontal', 'Home', 'Car', 'Heart', 'Banknote', 
  'TrendingUp', 'Briefcase', 'UtensilsCrossed', 'GraduationCap', 'Gamepad2', 
  'Smartphone', 'Shield', 'DollarSign', 'Laptop', 'ShoppingCart', 'PiggyBank',
  'LineChart', 'Users', 'Award', 'Zap', 'Wrench', 'Fuel', 'Bus', 'ShoppingBasket',
  'Pill', 'Sparkles', 'FileText', 'Plane'
];

export default function Categorias() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState<CreateCategory>({
    name: '',
    type: 'expense',
    color: getDefaultColorByType('expense'),
    icon: 'MoreHorizontal'
  });

  const debouncedSearch = useDebounce(search, 300);
  const { categories, loading, createCategory, updateCategory, deleteCategory, getStats } = useCategories();

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !debouncedSearch || 
      category.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesType = typeFilter === 'all' || category.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = getStats();

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color || getDefaultColorByType(category.type),
        icon: category.icon || (category.type === 'income' ? 'Plus' : 'MoreHorizontal')
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'expense',
        color: getDefaultColorByType('expense'),
        icon: 'MoreHorizontal'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'expense', 
      color: getDefaultColorByType('expense'),
      icon: 'MoreHorizontal'
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome da categoria é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        toast({
          title: 'Categoria atualizada!',
          description: 'A categoria foi atualizada com sucesso.',
        });
      } else {
        await createCategory(formData);
        toast({
          title: 'Categoria criada!',
          description: 'A nova categoria foi criada com sucesso.',
        });
      }
      handleCloseModal();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar categoria',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (category: Category) => {
    try {
      await deleteCategory(category.id);
      toast({
        title: 'Categoria excluída!',
        description: 'A categoria foi excluída com sucesso.',
      });
      setDeletingCategory(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir categoria',
        variant: 'destructive',
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <LucideIcons.Circle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader 
          title="Categorias" 
          subtitle="Gerencie suas categorias financeiras"
          breadcrumb={breadcrumbs}
        />
        <div className="space-y-6">
          <LoadingSkeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Categorias" 
        subtitle="Gerencie suas categorias financeiras"
        breadcrumb={breadcrumbs}
        actions={
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Categoria
              </Button>
            </DialogTrigger>
          </Dialog>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Filter className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-2xl font-bold text-green-600">{stats.income}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-2xl font-bold text-red-600">{stats.expense}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sistema</p>
                <p className="text-2xl font-bold text-purple-600">{stats.system}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <LucideIcons.Shield className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value: 'all' | 'income' | 'expense') => setTypeFilter(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Nenhuma categoria encontrada"
          description="Crie sua primeira categoria para começar a organizar suas finanças."
          actionLabel="Nova Categoria"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <CategoriaCard
              key={category.id}
              category={category}
              onView={(cat) => {}}
              onEdit={handleOpenModal}
              onDelete={setDeletingCategory}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="modal-base max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Salário, Aluguel, etc."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => 
                  setFormData(prev => ({ 
                    ...prev, 
                    type: value,
                    color: getDefaultColorByType(value),
                    icon: value === 'income' ? 'Plus' : 'MoreHorizontal'
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color }}
                          />
                          {color}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {getIconComponent(icon)}
                          {icon}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium mb-2 block">Preview</Label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  {getIconComponent(formData.icon || 'Circle')}
                </div>
                <div>
                  <p className="font-medium">{formData.name || 'Nome da categoria'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.type === 'income' ? 'Receita' : 'Despesa'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim()}
            >
              {editingCategory ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
        title="Excluir Categoria"
        description={`Tem certeza que deseja excluir a categoria "${deletingCategory?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deletingCategory && handleDelete(deletingCategory)}
      />
    </PageContainer>
  );
}