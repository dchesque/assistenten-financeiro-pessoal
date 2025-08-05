import React, { forwardRef, useState } from 'react';
import { Input } from './input';
import { Label } from './label';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputValidacaoProps extends Omit<React.ComponentProps<typeof Input>, 'erro' | 'validacao'> {
  label: string;
  erro?: string[];
  sucesso?: boolean;
  obrigatorio?: boolean;
  dica?: string;
  mascara?: (value: string) => string;
  validacao?: (value: string) => void;
}

export const InputValidacao = forwardRef<HTMLInputElement, InputValidacaoProps>(
  ({ 
    label, 
    erro = [], 
    sucesso = false, 
    obrigatorio = false, 
    dica, 
    mascara, 
    validacao, 
    className,
    onChange,
    onBlur,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasError = erro.length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      
      // Aplicar máscara se fornecida
      if (mascara) {
        value = mascara(value);
        e.target.value = value;
      }
      
      // Executar validação se fornecida
      if (validacao) {
        validacao(value);
      }
      
      // Chamar onChange original
      if (onChange) {
        onChange(e);
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

    const inputClassNames = cn(
      "input-base transition-all duration-200",
      {
        "border-red-300 bg-red-50/30 focus:ring-red-500 focus:border-red-500": hasError,
        "border-green-300 bg-green-50/30 focus:ring-green-500 focus:border-green-500": sucesso && !hasError,
        "border-blue-300 focus:ring-blue-500 focus:border-blue-500": focused && !hasError && !sucesso
      },
      className
    );

    return (
      <div className="space-y-2">
        {/* Label */}
        <div className="flex items-center space-x-1">
          <Label 
            htmlFor={props.id}
            className={cn("text-sm font-medium", {
              "text-red-700": hasError,
              "text-green-700": sucesso && !hasError
            })}
          >
            {label}
          </Label>
          {obrigatorio && (
            <span className="text-red-500 text-sm">*</span>
          )}
        </div>

        {/* Input com ícones */}
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className={inputClassNames}
          />
          
          {/* Ícone de status */}
          {(hasError || sucesso) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {hasError ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : sucesso ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : null}
            </div>
          )}
        </div>

        {/* Mensagens de erro */}
        {hasError && (
          <div className="space-y-1">
            {erro.map((mensagem, index) => (
              <p key={index} className="text-sm text-red-600 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{mensagem}</span>
              </p>
            ))}
          </div>
        )}

        {/* Dica */}
        {dica && !hasError && (
          <p className="text-sm text-muted-foreground">{dica}</p>
        )}
      </div>
    );
  }
);

InputValidacao.displayName = 'InputValidacao';