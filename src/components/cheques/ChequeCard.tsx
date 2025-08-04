import { Cheque } from '@/types/cheque';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  User, 
  Building2, 
  Calendar, 
  DollarSign, 
  Eye, 
  Edit,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { formatarMoeda } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { useFornecedoresSupabase } from '@/hooks/useFornecedoresSupabase';

interface ChequeCardProps {
  cheque: Cheque;
  onEdit: (cheque: Cheque) => void;
  onView: (cheque: Cheque) => void;
}

export function ChequeCard({ cheque, onEdit, onView }: ChequeCardProps) {
  const { bancos } = useBancosSupabase();
  const { fornecedores } = useFornecedoresSupabase();
  
  const banco = bancos.find(b => b.id === cheque.banco_id);
  const fornecedor = cheque.fornecedor_id 
    ? fornecedores.find(f => f.id === cheque.fornecedor_id)
    : null;

  const getStatusIcon = () => {
    switch (cheque.status) {
      case 'pendente': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'compensado': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'devolvido': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'cancelado': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (cheque.status) {
      case 'pendente': return 'bg-yellow-100/80 text-yellow-700';
      case 'compensado': return 'bg-blue-100/80 text-blue-700';
      case 'devolvido': return 'bg-red-100/80 text-red-700';
      case 'cancelado': return 'bg-red-100/80 text-red-700';
      default: return 'bg-gray-100/80 text-gray-700';
    }
  };

  const getStatusLabel = () => {
    switch (cheque.status) {
      case 'pendente': return 'Pendente';
      case 'compensado': return 'Compensado';
      case 'devolvido': return 'Devolvido';
      case 'cancelado': return 'Cancelado';
      default: return 'Pendente';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 group">
      <CardContent className="p-6">
        
        {/* Header do Cheque */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cheque #{cheque.numero_cheque}
              </h3>
              <p className="text-sm text-gray-500 flex items-center">
                <Building2 className="w-4 h-4 mr-1" />
                {banco?.nome || 'Banco não encontrado'}
              </p>
            </div>
          </div>
          
          <Badge className={`${getStatusColor()} border-none font-medium px-3 py-1 rounded-full flex items-center space-x-1`}>
            {getStatusIcon()}
            <span>{getStatusLabel()}</span>
          </Badge>
        </div>

        {/* Valor Principal */}
        <div className="bg-gray-50/50 rounded-xl p-4 mb-4 border border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Valor</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {formatarMoeda(cheque.valor)}
            </span>
          </div>
        </div>

        {/* Informações do Beneficiário */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Beneficiário:
            </span>
            <span className="text-sm font-medium text-gray-900">
              {fornecedor?.nome || cheque.beneficiario_nome || 'Não especificado'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Emissão:
            </span>
            <span className="text-sm font-medium text-gray-900">
              {format(new Date(cheque.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          
          {cheque.data_vencimento && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Vencimento:
              </span>
              <span className="text-sm font-medium text-gray-900">
                {format(new Date(cheque.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        {/* Observações (se houver) */}
        {cheque.observacoes && (
          <div className="bg-blue-50/50 border border-blue-200/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              <strong>Obs:</strong> {cheque.observacoes.length > 60 
                ? `${cheque.observacoes.substring(0, 60)}...` 
                : cheque.observacoes}
            </p>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex space-x-3">
          <Button
            onClick={() => onView(cheque)}
            variant="outline"
            size="sm"
            className="flex-1 bg-white/80 backdrop-blur-sm border border-gray-300/50 text-gray-700 hover:bg-white/90 rounded-xl transition-all duration-200"
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          
          <Button
            onClick={() => onEdit(cheque)}
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}