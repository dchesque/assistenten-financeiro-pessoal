import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MessageCircle, Shield, Clock, Check } from 'lucide-react';
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
      {/* Background abstratos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative min-h-screen flex">
        {/* Seção Hero - Desktop */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                JC Financeiro
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Gerencie suas finanças de forma simples e segura
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Login rápido via WhatsApp</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Seus dados estão seguros</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Acesso em segundos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Auth */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
          <div className="w-full max-w-md">
            {/* Header Mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">JC Financeiro</h1>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-2xl">
              <CardHeader className="text-center">
                {step === 'phone' ? (
                  <>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Entre com WhatsApp
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Rápido, seguro e sem senha
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Digite o código
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Enviamos um código para {formData.phone}
                    </CardDescription>
                  </>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {step === 'phone' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Número do WhatsApp
                      </label>
                      <Input
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={handlePhoneInput}
                        maxLength={15}
                        className="bg-white/80 backdrop-blur-sm border-gray-300/50"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => handleInputChange('acceptTerms', !!checked)}
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600">
                        Li e aceito os{' '}
                        <a href="#" className="text-blue-600 hover:underline">
                          termos de uso
                        </a>
                      </label>
                    </div>

                    <Button
                      onClick={handleSendCode}
                      disabled={loading || !formData.acceptTerms}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium h-12"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Enviando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4" />
                          <span>Continuar com WhatsApp</span>
                        </div>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-center space-x-2">
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
                            className="w-12 h-12 text-center text-lg font-semibold bg-white/80 backdrop-blur-sm border-gray-300/50"
                          />
                        ))}
                      </div>

                      <div className="text-center">
                        <button
                          onClick={handleResendCode}
                          disabled={resendCountdown > 0}
                          className={`text-sm ${
                            resendCountdown > 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-blue-600 hover:underline'
                          }`}
                        >
                          {resendCountdown > 0
                            ? `Reenviar código em ${resendCountdown}s`
                            : 'Reenviar código'
                          }
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep('phone')}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                      </Button>
                      <Button
                        onClick={() => handleVerifyOtp()}
                        disabled={loading || formData.otp.join('').length !== 6}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          'Verificar'
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {/* Footer de segurança */}
                <div className="text-center pt-4 border-t border-gray-200/50">
                  <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Seus dados estão seguros</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}