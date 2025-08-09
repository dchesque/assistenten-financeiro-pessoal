import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSettings } from './useSettings';

/**
 * Hook que integra as configurações de tema com next-themes
 */
export function useThemeIntegration() {
  const { setTheme } = useTheme();
  const { data: settings } = useSettings();

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, setTheme]);

  return {
    theme: settings?.theme || 'system'
  };
}