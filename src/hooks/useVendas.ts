import { useVendasSupabaseAtualizado } from './useVendasSupabaseAtualizado';
import { useToast } from '@/hooks/use-toast';
import { VendaValidationService } from '@/services/VendaValidationService';
import { VendaNotificationService } from '@/services/VendaNotificationService';

export function useVendas() {
  const { toast } = useToast();
  const supabaseHook = useVendasSupabaseAtualizado();
  const notificationService = VendaNotificationService.getInstance();

  const salvarVenda = async (dadosVenda: any): Promise<boolean> => {
    try {
      // Validação usando o service
      const validacao = VendaValidationService.validarVenda(dadosVenda);
      
      if (!validacao.valido) {
        notificationService.validacaoFalhou(validacao.erros);
        toast({
          title: "Erro de Validação",
          description: validacao.erros[0],
          variant: "destructive"
        });
        return false;
      }

      // Mostrar avisos se houver
      if (validacao.avisos.length > 0) {
        notificationService.avisosValidacao(validacao.avisos);
      }

      // Preparar dados com valores padrão
      const dadosCompletos = {
        ...dadosVenda,
        data_venda: dadosVenda.data_venda || new Date().toISOString().split('T')[0],
        hora_venda: dadosVenda.hora_venda || new Date().toTimeString().slice(0, 8),
        status: dadosVenda.status || 'ativa',
        ativo: true
      };

      const sucesso = await supabaseHook.criarVenda(dadosCompletos);
      
      if (sucesso) {
        // Notificar sucesso através do service
        const vendaCompleta = {
          id: Date.now(), // Temporário até recarregar
          cliente_nome: 'Cliente', // Será atualizado ao recarregar
          valor_final: dadosCompletos.valor_final,
          comissao_valor: dadosCompletos.comissao_valor,
          vendedor: dadosCompletos.vendedor
        } as any;

        notificationService.vendaCriada(vendaCompleta);
        
        // Verificar se é venda de alto valor
        notificationService.vendaAltoValor(vendaCompleta);
        
        // Verificar comissão
        if (vendaCompleta.comissao_valor && vendaCompleta.comissao_valor > 0) {
          notificationService.comissaoCalculada(vendaCompleta);
        }

        toast({
          title: "Sucesso",
          description: "Venda criada com sucesso!"
        });
      }
      
      return sucesso;
      
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      notificationService.erroOperacao('criação de venda', 'Erro inesperado ao salvar venda');
      toast({
        title: "Erro",
        description: "Erro inesperado ao salvar venda",
        variant: "destructive"
      });
      return false;
    }
  };

  const atualizarVenda = async (id: number, dadosVenda: any): Promise<boolean> => {
    try {
      // Validação usando o service
      const validacao = VendaValidationService.validarVenda(dadosVenda);
      
      if (!validacao.valido) {
        notificationService.validacaoFalhou(validacao.erros);
        toast({
          title: "Erro de Validação",
          description: validacao.erros[0],
          variant: "destructive"
        });
        return false;
      }

      // Mostrar avisos se houver
      if (validacao.avisos.length > 0) {
        notificationService.avisosValidacao(validacao.avisos);
      }

      const sucesso = await supabaseHook.atualizarVenda(id, dadosVenda);
      
      if (sucesso) {
        const vendaCompleta = {
          id,
          cliente_nome: 'Cliente', // Será atualizado ao recarregar
          valor_final: dadosVenda.valor_final || 0
        } as any;

        notificationService.vendaAtualizada(vendaCompleta);
        
        toast({
          title: "Sucesso",
          description: "Venda atualizada com sucesso!"
        });
      }
      
      return sucesso;
      
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      notificationService.erroOperacao('atualização de venda', 'Erro inesperado ao atualizar venda');
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar venda",
        variant: "destructive"
      });
      return false;
    }
  };

  const excluirVenda = async (id: number): Promise<boolean> => {
    try {
      const sucesso = await supabaseHook.excluirVenda(id);
      
      if (sucesso) {
        notificationService.vendaExcluida(id, 'Cliente');
        
        toast({
          title: "Sucesso", 
          description: "Venda excluída com sucesso!"
        });
      }
      
      return sucesso;
      
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      notificationService.erroOperacao('exclusão de venda', 'Erro inesperado ao excluir venda');
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir venda",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    ...supabaseHook,
    salvarVenda,
    atualizarVenda,
    excluirVenda
  };
}