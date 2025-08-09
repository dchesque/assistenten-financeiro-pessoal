import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Monitor, Sun, Moon, Globe, Bell, Settings as SettingsIcon, RotateCcw } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { SettingsUpdateData, TIMEZONE_OPTIONS, LOCALE_OPTIONS, CURRENCY_OPTIONS, DATE_FORMAT_OPTIONS, START_PAGE_OPTIONS } from '@/types/settings';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Configuracoes() {
  const { data: settings, isLoading, isSaving, error, isDirty, save, resetToDefault, updateLocal } = useSettings();
  const [localChanges, setLocalChanges] = useState<SettingsUpdateData>({});

  const handleFieldChange = (field: keyof SettingsUpdateData, value: any) => {
    const changes = { ...localChanges, [field]: value };
    setLocalChanges(changes);
    updateLocal({ [field]: value });
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    const notifications = { ...localChanges.notifications, [key]: value };
    const changes = { ...localChanges, notifications };
    setLocalChanges(changes);
    updateLocal({ notifications });
  };

  const handleSave = async () => {
    if (Object.keys(localChanges).length === 0) return;
    
    try {
      await save(localChanges);
      setLocalChanges({});
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleReset = async () => {
    try {
      await resetToDefault();
      setLocalChanges({});
    } catch (error) {
      console.error('Erro ao restaurar:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        </div>
        <LoadingSkeleton lines={3} height="h-48" type="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {isDirty && (
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!isDirty || isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="aparencia" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="aparencia" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="regiao" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Região
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aparencia">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência da interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Tema</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => handleFieldChange('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Sistema
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Claro
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Escuro
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure suas preferências de notificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notificações no App</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações dentro do aplicativo
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.in_app}
                  onCheckedChange={(checked) => handleNotificationChange('in_app', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações por email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Comunicações de Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber novidades e promoções
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.marketing}
                  onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regiao">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Regionais</CardTitle>
              <CardDescription>
                Defina formatos e localizações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Fuso Horário</Label>
                  <Select 
                    value={settings.timezone} 
                    onValueChange={(value) => handleFieldChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Idioma</Label>
                  <Select 
                    value={settings.locale} 
                    onValueChange={(value) => handleFieldChange('locale', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCALE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Moeda</Label>
                  <Select 
                    value={settings.currency} 
                    onValueChange={(value) => handleFieldChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Formato de Data</Label>
                  <Select 
                    value={settings.date_format} 
                    onValueChange={(value) => handleFieldChange('date_format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMAT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias">
          <Card>
            <CardHeader>
              <CardTitle>Preferências Gerais</CardTitle>
              <CardDescription>
                Configure comportamentos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Itens por Página</Label>
                  <Input
                    type="number"
                    min={10}
                    max={100}
                    value={settings.items_per_page}
                    onChange={(e) => handleFieldChange('items_per_page', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entre 10 e 100 itens
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Página Inicial</Label>
                  <Select 
                    value={settings.start_page} 
                    onValueChange={(value) => handleFieldChange('start_page', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {START_PAGE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}