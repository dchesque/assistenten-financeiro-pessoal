import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MaskedInput, masks } from '@/components/ui/MaskedInput';
import { formatDocument, validateCPF, validateCNPJ } from '@/utils/validators';
import { validateForm, validationRules, showValidationErrors } from '@/utils/validacoesBrasil';
import { toast } from 'sonner';

interface ContatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contato?: any;
  onSave: (data: any) => void;
  tipo?: 'credor' | 'pagador';
}

export function ContatoModal({ isOpen, onClose, contato, onSave, tipo = 'credor' }: ContatoModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: contato?.nome || '',
    tipo_pessoa: contato?.tipo_pessoa || 'pessoa_fisica',
    documento: contato?.documento || '',
    email: contato?.email || '',
    telefone: contato?.telefone || '',
    endereco: contato?.endereco || '',
    observacoes: contato?.observacoes || ''
  });

  // Schema de validação
  const validationSchema = {
    nome: [
      validationRules.required('Nome'),
    ],
    documento: [
      validationRules.required('Documento'),
      formData.tipo_pessoa === 'pessoa_fisica' 
        ? validationRules.cpf()
        : validationRules.cnpj()
    ],
    email: formData.email ? [validationRules.email()] : [],
    telefone: formData.telefone ? [validationRules.phone()] : []
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário
    const { isValid, errors } = validateForm(formData, validationSchema);
    
    if (!isValid) {
      showValidationErrors(errors);
      return;
    }
    
    setLoading(true);
    
    try {
      await onSave(formData);
      toast.success(contato ? "Contato atualizado!" : "Contato criado!");
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar contato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {contato ? 'Editar Contato' : `Novo ${tipo === 'credor' ? 'Credor' : 'Pagador'}`}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
              <Select
                value={formData.tipo_pessoa}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_pessoa: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                  <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="documento">
                Documento <span className="text-red-500">*</span>
              </Label>
              <MaskedInput
                mask={formData.tipo_pessoa === 'pessoa_fisica' ? masks.cpf : masks.cnpj}
                value={formData.documento}
                onChange={(value) => setFormData(prev => ({ ...prev, documento: value }))}
                placeholder={formData.tipo_pessoa === 'pessoa_fisica' ? 'CPF' : 'CNPJ'}
              />
            </div>
            
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <MaskedInput
                mask={masks.phone}
                value={formData.telefone}
                onChange={(value) => setFormData(prev => ({ ...prev, telefone: value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <LoadingButton type="submit" loading={loading} loadingText="Salvando...">
              Salvar
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}