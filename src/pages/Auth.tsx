import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, MessageCircle, Phone, Send, Sparkles, TrendingUp, Users, CheckCircle, Shield, Lock, CreditCard, Mail, LogIn, UserPlus, ArrowLeft, DollarSign, BarChart3, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { GRADIENTES, GLASSMORPHISM, ANIMATIONS } from '@/constants/designSystem';

export default function Auth() {
  const {
    signInWithWhatsApp,
    signUpWithWhatsApp,
    signInWithEmail,
    signUpWithEmail,
    verifyCode,
    resendEmailConfirmation,
    resetPassword,
    loginAttempts,
    isLocked,
    lockoutEndTime
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const returnUrl = searchParams.get('returnUrl');

  const [formData, setFormData] = useState({
    whatsapp: '',
    nome: '',
    codigo: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [step, setStep] = useState<'email' | 'email-sent' | 'forgot-password'>('email');
  const [authMethod] = useState<'email'>('email'); // Simplificado: apenas email
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailSent, setEmailSent] = useState('');

  // Calcular força da senha
  useEffect(() => {
    if (formData.senha) {
      let strength = 0;
      if (formData.senha.length >= 8) strength += 25;
      if (/[A-Z]/.test(formData.senha)) strength += 25;
      if (/[0-9]/.test(formData.senha)) strength += 25;
      if (/[^A-Za-z0-9]/.test(formData.senha)) strength += 25;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.senha]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return value;
  };

  // WhatsApp removido da FASE 1 - será implementado futuramente

  // Função para autenticação via email
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.senha.trim()) {
      toast.error('Por favor, preencha email e senha');
      return;
    }

    if (mode === 'signup') {
      if (!formData.nome.trim()) {
        toast.error('Por favor, digite seu nome');
        return;
      }
      if (formData.senha !== formData.confirmarSenha) {
        toast.error('As senhas não coincidem');
        return;
      }
      if (passwordStrength < 50) {
        toast.error('Senha muito fraca. Use pelo menos 8 caracteres com maiúsculas e números');
        return;
      }
    }

    setFormLoading(true);
    
    try {
      let result;
      
      if (mode === 'signup') {
        result = await signUpWithEmail(formData.email, formData.senha, {
          nome: formData.nome
        });
        
        if (result.error) {
          if (result.error.message?.includes('already registered') || result.error.message?.includes('already been registered')) {
            toast.error('Este email já está cadastrado. Tente fazer login.');
          } else if (result.error.message?.includes('weak_password')) {
            toast.error('Senha muito fraca. Use pelo menos 8 caracteres com maiúsculas e números.');
          } else {
            console.error('Erro no signup:', result.error);
            toast.error('Erro ao criar conta. Tente novamente.');
          }
        } else {
          if (result.needsEmailConfirmation) {
            toast.success('Conta criada! Verifique seu email para confirmar.');
            setEmailSent(formData.email);
            setStep('email-sent');
          } else {
            toast.success('Conta criada com sucesso!');
            navigate(returnUrl || '/dashboard');
          }
        }
      } else {
        result = await signInWithEmail(formData.email, formData.senha);
        
        if (result.error) {
          if (result.error.message?.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos');
          } else if (result.error.message?.includes('Email not confirmed')) {
            toast.error('Email não confirmado. Verifique sua caixa de entrada.');
            setEmailSent(formData.email);
            setStep('email-sent');
          } else if (result.error.message?.includes('locked')) {
            toast.error('Muitas tentativas incorretas. Conta temporariamente bloqueada.');
          } else {
            toast.error('Erro ao fazer login. Tente novamente.');
          }
        } else {
          toast.success('Login realizado com sucesso!');
          navigate(returnUrl || '/dashboard');
        }
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  // Código OTP removido da FASE 1

  // Função para esqueci a senha
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Por favor, digite seu email');
      return;
    }

    setFormLoading(true);
    
    try {
      const result = await resetPassword(formData.email);
      
      if (result.error) {
        toast.error('Erro ao enviar email de recuperação. Tente novamente.');
      } else {
        toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setStep('email'); // Voltar para o formulário principal
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  // Função para reenviar confirmação de email
  const handleResendConfirmation = async () => {
    if (!emailSent) {
      toast.error('Email não encontrado');
      return;
    }

    setFormLoading(true);
    
    try {
      const result = await resendEmailConfirmation(emailSent);
      
      if (result.error) {
        toast.error('Erro ao reenviar email. Tente novamente.');
      } else {
        toast.success('Email reenviado! Verifique sua caixa de entrada.');
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 25) return 'Muito fraca';
    if (strength < 50) return 'Fraca';
    if (strength < 75) return 'Boa';
    return 'Forte';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Blur backgrounds abstratos do design system */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen lg:grid lg:grid-cols-2">
        {/* HERO SECTION - Lado Esquerdo */}
        <div className="relative hidden lg:flex lg:flex-col lg:justify-center lg:items-center p-12 text-white overflow-hidden">
          {/* Background gradiente */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"></div>
          
          {/* Elementos de decoração */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-400/20 rounded-full blur-lg"></div>

          <div className="relative z-10 max-w-lg text-center space-y-8 animate-fade-in">
            {/* Logo principal */}
            <div className="space-y-4">
              <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30 shadow-lg">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  ChatConta
                </h1>
                <p className="text-xl text-blue-100 font-medium">
                  Seu financeiro, mais inteligente
                </p>
              </div>
            </div>

            {/* Features em destaque */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-6 text-white">
                  Finanças pessoais inteligentes
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white">Análises com IA</p>
                </div>
                
                <div className="text-center space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white">Categorização Automática</p>
                </div>
                
                <div className="text-center space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white">100% Seguro</p>
                </div>
                
                <div className="text-center space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white">Insights Personalizados</p>
                </div>
              </div>

              {/* Stats impressionantes */}
              <div className="flex justify-center space-x-8 pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-xs text-blue-100">Usuários</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">100K+</div>
                  <div className="text-xs text-blue-100">Transações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-xs text-blue-100">Satisfação</div>
                </div>
              </div>
            </div>

            {/* Call to action secundário */}
            <div className="pt-6">
              <p className="text-blue-100 text-sm">
                ✨ Junte-se a milhares de pessoas que já transformaram suas finanças com IA
              </p>
            </div>
          </div>
        </div>

        {/* FORMULÁRIO DE LOGIN - Lado Direito */}
        <div className="flex items-center justify-center p-4 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            {/* Link para voltar - apenas mobile */}
            <div className="lg:hidden">
              <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Link>
            </div>

            {/* Header mobile */}
            <div className="lg:hidden text-center space-y-4 mb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ChatConta
                </h1>
                <p className="text-muted-foreground">Seu financeiro, mais inteligente</p>
              </div>
            </div>

            {/* Card do formulário com glassmorphism */}
            <Card className={`${GLASSMORPHISM.card} ${GLASSMORPHISM.cardHover} ${ANIMATIONS.smooth} animate-scale-in`}>
              <CardHeader className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  {step === 'email' ? 'Acesse sua conta' : 
                   step === 'email-sent' ? 'Email enviado!' :
                   step === 'forgot-password' ? 'Recuperar senha' : 'Acesse sua conta'}
                </CardTitle>
                <CardDescription>
                  {step === 'email' 
                    ? 'Entre com seu email e senha'
                    : step === 'email-sent' ? 'Enviamos um email de confirmação'
                    : step === 'forgot-password' ? 'Digite seu email para recuperar a senha'
                    : 'Digite suas credenciais'
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {step === 'email-sent' ? (
                  // Tela de email enviado
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Verifique seu email</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Enviamos um link de confirmação para<br />
                          <span className="font-medium text-blue-600">{emailSent}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleResendConfirmation}
                        className="w-full btn-primary"
                        disabled={formLoading}
                      >
                        {formLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Reenviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Reenviar email
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => {
                          setStep('email');
                          setEmailSent('');
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar ao login
                      </Button>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Não recebeu o email? Verifique sua pasta de spam ou lixo eletrônico.
                      </p>
                    </div>
                  </div>
                ) : step === 'forgot-password' ? (
                  // Tela de esqueci a senha
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Esqueceu sua senha?</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Digite seu email e enviaremos um link para redefinir sua senha
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-forgot">Email</Label>
                      <Input
                        id="email-forgot"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={GLASSMORPHISM.input}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-primary"
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar link de recuperação
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setStep('email')}
                      variant="outline"
                      className="w-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar ao login
                    </Button>
                  </form>
                ) : (
                  // Formulários de autenticação
                  <Tabs value={mode === 'signup' ? 'signup' : 'login'} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 backdrop-blur-sm">
                      <TabsTrigger value="login" onClick={() => navigate('/auth')} className="data-[state=active]:bg-white">
                        Entrar
                      </TabsTrigger>
                      <TabsTrigger value="signup" onClick={() => navigate('/auth?mode=signup')} className="data-[state=active]:bg-white">
                        Criar conta
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4">
                      {/* Formulário de Login com Email */}
                      <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email-login" className="text-sm font-medium text-gray-700">
                            Email
                          </Label>
                          <Input
                            id="email-login"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={GLASSMORPHISM.input}
                            placeholder="seu@email.com"
                            disabled={isLocked}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="senha-login" className="text-sm font-medium text-gray-700">
                            Senha
                          </Label>
                          <div className="relative">
                            <Input
                              id="senha-login"
                              type={showPassword ? "text" : "password"}
                              value={formData.senha}
                              onChange={(e) => handleInputChange('senha', e.target.value)}
                              className={GLASSMORPHISM.input}
                              placeholder="Sua senha"
                              disabled={isLocked}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="remember-email"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <Label htmlFor="remember-email" className="text-sm text-gray-700">
                              Lembrar-me
                            </Label>
                          </div>
                          <button
                            type="button"
                            className="text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => setStep('forgot-password')}
                          >
                            Esqueci a senha
                          </button>
                        </div>

                        <Button
                          type="submit"
                          className={`w-full btn-primary ${ANIMATIONS.fast}`}
                          disabled={formLoading || isLocked}
                        >
                          {formLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                              Entrando...
                            </>
                          ) : isLocked ? (
                            'Conta temporariamente bloqueada'
                          ) : (
                            <>
                              <LogIn className="w-4 h-4 mr-2" />
                              Entrar
                            </>
                          )}
                        </Button>
                      </form>

                      {/* Aviso WhatsApp */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">em breve</span>
                        </div>
                      </div>

                      <div className="text-center p-3 bg-blue-50/80 rounded-lg border border-blue-200/50">
                        <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                          <MessageCircle className="w-4 h-4" />
                          <span>Login com WhatsApp em desenvolvimento!</span>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4">
                      {/* Formulário de Cadastro com Email */}
                      <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome-email" className="text-sm font-medium text-gray-700">
                            Nome completo
                          </Label>
                          <Input
                            id="nome-email"
                            type="text"
                            value={formData.nome}
                            onChange={(e) => handleInputChange('nome', e.target.value)}
                            className={GLASSMORPHISM.input}
                            placeholder="Seu nome completo"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email-signup" className="text-sm font-medium text-gray-700">
                            Email
                          </Label>
                          <Input
                            id="email-signup"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={GLASSMORPHISM.input}
                            placeholder="seu@email.com"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="senha-signup" className="text-sm font-medium text-gray-700">
                            Senha
                          </Label>
                          <div className="relative">
                            <Input
                              id="senha-signup"
                              type={showPassword ? "text" : "password"}
                              value={formData.senha}
                              onChange={(e) => handleInputChange('senha', e.target.value)}
                              className={GLASSMORPHISM.input}
                              placeholder="Crie uma senha forte"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {formData.senha && (
                            <div className="space-y-1">
                              <div className="flex space-x-1">
                                {[25, 50, 75, 100].map((threshold) => (
                                  <div
                                    key={threshold}
                                    className={`h-1 flex-1 rounded ${
                                      passwordStrength >= threshold
                                        ? getPasswordStrengthColor(passwordStrength)
                                        : 'bg-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className={`text-xs ${
                                passwordStrength >= 50 ? 'text-green-600' : 'text-orange-600'
                              }`}>
                                {getPasswordStrengthText(passwordStrength)}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmar-senha" className="text-sm font-medium text-gray-700">
                            Confirmar senha
                          </Label>
                          <Input
                            id="confirmar-senha"
                            type="password"
                            value={formData.confirmarSenha}
                            onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                            className={GLASSMORPHISM.input}
                            placeholder="Digite a senha novamente"
                            required
                          />
                          {formData.confirmarSenha && (
                            <p className={`text-xs ${
                              formData.senha === formData.confirmarSenha ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formData.senha === formData.confirmarSenha ? 'Senhas coincidem' : 'Senhas não coincidem'}
                            </p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          className={`w-full btn-primary ${ANIMATIONS.fast}`}
                          disabled={formLoading || passwordStrength < 50 || formData.senha !== formData.confirmarSenha}
                        >
                          {formLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                              Criando conta...
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Criar conta grátis
                            </>
                          )}
                        </Button>
                      </form>

                      {/* Aviso WhatsApp */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-muted-foreground">em breve</span>
                        </div>
                      </div>

                      <div className="text-center p-3 bg-blue-50/80 rounded-lg border border-blue-200/50">
                        <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                          <MessageCircle className="w-4 h-4" />
                          <span>Cadastro com WhatsApp em desenvolvimento!</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Footer informativo */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-blue-50/50 rounded-lg p-3">
                    <Shield className="w-3 h-3 text-blue-600" />
                    <span>FASE 1: Autenticação email ativa. WhatsApp em breve!</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust indicators */}
            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">Protegido por criptografia de ponta a ponta</p>
              <div className="flex justify-center space-x-4 opacity-60">
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>SSL</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>LGPD</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>ISO 27001</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}