import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Database,
  Shield,
  Zap,
  Monitor
} from "lucide-react";

interface StatusItem {
  nome: string;
  status: 'ok' | 'warning' | 'error';
  descricao: string;
  detalhes?: string;
}

export function SistemaStatus() {
  const [loading, setLoading] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date>(new Date());
  
  const [status, setStatus] = useState<StatusItem[]>([
    {
      nome: 'Validações',
      status: 'ok',
      descricao: 'Sistema de validações funcionando',
      detalhes: 'Todas as validações de formulário estão ativas'
    },
    {
      nome: 'Componentes',
      status: 'ok', 
      descricao: 'Componentes carregados com sucesso',
      detalhes: 'Todas as páginas e modais funcionando'
    },
    {
      nome: 'Responsividade',
      status: 'ok',
      descricao: 'Layout responsivo ativo',
      detalhes: 'Design adaptativo para mobile e desktop'
    },
    {
      nome: 'Performance',
      status: 'ok',
      descricao: 'Sistema otimizado',
      detalhes: 'Componentes com lazy loading e cache'
    },
    {
      nome: 'Banco de Dados',
      status: 'warning',
      descricao: 'Usando dados mock',
      detalhes: 'Pronto para integração com Supabase'
    }
  ]);

  useEffect(() => {
    // Simular verificação de status
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const verificarStatus = () => {
    setLoading(true);
    setTimeout(() => {
      setUltimaAtualizacao(new Date());
      setLoading(false);
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100/80 text-green-700 border-green-200/50';
      case 'warning':
        return 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50';
      case 'error':
        return 'bg-red-100/80 text-red-700 border-red-200/50';
      default:
        return 'bg-gray-100/80 text-gray-700 border-gray-200/50';
    }
  };

  const statusGeral = status.every(s => s.status === 'ok') ? 'ok' : 
                     status.some(s => s.status === 'error') ? 'error' : 'warning';

  const progressoImplementacao = 85; // Percentual baseado nas fases implementadas

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Monitor className="w-5 h-5 mr-2 text-blue-600" />
            Status do Sistema
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={verificarStatus}
            disabled={loading}
            className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl hover:bg-white/90"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Geral */}
        <Alert className={`border rounded-xl backdrop-blur-sm ${getStatusColor(statusGeral)}`}>
          <div className="flex items-center">
            {getStatusIcon(statusGeral)}
            <AlertDescription className="ml-2 font-medium">
              {statusGeral === 'ok' && 'Sistema funcionando normalmente'}
              {statusGeral === 'warning' && 'Sistema funcionando com avisos'}
              {statusGeral === 'error' && 'Sistema com problemas críticos'}
            </AlertDescription>
          </div>
        </Alert>

        {/* Progresso da Implementação */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Progresso da Implementação</span>
            <span className="text-gray-600">{progressoImplementacao}%</span>
          </div>
          <Progress value={progressoImplementacao} className="h-2" />
          <p className="text-xs text-gray-500">
            Fases 1-3 concluídas. Fase 4 em andamento.
          </p>
        </div>

        {/* Status Individual */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Componentes do Sistema</h4>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {status.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg backdrop-blur-sm border border-gray-200/50"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="font-medium text-gray-900">{item.nome}</div>
                      <div className="text-sm text-gray-600">{item.descricao}</div>
                      {item.detalhes && (
                        <div className="text-xs text-gray-500 mt-1">{item.detalhes}</div>
                      )}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(item.status)} rounded-full backdrop-blur-sm border`}>
                    {item.status === 'ok' && 'OK'}
                    {item.status === 'warning' && 'Aviso'}
                    {item.status === 'error' && 'Erro'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Última Atualização */}
        <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200/50">
          Última verificação: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
}