import { useState, useMemo } from 'react';
import { Building2, Plus, Upload, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Banco, MovimentacaoOFX } from '../types/banco';
import { formatarMoeda } from '../utils/formatters';
import { BancoCard } from '../components/bancos/BancoCard';
import { BancoModal } from '../components/bancos/BancoModal';
import { UploadOFXModal } from '../components/bancos/UploadOFXModal';
import { ExtratoOFXModal } from '../components/bancos/ExtratoOFXModal';
import { BancoSkeletonGrid, EstatisticasSkeleton } from '../components/bancos/BancoSkeleton';
import { Button } from '../components/ui/button';
import { LoadingButton } from '../components/ui/LoadingButton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useDebounce } from '../hooks/useDebounce';
import { useLoadingStates } from '../hooks/useLoadingStates';
import { useBancosSupabase } from '../hooks/useBancosReal';
import { DadosOFX } from '../utils/ofxParser';
import { toast } from '@/hooks/use-toast';

export default function Bancos() {
  const { bancos, loading, criarBanco, atualizarBanco, excluirBanco, estatisticas } = useBancosSupabase();
  const { isSaving, setLoading } = useLoadingStates();
  
  const [bancoModalAberto, setBancoModalAberto] = useState(false);
  const [uploadModalAberto, setUploadModalAberto] = useState(false);
  const [extratoModalAberto, setExtratoModalAberto] = useState(false);
  const [bancoSelecionado, setBancoSelecionado] = useState<Banco | null>(null);
  const [filtros, setFiltros] = useState({
    busca: '',
    status: 'todos',
    tipo_conta: 'todos',
    possui_limite: 'todos',
    suporta_ofx: 'todos'
  });

  // Debounce para busca
  const buscaDebounced = useDebounce(filtros.busca, 500);

  const bancosFiltrados = useMemo(() => {
    return bancos.filter(banco => {
      const matchBusca = !buscaDebounced || 
        banco.nome.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
        banco.codigo_banco.includes(buscaDebounced) ||
        banco.agencia.includes(buscaDebounced) ||
        banco.conta.includes(buscaDebounced);
      
      const matchStatus = filtros.status === 'todos' || 
        (filtros.status === 'ativo' && banco.ativo) ||
        (filtros.status === 'inativo' && !banco.ativo);
      
      const matchTipo = filtros.tipo_conta === 'todos' || banco.tipo_conta === filtros.tipo_conta;
      
      const matchLimite = filtros.possui_limite === 'todos' || 
        (filtros.possui_limite === 'sim' && (banco.limite || 0) > 0) ||
        (filtros.possui_limite === 'nao' && (banco.limite || 0) === 0);
      
      const matchOFX = filtros.suporta_ofx === 'todos' ||
        (filtros.suporta_ofx === 'sim' && banco.suporta_ofx) ||
        (filtros.suporta_ofx === 'nao' && !banco.suporta_ofx);
      
      return matchBusca && matchStatus && matchTipo && matchLimite && matchOFX;
    });
  }, [bancos, buscaDebounced, filtros]);

  const handleSalvarBanco = async (dadosBanco: Omit<Banco, 'id' | 'created_at' | 'updated_at'>) => {
    // Validações antes de salvar
    if (!dadosBanco.nome.trim()) {
      toast({ title: 'Atenção', description: 'Nome do banco é obrigatório' });
      return;
    }

    if (!dadosBanco.codigo_banco.trim()) {
      toast({ title: 'Atenção', description: 'Código do banco é obrigatório' });
      return;
    }

    if (!dadosBanco.agencia.trim()) {
      toast({ title: 'Atenção', description: 'Agência é obrigatória' });
      return;
    }

    if (!dadosBanco.conta.trim()) {
      toast({ title: 'Atenção', description: 'Conta é obrigatória' });
      return;
    }

    setLoading('saving', true);
    try {
      if (bancoSelecionado) {
        await atualizarBanco(bancoSelecionado.id.toString(), dadosBanco);
        toast({ title: 'Sucesso', description: 'Banco atualizado com sucesso' });
      } else {
        await criarBanco(dadosBanco);
        toast({ title: 'Sucesso', description: 'Banco criado com sucesso' });
      }
      
      setBancoModalAberto(false);
      setBancoSelecionado(null);
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar banco. Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading('saving', false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/bancos')}
        title="Bancos"
        subtitle="Contas bancárias • Saldos e movimentações"
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={() => setUploadModalAberto(true)}
              className="bg-white/80 backdrop-blur-sm border-white/20"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar OFX
            </Button>
            <Button 
              onClick={() => {
                setBancoSelecionado(null);
                setBancoModalAberto(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {/* Cards de resumo */}
        {loading ? (
          <EstatisticasSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total de Bancos</h3>
              <p className="text-2xl font-bold text-foreground">{estatisticas.totalBancos}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Saldo Total</h3>
              <p className="text-2xl font-bold text-foreground">{formatarMoeda(estatisticas.saldoTotal)}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Bancos Ativos</h3>
              <p className="text-2xl font-bold text-foreground">{estatisticas.bancosAtivos}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Maior Saldo</h3>
              <p className="text-2xl font-bold text-foreground">{formatarMoeda(estatisticas.maiorSaldo)}</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar bancos..."
                value={filtros.busca}
                onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                className="pl-10 input-base"
              />
            </div>
            <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="input-base">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtros.tipo_conta} onValueChange={(value) => setFiltros(prev => ({ ...prev, tipo_conta: value }))}>
              <SelectTrigger className="input-base">
                <SelectValue placeholder="Tipo de Conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
                <SelectItem value="conta_salario">Conta Salário</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtros.possui_limite} onValueChange={(value) => setFiltros(prev => ({ ...prev, possui_limite: value }))}>
              <SelectTrigger className="input-base">
                <SelectValue placeholder="Possui Limite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sim">Com Limite</SelectItem>
                <SelectItem value="nao">Sem Limite</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtros.suporta_ofx} onValueChange={(value) => setFiltros(prev => ({ ...prev, suporta_ofx: value }))}>
              <SelectTrigger className="input-base">
                <SelectValue placeholder="Suporte OFX" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sim">Com OFX</SelectItem>
                <SelectItem value="nao">Sem OFX</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid de bancos */}
        {loading ? (
          <BancoSkeletonGrid />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {bancosFiltrados.map(banco => (
              <BancoCard
                key={banco.id}
                banco={banco}
                onEdit={(banco) => {
                  setBancoSelecionado(banco);
                  setBancoModalAberto(true);
                }}
                onView={(banco) => {
                  setBancoSelecionado(banco);
                  // Modal de visualização seria implementado aqui
                }}
                onUploadOFX={(banco) => {
                  setBancoSelecionado(banco);
                  setUploadModalAberto(true);
                }}
                onViewExtrato={(banco) => {
                  setBancoSelecionado(banco);
                  setExtratoModalAberto(true);
                }}
                onViewHistorico={(banco) => {
                  setBancoSelecionado(banco);
                  // Modal de histórico seria implementado aqui
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BancoModal
        isOpen={bancoModalAberto}
        onClose={() => {
          setBancoModalAberto(false);
          setBancoSelecionado(null);
        }}
        banco={bancoSelecionado}
        bancos={bancos}
        onSave={handleSalvarBanco}
      />

      <UploadOFXModal
        isOpen={uploadModalAberto}
        onClose={() => {
          setUploadModalAberto(false);
          setBancoSelecionado(null);
        }}
        bancos={bancos}
        bancoSelecionado={bancoSelecionado}
        onUpload={async (arquivo, bancoId, dadosOFX: DadosOFX) => {
            try {
              // Atualizar banco com dados do OFX
              await atualizarBanco(bancoId.toString(), {
                saldo_atual: dadosOFX.saldoFinal,
                ultimo_fitid: dadosOFX.fitid,
                data_ultima_sincronizacao: new Date().toISOString()
              });
              
              toast({ title: 'Sucesso', description: 'Extrato OFX importado com sucesso' });
            } catch (error) {
              toast({ title: 'Erro', description: 'Erro na importação do extrato OFX', variant: 'destructive' });
            }
        }}
      />

      {bancoSelecionado && (
        <ExtratoOFXModal
          isOpen={extratoModalAberto}
          onClose={() => {
            setExtratoModalAberto(false);
            setBancoSelecionado(null);
          }}
          banco={bancoSelecionado}
            onCriarConta={(movimentacao: MovimentacaoOFX) => {
            toast({ title: 'Sucesso', description: 'Nova conta a pagar criada!' });
          }}
          onVincularConta={(movimentacao: MovimentacaoOFX) => {
            toast({ title: 'Sucesso', description: 'Movimentação vinculada com sucesso!' });
          }}
          onIgnorar={(movimentacao: MovimentacaoOFX) => {
            toast({ title: 'Sucesso', description: 'Movimentação marcada como ignorada.' });
          }}
        />
      )}
    </div>
  );
}