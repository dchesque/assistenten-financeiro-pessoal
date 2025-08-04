import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Vendedor, NovoVendedor, TIPOS_COMISSAO, NIVEIS_ACESSO } from '@/types/vendedor';
import { useMascaras } from '@/hooks/useMascaras';
import { useBuscaCEP } from '@/hooks/useBuscaCEP';
import { useValidacaoVendedor } from '@/hooks/useValidacaoVendedor';
import { User, Briefcase, DollarSign, MapPin, AlertCircle } from 'lucide-react';

interface VendedorModalProps {
  aberto: boolean;
  onFechar: () => void;
  vendedor?: Vendedor | null;
  modoEdicao: boolean;
  onSalvar: (vendedor: any) => Promise<boolean>;
  gerarProximoCodigo: () => Promise<string>;
}

export const VendedorModal: React.FC<VendedorModalProps> = ({
  aberto,
  onFechar,
  vendedor,
  modoEdicao,
  onSalvar,
  gerarProximoCodigo
}) => {
  const { aplicarMascaraCEP } = useMascaras();
  const { buscarCEP, carregando: loadingCEP, erro: erroCEP } = useBuscaCEP();
  const { 
    erros, 
    validarFormulario, 
    limparErros, 
    aplicarMascaraDocumento, 
    formatarTelefone 
  } = useValidacaoVendedor();
  
  const [formData, setFormData] = useState<NovoVendedor>({
    nome: '',
    documento: '',
    tipo_documento: 'CPF',
    email: '',
    telefone: '',
    whatsapp: '',
    data_nascimento: '',
    codigo_vendedor: '',
    data_admissao: new Date().toISOString().split('T')[0],
    cargo: 'Vendedor',
    departamento: 'Vendas',
    tipo_comissao: 'percentual',
    percentual_comissao: 5.00,
    valor_fixo_comissao: 0,
    meta_mensal: 0,
    pode_dar_desconto: false,
    desconto_maximo: 0,
    acesso_sistema: false,
    nivel_acesso: 'vendedor',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    status: 'ativo',
    observacoes: ''
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pessoais');

  useEffect(() => {
    if (aberto && !modoEdicao) {
      // Limpar erros e gerar código para novo vendedor
      limparErros();
      gerarProximoCodigo().then(codigo => {
        setFormData(prev => ({ ...prev, codigo_vendedor: codigo }));
      });
    }
  }, [aberto, modoEdicao, gerarProximoCodigo, limparErros]);

  useEffect(() => {
    if (vendedor && modoEdicao) {
      setFormData({
        nome: vendedor.nome,
        documento: vendedor.documento,
        tipo_documento: vendedor.tipo_documento,
        email: vendedor.email || '',
        telefone: vendedor.telefone || '',
        whatsapp: vendedor.whatsapp || '',
        data_nascimento: vendedor.data_nascimento || '',
        codigo_vendedor: vendedor.codigo_vendedor,
        data_admissao: vendedor.data_admissao,
        cargo: vendedor.cargo,
        departamento: vendedor.departamento,
        tipo_comissao: vendedor.tipo_comissao,
        percentual_comissao: vendedor.percentual_comissao,
        valor_fixo_comissao: vendedor.valor_fixo_comissao,
        meta_mensal: vendedor.meta_mensal,
        pode_dar_desconto: vendedor.pode_dar_desconto,
        desconto_maximo: vendedor.desconto_maximo,
        acesso_sistema: vendedor.acesso_sistema,
        nivel_acesso: vendedor.nivel_acesso,
        cep: vendedor.cep || '',
        logradouro: vendedor.logradouro || '',
        numero: vendedor.numero || '',
        complemento: vendedor.complemento || '',
        bairro: vendedor.bairro || '',
        cidade: vendedor.cidade || '',
        estado: vendedor.estado || '',
        status: vendedor.status,
        observacoes: vendedor.observacoes || ''
      });
      limparErros();
    }
  }, [vendedor, modoEdicao, limparErros]);

  const handleCEPChange = async (cep: string) => {
    const cepFormatado = aplicarMascaraCEP(cep);
    setFormData(prev => ({ ...prev, cep: cepFormatado }));

    if (cepFormatado.length === 9) {
      const dados = await buscarCEP(cepFormatado.replace('-', ''));
      if (dados) {
        setFormData(prev => ({
          ...prev,
          logradouro: dados.logradouro,
          bairro: dados.bairro,
          cidade: dados.cidade,
          estado: dados.estado
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validacao = validarFormulario(formData, [], vendedor?.id);
    if (!validacao.valido) {
      return;
    }

    setLoading(true);
    try {
      const sucesso = await onSalvar(modoEdicao ? { id: vendedor?.id, ...formData } : formData);
      if (sucesso) {
        onFechar();
        setActiveTab('pessoais');
      }
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = modoEdicao ? 'Editar Vendedor' : 'Novo Vendedor';
  const modalSubtitle = modoEdicao 
    ? `Editando informações de ${vendedor?.nome}` 
    : 'Preencha os dados para cadastrar um novo vendedor';

  return (
    <Modal
      isOpen={aberto}
      onClose={onFechar}
      title={modalTitle}
      subtitle={modalSubtitle}
      icon={<User />}
      size="4xl"
      footer={
        <ModalFooter showRequiredNote>
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="vendedor-form"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            {loading ? 'Salvando...' : (modoEdicao ? 'Atualizar' : 'Criar')} Vendedor
          </Button>
        </ModalFooter>
      }
    >
      <ModalContent>
        <form id="vendedor-form" onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pessoais">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="profissional">Profissional</TabsTrigger>
              <TabsTrigger value="comissoes">Comissões</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
            </TabsList>

            {/* ABA: DADOS PESSOAIS */}
            <TabsContent value="pessoais" className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações Básicas
                  </CardTitle>
                  <CardDescription>Dados pessoais e contato do vendedor</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className={erros.nome ? 'border-red-500' : ''}
                    />
                    {erros.nome && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {erros.nome}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
                    <Select 
                      value={formData.tipo_documento} 
                      onValueChange={(value: 'CPF' | 'CNPJ') => {
                        setFormData(prev => ({ 
                          ...prev, 
                          tipo_documento: value,
                          documento: '' // Limpar documento ao trocar tipo
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CPF">CPF</SelectItem>
                        <SelectItem value="CNPJ">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="documento">{formData.tipo_documento} *</Label>
                    <Input
                      id="documento"
                      value={formData.documento}
                      onChange={(e) => {
                        const valor = aplicarMascaraDocumento(e.target.value);
                        setFormData(prev => ({ ...prev, documento: valor }));
                      }}
                      placeholder={formData.tipo_documento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                      className={erros.documento ? 'border-red-500' : ''}
                    />
                    {erros.documento && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {erros.documento}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="exemplo@empresa.com"
                      className={erros.email ? 'border-red-500' : ''}
                    />
                    {erros.email && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {erros.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        telefone: formatarTelefone(e.target.value) 
                      }))}
                      placeholder="(11) 99999-9999"
                      className={erros.telefone ? 'border-red-500' : ''}
                    />
                    {erros.telefone && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {erros.telefone}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        whatsapp: formatarTelefone(e.target.value) 
                      }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA: PROFISSIONAL */}
            <TabsContent value="profissional" className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Dados Profissionais
                  </CardTitle>
                  <CardDescription>Informações sobre cargo, função e status</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo_vendedor">Código do Vendedor *</Label>
                    <Input
                      id="codigo_vendedor"
                      value={formData.codigo_vendedor}
                      onChange={(e) => setFormData(prev => ({ ...prev, codigo_vendedor: e.target.value }))}
                      placeholder="V001"
                      className={erros.codigo_vendedor ? 'border-red-500' : ''}
                    />
                    {erros.codigo_vendedor && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {erros.codigo_vendedor}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="data_admissao">Data de Admissão *</Label>
                    <Input
                      id="data_admissao"
                      type="date"
                      value={formData.data_admissao}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_admissao: e.target.value }))}
                      className={erros.data_admissao ? 'border-red-500' : ''}
                    />
                    {erros.data_admissao && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {erros.data_admissao}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                      placeholder="Vendedor"
                    />
                  </div>

                  <div>
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      value={formData.departamento}
                      onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))}
                      placeholder="Vendas"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="afastado">Afastado</SelectItem>
                        <SelectItem value="demitido">Demitido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nivel_acesso">Nível de Acesso</Label>
                    <Select 
                      value={formData.nivel_acesso} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, nivel_acesso: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEIS_ACESSO.map(nivel => (
                          <SelectItem key={nivel.valor} value={nivel.valor}>
                            {nivel.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="acesso_sistema">Acesso ao Sistema</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir login no sistema
                      </p>
                    </div>
                    <Switch
                      id="acesso_sistema"
                      checked={formData.acesso_sistema}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acesso_sistema: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="pode_dar_desconto">Pode Dar Desconto</Label>
                      <p className="text-sm text-muted-foreground">
                        Autorizar concessão de descontos
                      </p>
                    </div>
                    <Switch
                      id="pode_dar_desconto"
                      checked={formData.pode_dar_desconto}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pode_dar_desconto: checked }))}
                    />
                  </div>

                  {formData.pode_dar_desconto && (
                    <div>
                      <Label htmlFor="desconto_maximo">Desconto Máximo (%)</Label>
                      <Input
                        id="desconto_maximo"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.desconto_maximo}
                        onChange={(e) => setFormData(prev => ({ ...prev, desconto_maximo: parseFloat(e.target.value) || 0 }))}
                        className={erros.desconto_maximo ? 'border-red-500' : ''}
                      />
                      {erros.desconto_maximo && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {erros.desconto_maximo}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      rows={3}
                      value={formData.observacoes}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Informações adicionais sobre o vendedor..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA: COMISSÕES */}
            <TabsContent value="comissoes" className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Sistema de Comissões
                  </CardTitle>
                  <CardDescription>Configure as comissões e metas do vendedor</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_comissao">Tipo de Comissão</Label>
                    <Select 
                      value={formData.tipo_comissao} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo_comissao: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_COMISSAO.map(tipo => (
                          <SelectItem key={tipo.valor} value={tipo.valor}>
                            {tipo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="percentual_comissao">Percentual de Comissão (%)</Label>
                    <Input
                      id="percentual_comissao"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.percentual_comissao}
                      onChange={(e) => setFormData(prev => ({ ...prev, percentual_comissao: parseFloat(e.target.value) || 0 }))}
                      className={erros.percentual_comissao ? 'border-red-500' : ''}
                    />
                    {erros.percentual_comissao && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {erros.percentual_comissao}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="valor_fixo_comissao">Valor Fixo de Comissão (R$)</Label>
                    <Input
                      id="valor_fixo_comissao"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_fixo_comissao}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_fixo_comissao: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="meta_mensal">Meta Mensal (R$)</Label>
                    <Input
                      id="meta_mensal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.meta_mensal}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_mensal: parseFloat(e.target.value) || 0 }))}
                      className={erros.meta_mensal ? 'border-red-500' : ''}
                    />
                    {erros.meta_mensal && (
                      <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {erros.meta_mensal}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA: ENDEREÇO */}
            <TabsContent value="endereco" className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço Completo
                  </CardTitle>
                  <CardDescription>Endereço residencial do vendedor</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleCEPChange(e.target.value)}
                      disabled={loadingCEP}
                      placeholder="00000-000"
                    />
                    {loadingCEP && <p className="text-sm text-blue-500 mt-1">Buscando endereço...</p>}
                  </div>

                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                      placeholder="123"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input
                      id="logradouro"
                      value={formData.logradouro}
                      onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                      placeholder="Rua das Flores"
                    />
                  </div>

                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                      placeholder="Apt 101"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                      placeholder="Centro"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                      placeholder="São Paulo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estado">Estado (UF)</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </ModalContent>
    </Modal>
  );
};