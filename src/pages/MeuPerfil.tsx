import { useState } from 'react';
import { Camera, User, Phone, Mail, MapPin, Save, Edit3, Shield, Bell } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useFormulario } from '@/hooks/useFormulario';
import { useMascaras } from '@/hooks/useMascaras';
import { InputValidacao } from '@/components/ui/InputValidacao';
import { VALIDACOES_COMUNS } from '@/utils/validacoes';
import { toast } from '@/hooks/use-toast';

interface DadosPerfil {
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  avatar_url?: string;
  bio?: string;
}

interface ConfiguracoesNotificacao {
  whatsapp_conta_vencer: boolean;
  whatsapp_conta_vencida: boolean;
  whatsapp_resumo_diario: boolean;
  whatsapp_resumo_semanal: boolean;
  email_backup: boolean;
  email_relatorios: boolean;
}

interface ConfiguracoesPrivacidade {
  perfil_publico: boolean;
  mostrar_email: boolean;
  mostrar_telefone: boolean;
  aceitar_convites: boolean;
}

export default function MeuPerfil() {
  const { user } = useAuth();
  const { aplicarMascaraTelefone, aplicarMascaraCEP } = useMascaras();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Dados iniciais do perfil
  const dadosIniciais: DadosPerfil = {
    nome: user?.nome || user?.user_metadata?.nome || '',
    email: user?.email || '',
    telefone: '',
    whatsapp: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    avatar_url: user?.user_metadata?.avatar_url || '',
    bio: ''
  };

  // Configurações de notificação
  const [notificacoes, setNotificacoes] = useState<ConfiguracoesNotificacao>({
    whatsapp_conta_vencer: true,
    whatsapp_conta_vencida: true,
    whatsapp_resumo_diario: false,
    whatsapp_resumo_semanal: true,
    email_backup: true,
    email_relatorios: false
  });

  // Configurações de privacidade
  const [privacidade, setPrivacidade] = useState<ConfiguracoesPrivacidade>({
    perfil_publico: false,
    mostrar_email: false,
    mostrar_telefone: false,
    aceitar_convites: true
  });

  // Esquema de validação
  const esquemaValidacao = {
    nome: [{ validador: VALIDACOES_COMUNS.NOME, mensagem: '' }],
    email: [{ validador: VALIDACOES_COMUNS.EMAIL, mensagem: '' }],
    telefone: [{ validador: VALIDACOES_COMUNS.TELEFONE, mensagem: '' }],
    whatsapp: [{ validador: VALIDACOES_COMUNS.TELEFONE, mensagem: '' }],
    cep: [{ validador: VALIDACOES_COMUNS.CEP, mensagem: '' }]
  };

  // Hook do formulário
  const {
    dados,
    alterarCampo,
    estaCarregando,
    salvar,
    erros,
    validarCampo
  } = useFormulario(
    dadosIniciais,
    async (dadosPerfil) => {
      // Salvando perfil
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Sucesso', description: 'Perfil atualizado com sucesso!' });
    },
    esquemaValidacao
  );

  // Upload de avatar
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        alterarCampo('avatar_url', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Salvar configurações
  const salvarConfiguracoes = async () => {
    // Salvando configurações
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({ title: 'Sucesso', description: 'Configurações salvas com sucesso!' });
  };

  const breadcrumb = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Meu Perfil', icon: <User className="w-4 h-4" /> }
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={breadcrumb}
        title="Meu Perfil"
        subtitle="Gerencie suas informações pessoais e configurações"
        icon={<User className="w-6 h-6" />}
      />

      <div className="space-y-6">
        <Tabs defaultValue="dados-pessoais" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 glassmorphism-card p-1">
            <TabsTrigger value="dados-pessoais" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Dados Pessoais</span>
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="privacidade" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Privacidade</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba: Dados Pessoais */}
          <TabsContent value="dados-pessoais" className="space-y-6">
            <Card className="glassmorphism-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais e foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage 
                        src={avatarPreview || dados.avatar_url} 
                        alt="Avatar do usuário" 
                      />
                      <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                        {dados.nome.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Label 
                      htmlFor="avatar-upload" 
                      className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 border border-gray-200"
                    >
                      <Camera className="w-4 h-4 text-gray-600" />
                    </Label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{dados.nome || 'Nome não informado'}</h3>
                    <p className="text-muted-foreground">{dados.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique na câmera para alterar sua foto
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Formulário de dados pessoais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <InputValidacao
                      id="nome"
                      label="Nome Completo"
                      obrigatorio
                      value={dados.nome}
                      onChange={(e) => alterarCampo('nome', e.target.value)}
                      placeholder="Seu nome completo"
                      validacao={VALIDACOES_COMUNS.NOME}
                      erro={erros.nome}
                    />
                  </div>

                  <div className="space-y-2">
                    <InputValidacao
                      id="email"
                      label="Email"
                      type="email"
                      value={dados.email}
                      onChange={(e) => alterarCampo('email', e.target.value)}
                      placeholder="seu@email.com"
                      validacao={VALIDACOES_COMUNS.EMAIL}
                      erro={erros.email}
                    />
                  </div>

                  <div className="space-y-2">
                    <InputValidacao
                      id="telefone"
                      label="Telefone"
                      value={dados.telefone}
                      onChange={(e) => alterarCampo('telefone', aplicarMascaraTelefone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      validacao={VALIDACOES_COMUNS.TELEFONE}
                      erro={erros.telefone}
                    />
                  </div>

                  <div className="space-y-2">
                    <InputValidacao
                      id="whatsapp"
                      label="WhatsApp"
                      value={dados.whatsapp}
                      onChange={(e) => alterarCampo('whatsapp', aplicarMascaraTelefone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      validacao={VALIDACOES_COMUNS.TELEFONE}
                      erro={erros.whatsapp}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <InputValidacao
                      id="endereco"
                      label="Endereço"
                      value={dados.endereco}
                      onChange={(e) => alterarCampo('endereco', e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="space-y-2">
                    <InputValidacao
                      id="cidade"
                      label="Cidade"
                      value={dados.cidade}
                      onChange={(e) => alterarCampo('cidade', e.target.value)}
                      placeholder="Nome da cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <InputValidacao
                      id="estado"
                      label="Estado"
                      value={dados.estado}
                      onChange={(e) => alterarCampo('estado', e.target.value)}
                      placeholder="SP"
                    />
                  </div>

                  <div className="space-y-2">
                    <InputValidacao
                      id="cep"
                      label="CEP"
                      value={dados.cep}
                      onChange={(e) => alterarCampo('cep', aplicarMascaraCEP(e.target.value))}
                      placeholder="00000-000"
                      validacao={VALIDACOES_COMUNS.CEP}
                      erro={erros.cep}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={salvar}
                    disabled={estaCarregando}
                    className="btn-primary"
                  >
                    {estaCarregando && <div className="loading-spinner mr-2" />}
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Notificações */}
          <TabsContent value="notificacoes" className="space-y-6">
            <Card className="glassmorphism-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span>Notificações WhatsApp</span>
                </CardTitle>
                <CardDescription>
                  Configure quando e como receber notificações via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Contas próximas ao vencimento</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba avisos 3 dias antes do vencimento
                    </p>
                  </div>
                  <Switch
                    checked={notificacoes.whatsapp_conta_vencer}
                    onCheckedChange={(checked) => 
                      setNotificacoes(prev => ({ ...prev, whatsapp_conta_vencer: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Contas vencidas</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba avisos diários sobre contas em atraso
                    </p>
                  </div>
                  <Switch
                    checked={notificacoes.whatsapp_conta_vencida}
                    onCheckedChange={(checked) => 
                      setNotificacoes(prev => ({ ...prev, whatsapp_conta_vencida: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Resumo diário</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo das movimentações do dia
                    </p>
                  </div>
                  <Switch
                    checked={notificacoes.whatsapp_resumo_diario}
                    onCheckedChange={(checked) => 
                      setNotificacoes(prev => ({ ...prev, whatsapp_resumo_diario: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Resumo semanal</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo das movimentações da semana
                    </p>
                  </div>
                  <Switch
                    checked={notificacoes.whatsapp_resumo_semanal}
                    onCheckedChange={(checked) => 
                      setNotificacoes(prev => ({ ...prev, whatsapp_resumo_semanal: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Notificações Email</span>
                </CardTitle>
                <CardDescription>
                  Configure as notificações que serão enviadas por email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Backup de dados</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba confirmações de backup dos seus dados
                    </p>
                  </div>
                  <Switch
                    checked={notificacoes.email_backup}
                    onCheckedChange={(checked) => 
                      setNotificacoes(prev => ({ ...prev, email_backup: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatórios mensais</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba relatórios financeiros por email
                    </p>
                  </div>
                  <Switch
                    checked={notificacoes.email_relatorios}
                    onCheckedChange={(checked) => 
                      setNotificacoes(prev => ({ ...prev, email_relatorios: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={salvarConfiguracoes} className="btn-primary">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>

          {/* Aba: Privacidade */}
          <TabsContent value="privacidade" className="space-y-6">
            <Card className="glassmorphism-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Configurações de Privacidade</span>
                </CardTitle>
                <CardDescription>
                  Controle quem pode ver suas informações e como você interage com outros usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Perfil público</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir que outros usuários vejam seu perfil
                    </p>
                  </div>
                  <Switch
                    checked={privacidade.perfil_publico}
                    onCheckedChange={(checked) => 
                      setPrivacidade(prev => ({ ...prev, perfil_publico: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar email</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir seu email no perfil público
                    </p>
                  </div>
                  <Switch
                    checked={privacidade.mostrar_email}
                    onCheckedChange={(checked) => 
                      setPrivacidade(prev => ({ ...prev, mostrar_email: checked }))
                    }
                    disabled={!privacidade.perfil_publico}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar telefone</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir seu telefone no perfil público
                    </p>
                  </div>
                  <Switch
                    checked={privacidade.mostrar_telefone}
                    onCheckedChange={(checked) => 
                      setPrivacidade(prev => ({ ...prev, mostrar_telefone: checked }))
                    }
                    disabled={!privacidade.perfil_publico}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aceitar convites</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir que outros usuários te enviem convites
                    </p>
                  </div>
                  <Switch
                    checked={privacidade.aceitar_convites}
                    onCheckedChange={(checked) => 
                      setPrivacidade(prev => ({ ...prev, aceitar_convites: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism-card border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                <CardDescription>
                  Ações que podem afetar permanentemente sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <div className="space-y-0.5">
                    <Label className="text-destructive">Excluir conta</Label>
                    <p className="text-sm text-muted-foreground">
                      Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Excluir Conta
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={salvarConfiguracoes} className="btn-primary">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}