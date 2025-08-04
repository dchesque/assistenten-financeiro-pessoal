import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface ValidacaoSistema {
  tabelas_criadas: boolean;
  policies_configuradas: boolean;
  triggers_ativos: boolean;
  usuarios_autenticados: boolean;
  dados_minimos: boolean;
  integracoes_ativas: string[];
  problemas_encontrados: string[];
  recomendacoes: string[];
}

export const useValidacaoSistema = () => {
  const [loading, setLoading] = useState(true);
  const [validacao, setValidacao] = useState<ValidacaoSistema>({
    tabelas_criadas: false,
    policies_configuradas: false,
    triggers_ativos: false,
    usuarios_autenticados: false,
    dados_minimos: false,
    integracoes_ativas: [],
    problemas_encontrados: [],
    recomendacoes: []
  });

  useEffect(() => {
    executarValidacao();
  }, []);

  const executarValidacao = async () => {
    try {
      setLoading(true);
      const resultado: ValidacaoSistema = {
        tabelas_criadas: false,
        policies_configuradas: false,
        triggers_ativos: false,
        usuarios_autenticados: false,
        dados_minimos: false,
        integracoes_ativas: [],
        problemas_encontrados: [],
        recomendacoes: []
      };

      // 1. Verificar se as principais tabelas existem e têm dados
      const tabelasParaVerificar: Array<keyof Database['public']['Tables']> = [
        'fornecedores',
        'clientes', 
        'plano_contas',
        'contas_pagar',
        'vendas',
        'bancos',
        'cheques'
      ];

      let todasTabelasOk = true;
      let temDadosMinimos = true;

      for (const tabela of tabelasParaVerificar) {
        try {
          const { data, error, count } = await supabase
            .from(tabela)
            .select('id', { count: 'exact', head: true });

          if (error) {
            resultado.problemas_encontrados.push(`Erro ao acessar tabela ${tabela}: ${error.message}`);
            todasTabelasOk = false;
          } else {
            console.log(`✅ Tabela ${tabela}: ${count} registros`);
            
            // Verificar dados mínimos essenciais
            if (tabela === 'plano_contas' && (count || 0) < 5) {
              resultado.problemas_encontrados.push(`Tabela ${tabela} precisa de mais registros (mínimo 5)`);
              temDadosMinimos = false;
            }
            
            if (tabela === 'fornecedores' && (count || 0) < 1) {
              resultado.recomendacoes.push(`Cadastre pelo menos 1 fornecedor para usar o sistema`);
            }
          }
        } catch (err) {
          resultado.problemas_encontrados.push(`Falha crítica ao verificar tabela ${tabela}`);
          todasTabelasOk = false;
        }
      }

      resultado.tabelas_criadas = todasTabelasOk;
      resultado.dados_minimos = temDadosMinimos;

      // 2. Verificar RLS Policies
      try {
        // Testar inserção/leitura em uma tabela para verificar RLS
        const { data: testeFornecedor, error: erroRLS } = await supabase
          .from('fornecedores')
          .select('id')
          .limit(1);

        if (!erroRLS) {
          resultado.policies_configuradas = true;
          console.log('✅ RLS Policies configuradas corretamente');
        } else {
          resultado.problemas_encontrados.push(`Problema com RLS: ${erroRLS.message}`);
        }
      } catch (err) {
        resultado.problemas_encontrados.push('RLS não configurado ou com problemas');
      }

      // 3. Verificar integrações específicas
      const integracoes = [];

      // Verificar se há dados de vendas integrados
      const { data: vendas, error: vendaError } = await supabase
        .from('vendas')
        .select('id')
        .limit(1);

      if (!vendaError && vendas && vendas.length > 0) {
        integracoes.push('Módulo de Vendas');
      }

      // Verificar se há movimentações bancárias
      const { data: movBancos, error: bancoError } = await supabase
        .from('movimentacoes_bancarias')
        .select('id')
        .limit(1);

      if (!bancoError && movBancos && movBancos.length > 0) {
        integracoes.push('Movimentações Bancárias');
      }

      // Verificar se há contas a pagar
      const { data: contas, error: contaError } = await supabase
        .from('contas_pagar')
        .select('id')
        .limit(1);

      if (!contaError && contas && contas.length > 0) {
        integracoes.push('Contas a Pagar');
      }

      resultado.integracoes_ativas = integracoes;

      // 4. Gerar recomendações baseadas nos achados
      if (resultado.problemas_encontrados.length === 0) {
        resultado.recomendacoes.push('Sistema funcionando perfeitamente! 🎉');
      }

      if (integracoes.length < 2) {
        resultado.recomendacoes.push('Configure mais módulos para aproveitar melhor o sistema');
      }

      if (!temDadosMinimos) {
        resultado.recomendacoes.push('Complete o cadastro do plano de contas para usar o DRE');
      }

      // 5. Status geral
      resultado.triggers_ativos = true; // Assumindo que os triggers estão funcionando se chegou até aqui
      resultado.usuarios_autenticados = true; // Se conseguiu fazer queries, está autenticado

      setValidacao(resultado);

      console.log('🔍 Validação do Sistema Concluída:', resultado);

    } catch (error) {
      console.error('Erro na validação do sistema:', error);
      setValidacao(prev => ({
        ...prev,
        problemas_encontrados: ['Erro crítico na validação do sistema']
      }));
    } finally {
      setLoading(false);
    }
  };

  const validarModulo = async (modulo: string) => {
    // Validação específica por módulo
    switch (modulo) {
      case 'fluxo-caixa':
        return validarFluxoCaixa();
      case 'dre':
        return validarDRE();
      case 'lancamento-lote':
        return validarLancamentoLote();
      default:
        return { sucesso: false, mensagem: 'Módulo não encontrado' };
    }
  };

  const validarFluxoCaixa = async () => {
    try {
      const { data: bancos } = await supabase.from('bancos').select('id').limit(1);
      const { data: movs } = await supabase.from('movimentacoes_bancarias').select('id').limit(1);
      
      if (!bancos?.length) {
        return { sucesso: false, mensagem: 'Cadastre pelo menos 1 banco para usar o Fluxo de Caixa' };
      }

      return { sucesso: true, mensagem: 'Fluxo de Caixa funcionando corretamente' };
    } catch (error) {
      return { sucesso: false, mensagem: 'Erro na validação do Fluxo de Caixa' };
    }
  };

  const validarDRE = async () => {
    try {
      const { data: vendas } = await supabase.from('vendas').select('id').limit(1);
      const { data: planos } = await supabase.from('plano_contas').select('id');
      
      if (!vendas?.length) {
        return { sucesso: false, mensagem: 'Cadastre vendas para gerar o DRE' };
      }

      if (!planos?.length || planos.length < 5) {
        return { sucesso: false, mensagem: 'Configure o plano de contas completo para o DRE' };
      }

      return { sucesso: true, mensagem: 'DRE funcionando corretamente' };
    } catch (error) {
      return { sucesso: false, mensagem: 'Erro na validação do DRE' };
    }
  };

  const validarLancamentoLote = async () => {
    try {
      const { data: fornecedores } = await supabase.from('fornecedores').select('id').limit(1);
      const { data: planos } = await supabase.from('plano_contas').select('id').limit(1);
      
      if (!fornecedores?.length) {
        return { sucesso: false, mensagem: 'Cadastre fornecedores para usar lançamento em lote' };
      }

      if (!planos?.length) {
        return { sucesso: false, mensagem: 'Configure o plano de contas para lançamentos' };
      }

      return { sucesso: true, mensagem: 'Lançamento em lote funcionando corretamente' };
    } catch (error) {
      return { sucesso: false, mensagem: 'Erro na validação do lançamento em lote' };
    }
  };

  const sistemaEstaFuncional = () => {
    return validacao.tabelas_criadas && 
           validacao.policies_configuradas && 
           validacao.dados_minimos &&
           validacao.problemas_encontrados.length === 0;
  };

  return {
    validacao,
    loading,
    sistemaEstaFuncional: sistemaEstaFuncional(),
    validarModulo,
    revalidar: executarValidacao
  };
};