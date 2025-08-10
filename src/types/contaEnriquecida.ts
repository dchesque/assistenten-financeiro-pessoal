import { ContaPagar } from '@/types/contaPagar';

// Tipo ContaEnriquecida para compatibilidade
export interface ContaEnriquecida extends ContaPagar {
  contact?: { name: string }; // Dados do contato (credor)
  category?: { name: string }; // Dados da categoria
  banco?: { nome: string };
  contact_nome?: string; // Nome do contato (ex-fornecedor_nome)
  category_nome?: string; // Nome da categoria (ex-plano_conta_nome)
  banco_nome?: string;
  dias_para_vencimento?: number;
  dias_em_atraso?: number;
  destacar?: boolean;
}