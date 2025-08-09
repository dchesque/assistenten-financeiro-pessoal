import { useState } from 'react';
import { Camera, User, Phone, Mail, MapPin, Save, Edit3, Shield } from 'lucide-react';
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
import { SecurityTab } from '@/components/configuracoes/SecurityTab';

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

interface ConfiguracoesPrivacidade {
  perfil_publico: boolean;
  mostrar_email: boolean;
  mostrar_telefone: boolean;
  aceitar_convites: boolean;
}

export default function MeuPerfil() {
  const { user, profile } = useAuth();
  const { aplicarMascaraTelefone, aplicarMascaraCEP } = useMascaras();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Dados iniciais do perfil
  const dadosIniciais: DadosPerfil = {
    nome: profile?.name || user?.user_metadata?.name || '',
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
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 glassmorphism-card p-1">
            <TabsTrigger value="dados-pessoais" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Dados Pessoais</span>
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Segurança</span>
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

          {/* Aba: Segurança */}
          <TabsContent value="seguranca" className="space-y-6">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}