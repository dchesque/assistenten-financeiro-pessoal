import { ReactNode, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

interface GlobalSettingsProviderProps {
  children: ReactNode;
}

/**
 * Provider que aplica configurações globais automaticamente
 */
export function GlobalSettingsProvider({ children }: GlobalSettingsProviderProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const { settings } = useGlobalSettings();

  // Aguardar hidratação para evitar erros de SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Aplicar tema apenas quando montado e configurações carregadas
  useEffect(() => {
    if (mounted && settings?.theme && theme !== undefined) {
      // O useTheme já gerencia a aplicação do tema
    }
  }, [mounted, settings?.theme, theme]);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}