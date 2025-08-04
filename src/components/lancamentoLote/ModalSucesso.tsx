import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Eye, Plus, Calendar, DollarSign, Clock, CreditCard } from 'lucide-react';
import { formatarData } from '@/utils/formatters';
import { FormaPagamento } from '@/types/formaPagamento';
import { toast } from '@/hooks/use-toast';

interface LoteSummary {
  loteId: string;
  total_parcelas: number;
  valor_por_parcela: number;
  valor_total: number;
  primeira_data: string;
  ultima_data: string;
  formaPagamento: FormaPagamento;
  banco_nome?: string;
}

interface ModalSucessoProps {
  isOpen: boolean;
  onClose: () => void;
  resumoLote: LoteSummary;
  onCriarNovoLote: () => void;
}

export function ModalSucesso({
  isOpen,
  onClose,
  resumoLote,
  onCriarNovoLote
}: ModalSucessoProps) {
  const navigate = useNavigate();
  const [contador, setContador] = useState(8);
  const [isRedirecionando, setIsRedirecionando] = useState(false);

  // Timer de redirecionamento automático
  useEffect(() => {
    if (!isOpen) {
      setContador(8);
      setIsRedirecionando(false);
      return;
    }

    const timer = setInterval(() => {
      setContador(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleVerParcelas();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleVerParcelas = () => {
    setIsRedirecionando(true);
    toast({
      title: "Redirecionando...",
      description: "Carregando suas parcelas recém-criadas"
    });
    
    // Pequeno delay para mostrar o toast
    setTimeout(() => {
      navigate(`/contas-pagar?lote=${resumoLote.loteId}&highlight=true`);
      onClose();
    }, 500);
  };

  const handleCriarNovo = () => {
    onCriarNovoLote();
    onClose();
    toast({
      title: "Formulário limpo",
      description: "Pronto para criar um novo lote"
    });
  };

  const getFormaPagamentoIcon = () => {
    switch (resumoLote.formaPagamento.tipo) {
      case 'cheque':
        return '📋';
      case 'transferencia':
        return '🏦';
      case 'cartao':
        return '💳';
      default:
        return '💰';
    }
  };

  const getFormaPagamentoTexto = () => {
    switch (resumoLote.formaPagamento.tipo) {
      case 'cheque':
        return `Cheque - ${resumoLote.banco_nome || 'Banco selecionado'}`;
      case 'transferencia':
        return 'Transferência/TED';
      case 'cartao':
        return `Cartão ${resumoLote.formaPagamento.tipo_cartao === 'credito' ? 'de Crédito' : 'de Débito'}`;
      default:
        return 'Dinheiro/PIX';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎉 Lote Criado com Sucesso!"
      size="lg"
      className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
    >
      <ModalContent className="space-y-6">
        {/* Resumo principal */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" className="bg-green-50/80 text-green-700 border-green-200">
              Lote ID: {resumoLote.loteId.slice(0, 8)}...
            </Badge>
          </div>
        </div>

        {/* Cards de informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Parcelas Criadas</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {resumoLote.total_parcelas} parcelas
            </p>
          </div>

          <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Valor por Parcela</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              R$ {resumoLote.valor_por_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 text-purple-600 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Valor Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              R$ {resumoLote.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-orange-50/80 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 text-orange-600 mb-2">
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Forma de Pagamento</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
              <span>{getFormaPagamentoIcon()}</span>
              <span>{getFormaPagamentoTexto()}</span>
            </p>
          </div>
        </div>

        {/* Período das parcelas */}
        <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Período de Vencimentos</span>
          </div>
          <p className="text-sm text-gray-900">
            De <span className="font-semibold">{formatarData(resumoLote.primeira_data)}</span> até{' '}
            <span className="font-semibold">{formatarData(resumoLote.ultima_data)}</span>
          </p>
        </div>

        {/* Timer de redirecionamento */}
        <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Redirecionamento Automático</span>
          </div>
          {isRedirecionando ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-sm text-blue-600">Redirecionando...</span>
            </div>
          ) : (
            <p className="text-sm text-blue-600">
              Redirecionamento em <span className="font-bold">{contador}s</span>
            </p>
          )}
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full">
          <Button
            onClick={handleVerParcelas}
            disabled={isRedirecionando}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Eye className="h-4 w-4 mr-2" />
            📋 Ver Parcelas
          </Button>
          
          <Button
            onClick={handleCriarNovo}
            variant="outline"
            disabled={isRedirecionando}
            className="flex-1 bg-white/80 backdrop-blur-sm border-gray-300/50 text-gray-700 hover:bg-gray-50/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            ➕ Criar Novo Lote
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}