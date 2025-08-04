-- Criar função SQL transacional para lançamento em lote
CREATE OR REPLACE FUNCTION public.criar_lote_contas_transacional(
  contas_data JSONB,
  cheques_data JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  contas_criadas INTEGER := 0;
  cheques_criados INTEGER := 0;
  lote_id TEXT;
  conta_record RECORD;
  cheque_record RECORD;
  conta_ids INTEGER[] := ARRAY[]::INTEGER[];
BEGIN
  -- Validar dados de entrada
  IF contas_data IS NULL OR jsonb_array_length(contas_data) = 0 THEN
    RAISE EXCEPTION 'Dados de contas são obrigatórios';
  END IF;

  -- Gerar ID único para o lote
  lote_id := gen_random_uuid()::TEXT;

  -- Inserir contas em lote (transação automática)
  FOR conta_record IN 
    SELECT * FROM jsonb_to_recordset(contas_data) AS t(
      fornecedor_id INTEGER,
      plano_conta_id INTEGER,
      documento_referencia TEXT,
      descricao TEXT,
      data_vencimento DATE,
      valor_original NUMERIC,
      valor_final NUMERIC,
      status TEXT,
      grupo_lancamento TEXT,
      parcela_atual INTEGER,
      total_parcelas INTEGER,
      forma_pagamento TEXT,
      banco_id INTEGER,
      user_id UUID
    )
  LOOP
    -- Inserir conta e capturar ID
    WITH nova_conta AS (
      INSERT INTO public.contas_pagar (
        fornecedor_id, plano_conta_id, documento_referencia, descricao,
        data_vencimento, valor_original, valor_final, status,
        grupo_lancamento, parcela_atual, total_parcelas, forma_pagamento,
        banco_id, user_id
      ) VALUES (
        conta_record.fornecedor_id, conta_record.plano_conta_id, 
        conta_record.documento_referencia, conta_record.descricao,
        conta_record.data_vencimento, conta_record.valor_original, 
        conta_record.valor_final, conta_record.status,
        lote_id, conta_record.parcela_atual, conta_record.total_parcelas,
        conta_record.forma_pagamento, conta_record.banco_id, conta_record.user_id
      ) RETURNING id
    )
    SELECT nova_conta.id INTO conta_ids[array_length(conta_ids, 1) + 1]
    FROM nova_conta;
    
    contas_criadas := contas_criadas + 1;
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
        user_id UUID
      )
    LOOP
      INSERT INTO public.cheques (
        numero_cheque, banco_id, valor, data_emissao, data_vencimento,
        beneficiario_nome, status, user_id, conta_pagar_id
      ) VALUES (
        cheque_record.numero_cheque, cheque_record.banco_id,
        cheque_record.valor, cheque_record.data_emissao, cheque_record.data_vencimento,
        cheque_record.beneficiario_nome, 'emitido', cheque_record.user_id,
        conta_ids[cheques_criados + 1]
      );
      
      cheques_criados := cheques_criados + 1;
    END LOOP;
  END IF;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'sucesso', true,
    'lote_id', lote_id,
    'contas_criadas', contas_criadas,
    'cheques_criados', cheques_criados,
    'conta_ids', conta_ids
  );

EXCEPTION WHEN OTHERS THEN
  -- Em caso de erro, toda a transação é revertida automaticamente
  RETURN jsonb_build_object(
    'sucesso', false,
    'erro', SQLERRM
  );
END;
$$;