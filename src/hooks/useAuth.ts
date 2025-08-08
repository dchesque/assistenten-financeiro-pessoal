import { useState, useEffect } from 'react';
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
    setLoading(true);
    try {
      // Aceitar qualquer código com 4+ dígitos para teste
      if (code.length >= 4) {
        // Simular autenticação WhatsApp
        const sessionData = await mockDataService.signInWithWhatsApp(whatsapp);
        setUser(sessionData.user);
        setSession(sessionData);
        
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
      toast.error('Código inválido');
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
    isAuthenticated: !!session
  };
}