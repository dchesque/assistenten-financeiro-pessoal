-- =========================================
-- FUNÇÃO TRANSACIONAL PARA LANÇAMENTO EM LOTE
-- =========================================

CREATE OR REPLACE FUNCTION criar_lote_contas_transacional(
  contas_data JSON,
  cheques_data JSON DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  conta_inserida RECORD;
  cheque_inserido RECORD;
  conta_item JSON;
  cheque_item JSON;
  contas_criadas INTEGER := 0;
  cheques_criados INTEGER := 0;
  lote_id TEXT;
  resultado JSON;
BEGIN
  -- Gerar ID único para o lote
  lote_id := gen_random_uuid()::text;
  
  -- Inserir contas a pagar
  FOR conta_item IN SELECT * FROM JSON_ARRAY_ELEMENTS(contas_data) LOOP
    INSERT INTO contas_pagar (
      fornecedor_id,
      plano_conta_id,
      documento_referencia,
      descricao,
      data_vencimento,
      valor_original,
      valor_final,
      status,
      grupo_lancamento,
      parcela_atual,
      total_parcelas,
      forma_pagamento,
      banco_id,
      user_id,
      data_emissao,
      data_lancamento
    )
    VALUES (
      (conta_item->>'fornecedor_id')::INTEGER,
      (conta_item->>'plano_conta_id')::INTEGER,
      conta_item->>'documento_referencia',
      conta_item->>'descricao',
      (conta_item->>'data_vencimento')::DATE,
      (conta_item->>'valor_original')::DECIMAL(15,2),
      (conta_item->>'valor_final')::DECIMAL(15,2),
      conta_item->>'status',
      lote_id,
      (conta_item->>'parcela_atual')::INTEGER,
      (conta_item->>'total_parcelas')::INTEGER,
      conta_item->>'forma_pagamento',
      CASE 
        WHEN conta_item->>'banco_id' = 'null' OR conta_item->>'banco_id' IS NULL 
        THEN NULL 
        ELSE (conta_item->>'banco_id')::INTEGER 
      END,
      (conta_item->>'user_id')::UUID,
      COALESCE((conta_item->>'data_emissao')::DATE, CURRENT_DATE),
      COALESCE((conta_item->>'data_lancamento')::DATE, CURRENT_DATE)
    )
    RETURNING * INTO conta_inserida;
    
    contas_criadas := contas_criadas + 1;
  END LOOP;
  
  -- Inserir cheques se fornecidos
  IF cheques_data IS NOT NULL THEN
    FOR cheque_item IN SELECT * FROM JSON_ARRAY_ELEMENTS(cheques_data) LOOP
      INSERT INTO cheques (
        numero_cheque,
        banco_id,
        valor,
        data_emissao,
        data_vencimento,
        beneficiario_nome,
        user_id,
        status
      )
      VALUES (
        cheque_item->>'numero_cheque',
        (cheque_item->>'banco_id')::INTEGER,
        (cheque_item->>'valor')::DECIMAL(15,2),
        (cheque_item->>'data_emissao')::DATE,
        (cheque_item->>'data_vencimento')::DATE,
        cheque_item->>'beneficiario_nome',
        (cheque_item->>'user_id')::UUID,
        'emitido'
      )
      RETURNING * INTO cheque_inserido;
      
      cheques_criados := cheques_criados + 1;
    END LOOP;
  END IF;
  
  -- Construir resultado
  resultado := JSON_BUILD_OBJECT(
    'sucesso', TRUE,
    'lote_id', lote_id,
    'contas_criadas', contas_criadas,
    'cheques_criados', cheques_criados
  );
  
  RETURN resultado;
  
EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, fazer rollback automático e retornar erro
  RETURN JSON_BUILD_OBJECT(
    'sucesso', FALSE,
    'erro', SQLERRM,
    'detalhes', 'Transação cancelada devido a erro'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que apenas usuários autenticados possam executar
REVOKE ALL ON FUNCTION criar_lote_contas_transacional FROM PUBLIC;
GRANT EXECUTE ON FUNCTION criar_lote_contas_transacional TO authenticated;