import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ESTADOS_BRASIL, Fornecedor } from '@/types/fornecedor';
import { PlanoContas } from '@/types/planoContas';
import { useMascaras } from '@/hooks/useMascaras';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { Building2, User, MapPin, Mail, Phone, FileText, Search, Loader2 } from 'lucide-react';
import { PlanoContasSelectorFornecedor } from './PlanoContasSelectorFornecedor';

interface FornecedorFormProps {
  formData: Partial<Fornecedor>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Fornecedor>>>;
  onDocumentoChange: (value: string) => void;
  onBuscarCEP: () => void;
  carregandoCEP: boolean;
  erroCEP: string | null;
  obterErro: (campo: string) => string | undefined;
  validarEmail: (email: string) => boolean;
  validarTelefone: (telefone: string) => boolean;
  planoContas: any[];
  categoriaAtual?: PlanoContas | null;
  onCategoriaChange?: (categoria: PlanoContas | null) => void;
  readonly?: boolean;
}

export const FornecedorModalForm: React.FC<FornecedorFormProps> = ({
  formData,
  setFormData,
  onDocumentoChange,
  onBuscarCEP,
  carregandoCEP,
  erroCEP,
  obterErro,
  validarEmail,
  validarTelefone,
  planoContas,
  categoriaAtual,
  onCategoriaChange,
  readonly = false
}) => {
  const { aplicarMascaraTelefone, aplicarMascaraCEP } = useMascaras();

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Usar planoContas recebido como prop (já filtrado no modal)
  const contasDisponiveis = planoContas;

  return (
    <div className="space-y-6">
      {/* Dados Básicos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Building2 className="w-4 h-4" />
          <span>Dados Básicos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Pessoa *</Label>
            <Select 
              value={formData.tipo} 
              onValueChange={(value: 'pessoa_fisica' | 'pessoa_juridica') => {
                if (!readonly) {
                  handleChange('tipo', value);
                  handleChange('documento', ''); // Limpar documento ao mudar tipo
                }
              }}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pessoa_fisica">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Pessoa Física
                  </div>
                </SelectItem>
                <SelectItem value="pessoa_juridica">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Pessoa Jurídica
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {obterErro('tipo') && (
              <p className="text-sm text-red-600">{obterErro('tipo')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_fornecedor">Tipo de Fornecedor *</Label>
            <Select 
              value={formData.tipo_fornecedor} 
              onValueChange={(value: 'receita' | 'despesa') => !readonly && handleChange('tipo_fornecedor', value)}
              disabled={readonly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="despesa">Despesa</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
              </SelectContent>
            </Select>
            {obterErro('tipo_fornecedor') && (
              <p className="text-sm text-red-600">{obterErro('tipo_fornecedor')}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">
              {formData.tipo === 'pessoa_fisica' ? 'Nome Completo' : 'Razão Social'} *
            </Label>
            <Input
              id="nome"
              value={formData.nome || ''}
              onChange={(e) => !readonly && handleChange('nome', e.target.value)}
              placeholder={formData.tipo === 'pessoa_fisica' ? 'Digite o nome completo' : 'Digite a razão social'}
              disabled={readonly}
            />
            {obterErro('nome') && (
              <p className="text-sm text-red-600">{obterErro('nome')}</p>
            )}
          </div>

          {formData.tipo === 'pessoa_juridica' && (
            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
              <Input
                id="nome_fantasia"
                value={formData.nome_fantasia || ''}
                onChange={(e) => !readonly && handleChange('nome_fantasia', e.target.value)}
                placeholder="Digite o nome fantasia"
                disabled={readonly}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="documento">
              {formData.tipo === 'pessoa_fisica' ? 'CPF' : 'CNPJ'} *
            </Label>
            <Input
              id="documento"
              value={formData.documento || ''}
              onChange={(e) => !readonly && onDocumentoChange(e.target.value)}
              placeholder={formData.tipo === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
              disabled={readonly}
            />
            {obterErro('documento') && (
              <p className="text-sm text-red-600">{obterErro('documento')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria_padrao">Categoria Padrão</Label>
            <PlanoContasSelectorFornecedor
              value={categoriaAtual}
              onSelect={(categoria) => {
                if (!readonly && onCategoriaChange) {
                  onCategoriaChange(categoria);
                  handleChange('categoria_padrao_id', categoria.id);
                }
              }}
              placeholder="Selecionar categoria padrão..."
              className="w-full"
              tipoFornecedor={formData.tipo_fornecedor as 'receita' | 'despesa'}
            />
            {obterErro('categoria_padrao_id') && (
              <p className="text-sm text-red-600">{obterErro('categoria_padrao_id')}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Contato */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Phone className="w-4 h-4" />
          <span>Contato</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => {
                  if (!readonly) {
                    handleChange('email', e.target.value);
                    if (e.target.value) validarEmail(e.target.value);
                  }
                }}
                placeholder="email@exemplo.com"
                className="pl-10"
                disabled={readonly}
              />
            </div>
            {obterErro('email') && (
              <p className="text-sm text-red-600">{obterErro('email')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="telefone"
                value={formData.telefone || ''}
                onChange={(e) => {
                  if (!readonly) {
                    const telefoneFormatado = aplicarMascaraTelefone(e.target.value);
                    handleChange('telefone', telefoneFormatado);
                    if (telefoneFormatado) validarTelefone(telefoneFormatado);
                  }
                }}
                placeholder="(00) 00000-0000"
                className="pl-10"
                disabled={readonly}
              />
            </div>
            {obterErro('telefone') && (
              <p className="text-sm text-red-600">{obterErro('telefone')}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Endereço */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-medium">
          <MapPin className="w-4 h-4" />
          <span>Endereço</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                value={formData.cep || ''}
                onChange={(e) => {
                  if (!readonly) {
                    const cepFormatado = aplicarMascaraCEP(e.target.value);
                    handleChange('cep', cepFormatado);
                  }
                }}
                placeholder="00000-000"
                className="flex-1"
                disabled={readonly}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBuscarCEP}
                disabled={carregandoCEP || !formData.cep || readonly}
              >
                {carregandoCEP ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {obterErro('cep') && (
              <p className="text-sm text-red-600">{obterErro('cep')}</p>
            )}
            {erroCEP && (
              <p className="text-sm text-red-600">{erroCEP}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Logradouro</Label>
            <Input
              id="endereco"
              value={formData.endereco || ''}
              onChange={(e) => !readonly && handleChange('endereco', e.target.value)}
              placeholder="Rua, Avenida, etc."
              disabled={readonly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numero">Número</Label>
            <Input
              id="numero"
              value={formData.numero || ''}
              onChange={(e) => !readonly && handleChange('numero', e.target.value)}
              placeholder="123"
              disabled={readonly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={formData.bairro || ''}
              onChange={(e) => !readonly && handleChange('bairro', e.target.value)}
              placeholder="Nome do bairro"
              disabled={readonly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade || ''}
              onChange={(e) => !readonly && handleChange('cidade', e.target.value)}
              placeholder="Nome da cidade"
              disabled={readonly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={formData.estado} onValueChange={(value) => !readonly && handleChange('estado', value)} disabled={readonly}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BRASIL.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Observações */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-medium">
          <FileText className="w-4 h-4" />
          <span>Observações</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações Gerais</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes || ''}
            onChange={(e) => !readonly && handleChange('observacoes', e.target.value)}
            placeholder="Informações adicionais sobre o fornecedor..."
            rows={3}
            disabled={readonly}
          />
        </div>
      </div>
    </div>
  );
};