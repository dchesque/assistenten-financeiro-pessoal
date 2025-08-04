import { Building, FileText, Phone, Mail, MapPin, Eye, Edit, UserCheck, UserX } from 'lucide-react';
import { Fornecedor } from '@/types/fornecedor';
import { formatarMoeda } from '@/utils/formatters';
import { Button } from '@/components/ui/button';

interface FornecedorCardProps {
  fornecedor: Fornecedor;
  onView: (fornecedor: Fornecedor) => void;
  onEdit: (fornecedor: Fornecedor) => void;
  onToggleStatus: (id: number) => void;
}

export function FornecedorCard({ fornecedor, onView, onEdit, onToggleStatus }: FornecedorCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:bg-white/90 transition-all duration-300 animate-fade-in">
      {/* Header do card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1 truncate">
              {fornecedor.nome}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {fornecedor.tipo.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          {/* Badge de tipo */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            fornecedor.tipo_fornecedor === 'receita' 
              ? 'bg-green-100/80 text-green-700' 
              : 'bg-blue-100/80 text-blue-700'
          }`}>
            {fornecedor.tipo_fornecedor === 'receita' ? '💰 Receita' : '💸 Despesa'}
          </span>
          
          {/* Status badge */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            fornecedor.ativo 
              ? 'bg-green-100/80 text-green-700' 
              : 'bg-red-100/80 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              fornecedor.ativo ? 'bg-green-600' : 'bg-red-600'
            }`}></div>
            {fornecedor.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Informações */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-3 text-sm">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 font-mono">{fornecedor.documento}</span>
        </div>
        
        {fornecedor.telefone && (
          <div className="flex items-center space-x-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700">{fornecedor.telefone}</span>
          </div>
        )}
        
        {fornecedor.email && (
          <div className="flex items-center space-x-3 text-sm">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 truncate">{fornecedor.email}</span>
          </div>
        )}
        
        {fornecedor.cidade && fornecedor.estado && (
          <div className="flex items-center space-x-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700">{fornecedor.cidade}, {fornecedor.estado}</span>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{fornecedor.totalCompras}</p>
            <p className="text-xs text-gray-600 font-medium">Total Compras</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{formatarMoeda(fornecedor.valorTotal)}</p>
            <p className="text-xs text-gray-600 font-medium">Valor Total</p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onView(fornecedor)}
          className="flex-1 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(fornecedor)}
          className="flex-1 bg-blue-100/80 hover:bg-blue-200/80 text-blue-700"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onToggleStatus(fornecedor.id)}
          className={`flex-1 ${
            fornecedor.ativo 
              ? 'bg-red-100/80 hover:bg-red-200/80 text-red-700'
              : 'bg-green-100/80 hover:bg-green-200/80 text-green-700'
          }`}
        >
          {fornecedor.ativo ? (
            <>
              <UserX className="w-4 h-4 mr-2" />
              Inativar
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 mr-2" />
              Ativar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}