import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFornecedores } from '@/hooks/useFornecedores';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useToast } from '@/hooks/use-toast';
import { Fornecedor } from '@/types/fornecedor';
import { Building2, User, Save, X } from 'lucide-react';

interface CadastroRapidoFornecedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFornecedorCriado: (fornecedor: Fornecedor) => void;
}

export function CadastroRapidoFornecedorModal({
  open,
  onOpenChange,
  onFornecedorCriado
}: CadastroRapidoFornecedorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'pessoa_fisica' as 'pessoa_fisica' | 'pessoa_juridica',
    documento: '',
    email: '',
    telefone: '',
    categoria_padrao_id: undefined as number | undefined
  });

  const { criarFornecedor } = useFornecedores();
  const { planoContas } = usePlanoContas();
  const { toast } = useToast();

  // Categorias de despesa para seleção
  const categoriasDespesa = planoContas.filter(p => 
    p.tipo_dre?.includes('despesa') && p.aceita_lancamento && p.ativo
  );

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'pessoa_fisica',
      documento: '',
      email: '',
      telefone: '',
      categoria_padrao_id: undefined
    });
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const validarFormulario = () => {
    const erros: string[] = [];

    if (!formData.nome.trim()) {
      erros.push('Nome é obrigatório');
    }

    if (!formData.documento.trim()) {
      erros.push('Documento é obrigatório');
    }

    // Validação básica de CPF/CNPJ
    const documento = formData.documento.replace(/\D/g, '');
    if (formData.tipo === 'pessoa_fisica' && documento.length !== 11) {
      erros.push('CPF deve ter 11 dígitos');
    }
    if (formData.tipo === 'pessoa_juridica' && documento.length !== 14) {
      erros.push('CNPJ deve ter 14 dígitos');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      erros.push('Email inválido');
    }

    return erros;
  };

  const handleSubmit = async () => {
    const erros = validarFormulario();
    if (erros.length > 0) {
      toast({
        title: "Erro de validação",
        description: erros.join(', '),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const novoFornecedor: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at'> = {
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        documento: formData.documento.replace(/\D/g, ''),
        email: formData.email.trim() || undefined,
        telefone: formData.telefone.trim() || undefined,
        categoria_padrao_id: formData.categoria_padrao_id,
        tipo_fornecedor: 'despesa',
        ativo: true,
        totalCompras: 0,
        valorTotal: 0,
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: '',
        dataCadastro: new Date().toISOString().split('T')[0]
      };

      const fornecedorCriado = await criarFornecedor(novoFornecedor);
      
      if (fornecedorCriado) {
        toast({
          title: "Fornecedor cadastrado",
          description: `${formData.nome} foi cadastrado com sucesso!`
        });
        
        onFornecedorCriado(fornecedorCriado);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível cadastrar o fornecedor. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarDocumento = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (formData.tipo === 'pessoa_fisica') {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .slice(0, 14);
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2')
        .slice(0, 18);
    }
  };

  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    // (00) 00000-0000
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Cadastro Rápido de Fornecedor</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              placeholder="Nome do fornecedor"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              className="bg-white/80 backdrop-blur-sm border-gray-300/50"
            />
          </div>

          {/* Tipo e Documento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value: 'pessoa_fisica' | 'pessoa_juridica') => 
                  setFormData(prev => ({ ...prev, tipo: value, documento: '' }))
                }
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pessoa_fisica">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Pessoa Física</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pessoa_juridica">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>Pessoa Jurídica</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">
                {formData.tipo === 'pessoa_fisica' ? 'CPF' : 'CNPJ'} *
              </Label>
              <Input
                id="documento"
                placeholder={formData.tipo === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                value={formData.documento}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  documento: formatarDocumento(e.target.value) 
                }))}
                className="bg-white/80 backdrop-blur-sm border-gray-300/50"
              />
            </div>
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-white/80 backdrop-blur-sm border-gray-300/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  telefone: formatarTelefone(e.target.value) 
                }))}
                className="bg-white/80 backdrop-blur-sm border-gray-300/50"
              />
            </div>
          </div>

          {/* Categoria Padrão */}
          <div className="space-y-2">
            <Label>Categoria Padrão</Label>
            <Select 
              value={formData.categoria_padrao_id?.toString()} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                categoria_padrao_id: value ? parseInt(value) : undefined 
              }))}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-300/50">
                <SelectValue placeholder="Selecionar categoria..." />
              </SelectTrigger>
              <SelectContent>
                {categoriasDespesa.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id.toString()}>
                    {categoria.codigo} - {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-white/80 backdrop-blur-sm border-gray-300/50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50/80 rounded-lg">
          <strong>Cadastro Rápido:</strong> Para cadastrar informações completas do fornecedor 
          (endereço, observações, etc.), acesse o menu Fornecedores.
        </div>
      </DialogContent>
    </Dialog>
  );
}