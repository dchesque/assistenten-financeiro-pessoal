import { ReactNode, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useSettings } from '@/hooks/useSettings';

interface ThemeControllerProps {
  children: ReactNode;
}

/**
 * Componente que sincroniza tema das configurações com next-themes
 */
export function ThemeController({ children }: ThemeControllerProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { data: settings, isLoading } = useSettings();

  // Aguardar hidratação
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizar tema quando configurações carregarem
  useEffect(() => {
    if (mounted && !isLoading && settings?.theme && theme !== settings.theme) {
      setTheme(settings.theme);
    }
  }, [mounted, isLoading, settings?.theme, theme, setTheme]);

  return <>{children}</>;
}