
import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle } from 'lucide-react';

interface InputComValidacaoProps extends React.ComponentProps<typeof Input> {
  label: string;
  erro?: string;
  sucesso?: boolean;
  obrigatorio?: boolean;
  dica?: string;
  mascara?: (value: string) => string;
  validacao?: (value: string) => void;
}

export const InputComValidacao = forwardRef<HTMLInputElement, InputComValidacaoProps>(({
  label,
  erro,
  sucesso = false,
  obrigatorio = false,
  dica,
  mascara,
  validacao,
  className,
  value,
  onChange,
  onBlur,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value;
    
    // Aplica máscara se fornecida
    if (mascara) {
      valor = mascara(valor);
    }
    
    // Cria um novo evento com o valor mascarado
    const novoEvento = {
      ...e,
      target: {
        ...e.target,
        value: valor
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    // Chama validação se fornecida
    if (validacao) {
      validacao(valor);
    }
    
    // Chama onChange original com o valor correto
    if (onChange) {
      onChange(novoEvento);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const temErro = !!erro;
  const temSucesso = sucesso && !temErro && value;

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={props.id} 
        className={cn(
          "text-sm font-medium transition-colors",
          temErro ? "text-red-600" : "text-gray-700"
        )}
      >
        {label}
        {obrigatorio && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={cn(
            "bg-white/80 backdrop-blur-sm border rounded-xl transition-all duration-200 pr-10",
            "focus:ring-2 focus:ring-offset-1",
            temErro && "border-red-300 focus:border-red-500 focus:ring-red-200",
            temSucesso && "border-green-300 focus:border-green-500 focus:ring-green-200",
            !temErro && !temSucesso && focused && "border-blue-300 focus:border-blue-500 focus:ring-blue-200",
            !temErro && !temSucesso && !focused && "border-gray-300/50",
            className
          )}
          {...props}
        />
        
        {/* Ícone de status */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {temErro && (
            <X className="w-4 h-4 text-red-500" />
          )}
          {temSucesso && (
            <Check className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>
      
      {/* Mensagens de erro/dica */}
      {(erro || dica) && (
        <div className="flex items-start space-x-1 min-h-[20px]">
          {erro && (
            <>
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{erro}</p>
            </>
          )}
          {!erro && dica && (
            <p className="text-xs text-gray-500">{dica}</p>
          )}
        </div>
      )}
    </div>
  );
});

InputComValidacao.displayName = 'InputComValidacao';
