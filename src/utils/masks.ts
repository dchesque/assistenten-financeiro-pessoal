// Utilitários para máscaras de valores brasileiros

/**
 * Formatar valor monetário para exibição
 */
export const formatarMoedaExibicao = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
};

/**
 * Formatar percentual para exibição
 */
export const formatarPercentualExibicao = (valor: number): string => {
  return `${valor.toFixed(2).replace('.', ',')}%`;
};

/**
 * Aplicar máscara monetária em tempo real
 */
export const aplicarMascaraMoeda = (valor: string): string => {
  // Remove tudo que não é número
  const numeros = valor.replace(/\D/g, '');
  
  // Se vazio, retorna vazio
  if (!numeros) return '';
  
  // Converte para centavos
  const valorCentavos = parseInt(numeros);
  const valorReal = valorCentavos / 100;
  
  // Formata como moeda brasileira
  return formatarMoedaExibicao(valorReal);
};

/**
 * Aplicar máscara de percentual em tempo real
 */
export const aplicarMascaraPercentual = (valor: string): string => {
  // Remove tudo que não é número ou vírgula
  let numeros = valor.replace(/[^\d,]/g, '');
  
  // Se vazio, retorna vazio
  if (!numeros) return '';
  
  // Limita a uma vírgula
  const partes = numeros.split(',');
  if (partes.length > 2) {
    numeros = partes[0] + ',' + partes[1];
  }
  
  // Limita casas decimais a 2
  if (partes[1] && partes[1].length > 2) {
    numeros = partes[0] + ',' + partes[1].substring(0, 2);
  }
  
  // Limita valor máximo a 100%
  const valorNumerico = parseFloat(numeros.replace(',', '.'));
  if (valorNumerico > 100) {
    return '100,00%';
  }
  
  return numeros + '%';
};

/**
 * Converter valor com máscara monetária para número
 */
export const converterMoedaParaNumero = (valorMascarado: string): number => {
  if (!valorMascarado) return 0;
  
  // Remove símbolos da moeda e converte vírgula para ponto
  const valor = valorMascarado
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(valor) || 0;
};

/**
 * Converter valor com máscara percentual para número
 */
export const converterPercentualParaNumero = (valorMascarado: string): number => {
  if (!valorMascarado) return 0;
  
  // Remove símbolos do percentual e converte vírgula para ponto
  const valor = valorMascarado
    .replace('%', '')
    .replace(',', '.');
  
  return parseFloat(valor) || 0;
};

/**
 * Validar se valor monetário é válido
 */
export const validarValorMonetario = (valor: string): boolean => {
  const numero = converterMoedaParaNumero(valor);
  return numero >= 0;
};

/**
 * Validar se percentual é válido
 */
export const validarPercentual = (valor: string): boolean => {
  const numero = converterPercentualParaNumero(valor);
  return numero >= 0 && numero <= 100;
};

/**
 * Converter número para exibição com máscara monetária
 */
export const numeroParaMascaraMoeda = (numero: number): string => {
  if (isNaN(numero) || numero === 0) return '';
  return formatarMoedaExibicao(numero);
};

/**
 * Converter número para exibição com máscara percentual
 */
export const numeroParaMascaraPercentual = (numero: number): string => {
  if (isNaN(numero) || numero === 0) return '';
  return formatarPercentualExibicao(numero);
};