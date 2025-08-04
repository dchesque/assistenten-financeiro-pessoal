
import { Badge } from "@/components/ui/badge";
import { formatarData } from "@/utils/formatters";
import { CheckCircle, AlertCircle, QrCode, CreditCard, Banknote, FileText, ArrowRightLeft, Lightbulb } from "lucide-react";
import { FORMAS_PAGAMENTO } from "@/types/venda";

interface ResumoVendaProps {
  formData: any;
  calcularValorLiquido: () => number;
  isFormularioValido: () => boolean;
}

export function ResumoVenda({ formData, calcularValorLiquido, isFormularioValido }: ResumoVendaProps) {
  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg sticky top-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          📋 Resumo da Venda
        </h3>
        <p className="text-sm text-gray-600">Preview em tempo real</p>
      </div>
      
      {/* Dados principais */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Data/Hora:</span>
          <span className="font-medium text-right">
            {formData.dataVenda ? formatarData(formData.dataVenda) : '--/--/----'} às {formData.horaVenda || '--:--'}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Cliente:</span>
          <span className="font-medium text-right">
            {formData.cliente?.nome || "CONSUMIDOR"}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Categoria:</span>
          <span className="text-xs text-right">
            {formData.categoria ? `${formData.categoria.codigo} - ${formData.categoria.nome}` : 'Não selecionada'}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tipo:</span>
          <Badge 
            variant="outline" 
            className={`text-xs ${formData.tipoVenda === 'venda' 
              ? 'bg-green-100/80 text-green-700 border-green-200' 
              : 'bg-red-100/80 text-red-700 border-red-200'
            }`}
          >
            {formData.tipoVenda === 'venda' ? 'Venda' : 'Devolução'}
          </Badge>
        </div>
      </div>
      
      {/* Valores */}
      <div className="border-t pt-4 mt-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Valor Bruto:</span>
            <span className="font-medium">
              {formData.valorBruto || 'R$ 0,00'}
            </span>
          </div>
          
          {(formData.descontoValor || formData.descontoPercentual) && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Desconto ({formData.descontoPercentual || '0%'}):</span>
              <span>- {formData.descontoValor || 'R$ 0,00'}</span>
            </div>
          )}
          
          <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
            <span className="text-gray-900">Valor Líquido:</span>
            <span className="text-green-600">
              {formatarMoeda(calcularValorLiquido())}
            </span>
          </div>
          
          {formData.formaPagamento && (
            <div className="flex justify-between text-sm mt-3">
              <span className="text-gray-600">Pagamento:</span>
              <span className="font-medium text-right">
                {(() => {
                  const forma = FORMAS_PAGAMENTO.find(f => f.valor === formData.formaPagamento);
                  if (forma) {
                    return `${forma.nome}${formData.bancoId ? ' - Banco' : ''}`;
                  }
                  return formData.formaPagamento;
                })()}
                {formData.parcelamento > 1 && ` (${formData.parcelamento}x)`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status do formulário */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-center">
          {isFormularioValido() ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Pronto para salvar</span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Campos obrigatórios</span>
            </div>
          )}
        </div>
      </div>

      {/* Box de dicas */}
      <div className="bg-blue-50 rounded-xl p-4 mt-4">
        <h4 className="font-medium text-gray-900 flex items-center mb-2">
          <Lightbulb className="w-4 h-4 mr-2 text-blue-600" />
          Dicas
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Use "CONSUMIDOR" para vendas sem cliente específico</li>
          <li>• Devoluções devem ter valor positivo (sistema corrige automaticamente)</li>
          <li>• Selecione a categoria correta para o DRE</li>
          <li>• Documente sempre a forma de pagamento</li>
        </ul>
      </div>
    </div>
  );
}
