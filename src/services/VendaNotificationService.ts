import { type VendaCompleta } from '@/types/venda';

export interface NotificacaoVenda {
  id: string;
  tipo: 'sucesso' | 'aviso' | 'erro' | 'info';
  titulo: string;
  mensagem: string;
  timestamp: Date;
  vendaId?: number;
  acao?: {
    label: string;
    callback: () => void;
  };
}

export class VendaNotificationService {
  private static instance: VendaNotificationService;
  private notificacoes: NotificacaoVenda[] = [];
  private listeners: ((notificacoes: NotificacaoVenda[]) => void)[] = [];

  static getInstance(): VendaNotificationService {
    if (!VendaNotificationService.instance) {
      VendaNotificationService.instance = new VendaNotificationService();
    }
    return VendaNotificationService.instance;
  }

  /**
   * Adiciona um listener para mudanças nas notificações
   */
  addListener(callback: (notificacoes: NotificacaoVenda[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notifica todos os listeners
   */
  private notificarListeners() {
    this.listeners.forEach(listener => listener([...this.notificacoes]));
  }

  /**
   * Adiciona uma notificação
   */
  private adicionarNotificacao(notificacao: Omit<NotificacaoVenda, 'id' | 'timestamp'>) {
    const novaNotificacao: NotificacaoVenda = {
      ...notificacao,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.notificacoes.unshift(novaNotificacao);
    
    // Manter apenas as últimas 50 notificações
    if (this.notificacoes.length > 50) {
      this.notificacoes = this.notificacoes.slice(0, 50);
    }

    this.notificarListeners();
    return novaNotificacao.id;
  }

  /**
   * Remove uma notificação
   */
  removerNotificacao(id: string) {
    this.notificacoes = this.notificacoes.filter(n => n.id !== id);
    this.notificarListeners();
  }

  /**
   * Limpa todas as notificações
   */
  limparNotificacoes() {
    this.notificacoes = [];
    this.notificarListeners();
  }

  /**
   * Obtém todas as notificações
   */
  obterNotificacoes(): NotificacaoVenda[] {
    return [...this.notificacoes];
  }

  // Métodos específicos para vendas

  /**
   * Notifica sucesso na criação de venda
   */
  vendaCriada(venda: VendaCompleta) {
    return this.adicionarNotificacao({
      tipo: 'sucesso',
      titulo: 'Venda Criada',
      mensagem: `Venda para ${venda.cliente_nome} no valor de ${this.formatarMoeda(venda.valor_final)} foi criada com sucesso!`,
      vendaId: venda.id
    });
  }

  /**
   * Notifica sucesso na atualização de venda
   */
  vendaAtualizada(venda: VendaCompleta) {
    return this.adicionarNotificacao({
      tipo: 'sucesso',
      titulo: 'Venda Atualizada',
      mensagem: `Venda #${venda.id} foi atualizada com sucesso!`,
      vendaId: venda.id
    });
  }

  /**
   * Notifica exclusão de venda
   */
  vendaExcluida(vendaId: number, clienteNome: string) {
    return this.adicionarNotificacao({
      tipo: 'info',
      titulo: 'Venda Excluída',
      mensagem: `Venda #${vendaId} para ${clienteNome} foi excluída.`,
      vendaId
    });
  }

  /**
   * Notifica venda duplicada
   */
  vendaDuplicada(vendaOriginal: VendaCompleta, novaVenda: VendaCompleta) {
    return this.adicionarNotificacao({
      tipo: 'sucesso',
      titulo: 'Venda Duplicada',
      mensagem: `Venda #${vendaOriginal.id} foi duplicada como venda #${novaVenda.id}`,
      vendaId: novaVenda.id
    });
  }

  /**
   * Notifica erro na operação
   */
  erroOperacao(operacao: string, erro: string) {
    return this.adicionarNotificacao({
      tipo: 'erro',
      titulo: `Erro na ${operacao}`,
      mensagem: erro
    });
  }

  /**
   * Notifica sobre validações
   */
  validacaoFalhou(erros: string[]) {
    const mensagem = erros.length === 1 
      ? erros[0] 
      : `${erros.length} erros encontrados: ${erros.slice(0, 2).join(', ')}${erros.length > 2 ? '...' : ''}`;

    return this.adicionarNotificacao({
      tipo: 'erro',
      titulo: 'Validação Falhou',
      mensagem
    });
  }

  /**
   * Notifica avisos de validação
   */
  avisosValidacao(avisos: string[]) {
    const mensagem = avisos.length === 1 
      ? avisos[0] 
      : `${avisos.length} avisos: ${avisos.slice(0, 2).join(', ')}${avisos.length > 2 ? '...' : ''}`;

    return this.adicionarNotificacao({
      tipo: 'aviso',
      titulo: 'Atenção',
      mensagem
    });
  }

  /**
   * Notifica sobre metas de vendas
   */
  metaVendasAlcancada(meta: number, atual: number) {
    return this.adicionarNotificacao({
      tipo: 'sucesso',
      titulo: 'Meta Alcançada! 🎉',
      mensagem: `Parabéns! Você alcançou ${((atual / meta) * 100).toFixed(1)}% da meta de vendas diária!`
    });
  }

  /**
   * Notifica sobre vendas de alto valor
   */
  vendaAltoValor(venda: VendaCompleta, limite: number = 1000) {
    if (venda.valor_final >= limite) {
      return this.adicionarNotificacao({
        tipo: 'info',
        titulo: 'Venda de Alto Valor! 💰',
        mensagem: `Venda de ${this.formatarMoeda(venda.valor_final)} para ${venda.cliente_nome} registrada!`,
        vendaId: venda.id
      });
    }
  }

  /**
   * Notifica sobre comissões
   */
  comissaoCalculada(venda: VendaCompleta) {
    if (venda.comissao_valor && venda.comissao_valor > 0) {
      return this.adicionarNotificacao({
        tipo: 'info',
        titulo: 'Comissão Calculada',
        mensagem: `Comissão de ${this.formatarMoeda(venda.comissao_valor)} calculada para ${venda.vendedor || 'vendedor'}`,
        vendaId: venda.id
      });
    }
  }

  /**
   * Notifica sobre relatórios gerados
   */
  relatorioGerado(periodo: string, totalVendas: number, valorTotal: number) {
    return this.adicionarNotificacao({
      tipo: 'sucesso',
      titulo: 'Relatório Gerado',
      mensagem: `Relatório do período ${periodo}: ${totalVendas} vendas totalizando ${this.formatarMoeda(valorTotal)}`
    });
  }

  /**
   * Notifica sobre importação de vendas
   */
  importacaoVendas(sucessos: number, erros: number) {
    const tipo = erros > 0 ? 'aviso' : 'sucesso';
    const titulo = erros > 0 ? 'Importação Parcial' : 'Importação Concluída';
    const mensagem = erros > 0 
      ? `${sucessos} vendas importadas com sucesso, ${erros} com erro`
      : `${sucessos} vendas importadas com sucesso!`;

    return this.adicionarNotificacao({
      tipo,
      titulo,
      mensagem
    });
  }

  /**
   * Notifica sobre backup de dados
   */
  backupRealizado(quantidadeVendas: number) {
    return this.adicionarNotificacao({
      tipo: 'info',
      titulo: 'Backup Realizado',
      mensagem: `Backup de ${quantidadeVendas} vendas realizado com sucesso`
    });
  }

  /**
   * Notifica sobre sincronização
   */
  sincronizacaoCompleta(vendas: number, clientes: number) {
    return this.adicionarNotificacao({
      tipo: 'sucesso',
      titulo: 'Sincronização Completa',
      mensagem: `${vendas} vendas e ${clientes} clientes sincronizados`
    });
  }

  /**
   * Notifica sobre performance do sistema
   */
  performanceAlerta(operacao: string, tempo: number) {
    if (tempo > 5000) { // Mais de 5 segundos
      return this.adicionarNotificacao({
        tipo: 'aviso',
        titulo: 'Performance',
        mensagem: `Operação ${operacao} demorou ${(tempo / 1000).toFixed(1)}s para completar`
      });
    }
  }

  // Métodos utilitários

  /**
   * Formatar valor em moeda brasileira
   */
  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Formatar data em português
   */
  private formatarData(data: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  }

  /**
   * Obter estatísticas das notificações
   */
  obterEstatisticas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const notificacaosDiaAtual = this.notificacoes.filter(n => 
      n.timestamp >= hoje
    );

    return {
      total: this.notificacoes.length,
      hoje: notificacaosDiaAtual.length,
      porTipo: {
        sucesso: this.notificacoes.filter(n => n.tipo === 'sucesso').length,
        erro: this.notificacoes.filter(n => n.tipo === 'erro').length,
        aviso: this.notificacoes.filter(n => n.tipo === 'aviso').length,
        info: this.notificacoes.filter(n => n.tipo === 'info').length
      }
    };
  }
}