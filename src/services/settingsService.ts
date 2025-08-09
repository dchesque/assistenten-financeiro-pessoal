import { supabase } from '@/integrations/supabase/client';
import { Settings, SettingsUpdateData, DEFAULT_SETTINGS } from '@/types/settings';

class SettingsService {
  private static CACHE_KEY = 'user_settings';
  private static cache: Settings | null = null;

  static async get(): Promise<Settings> {
    try {
      // Verificar cache primeiro
      if (this.cache) {
        return this.cache;
      }

      // Tentar buscar do localStorage
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          this.cache = parsed;
          // Revalidar em background
          this.revalidateInBackground();
          return parsed;
        } catch {
          localStorage.removeItem(this.CACHE_KEY);
        }
      }

      // Buscar do banco
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Não encontrado, retornar defaults
          const { data: user } = await supabase.auth.getUser();
          if (!user.user) throw new Error('Usuário não autenticado');
          
          const defaultSettings: Settings = {
            id: '',
            user_id: user.user.id,
            ...DEFAULT_SETTINGS,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          return defaultSettings;
        }
        throw error;
      }

      this.cache = data;
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      
      // Fallback para defaults
      const { data: user } = await supabase.auth.getUser();
      const defaultSettings: Settings = {
        id: '',
        user_id: user.user?.id || '',
        ...DEFAULT_SETTINGS,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return defaultSettings;
    }
  }

  static async upsert(patch: SettingsUpdateData): Promise<Settings> {
    try {
      const { data, error } = await supabase.rpc('upsert_settings', {
        p_patch: patch
      });

      if (error) throw error;

      // Atualizar cache
      this.cache = data;
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));

      // Log da alteração
      console.log('Configurações atualizadas:', {
        feature: 'settings_update',
        changes: Object.keys(patch),
        user_id: data.user_id
      });

      return data;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      throw error;
    }
  }

  static async resetToDefault(): Promise<Settings> {
    return this.upsert(DEFAULT_SETTINGS);
  }

  static clearCache(): void {
    this.cache = null;
    localStorage.removeItem(this.CACHE_KEY);
  }

  private static async revalidateInBackground(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (!error && data) {
        // Comparar updated_at para ver se mudou
        const current = this.cache;
        if (!current || new Date(data.updated_at) > new Date(current.updated_at)) {
          this.cache = data;
          localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
        }
      }
    } catch (error) {
      // Falha silenciosa na revalidação
      console.debug('Falha na revalidação em background:', error);
    }
  }
}

export { SettingsService };