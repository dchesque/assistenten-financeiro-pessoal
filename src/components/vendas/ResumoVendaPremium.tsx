import React from 'react';
import { Edit2, Eye } from 'lucide-react';
import { formatarMoeda, formatarData } from '@/lib/formatacaoBrasileira';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VendaFormData {
  id?: number;
  cliente: {
    nome: string;
    documento?: string;
    tipo?: 'fisica' | 'juridica';
  };
  valorTotal: number;
  desconto?: number;
  valorFinal: number;
  formaPagamento: string;
  parcelas?: number;
  dataVenda: string;
  dataVencimento?: string;
  status: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
  itens: Array<{
    produto: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
}

interface ResumoVendaPremiumProps {
  venda: VendaFormData;
  readonly?: boolean;
  onEdit?: () => void;
  onView?: () => void;
  className?: string;
}

export function ResumoVendaPremium({
  venda,
  readonly = false,
  onEdit,
  onView,
  className
}: ResumoVendaPremiumProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100/80 text-green-700 border-green-200';
      case 'pendente':
        return 'bg-blue-100/80 text-blue-700 border-blue-200';
      case 'cancelado':
        return 'bg-red-100/80 text-red-700 border-red-200';
      default:
        return 'bg-gray-100/80 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago':
        return 'Pago';
      case 'pendente':
        return 'Pendente';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Resumo da Venda
          </h3>
          {venda.id && (
            <p className="text-sm text-gray-600">
              Venda #{venda.id}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className={getStatusColor(venda.status)}>
            {getStatusLabel(venda.status)}
          </Badge>
          
          {!readonly && (
            <div className="flex space-x-2">
              {onView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onView}
                  className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Informações do Cliente */}
      <div className="bg-gray-50/50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Cliente</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Nome</p>
            <p className="text-sm font-medium text-gray-800">
              {venda.cliente.nome}
            </p>
          </div>
          {venda.cliente.documento && (
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {venda.cliente.tipo === 'juridica' ? 'CNPJ' : 'CPF'}
              </p>
              <p className="text-sm font-medium text-gray-800">
                {venda.cliente.documento}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Valores */}
      <div className="bg-blue-50/50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Valores</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valor Total:</span>
            <span className="text-sm font-medium text-gray-800">
              {formatarMoeda(venda.valorTotal)}
            </span>
          </div>
          
          {venda.desconto && venda.desconto > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Desconto:</span>
              <span className="text-sm font-medium text-red-600">
                - {formatarMoeda(venda.desconto)}
              </span>
            </div>
          )}
          
          <div className="border-t border-gray-200/50 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-800">Valor Final:</span>
              <span className="text-lg font-bold text-green-600">
                {formatarMoeda(venda.valorFinal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pagamento */}
      <div className="bg-green-50/50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Pagamento</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Forma de Pagamento</p>
            <p className="text-sm font-medium text-gray-800">
              {venda.formaPagamento}
            </p>
          </div>
          {venda.parcelas && venda.parcelas > 1 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Parcelas</p>
              <p className="text-sm font-medium text-gray-800">
                {venda.parcelas}x
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Datas */}
      <div className="bg-purple-50/50 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Datas</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Data da Venda</p>
            <p className="text-sm font-medium text-gray-800">
              {formatarData(venda.dataVenda)}
            </p>
          </div>
          {venda.dataVencimento && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Data de Vencimento</p>
              <p className="text-sm font-medium text-gray-800">
                {formatarData(venda.dataVencimento)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Itens da Venda */}
      {venda.itens && venda.itens.length > 0 && (
        <div className="bg-orange-50/50 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Itens da Venda ({venda.itens.length})
          </h4>
          <div className="space-y-3">
            {venda.itens.slice(0, 3).map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {item.produto}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantidade}x {formatarMoeda(item.valorUnitario)}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {formatarMoeda(item.valorTotal)}
                </span>
              </div>
            ))}
            
            {venda.itens.length > 3 && (
              <p className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200/50">
                +{venda.itens.length - 3} itens adicionais
              </p>
            )}
          </div>
        </div>
      )}

      {/* Observações */}
      {venda.observacoes && (
        <div className="bg-gray-50/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Observações</h4>
          <p className="text-sm text-gray-600">
            {venda.observacoes}
          </p>
        </div>
      )}
    </div>
  );
}