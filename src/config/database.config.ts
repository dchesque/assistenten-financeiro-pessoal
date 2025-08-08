// Configuração centralizada para alternância entre Mock e Supabase
export const DATABASE_CONFIG = {
  // Controle principal - alternar entre mock e Supabase
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true' || !import.meta.env.VITE_SUPABASE_URL,
  
  // Configurações Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Configurações de desenvolvimento
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_DB_LOGGING === 'true',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Validação de configuração
export function validateDatabaseConfig(): void {
  if (!DATABASE_CONFIG.USE_MOCK_DATA) {
    if (!DATABASE_CONFIG.SUPABASE_URL || !DATABASE_CONFIG.SUPABASE_ANON_KEY) {
      throw new Error(
        'Supabase está habilitado mas as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas'
      );
    }
  }
  
  if (DATABASE_CONFIG.ENABLE_LOGGING) {
    console.warn('🔧 Configuração do banco:', {
      useMock: DATABASE_CONFIG.USE_MOCK_DATA,
      hasSupabaseUrl: !!DATABASE_CONFIG.SUPABASE_URL,
      hasSupabaseKey: !!DATABASE_CONFIG.SUPABASE_ANON_KEY
    });
  }
}