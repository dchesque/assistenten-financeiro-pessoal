import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/userProfile';
import { logService } from '@/services/logService';
import { toast } from 'sonner';
import { generateSecurePassword } from '@/utils/cryptoUtils';
import { SECURITY_CONFIG } from '@/config/security.config';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);

  // Timeout de sessão por inatividade (minutos vindos da config)
  const SESSION_TIMEOUT_MINUTES = SECURITY_CONFIG.auth.sessionTimeoutMinutes || 60;
  const sessionTimeoutRef = useRef<number | null>(null);

  // Calcular se está bloqueado (forçar boolean)
  const isLocked = !!lockoutEndTime && lockoutEndTime > Date.now();

  // Função para carregar perfil do usuário
  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔍 [AUTH] Carregando perfil para user ID:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ [AUTH] Erro ao carregar perfil:', error);
        logService.logError(error, 'useSupabaseAuth.loadUserProfile');
        return null;
      }

      console.log('✅ [AUTH] Perfil carregado com sucesso:', { id: data.id, role: data.role, name: data.name });
      return data;
    } catch (error) {
      console.error('💥 [AUTH] Erro crítico ao carregar perfil:', error);
      logService.logError(error, 'useSupabaseAuth.loadUserProfile');
      return null;
    }
  };

  // Função para resetar timeout de sessão
  const resetSessionTimeout = () => {
    // Limpar timer anterior
    if (sessionTimeoutRef.current) {
      window.clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    // Só arma o timer se houver usuário autenticado
    if (!user) return;

    const ms = SESSION_TIMEOUT_MINUTES * 60 * 1000;
    sessionTimeoutRef.current = window.setTimeout(async () => {
      console.warn('Sessão encerrada por inatividade');
      toast.info('Sua sessão foi encerrada por inatividade.');
      try {
        await supabase.auth.signOut();
      } finally {
        // Forçar limpeza de estados locais e redirecionar
        window.location.href = '/auth';
      }
    }, ms);
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

  // Função para incrementar tentativas de login (usar SECURITY_CONFIG)
  const incrementLoginAttempts = () => {
    const maxAttempts = SECURITY_CONFIG.auth.maxLoginAttempts || 5;
    const lockoutMinutes = SECURITY_CONFIG.auth.lockoutDurationMinutes || 15;

    const newAttempts = (loginAttempts || 0) + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('login_attempts', newAttempts.toString());

    if (newAttempts >= maxAttempts) {
      // Bloquear pelo tempo configurado
      const lockoutEnd = Date.now() + lockoutMinutes * 60 * 1000;
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
            const userProfile = await loadUserProfile(session.user!.id);
            setProfile(userProfile);
            // Armar/Resetar o timeout de sessão ao autenticar ou atualizar sessão
            resetSessionTimeout();
          }, 0);
        } else {
          setProfile(null);
          // Limpar timer se deslogar
          if (sessionTimeoutRef.current) {
            window.clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = null;
          }
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
          const userProfile = await loadUserProfile(session.user!.id);
          setProfile(userProfile);
          // Armar/Resetar o timeout ao inicializar com sessão válida
          resetSessionTimeout();
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
      // Limpar timer ao desmontar
      if (sessionTimeoutRef.current) {
        window.clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }
    };
  }, [user]); // resetar quando usuário muda

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

      console.log('🚀 [AUTH] Iniciando cadastro via WhatsApp para:', formattedPhone);

      // Criar conta via Supabase
      const { data, error } = await supabase.auth.signUp({
        phone: formattedPhone,
        password: generateSecurePassword(), // Password aleatório seguro (não usado para OTP)
        options: {
          data: {
            name: userData?.nome || '',
            phone: formattedPhone
          },
          channel: 'whatsapp'
        }
      });

      if (error) {
        console.error('❌ [AUTH] Erro no signup WhatsApp:', error);
        logService.logError(error, 'useSupabaseAuth.signUpWithWhatsApp');
        throw error;
      }

      console.log('✅ [AUTH] Signup WhatsApp realizado. User ID:', data.user?.id);
      console.log('🔄 [AUTH] Trigger automático handle_new_user criará o perfil');

      return { error: null };
    } catch (error: any) {
      console.error('💥 [AUTH] Erro crítico no signup WhatsApp:', error);
      logService.logError(error, 'useSupabaseAuth.signUpWithWhatsApp');
      return { error };
    }
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
      console.log('🚀 [AUTH] Iniciando cadastro via email para:', email);
      
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
        console.error('❌ [AUTH] Erro no signup:', error);
        logService.logError(error, 'useSupabaseAuth.signUpWithEmail');
        throw error;
      }

      console.log('✅ [AUTH] Signup realizado com sucesso. User ID:', data.user?.id);
      console.log('📧 [AUTH] Email confirmation needed:', !data.session);
      
      // REMOVIDO: Chamadas RPC duplicadas
      // O trigger handle_new_user já cria automaticamente o perfil e trial
      // quando um novo usuário é inserido na tabela auth.users

      return { 
        error: null, 
        user: data.user,
        needsEmailConfirmation: !data.session // Se não tem session, precisa confirmar email
      };
    } catch (error: any) {
      console.error('💥 [AUTH] Erro crítico no signup:', error);
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

      // Verificar código OTP
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: 'sms'
      });

      if (error) {
        // Incrementar tentativas apenas para códigos inválidos
        if (error.message?.includes('invalid') || error.message?.includes('expired')) {
          incrementLoginAttempts();
        }
        
        logService.logError(error, 'useSupabaseAuth.verifyCode');
        throw error;
      }

      // Reset tentativas de login em caso de sucesso
      setLoginAttempts(0);
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('lockout_end_time');

      // REMOVIDO: Criação manual de perfil e trial
      // O trigger handle_new_user já cria automaticamente o perfil e trial
      // quando um novo usuário é inserido na tabela auth.users
      
      console.log('✅ [AUTH] OTP verificado com sucesso. User ID:', data.user?.id);
      console.log('🔄 [AUTH] Trigger automático handle_new_user criará o perfil se necessário');

      return { error: null, needsOnboarding: false, user: data.user };
    } catch (error: any) {
      logService.logError(error, 'useSupabaseAuth.verifyCode');
      return { error };
    }
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

  // Função para verificar role específico
  const checkRole = (requiredRole: string): boolean => {
    if (!profile || !user) return false;
    return profile.role === requiredRole;
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

    // Funções de autorização
    checkRole,

    // Estado de bloqueio
    loginAttempts,
    isLocked,
    lockoutEndTime
  };
}
