-- Criar função SQL simplificada para lançamento em lote
CREATE OR REPLACE FUNCTION processar_lote_contas_simplificado(
  contas_data JSONB,
  cheques_data JSONB DEFAULT NULL
) RETURNS TABLE(
  sucesso BOOLEAN,
  contas_criadas INTEGER,
  cheques_criados INTEGER,
  lote_id TEXT,
  erro_mensagem TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_id UUID;
  total_contas INT := 0;
  total_cheques INT := 0;
  lote_uuid TEXT;
  conta_data JSONB;
  cheque_data JSONB;
BEGIN
  -- Obter user_id da sessão
  user_id := auth.uid();
  
  IF user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 0, NULL::TEXT, 'Usuário não autenticado'::TEXT;
    RETURN;
  END IF;
  
  -- Gerar UUID único para o lote
  lote_uuid := gen_random_uuid()::TEXT;
  
  -- Validar dados de entrada
  IF contas_data IS NULL OR jsonb_array_length(contas_data) = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 0, NULL::TEXT, 'Dados de contas inválidos'::TEXT;
    RETURN;
  END IF;
  
  -- Inserir contas a pagar
  FOR conta_data IN SELECT * FROM jsonb_array_elements(contas_data)
  LOOP
    INSERT INTO contas_pagar (
      fornecedor_id,
      plano_conta_id,
      documento_referencia,
      descricao,
      data_vencimento,
      valor_original,
      valor_final,
      status,
      parcela_atual,
      total_parcelas,
      forma_pagamento,
      banco_id,
      user_id,
      data_emissao,
      lote_id
    ) VALUES (
      (conta_data->>'fornecedor_id')::INTEGER,
      (conta_data->>'plano_conta_id')::INTEGER,
      conta_data->>'documento_referencia',
      conta_data->>'descricao',
      (conta_data->>'data_vencimento')::DATE,
      (conta_data->>'valor_original')::DECIMAL,
      (conta_data->>'valor_final')::DECIMAL,
      conta_data->>'status',
      (conta_data->>'parcela_atual')::INTEGER,
      (conta_data->>'total_parcelas')::INTEGER,
      conta_data->>'forma_pagamento',
      CASE WHEN conta_data->>'banco_id' IS NOT NULL THEN (conta_data->>'banco_id')::INTEGER ELSE NULL END,
      user_id,
      (conta_data->>'data_emissao')::DATE,
      lote_uuid
    );
    
    total_contas := total_contas + 1;
  END LOOP;
  
  -- Inserir cheques se fornecidos
  IF cheques_data IS NOT NULL AND jsonb_array_length(cheques_data) > 0 THEN
    FOR cheque_data IN SELECT * FROM jsonb_array_elements(cheques_data)
    LOOP
      INSERT INTO cheques (
        numero_cheque,
        banco_id,
        valor,
        data_emissao,
        data_vencimento,
        beneficiario_nome,
        user_id,
        status,
        lote_id
      ) VALUES (
        cheque_data->>'numero_cheque',
        (cheque_data->>'banco_id')::INTEGER,
        (cheque_data->>'valor')::DECIMAL,
        (cheque_data->>'data_emissao')::DATE,
        (cheque_data->>'data_vencimento')::DATE,
        cheque_data->>'beneficiario_nome',
        user_id,
        'emitido',
        lote_uuid
      );
      
      total_cheques := total_cheques + 1;
    END LOOP;
  END IF;
  
  -- Retornar resultado de sucesso
  RETURN QUERY SELECT TRUE, total_contas, total_cheques, lote_uuid, NULL::TEXT;
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, retornar detalhes
  RETURN QUERY SELECT FALSE, 0, 0, NULL::TEXT, SQLERRM::TEXT;
END;
$$;