// Tipo ContaEnriquecida para compatibilidade
export interface ContaEnriquecida extends ContaPagar {
  fornecedor?: { nome: string };
  plano_contas?: { nome: string };
  banco?: { nome: string };
  fornecedor_nome?: string;
  plano_conta_nome?: string;
  banco_nome?: string;
  dias_para_vencimento?: number;
  dias_em_atraso?: number;
}