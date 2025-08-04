import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hideCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl', 
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-7xl'
};

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  icon, 
  size = '2xl', 
  children, 
  footer, 
  className,
  hideCloseButton = false 
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className={cn(
        "bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col",
        sizeClasses[size],
        className
      )}>
        {/* Header - Fixo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100/80 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content - Rolável */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer - Fixo */}
        {footer && (
          <div className="p-6 border-t border-gray-200/50 bg-gray-50/50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  showRequiredNote?: boolean;
}

export function ModalFooter({ children, className, showRequiredNote = false }: ModalFooterProps) {
  return (
    <div className={cn(
      "flex items-center justify-between",
      className
    )}>
      {showRequiredNote ? (
        <span className="text-sm text-gray-500">
          * Campos obrigatórios
        </span>
      ) : (
        <div />
      )}
      <div className="flex space-x-3">
        {children}
      </div>
    </div>
  );
}