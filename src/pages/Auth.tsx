import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, ArrowLeft, Send, Shield, TrendingUp, Users, DollarSign, BarChart3, Sparkles, CheckCircle, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { GRADIENTES, GLASSMORPHISM, ANIMATIONS } from '@/constants/designSystem';

export default function Auth() {
  const { signInWithWhatsApp, signUpWithWhatsApp, verifyCode, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [formData, setFormData] = useState({
    whatsapp: '',
    code: '',
    nome: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara (xx) xxxxx-xxxx
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return value;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.whatsapp) return;
    
    // Validar formato do WhatsApp
    const numbers = formData.whatsapp.replace(/\D/g, '');
    if (numbers.length < 11) {
      toast({ title: 'Atenção', description: 'Por favor, digite um número válido' });
      return;
    }
    
    setFormLoading(true);
    
    try {
      if (mode === 'signup') {
        if (!formData.nome.trim()) {
          toast({ title: 'Atenção', description: 'Por favor, digite seu nome' });
          setFormLoading(false);
          return;
        }
        await signUpWithWhatsApp(formData.whatsapp, { nome: formData.nome });
      } else {
        await signInWithWhatsApp(formData.whatsapp);
      }
      
      setCodeSent(true);
      setStep('code');
      toast({ title: 'Sucesso', description: 'Código enviado para seu WhatsApp!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao enviar código', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) return;
    
    setFormLoading(true);
    try {
      const result = await verifyCode(formData.whatsapp, formData.code);
      
      if (result.needsOnboarding) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Código inválido', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

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
                  JC Financeiro
                </h1>
                <p className="text-xl text-blue-100 font-medium">
                  O futuro da gestão financeira
                </p>
              </div>
            </div>

            {/* Features em destaque */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-6 text-white">
                  Transforme sua gestão financeira
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white">Dashboard Inteligente</p>
                </div>
                
                <div className="text-center space-y-2 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white">Automação Total</p>
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
                  <p className="text-sm font-medium text-white">Multi-empresa</p>
                </div>
              </div>

              {/* Stats impressionantes */}
              <div className="flex justify-center space-x-8 pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-xs text-blue-100">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-xs text-blue-100">Empresas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-xs text-blue-100">Suporte</div>
                </div>
              </div>
            </div>

            {/* Call to action secundário */}
            <div className="pt-6">
              <p className="text-blue-100 text-sm">
                ✨ Junte-se a milhares de empresas que já transformaram sua gestão financeira
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
                  JC Financeiro
                </h1>
                <p className="text-muted-foreground">Sistema de gestão financeira</p>
              </div>
            </div>

            {/* Card do formulário com glassmorphism */}
            <Card className={`${GLASSMORPHISM.card} ${GLASSMORPHISM.cardHover} ${ANIMATIONS.smooth} animate-scale-in`}>
              <CardHeader className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  {step === 'phone' ? 'Acesse sua conta' : 'Verificação de segurança'}
                </CardTitle>
                <CardDescription>
                  {step === 'phone' 
                    ? 'Digite seu WhatsApp para continuar' 
                    : 'Confirme o código enviado para seu WhatsApp'
                  }
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {step === 'code' ? (
                  // Tela de verificação de código
                  <form onSubmit={handleVerifyCode} className="space-y-6">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Código enviado!</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Enviamos um código para<br />
                          <span className="font-medium text-green-600">{formData.whatsapp}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Código de verificação</Label>
                      <Input
                        id="code"
                        type="text"
                        value={formData.code}
                        onChange={(e) => handleInputChange('code', e.target.value)}
                        className={`${GLASSMORPHISM.input} text-center text-lg tracking-widest font-mono`}
                        placeholder="123456"
                        maxLength={6}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className={`w-full btn-primary ${ANIMATIONS.fast}`}
                      disabled={formLoading}
                    >
                      {formLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Verificando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar código
                        </>
                      )}
                    </Button>

                    <div className="text-center space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('phone');
                          setCodeSent(false);
                          setFormData(prev => ({ ...prev, code: '' }));
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ← Alterar número
                      </button>
                      <div>
                        <button
                          type="button"
                          onClick={handleSendCode}
                          className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                          disabled={formLoading}
                        >
                          Reenviar código
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  // Tela de inserção do número
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
                      <form onSubmit={handleSendCode} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp" className="text-sm font-medium text-gray-700">
                            Número do WhatsApp
                          </Label>
                          <Input
                            id="whatsapp"
                            type="tel"
                            value={formatWhatsApp(formData.whatsapp)}
                            onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                            className={GLASSMORPHISM.input}
                            placeholder="(11) 99999-9999"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Digite seu número com DDD
                          </p>
                        </div>

                        <Button
                          type="submit"
                          className={`w-full btn-primary ${ANIMATIONS.fast}`}
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
                              Enviar código
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4">
                      <form onSubmit={handleSendCode} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                            Nome completo
                          </Label>
                          <Input
                            id="nome"
                            type="text"
                            value={formData.nome}
                            onChange={(e) => handleInputChange('nome', e.target.value)}
                            className={GLASSMORPHISM.input}
                            placeholder="Seu nome completo"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="whatsapp-signup" className="text-sm font-medium text-gray-700">
                            Número do WhatsApp
                          </Label>
                          <Input
                            id="whatsapp-signup"
                            type="tel"
                            value={formatWhatsApp(formData.whatsapp)}
                            onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                            className={GLASSMORPHISM.input}
                            placeholder="(11) 99999-9999"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            Digite seu número com DDD
                          </p>
                        </div>

                        <Button
                          type="submit"
                          className={`w-full btn-primary ${ANIMATIONS.fast}`}
                          disabled={formLoading}
                        >
                          {formLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                              Criando conta...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Criar conta grátis
                            </>
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Footer informativo */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-blue-50/50 rounded-lg p-3">
                    <Shield className="w-3 h-3 text-blue-600" />
                    <span>Por enquanto, aceita qualquer número e código para teste</span>
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