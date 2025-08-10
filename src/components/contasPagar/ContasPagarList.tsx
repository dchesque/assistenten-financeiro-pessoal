import { Edit, Trash2, Eye, CreditCard, FileText, Calendar, DollarSign, Building2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ContaListItem {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'canceled';
  contact?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  notes?: string;
  paid_at?: string;
  created_at: string;
}

interface ContasPagarListProps {
  contas: ContaListItem[];
  loading?: boolean;
  onEdit: (conta: ContaListItem) => void;
  onDelete: (conta: ContaListItem) => void;
  onView: (conta: ContaListItem) => void;
  onPay: (conta: ContaListItem) => void;
}

export function ContasPagarList({ contas, loading, onEdit, onDelete, onView, onPay }: ContasPagarListProps) {
  if (loading) {
    return (
      <Card className="card-base">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contas.length === 0) {
    return (
      <Card className="card-base">
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma conta encontrada
          </h3>
          <p className="text-gray-500 mb-6">
            Crie sua primeira conta a pagar para começar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pendente', className: 'bg-blue-100/80 text-blue-700 px-3 py-1.5' },
      paid: { label: 'Pago', className: 'bg-green-100/80 text-green-700 px-3 py-1.5' },
      overdue: { label: 'Vencido', className: 'bg-red-100/80 text-red-700 px-3 py-1.5' },
      cancelled: { label: 'Cancelado', className: 'bg-gray-100/80 text-gray-700 px-3 py-1.5' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  const getStatusIcon = (status: string, dueDate: string) => {
    if (status === 'paid') {
      return <CreditCard className="w-4 h-4 text-green-600" />;
    }
    if (isOverdue(dueDate, status)) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    if (status === 'pending') {
      return <Calendar className="w-4 h-4 text-blue-600" />;
    }
    return <FileText className="w-4 h-4 text-gray-600" />;
  };

  return (
    <Card className="card-base">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-gray-200/50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold text-gray-900">Descrição</TableHead>
                <TableHead className="font-semibold text-gray-900">Fornecedor</TableHead>
                <TableHead className="font-semibold text-gray-900">Categoria</TableHead>
                <TableHead className="font-semibold text-gray-900">Valor</TableHead>
                <TableHead className="font-semibold text-gray-900">Vencimento</TableHead>
                <TableHead className="font-semibold text-gray-900">Status</TableHead>
                <TableHead className="w-40 font-semibold text-gray-900">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map((conta) => (
                <TableRow 
                  key={conta.id}
                  className={`hover:bg-gray-50/50 transition-colors border-b border-gray-100/50 ${
                    isOverdue(conta.due_date, conta.status) ? 'bg-red-50/30' : ''
                  }`}
                >
                  <TableCell>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      conta.status === 'paid' 
                        ? 'bg-green-100 text-green-600'
                        : isOverdue(conta.due_date, conta.status)
                        ? 'bg-red-100 text-red-600'
                        : conta.status === 'pending'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getStatusIcon(conta.status, conta.due_date)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {conta.description}
                    </div>
                    {conta.notes && (
                      <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {conta.notes}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {conta.contact ? (
                        <>
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 text-sm">
                            {conta.contact.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {conta.category ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: conta.category.color || '#6B7280' }}
                        />
                        <span className="text-sm text-gray-700">
                          {conta.category.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sem categoria</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {formatCurrency(conta.amount)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm ${
                        isOverdue(conta.due_date, conta.status) 
                          ? 'text-red-700 font-medium' 
                          : 'text-gray-600'
                      }`}>
                        {format(new Date(conta.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    {isOverdue(conta.due_date, conta.status) && (
                      <div className="text-xs text-red-600 mt-1">
                        {Math.ceil((new Date().getTime() - new Date(conta.due_date).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(conta.status)}
                  </TableCell>
                  
                  <TableCell>
                     <div className="flex items-center gap-1">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => onView(conta)}
                         className="h-7 w-7 p-0 hover:bg-blue-50"
                         title="Visualizar"
                       >
                         <Eye className="w-3.5 h-3.5 text-blue-600" />
                       </Button>
                       
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => onEdit(conta)}
                         className="h-7 w-7 p-0 hover:bg-orange-50"
                         title="Editar"
                       >
                         <Edit className="w-3.5 h-3.5 text-orange-600" />
                       </Button>
                       
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => onDelete(conta)}
                         className="h-7 w-7 p-0 hover:bg-red-50"
                         title="Excluir"
                       >
                         <Trash2 className="w-3.5 h-3.5 text-red-600" />
                       </Button>

                       {conta.status === 'pending' && (
                         <Button
                           size="sm"
                           onClick={() => onPay(conta)}
                           className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 font-medium px-3 py-1 text-xs ml-1"
                           title="Pagar conta"
                         >
                           <CreditCard className="w-3 h-3 mr-1" />
                           PAGAR
                         </Button>
                       )}
                     </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}