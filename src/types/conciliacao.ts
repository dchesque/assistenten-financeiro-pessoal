export interface DivergenciaConciliacao {
  id: string;
  tipo: 'valor_diferente' | 'transacao_nao_encontrada' | 'data_divergente';
  descricao: string;
  valor_esperado: number;
  valor_encontrado: number;
  transacao_venda_id?: string;
  transacao_recebimento_id?: string;
  status: 'pendente' | 'resolvida' | 'justificada';
  resolucao?: ResolucaoDivergencia;
  created_at: Date;
}

export interface ResolucaoDivergencia {
  tipo: 'ajuste_manual' | 'justificativa' | 'exclusao';
  motivo: string;
  valor_ajuste?: number;
  aprovado_por?: string;
  data_resolucao: Date;
}

export interface VinculoTransacao {
  id: string;
  venda_id: string;
  recebimento_id: string;
  valor_vinculado: number;
  tipo_vinculo: 'automatico' | 'manual';
  created_at: Date;
}

export interface EstatisticasConciliacao {
  total_maquininhas: number;
  taxa_conciliacao_mes: number;
  divergencias_pendentes: number;
  valor_divergente: number;
  tempo_medio_resolucao: number; // em dias
  por_operadora: {
    rede: { conciliadas: number; pendentes: number };
    sipag: { conciliadas: number; pendentes: number };
  };
}

export interface ToleranciasConciliacao {
  valor_maximo: number; // R$ 1,00 padrão
  dias_diferenca: number; // ±2 dias padrão
  percentual_diferenca: number; // 0.1% padrão
  agrupamento_automatico: boolean; // true padrão
}

export interface AlertaConciliacao {
  tipo: 'divergencia_critica' | 'conciliacao_pendente' | 'erro_processamento';
  maquininha_id: string;
  periodo: string;
  valor_divergencia?: number;
  prazo_resolucao: Date;
}

export interface VendaImportada {
  nsu: string;
  data_venda: Date;
  valor_bruto: number;
  valor_taxa: number;
  valor_liquido: number;
  bandeira: string;
  tipo_transacao: string;
  parcelas: number;
}

export interface RecebimentoImportado {
  data_recebimento: Date;
  valor: number;
  descricao: string;
  documento: string;
  tipo_operacao: string;
}

export interface ValidacaoResult {
  valido: boolean;
  erros: string[];
  avisos?: string[];
  total_registros?: number;
}

export interface ProcessamentoResult {
  sucesso: boolean;
  vendas_processadas: number;
  recebimentos_processados: number;
  divergencias_encontradas: number;
  erros: string[];
}

export interface FiltrosConciliacao {
  periodo_inicio?: string;
  periodo_fim?: string;
  maquininha_id?: string;
  status?: 'conciliado' | 'divergencia' | 'pendente';
  operadora?: 'rede' | 'sipag';
}

export interface RelatorioConciliacao {
  periodo: string;
  total_maquininhas: number;
  valor_vendas: number;
  valor_recebimentos: number;
  taxa_conciliacao: number;
  divergencias: DivergenciaConciliacao[];
  detalhes_por_maquininha: {
    maquininha_id: string;
    nome: string;
    status: string;
    valor_vendas: number;
    valor_recebimentos: number;
    divergencias: number;
  }[];
}

export interface DadosConciliacao {
  vendas: Array<{
    id: string;
    nsu: string;
    data_venda: Date;
    valor_bruto: number;
    valor_liquido: number;
    valor_taxa: number;
    bandeira: string;
    tipo_transacao: string;
    status: 'pendente' | 'conciliado';
    vinculado_a?: string;
  }>;
  recebimentos: Array<{
    id: string;
    data_recebimento: Date;
    valor: number;
    descricao: string;
    documento: string;
    status: 'pendente_conciliacao' | 'conciliado';
    vinculado_a?: string;
  }>;
  divergencias: DivergenciaConciliacao[];
  resumo: {
    total_vendas: number;
    total_recebimentos: number;
    diferenca: number;
    taxa_conciliacao: number;
  };
}