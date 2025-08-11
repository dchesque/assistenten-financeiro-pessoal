/**
 * Utilitários de criptografia seguros para o sistema
 */

/**
 * Gera uma string aleatória criptograficamente segura
 */
export const generateSecureRandomString = (length: number = 36): string => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(36)).join('').slice(0, length);
  }
  
  // Fallback para Node.js (se necessário)
  if (typeof require !== 'undefined') {
    try {
      const crypto = require('crypto');
      return crypto.randomBytes(length).toString('hex').slice(0, length);
    } catch (e) {
      // Fallback final (não recomendado para produção)
      console.warn('Crypto não disponível, usando fallback inseguro');
      return Math.random().toString(36).slice(2, length + 2);
    }
  }
  
  throw new Error('Crypto não disponível');
};

/**
 * Gera um ID único criptograficamente seguro
 */
export const generateSecureId = (prefix: string = ''): string => {
  const timestamp = Date.now();
  const randomPart = generateSecureRandomString(9);
  return `${prefix}${timestamp}_${randomPart}`;
};

/**
 * Gera um session ID seguro
 */
export const generateSecureSessionId = (): string => {
  return generateSecureId('session_');
};

/**
 * Gera uma senha temporária segura
 */
export const generateSecurePassword = (length: number = 12): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
};