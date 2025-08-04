-- Criar função simplificada para processar lotes de contas a pagar
CREATE OR REPLACE FUNCTION processar_lote_contas_simplificado(
  contas_data jsonb,
  cheques_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resultado jsonb;
  lote_id_gerado uuid;
  contas_criadas integer := 0;
  cheques_criados integer := 0;
  conta_record jsonb;
  cheque_record jsonb;
  conta_id integer;
  cheque_id integer;
BEGIN
  -- Gerar ID único para o lote
  lote_id_gerado := gen_random_uuid();
  
  BEGIN
    -- Processar contas a pagar
    FOR conta_record IN SELECT * FROM jsonb_array_elements(contas_data)
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
        data_emissao,
        lote_id,
        user_id,
        created_at,
        updated_at
      ) VALUES (
        (conta_record->>'fornecedor_id')::integer,
        (conta_record->>'plano_conta_id')::integer,
        conta_record->>'documento_referencia',
        conta_record->>'descricao',
        (conta_record->>'data_vencimento')::date,
        (conta_record->>'valor_original')::decimal(15,2),
        (conta_record->>'valor_final')::decimal(15,2),
        conta_record->>'status',
        (conta_record->>'parcela_atual')::integer,
        (conta_record->>'total_parcelas')::integer,
        conta_record->>'forma_pagamento',
        CASE 
          WHEN conta_record->>'banco_id' = 'null' OR conta_record->>'banco_id' IS NULL 
          THEN NULL 
          ELSE (conta_record->>'banco_id')::integer 
        END,
        (conta_record->>'data_emissao')::date,
        lote_id_gerado,
        auth.uid(),
        NOW(),
        NOW()
      ) RETURNING id INTO conta_id;
      
      contas_criadas := contas_criadas + 1;
    END LOOP;

    -- Processar cheques se fornecidos
    IF cheques_data IS NOT NULL THEN
      FOR cheque_record IN SELECT * FROM jsonb_array_elements(cheques_data)
      LOOP
        INSERT INTO cheques (
          numero_cheque,
          banco_id,
          valor,
          data_emissao,
          data_vencimento,
          beneficiario_nome,
          status,
          user_id,
          created_at,
          updated_at
        ) VALUES (
          cheque_record->>'numero_cheque',
          (cheque_record->>'banco_id')::integer,
          (cheque_record->>'valor')::decimal(15,2),
          (cheque_record->>'data_emissao')::date,
          (cheque_record->>'data_vencimento')::date,
          cheque_record->>'beneficiario_nome',
          'emitido',
          auth.uid(),
          NOW(),
          NOW()
        ) RETURNING id INTO cheque_id;
        
        cheques_criados := cheques_criados + 1;
      END LOOP;
    END IF;

    -- Retornar resultado de sucesso
    resultado := jsonb_build_object(
      'sucesso', true,
      'lote_id', lote_id_gerado,
      'contas_criadas', contas_criadas,
      'cheques_criados', cheques_criados,
      'erro_mensagem', null
    );

  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar informações do erro
    resultado := jsonb_build_object(
      'sucesso', false,
      'lote_id', null,
      'contas_criadas', 0,
      'cheques_criados', 0,
      'erro_mensagem', SQLERRM
    );
  END;

  RETURN jsonb_build_array(resultado);
END;
$$;