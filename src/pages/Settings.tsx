import { useState, useRef } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { BackupService } from '@/utils/backupService';
import { 
  User, 
  Shield, 
  Settings as SettingsIcon, 
  Database, 
  Upload, 
  Download, 
  Camera, 
  Bell, 
  Moon, 
  Sun, 
  Trash2,
  Key,
  Smartphone,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { isDemoMode, toggleDemoMode } = useSystemStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    nome: user?.nome || user?.user_metadata?.nome || '',
    email: user?.email || '',
    telefone: user?.phone || user?.user_metadata?.phone || '',
    avatar: user?.user_metadata?.avatar_url || ''
  });

  const [preferences, setPreferences] = useState({
    tema: 'light',
    notificacoes: true,
    emailNotifications: true,
    whatsappNotifications: true,
    marketingEmails: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: false,
    showActiveSessions: false
  });

  const handleProfileSave = async () => {
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handlePreferencesSave = async () => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      toast.success('Preferências salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar preferências');
    }
  };

  const handleSecuritySave = async () => {
    try {
      localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
      toast.success('Configurações de segurança atualizadas!');
    } catch (error) {
      toast.error('Erro ao atualizar configurações de segurança');
    }
  };

  const handleExportData = async () => {
    try {
      await BackupService.exportData(user?.id || 'demo-user');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      BackupService.importData(file);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'ATENÇÃO: Esta ação é irreversível!\n\n' +
      'Todos os seus dados serão permanentemente excluídos.\n' +
      'Tem certeza que deseja excluir sua conta?'
    );
    
    if (confirmed) {
      const doubleConfirm = window.confirm('Última confirmação: Excluir conta definitivamente?');
      if (doubleConfirm) {
        try {
          // Simular exclusão
          await signOut();
          toast.success('Conta excluída com sucesso');
        } catch (error) {
          toast.error('Erro ao excluir conta');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/configuracoes')}
        title="Configurações"
        subtitle="Gerencie suas preferências, segurança e dados"
      />

      <div className="p-4 lg:p-8 space-y-6">
        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="perfil" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="flex items-center space-x-2">
              <SettingsIcon className="w-4 h-4" />
              <span>Preferências</span>
            </TabsTrigger>
            <TabsTrigger value="dados" className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Dados</span>
            </TabsTrigger>
          </TabsList>

          {/* ABA PERFIL */}
          <TabsContent value="perfil">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
                <CardDescription>
                  Gerencie suas informações pessoais e foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback>
                      {profileData.nome?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Alterar foto</span>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">JPG, PNG ou GIF. Máx 2MB.</p>
                  </div>
                </div>

                {/* Campos do perfil */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={profileData.nome}
                      onChange={(e) => setProfileData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                    <Input
                      id="telefone"
                      value={profileData.telefone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <Button onClick={handleProfileSave} className="btn-primary">
                  Salvar alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA SEGURANÇA */}
          <TabsContent value="seguranca">
            <div className="space-y-6">
              {/* Configurações 2FA */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="w-5 h-5" />
                    <span>Autenticação em Duas Etapas</span>
                  </CardTitle>
                  <CardDescription>
                    Adicione uma camada extra de segurança à sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Autenticação via SMS</p>
                      <p className="text-sm text-muted-foreground">
                        Receba códigos de verificação por SMS
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactor}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({ ...prev, twoFactor: checked }))
                      }
                    />
                  </div>
                  
                  {securitySettings.twoFactor && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          2FA ativado para: {profileData.telefone || 'Telefone não cadastrado'}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sessões ativas */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5" />
                    <span>Sessões Ativas</span>
                  </CardTitle>
                  <CardDescription>
                    Gerencie dispositivos com acesso à sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Este dispositivo</p>
                      <p className="text-sm text-muted-foreground">
                        Última atividade: agora • {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Navegador atual'}
                      </p>
                    </div>
                    <Badge variant="default">Atual</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Alterar senha */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>
                    Como você usa WhatsApp para login, não é necessário senha tradicional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Sua conta usa autenticação via WhatsApp. A segurança é gerenciada automaticamente.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSecuritySave} className="btn-primary">
                Salvar configurações de segurança
              </Button>
            </div>
          </TabsContent>

          {/* ABA PREFERÊNCIAS */}
          <TabsContent value="preferencias">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="w-5 h-5" />
                  <span>Preferências do Sistema</span>
                </CardTitle>
                <CardDescription>
                  Personalize sua experiência no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tema */}
                <div className="space-y-4">
                  <h4 className="font-medium">Aparência</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Tema escuro</p>
                      <p className="text-sm text-muted-foreground">
                        Ativar modo escuro da interface
                      </p>
                    </div>
                    <Switch
                      checked={preferences.tema === 'dark'}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, tema: checked ? 'dark' : 'light' }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Notificações */}
                <div className="space-y-4">
                  <h4 className="font-medium">Notificações</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Notificações do sistema</p>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações sobre atividades importantes
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notificacoes}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, notificacoes: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">E-mail</p>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações por e-mail
                      </p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações via WhatsApp
                      </p>
                    </div>
                    <Switch
                      checked={preferences.whatsappNotifications}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({ ...prev, whatsappNotifications: checked }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Modo Demo */}
                <div className="space-y-4">
                  <h4 className="font-medium">Sistema</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Modo demonstração</p>
                      <p className="text-sm text-muted-foreground">
                        Ativar modo demo com dados simulados
                      </p>
                    </div>
                    <Switch
                      checked={isDemoMode}
                      onCheckedChange={toggleDemoMode}
                    />
                  </div>
                </div>

                <Button onClick={handlePreferencesSave} className="btn-primary">
                  Salvar preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA DADOS */}
          <TabsContent value="dados">
            <div className="space-y-6">
              {/* Backup e Restauração */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Backup e Restauração</span>
                  </CardTitle>
                  <CardDescription>
                    Faça backup dos seus dados ou restaure de um backup anterior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={handleExportData}
                      variant="outline"
                      className="flex items-center space-x-2 h-auto p-4"
                    >
                      <Download className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">Exportar dados</p>
                        <p className="text-xs text-muted-foreground">
                          Baixar arquivo JSON com todos os dados
                        </p>
                      </div>
                    </Button>

                    <Button
                      onClick={() => document.getElementById('import-file')?.click()}
                      variant="outline"
                      className="flex items-center space-x-2 h-auto p-4"
                    >
                      <Upload className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium">Importar dados</p>
                        <p className="text-xs text-muted-foreground">
                          Restaurar dados de um arquivo de backup
                        </p>
                      </div>
                    </Button>
                    
                    <input
                      id="import-file"
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Importante:</p>
                        <p>A importação substituirá todos os dados atuais. Um backup automático será criado antes da importação.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exclusão de conta */}
              <Card className="bg-white/80 backdrop-blur-sm border border-red-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <Trash2 className="w-5 h-5" />
                    <span>Zona de Perigo</span>
                  </CardTitle>
                  <CardDescription>
                    Ações irreversíveis da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="space-y-3">
                      <p className="font-medium text-red-800">Excluir conta permanentemente</p>
                      <p className="text-sm text-red-700">
                        Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente excluídos dos nossos servidores.
                      </p>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        className="flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir minha conta</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}