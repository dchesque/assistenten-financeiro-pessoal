import React, { useState } from 'react';
import { Shield, Key, Eye, EyeOff, Smartphone, Clock, Trash2, Save, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/hooks/use-toast';

interface ConfiguracoesSeguranca {
  two_factor_enabled: boolean;
  login_notifications: boolean;
  session_timeout: number;
  backup_codes_generated: boolean;
}

interface SessaoAtiva {
  id: string;
  device: string;
  location: string;
  last_activity: string;
  is_current: boolean;
}

export function SecurityTab() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [mostrarExclusao, setMostrarExclusao] = useState(false);

  // Configurações de segurança
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSeguranca>({
    two_factor_enabled: false,
    login_notifications: true,
    session_timeout: 30,
    backup_codes_generated: false
  });

  // Sessões ativas mockadas
  const [sessoesAtivas] = useState<SessaoAtiva[]>([
    {
      id: '1',
      device: 'Chrome - Windows',
      location: 'São Paulo, SP',
      last_activity: '2024-01-10T14:30:00',
      is_current: true
    },
    {
      id: '2',
      device: 'Mobile App - Android',
      location: 'São Paulo, SP',
      last_activity: '2024-01-09T18:45:00',
      is_current: false
    }
  ]);

  const alterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    if (novaSenha.length < 8) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 8 caracteres', variant: 'destructive' });
      return;
    }

    setAlterandoSenha(true);
    try {
      // Simular alteração de senha
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Sucesso', description: 'Senha alterada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao alterar senha', variant: 'destructive' });
    } finally {
      setAlterandoSenha(false);
    }
  };

  const salvarConfiguracoes = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({ title: 'Sucesso', description: 'Configurações de segurança salvas!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar configurações', variant: 'destructive' });
    }
  };

  const excluirConta = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Conta excluída', description: 'Sua conta foi excluída permanentemente' });
      setMostrarExclusao(false);
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir conta', variant: 'destructive' });
    }
  };

  const encerrarSessao = async (sessaoId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({ title: 'Sucesso', description: 'Sessão encerrada com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao encerrar sessão', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alterar Senha */}
      <Card className="glassmorphism-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Alterar Senha</span>
          </CardTitle>
          <CardDescription>
            Mantenha sua conta segura com uma senha forte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senha-atual">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="senha-atual"
                  type={mostrarSenhas ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Mostrar senhas</Label>
                <Switch
                  checked={mostrarSenhas}
                  onCheckedChange={setMostrarSenhas}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova Senha</Label>
              <Input
                id="nova-senha"
                type={mostrarSenhas ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite a nova senha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
              <Input
                id="confirmar-senha"
                type={mostrarSenhas ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={alterarSenha} 
              disabled={alterandoSenha}
              className="btn-primary"
            >
              {alterandoSenha && <div className="loading-spinner mr-2" />}
              <Save className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Segurança */}
      <Card className="glassmorphism-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Configurações de Segurança</span>
          </CardTitle>
          <CardDescription>
            Configure as opções de segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação em duas etapas (2FA)</Label>
              <p className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança à sua conta
              </p>
            </div>
            <Switch
              checked={configuracoes.two_factor_enabled}
              onCheckedChange={(checked) => 
                setConfiguracoes(prev => ({ ...prev, two_factor_enabled: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações de login</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas sobre novos acessos à sua conta
              </p>
            </div>
            <Switch
              checked={configuracoes.login_notifications}
              onCheckedChange={(checked) => 
                setConfiguracoes(prev => ({ ...prev, login_notifications: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Timeout da sessão</Label>
              <p className="text-sm text-muted-foreground">
                Tempo até o logout automático (em minutos)
              </p>
            </div>
            <Input
              type="number"
              value={configuracoes.session_timeout}
              onChange={(e) => 
                setConfiguracoes(prev => ({ ...prev, session_timeout: parseInt(e.target.value) || 30 }))
              }
              className="w-20"
              min="5"
              max="480"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={salvarConfiguracoes} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessões Ativas */}
      <Card className="glassmorphism-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>Sessões Ativas</span>
          </CardTitle>
          <CardDescription>
            Gerencie onde você está conectado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessoesAtivas.map((sessao) => (
            <div key={sessao.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium flex items-center space-x-2">
                    <span>{sessao.device}</span>
                    {sessao.is_current && (
                      <Badge variant="secondary" className="text-xs">
                        Atual
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{sessao.location}</p>
                  <p className="text-xs text-muted-foreground flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Última atividade: {new Date(sessao.last_activity).toLocaleDateString('pt-BR')}</span>
                  </p>
                </div>
              </div>
              {!sessao.is_current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => encerrarSessao(sessao.id)}
                >
                  Encerrar
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="glassmorphism-card border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Zona de Perigo</span>
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Atenção:</strong> A exclusão da conta é permanente e não pode ser desfeita. 
              Todos os seus dados serão perdidos.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={() => setMostrarExclusao(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmação para exclusão */}
      <ConfirmDialog
        open={mostrarExclusao}
        onOpenChange={setMostrarExclusao}
        title="Excluir Conta"
        description="Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos permanentemente."
        confirmText="Sim, excluir conta"
        cancelText="Cancelar"
        onConfirm={excluirConta}
        variant="destructive"
      />
    </div>
  );
}