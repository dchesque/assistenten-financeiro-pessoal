import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, X, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { Modal, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { usePagadores } from '@/hooks/usePagadores';
import { useMascaras } from '@/hooks/useMascaras';

const pagadorSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipo: z.enum(['pessoa_fisica', 'pessoa_juridica'], {
    required_error: 'Tipo é obrigatório'
  }),
  documento: z.string().min(11, 'Documento é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone é obrigatório'),
  endereco: z.string().optional(),
  observacoes: z.string().optional()
});

type PagadorForm = z.infer<typeof pagadorSchema>;

interface CadastroRapidoPagadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPagadorCriado: (pagadorId: number) => void;
}

export function CadastroRapidoPagadorModal({ 
  isOpen, 
  onClose, 
  onPagadorCriado 
}: CadastroRapidoPagadorModalProps) {
  const [loading, setLoading] = useState(false);
  const { criarPagador } = usePagadores();
  const { 
    aplicarMascaraDocumento, 
    aplicarMascaraTelefone, 
    removerMascara 
  } = useMascaras();

  const form = useForm<PagadorForm>({
    resolver: zodResolver(pagadorSchema),
    defaultValues: {
      nome: '',
      tipo: 'pessoa_fisica',
      documento: '',
      email: '',
      telefone: '',
      endereco: '',
      observacoes: ''
    }
  });

  const watchedTipo = form.watch('tipo');

  const onSubmit = async (data: PagadorForm) => {
    setLoading(true);
    try {
      const documentoLimpo = removerMascara(data.documento);
      const telefoneLimpo = removerMascara(data.telefone);

      const dadosPagador = {
        nome: data.nome,
        tipo: data.tipo,
        documento: documentoLimpo,
        telefone: telefoneLimpo,
        email: data.email,
        endereco: data.endereco,
        observacoes: data.observacoes
      };

      const sucesso = await criarPagador(dadosPagador);

      if (sucesso) {
        toast({
          title: "Sucesso!",
          description: "Pagador cadastrado com sucesso!",
        });
        
        // Mock do ID para demonstração - em produção viria da API
        const novoId = Math.floor(Math.random() * 1000) + 1;
        onPagadorCriado(novoId);
        
        form.reset();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao criar pagador:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar pagador. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentoChange = (value: string) => {
    const mascaraAplicada = aplicarMascaraDocumento(value, watchedTipo === 'pessoa_fisica' ? 'PF' : 'PJ');
    form.setValue('documento', mascaraAplicada);
  };

  const handleTelefoneChange = (value: string) => {
    const mascaraAplicada = aplicarMascaraTelefone(value);
    form.setValue('telefone', mascaraAplicada);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cadastro Rápido de Pagador"
      subtitle="Cadastre um novo pagador rapidamente"
      icon={<User className="w-5 h-5 text-white" />}
      size="lg"
    >
      <ModalContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nome do pagador"
                        {...field}
                        className="bg-white/80 border-gray-300/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/80 border-gray-300/50">
                          <SelectValue placeholder="Selecionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                        <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchedTipo === 'pessoa_fisica' ? 'CPF' : 'CNPJ'} *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={watchedTipo === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                        value={field.value}
                        onChange={(e) => handleDocumentoChange(e.target.value)}
                        className="bg-white/80 border-gray-300/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(00) 00000-0000"
                        value={field.value}
                        onChange={(e) => handleTelefoneChange(e.target.value)}
                        className="bg-white/80 border-gray-300/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="email@exemplo.com"
                      {...field}
                      className="bg-white/80 border-gray-300/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Endereço completo"
                      {...field}
                      className="bg-white/80 border-gray-300/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      className="bg-white/80 border-gray-300/50 resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </ModalContent>

      <ModalFooter showRequiredNote>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={loading}
          className="bg-white/80 hover:bg-white"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Salvar Pagador
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}