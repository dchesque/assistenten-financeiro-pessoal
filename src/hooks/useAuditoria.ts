import { useState, useEffect } from 'react';

export interface LogAuditoria {
  id: number;
  usuario: string;
  acao: string;
  tabela: string;
  registro_id: number;
  dados_anteriores?: any;
  dados_novos?: any;
  timestamp: string;
}

export interface LogAuditoriaExtendido extends LogAuditoria {
  operacao?: string;
  descricao?: string;
  data_operacao?: string;
}

const mockLogs: LogAuditoriaExtendido[] = [
  {
    id: 1,
    usuario: 'Admin',
    acao: 'CREATE',
    operacao: 'Criação',
    descricao: 'Nova conta criada',
    tabela: 'contas_pagar',
    registro_id: 1,
    dados_novos: { descricao: 'Nova conta', valor: 1000 },
    timestamp: new Date().toISOString(),
    data_operacao: new Date().toISOString()
  },
  {
    id: 2,
    usuario: 'Admin',
    acao: 'UPDATE',
    operacao: 'Atualização',
    descricao: 'Fornecedor atualizado',
    tabela: 'fornecedores',
    registro_id: 1,
    dados_anteriores: { nome: 'Fornecedor Antigo' },
    dados_novos: { nome: 'Fornecedor Novo' },
    timestamp: new Date().toISOString(),
    data_operacao: new Date().toISOString()
  }
];

export function useAuditoria() {
  const [logs, setLogs] = useState<LogAuditoriaExtendido[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarLogs = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLogs(mockLogs);
    setLoading(false);
  };

  useEffect(() => {
    carregarLogs();
  }, []);

  return {
    logs,
    loading,
    estatisticas: {
      total_operacoes: 500,
      atividade_recente: 50,
      usuarios_ativos: 12,
      operacoes_por_tabela: [{ nome: 'contas', count: 200 }, { nome: 'fornecedores', count: 50 }],
      operacoes_por_tipo: [{ tipo: 'create', count: 100 }, { tipo: 'read', count: 300 }]
    },
    carregarLogs,
    buscarLogs: async (filtro: string) => {},
    exportarLogs: async (formato: string) => {},
    limparLogsAntigos: async (dias: number) => {}
  };
}