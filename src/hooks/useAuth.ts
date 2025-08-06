import { useState, useEffect } from 'react';
import { mockDataService } from '@/services/mockDataService';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  nome?: string;
  user_metadata?: {
    nome?: string;
    avatar_url?: string;
  };
}

export interface Session {
  user: User;
  access_token: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existingSession = mockDataService.getSession();
    if (existingSession) {
      setUser(existingSession.user);
      setSession(existingSession);
    }
    setLoading(false);
  }, []);

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
      await mockDataService.signOut();
      setUser(null);
      setSession(null);
      toast.info('Logout realizado com sucesso');
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
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!session
  };
}