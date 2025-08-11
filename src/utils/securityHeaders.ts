/**
 * Configurações de segurança para headers HTTP
 * Para uso em produção com Vite/Vercel/Netlify
 */

export const SECURITY_HEADERS = {
  // Content Security Policy - previne XSS e outros ataques
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.whatsapp.com",
    "frame-src 'self' https://*.lovable.dev https://*.netlify.app https://*.vercel.app",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  // Previne clickjacking - permite same origin
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Força HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Previne MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Previne XSS (backup para navegadores antigos)
  'X-XSS-Protection': '1; mode=block',
  
  // Controla informações do referrer
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Previne acesso a APIs sensíveis
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()'
  ].join(', ')
};

/**
 * Configuração para meta tags de segurança no HTML
 */
export const SECURITY_META_TAGS = [
  { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
  { httpEquiv: 'X-Frame-Options', content: 'SAMEORIGIN' },
  { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
  { name: 'referrer', content: 'strict-origin-when-cross-origin' }
];

/**
 * Configuração Vite para headers de segurança
 */
export const VITE_SECURITY_CONFIG = {
  server: {
    headers: SECURITY_HEADERS
  },
  preview: {
    headers: SECURITY_HEADERS
  }
};