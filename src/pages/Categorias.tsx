import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useCategories } from '@/hooks/useCategories';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { CategoriasList } from '@/components/categorias/CategoriasList';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import { Category, CreateCategory, CATEGORY_COLORS, getGroupsByType, getIconsByGroup, getDefaultColorByType } from '@/types/category';
import { toast } from '@/hooks/use-toast';
import * as LucideIcons from 'lucide-react';

const breadcrumbs = [
  { label: 'Início', href: '/' },
  { label: 'Categorias', href: '/categorias' }
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
    group_name: '',
    color: getDefaultColorByType('expense'),
    icon: 'Circle'
  });

  const debouncedSearch = useDebounce(search, 300);
  const { categories, loading, createCategory, updateCategory, deleteCategory, refresh } = useCategories();

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !debouncedSearch || 
      category.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesType = typeFilter === 'all' || category.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const groupedCategories = filteredCategories.reduce((acc, category) => {
    const group = category.group_name || 'outros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(category);
    return acc;
  }, {} as Record<string, Category[]>);

  const stats = {
    total: categories.length,
    income: categories.filter(c => c.type === 'income').length,
    expense: categories.filter(c => c.type === 'expense').length
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        group_name: category.group_name || '',
        color: category.color || getDefaultColorByType(category.type),
        icon: category.icon || 'Circle'
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'expense',
        group_name: '',
        color: getDefaultColorByType('expense'),
        icon: 'Circle'
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
      group_name: '',
      color: getDefaultColorByType('expense'),
      icon: 'Circle'
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

    if (!formData.group_name) {
      toast({
        title: 'Erro',
        description: 'O grupo da categoria é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const categoryData = {
        ...formData,
        color: getDefaultColorByType(formData.type)
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        toast({
          title: 'Categoria atualizada!',
          description: 'A categoria foi atualizada com sucesso.',
        });
      } else {
        await createCategory(categoryData);
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

  const availableGroups = getGroupsByType(formData.type);
  const availableIcons = getIconsByGroup(formData.group_name || 'outros');

  // Auto-select first group when type changes
  useEffect(() => {
    if (formData.type) {
      const groups = getGroupsByType(formData.type);
      const firstGroup = Object.keys(groups)[0];
      if (!formData.group_name || !Object.keys(groups).includes(formData.group_name)) {
        setFormData(prev => ({ 
          ...prev, 
          group_name: firstGroup,
          color: getDefaultColorByType(formData.type)
        }));
      }
    }
  }, [formData.type]);

  // Auto-select first icon when group changes
  useEffect(() => {
    if (formData.group_name) {
      const icons = getIconsByGroup(formData.group_name);
      if (formData.icon && !(icons as readonly string[]).includes(formData.icon)) {
        setFormData(prev => ({ ...prev, icon: icons[0] }));
      }
    }
  }, [formData.group_name]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <LucideIcons.TrendingUp className="w-4 h-4 text-green-600" />
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
                <LucideIcons.TrendingDown className="w-4 h-4 text-red-600" />
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

      {/* Categories List */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Nenhuma categoria encontrada"
          description="Crie sua primeira categoria para começar a organizar suas finanças."
          actionLabel="Nova Categoria"
          onAction={() => handleOpenModal()}
        />
      ) : (
        <CategoriasList
          categories={filteredCategories}
          onEdit={handleOpenModal}
          onDelete={setDeletingCategory}
        />
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="modal-base max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    setFormData(prev => ({ ...prev, type: value }))
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="group">Grupo *</Label>
              <Select
                value={formData.group_name}
                onValueChange={(value) => setFormData(prev => ({ ...prev, group_name: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(availableGroups).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-6 gap-2">
                {availableIcons.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: iconName }))}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      formData.icon === iconName
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {getIconComponent(iconName)}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium mb-2 block">Preview</Label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: getDefaultColorByType(formData.type) }}
                >
                  {getIconComponent(formData.icon || 'Circle')}
                </div>
                <div>
                  <p className="font-medium">{formData.name || 'Nome da categoria'}</p>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`text-xs ${
                        formData.type === 'income' 
                          ? 'bg-green-100/80 text-green-700 border-green-200' 
                          : 'bg-red-100/80 text-red-700 border-red-200'
                      }`}
                    >
                      {formData.type === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
                    {formData.group_name && (
                      <span className="text-xs text-muted-foreground">
                        {availableGroups[formData.group_name as keyof typeof availableGroups]}
                      </span>
                    )}
                  </div>
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
              disabled={!formData.name.trim() || !formData.group_name}
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