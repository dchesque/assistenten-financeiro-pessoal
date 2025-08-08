import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BlurBackground } from '@/components/ui/BlurBackground';
import { ArrowLeft, MessageCircle, Shield, Clock, Check, Users, TrendingUp, Award, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithWhatsApp, verifyOtp, loading, isAuthenticated } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [formData, setFormData] = useState({
    phone: '',
    otp: ['', '', '', '', '', ''],
    acceptTerms: false,
    rememberMe: false
  });
  const [resendCountdown, setResendCountdown] = useState(0);

  // Redirect se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const returnUrl = searchParams.get('returnUrl') || '/dashboard';
      navigate(returnUrl);
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Countdown para reenvio
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      const formatted = numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      return formatted;
    }
    return value;
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    handleInputChange('phone', formatted);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData(prev => ({ ...prev, otp: newOtp }));
    
    // Auto-focus próximo campo
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
    
    // Auto-submit quando completar
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleSendCode = async () => {
    if (!formData.acceptTerms) {
      toast.error('Aceite os termos de uso para continuar');
      return;
    }

    if (formData.phone.replace(/\D/g, '').length < 11) {
      toast.error('Digite um número de WhatsApp válido');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const { error } = await signInWithWhatsApp(`+55${cleanPhone}`);
    
    if (!error) {
      setStep('otp');
      setResendCountdown(60);
    }
  };

  const handleVerifyOtp = async (otpCode?: string) => {
    const code = otpCode || formData.otp.join('');
    if (code.length !== 6) {
      toast.error('Digite o código completo');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const { error } = await verifyOtp(`+55${cleanPhone}`, code);
    
    if (!error) {
      const returnUrl = searchParams.get('returnUrl') || '/dashboard';
      navigate(returnUrl);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    
    const cleanPhone = formData.phone.replace(/\D/g, '');
    const { error } = await signInWithWhatsApp(`+55${cleanPhone}`);
    
    if (!error) {
      setResendCountdown(60);
      setFormData(prev => ({ ...prev, otp: ['', '', '', '', '', ''] }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstratos com BlurBackground */}
      <BlurBackground variant="page" />

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Hero Section - Lado Esquerdo */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 relative">
          <div className="max-w-lg mx-auto">
            {/* Logo da Empresa */}
            <div className="flex items-center justify-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
                <MessageCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Título Principal */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                JC Financeiro
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                A maneira mais simples de gerenciar suas finanças
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Login Instantâneo</h3>
                  <p className="text-gray-600 text-sm">Acesse via WhatsApp em segundos</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Segurança Total</h3>
                  <p className="text-gray-600 text-sm">Seus dados protegidos e criptografados</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Controle Inteligente</h3>
                  <p className="text-gray-600 text-sm">Relatórios e análises automáticas</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">1000+</div>
                <div className="text-sm text-gray-600">Empresas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
                <div className="text-sm text-gray-600">Suporte</div>
              </div>
            </div>

            {/* CTA Footer */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 text-sm">
                Já possui uma conta? Faça login ao lado →
              </p>
            </div>
          </div>
        </div>

        {/* Auth Section - Lado Direito */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Header Mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">JC Financeiro</h1>
              <p className="text-gray-600">Gerencie suas finanças com simplicidade</p>
            </div>

            <Card className="bg-white/90 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="text-center space-y-4 pb-6">
                {step === 'phone' ? (
                  <>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Faça seu login
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                      Entre com seu WhatsApp de forma rápida e segura
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Confirme seu código
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base">
                      Enviamos um código de verificação para<br />
                      <span className="font-semibold text-gray-900">{formData.phone}</span>
                    </CardDescription>
                  </>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {step === 'phone' ? (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 block">
                        Número do WhatsApp *
                      </label>
                      <Input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={handlePhoneInput}
                        maxLength={15}
                        className="h-12 text-base bg-white/80 backdrop-blur-sm border-gray-300/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => handleInputChange('acceptTerms', !!checked)}
                        className="mt-1"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                        Concordo com os{' '}
                        <a href="#" className="text-blue-600 hover:underline font-medium">
                          Termos de Uso
                        </a>{' '}
                        e{' '}
                        <a href="#" className="text-blue-600 hover:underline font-medium">
                          Política de Privacidade
                        </a>
                      </label>
                    </div>

                    <Button
                      onClick={handleSendCode}
                      disabled={loading || !formData.acceptTerms}
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Enviando código...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-5 h-5" />
                          <span>Continuar com WhatsApp</span>
                        </div>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div className="flex justify-center space-x-3">
                        {formData.otp.map((digit, index) => (
                          <Input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            className="w-14 h-14 text-center text-xl font-bold bg-white/90 backdrop-blur-sm border-gray-300/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                          />
                        ))}
                      </div>

                      <div className="text-center space-y-3">
                        <button
                          onClick={handleResendCode}
                          disabled={resendCountdown > 0}
                          className={`text-sm font-medium transition-colors ${
                            resendCountdown > 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-blue-600 hover:text-blue-700 hover:underline'
                          }`}
                        >
                          {resendCountdown > 0
                            ? `Reenviar código em ${resendCountdown}s`
                            : 'Não recebeu? Reenviar código'
                          }
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep('phone')}
                        className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      <Button
                        onClick={() => handleVerifyOtp()}
                        disabled={loading || formData.otp.join('').length !== 6}
                        className="flex-2 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          'Verificar Código'
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {/* Footer de Segurança */}
                <div className="text-center pt-6 border-t border-gray-200/50">
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Conexão segura e dados criptografados</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}