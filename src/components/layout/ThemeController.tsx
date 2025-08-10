import { ReactNode, useEffect, useState } from 'react';
import { ThemeSync } from './ThemeSync';

interface ThemeControllerProps {
  children: ReactNode;
}

/**
 * Componente que gerencia sincronização de tema e loading states
 */
export function ThemeController({ children }: ThemeControllerProps) {
  const [mounted, setMounted] = useState(false);

  // Aguardar hidratação
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="light">
        {children}
      </div>
    );
  }

  return (
    <>
      <ThemeSync />
      {children}
    </>
  );
}