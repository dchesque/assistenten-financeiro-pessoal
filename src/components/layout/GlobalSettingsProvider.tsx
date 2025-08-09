import { ReactNode } from 'react';
import { useThemeIntegration } from '@/hooks/useThemeIntegration';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

interface GlobalSettingsProviderProps {
  children: ReactNode;
}

/**
 * Provider que aplica configurações globais automaticamente
 */
export function GlobalSettingsProvider({ children }: GlobalSettingsProviderProps) {
  useThemeIntegration();
  useGlobalSettings();

  return <>{children}</>;
}