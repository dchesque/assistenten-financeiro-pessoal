import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { LoadingButton } from '@/components/ui/LoadingButton';
import { usePagadores } from '@/hooks/usePagadores';
import { useCategories } from '@/hooks/useCategories';
import { CategoriaSelectorNovo } from '@/components/contasPagar/CategoriaSelectorNovo';
import { CriarPagador, Pagador } from '@/types/pagador';
import { User, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CadastroRapidoPagadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPagadorCriado: (pagador: Pagador) => void;
}

interface FormData {
  nome: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  categoria_id?: number;
  documento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  observacoes?: string;
}

export const CadastroRapidoPagadorModal: React.FC<CadastroRapidoPagadorModalProps> = ({
  isOpen,
  onClose,
  onPagadorCriado
}) => {
  const { criarPagador } = usePagadores();
  const { categories } = useCategories();
  const { toast } = useToast();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      tipo: 'pessoa_fisica'
    }
  });

  const [categoriaSelecionada, setCategoriaSelecionada] = React.useState(null);
  const tipoSelecionado = watch('tipo');

  const onSubmit = async (data: FormData) => {
    try {
      const dadosPagador: CriarPagador = {
        nome: data.nome,
        tipo: data.tipo,
        documento: data.documento || '',
        email: data.email || '',
        telefone: data.telefone || '',
        endereco: data.endereco,
        observacoes: data.observacoes,
        ativo: true
      };

      await criarPagador(dadosPagador);
      
      toast({
        title: 'Sucesso',
        description: `Pagador "${data.nome}" criado com sucesso!`
      });

      // Criar objeto mock do pagador criado para o callback
      const novoPagador: Pagador = {
        id: Date.now(),
        nome: data.nome,
        tipo: data.tipo,
        documento: data.documento || '',
        email: data.email || '',
        telefone: data.telefone || '',
        endereco: data.endereco,
        observacoes: data.observacoes,
        ativo: true,
        user_id: 'mock-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onPagadorCriado(novoPagador);
      setCategoriaSelecionada(null);
      reset();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar pagador',
        variant: 'destructive'
      });
    }
  };

  const handleClose = () => {
    setCategoriaSelecionada(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Cadastro Rápido de Pagador
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo de Pessoa */}
          <div className="space-y-2">
            <Label>Tipo de Pessoa *</Label>
            <Select 
              value={tipoSelecionado} 
              onValueChange={(value: 'pessoa_fisica' | 'pessoa_juridica') => setValue('tipo', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border-white/20">
                <SelectValue />
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
          </div>

          {/* Nome e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                {tipoSelecionado === 'pessoa_fisica' ? 'Nome Completo' : 'Razão Social'} *
              </Label>
              <Input
                id="nome"
                {...register('nome', { required: 'Nome é obrigatório' })}
                placeholder={tipoSelecionado === 'pessoa_fisica' ? 'Ex: João Silva' : 'Ex: Empresa LTDA'}
                className="bg-white/80 backdrop-blur-sm border-white/20"
              />
              {errors.nome && (
                <p className="text-sm text-red-600">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Categoria <span className="text-red-500">*</span>
              </Label>
              <CategoriaSelectorNovo
                value={categoriaSelecionada}
                onSelect={(categoria) => {
                  setCategoriaSelecionada(categoria);
                  setValue('categoria_id', Number(categoria?.id) || undefined);
                }}
                tipo="income"
                placeholder="Selecione uma categoria"
              />
            </div>
          </div>

          {/* Documento */}
          <div className="space-y-2">
            <Label htmlFor="documento">
              {tipoSelecionado === 'pessoa_fisica' ? 'CPF' : 'CNPJ'}
            </Label>
              <Input
                {...register('documento')}
                placeholder={tipoSelecionado === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                className="bg-white/80 backdrop-blur-sm border-white/20"
              />
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { 
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email inválido'
                  }
                })}
                placeholder="exemplo@email.com"
                className="bg-white/80 backdrop-blur-sm border-white/20"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                {...register('telefone')}
                placeholder="(00) 00000-0000"
                className="bg-white/80 backdrop-blur-sm border-white/20"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              {...register('endereco')}
              placeholder="Endereço completo (opcional)"
              className="bg-white/80 backdrop-blur-sm border-white/20"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações adicionais (opcional)"
              className="bg-white/80 backdrop-blur-sm border-white/20"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              Criar Pagador
            </LoadingButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};