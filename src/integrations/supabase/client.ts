import { createClient } from '@supabase/supabase-js';

// Configuração segura usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação das variáveis de ambiente
function validateSupabaseConfig(): void {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '🚨 Configuração do Supabase inválida!\n\n' +
      'Variáveis de ambiente necessárias:\n' +
      '- VITE_SUPABASE_URL\n' +
      '- VITE_SUPABASE_ANON_KEY\n\n' +
      'Crie um arquivo .env.local na raiz do projeto com essas variáveis.'
    );
  }

  // Validação de formato da URL
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(
      '🚨 VITE_SUPABASE_URL deve ser uma URL válida!\n' +
      `Valor atual: ${supabaseUrl}`
    );
  }

  // Validação básica do token JWT
  if (!supabaseAnonKey.includes('.')) {
    throw new Error(
      '🚨 VITE_SUPABASE_ANON_KEY deve ser um token JWT válido!\n' +
      'Verifique se copiou a chave completa do painel do Supabase.'
    );
  }
}

// Executar validação
validateSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});