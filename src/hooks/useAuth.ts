import { useState, useEffect, useCallback, useRef } from 'react';
import { mockDataService } from '@/services/mockDataService';
import { toast } from 'sonner';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  nome?: string;
  user_metadata?: {
    nome?: string;
    avatar_url?: string;
    phone?: string;
  };
}

export interface Session {
  user: User;
  access_token: string;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const WARNING_TIME = 5 * 60 * 1000; // 5 minutos antes do timeout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Função para resetar timers de timeout
  const resetSessionTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    lastActivityRef.current = Date.now();
    
    // Timer para aviso de timeout (25 minutos)
    warningRef.current = setTimeout(() => {
      toast.warning('Sua sessão expirará em 5 minutos por inatividade', {
        duration: 10000,
        action: {
          label: 'Continuar',
          onClick: () => resetSessionTimeout()
        }
      });
    }, SESSION_TIMEOUT - WARNING_TIME);
    
    // Timer para logout automático (30 minutos)
    timeoutRef.current = setTimeout(() => {
      signOut();
      toast.error('Sessão expirada por inatividade');
    }, SESSION_TIMEOUT);
  }, []);

  // Verificar lockout ao inicializar
  useEffect(() => {
    const storedAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');
    const storedLockoutEnd = parseInt(localStorage.getItem('lockoutEndTime') || '0');
    
    setLoginAttempts(storedAttempts);
    
    if (storedLockoutEnd > Date.now()) {
      setIsLocked(true);
      setLockoutEndTime(storedLockoutEnd);
      
      // Timer para desbloquear automaticamente
      setTimeout(() => {
        setIsLocked(false);
        setLockoutEndTime(null);
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockoutEndTime');
      }, storedLockoutEnd - Date.now());
    }
    
    const existingSession = mockDataService.getSession();
    if (existingSession) {
      setUser(existingSession.user);
      setSession(existingSession);
      resetSessionTimeout();
    }
    setLoading(false);
  }, [resetSessionTimeout]);

  // Detectar atividade do usuário para resetar timeout
  useEffect(() => {
    if (!session) return;

    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      // Throttle para evitar muitos resets
      if (Date.now() - lastActivityRef.current > 60000) { // 1 minuto
        resetSessionTimeout();
      }
    };

    activities.forEach(activity => {
      document.addEventListener(activity, handleActivity, true);
    });

    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, handleActivity, true);
      });
    };
  }, [session, resetSessionTimeout]);

  const signInWithWhatsApp = async (whatsapp: string) => {
    setLoading(true);
    try {
      // Simular envio de código para qualquer número
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se é um usuário existente (mock)
      const isExistingUser = mockDataService.checkExistingWhatsAppUser(whatsapp);
      
      if (isExistingUser) {
        toast.success('Código enviado para seu WhatsApp!');
      } else {
        toast.success('Código enviado! Como é seu primeiro acesso, você passará pelo onboarding.');
      }
      
      return { error: null, isNewUser: !isExistingUser };
    } catch (error) {
      toast.error('Erro ao enviar código');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithWhatsApp = async (whatsapp: string, userData?: { nome?: string }) => {
    setLoading(true);
    try {
      // Por enquanto, simular envio de código para qualquer número
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Código enviado para seu WhatsApp!');
      return { error: null };
    } catch (error) {
      toast.error('Erro ao enviar código');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (whatsapp: string, code: string) => {
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutEndTime! - Date.now()) / 60000);
      toast.error(`Conta bloqueada. Tente novamente em ${remainingTime} minutos.`);
      return { error: 'Conta bloqueada' };
    }

    setLoading(true);
    try {
      // Aceitar qualquer código com 4+ dígitos para teste
      if (code.length >= 4) {
        // Reset attempts on success
        setLoginAttempts(0);
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lockoutEndTime');
        
        // Simular autenticação WhatsApp
        const sessionData = await mockDataService.signInWithWhatsApp(whatsapp);
        setUser(sessionData.user);
        setSession(sessionData);
        resetSessionTimeout();
        
        toast.success('Login realizado com sucesso!');
        
        // Verificar se precisa do onboarding
        const needsOnboarding = !sessionData.user.nome; // Simplificado para mock
        
        return { 
          error: null, 
          needsOnboarding,
          user: sessionData.user 
        };
      } else {
        throw new Error('Código inválido');
      }
    } catch (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());
      
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutEnd = Date.now() + LOCKOUT_DURATION;
        setIsLocked(true);
        setLockoutEndTime(lockoutEnd);
        localStorage.setItem('lockoutEndTime', lockoutEnd.toString());
        
        toast.error(`Muitas tentativas inválidas. Conta bloqueada por 15 minutos.`);
        
        // Timer para desbloquear automaticamente
        setTimeout(() => {
          setIsLocked(false);
          setLockoutEndTime(null);
          setLoginAttempts(0);
          localStorage.removeItem('loginAttempts');
          localStorage.removeItem('lockoutEndTime');
        }, LOCKOUT_DURATION);
      } else {
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts;
        toast.error(`Código inválido. Restam ${remainingAttempts} tentativas.`);
      }
      
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData?: { nome?: string }) => {
    setLoading(true);
    try {
      const sessionData = await mockDataService.signUp(email, password, userData);
      setUser(sessionData.user);
      setSession(sessionData);
      toast.success('Cadastro realizado com sucesso!');
      return { error: null };
    } catch (error) {
      toast.error('Erro no cadastro');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const sessionData = await mockDataService.signIn(email, password);
      setUser(sessionData.user);
      setSession(sessionData);
      toast.success('Login realizado com sucesso!');
      return { error: null };
    } catch (error) {
      toast.error('Erro no login');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Limpar timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      
      await mockDataService.signOut();
      setUser(null);
      setSession(null);
      toast.info('Logout realizado com sucesso');
      // Forçar navegação imediata para auth
      window.location.href = '/auth';
      return { error: null };
    } catch (error) {
      toast.error('Erro no logout');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Email de recuperação enviado!');
    return { error: null };
  };

  return {
    user,
    session,
    loading,
    signInWithWhatsApp,
    signUpWithWhatsApp,
    verifyCode,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resetSessionTimeout,
    isAuthenticated: !!session,
    loginAttempts,
    isLocked,
    lockoutEndTime
  };
}