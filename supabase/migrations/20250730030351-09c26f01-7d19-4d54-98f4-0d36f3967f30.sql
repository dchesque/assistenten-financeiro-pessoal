-- Função corrigida para executar matching agrupado (N:M)
CREATE OR REPLACE FUNCTION public.executar_matching_agrupado(
  p_maquininha_id UUID,
  p_periodo VARCHAR,
  p_tolerancia_valor NUMERIC DEFAULT 1.0,
  p_tolerancia_dias INTEGER DEFAULT 2
) RETURNS TABLE(
  grupos_criados INTEGER,
  vendas_agrupadas INTEGER,
  recebimentos_vinculados INTEGER,
  valor_total_agrupado NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  banco_maquininha INTEGER;
  grupo_count INTEGER := 0;
  vendas_count INTEGER := 0;
  recebimentos_count INTEGER := 0;
  valor_total NUMERIC := 0;
  recebimento_rec RECORD;
  venda_ids UUID[];
  valor_grupo NUMERIC;
  total_vendas INTEGER;
BEGIN
  -- Buscar banco vinculado à maquininha
  SELECT banco_id INTO banco_maquininha
  FROM maquininhas 
  WHERE id = p_maquininha_id;
  
  IF banco_maquininha IS NULL THEN
    RAISE EXCEPTION 'Maquininha não encontrada ou sem banco vinculado';
  END IF;
  
  -- Buscar recebimentos pendentes de conciliação
  FOR recebimento_rec IN
    SELECT rb.*
    FROM recebimentos_bancario rb
    WHERE rb.banco_id = banco_maquininha
    AND rb.periodo_processamento = p_periodo
    AND rb.status = 'pendente_conciliacao'
  LOOP
    -- Para cada recebimento, buscar grupo de vendas que somem o valor
    SELECT 
      array_agg(vm.id),
      SUM(vm.valor_liquido),
      COUNT(*)
    INTO venda_ids, valor_grupo, total_vendas
    FROM vendas_maquininha vm
    WHERE vm.maquininha_id = p_maquininha_id
    AND vm.periodo_processamento = p_periodo
    AND vm.status = 'pendente'
    AND vm.data_recebimento BETWEEN 
        (recebimento_rec.data_recebimento - INTERVAL '1 day' * p_tolerancia_dias) AND
        (recebimento_rec.data_recebimento + INTERVAL '1 day' * p_tolerancia_dias)
    AND vm.valor_liquido <= recebimento_rec.valor + p_tolerancia_valor
    GROUP BY vm.data_recebimento
    HAVING ABS(SUM(vm.valor_liquido) - recebimento_rec.valor) <= p_tolerancia_valor
    AND COUNT(*) > 1
    ORDER BY ABS(SUM(vm.valor_liquido) - recebimento_rec.valor)
    LIMIT 1;
    
    -- Se encontrou um grupo válido, fazer o matching
    IF venda_ids IS NOT NULL AND array_length(venda_ids, 1) > 1 THEN
      -- Atualizar vendas para conciliado
      UPDATE vendas_maquininha 
      SET status = 'conciliado'
      WHERE id = ANY(venda_ids);
      
      -- Atualizar recebimento para conciliado
      UPDATE recebimentos_bancario 
      SET status = 'conciliado'
      WHERE id = recebimento_rec.id;
      
      -- Inserir registro de auditoria em detalhes_conciliacao
      INSERT INTO detalhes_conciliacao (
        conciliacao_id,
        data,
        vendas_valor,
        vendas_quantidade,
        recebimento_valor,
        recebimento_quantidade,
        diferenca,
        status,
        motivo_divergencia
      ) VALUES (
        (SELECT id FROM conciliacoes_maquininha 
         WHERE maquininha_id = p_maquininha_id AND periodo = p_periodo LIMIT 1),
        recebimento_rec.data_recebimento,
        valor_grupo,
        total_vendas,
        recebimento_rec.valor,
        1,
        ABS(valor_grupo - recebimento_rec.valor),
        'ok',
        'Matching agrupado automático - ' || total_vendas || ' vendas agrupadas'
      );
      
      -- Incrementar contadores
      grupo_count := grupo_count + 1;
      vendas_count := vendas_count + total_vendas;
      recebimentos_count := recebimentos_count + 1;
      valor_total := valor_total + recebimento_rec.valor;
      
      -- Limpar variáveis para próxima iteração
      venda_ids := NULL;
      valor_grupo := NULL;
      total_vendas := NULL;
    END IF;
  END LOOP;
  
  RETURN QUERY
  SELECT grupo_count, vendas_count, recebimentos_count, valor_total;
END;
$$;