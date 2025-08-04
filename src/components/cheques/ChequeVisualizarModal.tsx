import { Cheque } from '@/types/cheque';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  X,
  CreditCard, 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye
} from 'lucide-react';
import { formatarMoeda } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { useFornecedoresSupabase } from '@/hooks/useFornecedoresSupabase';

interface ChequeVisualizarModalProps {
  cheque: Cheque | null;
  aberto: boolean;
  onFechar: () => void;
}

export function ChequeVisualizarModal({ cheque, aberto, onFechar }: ChequeVisualizarModalProps) {
  const { bancos } = useBancosSupabase();
  const { fornecedores } = useFornecedoresSupabase();
  
  if (!cheque) return null;

  const banco = bancos.find(b => b.id === cheque.banco_id);
  const fornecedor = cheque?.fornecedor_id 
    ? fornecedores.find(f => f.id === cheque.fornecedor_id)
    : null;

  const getStatusIcon = () => {
    switch (cheque.status) {
      case 'pendente': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'compensado': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'devolvido': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'cancelado': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (cheque.status) {
      case 'pendente': return 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50';
      case 'compensado': return 'bg-blue-100/80 text-blue-700 border-blue-200/50';
      case 'devolvido': return 'bg-red-100/80 text-red-700 border-red-200/50';
      case 'cancelado': return 'bg-red-100/80 text-red-700 border-red-200/50';
      default: return 'bg-gray-100/80 text-gray-700 border-gray-200/50';
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
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="flex items-center justify-between text-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-900">Visualizar Cheque</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onFechar}
              className="rounded-xl hover:bg-gray-100/80"
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          
          {/* Cabeçalho do Cheque */}
          <Card className="bg-blue-50/50 border-l-4 border-blue-500 rounded-r-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">#{cheque.numero_cheque}</h3>
                    <p className="text-gray-600 flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      {banco?.nome || 'Banco não encontrado'}
                    </p>
                  </div>
                </div>
                <Badge className={`${getStatusColor()} border font-medium px-4 py-2 rounded-full flex items-center space-x-2`}>
                  {getStatusIcon()}
                  <span className="text-sm">{getStatusLabel()}</span>
                </Badge>
              </div>
              
              {/* Valor Principal */}
              <div className="bg-white/80 rounded-xl p-4 border border-blue-200/30">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-6 h-6 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Valor do Cheque</span>
                  </div>
                  <span className="text-4xl font-bold text-gray-900">
                    {formatarMoeda(cheque.valor)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Bancários */}
          <Card className="bg-green-50/50 border-l-4 border-green-500 rounded-r-xl">
            <CardContent className="p-6">
              <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Building2 className="w-5 h-5 text-green-600 mr-2" />
                Dados Bancários
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Banco:</span>
                  <p className="text-gray-900 font-medium">{banco?.nome || 'Não identificado'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Agência:</span>
                  <p className="text-gray-900 font-medium">{banco?.agencia || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Conta:</span>
                  <p className="text-gray-900 font-medium">{banco?.conta || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Número do Cheque:</span>
                  <p className="text-gray-900 font-medium font-mono">#{cheque.numero_cheque}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Beneficiário */}
          <Card className="bg-purple-50/50 border-l-4 border-purple-500 rounded-r-xl">
            <CardContent className="p-6">
              <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <User className="w-5 h-5 text-purple-600 mr-2" />
                Beneficiário
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Nome:</span>
                  <p className="text-gray-900 font-medium">
                    {fornecedor?.nome || cheque.beneficiario_nome || 'Não especificado'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Documento:</span>
                  <p className="text-gray-900 font-medium">
                    {fornecedor?.documento || cheque.beneficiario_documento || 'Não informado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card className="bg-orange-50/50 border-l-4 border-orange-500 rounded-r-xl">
            <CardContent className="p-6">
              <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                <Calendar className="w-5 h-5 text-orange-600 mr-2" />
                Datas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Data de Emissão:</span>
                  <p className="text-gray-900 font-medium">
                    {format(new Date(cheque.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                {cheque.data_vencimento && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Data de Vencimento:</span>
                    <p className="text-gray-900 font-medium">
                      {format(new Date(cheque.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {cheque.observacoes && (
            <Card className="bg-gray-50/50 border-l-4 border-gray-400 rounded-r-xl">
              <CardContent className="p-6">
                <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                  <FileText className="w-5 h-5 text-gray-600 mr-2" />
                  Observações
                </h4>
                <p className="text-gray-700 leading-relaxed bg-white/80 p-4 rounded-xl border border-gray-200/50">
                  {cheque.observacoes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}