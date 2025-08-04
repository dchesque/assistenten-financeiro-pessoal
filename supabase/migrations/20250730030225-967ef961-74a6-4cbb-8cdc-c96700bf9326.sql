-- Função para executar matching agrupado (N:M)
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
  vendas_agrupadas_rec RECORD;
  grupo_vendas RECORD[];
  valor_grupo NUMERIC;
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
      array_agg(vm.*) as vendas,
      SUM(vm.valor_liquido) as total_vendas
    INTO grupo_vendas, valor_grupo
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
    ORDER BY ABS(SUM(vm.valor_liquido) - recebimento_rec.valor)
    LIMIT 1;
    
    -- Se encontrou um grupo válido, fazer o matching
    IF grupo_vendas IS NOT NULL AND array_length(grupo_vendas, 1) > 1 THEN
      -- Atualizar vendas para conciliado
      UPDATE vendas_maquininha 
      SET status = 'conciliado'
      WHERE id = ANY(
        SELECT (unnest(grupo_vendas)).id
      );
      
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
        array_length(grupo_vendas, 1),
        recebimento_rec.valor,
        1,
        ABS(valor_grupo - recebimento_rec.valor),
        'ok',
        'Matching agrupado automático - ' || array_length(grupo_vendas, 1) || ' vendas agrupadas'
      );
      
      -- Incrementar contadores
      grupo_count := grupo_count + 1;
      vendas_count := vendas_count + array_length(grupo_vendas, 1);
      recebimentos_count := recebimentos_count + 1;
      valor_total := valor_total + recebimento_rec.valor;
    END IF;
  END LOOP;
  
  RETURN QUERY
  SELECT grupo_count, vendas_count, recebimentos_count, valor_total;
END;
$$;

-- Função para obter estatísticas executivas
CREATE OR REPLACE FUNCTION public.obter_estatisticas_executivas(
  p_periodo_inicio DATE,
  p_periodo_fim DATE
) RETURNS TABLE(
  total_conciliacoes BIGINT,
  taxa_sucesso NUMERIC,
  tempo_medio_resolucao NUMERIC,
  economia_estimada NUMERIC,
  divergencias_criticas BIGINT,
  performance_rede NUMERIC,
  performance_sipag NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total de conciliações
    COUNT(c.id)::BIGINT,
    
    -- Taxa de sucesso
    ROUND(
      (COUNT(*) FILTER (WHERE c.status = 'ok')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
      2
    ),
    
    -- Tempo médio de resolução (simulado)
    2.5::NUMERIC,
    
    -- Economia estimada (R$ 45 por conciliação automatizada)
    (COUNT(*) FILTER (WHERE c.status = 'ok'))::NUMERIC * 45,
    
    -- Divergências críticas (diferença > R$ 500)
    COUNT(d.id) FILTER (WHERE d.diferenca > 500)::BIGINT,
    
    -- Performance Rede
    ROUND(
      (COUNT(*) FILTER (WHERE m.operadora = 'rede' AND c.status = 'ok')::NUMERIC / 
       NULLIF(COUNT(*) FILTER (WHERE m.operadora = 'rede'), 0)) * 100, 
      2
    ),
    
    -- Performance Sipag
    ROUND(
      (COUNT(*) FILTER (WHERE m.operadora = 'sipag' AND c.status = 'ok')::NUMERIC / 
       NULLIF(COUNT(*) FILTER (WHERE m.operadora = 'sipag'), 0)) * 100, 
      2
    )
    
  FROM conciliacoes_maquininha c
  LEFT JOIN maquininhas m ON c.maquininha_id = m.id
  LEFT JOIN detalhes_conciliacao d ON d.conciliacao_id = c.id
  WHERE c.data_conciliacao BETWEEN p_periodo_inicio AND p_periodo_fim;
END;
$$;

-- Função para identificar padrões por operadora
CREATE OR REPLACE FUNCTION public.identificar_padroes_operadora(
  p_operadora VARCHAR,
  p_periodo_meses INTEGER DEFAULT 3
) RETURNS TABLE(
  operadora VARCHAR,
  delay_medio_recebimento NUMERIC,
  variacao_valor_comum NUMERIC,
  taxa_agrupamento NUMERIC,
  padroes_identificados JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  data_limite DATE;
BEGIN
  data_limite := CURRENT_DATE - INTERVAL '1 month' * p_periodo_meses;
  
  RETURN QUERY
  SELECT 
    p_operadora::VARCHAR,
    
    -- Delay médio de recebimento
    ROUND(AVG(EXTRACT(DAYS FROM vm.data_recebimento - vm.data_venda)), 2),
    
    -- Variação de valor comum (diferença média entre bruto e líquido)
    ROUND(AVG(vm.valor_bruto - vm.valor_liquido), 2),
    
    -- Taxa de agrupamento (% de vendas que foram agrupadas)
    ROUND(
      (COUNT(*) FILTER (WHERE dc.vendas_quantidade > 1)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ),
    
    -- Padrões identificados em JSON
    jsonb_build_object(
      'bandeira_mais_comum', (
        SELECT bandeira 
        FROM vendas_maquininha vm2 
        INNER JOIN maquininhas m2 ON vm2.maquininha_id = m2.id
        WHERE m2.operadora = p_operadora 
        AND vm2.data_venda >= data_limite
        GROUP BY bandeira 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
      ),
      'valor_medio_transacao', ROUND(AVG(vm.valor_liquido), 2),
      'parcelas_media', ROUND(AVG(vm.parcelas), 1),
      'maior_divergencia_mes', COALESCE(MAX(dc.diferenca), 0)
    )
    
  FROM vendas_maquininha vm
  INNER JOIN maquininhas m ON vm.maquininha_id = m.id
  LEFT JOIN detalhes_conciliacao dc ON dc.data = vm.data_venda
  WHERE m.operadora = p_operadora
  AND vm.data_venda >= data_limite
  GROUP BY p_operadora;
END;
$$;