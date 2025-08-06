import { useState } from 'react';
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
  const [user, setUser] = useState<User | null>({
    id: '1',
    email: 'usuario@exemplo.com',
    nome: 'Usuário Exemplo',
    user_metadata: {
      nome: 'Usuário Exemplo',
      avatar_url: ''
    }
  });
  const [session, setSession] = useState<Session | null>({
    user: {
      id: '1',
      email: 'usuario@exemplo.com',
      nome: 'Usuário Exemplo'
    },
    access_token: 'mock-token'
  });
  const [loading, setLoading] = useState(false);

  const signUp = async (email: string, password: string, userData?: { nome?: string }) => {
    setLoading(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(false);
    toast.success('Cadastro realizado com sucesso!');
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      id: '1',
      email,
      nome: 'Usuário Exemplo'
    };
    
    setUser(mockUser);
    setSession({
      user: mockUser,
      access_token: 'mock-token'
    });
    
    setLoading(false);
    toast.success('Login realizado com sucesso!');
    return { error: null };
  };

  const signOut = async () => {
    setLoading(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUser(null);
    setSession(null);
    
    setLoading(false);
    toast.info('Logout realizado com sucesso');
    return { error: null };
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