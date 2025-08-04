-- Função SQL avançada para matching automático de transações
CREATE OR REPLACE FUNCTION public.executar_matching_automatico(
  p_maquininha_id UUID,
  p_periodo VARCHAR,
  p_tolerancia_valor NUMERIC DEFAULT 1.0,
  p_tolerancia_dias INTEGER DEFAULT 2
) RETURNS TABLE(
  vendas_conciliadas INTEGER,
  recebimentos_conciliados INTEGER,
  divergencias_criadas INTEGER,
  detalhes JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  vendas_matched INTEGER := 0;
  recebimentos_matched INTEGER := 0;
  divergencias_count INTEGER := 0;
  detalhes_result JSONB := '[]'::JSONB;
  venda_rec RECORD;
  recebimento_match RECORD;
  banco_maquininha INTEGER;
BEGIN
  -- Buscar banco vinculado à maquininha
  SELECT banco_id INTO banco_maquininha
  FROM maquininhas 
  WHERE id = p_maquininha_id;
  
  IF banco_maquininha IS NULL THEN
    RAISE EXCEPTION 'Maquininha não encontrada ou sem banco vinculado';
  END IF;
  
  -- Fazer matching de vendas com recebimentos
  FOR venda_rec IN
    SELECT vm.*
    FROM vendas_maquininha vm
    WHERE vm.maquininha_id = p_maquininha_id
    AND vm.periodo_processamento = p_periodo
    AND vm.status = 'pendente'
  LOOP
    -- Buscar recebimento compatível
    SELECT rb.* INTO recebimento_match
    FROM recebimentos_bancario rb
    WHERE rb.banco_id = banco_maquininha
    AND rb.periodo_processamento = p_periodo
    AND rb.status = 'pendente_conciliacao'
    AND ABS(rb.valor - venda_rec.valor_liquido) <= p_tolerancia_valor
    AND ABS(EXTRACT(DAYS FROM rb.data_recebimento - venda_rec.data_recebimento)) <= p_tolerancia_dias
    ORDER BY ABS(rb.valor - venda_rec.valor_liquido), ABS(EXTRACT(DAYS FROM rb.data_recebimento - venda_rec.data_recebimento))
    LIMIT 1;
    
    IF FOUND THEN
      -- Fazer o matching
      UPDATE vendas_maquininha 
      SET status = 'conciliado'
      WHERE id = venda_rec.id;
      
      UPDATE recebimentos_bancario 
      SET status = 'conciliado'
      WHERE id = recebimento_match.id;
      
      vendas_matched := vendas_matched + 1;
      recebimentos_matched := recebimentos_matched + 1;
      
      -- Adicionar aos detalhes
      detalhes_result := detalhes_result || jsonb_build_object(
        'tipo', 'matching_automatico',
        'venda_id', venda_rec.id,
        'recebimento_id', recebimento_match.id,
        'diferenca_valor', ABS(recebimento_match.valor - venda_rec.valor_liquido),
        'diferenca_dias', ABS(EXTRACT(DAYS FROM recebimento_match.data_recebimento - venda_rec.data_recebimento))
      );
    ELSE
      -- Criar divergência
      divergencias_count := divergencias_count + 1;
      
      detalhes_result := detalhes_result || jsonb_build_object(
        'tipo', 'divergencia',
        'venda_id', venda_rec.id,
        'motivo', 'Recebimento não encontrado dentro da tolerância',
        'valor_venda', venda_rec.valor_liquido,
        'data_venda', venda_rec.data_recebimento
      );
    END IF;
  END LOOP;
  
  -- Marcar recebimentos não conciliados como divergência
  FOR recebimento_match IN
    SELECT rb.*
    FROM recebimentos_bancario rb
    WHERE rb.banco_id = banco_maquininha
    AND rb.periodo_processamento = p_periodo
    AND rb.status = 'pendente_conciliacao'
  LOOP
    divergencias_count := divergencias_count + 1;
    
    UPDATE recebimentos_bancario 
    SET status = 'divergencia'
    WHERE id = recebimento_match.id;
    
    detalhes_result := detalhes_result || jsonb_build_object(
      'tipo', 'divergencia',
      'recebimento_id', recebimento_match.id,
      'motivo', 'Venda correspondente não encontrada',
      'valor_recebimento', recebimento_match.valor,
      'data_recebimento', recebimento_match.data_recebimento
    );
  END LOOP;
  
  RETURN QUERY
  SELECT vendas_matched, recebimentos_matched, divergencias_count, detalhes_result;
END;
$$;

-- Função para obter divergências de conciliação
CREATE OR REPLACE FUNCTION public.obter_divergencias_conciliacao(
  p_maquininha_id UUID,
  p_periodo VARCHAR
) RETURNS TABLE(
  id UUID,
  tipo VARCHAR,
  descricao TEXT,
  valor_esperado NUMERIC,
  valor_encontrado NUMERIC,
  data_transacao DATE,
  origem VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  banco_maquininha INTEGER;
BEGIN
  -- Buscar banco vinculado à maquininha
  SELECT banco_id INTO banco_maquininha
  FROM maquininhas 
  WHERE id = p_maquininha_id;
  
  -- Vendas sem recebimento correspondente
  RETURN QUERY
  SELECT 
    vm.id,
    'venda_sem_recebimento'::VARCHAR,
    ('Venda NSU ' || vm.nsu || ' sem recebimento correspondente')::TEXT,
    vm.valor_liquido,
    0::NUMERIC,
    vm.data_recebimento,
    'vendas_maquininha'::VARCHAR
  FROM vendas_maquininha vm
  WHERE vm.maquininha_id = p_maquininha_id
  AND vm.periodo_processamento = p_periodo
  AND vm.status = 'pendente';
  
  -- Recebimentos sem venda correspondente
  RETURN QUERY
  SELECT 
    rb.id,
    'recebimento_sem_venda'::VARCHAR,
    ('Recebimento de ' || rb.descricao || ' sem venda correspondente')::TEXT,
    0::NUMERIC,
    rb.valor,
    rb.data_recebimento,
    'recebimentos_bancario'::VARCHAR
  FROM recebimentos_bancario rb
  WHERE rb.banco_id = banco_maquininha
  AND rb.periodo_processamento = p_periodo
  AND rb.status IN ('pendente_conciliacao', 'divergencia');
END;
$$;

-- Função para vinculação manual de transações
CREATE OR REPLACE FUNCTION public.vincular_transacoes_manual(
  p_venda_id UUID,
  p_recebimento_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atualizar status da venda
  UPDATE vendas_maquininha 
  SET status = 'conciliado'
  WHERE id = p_venda_id;
  
  -- Atualizar status do recebimento
  UPDATE recebimentos_bancario 
  SET status = 'conciliado'
  WHERE id = p_recebimento_id;
  
  -- Inserir log de auditoria
  INSERT INTO audit_log (
    tabela, operacao, registro_id, descricao
  ) VALUES (
    'conciliacao', 'vinculacao_manual', 
    p_venda_id::BIGINT,
    'Vinculação manual entre venda ' || p_venda_id::TEXT || ' e recebimento ' || p_recebimento_id::TEXT
  );
  
  RETURN TRUE;
END;
$$;