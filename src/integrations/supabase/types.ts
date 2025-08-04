export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          dados_antes: Json | null
          dados_depois: Json | null
          data_operacao: string | null
          descricao: string | null
          id: number
          ip_address: unknown | null
          operacao: string
          registro_id: number | null
          tabela: string
          tempo_execucao: unknown | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          dados_antes?: Json | null
          dados_depois?: Json | null
          data_operacao?: string | null
          descricao?: string | null
          id?: number
          ip_address?: unknown | null
          operacao: string
          registro_id?: number | null
          tabela: string
          tempo_execucao?: unknown | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          dados_antes?: Json | null
          dados_depois?: Json | null
          data_operacao?: string | null
          descricao?: string | null
          id?: number
          ip_address?: unknown | null
          operacao?: string
          registro_id?: number | null
          tabela?: string
          tempo_execucao?: unknown | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      bancos: {
        Row: {
          agencia: string
          ativo: boolean | null
          codigo_banco: string
          conta: string
          created_at: string | null
          data_ultima_sincronizacao: string | null
          digito_verificador: string | null
          email: string | null
          gerente: string | null
          id: number
          limite: number | null
          limite_conta: number | null
          limite_usado: number | null
          nome: string
          observacoes: string | null
          saldo_atual: number | null
          saldo_inicial: number | null
          suporta_ofx: boolean | null
          telefone: string | null
          tipo_conta: string | null
          ultimo_fitid: string | null
          updated_at: string | null
          url_ofx: string | null
          user_id: string
        }
        Insert: {
          agencia: string
          ativo?: boolean | null
          codigo_banco: string
          conta: string
          created_at?: string | null
          data_ultima_sincronizacao?: string | null
          digito_verificador?: string | null
          email?: string | null
          gerente?: string | null
          id?: number
          limite?: number | null
          limite_conta?: number | null
          limite_usado?: number | null
          nome: string
          observacoes?: string | null
          saldo_atual?: number | null
          saldo_inicial?: number | null
          suporta_ofx?: boolean | null
          telefone?: string | null
          tipo_conta?: string | null
          ultimo_fitid?: string | null
          updated_at?: string | null
          url_ofx?: string | null
          user_id: string
        }
        Update: {
          agencia?: string
          ativo?: boolean | null
          codigo_banco?: string
          conta?: string
          created_at?: string | null
          data_ultima_sincronizacao?: string | null
          digito_verificador?: string | null
          email?: string | null
          gerente?: string | null
          id?: number
          limite?: number | null
          limite_conta?: number | null
          limite_usado?: number | null
          nome?: string
          observacoes?: string | null
          saldo_atual?: number | null
          saldo_inicial?: number | null
          suporta_ofx?: boolean | null
          telefone?: string | null
          tipo_conta?: string | null
          ultimo_fitid?: string | null
          updated_at?: string | null
          url_ofx?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cheques: {
        Row: {
          banco_id: number
          beneficiario_documento: string | null
          beneficiario_nome: string
          conta_pagar_id: number | null
          created_at: string | null
          data_compensacao: string | null
          data_emissao: string
          data_vencimento: string | null
          finalidade: string | null
          fornecedor_id: number | null
          id: number
          motivo_cancelamento: string | null
          motivo_devolucao: string | null
          numero_cheque: string
          observacoes: string | null
          status: string | null
          tipo_beneficiario: string | null
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          banco_id: number
          beneficiario_documento?: string | null
          beneficiario_nome: string
          conta_pagar_id?: number | null
          created_at?: string | null
          data_compensacao?: string | null
          data_emissao: string
          data_vencimento?: string | null
          finalidade?: string | null
          fornecedor_id?: number | null
          id?: number
          motivo_cancelamento?: string | null
          motivo_devolucao?: string | null
          numero_cheque: string
          observacoes?: string | null
          status?: string | null
          tipo_beneficiario?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          banco_id?: number
          beneficiario_documento?: string | null
          beneficiario_nome?: string
          conta_pagar_id?: number | null
          created_at?: string | null
          data_compensacao?: string | null
          data_emissao?: string
          data_vencimento?: string | null
          finalidade?: string | null
          fornecedor_id?: number | null
          id?: number
          motivo_cancelamento?: string | null
          motivo_devolucao?: string | null
          numero_cheque?: string
          observacoes?: string | null
          status?: string | null
          tipo_beneficiario?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cheques_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cheques_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          created_at: string | null
          data_ultima_compra: string | null
          documento: string
          email: string | null
          estado: string | null
          id: number
          logradouro: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          receber_promocoes: boolean | null
          rg_ie: string | null
          status: string
          telefone: string | null
          ticket_medio: number | null
          tipo: string
          total_compras: number | null
          updated_at: string | null
          user_id: string
          valor_total_compras: number | null
          whatsapp: string | null
          whatsapp_marketing: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string | null
          data_ultima_compra?: string | null
          documento: string
          email?: string | null
          estado?: string | null
          id?: number
          logradouro?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          receber_promocoes?: boolean | null
          rg_ie?: string | null
          status?: string
          telefone?: string | null
          ticket_medio?: number | null
          tipo?: string
          total_compras?: number | null
          updated_at?: string | null
          user_id: string
          valor_total_compras?: number | null
          whatsapp?: string | null
          whatsapp_marketing?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          created_at?: string | null
          data_ultima_compra?: string | null
          documento?: string
          email?: string | null
          estado?: string | null
          id?: number
          logradouro?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          receber_promocoes?: boolean | null
          rg_ie?: string | null
          status?: string
          telefone?: string | null
          ticket_medio?: number | null
          tipo?: string
          total_compras?: number | null
          updated_at?: string | null
          user_id?: string
          valor_total_compras?: number | null
          whatsapp?: string | null
          whatsapp_marketing?: boolean | null
        }
        Relationships: []
      }
      conciliacoes_maquininha: {
        Row: {
          created_at: string | null
          data_conciliacao: string
          id: string
          maquininha_id: string
          observacoes: string | null
          periodo: string
          status: string | null
          total_recebimentos: number
          total_taxas: number
          total_vendas: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_conciliacao: string
          id?: string
          maquininha_id: string
          observacoes?: string | null
          periodo: string
          status?: string | null
          total_recebimentos: number
          total_taxas: number
          total_vendas: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_conciliacao?: string
          id?: string
          maquininha_id?: string
          observacoes?: string | null
          periodo?: string
          status?: string | null
          total_recebimentos?: number
          total_taxas?: number
          total_vendas?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conciliacoes_maquininha_maquininha_id_fkey"
            columns: ["maquininha_id"]
            isOneToOne: false
            referencedRelation: "maquininhas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          acrescimo: number | null
          banco_id: number | null
          created_at: string | null
          data_emissao: string | null
          data_pagamento: string | null
          data_vencimento: string
          desconto: number | null
          descricao: string
          documento_referencia: string | null
          forma_pagamento: string | null
          fornecedor_id: number
          grupo_lancamento: string | null
          id: number
          lote_id: string | null
          observacoes: string | null
          parcela_atual: number | null
          plano_conta_id: number
          status: string | null
          total_parcelas: number | null
          updated_at: string | null
          user_id: string
          valor_final: number
          valor_original: number
        }
        Insert: {
          acrescimo?: number | null
          banco_id?: number | null
          created_at?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          desconto?: number | null
          descricao: string
          documento_referencia?: string | null
          forma_pagamento?: string | null
          fornecedor_id: number
          grupo_lancamento?: string | null
          id?: number
          lote_id?: string | null
          observacoes?: string | null
          parcela_atual?: number | null
          plano_conta_id: number
          status?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          user_id: string
          valor_final: number
          valor_original: number
        }
        Update: {
          acrescimo?: number | null
          banco_id?: number | null
          created_at?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number | null
          descricao?: string
          documento_referencia?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: number
          grupo_lancamento?: string | null
          id?: number
          lote_id?: string | null
          observacoes?: string | null
          parcela_atual?: number | null
          plano_conta_id?: number
          status?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          user_id?: string
          valor_final?: number
          valor_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      dados_essenciais_dre: {
        Row: {
          cmv_valor: number
          created_at: string | null
          deducoes_receita: number | null
          estoque_final_qtd: number | null
          estoque_final_valor: number | null
          estoque_inicial_qtd: number | null
          estoque_inicial_valor: number | null
          id: number
          mes_referencia: string
          observacoes: string | null
          percentual_devolucoes: number | null
          percentual_impostos: number | null
          updated_at: string | null
        }
        Insert: {
          cmv_valor?: number
          created_at?: string | null
          deducoes_receita?: number | null
          estoque_final_qtd?: number | null
          estoque_final_valor?: number | null
          estoque_inicial_qtd?: number | null
          estoque_inicial_valor?: number | null
          id?: number
          mes_referencia: string
          observacoes?: string | null
          percentual_devolucoes?: number | null
          percentual_impostos?: number | null
          updated_at?: string | null
        }
        Update: {
          cmv_valor?: number
          created_at?: string | null
          deducoes_receita?: number | null
          estoque_final_qtd?: number | null
          estoque_final_valor?: number | null
          estoque_inicial_qtd?: number | null
          estoque_inicial_valor?: number | null
          id?: number
          mes_referencia?: string
          observacoes?: string | null
          percentual_devolucoes?: number | null
          percentual_impostos?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      detalhes_conciliacao: {
        Row: {
          conciliacao_id: string
          data: string
          diferenca: number
          id: string
          motivo_divergencia: string | null
          recebimento_quantidade: number
          recebimento_valor: number
          status: string | null
          vendas_quantidade: number
          vendas_valor: number
        }
        Insert: {
          conciliacao_id: string
          data: string
          diferenca: number
          id?: string
          motivo_divergencia?: string | null
          recebimento_quantidade: number
          recebimento_valor: number
          status?: string | null
          vendas_quantidade: number
          vendas_valor: number
        }
        Update: {
          conciliacao_id?: string
          data?: string
          diferenca?: number
          id?: string
          motivo_divergencia?: string | null
          recebimento_quantidade?: number
          recebimento_valor?: number
          status?: string | null
          vendas_quantidade?: number
          vendas_valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalhes_conciliacao_conciliacao_id_fkey"
            columns: ["conciliacao_id"]
            isOneToOne: false
            referencedRelation: "conciliacoes_maquininha"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          categoria_padrao_id: number | null
          cep: string | null
          cidade: string | null
          created_at: string | null
          documento: string
          email: string | null
          estado: string | null
          id: number
          inscricao_estadual: string | null
          logradouro: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          observacoes: string | null
          telefone: string | null
          tipo: string
          tipo_fornecedor: string | null
          total_compras: number | null
          ultima_compra: string | null
          updated_at: string | null
          user_id: string
          valor_total: number | null
        }
        Insert: {
          ativo?: boolean | null
          bairro?: string | null
          categoria_padrao_id?: number | null
          cep?: string | null
          cidade?: string | null
          created_at?: string | null
          documento: string
          email?: string | null
          estado?: string | null
          id?: number
          inscricao_estadual?: string | null
          logradouro?: string | null
          nome: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          tipo: string
          tipo_fornecedor?: string | null
          total_compras?: number | null
          ultima_compra?: string | null
          updated_at?: string | null
          user_id: string
          valor_total?: number | null
        }
        Update: {
          ativo?: boolean | null
          bairro?: string | null
          categoria_padrao_id?: number | null
          cep?: string | null
          cidade?: string | null
          created_at?: string | null
          documento?: string
          email?: string | null
          estado?: string | null
          id?: number
          inscricao_estadual?: string | null
          logradouro?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
          tipo_fornecedor?: string | null
          total_compras?: number | null
          ultima_compra?: string | null
          updated_at?: string | null
          user_id?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_categoria_padrao_id_fkey"
            columns: ["categoria_padrao_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_ofx: {
        Row: {
          agencia: string | null
          codigo_banco: string | null
          conciliado: boolean | null
          conta: string | null
          created_at: string | null
          data_transacao: string
          descricao: string | null
          documento: string | null
          id: number
          movimentacao_bancaria_id: number | null
          movimentacao_ofx_id: number
          saldo: number | null
          tipo_transacao: string
          valor: number
        }
        Insert: {
          agencia?: string | null
          codigo_banco?: string | null
          conciliado?: boolean | null
          conta?: string | null
          created_at?: string | null
          data_transacao: string
          descricao?: string | null
          documento?: string | null
          id?: number
          movimentacao_bancaria_id?: number | null
          movimentacao_ofx_id: number
          saldo?: number | null
          tipo_transacao: string
          valor: number
        }
        Update: {
          agencia?: string | null
          codigo_banco?: string | null
          conciliado?: boolean | null
          conta?: string | null
          created_at?: string | null
          data_transacao?: string
          descricao?: string | null
          documento?: string | null
          id?: number
          movimentacao_bancaria_id?: number | null
          movimentacao_ofx_id?: number
          saldo?: number | null
          tipo_transacao?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_ofx_movimentacao_bancaria_id_fkey"
            columns: ["movimentacao_bancaria_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_bancarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_ofx_movimentacao_ofx_id_fkey"
            columns: ["movimentacao_ofx_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_ofx"
            referencedColumns: ["id"]
          },
        ]
      }
      maquininhas: {
        Row: {
          ativo: boolean | null
          banco_id: number
          codigo_estabelecimento: string
          created_at: string | null
          id: string
          nome: string
          operadora: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          banco_id: number
          codigo_estabelecimento: string
          created_at?: string | null
          id?: string
          nome: string
          operadora: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          banco_id?: number
          codigo_estabelecimento?: string
          created_at?: string | null
          id?: string
          nome?: string
          operadora?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maquininhas_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_bancarias: {
        Row: {
          ativo: boolean | null
          banco_id: number
          categoria: string | null
          created_at: string | null
          data_movimentacao: string
          descricao: string
          documento_referencia: string | null
          id: number
          observacoes: string | null
          saldo_anterior: number | null
          saldo_posterior: number | null
          tipo_movimentacao: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          banco_id: number
          categoria?: string | null
          created_at?: string | null
          data_movimentacao: string
          descricao: string
          documento_referencia?: string | null
          id?: number
          observacoes?: string | null
          saldo_anterior?: number | null
          saldo_posterior?: number | null
          tipo_movimentacao: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          ativo?: boolean | null
          banco_id?: number
          categoria?: string | null
          created_at?: string | null
          data_movimentacao?: string
          descricao?: string
          documento_referencia?: string | null
          id?: number
          observacoes?: string | null
          saldo_anterior?: number | null
          saldo_posterior?: number | null
          tipo_movimentacao?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_bancarias_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_bancarias_ofx: {
        Row: {
          banco_id: number
          categoria_automatica: string | null
          conta_pagar_id: number | null
          created_at: string | null
          data_processamento: string
          data_transacao: string
          descricao: string
          fitid: string | null
          id: number
          origem: string | null
          status_conciliacao: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          banco_id: number
          categoria_automatica?: string | null
          conta_pagar_id?: number | null
          created_at?: string | null
          data_processamento: string
          data_transacao: string
          descricao: string
          fitid?: string | null
          id?: number
          origem?: string | null
          status_conciliacao?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          banco_id?: number
          categoria_automatica?: string | null
          conta_pagar_id?: number | null
          created_at?: string | null
          data_processamento?: string
          data_transacao?: string
          descricao?: string
          fitid?: string | null
          id?: number
          origem?: string | null
          status_conciliacao?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_bancarias_ofx_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_bancarias_ofx_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_ofx: {
        Row: {
          banco_id: number
          conteudo_ofx: string
          created_at: string | null
          data_processamento: string | null
          id: number
          nome_arquivo: string
          observacoes: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          status_processamento: string | null
          total_movimentacoes: number | null
          updated_at: string | null
        }
        Insert: {
          banco_id: number
          conteudo_ofx: string
          created_at?: string | null
          data_processamento?: string | null
          id?: number
          nome_arquivo: string
          observacoes?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status_processamento?: string | null
          total_movimentacoes?: number | null
          updated_at?: string | null
        }
        Update: {
          banco_id?: number
          conteudo_ofx?: string
          created_at?: string | null
          data_processamento?: string | null
          id?: number
          nome_arquivo?: string
          observacoes?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          status_processamento?: string | null
          total_movimentacoes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_ofx_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas: {
        Row: {
          aceita_lancamento: boolean | null
          ativo: boolean | null
          codigo: string
          cor: string | null
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: number
          nivel: number
          nome: string
          observacoes: string | null
          plano_pai_id: number | null
          tipo_dre: string | null
          total_contas: number | null
          updated_at: string | null
          user_id: string
          valor_total: number | null
        }
        Insert: {
          aceita_lancamento?: boolean | null
          ativo?: boolean | null
          codigo: string
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: number
          nivel?: number
          nome: string
          observacoes?: string | null
          plano_pai_id?: number | null
          tipo_dre?: string | null
          total_contas?: number | null
          updated_at?: string | null
          user_id: string
          valor_total?: number | null
        }
        Update: {
          aceita_lancamento?: boolean | null
          ativo?: boolean | null
          codigo?: string
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: number
          nivel?: number
          nome?: string
          observacoes?: string | null
          plano_pai_id?: number | null
          tipo_dre?: string | null
          total_contas?: number | null
          updated_at?: string | null
          user_id?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_plano_pai_id_fkey"
            columns: ["plano_pai_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      processamentos_extrato: {
        Row: {
          arquivo_bancario_nome: string
          arquivo_bancario_processado_em: string
          arquivo_bancario_tipo: string
          arquivo_bancario_total_registros: number
          arquivo_vendas_nome: string
          arquivo_vendas_processado_em: string
          arquivo_vendas_tipo: string
          arquivo_vendas_total_registros: number
          conciliado_automaticamente: number | null
          created_at: string | null
          divergencias: number | null
          id: string
          maquininha_id: string
          periodo: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          arquivo_bancario_nome: string
          arquivo_bancario_processado_em: string
          arquivo_bancario_tipo: string
          arquivo_bancario_total_registros: number
          arquivo_vendas_nome: string
          arquivo_vendas_processado_em: string
          arquivo_vendas_tipo: string
          arquivo_vendas_total_registros: number
          conciliado_automaticamente?: number | null
          created_at?: string | null
          divergencias?: number | null
          id?: string
          maquininha_id: string
          periodo: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          arquivo_bancario_nome?: string
          arquivo_bancario_processado_em?: string
          arquivo_bancario_tipo?: string
          arquivo_bancario_total_registros?: number
          arquivo_vendas_nome?: string
          arquivo_vendas_processado_em?: string
          arquivo_vendas_tipo?: string
          arquivo_vendas_total_registros?: number
          conciliado_automaticamente?: number | null
          created_at?: string | null
          divergencias?: number | null
          id?: string
          maquininha_id?: string
          periodo?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processamentos_extrato_maquininha_id_fkey"
            columns: ["maquininha_id"]
            isOneToOne: false
            referencedRelation: "maquininhas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          email: string
          empresa: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email: string
          empresa?: string | null
          id: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          empresa?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recebimentos_bancario: {
        Row: {
          banco_id: number
          created_at: string | null
          data_recebimento: string
          descricao: string
          documento: string | null
          id: string
          periodo_processamento: string
          status: string | null
          tipo_operacao: string | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          banco_id: number
          created_at?: string | null
          data_recebimento: string
          descricao: string
          documento?: string | null
          id?: string
          periodo_processamento: string
          status?: string | null
          tipo_operacao?: string | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          banco_id?: number
          created_at?: string | null
          data_recebimento?: string
          descricao?: string
          documento?: string | null
          id?: string
          periodo_processamento?: string
          status?: string | null
          tipo_operacao?: string | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_bancario_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
        ]
      }
      taxas_maquininha: {
        Row: {
          ativo: boolean | null
          bandeira: string
          created_at: string | null
          id: string
          maquininha_id: string
          parcelas_max: number | null
          taxa_fixa: number | null
          taxa_percentual: number
          tipo_transacao: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bandeira: string
          created_at?: string | null
          id?: string
          maquininha_id: string
          parcelas_max?: number | null
          taxa_fixa?: number | null
          taxa_percentual: number
          tipo_transacao: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bandeira?: string
          created_at?: string | null
          id?: string
          maquininha_id?: string
          parcelas_max?: number | null
          taxa_fixa?: number | null
          taxa_percentual?: number
          tipo_transacao?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taxas_maquininha_maquininha_id_fkey"
            columns: ["maquininha_id"]
            isOneToOne: false
            referencedRelation: "maquininhas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          ativo: boolean | null
          cliente_id: number
          comissao_percentual: number | null
          comissao_valor: number | null
          created_at: string | null
          data_venda: string
          desconto: number | null
          forma_pagamento: string
          hora_venda: string
          id: number
          observacoes: string | null
          parcelas: number | null
          plano_conta_id: number | null
          status: string | null
          tipo_venda: string | null
          updated_at: string | null
          user_id: string
          valor_final: number
          valor_total: number
          vendedor: string | null
          vendedor_id: number | null
        }
        Insert: {
          ativo?: boolean | null
          cliente_id: number
          comissao_percentual?: number | null
          comissao_valor?: number | null
          created_at?: string | null
          data_venda?: string
          desconto?: number | null
          forma_pagamento: string
          hora_venda?: string
          id?: number
          observacoes?: string | null
          parcelas?: number | null
          plano_conta_id?: number | null
          status?: string | null
          tipo_venda?: string | null
          updated_at?: string | null
          user_id: string
          valor_final: number
          valor_total: number
          vendedor?: string | null
          vendedor_id?: number | null
        }
        Update: {
          ativo?: boolean | null
          cliente_id?: number
          comissao_percentual?: number | null
          comissao_valor?: number | null
          created_at?: string | null
          data_venda?: string
          desconto?: number | null
          forma_pagamento?: string
          hora_venda?: string
          id?: number
          observacoes?: string | null
          parcelas?: number | null
          plano_conta_id?: number | null
          status?: string | null
          tipo_venda?: string | null
          updated_at?: string | null
          user_id?: string
          valor_final?: number
          valor_total?: number
          vendedor?: string | null
          vendedor_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_maquininha: {
        Row: {
          bandeira: string
          created_at: string | null
          data_recebimento: string
          data_venda: string
          id: string
          maquininha_id: string
          nsu: string
          parcelas: number | null
          periodo_processamento: string
          status: string | null
          taxa_percentual_cobrada: number
          tipo_transacao: string
          updated_at: string | null
          valor_bruto: number
          valor_liquido: number
          valor_taxa: number
        }
        Insert: {
          bandeira: string
          created_at?: string | null
          data_recebimento: string
          data_venda: string
          id?: string
          maquininha_id: string
          nsu: string
          parcelas?: number | null
          periodo_processamento: string
          status?: string | null
          taxa_percentual_cobrada: number
          tipo_transacao: string
          updated_at?: string | null
          valor_bruto: number
          valor_liquido: number
          valor_taxa: number
        }
        Update: {
          bandeira?: string
          created_at?: string | null
          data_recebimento?: string
          data_venda?: string
          id?: string
          maquininha_id?: string
          nsu?: string
          parcelas?: number | null
          periodo_processamento?: string
          status?: string | null
          taxa_percentual_cobrada?: number
          tipo_transacao?: string
          updated_at?: string | null
          valor_bruto?: number
          valor_liquido?: number
          valor_taxa?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_maquininha_maquininha_id_fkey"
            columns: ["maquininha_id"]
            isOneToOne: false
            referencedRelation: "maquininhas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendedores: {
        Row: {
          acesso_sistema: boolean | null
          ativo: boolean | null
          bairro: string | null
          cargo: string | null
          cep: string | null
          cidade: string | null
          codigo_vendedor: string
          comissao_total_recebida: number | null
          complemento: string | null
          created_at: string | null
          data_admissao: string | null
          data_demissao: string | null
          data_nascimento: string | null
          data_ultima_venda: string | null
          departamento: string | null
          desconto_maximo: number | null
          documento: string
          email: string | null
          estado: string | null
          foto_url: string | null
          id: number
          logradouro: string | null
          melhor_mes_vendas: number | null
          meta_mensal: number | null
          nivel_acesso: string | null
          nome: string
          numero: string | null
          observacoes: string | null
          percentual_comissao: number | null
          pode_dar_desconto: boolean | null
          ranking_atual: number | null
          status: string | null
          telefone: string | null
          ticket_medio: number | null
          tipo_comissao: string | null
          tipo_documento: string | null
          total_vendas: number | null
          updated_at: string | null
          user_id: string
          valor_fixo_comissao: number | null
          valor_total_vendido: number | null
          whatsapp: string | null
        }
        Insert: {
          acesso_sistema?: boolean | null
          ativo?: boolean | null
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_vendedor: string
          comissao_total_recebida?: number | null
          complemento?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          data_ultima_venda?: string | null
          departamento?: string | null
          desconto_maximo?: number | null
          documento: string
          email?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: number
          logradouro?: string | null
          melhor_mes_vendas?: number | null
          meta_mensal?: number | null
          nivel_acesso?: string | null
          nome: string
          numero?: string | null
          observacoes?: string | null
          percentual_comissao?: number | null
          pode_dar_desconto?: boolean | null
          ranking_atual?: number | null
          status?: string | null
          telefone?: string | null
          ticket_medio?: number | null
          tipo_comissao?: string | null
          tipo_documento?: string | null
          total_vendas?: number | null
          updated_at?: string | null
          user_id: string
          valor_fixo_comissao?: number | null
          valor_total_vendido?: number | null
          whatsapp?: string | null
        }
        Update: {
          acesso_sistema?: boolean | null
          ativo?: boolean | null
          bairro?: string | null
          cargo?: string | null
          cep?: string | null
          cidade?: string | null
          codigo_vendedor?: string
          comissao_total_recebida?: number | null
          complemento?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          data_ultima_venda?: string | null
          departamento?: string | null
          desconto_maximo?: number | null
          documento?: string
          email?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: number
          logradouro?: string | null
          melhor_mes_vendas?: number | null
          meta_mensal?: number | null
          nivel_acesso?: string | null
          nome?: string
          numero?: string | null
          observacoes?: string | null
          percentual_comissao?: number | null
          pode_dar_desconto?: boolean | null
          ranking_atual?: number | null
          status?: string | null
          telefone?: string | null
          ticket_medio?: number | null
          tipo_comissao?: string | null
          tipo_documento?: string | null
          total_vendas?: number | null
          updated_at?: string | null
          user_id?: string
          valor_fixo_comissao?: number | null
          valor_total_vendido?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_vendas_completas: {
        Row: {
          ano_venda: number | null
          ativo: boolean | null
          categoria_codigo: string | null
          categoria_nome: string | null
          cliente_documento: string | null
          cliente_id: number | null
          cliente_nome: string | null
          cliente_tipo: string | null
          comissao_percentual: number | null
          comissao_valor: number | null
          created_at: string | null
          data_venda: string | null
          desconto: number | null
          forma_pagamento: string | null
          hora_venda: string | null
          id: number | null
          mes_venda: number | null
          observacoes: string | null
          parcelas: number | null
          periodo_venda: string | null
          plano_conta_id: number | null
          status: string | null
          tipo_dre: string | null
          tipo_venda: string | null
          updated_at: string | null
          valor_final: number | null
          valor_liquido: number | null
          valor_total: number | null
          vendedor: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      atualizar_estatisticas_cliente: {
        Args: { cliente_id: number; valor_compra: number }
        Returns: undefined
      }
      atualizar_estatisticas_cliente_completas: {
        Args: { cliente_id: number }
        Returns: undefined
      }
      atualizar_estatisticas_fornecedor: {
        Args: { p_fornecedor_id: number }
        Returns: undefined
      }
      atualizar_estatisticas_vendedor: {
        Args: { p_vendedor_id: number }
        Returns: undefined
      }
      atualizar_ranking_vendedores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      atualizar_totais_plano_pai: {
        Args: { plano_id: number }
        Returns: undefined
      }
      backup_dados_criticos: {
        Args: Record<PropertyKey, never>
        Returns: {
          tabela: string
          total_registros: number
          backup_timestamp: string
        }[]
      }
      buscar_contas_otimizada: {
        Args: { p_filtros: Json; p_user_id: string }
        Returns: {
          id: number
          fornecedor_id: number
          plano_conta_id: number
          banco_id: number
          documento_referencia: string
          descricao: string
          data_emissao: string
          data_vencimento: string
          valor_original: number
          valor_final: number
          status: string
          data_pagamento: string
          grupo_lancamento: string
          parcela_atual: number
          total_parcelas: number
          forma_pagamento: string
          observacoes: string
          created_at: string
          updated_at: string
          fornecedor_nome: string
          plano_conta_nome: string
          banco_nome: string
          dias_para_vencimento: number
          dias_em_atraso: number
        }[]
      }
      buscar_hierarquia_plano_contas: {
        Args: { conta_id: number }
        Returns: string
      }
      calcular_comissao_venda: {
        Args: {
          valor_venda: number
          percentual_comissao?: number
          tipo_venda?: string
        }
        Returns: number
      }
      classificar_venda_dre: {
        Args: { venda_id: number }
        Returns: undefined
      }
      conciliar_maquininha: {
        Args: { p_maquininha_id: string; p_periodo: string }
        Returns: string
      }
      estatisticas_contas_rapidas: {
        Args: { p_user_id: string }
        Returns: {
          total_pendentes: number
          valor_pendente: number
          total_vencidas: number
          valor_vencido: number
          total_vence_7_dias: number
          valor_vence_7_dias: number
          total_pagas_mes: number
          valor_pago_mes: number
        }[]
      }
      estatisticas_rapidas_cache: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_vendas_mes: number
          valor_total_mes: number
          ticket_medio_mes: number
          contas_pendentes: number
          valor_pendente: number
          clientes_ativos: number
          fornecedores_ativos: number
        }[]
      }
      executar_matching_agrupado: {
        Args: {
          p_maquininha_id: string
          p_periodo: string
          p_tolerancia_valor?: number
          p_tolerancia_dias?: number
        }
        Returns: {
          grupos_criados: number
          vendas_agrupadas: number
          recebimentos_vinculados: number
          valor_total_agrupado: number
        }[]
      }
      executar_matching_automatico: {
        Args: {
          p_maquininha_id: string
          p_periodo: string
          p_tolerancia_valor?: number
          p_tolerancia_dias?: number
        }
        Returns: {
          vendas_conciliadas: number
          recebimentos_conciliados: number
          divergencias_criadas: number
          detalhes: Json
        }[]
      }
      gerar_dre_integrado: {
        Args: { p_mes_referencia: string }
        Returns: {
          item_codigo: string
          item_nome: string
          item_valor: number
          item_nivel: number
          item_tipo: string
          item_categoria: string
        }[]
      }
      gerar_proximo_codigo_plano_contas: {
        Args: { pai_id?: number }
        Returns: string
      }
      gerar_proximo_codigo_vendedor: {
        Args: { p_user_id?: string }
        Returns: string
      }
      gerar_relatorio_gerencial_periodo: {
        Args: { p_data_inicio: string; p_data_fim: string }
        Returns: {
          periodo: string
          total_vendas: number
          receita_bruta: number
          receita_liquida: number
          ticket_medio: number
          vendas_por_forma_pagamento: Json
          evolucao_diaria: Json
          top_categorias: Json
          performance_vendedores: Json
          indicadores_dre: Json
        }[]
      }
      lancar_venda_fluxo_caixa: {
        Args: { venda_id: number }
        Returns: undefined
      }
      limpar_cache_performance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      migrar_vendedor_texto_para_id: {
        Args: Record<PropertyKey, never>
        Returns: {
          migradas: number
          nao_migradas: number
          detalhes: Json
        }[]
      }
      monitorar_performance_sistema: {
        Args: Record<PropertyKey, never>
        Returns: {
          metrica: string
          valor: number
          unidade: string
          status: string
          recomendacao: string
        }[]
      }
      obter_dashboard_maquininhas: {
        Args: Record<PropertyKey, never>
        Returns: {
          maquininhas_ativas: number
          taxa_conciliacao: number
          recebido_mes: number
          taxas_pagas: number
        }[]
      }
      obter_divergencias_conciliacao: {
        Args: { p_maquininha_id: string; p_periodo: string }
        Returns: {
          id: string
          tipo: string
          descricao: string
          valor_esperado: number
          valor_encontrado: number
          data_transacao: string
          origem: string
        }[]
      }
      obter_estatisticas_cheques: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_cheques: number
          total_valor: number
          pendentes_quantidade: number
          pendentes_valor: number
          compensados_quantidade: number
          compensados_valor: number
          devolvidos_quantidade: number
          devolvidos_valor: number
          cancelados_quantidade: number
          cancelados_valor: number
        }[]
      }
      obter_estatisticas_executivas: {
        Args: { p_periodo_inicio: string; p_periodo_fim: string }
        Returns: {
          total_maquininhas: number
          taxa_conciliacao_media: number
          total_transacoes: number
          valor_total_transacionado: number
          divergencias_criticas: number
          tempo_medio_resolucao: number
          performance_rede: Json
          performance_sipag: Json
          evolucao_mensal: Json
        }[]
      }
      obter_performance_vendedor: {
        Args: {
          p_vendedor_id: number
          p_data_inicio: string
          p_data_fim: string
        }
        Returns: {
          vendedor_nome: string
          periodo: string
          total_vendas: number
          valor_total: number
          meta_periodo: number
          percentual_meta: number
          comissao_periodo: number
          ticket_medio: number
          ranking_posicao: number
          vendas_por_dia: Json
        }[]
      }
      obter_ranking_vendedores: {
        Args: { p_periodo?: string; p_user_id?: string }
        Returns: {
          vendedor_id: number
          vendedor_nome: string
          codigo_vendedor: string
          total_vendas: number
          valor_vendido: number
          meta_mensal: number
          percentual_meta: number
          ranking_posicao: number
          foto_url: string
        }[]
      }
      obter_ranking_vendedores_melhorado: {
        Args: { p_periodo?: string; p_user_id?: string }
        Returns: {
          vendedor_id: number
          vendedor_nome: string
          codigo_vendedor: string
          total_vendas: number
          valor_vendido: number
          meta_mensal: number
          percentual_meta: number
          ranking_posicao: number
          foto_url: string
        }[]
      }
      obter_relatorio_taxas_operadora: {
        Args: { p_data_inicio: string; p_data_fim: string }
        Returns: {
          operadora: string
          nome_operadora: string
          total_transacoes: number
          total_taxas: number
          fornecedor_id: number
          banco_vinculado: number
        }[]
      }
      obter_ultimas_conciliacoes: {
        Args: { limite?: number }
        Returns: {
          id: string
          periodo: string
          maquininha_nome: string
          data_conciliacao: string
          total_vendas: number
          total_recebimentos: number
          status: string
          diferenca: number
        }[]
      }
      processar_extrato_maquininha: {
        Args: {
          p_maquininha_id: string
          p_periodo: string
          p_arquivo_vendas_nome: string
          p_arquivo_bancario_nome: string
        }
        Returns: string
      }
      processar_lote_contas_simplificado: {
        Args: { contas_data: Json; cheques_data?: Json }
        Returns: Json
      }
      reconciliar_movimentacao_automatica: {
        Args: { p_data_inicio: string; p_data_fim: string; p_banco_id?: number }
        Returns: {
          movimentacoes_reconciliadas: number
          vendas_encontradas: number
          valor_total_reconciliado: number
          detalhes: Json
        }[]
      }
      relatorio_vendas_periodo: {
        Args: {
          data_inicio: string
          data_fim: string
          vendedor_filtro?: string
          cliente_id_filtro?: number
        }
        Returns: {
          total_vendas: number
          valor_bruto: number
          valor_descontos: number
          valor_liquido: number
          total_comissoes: number
          ticket_medio: number
          vendas_por_forma_pagamento: Json
          vendas_por_categoria: Json
          vendas_por_vendedor: Json
          evolucao_diaria: Json
        }[]
      }
      vincular_transacoes_manual: {
        Args: { p_venda_id: string; p_recebimento_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
