import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BlurBackground } from '@/components/ui/BlurBackground';

interface Error500Props {
  error?: Error;
  resetError?: () => void;
}

export function Error500({ error, resetError }: Error500Props) {
  const navigate = useNavigate();

  useEffect(() => {
    // Log do erro para auditoria
    if (error) {
      import('@/services/logService').then(({ logService }) => {
        logService.logError(error, 'error-500');
      });
    }
  }, [error]);

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleSupport = () => {
    const message = encodeURIComponent(
      `Olá! Estou enfrentando um erro interno no sistema (Error 500). 
      
Detalhes:
- Página: ${window.location.href}
- Horário: ${new Date().toLocaleString('pt-BR')}
- Erro: ${error?.message || 'Erro interno do servidor'}

Pode me ajudar a resolver?`
    );
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center p-4">
      <BlurBackground variant="page" />
      
      <Card className="w-full max-w-md card-base">
        <CardContent className="p-8 text-center space-y-6">
          {/* Ícone de erro */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100/80 backdrop-blur-sm rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Título e descrição */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Erro Interno do Servidor
            </h1>
            <p className="text-gray-600">
              Ocorreu um erro interno no sistema. Nossa equipe foi notificada automaticamente.
            </p>
          </div>

          {/* Detalhes técnicos (se disponível) */}
          {error && import.meta.env.DEV && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-lg p-4 text-left">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Detalhes do erro (apenas em desenvolvimento):
              </h3>
              <code className="text-xs text-red-700 break-all">
                {error.message}
              </code>
            </div>
          )}

          {/* Ações */}
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full btn-primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="bg-white/80 backdrop-blur-sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>

              <Button 
                variant="outline" 
                onClick={handleSupport}
                className="bg-white/80 backdrop-blur-sm"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Suporte
              </Button>
            </div>

            <Link 
              to="/" 
              className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Voltar ao início
            </Link>
          </div>

          {/* Informações de contato */}
          <div className="pt-4 border-t border-gray-200/50">
            <p className="text-xs text-gray-500">
              Se o problema persistir, entre em contato conosco pelo WhatsApp.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Error500;