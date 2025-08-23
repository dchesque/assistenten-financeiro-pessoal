import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Shield,
  Mail,
  Server
} from 'lucide-react';

interface HealthStatus {
  name: string;
  status: 'ok' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function SupabaseHealthCheck() {
  const [checks, setChecks] = useState<HealthStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const runHealthChecks = async () => {
    setLoading(true);
    const newChecks: HealthStatus[] = [];

    try {
      // 1. Verificar configuração básica
      if (supabase.supabaseUrl && supabase.supabaseKey) {
        newChecks.push({
          name: 'Configuração Supabase',
          status: 'ok',
          message: 'URL e Key configurados',
          details: {
            url: supabase.supabaseUrl,
            keyPrefix: supabase.supabaseKey.substring(0, 20) + '...'
          }
        });
      } else {
        newChecks.push({
          name: 'Configuração Supabase',
          status: 'error',
          message: 'URL ou Key faltando'
        });
      }

      // 2. Verificar sessão atual
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          newChecks.push({
            name: 'Sessão Auth',
            status: 'error',
            message: `Erro na sessão: ${sessionError.message}`
          });
        } else {
          newChecks.push({
            name: 'Sessão Auth',
            status: session ? 'ok' : 'warning',
            message: session ? `Usuário logado: ${session.user.email}` : 'Nenhum usuário logado',
            details: session ? {
              userId: session.user.id,
              email: session.user.email,
              expiresAt: session.expires_at
            } : null
          });
        }
      } catch (err: any) {
        newChecks.push({
          name: 'Sessão Auth',
          status: 'error',
          message: `Exceção: ${err.message}`
        });
      }

      // 3. Testar conexão com database
      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (dbError) {
          newChecks.push({
            name: 'Conexão Database',
            status: 'error',
            message: `Erro DB: ${dbError.message}`,
            details: dbError
          });
        } else {
          newChecks.push({
            name: 'Conexão Database',
            status: 'ok',
            message: 'Conectado ao banco de dados'
          });
        }
      } catch (err: any) {
        newChecks.push({
          name: 'Conexão Database',
          status: 'error',
          message: `Exceção DB: ${err.message}`
        });
      }

      // 4. Verificar configurações de auth
      try {
        const { data: authSettings } = await supabase.auth.getSettings();
        newChecks.push({
          name: 'Configurações Auth',
          status: 'ok',
          message: 'Configurações carregadas',
          details: authSettings
        });
      } catch (err: any) {
        newChecks.push({
          name: 'Configurações Auth',
          status: 'warning',
          message: 'Não foi possível verificar configurações'
        });
      }

      // 5. Teste de signup fictício (não criar usuário)
      try {
        // Testar com email inválido para ver a resposta
        const { error: testError } = await supabase.auth.signUp({
          email: 'test@invalid.domain',
          password: 'test123'
        });
        
        if (testError) {
          if (testError.message.includes('domain') || testError.message.includes('email')) {
            newChecks.push({
              name: 'Funcionalidade SignUp',
              status: 'ok',
              message: 'SignUp funcionando (rejeitou email inválido)'
            });
          } else {
            newChecks.push({
              name: 'Funcionalidade SignUp',
              status: 'warning',
              message: `SignUp responde: ${testError.message}`,
              details: testError
            });
          }
        } else {
          newChecks.push({
            name: 'Funcionalidade SignUp',
            status: 'warning',
            message: 'SignUp não rejeitou email inválido'
          });
        }
      } catch (err: any) {
        newChecks.push({
          name: 'Funcionalidade SignUp',
          status: 'error',
          message: `Erro no teste: ${err.message}`
        });
      }

    } catch (globalError: any) {
      newChecks.push({
        name: 'Health Check',
        status: 'error',
        message: `Erro global: ${globalError.message}`
      });
    }

    setChecks(newChecks);
    setLoading(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <RefreshCw className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Server className="w-5 h-5" />
          Verificação do Supabase
        </CardTitle>
        <Button 
          onClick={runHealthChecks} 
          disabled={loading}
          size="sm"
          variant="outline"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Verificar
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {checks.map((check, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg border ${getStatusColor(check.status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status)}
                <span className="font-medium">{check.name}</span>
              </div>
              <Badge variant="outline" className={getStatusColor(check.status)}>
                {check.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm mt-1 ml-6">{check.message}</p>
            {check.details && (
              <details className="ml-6 mt-2">
                <summary className="text-xs cursor-pointer text-gray-600">
                  Ver detalhes
                </summary>
                <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-x-auto">
                  {JSON.stringify(check.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
        
        {checks.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Clique em "Verificar" para executar os testes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}