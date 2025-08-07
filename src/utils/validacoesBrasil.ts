import { toast } from 'sonner';

// Validações específicas para documentos brasileiros
export const validarCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  
  // Validação do CPF
  let sum = 0;
  let remainder;
  
  if (numbers === "00000000000") return false;
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(numbers.substring(i-1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(numbers.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(numbers.substring(i-1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(numbers.substring(10, 11))) return false;
  
  return true;
};

export const validarCNPJ = (cnpj: string): boolean => {
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length !== 14) return false;
  
  if (numbers === "00000000000000") return false;
  
  // Validação simplificada - pode ser expandida
  return true;
};

// Sistema de validação de formulários
export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

// Validações comuns
export const validationRules = {
  required: (fieldName: string): ValidationRule => ({
    validate: (value) => value !== null && value !== undefined && String(value).trim() !== '',
    message: `${fieldName} é obrigatório`
  }),
  
  minValue: (min: number, fieldName: string): ValidationRule => ({
    validate: (value) => Number(value) >= min,
    message: `${fieldName} deve ser maior ou igual a ${min}`
  }),
  
  maxValue: (max: number, fieldName: string): ValidationRule => ({
    validate: (value) => Number(value) <= max,
    message: `${fieldName} deve ser menor ou igual a ${max}`
  }),
  
  positiveNumber: (fieldName: string): ValidationRule => ({
    validate: (value) => Number(value) > 0,
    message: `${fieldName} deve ser maior que zero`
  }),
  
  email: (): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Email inválido'
  }),
  
  cpf: (): ValidationRule => ({
    validate: (value) => validarCPF(value),
    message: 'CPF inválido'
  }),
  
  cnpj: (): ValidationRule => ({
    validate: (value) => validarCNPJ(value),
    message: 'CNPJ inválido'
  }),
  
  phone: (): ValidationRule => ({
    validate: (value) => {
      const numbers = value.replace(/\D/g, '');
      return numbers.length === 10 || numbers.length === 11;
    },
    message: 'Telefone inválido'
  }),
  
  dateNotPast: (fieldName: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    message: `${fieldName} não pode ser anterior a hoje`
  }),
  
  dateNotFuture: (years: number, fieldName: string): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const date = new Date(value);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + years);
      return date <= maxDate;
    },
    message: `${fieldName} não pode ser superior a ${years} anos`
  }),
  
  dateComparison: (startField: string, endField: string, formData: any): ValidationRule => ({
    validate: (value) => {
      if (!value || !formData[startField]) return true;
      const startDate = new Date(formData[startField]);
      const endDate = new Date(value);
      return endDate >= startDate;
    },
    message: `Data de vencimento não pode ser anterior à data de emissão`
  })
};

// Função principal de validação
export const validateForm = (formData: any, schema: ValidationSchema): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  Object.keys(schema).forEach(fieldName => {
    const rules = schema[fieldName];
    const value = formData[fieldName];
    
    for (const rule of rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
        break; // Para no primeiro erro do campo
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Função para mostrar erros via toast
export const showValidationErrors = (errors: string[]) => {
  errors.forEach(error => {
    toast.error(error);
  });
};