import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/services/NotificationService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: { nome?: string }) => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData
      }
    });

    setLoading(false);
    
    if (error) {
      NotificationService.erro('Erro no cadastro', error.message);
      return { error };
    }

    NotificationService.sucesso('Cadastro realizado!', 'Verifique seu email para confirmar a conta.');
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);
    
    if (error) {
      NotificationService.erro('Erro no login', error.message);
      return { error };
    }

    NotificationService.sucesso('Login realizado!', 'Bem-vindo ao sistema.');
    return { error: null };
  };

  const signOut = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.signOut();
    
    setLoading(false);
    
    if (error) {
      NotificationService.erro('Erro ao sair', error.message);
      return { error };
    }

    NotificationService.info('Logout realizado', 'Até logo!');
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      NotificationService.erro('Erro ao enviar email', error.message);
      return { error };
    }

    NotificationService.sucesso('Email enviado!', 'Verifique sua caixa de entrada para redefinir a senha.');
    return { error: null };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!session
  };
}