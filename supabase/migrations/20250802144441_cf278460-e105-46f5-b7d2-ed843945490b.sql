-- Criar função robusta para processamento de lote com verificação de autenticação
CREATE OR REPLACE FUNCTION public.processar_lote_contas_completo(
  contas_data JSONB,
  cheques_data JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usuario_atual UUID;
  contas_criadas INTEGER := 0;
  cheques_criados INTEGER := 0;
  lote_id UUID;
  conta_record RECORD;
  cheque_record RECORD;
  conta_ids INTEGER[] := ARRAY[]::INTEGER[];
  nova_conta_id INTEGER;
BEGIN
  -- 🔐 VERIFICAÇÃO CRÍTICA DE AUTENTICAÇÃO
  usuario_atual := auth.uid();
  
  IF usuario_atual IS NULL THEN
    RAISE EXCEPTION 'ERRO_AUTENTICACAO: Usuário não autenticado. auth.uid() retornou NULL';
  END IF;

  -- Log da operação
  RAISE LOG 'Iniciando processamento de lote para usuário: %', usuario_atual;

  -- Validar dados de entrada
  IF contas_data IS NULL OR jsonb_array_length(contas_data) = 0 THEN
    RAISE EXCEPTION 'ERRO_VALIDACAO: Dados de contas são obrigatórios';
  END IF;

  -- Gerar ID único para o lote
  lote_id := gen_random_uuid();
  
  RAISE LOG 'Lote ID gerado: %, Total de contas: %', lote_id, jsonb_array_length(contas_data);

  -- Inserir contas em lote (transação automática)
  FOR conta_record IN 
    SELECT * FROM jsonb_to_recordset(contas_data) AS t(
      fornecedor_id INTEGER,
      plano_conta_id INTEGER,
      documento_referencia TEXT,
      descricao TEXT,
      data_emissao DATE,
      data_vencimento DATE,
      valor_original NUMERIC,
      valor_final NUMERIC,
      status TEXT,
      parcela_atual INTEGER,
      total_parcelas INTEGER,
      forma_pagamento TEXT,
      banco_id INTEGER
    )
  LOOP
    -- Inserir conta usando SEMPRE o usuário autenticado
    INSERT INTO public.contas_pagar (
      fornecedor_id, 
      plano_conta_id, 
      documento_referencia, 
      descricao,
      data_emissao,
      data_vencimento, 
      valor_original, 
      valor_final, 
      status,
      grupo_lancamento, 
      parcela_atual, 
      total_parcelas, 
      forma_pagamento,
      banco_id, 
      user_id
    ) VALUES (
      conta_record.fornecedor_id, 
      conta_record.plano_conta_id, 
      conta_record.documento_referencia, 
      conta_record.descricao,
      conta_record.data_emissao,
      conta_record.data_vencimento, 
      conta_record.valor_original, 
      conta_record.valor_final, 
      conta_record.status,
      lote_id, -- UUID do lote
      conta_record.parcela_atual, 
      conta_record.total_parcelas,
      conta_record.forma_pagamento, 
      conta_record.banco_id, 
      usuario_atual -- SEMPRE usar o usuário autenticado
    ) RETURNING id INTO nova_conta_id;
    
    conta_ids := conta_ids || nova_conta_id;
    contas_criadas := contas_criadas + 1;
    
    RAISE LOG 'Conta criada: ID=%, Fornecedor=%, Valor=%', nova_conta_id, conta_record.fornecedor_id, conta_record.valor_final;
  END LOOP;

  -- Inserir cheques se fornecidos
  IF cheques_data IS NOT NULL AND jsonb_array_length(cheques_data) > 0 THEN
    FOR cheque_record IN 
      SELECT * FROM jsonb_to_recordset(cheques_data) AS t(
        numero_cheque TEXT,
        banco_id INTEGER,
        valor NUMERIC,
        data_emissao DATE,
        data_vencimento DATE,
        beneficiario_nome TEXT,
        finalidade TEXT,
        observacoes TEXT
      )
    LOOP
      INSERT INTO public.cheques (
        numero_cheque, 
        banco_id, 
        valor, 
        data_emissao, 
        data_vencimento,
        beneficiario_nome, 
        finalidade,
        observacoes,
        status, 
        user_id, 
        conta_pagar_id,
        criado_automaticamente
      ) VALUES (
        cheque_record.numero_cheque, 
        cheque_record.banco_id,
        cheque_record.valor, 
        cheque_record.data_emissao, 
        cheque_record.data_vencimento,
        cheque_record.beneficiario_nome, 
        cheque_record.finalidade,
        cheque_record.observacoes,
        'emitido', 
        usuario_atual, -- SEMPRE usar o usuário autenticado
        CASE 
          WHEN cheques_criados + 1 <= array_length(conta_ids, 1) 
          THEN conta_ids[cheques_criados + 1] 
          ELSE conta_ids[1] 
        END,
        true
      );
      
      cheques_criados := cheques_criados + 1;
      
      RAISE LOG 'Cheque criado: Número=%, Valor=%, Conta=%', 
        cheque_record.numero_cheque, 
        cheque_record.valor,
        CASE 
          WHEN cheques_criados <= array_length(conta_ids, 1) 
          THEN conta_ids[cheques_criados] 
          ELSE conta_ids[1] 
        END;
    END LOOP;
  END IF;

  -- Log final
  RAISE LOG 'Lote processado com sucesso: % contas, % cheques criados', contas_criadas, cheques_criados;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'sucesso', true,
    'lote_id', lote_id,
    'contas_criadas', contas_criadas,
    'cheques_criados', cheques_criados,
    'conta_ids', conta_ids,
    'usuario_id', usuario_atual
  );

EXCEPTION WHEN OTHERS THEN
  -- Log do erro
  RAISE LOG 'ERRO no processamento do lote: % - %', SQLSTATE, SQLERRM;
  
  -- Retornar erro estruturado
  RETURN jsonb_build_object(
    'sucesso', false,
    'erro_codigo', SQLSTATE,
    'erro_mensagem', SQLERRM,
    'usuario_id', COALESCE(usuario_atual, NULL),
    'contas_processadas', COALESCE(contas_criadas, 0)
  );
END;
$$;