import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { useMaquininhas } from '@/hooks/useMaquininhas';
import { Maquininha, OPERADORAS } from '@/types/maquininha';
import { formatarMoeda } from '@/utils/formatters';
import { CreditCard, Plus, Search, Edit, BarChart3, Settings, MapPin, Phone, Building, Loader2 } from 'lucide-react';
import MaquininhaModal from '@/components/maquininhas/MaquininhaModal';
import TaxasMaquininhaModal from '@/components/maquininhas/TaxasMaquininhaModal';

export default function GerenciarMaquininhas() {
  const { maquininhas, loading, error } = useMaquininhas();
  const [filtros, setFiltros] = useState({
    busca: '',
    operadora: 'todas',
    status: 'todos'
  });

  // Estados do modal
  const [modalAberto, setModalAberto] = useState(false);
  const [maquininhaSelecionada, setMaquininhaSelecionada] = useState<Maquininha | null>(null);
  const [modoModal, setModoModal] = useState<'criar' | 'editar' | 'visualizar'>('criar');

  const maquininhasFiltradas = maquininhas.filter(maquininha => {
    const matchBusca = !filtros.busca || 
      maquininha.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      maquininha.codigo_estabelecimento.includes(filtros.busca);
    
    const matchOperadora = filtros.operadora === 'todas' || maquininha.operadora === filtros.operadora;
    const matchStatus = filtros.status === 'todos' || 
      (filtros.status === 'ativo' && maquininha.ativo) ||
      (filtros.status === 'inativo' && !maquininha.ativo);

    return matchBusca && matchOperadora && matchStatus;
  });

  const abrirModalCriar = () => {
    setMaquininhaSelecionada(null);
    setModoModal('criar');
    setModalAberto(true);
  };

  const abrirModalEditar = (maquininha: Maquininha) => {
    setMaquininhaSelecionada(maquininha);
    setModoModal('editar');
    setModalAberto(true);
  };

  const abrirModalVisualizar = (maquininha: Maquininha) => {
    setMaquininhaSelecionada(maquininha);
    setModoModal('visualizar');
    setModalAberto(true);
  };

  const MaquininhaCard = ({ maquininha }: { maquininha: Maquininha }) => (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:bg-white/90">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              maquininha.operadora === 'rede' 
                ? 'bg-red-100 text-red-600' 
                : 'bg-blue-100 text-blue-600'
            }`}>
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{maquininha.nome}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Building className="w-3 h-3" />
                {OPERADORAS[maquininha.operadora]}
              </p>
            </div>
          </div>
          <Badge 
            className={maquininha.ativo 
              ? 'bg-green-100/80 text-green-700' 
              : 'bg-red-100/80 text-red-700'
            }
          >
            {maquininha.ativo ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-gray-50/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">🏦 {maquininha.banco_nome}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">EC: {maquininha.codigo_estabelecimento}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">📊 Taxas configuradas:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-blue-50/80 rounded-lg p-2 text-center">
              <p className="font-medium text-blue-900">Débito</p>
              <p className="text-blue-700">1,99%</p>
            </div>
            <div className="bg-green-50/80 rounded-lg p-2 text-center">
              <p className="font-medium text-green-900">Crédito</p>
              <p className="text-green-700">3,99%</p>
            </div>
            <div className="bg-orange-50/80 rounded-lg p-2 text-center">
              <p className="font-medium text-orange-900">Parcelado</p>
              <p className="text-orange-700">4,99%</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            ✅ Última conciliação: Jan/2025
          </span>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 bg-white/80 hover:bg-white/90 border-blue-200 hover:border-blue-300"
            onClick={() => abrirModalEditar(maquininha)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 bg-white/80 hover:bg-white/90 border-green-200 hover:border-green-300"
            onClick={() => alert('Funcionalidade em desenvolvimento')}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Relatórios
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white/80 hover:bg-white/90 border-purple-200 hover:border-purple-300"
            onClick={() => abrirModalVisualizar(maquininha)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl"></div>
      </div>

      <PageHeader
        breadcrumb={createBreadcrumb('/gerenciar-maquininhas')}
        title="Gerenciar Maquininhas"
        subtitle="Configure e monitore suas maquininhas de cartão • Controle de taxas e operadoras"
        actions={
          <Button 
            onClick={abrirModalCriar}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Maquininha
          </Button>
        }
      />

      <div className="relative p-4 lg:p-8">

        {/* Filtros */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 mb-8 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou EC..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="pl-10 bg-white/80 border-gray-300/50"
                />
              </div>

              <Select 
                value={filtros.operadora} 
                onValueChange={(value) => setFiltros(prev => ({ ...prev, operadora: value }))}
              >
                <SelectTrigger className="bg-white/80 border-gray-300/50">
                  <SelectValue placeholder="Operadora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as operadoras</SelectItem>
                  <SelectItem value="rede">Rede</SelectItem>
                  <SelectItem value="sipag">Sipag</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filtros.status} 
                onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-white/80 border-gray-300/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativas</SelectItem>
                  <SelectItem value="inativo">Inativas</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setFiltros({ busca: '', operadora: 'todas', status: 'todos' })}
                  className="bg-white/80 hover:bg-white/90"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Maquininhas */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : maquininhasFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {maquininhasFiltradas.map((maquininha) => (
              <MaquininhaCard key={maquininha.id} maquininha={maquininha} />
            ))}
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma maquininha encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                {filtros.busca || filtros.operadora !== 'todas' || filtros.status !== 'todos'
                  ? 'Tente ajustar os filtros para encontrar as maquininhas.'
                  : 'Comece cadastrando sua primeira maquininha de cartão.'
                }
              </p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeira Maquininha
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Maquininha */}
      <MaquininhaModal
        open={modalAberto}
        onOpenChange={setModalAberto}
        maquininha={maquininhaSelecionada}
        modo={modoModal}
      />
    </div>
  );
}