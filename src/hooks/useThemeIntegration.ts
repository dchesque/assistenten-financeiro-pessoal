import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSettings } from './useSettings';

/**
 * Hook que integra as configurações de tema com next-themes
 */
export function useThemeIntegration() {
  const { setTheme, theme } = useTheme();
  const { data: settings, isLoading } = useSettings();

  useEffect(() => {
    // Só aplicar tema quando settings carregaram e ThemeProvider está pronto
    if (!isLoading && settings?.theme && theme !== undefined) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, setTheme, isLoading, theme]);

  return {
    theme: settings?.theme || 'system',
    isReady: !isLoading && theme !== undefined
  };
}