import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types/userProfile';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // Verificar se está bloqueado por tentativas
  useEffect(() => {
    const blocked = localStorage.getItem('auth_blocked_until');
    if (blocked) {
      const blockedUntil = new Date(blocked);
      if (new Date() < blockedUntil) {
        setIsBlocked(true);
        const timeLeft = Math.ceil((blockedUntil.getTime() - new Date().getTime()) / 1000 / 60);
        toast.error(`Muitas tentativas. Aguarde ${timeLeft} minutos`);
      } else {
        localStorage.removeItem('auth_blocked_until');
        setLoginAttempts(0);
      }
    }
  }, []);

  // Session timeout - 30 minutos
  useEffect(() => {
    if (session) {
      const timeout = 30 * 60 * 1000; // 30 minutos
      const warningTime = 5 * 60 * 1000; // 5 minutos antes
      
      const expiresAt = new Date(lastActivity.getTime() + timeout);
      setSessionExpiresAt(expiresAt);

      // Warning 5 minutos antes
      const warningTimer = setTimeout(() => {
        toast.warning('Sua sessão expira em 5 minutos', {
          action: {
            label: 'Renovar',
            onClick: () => {
              setLastActivity(new Date());
              toast.success('Sessão renovada');
            }
          }
        });
      }, timeout - warningTime);

      // Auto logout
      const logoutTimer = setTimeout(() => {
        signOut();
        toast.error('Sessão expirada. Faça login novamente');
      }, timeout);

      return () => {
        clearTimeout(warningTimer);
        clearTimeout(logoutTimer);
      };
    }
  }, [lastActivity, session]);

  // Detectar atividade do usuário
  useEffect(() => {
    const handleActivity = () => {
      if (session) {
        setLastActivity(new Date());
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [session]);

  // Setup auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Buscar perfil do usuário
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

              if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar perfil:', error);
              } else {
                setProfile(profileData as unknown as UserProfile);
              }
            } catch (error) {
              console.error('Erro ao buscar perfil:', error);
            }
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithWhatsApp = async (phone: string) => {
    if (isBlocked) {
      toast.error('Aguarde antes de tentar novamente');
      return { error: 'blocked' };
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          channel: 'whatsapp'
        }
      });

      if (error) {
        setLoginAttempts(prev => prev + 1);
        if (loginAttempts >= 4) {
          const blockedUntil = new Date(Date.now() + 5 * 60 * 1000);
          localStorage.setItem('auth_blocked_until', blockedUntil.toISOString());
          setIsBlocked(true);
          toast.error('Muitas tentativas. Aguarde 5 minutos');
        } else {
          toast.error('Erro ao enviar código');
        }
        return { error };
      }

      toast.success('Código enviado para seu WhatsApp!');
      return { error: null };
    } catch (error) {
      toast.error('Erro ao enviar código');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (phone: string, token: string) => {
    if (isBlocked) {
      toast.error('Aguarde antes de tentar novamente');
      return { error: 'blocked' };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms'
      });

      if (error) {
        setLoginAttempts(prev => prev + 1);
        if (loginAttempts >= 4) {
          const blockedUntil = new Date(Date.now() + 5 * 60 * 1000);
          localStorage.setItem('auth_blocked_until', blockedUntil.toISOString());
          setIsBlocked(true);
          toast.error('Muitas tentativas. Aguarde 5 minutos');
        } else {
          toast.error('Código inválido');
        }
        return { error };
      }

      // Reset login attempts on success
      setLoginAttempts(0);
      localStorage.removeItem('auth_blocked_until');
      setIsBlocked(false);
      
      toast.success('Login realizado com sucesso!');
      return { data, error: null };
    } catch (error) {
      toast.error('Erro na verificação');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Limpar dados do localStorage
      const keysToKeep = ['theme']; // Manter apenas algumas preferências
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Erro no logout');
        return { error };
      }

      setUser(null);
      setSession(null);
      setProfile(null);
      setLastActivity(new Date());
      setSessionExpiresAt(null);
      
      toast.info('Logout realizado com sucesso');
      
      // Forçar navegação para auth
      window.location.href = '/auth';
      return { error: null };
    } catch (error) {
      toast.error('Erro no logout');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { error: 'Não autenticado' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Erro ao atualizar perfil');
        return { error };
      }

      // Atualizar estado local
      if (profile) {
        setProfile({ ...profile, ...updates });
      }

      toast.success('Perfil atualizado com sucesso');
      return { error: null };
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
      return { error };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    lastActivity,
    sessionExpiresAt,
    loginAttempts,
    isBlocked,
    signInWithWhatsApp,
    verifyOtp,
    signOut,
    updateProfile,
    isAuthenticated: !!session,
    isAdmin: profile?.role === 'admin'
  };
}