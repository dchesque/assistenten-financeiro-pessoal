import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Building2, ArrowLeft, Send, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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
      toast.error('Por favor, digite um número válido');
      return;
    }
    
    setFormLoading(true);
    
    try {
      if (mode === 'signup') {
        if (!formData.nome.trim()) {
          toast.error('Por favor, digite seu nome');
          setFormLoading(false);
          return;
        }
        await signUpWithWhatsApp(formData.whatsapp, { nome: formData.nome });
      } else {
        await signInWithWhatsApp(formData.whatsapp);
      }
      
      setCodeSent(true);
      setStep('code');
      toast.success('Código enviado para seu WhatsApp!');
    } catch (error) {
      toast.error('Erro ao enviar código');
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) return;
    
    setFormLoading(true);
    try {
      await verifyCode(formData.whatsapp, formData.code);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Código inválido');
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
      {/* Blur backgrounds abstratos */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Link para voltar */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Link>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  JC Financeiro
                </CardTitle>
                <CardDescription>
                  {step === 'phone' ? 'Entre com seu número do WhatsApp' : 'Digite o código enviado'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {step === 'code' ? (
                // Tela de verificação de código
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="text-center space-y-2">
                    <Shield className="w-12 h-12 text-green-600 mx-auto" />
                    <h3 className="text-lg font-semibold">Verificação</h3>
                    <p className="text-sm text-muted-foreground">
                      Enviamos um código para<br />
                      <strong>{formData.whatsapp}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Código de verificação</Label>
                    <Input
                      id="code"
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      className="bg-white/80 backdrop-blur-sm text-center text-lg tracking-widest"
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Verificando...' : 'Confirmar código'}
                  </Button>

                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('phone');
                        setCodeSent(false);
                        setFormData(prev => ({ ...prev, code: '' }));
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Alterar número
                    </button>
                    <br />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      className="text-sm text-green-600 hover:text-green-700"
                      disabled={formLoading}
                    >
                      Reenviar código
                    </button>
                  </div>
                </form>
              ) : (
                // Tela de inserção do número
                <Tabs value={mode === 'signup' ? 'signup' : 'login'} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100/50">
                    <TabsTrigger value="login" onClick={() => navigate('/auth')}>Entrar</TabsTrigger>
                    <TabsTrigger value="signup" onClick={() => navigate('/auth?mode=signup')}>Cadastrar</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleSendCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">Número do WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          type="tel"
                          value={formatWhatsApp(formData.whatsapp)}
                          onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                          className="bg-white/80 backdrop-blur-sm"
                          placeholder="(11) 99999-9999"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Digite seu número com DDD
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        disabled={formLoading}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {formLoading ? 'Enviando código...' : 'Enviar código'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSendCode} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome completo</Label>
                        <Input
                          id="nome"
                          type="text"
                          value={formData.nome}
                          onChange={(e) => handleInputChange('nome', e.target.value)}
                          className="bg-white/80 backdrop-blur-sm"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-signup">Número do WhatsApp</Label>
                        <Input
                          id="whatsapp-signup"
                          type="tel"
                          value={formatWhatsApp(formData.whatsapp)}
                          onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                          className="bg-white/80 backdrop-blur-sm"
                          placeholder="(11) 99999-9999"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Digite seu número com DDD
                        </p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        disabled={formLoading}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {formLoading ? 'Criando conta...' : 'Criar conta'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}

              <div className="mt-6 text-center text-xs text-muted-foreground">
                <p>Por enquanto, aceita qualquer número e código para teste</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}