import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { useContasReceberOtimizado } from '@/hooks/useContasReceberOtimizado';
import { formatCurrency } from '@/utils/currency';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmacaoModal } from '@/components/ui/ConfirmacaoModal';
import { FiltrosInteligentesReceber } from '@/components/contasReceber/FiltrosInteligentesReceber';
import { ContasReceberList, ContaReceberListItem } from '@/components/contasReceber/ContasReceberList';
import { RecebimentoModalAdvanced } from '@/components/contasReceber/RecebimentoModalAdvanced';
import { AccountReceivable } from '@/types/accounts';

const ContasReceber: React.FC = () => {
  const navigate = useNavigate();
  
  const {
    contasFiltradas,
    categorias,
    clientes,
    filtros,
    setFiltros,
    filtroRapido,
    setFiltroRapido,
    limparFiltros,
    estatisticas,
    estados,
    baixarConta,
    excluirConta
  } = useContasReceberOtimizado();

  const [modalRecebimentoAberto, setModalRecebimentoAberto] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<AccountReceivable | null>(null);

  // Transformar contas para o formato da lista
  const contasListadas = useMemo((): ContaReceberListItem[] => {
    return contasFiltradas.map(conta => ({
      id: conta.id,
      description: conta.description,
      amount: conta.amount,
      due_date: conta.due_date,
      status: conta.status,
      contact: conta.contact,
      customer_name: conta.customer_name,
      category: conta.category,
      notes: conta.notes,
      received_at: conta.received_at,
      created_at: conta.created_at
    }));
  }, [contasFiltradas]);

  const handleCreateAccount = () => {
    navigate('/novo-recebimento');
  };

  const handleMarkAsReceived = (conta: ContaReceberListItem) => {
    const contaCompleta = contasFiltradas.find(c => c.id === conta.id);
    setContaSelecionada(contaCompleta || null);
    setModalRecebimentoAberto(true);
  };

  const confirmMarkAsReceived = async (dadosRecebimento: any) => {
    if (!contaSelecionada) return;

    try {
      await baixarConta(contaSelecionada.id, dadosRecebimento);
      setModalRecebimentoAberto(false);
      setContaSelecionada(null);
    } catch (error) {
      console.error('Erro ao marcar como recebido:', error);
    }
  };

  const handleDelete = (conta: ContaReceberListItem) => {
    const contaCompleta = contasFiltradas.find(c => c.id === conta.id);
    setContaSelecionada(contaCompleta || null);
    setModalConfirmacaoAberto(true);
  };

  const confirmDelete = async () => {
    if (!contaSelecionada) return;

    try {
      await excluirConta(contaSelecionada.id);
      setModalConfirmacaoAberto(false);
      setContaSelecionada(null);
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
    }
  };

  const handleEdit = (conta: ContaReceberListItem) => {
    console.log('Editar conta:', conta);
  };

  const handleView = (conta: ContaReceberListItem) => {
    console.log('Visualizar conta:', conta);
  };

  if (estados.loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <LoadingSkeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-24" />
            ))}
          </div>
          <LoadingSkeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Contas a Receber"
        subtitle="Gerencie suas receitas e recebimentos"
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Contas a Receber' }
        ]}
        action={
          <Button onClick={handleCreateAccount} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nova Receita
          </Button>
        }
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="card-base">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total a Receber
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(estatisticas.total_valor)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {estatisticas.total} conta(s)
            </p>
          </CardContent>
        </Card>

        <Card className="card-base">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {formatCurrency(estatisticas.valor_pendente)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {estatisticas.pendentes} conta(s)
            </p>
          </CardContent>
        </Card>

        <Card className="card-base">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Vencidas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(estatisticas.valor_vencido)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {estatisticas.vencidas} conta(s)
            </p>
          </CardContent>
        </Card>

        <Card className="card-base">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recebidas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(estatisticas.valor_recebido)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {estatisticas.recebidas} conta(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Inteligentes */}
      <FiltrosInteligentesReceber
        filtros={filtros}
        setFiltros={setFiltros}
        filtroRapido={filtroRapido}
        setFiltroRapido={setFiltroRapido}
        clientes={clientes}
        categorias={categorias}
        estatisticas={estatisticas}
        onLimparFiltros={limparFiltros}
      />

      {/* Lista de Contas */}
      <ContasReceberList
        contas={contasListadas}
        loading={estados.loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onReceive={handleMarkAsReceived}
      />

      {/* Modal de Recebimento */}
      <RecebimentoModalAdvanced
        isOpen={modalRecebimentoAberto}
        onClose={() => {
          setModalRecebimentoAberto(false);
          setContaSelecionada(null);
        }}
        conta={contaSelecionada}
        onConfirm={confirmMarkAsReceived}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmacaoModal
        isOpen={modalConfirmacaoAberto}
        onClose={() => {
          setModalConfirmacaoAberto(false);
          setContaSelecionada(null);
        }}
        onConfirm={confirmDelete}
        title="Excluir Conta a Receber"
        message={`Tem certeza que deseja excluir a conta "${contaSelecionada?.description}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </PageContainer>
  );
};

export default ContasReceber;