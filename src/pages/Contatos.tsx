import { useState } from 'react';
import { Building2, Users, Plus, Search, Filter, MoreVertical, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { useCredores } from '@/hooks/useCredores';
import { usePagadores } from '@/hooks/usePagadores';
import { useLoadingStates } from '@/hooks/useLoadingStates';
import { ContatoModal } from '@/components/ui/ContatoModal';
import { toast } from '@/hooks/use-toast';

type ContatoTipo = 'credor' | 'pagador';

export default function Contatos() {
  const [filtroTipo, setFiltroTipo] = useState<ContatoTipo | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoModal, setTipoModal] = useState<ContatoTipo>('credor');
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  
  const { isDeleting, setLoading } = useLoadingStates();

  const { credores, loading: loadingCredores, criarCredor, atualizarCredor, excluirCredor } = useCredores();
  const { pagadores, loading: loadingPagadores } = usePagadores();

  const criarPagador = async (dados: any) => { /* TODO: Implementar com Supabase */ };
  const atualizarPagador = async (id: number, dados: any) => { /* TODO: Implementar com Supabase */ };
  const excluirPagador = async (id: number) => { /* TODO: Implementar com Supabase */ };

  const breadcrumbItems = [
    { label: 'Início', href: '/dashboard' },
    { label: 'Cadastros' },
    { label: 'Pessoas e Empresas' }
  ];

  // Combinar credores e pagadores com tipo
  const contatos = [
    ...credores.map(c => ({ ...c, tipo: 'credor' as ContatoTipo })),
    ...pagadores.map(p => ({ ...p, tipo: 'pagador' as ContatoTipo }))
  ];

  const contatosFiltrados = contatos.filter(contato => {
    const matchTipo = filtroTipo === 'todos' || contato.tipo === filtroTipo;
    const matchBusca = !busca || contato.nome.toLowerCase().includes(busca.toLowerCase());
    return matchTipo && matchBusca;
  });

  const handleNovoContato = (tipo: ContatoTipo) => {
    setTipoModal(tipo);
    setItemSelecionado(null);
    setModoEdicao(false);
    setModalAberto(true);
  };

  const handleEditarContato = (contato: any) => {
    setTipoModal(contato.tipo);
    setItemSelecionado(contato);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const handleExcluirContato = (contato: any) => {
    setItemToDelete(contato);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setLoading('deleting', true);
    try {
      if (itemToDelete.tipo === 'credor') {
        await excluirCredor(itemToDelete.id);
      } else {
        await excluirPagador(itemToDelete.id);
      }
      toast({ title: 'Sucesso', description: 'Contato excluído com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir contato', variant: 'destructive' });
    } finally {
      setLoading('deleting', false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSalvarContato = async (dados: any) => {
    try {
      const dadosComTipo = { ...dados, tipo: tipoModal };
      
      if (modoEdicao && itemSelecionado) {
        if (tipoModal === 'credor') {
          await atualizarCredor(itemSelecionado.id, dadosComTipo);
        } else {
          await atualizarPagador(itemSelecionado.id, dadosComTipo);
        }
        toast({ title: 'Sucesso', description: 'Contato atualizado com sucesso!' });
      } else {
        if (tipoModal === 'credor') {
          await criarCredor(dadosComTipo);
        } else {
          await criarPagador(dadosComTipo);
        }
        toast({ title: 'Sucesso', description: 'Contato criado com sucesso!' });
      }
      setModalAberto(false);
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar contato', variant: 'destructive' });
    }
  };

  const getStatusBadge = (tipo: ContatoTipo) => {
    return tipo === 'credor' 
      ? <Badge variant="destructive" className="bg-red-100/80 text-red-700">Credor</Badge>
      : <Badge variant="default" className="bg-green-100/80 text-green-700">Pagador</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Container principal com padding responsivo e max-width */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 lg:px-8 lg:py-8">
      <PageHeader 
        title="Pessoas e Empresas" 
        subtitle="Gerencie credores e pagadores"
        breadcrumb={breadcrumbItems}
        actions={
          <div className="flex gap-2">
            <Button 
              onClick={() => handleNovoContato('credor')}
              className="bg-gradient-to-r from-red-600 to-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Credor
            </Button>
            <Button 
              onClick={() => handleNovoContato('pagador')}
              className="bg-gradient-to-r from-green-600 to-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Pagador
            </Button>
          </div>
        }
      />

      <div className="grid gap-6">
        {/* Filtros */}
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Buscar por nome
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Digite o nome do contato..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tipo de contato
                </label>
                <Tabs value={filtroTipo} onValueChange={(value) => setFiltroTipo(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="todos">Todos</TabsTrigger>
                    <TabsTrigger value="credor">Credores</TabsTrigger>
                    <TabsTrigger value="pagador">Pagadores</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contatos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contatosFiltrados.map((contato) => (
            <Card key={`${contato.tipo}-${contato.id}`} className="card-base hover:scale-105 transition-all duration-200">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {contato.tipo === 'credor' ? (
                    <Building2 className="w-5 h-5 text-red-500" />
                  ) : (
                    <Users className="w-5 h-5 text-green-500" />
                  )}
                  {getStatusBadge(contato.tipo)}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditarContato(contato)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleExcluirContato(contato)}
                      className="text-red-600"
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-gray-900">{contato.nome}</h3>
                  {contato.documento && (
                    <p className="text-sm text-gray-600">
                      Doc: {contato.documento}
                    </p>
                  )}
                  {contato.email && (
                    <p className="text-sm text-gray-600">
                      Email: {contato.email}
                    </p>
                  )}
                  {contato.telefone && (
                    <p className="text-sm text-gray-600">
                      Tel: {contato.telefone}
                    </p>
                  )}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Cadastrado em: {new Date((contato as any).dataCadastro || (contato as any).created_at || '').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {contatosFiltrados.length === 0 && (
          <Card className="card-base">
            <CardContent className="text-center py-8">
              <div className="text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum contato encontrado</p>
                <p className="text-sm">
                  {filtroTipo === 'todos' 
                    ? 'Comece criando seu primeiro contato.'
                    : `Nenhum ${filtroTipo} encontrado com os filtros aplicados.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Contato */}
      <ContatoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        contato={itemSelecionado}
        onSave={handleSalvarContato}
        tipo={tipoModal}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja excluir "${itemToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={isDeleting}
      />
      </div>
    </div>
  );
}