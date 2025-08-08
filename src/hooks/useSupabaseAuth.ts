import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ProfileService, UserProfile } from '@/services/profileService';
import { logService } from '@/services/logService';
import { toast } from 'sonner';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const WARNING_TIME = 5 * 60 * 1000; // 5 minutos antes do timeout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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

  // Função para carregar perfil do usuário
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const userProfile = await ProfileService.getCurrentProfile();
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      logService.logError(error, 'useSupabaseAuth.loadUserProfile');
      return null;
    }
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
  }, []);

  // Configurar listener de autenticação
  useEffect(() => {
    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile loading para evitar problemas
          setTimeout(async () => {
            await loadUserProfile(session.user.id);
            resetSessionTimeout();
          }, 0);
        } else {
          setProfile(null);
          // Limpar timers
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (warningRef.current) clearTimeout(warningRef.current);
        }
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          await loadUserProfile(session.user.id);
          resetSessionTimeout();
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile, resetSessionTimeout]);

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

  // Função para login via WhatsApp/OTP
  const signInWithWhatsApp = async (whatsapp: string) => {
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutEndTime! - Date.now()) / 60000);
      toast.error(`Conta bloqueada. Tente novamente em ${remainingTime} minutos.`);
      return { error: 'Conta bloqueada' };
    }

    try {
      // Limpar e formatar número
      const cleanPhone = whatsapp.replace(/\D/g, '');
      const formattedPhone = `+55${cleanPhone}`;

      // Enviar OTP via Supabase
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'whatsapp'
        }
      });

      if (error) {
        logService.logError(error, 'useSupabaseAuth.signInWithWhatsApp');
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.signInWithWhatsApp');
      return { error };
    }
  };

  // Função para cadastro via WhatsApp/OTP
  const signUpWithWhatsApp = async (whatsapp: string, userData?: { nome?: string }) => {
    try {
      // Limpar e formatar número
      const cleanPhone = whatsapp.replace(/\D/g, '');
      const formattedPhone = `+55${cleanPhone}`;

      // Criar conta via Supabase
      const { error } = await supabase.auth.signUp({
        phone: formattedPhone,
        password: Math.random().toString(36), // Password aleatório (não usado para OTP)
        options: {
          data: {
            name: userData?.nome || '',
            phone: formattedPhone
          },
          channel: 'whatsapp'
        }
      });

      if (error) {
        logService.logError(error, 'useSupabaseAuth.signUpWithWhatsApp');
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.signUpWithWhatsApp');
      return { error };
    }
  };

  // Função para verificar código OTP
  const verifyCode = async (whatsapp: string, code: string) => {
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutEndTime! - Date.now()) / 60000);
      toast.error(`Conta bloqueada. Tente novamente em ${remainingTime} minutos.`);
      return { error: 'Conta bloqueada' };
    }

    try {
      // Limpar e formatar número
      const cleanPhone = whatsapp.replace(/\D/g, '');
      const formattedPhone = `+55${cleanPhone}`;

      // Verificar OTP
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: 'sms'
      });

      if (error) {
        // Incrementar tentativas
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
        
        throw error;
      }

      // Reset attempts on success
      setLoginAttempts(0);
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lockoutEndTime');

      if (data.user) {
        // Criar ou atualizar perfil
        await ProfileService.upsertProfile(
          data.user.id,
          formattedPhone,
          data.user.user_metadata?.name
        );

        // Verificar se precisa do onboarding
        const userProfile = await loadUserProfile(data.user.id);
        const needsOnboarding = !userProfile?.onboarding_completed;
        
        return { 
          error: null, 
          needsOnboarding,
          user: data.user 
        };
      }

      return { error: null };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.verifyCode');
      return { error };
    }
  };

  // Função para logout
  const signOut = async () => {
    try {
      // Limpar timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logService.logError(error, 'useSupabaseAuth.signOut');
        throw error;
      }

      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast.info('Logout realizado com sucesso');
      
      // Forçar navegação imediata para auth
      window.location.href = '/auth';
      
      return { error: null };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.signOut');
      toast.error('Erro no logout');
      return { error };
    }
  };

  // Função para reset de senha (não aplicável para WhatsApp, mas mantemos para compatibilidade)
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        logService.logError(error, 'useSupabaseAuth.resetPassword');
        throw error;
      }
      
      toast.success('Email de recuperação enviado!');
      return { error: null };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.resetPassword');
      toast.error('Erro ao enviar email de recuperação');
      return { error };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signInWithWhatsApp,
    signUpWithWhatsApp,
    verifyCode,
    signOut,
    resetPassword,
    resetSessionTimeout,
    loadUserProfile,
    isAuthenticated: !!session,
    loginAttempts,
    isLocked,
    lockoutEndTime,
    // Expor role para uso em guards
    role: profile?.role || 'user',
    isAdmin: profile?.role === 'admin'
  };
}