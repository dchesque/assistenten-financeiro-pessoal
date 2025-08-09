import { useState, useMemo } from 'react';
import { Plus, Filter, TrendingUp, TrendingDown, ArrowRightLeft, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccountsAll } from '@/hooks/useBankAccountsAll';
import { Transaction, TransactionFilters, TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '@/types/transaction';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Transacoes = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: 'all',
    account_id: 'all'
  });

  const { 
    transactions, 
    loading, 
    createTransaction, 
    updateTransaction, 
    deleteTransaction,
    loadTransactions 
  } = useTransactions();
  const { accounts: bankAccounts } = useBankAccountsAll();

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchSearch = !filters.search || 
        transaction.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchType = filters.type === 'all' || transaction.type === filters.type;
      
      const matchAccount = filters.account_id === 'all' || 
        transaction.from_account_id === filters.account_id ||
        transaction.to_account_id === filters.account_id;

      return matchSearch && matchType && matchAccount;
    });
  }, [transactions, filters]);

  // Estatísticas
  const statistics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const transfer = filteredTransactions
      .filter(t => t.type === 'transfer')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      total: filteredTransactions.length,
      income,
      expense,
      transfer,
      balance: income - expense
    };
  }, [filteredTransactions]);

  const handleOpenModal = (mode: 'create' | 'edit', transaction?: Transaction) => {
    setModalMode(mode);
    setSelectedTransaction(transaction || null);
    setModalOpen(true);
  };

  const handleSaveTransaction = async (data: any) => {
    if (modalMode === 'create') {
      await createTransaction(data);
    } else if (selectedTransaction) {
      await updateTransaction(selectedTransaction.id, data);
    }
    setModalOpen(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction(id);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <TrendingUp className="w-4 h-4" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getAccountDisplay = (transaction: Transaction) => {
    if (transaction.type === 'income' && transaction.to_account) {
      return `Para: ${transaction.to_account.bank.name}`;
    }
    if (transaction.type === 'expense' && transaction.from_account) {
      return `De: ${transaction.from_account.bank.name}`;
    }
    if (transaction.type === 'transfer' && transaction.from_account && transaction.to_account) {
      return `${transaction.from_account.bank.name} → ${transaction.to_account.bank.name}`;
    }
    return '-';
  };

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as movimentações financeiras</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </Button>
          <Button
            onClick={() => handleOpenModal('create')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Transação</span>
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {statistics.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center">
              <TrendingDown className="w-4 h-4 mr-1" />
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {statistics.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center">
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Transferências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {statistics.transfer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statistics.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {statistics.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar transações..."
                value={filters.search || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 bg-white/80 backdrop-blur-sm border border-gray-300/50"
              />
            </div>

            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as any }))}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Entrada</SelectItem>
                <SelectItem value="expense">Saída</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.account_id || 'all'}
              onValueChange={(value) => setFilters(prev => ({ ...prev, account_id: value }))}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50">
                <SelectValue placeholder="Conta bancária" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {bankAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {(account as any).bank?.name || 'Banco'} - {account.agency}/{account.account_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => loadTransactions(filters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Aplicar Filtros</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton lines={5} height="h-16" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="Nenhuma transação encontrada"
              description="Comece criando sua primeira transação financeira"
              actionLabel="Nova Transação"
              onAction={() => handleOpenModal('create')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Contas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${TRANSACTION_TYPE_COLORS[transaction.type]} flex items-center space-x-1`}
                      >
                        {getTransactionIcon(transaction.type)}
                        <span>{TRANSACTION_TYPE_LABELS[transaction.type]}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.description || 'Sem descrição'}</div>
                        {transaction.notes && (
                          <div className="text-sm text-gray-500">{transaction.notes}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 
                        transaction.type === 'expense' ? 'text-red-600' : 
                        'text-blue-600'
                      }`}>
                        {transaction.type === 'expense' ? '-' : ''}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getAccountDisplay(transaction)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal('edit', transaction)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
        mode={modalMode}
      />
    </div>
  );
};

export default Transacoes;