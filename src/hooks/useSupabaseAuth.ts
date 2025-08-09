import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/userProfile';
import { logService } from '@/services/logService';
import { toast } from 'sonner';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);

  // Calcular se está bloqueado
  const isLocked = lockoutEndTime && lockoutEndTime > Date.now();

  // Função para carregar perfil do usuário
  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        logService.logError(error, 'useSupabaseAuth.loadUserProfile');
        return null;
      }

      return data;
    } catch (error) {
      logService.logError(error, 'useSupabaseAuth.loadUserProfile');
      return null;
    }
  };

  // Função para resetar timeout de sessão
  const resetSessionTimeout = () => {
    // Implementar timeout de sessão se necessário
  };

  // Carregar tentativas de login do localStorage
  useEffect(() => {
    const storedAttempts = localStorage.getItem('login_attempts');
    const storedLockoutEnd = localStorage.getItem('lockout_end_time');
    
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }
    
    if (storedLockoutEnd) {
      const lockoutEnd = parseInt(storedLockoutEnd);
      if (lockoutEnd > Date.now()) {
        setLockoutEndTime(lockoutEnd);
      } else {
        // Lockout expirou, limpar
        localStorage.removeItem('login_attempts');
        localStorage.removeItem('lockout_end_time');
      }
    }
  }, []);

  // Função para incrementar tentativas de login
  const incrementLoginAttempts = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('login_attempts', newAttempts.toString());

    if (newAttempts >= 5) {
      // Bloquear por 15 minutos
      const lockoutEnd = Date.now() + 15 * 60 * 1000;
      setLockoutEndTime(lockoutEnd);
      localStorage.setItem('lockout_end_time', lockoutEnd.toString());
    }
  };

  // Configurar listeners de autenticação
  useEffect(() => {
    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (session?.user) {
          // Carregar perfil do usuário
          setTimeout(async () => {
            const userProfile = await loadUserProfile(session.user.id);
            setProfile(userProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setTimeout(async () => {
          const userProfile = await loadUserProfile(session.user.id);
          setProfile(userProfile);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Detectar atividade do usuário para resetar timeout
  useEffect(() => {
    const handleActivity = () => {
      resetSessionTimeout();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  // Função para login via WhatsApp/OTP (DESABILITADO)
  const signInWithWhatsApp = async (whatsapp: string) => {
    toast.info('Login com WhatsApp em desenvolvimento. Use email por enquanto.');
    return { error: { message: 'Método não disponível' } };
  };

  // Função para cadastro via WhatsApp/OTP (DESABILITADO)
  const signUpWithWhatsApp = async (whatsapp: string, userData?: { nome?: string }) => {
    toast.info('Cadastro com WhatsApp em desenvolvimento. Use email por enquanto.');
    return { error: { message: 'Método não disponível' } };
  };

  // Função para login via email/senha
  const signInWithEmail = async (email: string, password: string) => {
    if (isLocked) {
      const remainingTime = Math.ceil((lockoutEndTime! - Date.now()) / 60000);
      toast.error(`Conta bloqueada. Tente novamente em ${remainingTime} minutos.`);
      return { error: 'Conta bloqueada' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        incrementLoginAttempts();
        logService.logError(error, 'useSupabaseAuth.signInWithEmail');
        throw error;
      }

      // Reset tentativas de login em caso de sucesso
      setLoginAttempts(0);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('lockout_end_time');

      return { error: null, user: data.user };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.signInWithEmail');
      return { error };
    }
  };

  // Função para cadastro via email/senha
  const signUpWithEmail = async (email: string, password: string, userData?: { nome?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            name: userData?.nome || '',
            email
          }
        }
      });

      if (error) {
        logService.logError(error, 'useSupabaseAuth.signUpWithEmail');
        throw error;
      }

      // Se o usuário foi criado, criar perfil e trial
      if (data.user) {
        try {
          // Criar perfil
          await supabase.rpc('upsert_profile', {
            p_user_id: data.user.id,
            p_phone: '', // Email signup não tem telefone
            p_name: userData?.nome || '',
            p_email: email
          });

          // Criar trial subscription
          await supabase.rpc('create_trial_subscription', {
            p_user_id: data.user.id
          });
        } catch (profileError) {
          logService.logError(profileError, 'useSupabaseAuth.signUpWithEmail.createProfile');
          // Não falhar o signup se o perfil falhar, pode ser resolvido depois
        }
      }

      return { 
        error: null, 
        user: data.user,
        needsEmailConfirmation: !data.session // Se não tem session, precisa confirmar email
      };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.signUpWithEmail');
      return { error };
    }
  };

  // Função para reenviar email de confirmação
  const resendEmailConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        logService.logError(error, 'useSupabaseAuth.resendEmailConfirmation');
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.resendEmailConfirmation');
      return { error };
    }
  };

  // Função para verificar código OTP (DESABILITADO)
  const verifyCode = async (whatsapp: string, code: string) => {
    toast.info('Verificação OTP em desenvolvimento. Use email por enquanto.');
    return { error: { message: 'Método não disponível' } };
  };

  // Função para logout
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logService.logError(error, 'useSupabaseAuth.signOut');
        throw error;
      }

      // Limpar dados locais
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Redirecionar para página de autenticação
      window.location.href = '/auth';
      
      return { error: null };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.signOut');
      return { error };
    }
  };

  // Função para resetar senha via email
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        logService.logError(error, 'useSupabaseAuth.resetPassword');
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.resetPassword');
      return { error };
    }
  };

  return {
    // Estados de autenticação
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    role: profile?.role || 'user',
    isAdmin: profile?.role === 'admin',

    // Funções de autenticação
    signInWithWhatsApp,
    signUpWithWhatsApp,
    signInWithEmail,
    signUpWithEmail,
    verifyCode,
    signOut,
    resetPassword,
    resendEmailConfirmation,

    // Funções de sessão
    resetSessionTimeout,
    loadUserProfile,

    // Estado de bloqueio
    loginAttempts,
    isLocked,
    lockoutEndTime
  };
}