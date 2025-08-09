import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Calendar, DollarSign, FileText, Eye, Edit, Trash2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { AccountPayableModal } from '@/components/accounts/AccountPayableModal';
import { PaymentModal } from '@/components/accounts/PaymentModal';
import { useContasPagarOtimizado } from '@/hooks/useContasPagarOtimizado';
import { useCategories } from '@/hooks/useCategories';
import { useContatos } from '@/hooks/useContatos';
import { useLoadingState } from '@/hooks/useLoadingStates';
import { AccountPayable, PaymentData } from '@/types/accounts';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_COLORS = {
  pending: 'bg-blue-100/80 text-blue-700',
  paid: 'bg-green-100/80 text-green-700',
  overdue: 'bg-red-100/80 text-red-700',
  cancelled: 'bg-gray-100/80 text-gray-700'
};

const STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  cancelled: 'Cancelado'
};

export default function ContasPagar() {
  const { contas: accounts, loading, criarConta: createAccount, baixarConta: markAsPaid, excluirConta: deleteAccount } = useContasPagarOtimizado();
  const { categories } = useCategories();
  const { contatos: contacts } = useContatos();
  const { isLoading, setLoading } = useLoadingState();

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrar contas
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = !searchTerm || 
        account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [accounts, searchTerm, statusFilter]);

  // Estatísticas
  const statistics = useMemo(() => {
    const totalAmount = filteredAccounts.reduce((sum, account) => sum + account.amount, 0);
    const pendingAmount = filteredAccounts
      .filter(account => account.status === 'pending')
      .reduce((sum, account) => sum + account.amount, 0);
    const paidAmount = filteredAccounts
      .filter(account => account.status === 'paid')
      .reduce((sum, account) => sum + account.amount, 0);
    const overdueAmount = filteredAccounts
      .filter(account => account.status === 'overdue')
      .reduce((sum, account) => sum + account.amount, 0);

    return {
      total: filteredAccounts.length,
      totalAmount,
      pendingAmount,
      paidAmount,
      overdueAmount,
      pending: filteredAccounts.filter(a => a.status === 'pending').length,
      paid: filteredAccounts.filter(a => a.status === 'paid').length,
      overdue: filteredAccounts.filter(a => a.status === 'overdue').length
    };
  }, [filteredAccounts]);

  const handleCreateAccount = async (accountData: any) => {
    setLoading('saving', true);
    try {
      await createAccount(accountData);
      setAccountModalOpen(false);
    } finally {
      setLoading('saving', false);
    }
  };

  const handleMarkAsPaid = (account: AccountPayable) => {
    setSelectedAccount(account);
    setPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async (paymentData: PaymentData) => {
    if (!selectedAccount) return;
    setLoading('saving', true);
    try {
      await markAsPaid(selectedAccount.id, paymentData);
      setPaymentModalOpen(false);
      setSelectedAccount(null);
    } finally {
      setLoading('saving', false);
    }
  };

  const handleDeleteAccount = async (account: AccountPayable) => {
    if (confirm(`Tem certeza que deseja excluir a conta "${account.description}"?`)) {
      await deleteAccount(account.id);
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={STATUS_COLORS[status as keyof typeof STATUS_COLORS]}>
        {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date().toDateString() !== new Date(dueDate).toDateString();
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
            onClick={() => {
              setSelectedAccount(null);
              setAccountModalOpen(true);
            }}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        }
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
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

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
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

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
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

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
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

      {/* Filtros */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar contas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border border-gray-300/50"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filtros Avançados</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Contas */}
      {loading ? (
        <LoadingSkeleton type="table" lines={5} />
      ) : filteredAccounts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma conta encontrada"
          description={searchTerm || statusFilter !== 'all' 
            ? "Nenhuma conta corresponde aos filtros aplicados." 
            : "Comece criando sua primeira conta a pagar."
          }
          actionLabel={!searchTerm && statusFilter === 'all' ? "Nova Despesa" : undefined}
          onAction={!searchTerm && statusFilter === 'all' ? () => setAccountModalOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="font-semibold text-gray-900">{account.description}</h3>
                      {getStatusBadge(account.status)}
                      {isOverdue(account.due_date) && account.status === 'pending' && (
                        <Badge className="bg-red-100/80 text-red-700">Vencida</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span className="font-medium">{formatCurrency(account.amount)}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Venc: {format(new Date(account.due_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                      
                      {account.supplier?.name && (
                        <div className="flex items-center text-gray-600">
                          <span>Fornecedor: {account.supplier.name}</span>
                        </div>
                      )}
                    </div>

                    {account.notes && (
                      <p className="text-sm text-gray-500 mt-2">{account.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {account.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(account)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAccount(account);
                        setAccountModalOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAccount(account)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AccountPayableModal
        isOpen={accountModalOpen}
        onClose={() => {
          setAccountModalOpen(false);
          setSelectedAccount(null);
        }}
        onSave={handleCreateAccount}
        account={selectedAccount}
        loading={isLoading('saving')}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedAccount(null);
        }}
        onConfirm={handlePaymentConfirm}
        accountDescription={selectedAccount?.description || ''}
        loading={isLoading('saving')}
      />
    </div>
  );
}