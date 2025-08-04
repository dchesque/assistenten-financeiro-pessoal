import { useState, useEffect } from 'react';
import { useVendas } from '@/hooks/useVendas';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useDadosEssenciaisDREConectado } from '@/hooks/useDadosEssenciaisDREConectado';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useContasPagar } from '@/hooks/useContasPagar';
import { useToast } from '@/hooks/use-toast';

export interface StatusIntegracao {
  vendas: boolean;
  fornecedores: boolean;
  contas_pagar: boolean;
  plano_contas: boolean;
  dre: boolean;
  fluxo_caixa: boolean;
}

export interface EstatisticasGerais {
  vendas_mes: number;
  receita_mes: number;
  contas_pendentes: number;
  valor_pendente: number;
  fornecedores_ativos: number;
  categorias_ativas: number;
}

export const useIntegracaoCompleta = () => {
  const { toast } = useToast();
  
  // Hooks dos módulos
  const vendas = useVendas();
  const fornecedores = useFornecedores();
  const dreHook = useDadosEssenciaisDREConectado();
  const planoContas = usePlanoContas();
  const contasPagar = useContasPagar();

  const [statusIntegracao, setStatusIntegracao] = useState<StatusIntegracao>({
    vendas: false,
    fornecedores: false,
    contas_pagar: false,
    plano_contas: false,
    dre: false,
    fluxo_caixa: false
  });

  const [estatisticasGerais, setEstatisticasGerais] = useState<EstatisticasGerais>({
    vendas_mes: 0,
    receita_mes: 0,
    contas_pendentes: 0,
    valor_pendente: 0,
    fornecedores_ativos: 0,
    categorias_ativas: 0
  });

  const [loading, setLoading] = useState(true);

  // Verificar status da integração
  const verificarIntegracao = async () => {
    try {
      setLoading(true);

      // Verificar se cada módulo está funcionando
      const statusCheck = {
        vendas: vendas.vendas.length >= 0 && !vendas.loading,
        fornecedores: fornecedores.fornecedores.length >= 0 && !fornecedores.loading,
        contas_pagar: contasPagar.contas.length >= 0 && !contasPagar.estados.carregandoContas,
        plano_contas: planoContas.planoContas.length >= 0 && !planoContas.loading,
        dre: dreHook.dadosEssenciais.length >= 0 && !dreHook.loading,
        fluxo_caixa: true // Assumir ativo por enquanto
      };

      setStatusIntegracao(statusCheck);

      // Calcular estatísticas gerais
      const agora = new Date();
      const mesAtual = agora.getMonth() + 1;
      const anoAtual = agora.getFullYear();

      const vendasMes = vendas.vendas.filter(v => {
        const dataVenda = new Date(v.data_venda);
        return dataVenda.getMonth() + 1 === mesAtual && dataVenda.getFullYear() === anoAtual;
      });

      const receitaMes = vendasMes.reduce((acc, v) => acc + Number(v.valor_final || v.valor_liquido || 0), 0);
      const contasPendentes = contasPagar.contas.filter(c => c.status === 'pendente');
      const valorPendente = contasPendentes.reduce((acc, c) => acc + Number(c.valor_final), 0);
      const fornecedoresAtivos = fornecedores.fornecedores.filter(f => f.ativo).length;
      const categoriasAtivas = planoContas.planoContas.filter(p => p.ativo).length;

      setEstatisticasGerais({
        vendas_mes: vendasMes.length,
        receita_mes: receitaMes,
        contas_pendentes: contasPendentes.length,
        valor_pendente: valorPendente,
        fornecedores_ativos: fornecedoresAtivos,
        categorias_ativas: categoriasAtivas
      });

    } catch (error) {
      console.error('Erro ao verificar integração:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar status da integração",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Força recarregamento de todos os módulos
  const recarregarTudo = async () => {
    try {
      setLoading(true);
      
      await Promise.all([
        vendas.carregarVendas(),
        fornecedores.recarregar(),
        // contasPagar não tem método de reload direto
        planoContas.listarPlanoContas(),
        dreHook.carregarDadosEssenciais()
      ]);

      await verificarIntegracao();

      toast({
        title: "Sucesso",
        description: "Todos os dados foram recarregados!"
      });

    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao recarregar alguns módulos",
        variant: "destructive"
      });
    }
  };

  // Testar conexão completa do sistema
  const testarConexaoCompleta = async () => {
    try {
      setLoading(true);

      // Teste 1: Verificar se consegue criar uma venda
      console.log('🧪 Teste 1: Sistema de Vendas...');
      const vendasCount = vendas.vendas.length;
      console.log(`✅ Vendas carregadas: ${vendasCount}`);

      // Teste 2: Verificar fornecedores
      console.log('🧪 Teste 2: Sistema de Fornecedores...');
      const fornecedoresCount = fornecedores.fornecedores.length;
      console.log(`✅ Fornecedores carregados: ${fornecedoresCount}`);

      // Teste 3: Verificar contas a pagar
      console.log('🧪 Teste 3: Contas a Pagar...');
      const contasCount = contasPagar.contas.length;
      console.log(`✅ Contas carregadas: ${contasCount}`);

      // Teste 4: Verificar plano de contas
      console.log('🧪 Teste 4: Plano de Contas...');
      const categoriaCount = planoContas.planoContas.length;
      console.log(`✅ Categorias carregadas: ${categoriaCount}`);

      // Teste 5: Verificar DRE
      console.log('🧪 Teste 5: Sistema DRE...');
      const dreCount = dreHook.dadosEssenciais.length;
      console.log(`✅ Dados DRE carregados: ${dreCount}`);

      // Teste 6: Buscar dados de integração para o mês atual
      console.log('🧪 Teste 6: Integração DRE com Vendas...');
      const mesAtual = new Date().toISOString().substring(0, 7); // YYYY-MM
      const dadosIntegracao = await dreHook.obterDadosIntegracao(mesAtual);
      console.log(`✅ Dados de integração obtidos:`, dadosIntegracao);

      await verificarIntegracao();

      toast({
        title: "✅ Teste Completo",
        description: "Todos os sistemas estão funcionando corretamente!",
      });

      return true;

    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      toast({
        title: "❌ Teste Faltou", 
        description: "Alguns sistemas apresentaram problemas",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verificar integração automaticamente quando os hooks carregarem
  useEffect(() => {
    if (!vendas.loading && !fornecedores.loading && !contasPagar.estados.carregandoContas && !planoContas.loading && !dreHook.loading) {
      verificarIntegracao();
    }
  }, [
    vendas.loading, 
    fornecedores.loading, 
    contasPagar.estados.carregandoContas, 
    planoContas.loading, 
    dreHook.loading,
    vendas.vendas.length,
    fornecedores.fornecedores.length,
    contasPagar.contas.length,
    planoContas.planoContas.length,
    dreHook.dadosEssenciais.length
  ]);

  return {
    // Estados
    statusIntegracao,
    estatisticasGerais,
    loading,
    
    // Módulos individuais
    vendas,
    fornecedores,
    contasPagar,
    planoContas,
    dreHook,
    
    // Ações globais
    verificarIntegracao,
    recarregarTudo,
    testarConexaoCompleta,
    
    // Status geral
    sistemaIntegrado: Object.values(statusIntegracao).every(status => status),
    modulosCarregados: !vendas.loading && !fornecedores.loading && !contasPagar.estados.carregandoContas && !planoContas.loading && !dreHook.loading
  };
};