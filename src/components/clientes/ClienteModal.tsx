
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, User, Building2 } from "lucide-react";
import { Cliente } from "@/types/cliente";
const estadosBrasil = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];
import { InputComValidacao } from './InputComValidacao';
import { CampoCEP } from './CampoCEP';
import { useValidacaoCliente } from '@/hooks/useValidacaoCliente';
import { useMascaras } from '@/hooks/useMascaras';

// Componente Preview otimizado fora do modal
const ClientePreview = React.memo(({ formData }: { formData: Partial<Cliente> }) => {
  const obterIniciais = () => {
    if (!formData.nome) return 'CL';
    return formData.nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-gray-900">Preview do Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
            {obterIniciais()}
          </div>
          <div className="font-medium">{formData.nome || 'Nome do Cliente'}</div>
          <div className="text-sm text-gray-500">
            {formData.tipo}: {formData.documento || 'Documento'}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          {formData.telefone && (
            <div className="flex justify-between">
              <span className="text-gray-600">Telefone:</span>
              <span>{formData.telefone}</span>
            </div>
          )}
          {formData.email && (
            <div className="flex justify-between">
              <span className="text-gray-600">E-mail:</span>
              <span>{formData.email}</span>
            </div>
          )}
          {formData.cidade && formData.estado && (
            <div className="flex justify-between">
              <span className="text-gray-600">Cidade:</span>
              <span>{formData.cidade}, {formData.estado}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <Badge variant="outline" className={
              formData.status === 'ativo' ? 'bg-emerald-100/80 text-emerald-700' :
              formData.status === 'inativo' ? 'bg-gray-100/80 text-gray-700' :
              'bg-red-100/80 text-red-700'
            }>
              {formData.status === 'ativo' ? '🟢 Ativo' : 
               formData.status === 'inativo' ? '🔴 Inativo' : '🚫 Bloqueado'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cliente: Partial<Cliente>) => void;
  cliente?: Cliente;
}

export function ClienteModal({ isOpen, onClose, onSave, cliente }: ClienteModalProps) {
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nome: '',
    documento: '',
    tipo: 'PF',
    rg_ie: '',
    telefone: '',
    whatsapp: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    status: 'ativo',
    observacoes: '',
    receberPromocoes: true,
    whatsappMarketing: true
  });

  const { erros, validarCampo, limparErros, temErros } = useValidacaoCliente();
  const { 
    aplicarMascaraTelefone, 
    aplicarMascaraDocumento, 
    aplicarMascaraRG 
  } = useMascaras();

  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
    } else {
      setFormData({
        nome: '',
        documento: '',
        tipo: 'PF',
        rg_ie: '',
        telefone: '',
        whatsapp: '',
        email: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        status: 'ativo',
        observacoes: '',
        receberPromocoes: true,
        whatsappMarketing: true
      });
    }
    limparErros();
  }, [cliente, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof Cliente, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEnderecoEncontrado = (endereco: {
    logradouro: string;
    bairro: string;
    cidade: string;
    estado: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      logradouro: endereco.logradouro,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações finais
    if (formData.nome) validarCampo('nome', formData.nome, formData.tipo!);
    if (formData.documento) validarCampo('documento', formData.documento, formData.tipo!);
    if (formData.telefone) validarCampo('telefone', formData.telefone, formData.tipo!);
    if (formData.email) validarCampo('email', formData.email, formData.tipo!);
    if (formData.cep) validarCampo('cep', formData.cep, formData.tipo!);
    
    // Se não houver erros, salva
    if (!temErros) {
      onSave(formData);
      onClose();
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              {formData.tipo === 'PF' ? <User className="w-6 h-6 text-blue-600" /> : <Building2 className="w-6 h-6 text-purple-600" />}
              {cliente ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {cliente ? 'Edite as informações do cliente' : 'Cadastre um novo cliente no sistema'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Coluna 1: Dados Básicos */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Seção 1: Dados Básicos */}
                <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 backdrop-blur-sm border border-blue-200/50 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      1️⃣ Dados Básicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Tipo de Pessoa */}
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700">Tipo de Pessoa *</Label>
                      <div className="flex space-x-4 mt-2">
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="radio" 
                            name="tipo_pessoa" 
                            value="PF" 
                            checked={formData.tipo === 'PF'}
                            onChange={() => handleInputChange('tipo', 'PF')}
                            className="mr-2" 
                          />
                          👤 Pessoa Física
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="radio" 
                            name="tipo_pessoa" 
                            value="PJ" 
                            checked={formData.tipo === 'PJ'}
                            onChange={() => handleInputChange('tipo', 'PJ')}
                            className="mr-2" 
                          />
                          🏢 Pessoa Jurídica
                        </label>
                      </div>
                    </div>
                    
                    {/* Nome */}
                    <div>
                      <InputComValidacao
                        label={formData.tipo === 'PF' ? 'Nome Completo' : 'Razão Social'}
                        value={formData.nome || ''}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        validacao={(value) => validarCampo('nome', value, formData.tipo!)}
                        placeholder="Digite o nome completo"
                        erro={erros.nome}
                        obrigatorio
                        className="bg-white/80 backdrop-blur-sm border border-blue-200/30 rounded-xl"
                      />
                    </div>
                    
                    {/* Documento */}
                    <div>
                      <InputComValidacao
                        label={formData.tipo === 'PF' ? 'CPF' : 'CNPJ'}
                        value={formData.documento || ''}
                        onChange={(e) => handleInputChange('documento', e.target.value)}
                        mascara={(value) => aplicarMascaraDocumento(value, formData.tipo!)}
                        validacao={(value) => validarCampo('documento', value, formData.tipo!)}
                        placeholder={formData.tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                        erro={erros.documento}
                        obrigatorio
                        className="bg-white/80 backdrop-blur-sm border border-blue-200/30 rounded-xl"
                      />
                    </div>
                    
                    {/* RG/IE */}
                    <div className="md:col-span-2">
                      <InputComValidacao
                        label={formData.tipo === 'PF' ? 'RG' : 'Inscrição Estadual'}
                        value={formData.rg_ie || ''}
                        onChange={(e) => handleInputChange('rg_ie', e.target.value)}
                        mascara={formData.tipo === 'PF' ? aplicarMascaraRG : undefined}
                        className="bg-white/80 backdrop-blur-sm border border-blue-200/30 rounded-xl"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Seção 2: Contato */}
                <Card className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 backdrop-blur-sm border border-emerald-200/50 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      2️⃣ Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Telefone */}
                    <div>
                      <InputComValidacao
                        label="Telefone Principal"
                        value={formData.telefone || ''}
                        onChange={(e) => handleInputChange('telefone', e.target.value)}
                        mascara={aplicarMascaraTelefone}
                        validacao={(value) => validarCampo('telefone', value, formData.tipo!)}
                        placeholder="(11) 99999-9999"
                        erro={erros.telefone}
                        obrigatorio
                        className="bg-white/80 backdrop-blur-sm border border-emerald-200/30 rounded-xl"
                      />
                    </div>
                    
                    {/* WhatsApp */}
                    <div>
                      <InputComValidacao
                        label="WhatsApp"
                        value={formData.whatsapp || ''}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        mascara={aplicarMascaraTelefone}
                        placeholder="(11) 99999-9999"
                        className="bg-white/80 backdrop-blur-sm border border-emerald-200/30 rounded-xl"
                      />
                    </div>
                    
                    {/* Email */}
                    <div className="md:col-span-2">
                      <InputComValidacao
                        label="E-mail"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        validacao={(value) => validarCampo('email', value, formData.tipo!)}
                        placeholder="cliente@email.com"
                        erro={erros.email}
                        className="bg-white/80 backdrop-blur-sm border border-emerald-200/30 rounded-xl"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Seção 3: Endereço */}
                <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/40 backdrop-blur-sm border border-purple-200/50 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      3️⃣ Endereço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* CEP com busca automática */}
                    <div>
                      <CampoCEP
                        value={formData.cep || ''}
                        onChange={(value) => handleInputChange('cep', value)}
                        onEnderecoEncontrado={handleEnderecoEncontrado}
                        erro={erros.cep}
                        onValidacao={(value) => validarCampo('cep', value, formData.tipo!)}
                      />
                    </div>
                    
                    {/* Logradouro */}
                    <div className="md:col-span-2">
                      <InputComValidacao
                        label="Logradouro"
                        value={formData.logradouro || ''}
                        onChange={(e) => handleInputChange('logradouro', e.target.value)}
                        placeholder="Rua, Avenida..."
                        className="bg-white/80 backdrop-blur-sm border border-purple-200/30 rounded-xl"
                      />
                    </div>
                    
                    {/* Número */}
                    <div>
                      <InputComValidacao
                        label="Número"
                        value={formData.numero || ''}
                        onChange={(e) => handleInputChange('numero', e.target.value)}
                        placeholder="123"
                        className="bg-white/80 backdrop-blur-sm border border-purple-200/30 rounded-xl"
                      />
                    </div>
                    
                    {/* Complemento */}
                    <div>
                      <InputComValidacao
                        label="Complemento"
                        value={formData.complemento || ''}
                        onChange={(e) => handleInputChange('complemento', e.target.value)}
                        placeholder="Apto, Sala..."
                        className="bg-white/80 backdrop-blur-sm border border-purple-200/30 rounded-xl"
                      />
                    </div>
                    
                    {/* Bairro */}
                    <div>
                      <InputComValidacao
                        label="Bairro"
                        value={formData.bairro || ''}
                        onChange={(e) => handleInputChange('bairro', e.target.value)}
                        className="bg-white/80 backdrop-blur-sm border border-purple-200/30 rounded-xl"
                      />
                    </div>
                    
                    {/* Cidade */}
                    <div>
                      <InputComValidacao
                        label="Cidade"
                        value={formData.cidade || ''}
                        onChange={(e) => handleInputChange('cidade', e.target.value)}
                        className="bg-white/80 backdrop-blur-sm border border-purple-200/30 rounded-xl"
                      />
                    </div>
                    
                    {/* Estado */}
                    <div>
                      <Label htmlFor="estado" className="text-sm font-medium text-gray-700">Estado</Label>
                      <Select value={formData.estado || ''} onValueChange={(value) => handleInputChange('estado', value)}>
                        <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-purple-200/30 rounded-xl">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosBrasil.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Coluna 2: Preview e Configurações */}
              <div className="space-y-6">
                
                {/* Preview do Cliente */}
                <ClientePreview formData={formData} />
                
                {/* Configurações */}
                <Card className="bg-gradient-to-br from-orange-50/80 to-orange-100/40 backdrop-blur-sm border border-orange-200/50 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      4️⃣ Configurações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    {/* Status */}
                    <div>
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2">
                        Status do Cliente
                      </Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-orange-200/30 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">🟢 Ativo</SelectItem>
                          <SelectItem value="inativo">🔴 Inativo</SelectItem>
                          <SelectItem value="bloqueado">🚫 Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Observações */}
                    <div>
                      <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes || ''}
                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                        placeholder="Observações sobre o cliente..."
                        className="bg-white/80 backdrop-blur-sm border border-orange-200/30 rounded-xl h-20 resize-none"
                      />
                    </div>
                    
                    {/* Switches */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="receber_promocoes" className="text-sm">
                          Receber promoções por e-mail
                        </Label>
                        <Switch
                          id="receber_promocoes"
                          checked={formData.receberPromocoes ?? true}
                          onCheckedChange={(checked) => handleInputChange('receberPromocoes', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="whatsapp_marketing" className="text-sm">
                          Aceita WhatsApp marketing
                        </Label>
                        <Switch
                          id="whatsapp_marketing"
                          checked={formData.whatsappMarketing ?? true}
                          onCheckedChange={(checked) => handleInputChange('whatsappMarketing', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-200/50 flex justify-end space-x-3">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              className="bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={temErros}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              Salvar Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
