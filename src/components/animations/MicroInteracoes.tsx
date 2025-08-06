import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimationProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
}

/**
 * 💎 MICRO-INTERAÇÕES PREMIUM
 * Componentes de animação sofisticadas para experiência diamante
 */

export const FadeInUp = ({ children, delay = 0, duration = 0.5 }: AnimationProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ 
      duration, 
      delay, 
      ease: [0.4, 0, 0.2, 1] // Custom easing
    }}
  >
    {children}
  </motion.div>
);

export const ScaleOnHover = ({ children, scale = 1.05 }: AnimationProps & { scale?: number }) => (
  <motion.div
    whileHover={{ 
      scale,
      transition: { duration: 0.2, ease: "easeOut" }
    }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    {children}
  </motion.div>
);

export const SlideInFromLeft = ({ children, delay = 0 }: AnimationProps) => (
  <motion.div
    initial={{ x: -100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ 
      type: "spring", 
      damping: 25, 
      stiffness: 200,
      delay 
    }}
  >
    {children}
  </motion.div>
);

export const SlideInFromRight = ({ children, delay = 0 }: AnimationProps) => (
  <motion.div
    initial={{ x: 100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ 
      type: "spring", 
      damping: 25, 
      stiffness: 200,
      delay 
    }}
  >
    {children}
  </motion.div>
);

export const NumberCounter = ({ 
  value, 
  duration = 2,
  format = 'number'
}: { 
  value: number | string; 
  duration?: number;
  format?: 'number' | 'currency' | 'percentage';
}) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        delay: 0.2,
        duration: 0.6
      }}
    >
      <motion.span
        initial={{ filter: "blur(4px)" }}
        animate={{ filter: "blur(0px)" }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
};

export const FloatingIcon = ({ children, delay = 0 }: AnimationProps) => (
  <motion.div
    animate={{ 
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0] 
    }}
    transition={{ 
      duration: 4, 
      repeat: Infinity, 
      repeatDelay: 2,
      delay,
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, staggerDelay = 0.1 }: AnimationProps & { staggerDelay?: number }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children }: { children: ReactNode }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
      }
    }}
  >
    {children}
  </motion.div>
);

export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

export const ModalTransition = ({ children, isOpen }: { children: ReactNode; isOpen: boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"
  />
);

export const PulseOnChange = ({ children, value }: { children: ReactNode; value: any }) => (
  <motion.div
    key={value}
    initial={{ scale: 1 }}
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);