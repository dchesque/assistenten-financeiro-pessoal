import { Building, FileText, Phone, Mail, MapPin, Eye, Edit, UserCheck, UserX } from 'lucide-react';
import { Fornecedor } from '@/types/fornecedor';
import { formatarMoeda } from '@/utils/formatters';
import { Button } from '@/components/ui/button';

interface CredorCardProps {
  credor: Fornecedor;
  onView: (credor: Fornecedor) => void;
  onEdit: (credor: Fornecedor) => void;
  onToggleStatus: (id: number) => void;
}

export function CredorCard({ credor, onView, onEdit, onToggleStatus }: CredorCardProps) {
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
              {credor.nome}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {credor.tipo.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          {/* Badge de tipo */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            credor.tipo_fornecedor === 'receita' 
              ? 'bg-green-100/80 text-green-700' 
              : 'bg-blue-100/80 text-blue-700'
          }`}>
            {credor.tipo_fornecedor === 'receita' ? '💰 Renda' : '💸 Gasto'}
          </span>
          
          {/* Status badge */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            credor.ativo 
              ? 'bg-green-100/80 text-green-700' 
              : 'bg-red-100/80 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              credor.ativo ? 'bg-green-600' : 'bg-red-600'
            }`}></div>
            {credor.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Informações */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-3 text-sm">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 font-mono">{credor.documento}</span>
        </div>
        
        {credor.telefone && (
          <div className="flex items-center space-x-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700">{credor.telefone}</span>
          </div>
        )}
        
        {credor.email && (
          <div className="flex items-center space-x-3 text-sm">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 truncate">{credor.email}</span>
          </div>
        )}
        
        {credor.cidade && credor.estado && (
          <div className="flex items-center space-x-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700">{credor.cidade}, {credor.estado}</span>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{credor.totalCompras}</p>
            <p className="text-xs text-gray-600 font-medium">Total Transações</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{formatarMoeda(credor.valorTotal)}</p>
            <p className="text-xs text-gray-600 font-medium">Valor Total</p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onView(credor)}
          className="flex-1 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(credor)}
          className="flex-1 bg-blue-100/80 hover:bg-blue-200/80 text-blue-700"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onToggleStatus(credor.id)}
          className={`flex-1 ${
            credor.ativo 
              ? 'bg-red-100/80 hover:bg-red-200/80 text-red-700'
              : 'bg-green-100/80 hover:bg-green-200/80 text-green-700'
          }`}
        >
          {credor.ativo ? (
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