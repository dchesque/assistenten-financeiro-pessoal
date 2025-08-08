import { useState } from 'react';
import { Plus, Search, Palette, Trash2, Edit3 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/hooks/useCategories';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import type { Category, CreateCategory } from '@/types/category';
import { CATEGORY_COLORS } from '@/types/category';

export default function Categorias() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategory>({ name: '', color: CATEGORY_COLORS[0] });
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, color: category.color || CATEGORY_COLORS[0] });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', color: CATEGORY_COLORS[0] });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', color: CATEGORY_COLORS[0] });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      handleCloseModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    await deleteCategory(deletingCategory.id);
    setDeletingCategory(null);
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          breadcrumb={[
            { label: 'Início', href: '/' },
            { label: 'Cadastros' },
            { label: 'Categorias' }
          ]}
          title="Categorias"
          subtitle="Gerencie as categorias financeiras"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Cadastros' },
          { label: 'Categorias' }
        ]}
        title="Categorias"
        subtitle="Gerencie as categorias financeiras"
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="card-base p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar categorias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Lista de Categorias */}
      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="Nenhuma categoria encontrada"
          description={search ? "Nenhuma categoria corresponde aos filtros aplicados." : "Comece criando sua primeira categoria financeira."}
          actionLabel={!search ? "Nova Categoria" : undefined}
          onAction={!search ? () => handleOpenModal() : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="card-base p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || CATEGORY_COLORS[0] }}
                  />
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(category)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeletingCategory(category)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Criada em {new Date(category.created_at).toLocaleDateString('pt-BR')}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Categoria */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="modal-base">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome da categoria"
                className="input-base"
              />
            </div>

            <div>
              <Label>Cor</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-primary scale-110' : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim() || saving}
            >
              {saving ? 'Salvando...' : (editingCategory ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
        title="Excluir Categoria"
        description={`Tem certeza que deseja excluir a categoria "${deletingCategory?.name}"?`}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}