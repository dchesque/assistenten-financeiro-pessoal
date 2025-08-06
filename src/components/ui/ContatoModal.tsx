import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDocument, validateCPF, validateCNPJ } from '@/utils/validators';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
              <Label htmlFor="documento">Documento</Label>
              <Input
                id="documento"
                value={formatDocument(formData.documento)}
                onChange={(e) => {
                  const formatted = formatDocument(e.target.value);
                  setFormData(prev => ({ ...prev, documento: formatted }));
                }}
                onBlur={() => {
                  if (formData.documento) {
                    const numbers = formData.documento.replace(/\D/g, '');
                    const isValid = numbers.length <= 11 
                      ? validateCPF(formData.documento)
                      : validateCNPJ(formData.documento);
                    
                    if (!isValid) {
                      toast.error('Documento inválido');
                    }
                  }
                }}
                placeholder={formData.tipo_pessoa === 'pessoa_fisica' ? 'CPF' : 'CNPJ'}
              />
            </div>
            
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}