import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Building2, FileText, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormaPagamento, TipoPagamento, TIPOS_PAGAMENTO_LABELS, TIPOS_PAGAMENTO_ICONS } from '@/types/formaPagamento';
import { Banco } from '@/types/banco';
import { Cheque } from '@/types/cheque';

interface FormaPagamentoSectionProps {
  value: FormaPagamento;
  onChange: (formaPagamento: FormaPagamento) => void;
  numeroParcelas?: number;
  className?: string;
  bancos?: Banco[];
  cheques?: Cheque[];
}

export function FormaPagamentoSection({ 
  value, 
  onChange, 
  numeroParcelas = 1,
  className = "",
  bancos = [],
  cheques = []
}: FormaPagamentoSectionProps) {
  const [proximoNumero, setProximoNumero] = useState<string>('');

  // Buscar próximo número disponível do banco selecionado
  const buscarProximoNumero = (bancoId: number) => {
    const chequesExistentes = cheques
      .filter(c => c.banco_id === bancoId)
      .map(c => parseInt(c.numero_cheque))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    let proximo = 1;
    for (const numero of chequesExistentes) {
      if (numero === proximo) {
        proximo++;
      } else {
        break;
      }
    }

    return proximo.toString().padStart(6, '0');
  };

  // Atualizar próximo número quando banco mudar
  useEffect(() => {
    if (value.tipo === 'cheque' && value.banco_id) {
      const proximo = buscarProximoNumero(value.banco_id);
      setProximoNumero(proximo);
    }
  }, [value.banco_id, value.tipo]);

  const handleTipoChange = (tipo: TipoPagamento) => {
    onChange({
      tipo,
      ...(tipo === 'cheque' && { banco_id: undefined, numero_cheque: '', numeros_cheques: [] }),
      ...(tipo === 'transferencia' && { banco_id: undefined }),
      ...(tipo === 'cartao' && { tipo_cartao: 'debito' })
    });
  };

  const handleBancoChange = (bancoId: string) => {
    const id = parseInt(bancoId);
    onChange({
      ...value,
      banco_id: id
    });
  };

  const handleNumeroChequeChange = (numero: string) => {
    onChange({
      ...value,
      numero_cheque: numero
    });
  };

  const handleNumerosChequeChange = (numeros: string) => {
    const numerosArray = numeros.split(',').map(n => n.trim()).filter(n => n.length > 0);
    onChange({
      ...value,
      numeros_cheques: numerosArray
    });
  };

  const gerarSequenciaAutomatica = () => {
    if (!value.banco_id || !proximoNumero) return;

    const inicial = parseInt(proximoNumero);
    const sequencia = Array.from({ length: numeroParcelas }, (_, i) => 
      (inicial + i).toString().padStart(6, '0')
    );

    onChange({
      ...value,
      numeros_cheques: sequencia
    });
  };

  const usarProximoDisponivel = () => {
    if (proximoNumero) {
      handleNumeroChequeChange(proximoNumero);
    }
  };

  const bancosAtivos = bancos.filter(b => b.ativo);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header da Seção */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
          <CreditCard className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Forma de Pagamento</h2>
      </div>

      {/* Radio Buttons para Tipo de Pagamento */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">
          Tipo de Pagamento <span className="text-red-500">*</span>
        </Label>
        
        <RadioGroup
          value={value.tipo}
          onValueChange={handleTipoChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {Object.entries(TIPOS_PAGAMENTO_LABELS).map(([tipo, label]) => (
            <div key={tipo} className="flex items-center space-x-3">
              <RadioGroupItem 
                value={tipo} 
                id={tipo}
                className="border-2 border-gray-300 text-blue-600"
              />
              <Label 
                htmlFor={tipo} 
                className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <span className="text-lg">{TIPOS_PAGAMENTO_ICONS[tipo as TipoPagamento]}</span>
                <span>{label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Campos Condicionais */}
      <div className="space-y-6 animate-fade-in">
        {/* Transferência/TED - Banco */}
        {value.tipo === 'transferencia' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Banco <span className="text-red-500">*</span>
            </Label>
            <Select value={value.banco_id?.toString() || ''} onValueChange={handleBancoChange}>
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
                <SelectValue placeholder="Selecione o banco" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl">
                {bancosAtivos.map(banco => (
                  <SelectItem key={banco.id} value={banco.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span>{banco.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Cheque - Campos específicos */}
        {value.tipo === 'cheque' && (
          <div className="space-y-6 bg-blue-50/50 rounded-xl p-4 border border-blue-200/50">
            {/* Banco do Cheque */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Banco do Cheque <span className="text-red-500">*</span>
              </Label>
              <Select value={value.banco_id?.toString() || ''} onValueChange={handleBancoChange}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
                  <SelectValue placeholder="Selecione o banco emissor" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl">
                  {bancosAtivos.map(banco => (
                    <SelectItem key={banco.id} value={banco.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span>{banco.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Número do Cheque - Apenas para Conta Individual */}
            {numeroParcelas === 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    Número do Cheque <span className="text-red-500">*</span>
                  </Label>
                  {proximoNumero && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={usarProximoDisponivel}
                      className="text-xs"
                    >
                      Próximo: #{proximoNumero}
                    </Button>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="000001"
                  value={value.numero_cheque || ''}
                  onChange={(e) => handleNumeroChequeChange(e.target.value)}
                  className="bg-white/80 backdrop-blur-sm border-gray-300/50 font-mono"
                />
              </div>
            )}
            
            {/* Info para Lançamento em Lote */}
            {numeroParcelas > 1 && (
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-200/50">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Cheques Individuais</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Para lançamento em lote, os números dos cheques serão definidos individualmente para cada parcela na seção "Preview das Parcelas".
                </p>
                <p className="text-xs text-blue-600">
                  {numeroParcelas} cheques serão criados automaticamente
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cartão - Tipo */}
        {value.tipo === 'cartao' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Tipo de Cartão <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={value.tipo_cartao || 'debito'}
              onValueChange={(tipo) => onChange({ ...value, tipo_cartao: tipo as 'debito' | 'credito' })}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debito" id="debito" />
                <Label htmlFor="debito" className="text-sm font-medium text-gray-700">
                  Débito
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credito" id="credito" />
                <Label htmlFor="credito" className="text-sm font-medium text-gray-700">
                  Crédito
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>
    </div>
  );
}