export interface MovimentacaoFluxo {
  id: string;
  data: Date;
  descricao: string;
  categoria: string;
  categoria_id: number;
  categoria_cor: string;
  tipo: 'entrada' | 'saida' | 'transferencia';
  valor: number;
  status: 'realizado' | 'previsto' | 'em_atraso';
  origem: 'contas_pagar' | 'vendas' | 'bancos' | 'manual';
  origem_id?: string;
  saldo_acumulado: number;
  banco_id?: number;
  banco_nome?: string;
  fornecedor_nome?: string;
  cliente_nome?: string;
  documento_referencia?: string;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProjecaoFluxo {
  periodo: '7_dias' | '30_dias' | '90_dias';
  periodo_label: string;
  data_inicio: Date;
  data_fim: Date;
  entradas_previstas: number;
  saidas_previstas: number;
  saldo_inicial: number;
  saldo_final: number;
  variacao: number;
  variacao_percentual: number;
  status: 'positivo' | 'negativo' | 'critico' | 'estavel';
  confianca: number; // Percentual de confiança na projeção
  detalhes: {
    vendas_previstas: number;
    contas_a_pagar: number;
    transferencias: number;
    outras_entradas: number;
    outras_saidas: number;
  };
}

export interface AlertaFluxo {
  id: string;
  tipo: 'critico' | 'atencao' | 'info' | 'positivo';
  titulo: string;
  descricao: string;
  data_prevista?: Date;
  valor_impacto?: number;
  prioridade: 'alta' | 'media' | 'baixa';
  acoes_sugeridas: string[];
  status: 'ativo' | 'resolvido' | 'ignorado';
  created_at: Date;
}

export interface IndicadorFluxo {
  saldo_atual: number;
  entradas_mes: number;
  entradas_mes_qtd: number;
  saidas_mes: number;
  saidas_mes_qtd: number;
  resultado_mes: number;
  saldo_projetado_30d: number;
  status_liquidez: 'saudavel' | 'atencao' | 'critico';
  dias_caixa: number;
  tendencia_mes: 'positiva' | 'negativa';
  ultima_atualizacao: Date;
}

export interface FiltrosFluxoCaixa {
  data_inicio: string;
  data_fim: string;
  tipo_movimento: ('entrada' | 'saida' | 'transferencia')[];
  categoria_ids: number[];
  status: ('realizado' | 'previsto' | 'em_atraso')[];
  origem: ('contas_pagar' | 'vendas' | 'bancos' | 'manual')[];
  banco_ids: number[];
  periodo_rapido: '7_dias' | '30_dias' | '90_dias' | '6_meses' | 'personalizado';
}

export interface DadosGraficoFluxo {
  periodo: string;
  entradas: number;
  saidas: number;
  saldo_acumulado: number;
  saldo_projetado?: number;
  data: Date;
  is_projecao: boolean;
}

export const STATUS_MOVIMENTO_LABELS = {
  realizado: 'Realizado',
  previsto: 'Previsto',
  em_atraso: 'Em Atraso'
};

export const STATUS_MOVIMENTO_COLORS = {
  realizado: 'bg-green-100/80 text-green-700',
  previsto: 'bg-blue-100/80 text-blue-700',
  em_atraso: 'bg-red-100/80 text-red-700'
};

export const TIPO_MOVIMENTO_LABELS = {
  entrada: 'Entrada',
  saida: 'Saída',
  transferencia: 'Transferência'
};

export const TIPO_MOVIMENTO_COLORS = {
  entrada: 'text-green-600',
  saida: 'text-red-600',
  transferencia: 'text-yellow-600'
};

export const ALERTA_TIPO_COLORS = {
  critico: 'bg-red-100/80 text-red-700 border-red-200/50',
  atencao: 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50',
  info: 'bg-blue-100/80 text-blue-700 border-blue-200/50',
  positivo: 'bg-green-100/80 text-green-700 border-green-200/50'
};

export const ALERTA_TIPO_ICONS = {
  critico: '🚨',
  atencao: '⚠️',
  info: 'ℹ️',
  positivo: '✅'
};

export const STATUS_LIQUIDEZ_LABELS = {
  saudavel: 'Saudável',
  atencao: 'Atenção',
  critico: 'Crítico'
};

export const STATUS_LIQUIDEZ_COLORS = {
  saudavel: 'bg-green-100/80 text-green-700',
  atencao: 'bg-yellow-100/80 text-yellow-700',
  critico: 'bg-red-100/80 text-red-700'
};

export const PERIODOS_RAPIDOS = [
  { valor: '7_dias', label: '7 dias', dias: 7 },
  { valor: '30_dias', label: '30 dias', dias: 30 },
  { valor: '90_dias', label: '90 dias', dias: 90 },
  { valor: '6_meses', label: '6 meses', dias: 180 },
  { valor: 'personalizado', label: 'Personalizado', dias: 0 }
];