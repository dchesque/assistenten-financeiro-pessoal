import React, { useState, useMemo } from 'react';
import { Plus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContasPagarList, ContaListItem } from '@/components/contasPagar/ContasPagarList';
import { PaymentModalAdvanced } from '@/components/contasPagar/PaymentModalAdvanced';
import { FiltrosInteligentes } from '@/components/contasPagar/FiltrosInteligentes';
import { useContasPagarOtimizado } from '@/hooks/useContasPagarOtimizado';
import { useCategories } from '@/hooks/useCategories';
import { useContatos } from '@/hooks/useContatos';
import { useLoadingState } from '@/hooks/useLoadingStates';
import { AccountPayable } from '@/types/accounts';
import { formatCurrency } from '@/utils/currency';
import { showMessage } from '@/utils/messages';
import { ConfirmacaoModal } from '@/components/ui/ConfirmacaoModal';
import ContaVisualizarModal from '@/components/contasPagar/ContaVisualizarModal';
import ContaEditarModal from '@/components/contasPagar/ContaEditarModal';
import { accountPayableToContaPagar } from '@/utils/typeAdapters';

export default function ContasPagar() {
  const navigate = useNavigate();
  const filtrosIniciais = {};

  const { 
    contas: accounts, 
    loading, 
    criarConta: createAccount, 
    baixarConta: markAsPaid, 
    excluirConta: deleteAccount,
    atualizarConta: updateAccount,
    filtros,
    setFiltros,
    filtroRapido,
    setFiltroRapido,
    limparFiltros
  } = useContasPagarOtimizado(filtrosIniciais);
  const { categories } = useCategories();
  const { contatos: contacts } = useContatos();
  const { isLoading, setLoading } = useLoadingState();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null);

  // Converter accounts para ContaListItem
  const contasListadas = useMemo((): ContaListItem[] => {
    return accounts.map(account => ({
      id: account.id,
      description: account.description,
      amount: account.amount,
      due_date: account.due_date,
      status: account.status,
      contact: account.contact,
      category: account.category,
      notes: account.notes,
      paid_at: account.paid_at,
      created_at: account.created_at
    }));
  }, [accounts]);

  // Estatísticas
  const statistics = useMemo(() => {
    const totalAmount = accounts.reduce((sum, account) => sum + account.amount, 0);
    const pendingAmount = accounts
      .filter(account => account.status === 'pending')
      .reduce((sum, account) => sum + account.amount, 0);
    const paidAmount = accounts
      .filter(account => account.status === 'paid')
      .reduce((sum, account) => sum + account.amount, 0);
    const overdueAmount = accounts
      .filter(account => account.status === 'overdue')
      .reduce((sum, account) => sum + account.amount, 0);

    return {
      total: accounts.length,
      totalAmount,
      pendingAmount,
      paidAmount,
      overdueAmount,
      pending: accounts.filter(a => a.status === 'pending').length,
      paid: accounts.filter(a => a.status === 'paid').length,
      overdue: accounts.filter(a => a.status === 'overdue').length
    };
  }, [accounts]);

  const handleNovaContaClick = () => {
    navigate('/nova-conta');
  };

  const handleViewAccount = (conta: ContaListItem) => {
    setSelectedAccount(accounts.find(acc => acc.id === conta.id) || null);
    setViewModalOpen(true);
  };

  const handleEditAccount = (conta: ContaListItem) => {
    setSelectedAccount(accounts.find(acc => acc.id === conta.id) || null);
    setEditModalOpen(true);
  };

  const handlePayAccount = (conta: ContaListItem) => {
    setSelectedAccount(accounts.find(acc => acc.id === conta.id) || null);
    setPaymentModalOpen(true);
  };

  const handleDeleteAccount = (conta: ContaListItem) => {
    setSelectedAccount(accounts.find(acc => acc.id === conta.id) || null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAccount) return;
    try {
      await deleteAccount(selectedAccount.id);
      setDeleteModalOpen(false);
      setSelectedAccount(null);
      showMessage.deleteSuccess('Conta excluída com sucesso!');
    } catch (error) {
      showMessage.deleteError('Erro ao excluir conta');
    }
  };

  const handlePaymentConfirm = async (paymentData: any) => {
    if (!selectedAccount) return;
    setLoading('saving', true);
    try {
      await markAsPaid(selectedAccount.id, paymentData);
      setPaymentModalOpen(false);
      setSelectedAccount(null);
      showMessage.saveSuccess('Pagamento confirmado com sucesso!');
    } catch (error) {
      showMessage.saveError('Erro ao confirmar pagamento');
    } finally {
      setLoading('saving', false);
    }
  };

  const breadcrumb = [
    { label: 'Início', href: '/' },
    { label: 'Financeiro', href: '#' },
    { label: 'Contas a Pagar', href: '/contas-pagar' }
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <PageHeader
        title="Contas a Pagar"
        subtitle="Gerencie suas despesas e obrigações financeiras"
        breadcrumb={breadcrumb}
        actions={
          <Button
            onClick={handleNovaContaClick}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        }
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-base">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Contas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatCurrency(statistics.totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-base">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.pending}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatCurrency(statistics.pendingAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-base">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.overdue}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatCurrency(statistics.overdueAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="card-base">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.paid}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatCurrency(statistics.paidAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Inteligentes */}
      <FiltrosInteligentes
        filtros={filtros}
        setFiltros={setFiltros}
        filtroRapido={filtroRapido}
        setFiltroRapido={setFiltroRapido}
        fornecedores={contacts.map(c => ({ id: c.id, name: c.name }))}
        categorias={categories.map(c => ({ id: c.id, name: c.name, color: c.color }))}
        estatisticas={statistics}
        onLimparFiltros={limparFiltros}
      />

      {/* Lista de Contas */}
      <ContasPagarList
        contas={contasListadas}
        loading={loading}
        onView={handleViewAccount}
        onEdit={handleEditAccount}
        onPay={handlePayAccount}
        onDelete={handleDeleteAccount}
      />

      {/* Modals */}
      <PaymentModalAdvanced
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedAccount(null);
        }}
        onConfirm={handlePaymentConfirm}
        conta={selectedAccount ? {
          id: selectedAccount.id,
          description: selectedAccount.description,
          amount: selectedAccount.amount,
          due_date: selectedAccount.due_date
        } : null}
        loading={isLoading('saving')}
      />

      {/* Modal de Visualização */}
      <ContaVisualizarModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAccount(null);
        }}
        conta={selectedAccount ? accountPayableToContaPagar(selectedAccount) as any : null}
        onEditar={(conta) => {
          setViewModalOpen(false);
          setEditModalOpen(true);
        }}
        onBaixar={(conta) => {
          setViewModalOpen(false);
          setPaymentModalOpen(true);
        }}
        onDuplicar={(conta) => {
          // TODO: Implementar duplicação
          console.log('Duplicar conta:', conta);
        }}
        onExcluir={(conta) => {
          setViewModalOpen(false);
          setDeleteModalOpen(true);
        }}
      />

      {/* Modal de Edição */}
      <ContaEditarModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAccount(null);
        }}
        conta={selectedAccount ? accountPayableToContaPagar(selectedAccount) as any : null}
        onSalvar={async (dadosEdicao) => {
          if (!selectedAccount) return;
          try {
            await updateAccount(selectedAccount.id, {
              description: dadosEdicao.descricao,
              amount: dadosEdicao.valor_final,
              due_date: dadosEdicao.data_vencimento,
              notes: dadosEdicao.observacoes
            });
            setEditModalOpen(false);
            setSelectedAccount(null);
            showMessage.saveSuccess('Conta atualizada com sucesso!');
          } catch (error) {
            showMessage.saveError('Erro ao atualizar conta');
          }
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmacaoModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAccount(null);
        }}
        onConfirm={handleConfirmDelete}
        titulo="Confirmar Exclusão"
        mensagem={`Tem certeza que deseja excluir a conta "${selectedAccount?.description}"? Esta ação não pode ser desfeita.`}
        tipo="danger"
        textoConfirmar="Excluir Conta"
        textoCancelar="Cancelar"
      />
    </div>
  );
}