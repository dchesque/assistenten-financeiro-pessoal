import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, MessageCircle, AlertCircle, Info, Eye, EyeOff, DollarSign, BarChart3, Zap, Shield, Smile, ArrowLeft, Search, Apple } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlurBackground } from '@/components/ui/BlurBackground';
import { GRADIENTES, GLASSMORPHISM, TYPOGRAPHY, ANIMATIONS, UTILS, STATUS_BADGES } from '@/constants/designSystem';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'whatsapp' | 'google' | 'apple' | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const { toast } = useToast();

  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithWhatsApp,
    resetPassword,
    resendEmailConfirmation,
    loginAttempts,
    isLocked,
    lockoutEndTime
  } = useSupabaseAuth();

  const handleWhatsAppAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      const { error } = await signInWithWhatsApp(whatsapp);
      
      if (error) {
        setError(error.message || 'Erro ao enviar código do WhatsApp');
        return;
      }

      toast({
        title: "Código enviado!",
        description: "Verifique seu WhatsApp para o código de verificação.",
      });
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

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
    <div className={`min-h-screen bg-gradient-to-br ${GRADIENTES.pagina} flex relative overflow-hidden`}>
      {/* Blur backgrounds abstratos da página */}
      <BlurBackground variant="page" />
      
      {/* Seção Esquerda - Apresentação */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${GRADIENTES.primary} relative overflow-hidden`}>
        {/* Blur backgrounds abstratos */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-20 text-white">
          {/* Logo e Título */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center mb-4">
              <div className={`w-16 h-16 ${GLASSMORPHISM.card} flex items-center justify-center mr-4`}>
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-4xl font-bold ${TYPOGRAPHY.pageTitle} text-white`}>ChatConta</h1>
                <p className="text-white/80 text-lg">Seu financeiro, mais inteligente</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className={`text-2xl font-semibold mb-8 ${TYPOGRAPHY.sectionTitle} text-white`}>Finanças pessoais inteligentes</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className={`${GLASSMORPHISM.card} p-6 ${ANIMATIONS.hoverCard}`}>
                <BarChart3 className="w-8 h-8 text-white mb-3" />
                <h3 className="font-semibold mb-2">Análises com IA</h3>
                <p className="text-white/80 text-sm">Insights automáticos das suas finanças</p>
              </div>
              <div className={`${GLASSMORPHISM.card} p-6 ${ANIMATIONS.hoverCard}`}>
                <Zap className="w-8 h-8 text-white mb-3" />
                <h3 className="font-semibold mb-2">Categorização Automática</h3>
                <p className="text-white/80 text-sm">Organização inteligente dos gastos</p>
              </div>
              <div className={`${GLASSMORPHISM.card} p-6 ${ANIMATIONS.hoverCard}`}>
                <Shield className="w-8 h-8 text-white mb-3" />
                <h3 className="font-semibold mb-2">100% Seguro</h3>
                <p className="text-white/80 text-sm">Seus dados protegidos com criptografia</p>
              </div>
              <div className={`${GLASSMORPHISM.card} p-6 ${ANIMATIONS.hoverCard}`}>
                <Smile className="w-8 h-8 text-white mb-3" />
                <h3 className="font-semibold mb-2">Insights Personalizados</h3>
                <p className="text-white/80 text-sm">Recomendações adaptadas ao seu perfil</p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="flex justify-between mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-white/80 text-sm">Usuários</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">100K+</div>
              <div className="text-white/80 text-sm">Transações</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">95%</div>
              <div className="text-white/80 text-sm">Satisfação</div>
            </div>
          </div>

          {/* Texto rodapé */}
          <p className="text-white/80 text-sm animate-fade-in" style={{ animationDelay: '0.6s' }}>
            ✨ Junte-se a milhares de pessoas que já transformaram suas finanças com IA
          </p>
        </div>
      </div>

      {/* Seção Direita - Login */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center ${UTILS.padding.page} relative z-10`}>
        <div className="w-full max-w-md animate-scale-in">
          {/* Header Mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${GRADIENTES.primary} rounded-xl flex items-center justify-center mr-3`}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h1 className={`text-2xl font-bold ${TYPOGRAPHY.pageTitle}`}>ChatConta</h1>
            </div>
          </div>

          <Card className={`${GLASSMORPHISM.card} ${ANIMATIONS.hoverCard} relative overflow-hidden`}>
            {/* Blur background interno do card */}
            <BlurBackground variant="card" />
            
            <CardHeader className="text-center relative z-10">
              <CardTitle className={`text-2xl font-bold ${TYPOGRAPHY.pageTitle}`}>Acesse sua conta</CardTitle>
              <CardDescription className={TYPOGRAPHY.body}>Escolha como deseja entrar</CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10">
              {!selectedMethod ? (
                <>
                  {/* Tabs */}
                  <Tabs value={mode} className="mb-6">
                    <TabsList className={`grid w-full grid-cols-2 ${GLASSMORPHISM.input}`}>
                      <TabsTrigger 
                        value="signin" 
                        onClick={() => navigate('/auth?mode=signin')}
                        className={`${ANIMATIONS.smooth}`}
                      >
                        Entrar
                      </TabsTrigger>
                      <TabsTrigger 
                        value="signup" 
                        onClick={() => navigate('/auth?mode=signup')}
                        className={`${ANIMATIONS.smooth}`}
                      >
                        Criar conta
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Step 1: Seleção do método */}
                  <div className="space-y-4">
                    {/* Email e senha - Ativo */}
                    <Button
                      variant="outline"
                      className={`w-full h-14 justify-start text-left ${GLASSMORPHISM.input} ${ANIMATIONS.hoverButton} border border-gray-200/50`}
                      onClick={() => setSelectedMethod('email')}
                    >
                      <Mail className="mr-3 h-5 w-5 text-blue-600" />
                      <div>
                        <div className={`font-medium ${TYPOGRAPHY.cardTitle}`}>Email e senha</div>
                        <div className={`text-sm ${TYPOGRAPHY.bodySmall}`}>Acesso tradicional com email</div>
                      </div>
                    </Button>

                    {/* WhatsApp - Em breve */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        className={`w-full h-14 justify-start text-left ${GLASSMORPHISM.input} opacity-50 cursor-not-allowed border border-gray-200/50`}
                        disabled
                      >
                        <MessageCircle className="mr-3 h-5 w-5 text-green-600" />
                        <div>
                          <div className={`font-medium ${TYPOGRAPHY.cardTitle}`}>WhatsApp</div>
                          <div className={`text-sm ${TYPOGRAPHY.bodySmall}`}>Login rápido via WhatsApp</div>
                        </div>
                      </Button>
                      <Badge className={`absolute top-2 right-2 ${STATUS_BADGES.processando.container}`}>
                        Em breve
                      </Badge>
                    </div>

                    {/* Google - Em breve */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        className={`w-full h-14 justify-start text-left ${GLASSMORPHISM.input} opacity-50 cursor-not-allowed border border-gray-200/50`}
                        disabled
                      >
                        <Search className="mr-3 h-5 w-5 text-red-600" />
                        <div>
                          <div className={`font-medium ${TYPOGRAPHY.cardTitle}`}>Google</div>
                          <div className={`text-sm ${TYPOGRAPHY.bodySmall}`}>Entre com sua conta Google</div>
                        </div>
                      </Button>
                      <Badge className={`absolute top-2 right-2 ${STATUS_BADGES.processando.container}`}>
                        Em breve
                      </Badge>
                    </div>

                    {/* Apple - Em breve */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        className={`w-full h-14 justify-start text-left ${GLASSMORPHISM.input} opacity-50 cursor-not-allowed border border-gray-200/50`}
                        disabled
                      >
                        <Apple className="mr-3 h-5 w-5 text-black" />
                        <div>
                          <div className={`font-medium ${TYPOGRAPHY.cardTitle}`}>Apple</div>
                          <div className={`text-sm ${TYPOGRAPHY.bodySmall}`}>Entre com sua conta Apple</div>
                        </div>
                      </Button>
                      <Badge className={`absolute top-2 right-2 ${STATUS_BADGES.processando.container}`}>
                        Em breve
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: Formulário específico */}
                  <div className="mb-6 animate-fade-in">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSelectedMethod(null);
                        setError('');
                        setShowForgotPassword(false);
                      }}
                      className={`flex items-center ${TYPOGRAPHY.body} ${ANIMATIONS.hoverButton}`}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                  </div>

                  {selectedMethod === 'email' && (
                    <>
                      {showForgotPassword ? (
                        <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in">
                          <div className="space-y-2">
                            <Label htmlFor="email" className={TYPOGRAPHY.label}>Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="seu@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className={`${GLASSMORPHISM.input} ${ANIMATIONS.smooth}`}
                            />
                          </div>

                          {error && (
                            <Alert className={`${GLASSMORPHISM.card} border-red-200/50 bg-red-50/80`}>
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className={`${TYPOGRAPHY.error}`}>
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
                              className={`flex-1 ${GLASSMORPHISM.input} ${ANIMATIONS.hoverButton}`}
                            >
                              Voltar
                            </Button>
                            <Button
                              type="submit"
                              className={`flex-1 bg-gradient-to-r ${GRADIENTES.primary} hover:${GRADIENTES.primaryHover} ${ANIMATIONS.hoverButton}`}
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
                        <form onSubmit={handleEmailAuth} className="space-y-4 animate-fade-in">
                          {mode === 'signup' && (
                            <div className="space-y-2">
                              <Label htmlFor="name" className={TYPOGRAPHY.label}>Nome completo</Label>
                              <Input
                                id="name"
                                type="text"
                                placeholder="Seu nome completo"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className={`${GLASSMORPHISM.input} ${ANIMATIONS.smooth}`}
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="email" className={TYPOGRAPHY.label}>Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="seu@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className={`${GLASSMORPHISM.input} ${ANIMATIONS.smooth}`}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="password" className={TYPOGRAPHY.label}>Senha</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : 'Sua senha'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={`${GLASSMORPHISM.input} ${ANIMATIONS.smooth} pr-10`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-3 ${TYPOGRAPHY.bodySmall} hover:text-gray-900 ${ANIMATIONS.smooth}`}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {mode === 'signup' && (
                              <p className={`text-xs ${TYPOGRAPHY.caption}`}>
                                Use pelo menos 8 caracteres com letras maiúsculas, minúsculas e números
                              </p>
                            )}
                          </div>
                          
                          {mode === 'signup' && (
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword" className={TYPOGRAPHY.label}>Confirmar senha</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Digite a senha novamente"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className={`${GLASSMORPHISM.input} ${ANIMATIONS.smooth}`}
                              />
                            </div>
                          )}

                          {emailSent && (
                            <Alert className={`${GLASSMORPHISM.card} border-green-200/50 bg-green-50/80`}>
                              <Mail className="h-4 w-4 text-green-600" />
                              <AlertDescription className={TYPOGRAPHY.success}>
                                Email enviado! Verifique sua caixa de entrada.
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={handleResendConfirmation}
                                  className={`ml-2 p-0 h-auto text-green-700 hover:text-green-600 ${ANIMATIONS.smooth}`}
                                  disabled={loading}
                                >
                                  Reenviar
                                </Button>
                              </AlertDescription>
                            </Alert>
                          )}

                          {error && (
                            <Alert className={`${GLASSMORPHISM.card} border-red-200/50 bg-red-50/80`}>
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className={TYPOGRAPHY.error}>
                                {error}
                              </AlertDescription>
                            </Alert>
                          )}

                          <Button
                            type="submit"
                            className={`w-full bg-gradient-to-r ${GRADIENTES.primary} hover:${GRADIENTES.primaryHover} ${ANIMATIONS.hoverButton} shadow-lg hover:shadow-xl`}
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

                          {mode === 'signin' && (
                            <div className="text-center">
                              <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className={`text-sm text-blue-600 hover:text-blue-500 ${ANIMATIONS.smooth}`}
                              >
                                Esqueceu a senha?
                              </button>
                            </div>
                          )}
                        </form>
                      )}
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <p className={`mb-2 ${TYPOGRAPHY.caption}`}>
              Por enquanto, aceita qualquer número e código para teste
            </p>
            <div className={`flex justify-center space-x-4 ${GLASSMORPHISM.card} p-3 rounded-full mx-auto w-fit`}>
              <span className="text-green-600">🔒 SSL</span>
              <span className="text-blue-600">🛡️ LGPD</span>
              <span className="text-purple-600">📋 ISO 27001</span>
            </div>
            <p className={`mt-2 ${TYPOGRAPHY.caption}`}>Protegido por criptografia de ponta a ponta</p>
          </div>
        </div>
      </div>
    </div>
  );
}