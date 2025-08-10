import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSettings } from '@/hooks/useSettings';

/**
 * Componente que sincroniza tema das configurações com next-themes
 * Prioridade: Configurações do usuário > Light > System
 */
export function ThemeSync() {
  const { setTheme, theme } = useTheme();
  const { data: settings, isLoading } = useSettings();

  useEffect(() => {
    // Aguardar carregamento das configurações
    if (isLoading) return;

    // Se há configuração do usuário, aplicar
    if (settings?.theme && settings.theme !== theme) {
      setTheme(settings.theme);
      return;
    }

    // Se não há configuração do usuário e ainda está em system, mudar para light
    if (!settings?.theme && theme === 'system') {
      setTheme('light');
    }
  }, [settings?.theme, theme, setTheme, isLoading]);

  return null;
}