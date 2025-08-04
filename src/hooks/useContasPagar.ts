import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ContaPagar, FiltrosContaPagar } from '@/types/contaPagar';
import { supabase } from '@/integrations/supabase/client';
import { ChequeParaCriacao } from '@/types/formaPagamento';
import { CheckCircle, List, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ContaEnriquecida extends ContaPagar {
  fornecedor: any;
  plano_conta: any;
  banco?: any;
  dias_para_vencimento: number;
  dias_em_atraso: number;
  destacar?: boolean; // Para destacar contas do lote
}

export interface EstadosOperacao {
  carregandoContas: boolean;
  salvandoEdicao: boolean;
  processandoBaixa: boolean;
  excluindoConta: boolean;
  duplicandoConta: boolean;
  validandoCheques: boolean; // NOVO
  processandoLote: boolean;  // NOVO
}

export const useContasPagar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados principais
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [filtros, setFiltros] = useState<FiltrosContaPagar>({
    busca: '',
    status: 'todos',
    fornecedor_id: 'todos',
    plano_conta_id: 'todos',
    data_inicio: '',
    data_fim: ''
  });
  const [filtroRapido, setFiltroRapido] = useState('todos');
  
  // Estados de operações
  const [estados, setEstados] = useState<EstadosOperacao>({
    carregandoContas: true,
    salvandoEdicao: false,
    processandoBaixa: false,
    excluindoConta: false,
    duplicandoConta: false,
    validandoCheques: false,
    processandoLote: false
  });
  
  // Estado de erro
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados para filtro por lote
  const [filtroLoteAtivo, setFiltroLoteAtivo] = useState(false);
  const [loteIdFiltrado, setLoteIdFiltrado] = useState<string | null>(null);
  const [destacarParcelas, setDestacarParcelas] = useState(false);

  // Função para toast de sucesso personalizado
  const toastSucessoPersonalizado = (
    acao: string, 
    descricao: string, 
    opcoes?: {
      verTodas?: boolean;
      editarNovamente?: boolean;
      contaId?: number;
    }
  ) => {
    const titulo = `✅ ${acao} realizada com sucesso`;
    let descricaoCompleta = descricao;
    
    if (opcoes?.verTodas || opcoes?.editarNovamente) {
      descricaoCompleta += '\n\nAções disponíveis:';
      if (opcoes.verTodas) descricaoCompleta += '\n• Ver todas as contas';
      if (opcoes.editarNovamente) descricaoCompleta += '\n• Editar novamente';
    }
    
    toast({
      title: titulo,
      description: descricaoCompleta,
      duration: 6000,
      className: "border-l-4 border-l-green-500"
    });
  };

  // Detectar parâmetros URL para filtro automático por lote
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const loteId = searchParams.get('lote');
    const shouldHighlight = searchParams.get('highlight') === 'true';
    
    if (loteId) {
      setFiltroLoteAtivo(true);
      setLoteIdFiltrado(loteId);
      
      // Aplicar filtro automático
      setFiltros(prev => ({
        ...prev,
        busca: '' // Limpar busca para mostrar apenas o lote
      }));
    }
    
    if (shouldHighlight) {
      setDestacarParcelas(true);
    }
  }, [location.search]);

  // Carregar dados do Supabase
  useEffect(() => {
    carregarContas();
  }, []);

  const carregarContas = async () => {
    setEstados(prev => ({ ...prev, carregandoContas: true }));
    setErro(null);
    
    try {
      // ✅ OBRIGATÓRIO: Verificar autenticação primeiro
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // ✅ CRÍTICO: Adicionar filtro user_id na query
      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          *,
          fornecedores!inner(id, nome, documento),
          plano_contas!inner(id, nome, codigo),
          bancos(id, nome)
        `)
        .eq('user_id', user.id)  // 🔥 FILTRO ESSENCIAL
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Converter dados do Supabase para formato ContaPagar
      const contasConvertidas = (data || []).map(item => ({
        id: item.id,
        fornecedor_id: item.fornecedor_id,
        plano_conta_id: item.plano_conta_id,
        banco_id: item.banco_id,
        documento_referencia: item.documento_referencia,
        descricao: item.descricao,
        data_emissao: (item as any).data_emissao || null,
        data_lancamento: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        data_vencimento: item.data_vencimento,
        valor_original: item.valor_original,
        percentual_juros: 0,
        valor_juros: 0,
        percentual_desconto: 0,
        valor_desconto: 0,
        valor_final: item.valor_final,
        status: item.status as 'pendente' | 'pago' | 'vencido' | 'cancelado',
        data_pagamento: item.data_pagamento,
        valor_pago: (item as any).valor_pago || null,
        // Novos campos obrigatórios
        grupo_lancamento: (item as any).grupo_lancamento || null,
        parcela_atual: (item as any).parcela_atual || 1,
        total_parcelas: (item as any).total_parcelas || 1,
        forma_pagamento: (item as any).forma_pagamento || 'dinheiro_pix',
        dda: false,
        observacoes: item.observacoes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        fornecedores: item.fornecedores,
        plano_contas: item.plano_contas,
        bancos: item.bancos
      }));
      
      setContas(contasConvertidas);
      
    } catch (error: any) {
      console.error('Erro ao carregar contas:', error);
      const mensagemErro = error.code === 'PGRST301' 
        ? 'Sem permissão para acessar contas' 
        : 'Falha ao carregar contas. Verifique sua conexão.';
      
      setErro(mensagemErro);
      toast({ 
        title: "Erro", 
        description: mensagemErro, 
        variant: "destructive" 
      });
    } finally {
      setEstados(prev => ({ ...prev, carregandoContas: false }));
    }
  };

  // Enriquecer contas com dados dos relacionamentos
  const contasEnriquecidas = useMemo(() => {
    return contas.map(conta => {
      const fornecedor = (conta as any).fornecedores || null;
      const plano_conta = (conta as any).plano_contas || null;
      const banco = (conta as any).bancos || null;

      // Calcular dias para vencimento (com normalização de horário)
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const vencimento = new Date(conta.data_vencimento);
      vencimento.setHours(0, 0, 0, 0);
      const diffTime = vencimento.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Determinar se deve destacar (do lote)
      const destacar = filtroLoteAtivo && 
                      destacarParcelas && 
                      (conta as any).lote_id === loteIdFiltrado;

      return {
        ...conta,
        fornecedor: fornecedor || { id: 0, nome: 'N/A', documento: '' },
        plano_conta: plano_conta || { id: 0, codigo: 'N/A', nome: 'N/A' },
        banco,
        dias_para_vencimento: diffDays >= 0 ? diffDays : 0,
        dias_em_atraso: diffDays < 0 ? Math.abs(diffDays) : 0,
        destacar
      } as ContaEnriquecida;
    });
  }, [contas, filtroLoteAtivo, destacarParcelas, loteIdFiltrado]);

  // Filtrar contas
  const contasFiltradas = useMemo(() => {
    let contasFiltradas = contasEnriquecidas.filter(conta => {
      // Filtro por lote (prioritário)
      if (filtroLoteAtivo && loteIdFiltrado) {
        const matchLote = (conta as any).lote_id === loteIdFiltrado;
        if (!matchLote) return false;
      }

      const matchBusca = !filtros.busca || 
        conta.descricao.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        conta.documento_referencia?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        conta.fornecedor.nome.toLowerCase().includes(filtros.busca.toLowerCase());
      
      const matchStatus = filtros.status === 'todos' || conta.status === filtros.status;
      const matchFornecedor = filtros.fornecedor_id === 'todos' || conta.fornecedor_id === filtros.fornecedor_id;
      const matchPlano = filtros.plano_conta_id === 'todos' || conta.plano_conta_id === filtros.plano_conta_id;
      
      return matchBusca && matchStatus && matchFornecedor && matchPlano;
    });

    // Aplicar filtro rápido
    if (filtroRapido !== 'todos') {
      contasFiltradas = contasFiltradas.filter(conta => conta.status === filtroRapido);
    }
    
    return contasFiltradas;
  }, [contasEnriquecidas, filtros, filtroRapido, filtroLoteAtivo, loteIdFiltrado]);

  // Calcular resumos
  const resumos = useMemo(() => {
    const totalPendente = contasEnriquecidas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor_final, 0);
    const totalVencido = contasEnriquecidas.filter(c => c.status === 'vencido').reduce((sum, c) => sum + c.valor_final, 0);
    const totalAVencer7Dias = contasEnriquecidas.filter(c => c.status === 'pendente' && c.dias_para_vencimento <= 7).reduce((sum, c) => sum + c.valor_final, 0);
    
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const totalPagoMes = contasEnriquecidas.filter(c => 
      c.status === 'pago' && 
      c.data_pagamento && 
      new Date(c.data_pagamento) >= inicioMes
    ).reduce((sum, c) => sum + (c.valor_pago || 0), 0);

    return {
      pendente: {
        valor: totalPendente,
        quantidade: contasEnriquecidas.filter(c => c.status === 'pendente').length
      },
      vencido: {
        valor: totalVencido,
        quantidade: contasEnriquecidas.filter(c => c.status === 'vencido').length
      },
      aVencer7Dias: {
        valor: totalAVencer7Dias,
        quantidade: contasEnriquecidas.filter(c => c.status === 'pendente' && c.dias_para_vencimento <= 7).length
      },
      pagoMes: {
        valor: totalPagoMes,
        quantidade: contasEnriquecidas.filter(c => 
          c.status === 'pago' && 
          c.data_pagamento && 
          new Date(c.data_pagamento) >= inicioMes
        ).length
      }
    };
  }, [contasEnriquecidas]);

  // Operações
  const salvarEdicao = async (dadosEdicao: any) => {
    setEstados(prev => ({ ...prev, salvandoEdicao: true }));
    
    try {
      if (dadosEdicao.id) {
        // Editar conta existente
        const { error } = await supabase
          .from('contas_pagar')
          .update({
            descricao: dadosEdicao.descricao,
            documento_referencia: dadosEdicao.documento_referencia,
            fornecedor_id: dadosEdicao.fornecedor_id,
            plano_conta_id: dadosEdicao.plano_conta_id,
            valor_original: dadosEdicao.valor_original,
            valor_final: dadosEdicao.valor_final,
            data_vencimento: dadosEdicao.data_vencimento,
            observacoes: dadosEdicao.observacoes,
            updated_at: new Date().toISOString()
          })
          .eq('id', dadosEdicao.id);
        
        if (error) throw error;
        await carregarContas();
        
        toastSucessoPersonalizado(
          "Conta atualizada",
          `"${dadosEdicao.descricao}" foi salva com sucesso`,
          { verTodas: true, editarNovamente: true, contaId: dadosEdicao.id }
        );
      } else {
        // Criar nova conta
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { error } = await supabase
          .from('contas_pagar')
          .insert({
            descricao: dadosEdicao.descricao,
            documento_referencia: dadosEdicao.documento_referencia,
            fornecedor_id: dadosEdicao.fornecedor_id,
            plano_conta_id: dadosEdicao.plano_conta_id,
            valor_original: dadosEdicao.valor_original,
            valor_final: dadosEdicao.valor_final,
            data_vencimento: dadosEdicao.data_vencimento,
            observacoes: dadosEdicao.observacoes,
            status: 'pendente',
            user_id: user.id
          });
        
        const { data: novaConta } = await supabase
          .from('contas_pagar')
          .insert({
            descricao: dadosEdicao.descricao,
            documento_referencia: dadosEdicao.documento_referencia,
            fornecedor_id: dadosEdicao.fornecedor_id,
            plano_conta_id: dadosEdicao.plano_conta_id,
            valor_original: dadosEdicao.valor_original,
            valor_final: dadosEdicao.valor_final,
            data_vencimento: dadosEdicao.data_vencimento,
            observacoes: dadosEdicao.observacoes,
            status: 'pendente',
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        await carregarContas();
        
        toastSucessoPersonalizado(
          "Conta criada",
          `"${dadosEdicao.descricao}" foi cadastrada e está pendente de pagamento`,
          { verTodas: true, editarNovamente: true, contaId: novaConta?.id }
        );
      }
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: error.message || "Erro interno do servidor",
        variant: "destructive"
      });
      throw error;
    } finally {
      setEstados(prev => ({ ...prev, salvandoEdicao: false }));
    }
  };

  const confirmarBaixa = async (dadosBaixa: any) => {
    setEstados(prev => ({ ...prev, processandoBaixa: true }));
    
    try {
      // Atualizar conta no Supabase
      const { error } = await supabase
        .from('contas_pagar')
        .update({
          status: 'pago',
          data_pagamento: dadosBaixa.data_pagamento,
          valor_pago: dadosBaixa.valor_pago,
          banco_id: dadosBaixa.banco_id ? parseInt(dadosBaixa.banco_id) : null,
          forma_pagamento: dadosBaixa.forma_pagamento,
          observacoes: dadosBaixa.observacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', dadosBaixa.conta_id);
      
      if (error) throw error;

      // Se for pagamento via cheque, criar cheque automaticamente
      if (dadosBaixa.forma_pagamento === 'cheque' && dadosBaixa.numero_cheque) {
        await criarChequeAutomatico({
          numero_cheque: dadosBaixa.numero_cheque,
          banco_id: dadosBaixa.banco_id,
          tipo_beneficiario: 'fornecedor',
          fornecedor_id: dadosBaixa.fornecedor_id,
          valor: dadosBaixa.valor_pago,
          data_emissao: dadosBaixa.data_pagamento,
          data_vencimento: dadosBaixa.data_pagamento,
          finalidade: `Pagamento conta #${dadosBaixa.conta_id}`,
          status: 'pendente',
          conta_vinculada_id: dadosBaixa.conta_id,
          criado_automaticamente: true
        });
        
        // Buscar dados da conta para feedback rico
        const contaPaga = contasEnriquecidas.find(c => c.id === dadosBaixa.conta_id);
        toastSucessoPersonalizado(
          "Conta baixada",
          `"${contaPaga?.descricao || 'Conta'}" foi marcada como paga e cheque criado automaticamente`,
          { verTodas: true }
        );
      } else {
        // Buscar dados da conta para feedback rico
        const contaPaga = contasEnriquecidas.find(c => c.id === dadosBaixa.conta_id);
        toastSucessoPersonalizado(
          "Conta baixada",
          `"${contaPaga?.descricao || 'Conta'}" foi marcada como paga`,
          { verTodas: true }
        );
      }
      
      await carregarContas();
    } catch (error: any) {
      console.error('Erro ao processar baixa:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao processar baixa", 
        variant: "destructive" 
      });
      throw error;
    } finally {
      setEstados(prev => ({ ...prev, processandoBaixa: false }));
    }
  };

  const excluirConta = async (contaId: number) => {
    setEstados(prev => ({ ...prev, excluindoConta: true }));
    
    try {
      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', contaId);
      
      if (error) throw error;
      
      // Buscar dados da conta antes de excluir para feedback rico
      const contaExcluida = contasEnriquecidas.find(c => c.id === contaId);
      
      await carregarContas();
      
      toastSucessoPersonalizado(
        "Conta excluída",
        `"${contaExcluida?.descricao || 'Conta'}" foi removida permanentemente`
      );
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: "❌ Erro ao excluir", 
        description: error.message || "Não foi possível excluir a conta",
        variant: "destructive"
      });
      throw error;
    } finally {
      setEstados(prev => ({ ...prev, excluindoConta: false }));
    }
  };

  const cancelarConta = async (contaId: number) => {
    try {
      const { error } = await supabase
        .from('contas_pagar')
        .update({ 
          status: 'cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', contaId);
      
      if (error) throw error;
      
      await carregarContas();
      toast({ description: "Conta cancelada com sucesso!" });
    } catch (error: any) {
      console.error('Erro ao cancelar conta:', error);
      toast({ 
        title: "Erro", 
        description: "Erro ao cancelar conta", 
        variant: "destructive" 
      });
      throw error;
    }
  };

  // Criar nova conta
  const criarConta = async (dadosConta: Omit<ContaPagar, 'id' | 'created_at' | 'updated_at'>) => {
    setEstados(prev => ({ ...prev, salvandoEdicao: true }));
    
    try {
      // Validar foreign keys
      const { data: fornecedor, error: fornecedorError } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('id', dadosConta.fornecedor_id)
        .eq('ativo', true)
        .single();

      if (fornecedorError || !fornecedor) {
        throw new Error('Fornecedor não encontrado ou inativo');
      }

      const { data: planoContas, error: planoContasError } = await supabase
        .from('plano_contas')
        .select('id')
        .eq('id', dadosConta.plano_conta_id)
        .eq('ativo', true)
        .single();

      if (planoContasError || !planoContas) {
        throw new Error('Plano de contas não encontrado ou inativo');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Preparar dados para inserção
      const contaParaInserir = {
        fornecedor_id: dadosConta.fornecedor_id,
        plano_conta_id: dadosConta.plano_conta_id,
        banco_id: dadosConta.banco_id || null,
        documento_referencia: dadosConta.documento_referencia || null,
        descricao: dadosConta.descricao,
        data_vencimento: dadosConta.data_vencimento,
        data_pagamento: dadosConta.data_pagamento || null,
        valor_original: dadosConta.valor_original,
        desconto: dadosConta.valor_desconto || 0,
        acrescimo: dadosConta.valor_juros || 0,
        valor_final: dadosConta.valor_final,
        status: dadosConta.status,
        forma_pagamento: dadosConta.forma_pagamento || null,
        observacoes: dadosConta.observacoes || null,
        parcela_atual: 1,
        total_parcelas: 1,
        user_id: user.id
      };

      const { data: novaConta, error: contaError } = await supabase
        .from('contas_pagar')
        .insert(contaParaInserir)
        .select()
        .single();

      if (contaError) {
        console.error('Erro ao criar conta:', contaError);
        throw new Error('Erro ao salvar conta');
      }

      // Se a forma de pagamento for cheque, criar cheque automaticamente
      if (dadosConta.forma_pagamento === 'cheque' && dadosConta.banco_id && dadosConta.status === 'pago') {
        await criarChequeAutomatico({
          banco_id: dadosConta.banco_id,
          conta_pagar_id: novaConta.id,
          numero_cheque: '', // Seria preenchido automaticamente
          valor: dadosConta.valor_final,
          data_emissao: dadosConta.data_pagamento || new Date().toISOString().split('T')[0],
          beneficiario_nome: '', // Seria obtido do fornecedor
        });
      }

      // Recarregar contas
      await carregarContas();

      return novaConta;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    } finally {
      setEstados(prev => ({ ...prev, salvandoEdicao: false }));
    }
  };

  // Função auxiliar para criar cheque automaticamente
  const criarChequeAutomatico = async (dadosCheque: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error: chequeError } = await supabase
        .from('cheques')
        .insert({
          banco_id: dadosCheque.banco_id,
          conta_pagar_id: dadosCheque.conta_pagar_id,
          numero_cheque: dadosCheque.numero_cheque || 'AUTO',
          valor: dadosCheque.valor,
          data_emissao: dadosCheque.data_emissao,
          beneficiario_nome: dadosCheque.beneficiario_nome || 'Fornecedor',
          status: 'emitido',
          user_id: user.id
        });

      if (chequeError) {
        console.error('Erro ao criar cheque:', chequeError);
      }
    } catch (error) {
      console.error('Erro ao criar cheque automaticamente:', error);
    }
  };

  // Limpar filtros
  const limparTodosFiltros = () => {
    setFiltros({
      busca: '',
      status: 'todos',
      fornecedor_id: 'todos',
      plano_conta_id: 'todos',
      data_inicio: '',
      data_fim: ''
    });
    setFiltroRapido('todos');
    limparFiltroLote();
  };

  const limparFiltroLote = () => {
    setFiltroLoteAtivo(false);
    setLoteIdFiltrado(null);
    setDestacarParcelas(false);
    
    // Remover parâmetros da URL
    const newUrl = location.pathname;
    navigate(newUrl, { replace: true });
  };

  const verTodasAsContas = () => {
    limparFiltroLote();
    setFiltroRapido('todos');
  };

  return {
    // Estados
    contas: contasFiltradas,
    contasEnriquecidas,
    estados,
    filtros,
    filtroRapido,
    resumos,
    erro,
    
    // Estados do lote
    filtroLoteAtivo,
    loteIdFiltrado,
    destacarParcelas,
    
    // Setters
    setFiltros,
    setFiltroRapido,
    
    // Operações
    criarConta,
    salvarEdicao,
    confirmarBaixa,
    excluirConta,
    cancelarConta,
    limparTodosFiltros,
    limparFiltroLote,
    verTodasAsContas
  };
};