import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useLoadingStates } from '@/hooks/useLoadingStates';
import { PlanoContas } from '@/types/planoContas';
import { toast } from '@/hooks/use-toast';
// Supabase removido - usando dados mock
import * as LucideIcons from 'lucide-react';

const CORES_DISPONIVEIS = [
  { nome: 'Azul', valor: '#3B82F6' },
  { nome: 'Verde', valor: '#10B981' },
  { nome: 'Roxo', valor: '#8B5CF6' },
  { nome: 'Rosa', valor: '#EC4899' },
  { nome: 'Laranja', valor: '#F59E0B' },
  { nome: 'Vermelho', valor: '#EF4444' },
  { nome: 'Índigo', valor: '#6366F1' },
  { nome: 'Cinza', valor: '#6B7280' },
];

const ICONES_DISPONIVEIS = [
  'Package', 'DollarSign', 'TrendingUp', 'TrendingDown', 'Home', 'Car', 'ShoppingCart',
  'Coffee', 'Zap', 'Phone', 'Wifi', 'Heart', 'Plane', 'Book', 'Music', 'Camera',
  'Monitor', 'Smartphone', 'Headphones', 'GameController', 'Gift', 'Star', 'Shield'
];

export default function Categorias() {
  const { planoContas, loading: loadingPlano, criarPlanoContas, atualizarPlanoContas, excluirPlanoContas, listarPlanoContas } = usePlanoContas();
  
  // Estados para filtros e busca
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  
  // Estados para modal de categoria
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEdicao, setCategoriaEdicao] = useState<PlanoContas | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para confirmação de exclusão
  const [modalExclusao, setModalExclusao] = useState(false);
  const [categoriaExclusao, setCategoriaExclusao] = useState<PlanoContas | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipo_dre: 'despesa_pessoal' as 'despesa_pessoal',
    cor: '#3B82F6',
    icone: 'Package',
    observacoes: '',
    aceita_lancamento: true,
    ativo: true
  });

  useEffect(() => {
    listarPlanoContas();
  }, []);

  // Filtrar categorias
  const categoriasFiltradas = planoContas.filter(categoria => {
    const matchBusca = !busca || 
      categoria.nome.toLowerCase().includes(busca.toLowerCase()) ||
      categoria.codigo.toLowerCase().includes(busca.toLowerCase());
    
    const matchTipo = filtroTipo === 'todos' || categoria.tipo_dre === filtroTipo;
    const matchStatus = filtroStatus === 'todos' || 
      (filtroStatus === 'ativo' && categoria.ativo) ||
      (filtroStatus === 'inativo' && !categoria.ativo);
    
    return matchBusca && matchTipo && matchStatus;
  });

  // Abrir modal para nova categoria
  const abrirModalNova = () => {
    setCategoriaEdicao(null);
    setFormData({
      codigo: '',
      nome: '',
      tipo_dre: 'despesa_pessoal',
      cor: '#3B82F6',
      icone: 'Package',
      observacoes: '',
      aceita_lancamento: true,
      ativo: true
    });
    setModalAberto(true);
  };

  // Abrir modal para editar categoria
  const abrirModalEdicao = (categoria: PlanoContas) => {
    setCategoriaEdicao(categoria);
    setFormData({
      codigo: categoria.codigo,
      nome: categoria.nome,
      tipo_dre: categoria.tipo_dre,
      cor: categoria.cor,
      icone: categoria.icone,
      observacoes: '',
      aceita_lancamento: categoria.aceita_lancamento,
      ativo: categoria.ativo
    });
    setModalAberto(true);
  };

  // Salvar categoria
  const salvarCategoria = async () => {
    if (!formData.nome.trim()) {
      toast({ title: 'Atenção', description: 'Nome da categoria é obrigatório' });
      return;
    }

    if (!formData.codigo.trim()) {
      toast({ title: 'Atenção', description: 'Código da categoria é obrigatório' });
      return;
    }

    try {
      setLoading(true);
      
      // Mock: usuário sempre autenticado

      const dadosCategoria = {
        codigo: formData.codigo.trim(),
        nome: formData.nome.trim(),
        tipo_dre: formData.tipo_dre,
        cor: formData.cor,
        icone: formData.icone,
        aceita_lancamento: formData.aceita_lancamento,
        ativo: formData.ativo,
        nivel: 1,
        plano_pai_id: null,
        total_contas: 0,
        valor_total: 0,
        // user_id removido por estar usando mock
      };

      if (categoriaEdicao) {
        await atualizarPlanoContas(categoriaEdicao.id, dadosCategoria);
        toast({ title: 'Sucesso', description: `"${formData.nome}" foi atualizada com sucesso` });
      } else {
        await criarPlanoContas(dadosCategoria);
        toast({ title: 'Sucesso', description: `"${formData.nome}" foi criada com sucesso` });
      }

      setModalAberto(false);
      // Recarregar lista
      await listarPlanoContas();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro interno do servidor', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Confirmar exclusão
  const confirmarExclusao = (categoria: PlanoContas) => {
    setCategoriaExclusao(categoria);
    setModalExclusao(true);
  };

  // Excluir categoria
  const excluirCategoria = async () => {
    if (!categoriaExclusao) return;

    try {
      setLoading(true);
      await excluirPlanoContas(categoriaExclusao.id);
      
      toast({ title: 'Sucesso', description: `"${categoriaExclusao.nome}" foi excluída com sucesso` });
      
      setModalExclusao(false);
      setCategoriaExclusao(null);
      await listarPlanoContas();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Erro interno do servidor', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Renderizar ícone
  const renderizarIcone = (nomeIcone: string, tamanho = 20) => {
    const IconeComponent = (LucideIcons as any)[nomeIcone] || Package;
    return <IconeComponent size={tamanho} />;
  };

  return (
    <>
      <PageHeader
        breadcrumb={createBreadcrumb('/categorias')}
        title="Categorias"
        subtitle="Gerencie categorias de receitas e despesas"
        actions={
          <Button onClick={abrirModalNova} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        }
      />

      <div className="p-4 lg:p-8 space-y-6">
        {/* Filtros */}
        <Card className="card-base">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Nome ou código..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10 input-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="input-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="input-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBusca('');
                    setFiltroTipo('todos');
                    setFiltroStatus('todos');
                  }}
                  className="w-full bg-white/80 hover:bg-white/90"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Categorias */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriasFiltradas.map((categoria) => (
            <Card key={categoria.id} className="card-base group hover:scale-[1.02] transition-all duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: categoria.cor }}
                    >
                      {renderizarIcone(categoria.icone, 24)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{categoria.nome}</h3>
                      <p className="text-sm text-gray-500">{categoria.codigo}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => abrirModalEdicao(categoria)}
                      className="w-8 h-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => confirmarExclusao(categoria)}
                      className="w-8 h-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      <Package className="w-3 h-3 mr-1" />
                      Categoria
                    </Badge>
                    
                    <Badge variant={categoria.ativo ? 'default' : 'secondary'}>
                      {categoria.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Aceita lançamento:</span>
                    <Badge variant={categoria.aceita_lancamento ? 'default' : 'secondary'}>
                      {categoria.aceita_lancamento ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {categoriasFiltradas.length === 0 && (
          <Card className="card-base">
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-gray-600 mb-4">
                {busca || filtroTipo !== 'todos' || filtroStatus !== 'todos' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira categoria'
                }
              </p>
              <Button onClick={abrirModalNova} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Modal de Categoria */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="modal-base max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {categoriaEdicao ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="Ex: REC001, DESP001"
                  className="input-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome da categoria"
                  className="input-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={formData.tipo_dre} 
                  onValueChange={(value: 'despesa_pessoal') => 
                    setFormData(prev => ({ ...prev, tipo_dre: value }))
                  }
                >
                  <SelectTrigger className="input-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="despesa_pessoal">Categoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CORES_DISPONIVEIS.map((cor) => (
                    <button
                      key={cor.valor}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, cor: cor.valor }))}
                      className={`w-full h-10 rounded-lg border-2 transition-all ${
                        formData.cor === cor.valor ? 'border-gray-900 scale-110' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: cor.valor }}
                      title={cor.nome}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {ICONES_DISPONIVEIS.map((icone) => (
                  <button
                    key={icone}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icone }))}
                    className={`p-2 rounded-lg border-2 transition-all hover:bg-gray-50 ${
                      formData.icone === icone ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {renderizarIcone(icone, 20)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre a categoria..."
                className="input-base"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="aceita_lancamento"
                  checked={formData.aceita_lancamento}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, aceita_lancamento: checked }))
                  }
                />
                <Label htmlFor="aceita_lancamento">Aceita lançamento</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, ativo: checked }))
                  }
                />
                <Label htmlFor="ativo">Categoria ativa</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setModalAberto(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={salvarCategoria}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                categoriaEdicao ? 'Atualizar' : 'Criar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={modalExclusao}
        onOpenChange={setModalExclusao}
        title="Excluir categoria"
        description={`Tem certeza que deseja excluir a categoria "${categoriaExclusao?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={excluirCategoria}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={loading}
      />
    </>
  );
}