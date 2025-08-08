import { useState } from 'react';
import { Plus, Search, Users, Trash2, Edit3, ToggleLeft, ToggleRight, Building2, User } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSuppliers } from '@/hooks/useSuppliers';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';
import { validateDocument, validateEmail, validatePhone, validateCEP, formatDocument, formatPhone, formatCEP } from '@/utils/documentValidation';
import type { Supplier, CreateSupplier } from '@/types/supplier';
import { BRAZILIAN_STATES } from '@/types/supplier';

export default function Fornecedores() {
  const { suppliers, loading, createSupplier, updateSupplier, deleteSupplier, toggleSupplierActive } = useSuppliers();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | boolean>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<CreateSupplier>({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const debouncedSearch = useDebounce(search, 300);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                         supplier.document?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                         supplier.email?.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesActive = activeFilter === 'all' || supplier.active === activeFilter;
    
    return matchesSearch && matchesActive;
  });

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        document: supplier.document || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        zip: supplier.zip || '',
        notes: supplier.notes || '',
        active: supplier.active,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        document: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        notes: '',
        active: true,
      });
    }
    setValidationErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSupplier(null);
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (formData.document && !validateDocument(formData.document)) {
      errors.document = 'Documento inválido';
    }

    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Telefone inválido';
    }

    if (formData.zip && !validateCEP(formData.zip)) {
      errors.zip = 'CEP inválido';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const supplierData = {
        ...formData,
        name: formData.name.trim(),
        document: formData.document?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        state: formData.state?.trim() || undefined,
        zip: formData.zip?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierData);
      } else {
        await createSupplier(supplierData);
      }
      handleCloseModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;

    await deleteSupplier(deletingSupplier.id);
    setDeletingSupplier(null);
  };

  const handleToggleActive = async (supplier: Supplier) => {
    await toggleSupplierActive(supplier.id);
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          breadcrumb={[
            { label: 'Início', href: '/' },
            { label: 'Cadastros' },
            { label: 'Fornecedores' }
          ]}
          title="Fornecedores"
          subtitle="Gerencie seus fornecedores e prestadores de serviço"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-48" />
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
          { label: 'Fornecedores' }
        ]}
        title="Fornecedores"
        subtitle="Gerencie seus fornecedores e prestadores de serviço"
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="card-base p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome, documento ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={activeFilter.toString()} onValueChange={(value) => setActiveFilter(value === 'all' ? 'all' : value === 'true')}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Ativos</SelectItem>
              <SelectItem value="false">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Fornecedores */}
      {filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum fornecedor encontrado"
          description={search ? "Nenhum fornecedor corresponde aos filtros aplicados." : "Comece criando seu primeiro fornecedor."}
          actionLabel={!search ? "Novo Fornecedor" : undefined}
          onAction={!search ? () => handleOpenModal() : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="card-base p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {supplier.document && supplier.document.length === 14 ? (
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                    {supplier.document && (
                      <p className="text-sm text-muted-foreground">
                        {formatDocument(supplier.document)}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={supplier.active ? "default" : "secondary"}>
                  {supplier.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              {supplier.email && (
                <p className="text-sm text-muted-foreground mb-2">{supplier.email}</p>
              )}
              
              {supplier.phone && (
                <p className="text-sm text-muted-foreground mb-2">{formatPhone(supplier.phone)}</p>
              )}

              {supplier.city && supplier.state && (
                <p className="text-sm text-muted-foreground mb-4">
                  {supplier.city}, {supplier.state}
                </p>
              )}

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(supplier)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeletingSupplier(supplier)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleActive(supplier)}
                >
                  {supplier.active ? (
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Fornecedor */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="modal-base max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do fornecedor"
                className={validationErrors.name ? 'border-destructive' : ''}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                placeholder="000.000.000-00"
                className={validationErrors.document ? 'border-destructive' : ''}
              />
              {validationErrors.document && (
                <p className="text-sm text-destructive mt-1">{validationErrors.document}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className={validationErrors.email ? 'border-destructive' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className={validationErrors.phone ? 'border-destructive' : ''}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="zip">CEP</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                placeholder="00000-000"
                className={validationErrors.zip ? 'border-destructive' : ''}
              />
              {validationErrors.zip && (
                <p className="text-sm text-destructive mt-1">{validationErrors.zip}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="São Paulo"
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={3}
              />
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
              {saving ? 'Salvando...' : (editingSupplier ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        open={!!deletingSupplier}
        onOpenChange={() => setDeletingSupplier(null)}
        title="Excluir Fornecedor"
        description={`Tem certeza que deseja excluir o fornecedor "${deletingSupplier?.name}"?`}
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}