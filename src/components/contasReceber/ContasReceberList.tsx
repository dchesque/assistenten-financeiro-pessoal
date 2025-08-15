
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2, DollarSign, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AccountReceivable } from '@/types/accounts';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export interface ContaReceberListItem {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'received' | 'overdue' | 'canceled';
  contact?: {
    id: string;
    name: string;
    type: string;
  };
  customer_name?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  notes?: string;
  received_at?: string;
  created_at: string;
}

interface ContasReceberListProps {
  contas: ContaReceberListItem[];
  loading: boolean;
  onEdit: (conta: ContaReceberListItem) => void;
  onDelete: (conta: ContaReceberListItem) => void;
  onView: (conta: ContaReceberListItem) => void;
  onReceive: (conta: ContaReceberListItem) => void;
}

export const ContasReceberList: React.FC<ContasReceberListProps> = ({
  contas,
  loading,
  onEdit,
  onDelete,
  onView,
  onReceive
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100/80 text-yellow-700' },
      received: { label: 'Recebido', className: 'bg-green-100/80 text-green-700' },
      overdue: { label: 'Vencido', className: 'bg-red-100/80 text-red-700' },
      canceled: { label: 'Cancelado', className: 'bg-gray-100/80 text-gray-700' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge className={`${config.className} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const isOverdue = (conta: ContaReceberListItem) => {
    if (conta.status !== 'pending') return false;
    const today = new Date();
    const dueDate = new Date(conta.due_date);
    return dueDate < today;
  };

  const getStatusIcon = (conta: ContaReceberListItem) => {
    if (conta.status === 'received') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    
    if (isOverdue(conta)) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    
    if (conta.status === 'pending') {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    
    return <DollarSign className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <Card className="card-base">
        <CardHeader>
          <CardTitle>Contas a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contas.length) {
    return (
      <Card className="card-base">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma conta encontrada
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            Não foram encontradas contas a receber com os filtros aplicados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-base">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-gray-900">
          Contas a Receber ({contas.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="font-semibold text-gray-700">Vencimento</TableHead>
                <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                <TableHead className="font-semibold text-gray-700">Cliente</TableHead>
                <TableHead className="font-semibold text-gray-700">Categoria</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Valor</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center w-48">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map((conta) => {
                const isVencida = isOverdue(conta);
                
                return (
                  <TableRow 
                    key={conta.id} 
                    className={`hover:bg-gray-50/80 transition-colors border-gray-100 ${
                      isVencida ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(conta)}
                        <span className={`text-sm ${isVencida ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                          {format(new Date(conta.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate">
                          {conta.description}
                        </p>
                        {conta.notes && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {conta.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <span className="text-sm text-gray-700">
                        {conta.customer_name || conta.contact?.name || '-'}
                      </span>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      {conta.category ? (
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: conta.category.color || '#6b7280' }}
                          />
                          <span className="text-sm text-gray-700 truncate">
                            {conta.category.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="py-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(conta.amount)}
                      </span>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      {getStatusBadge(isVencida ? 'overdue' : conta.status)}
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(conta)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(conta)}
                          className="h-8 w-8 p-0 hover:bg-green-100 text-green-600 hover:text-green-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(conta)}
                          className="h-8 w-8 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {(conta.status === 'pending' || isVencida) && (
                          <Button
                            size="sm"
                            onClick={() => onReceive(conta)}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-200 text-xs px-2 py-1 h-7"
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            RECEBER
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
