import { createClient } from '@supabase/supabase-js';

// Configuração segura com fallback para Lovable
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wrxosfdirgdlvfkzvcuh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyeG9zZmRpcmdkbHZma3p2Y3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODY4OTUsImV4cCI6MjA3MDA2Mjg5NX0.1SBE-f-f5lLEc_7rzv87sbVv3WYLLBLi8wsblDwUSCc';

// Validação das variáveis de ambiente
function validateSupabaseConfig(): void {
  // Log das variáveis para debugging (sem mostrar chaves completas)
  console.log('🔧 Configuração Supabase:', {
    hasUrl: !!supabaseUrl,
    urlPrefix: supabaseUrl?.substring(0, 20) + '...',
    hasKey: !!supabaseAnonKey,
    keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
    source: import.meta.env.VITE_SUPABASE_URL ? 'env' : 'fallback'
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '🚨 Configuração do Supabase inválida!\n\n' +
      'As chaves do Supabase não foram encontradas.\n' +
      'Em projetos Lovable, as chaves são configuradas automaticamente.\n' +
      'Se este erro persistir, contate o suporte.'
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