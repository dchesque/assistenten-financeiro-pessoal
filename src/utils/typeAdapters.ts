import { AccountPayable } from '@/types/accounts';
import { ContaPagar } from '@/types/contaPagar';
import { ContaEnriquecida } from '@/types/contaEnriquecida';

/**
 * Converte AccountPayable para ContaPagar/ContaEnriquecida
 */
export function accountPayableToContaPagar(account: AccountPayable): ContaEnriquecida {
  // Mapear status do inglês para português
  const statusMap: Record<string, 'pendente' | 'pago' | 'vencido' | 'cancelado'> = {
    'pending': 'pendente',
    'paid': 'pago',
    'overdue': 'vencido',
    'cancelled': 'cancelado'
  };

  return {
    id: account.id,
    fornecedor_id: account.contact_id || '',
    plano_conta_id: account.category_id || '',
    banco_id: account.bank_account_id || undefined,
    documento_referencia: account.reference_document || undefined,
    descricao: account.description,
    data_emissao: account.issue_date || new Date().toISOString().split('T')[0],
    data_vencimento: account.due_date,
    valor_original: account.amount,
    percentual_juros: 0,
    valor_juros: 0,
    percentual_desconto: 0,
    valor_desconto: 0,
    valor_final: account.amount,
    status: statusMap[account.status] || 'pendente',
    data_pagamento: account.paid_at || undefined,
    valor_pago: account.amount,
    grupo_lancamento: undefined,
    parcela_atual: 1,
    total_parcelas: 1,
    forma_pagamento: 'dinheiro',
    dda: false,
    observacoes: account.notes || undefined,
    user_id: account.user_id,
    created_at: account.created_at,
    updated_at: account.updated_at,
    
    // Campos enriched
    fornecedor: account.contact ? { 
      nome: account.contact.name
    } : undefined,
    plano_conta: account.category ? { 
      id: parseInt(account.category.id),
      codigo: 'AUTO',
      nome: account.category.name,
      tipo_dre: 'despesa_pessoal' as const,
      cor: account.category.color || '#6B7280',
      icone: 'Package',
      nivel: 1,
      plano_pai_id: null,
      aceita_lancamento: true,
      ativo: true,
      total_contas: 0,
      valor_total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } : undefined,
    banco: account.bank_account?.bank ? { nome: account.bank_account.bank.name } : undefined,
    fornecedor_nome: account.contact?.name || '',
    plano_conta_nome: account.category?.name || '',
    banco_nome: account.bank_account?.bank?.name || '',
    dias_para_vencimento: calcularDiasParaVencimento(account.due_date),
    dias_em_atraso: calcularDiasEmAtraso(account.due_date, account.status)
  };
}

/**
 * Converte ContaPagar para AccountPayable
 */
export function contaPagarToAccountPayable(conta: ContaPagar): Partial<AccountPayable> {
  // Mapear status do português para inglês
  const statusMap: Record<string, 'pending' | 'paid' | 'overdue' | 'canceled'> = {
    'pendente': 'pending',
    'pago': 'paid',
    'vencido': 'overdue',
    'cancelado': 'canceled'
  };

  return {
    id: conta.id?.toString(),
    description: conta.descricao,
    amount: conta.valor_final,
    due_date: conta.data_vencimento,
    status: statusMap[conta.status] || 'pending',
    contact_id: conta.fornecedor_id?.toString(),
    category_id: conta.plano_conta_id?.toString(),
    bank_account_id: conta.banco_id?.toString(),
    reference_document: conta.documento_referencia,
    notes: conta.observacoes,
    issue_date: conta.data_emissao,
    paid_at: conta.data_pagamento,
    user_id: conta.user_id,
    created_at: conta.created_at,
    updated_at: conta.updated_at
  };
}

/**
 * Calcula dias para vencimento
 */
function calcularDiasParaVencimento(dataVencimento: string): number {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diffTime = vencimento.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula dias em atraso
 */
function calcularDiasEmAtraso(dataVencimento: string, status: string): number {
  if (status === 'paid' || status === 'pago') return 0;
  
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diffTime = hoje.getTime() - vencimento.getTime();
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return dias > 0 ? dias : 0;
}