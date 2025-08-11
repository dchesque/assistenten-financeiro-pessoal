import { ReactNode, useEffect } from 'react';
import { logService } from '@/services/logService';
import { auditService } from '@/services/auditService';

interface SecurityGuardProps {
  children: ReactNode;
}

/**
 * Componente de segurança que monitora atividades suspeitas
 */
export function SecurityGuard({ children }: SecurityGuardProps) {
  
  useEffect(() => {
    // Monitor de tentativas de manipulação do DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // Detectar scripts injetados
              if (node.tagName === 'SCRIPT' && !node.hasAttribute('data-allowed')) {
                logService.logError('Script injection attempt detected', 'SecurityGuard');
                auditService.log('update', 'system', 'system', 'system@app.com', {
                  description: 'Script injection blocked',
                  metadata: { 
                    element: node.outerHTML.substring(0, 200)
                  },
                  severity: 'critical'
                });
                node.remove();
              }
              
              // Detectar iframes suspeitos
              if (node.tagName === 'IFRAME' && !node.hasAttribute('data-allowed')) {
                logService.logError('Iframe injection attempt detected', 'SecurityGuard');
                auditService.log('update', 'system', 'system', 'system@app.com', {
                  description: 'Iframe injection blocked',
                  metadata: {
                    src: node.getAttribute('src')
                  },
                  severity: 'critical'
                });
                node.remove();
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Monitor de eventos de console suspeitos
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Content Security Policy') || 
          message.includes('XSS') || 
          message.includes('script injection')) {
        logService.logError('Security violation detected in console', 'SecurityGuard', 'warn');
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      observer.disconnect();
      console.error = originalConsoleError;
    };
  }, []);

  return <>{children}</>;
}