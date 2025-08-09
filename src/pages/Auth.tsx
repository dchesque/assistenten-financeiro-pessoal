import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';
import { BlurBackground } from '@/components/ui/BlurBackground';
import { FEATURES, getFeatureMessage } from '@/config/features';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const { toast } = useToast();

  const {
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    resendEmailConfirmation,
    loginAttempts,
    isLocked,
    lockoutEndTime
  } = useSupabaseAuth();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          return;
        }
        
        if (password.length < 8) {
          setError('A senha deve ter pelo menos 8 caracteres');
          return;
        }

        // Validação de força da senha
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
          setError('A senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula e 1 número');
          return;
        }

        const { error, needsEmailConfirmation } = await signUpWithEmail(email, password, { nome: name });
        
        if (error) {
          // Tratamento específico de erros
          if (error.message?.includes('already registered')) {
            setError('Este email já está cadastrado. Tente fazer login ou use "Esqueci a senha".');
          } else if (error.message?.includes('weak password')) {
            setError('Senha muito fraca. Use pelo menos 8 caracteres com letras e números.');
          } else {
            setError(error.message || 'Erro ao criar conta');
          }
          return;
        }

        if (needsEmailConfirmation) {
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu email para confirmar a conta antes de fazer login.",
          });
          setEmailSent(true);
        } else {
          navigate('/dashboard');
        }
      } else {
        const { error } = await signInWithEmail(email, password);
        
        if (error) {
          // Tratamento específico de erros de login
          if (error.message?.includes('Email not confirmed')) {
            setError('Email não confirmado. Verifique sua caixa de entrada.');
            setEmailSent(true);
          } else if (error.message?.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos');
          } else {
            setError(error.message || 'Erro ao fazer login');
          }
          return;
        }

        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Digite seu email para recuperar a senha');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message || 'Erro ao enviar email de recuperação');
        return;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setShowForgotPassword(false);
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Digite seu email para reenviar a confirmação');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resendEmailConfirmation(email);
      
      if (error) {
        setError(error.message || 'Erro ao reenviar confirmação');
        return;
      }

      toast({
        title: "Email reenviado!",
        description: "Verifique sua caixa de entrada.",
      });
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Blur backgrounds abstratos */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {mode === 'signup' ? 'Criar Conta' : 'Entrar'}
            </h1>
            <p className="mt-2 text-white/80">
              {mode === 'signup' 
                ? 'Crie sua conta para começar a usar o ChatConta'
                : 'Entre na sua conta ChatConta'
              }
            </p>
          </div>

          <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                {showForgotPassword ? 'Recuperar senha' : (mode === 'signup' ? 'Criar nova conta' : 'Fazer login')}
              </CardTitle>
              <CardDescription className="text-center">
                {showForgotPassword 
                  ? 'Digite seu email para receber o link de recuperação'
                  : (mode === 'signup'
                    ? 'Preencha os dados abaixo para criar sua conta'
                    : 'Digite suas credenciais para acessar'
                  )
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Aviso sobre WhatsApp */}
              {!FEATURES.WHATSAPP_AUTH && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    {getFeatureMessage('WHATSAPP_AUTH')}
                  </AlertDescription>
                </Alert>
              )}

              {emailSent && (
                <Alert className="border-green-200 bg-green-50">
                  <Mail className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Email enviado! Verifique sua caixa de entrada.
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleResendConfirmation}
                      className="ml-2 p-0 h-auto text-green-700 hover:text-green-600"
                      disabled={loading}
                    >
                      Reenviar
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError('');
                      }}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar link de recuperação'
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : 'Sua senha'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <p className="text-xs text-gray-600">
                        Use pelo menos 8 caracteres com letras maiúsculas, minúsculas e números
                      </p>
                    )}
                  </div>
                  
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Digite a senha novamente"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                      />
                    </div>
                  )}

                  {isLocked && lockoutEndTime && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        Muitas tentativas de login. Tente novamente em {Math.ceil((lockoutEndTime - Date.now()) / 1000 / 60)} minutos.
                      </AlertDescription>
                    </Alert>
                  )}

                  {loginAttempts > 0 && loginAttempts < 5 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        {5 - loginAttempts} tentativas restantes antes do bloqueio temporário.
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={loading || isLocked}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {mode === 'signup' ? 'Criando conta...' : 'Entrando...'}
                      </>
                    ) : (
                      mode === 'signup' ? 'Criar conta' : 'Entrar'
                    )}
                  </Button>
                </form>
              )}

              {!showForgotPassword && (
                <div className="text-center text-sm">
                  {mode === 'signup' ? (
                    <p className="text-gray-600">
                      Já tem uma conta?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/auth?mode=signin')}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Fazer login
                      </button>
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        Não tem uma conta?{' '}
                        <button
                          type="button"
                          onClick={() => navigate('/auth?mode=signup')}
                          className="font-medium text-blue-600 hover:text-blue-500"
                        >
                          Criar conta
                        </button>
                      </p>
                      <p>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          Esqueceu a senha?
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}