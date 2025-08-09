import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dataService } from '@/services/DataServiceFactory';
import { useAuth } from '@/hooks/useAuth';
import { CalendarIcon, Download, FileText, Filter, Printer } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BankAccount {
  id: string;
  account_number: string;
  agency: string;
  bank: {
    name: string;
  };
}

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  from_account_id?: string;
  to_account_id?: string;
  accounts_payable?: { description: string };
  accounts_receivable?: { description: string };
}

interface ExtratoData {
  transacoes: Transaction[];
  saldoInicial: number;
  saldoFinal: number;
  totalEntradas: number;
  totalSaidas: number;
}

export function BankStatement() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    inicio: startOfMonth(new Date()),
    fim: endOfMonth(new Date())
  });
  const [extratoData, setExtratoData] = useState<ExtratoData | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      carregarContas();
    }
  }, [user]);

  const carregarContas = async () => {
    try {
      const bancos = await dataService.bancos.getAll();
      const allAccounts: BankAccount[] = [];
      
      for (const banco of bancos) {
        // Mock bank accounts - na implementação real seria dataService.bankAccounts.getByBankId(banco.id)
        const contas = [{
          id: `${banco.id}-1`,
          account_number: '12345-6',
          agency: '1234',
          bank: { name: banco.nome }
        }];
        allAccounts.push(...contas);
      }
      
      setAccounts(allAccounts);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const gerarExtrato = async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      // Mock extrato - na implementação real seria dataService.transactions.getExtrato
      const extrato = {
        transacoes: [],
        saldoInicial: 1000,
        saldoFinal: 1500,
        totalEntradas: 800,
        totalSaidas: 300
      };
      setExtratoData(extrato);
    } catch (error) {
      console.error('Erro ao gerar extrato:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (dataStr: string) => {
    return format(new Date(dataStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.accounts_payable) {
      return `Pagamento: ${transaction.accounts_payable.description}`;
    }
    if (transaction.accounts_receivable) {
      return `Recebimento: ${transaction.accounts_receivable.description}`;
    }
    return transaction.description || 'Transação manual';
  };

  const getTransactionValue = (transaction: Transaction) => {
    const isCredit = transaction.to_account_id === selectedAccount;
    return isCredit ? transaction.amount : -transaction.amount;
  };

  const exportarPDF = () => {
    window.print();
  };

  const periodosPredefinidos = [
    { label: 'Últimos 7 dias', inicio: subDays(new Date(), 7), fim: new Date() },
    { label: 'Últimos 30 dias', inicio: subDays(new Date(), 30), fim: new Date() },
    { label: 'Este mês', inicio: startOfMonth(new Date()), fim: endOfMonth(new Date()) },
    { label: 'Mês passado', inicio: startOfMonth(subDays(new Date(), 30)), fim: endOfMonth(subDays(new Date(), 30)) }
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="card-base">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Extrato Bancário</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Seleção de Conta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Conta Bancária</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank.name} - {account.agency}/{account.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período Predefinido */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select 
                onValueChange={(value) => {
                  const periodo = periodosPredefinidos[parseInt(value)];
                  if (periodo) {
                    setDateRange({ inicio: periodo.inicio, fim: periodo.fim });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Período predefinido" />
                </SelectTrigger>
                <SelectContent>
                  {periodosPredefinidos.map((periodo, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {periodo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.inicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.inicio ? formatarData(dateRange.inicio.toISOString()) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.inicio}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, inicio: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.fim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.fim ? formatarData(dateRange.fim.toISOString()) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.fim}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, fim: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button 
              onClick={gerarExtrato}
              disabled={!selectedAccount || loading}
              className="btn-primary"
            >
              <Filter className="w-4 h-4 mr-2" />
              {loading ? 'Gerando...' : 'Gerar Extrato'}
            </Button>

            {extratoData && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={exportarPDF}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados do Extrato */}
      {extratoData && (
        <div className="space-y-6 print:space-y-4" id="extrato-content">
          {/* Resumo */}
          <Card className="card-base print:shadow-none">
            <CardHeader>
              <CardTitle>Resumo do Período</CardTitle>
              <p className="text-sm text-gray-600">
                {formatarData(dateRange.inicio.toISOString())} a {formatarData(dateRange.fim.toISOString())}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50/80 rounded-lg">
                  <p className="text-sm text-gray-600">Saldo Inicial</p>
                  <p className="text-xl font-semibold text-blue-700">
                    {formatarMoeda(extratoData.saldoInicial)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50/80 rounded-lg">
                  <p className="text-sm text-gray-600">Total Entradas</p>
                  <p className="text-xl font-semibold text-green-700">
                    {formatarMoeda(extratoData.totalEntradas)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50/80 rounded-lg">
                  <p className="text-sm text-gray-600">Total Saídas</p>
                  <p className="text-xl font-semibold text-red-700">
                    {formatarMoeda(extratoData.totalSaidas)}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50/80 rounded-lg">
                  <p className="text-sm text-gray-600">Saldo Final</p>
                  <p className="text-xl font-semibold text-purple-700">
                    {formatarMoeda(extratoData.saldoFinal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Transações */}
          <Card className="card-base print:shadow-none">
            <CardHeader>
              <CardTitle>Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {extratoData.transacoes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma movimentação encontrada no período selecionado
                </p>
              ) : (
                <div className="space-y-2">
                  {extratoData.transacoes.map((transaction, index) => {
                    const valor = getTransactionValue(transaction);
                    const isCredit = valor > 0;
                    
                    return (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50/50 print:hover:bg-transparent"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              isCredit ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {getTransactionDescription(transaction)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatarData(transaction.date)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            isCredit ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isCredit ? '+' : ''}{formatarMoeda(valor)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.type === 'transfer' ? 'Transferência' : 
                             transaction.type === 'income' ? 'Receita' : 'Despesa'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #extrato-content, #extrato-content * {
            visibility: visible;
          }
          #extrato-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}