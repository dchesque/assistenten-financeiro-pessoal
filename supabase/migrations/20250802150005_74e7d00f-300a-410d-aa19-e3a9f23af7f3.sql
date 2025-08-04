-- Criar função transacional robusta para processar lotes de contas
CREATE OR REPLACE FUNCTION processar_lote_contas_completo(
  contas_data jsonb,
  cheques_data jsonb DEFAULT NULL
)
RETURNS jsonb
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
  user_id_val UUID;
  erro_msg TEXT;
BEGIN
  -- 🔐 VERIFICAÇÃO ROBUSTA DE AUTENTICAÇÃO
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'ERRO_AUTENTICACAO',
      'erro_mensagem', 'Usuário não autenticado. auth.uid() retornou NULL.'
    );
  END IF;

  -- Log inicial
  RAISE LOG 'Iniciando processamento de lote. User ID: %, Contas: %, Cheques: %', 
    user_id_val, 
    jsonb_array_length(contas_data), 
    CASE WHEN cheques_data IS NOT NULL THEN jsonb_array_length(cheques_data) ELSE 0 END;

  -- Validar dados de entrada
  IF contas_data IS NULL OR jsonb_array_length(contas_data) = 0 THEN
    RETURN jsonb_build_object(
      'sucesso', false,
      'erro', 'DADOS_INVALIDOS',
      'erro_mensagem', 'Dados de contas são obrigatórios'
    );
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
      parcela_atual INTEGER,
      total_parcelas INTEGER,
      forma_pagamento TEXT,
      banco_id INTEGER,
      user_id UUID,
      data_emissao DATE
    )
  LOOP
    -- Log da conta sendo processada
    RAISE LOG 'Processando conta: fornecedor_id=%, plano_conta_id=%, valor=%, user_id=%', 
      conta_record.fornecedor_id, conta_record.plano_conta_id, conta_record.valor_final, conta_record.user_id;

    -- Verificar se user_id está presente nos dados
    IF conta_record.user_id IS NULL THEN
      conta_record.user_id := user_id_val;
    END IF;

    -- Inserir conta individual
    BEGIN
      WITH nova_conta AS (
        INSERT INTO public.contas_pagar (
          fornecedor_id, plano_conta_id, documento_referencia, descricao,
          data_vencimento, valor_original, valor_final, status,
          grupo_lancamento, parcela_atual, total_parcelas, forma_pagamento,
          banco_id, user_id, data_emissao
        ) VALUES (
          conta_record.fornecedor_id, conta_record.plano_conta_id, 
          conta_record.documento_referencia, conta_record.descricao,
          conta_record.data_vencimento, conta_record.valor_original, 
          conta_record.valor_final, conta_record.status,
          lote_id::UUID, conta_record.parcela_atual, conta_record.total_parcelas,
          conta_record.forma_pagamento, conta_record.banco_id, conta_record.user_id,
          conta_record.data_emissao
        ) RETURNING id
      )
      SELECT nova_conta.id INTO conta_ids[array_length(conta_ids, 1) + 1]
      FROM nova_conta;
      
      contas_criadas := contas_criadas + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log do erro específico da conta
      RAISE LOG 'Erro ao inserir conta: SQLSTATE=%, SQLERRM=%', SQLSTATE, SQLERRM;
      
      RETURN jsonb_build_object(
        'sucesso', false,
        'erro', 'ERRO_INSERCAO_CONTA',
        'erro_mensagem', 'Erro ao inserir conta ' || contas_criadas + 1 || ': ' || SQLERRM
      );
    END;
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
      -- Log do cheque sendo processado
      RAISE LOG 'Processando cheque: numero=%, banco_id=%, valor=%, user_id=%', 
        cheque_record.numero_cheque, cheque_record.banco_id, cheque_record.valor, cheque_record.user_id;

      -- Verificar se user_id está presente nos dados do cheque
      IF cheque_record.user_id IS NULL THEN
        cheque_record.user_id := user_id_val;
      END IF;

      BEGIN
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
        
      EXCEPTION WHEN OTHERS THEN
        -- Log do erro específico do cheque
        RAISE LOG 'Erro ao inserir cheque: SQLSTATE=%, SQLERRM=%', SQLSTATE, SQLERRM;
        
        RETURN jsonb_build_object(
          'sucesso', false,
          'erro', 'ERRO_INSERCAO_CHEQUE',
          'erro_mensagem', 'Erro ao inserir cheque ' || cheques_criados + 1 || ': ' || SQLERRM
        );
      END;
    END LOOP;
  END IF;

  -- Log de sucesso
  RAISE LOG 'Lote processado com sucesso. Lote ID: %, Contas: %, Cheques: %', 
    lote_id, contas_criadas, cheques_criados;

  -- Log na tabela de auditoria
  INSERT INTO public.audit_log (
    tabela, operacao, descricao, data_operacao, usuario_id
  ) VALUES (
    'contas_pagar', 'lote_criado', 
    'Lote criado com ' || contas_criadas || ' contas e ' || cheques_criados || ' cheques',
    NOW(), user_id_val
  );

  -- Retornar resultado de sucesso
  RETURN jsonb_build_object(
    'sucesso', true,
    'lote_id', lote_id,
    'contas_criadas', contas_criadas,
    'cheques_criados', cheques_criados,
    'conta_ids', conta_ids,
    'user_id_processado', user_id_val
  );

EXCEPTION WHEN OTHERS THEN
  -- Log de erro geral
  RAISE LOG 'Erro geral na função: SQLSTATE=%, SQLERRM=%', SQLSTATE, SQLERRM;
  
  -- Em caso de erro geral, toda a transação é revertida automaticamente
  RETURN jsonb_build_object(
    'sucesso', false,
    'erro', 'ERRO_GERAL',
    'erro_mensagem', 'Erro interno: ' || SQLERRM,
    'detalhes', jsonb_build_object(
      'sqlstate', SQLSTATE,
      'contas_processadas', contas_criadas,
      'cheques_processados', cheques_criados
    )
  );
END;
$$;