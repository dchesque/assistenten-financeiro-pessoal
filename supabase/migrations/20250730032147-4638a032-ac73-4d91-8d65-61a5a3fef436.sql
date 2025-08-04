-- Função SQL para obter estatísticas executivas do módulo de conciliação
CREATE OR REPLACE FUNCTION public.obter_estatisticas_executivas(
  p_periodo_inicio DATE,
  p_periodo_fim DATE
) RETURNS TABLE(
  total_maquininhas BIGINT,
  taxa_conciliacao_media NUMERIC,
  total_transacoes BIGINT,
  valor_total_transacionado NUMERIC,
  divergencias_criticas BIGINT,
  tempo_medio_resolucao NUMERIC,
  performance_rede JSONB,
  performance_sipag JSONB,
  evolucao_mensal JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rede_stats RECORD;
  sipag_stats RECORD;
  evolucao_data JSONB := '[]'::JSONB;
  mes_atual DATE;
BEGIN
  -- Total de maquininhas ativas
  SELECT COUNT(*) INTO total_maquininhas
  FROM maquininhas 
  WHERE ativo = true;
  
  -- Conciliações do período
  WITH conciliacoes_periodo AS (
    SELECT *
    FROM conciliacoes_maquininha c
    WHERE c.data_conciliacao BETWEEN p_periodo_inicio AND p_periodo_fim
  ),
  
  -- Taxa de conciliação média
  taxa_calculo AS (
    SELECT 
      COUNT(*) as total_conciliacoes,
      COUNT(*) FILTER (WHERE status = 'ok') as conciliacoes_ok
    FROM conciliacoes_periodo
  )
  
  SELECT 
    CASE 
      WHEN tc.total_conciliacoes > 0 
      THEN ROUND((tc.conciliacoes_ok::NUMERIC / tc.total_conciliacoes) * 100, 2)
      ELSE 0 
    END,
    tc.total_conciliacoes,
    COALESCE(SUM(cp.total_vendas), 0)
  INTO taxa_conciliacao_media, total_transacoes, valor_total_transacionado
  FROM taxa_calculo tc
  CROSS JOIN conciliacoes_periodo cp;
  
  -- Divergências críticas (diferença > R$ 500)
  SELECT COUNT(*) INTO divergencias_criticas
  FROM detalhes_conciliacao dc
  INNER JOIN conciliacoes_maquininha cm ON dc.conciliacao_id = cm.id
  WHERE cm.data_conciliacao BETWEEN p_periodo_inicio AND p_periodo_fim
  AND dc.diferenca > 500
  AND dc.status = 'divergencia';
  
  -- Tempo médio de resolução (estimativa baseada em created_at vs updated_at)
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 2.5)
  INTO tempo_medio_resolucao
  FROM conciliacoes_maquininha
  WHERE data_conciliacao BETWEEN p_periodo_inicio AND p_periodo_fim
  AND status = 'ok';
  
  -- Performance da Rede
  SELECT 
    COUNT(*) as total_conciliacoes,
    COUNT(*) FILTER (WHERE c.status = 'ok') as conciliacoes_ok,
    COALESCE(SUM(c.total_vendas), 0) as volume_total,
    COALESCE(SUM(c.total_taxas), 0) as taxas_total
  INTO rede_stats
  FROM conciliacoes_maquininha c
  INNER JOIN maquininhas m ON c.maquininha_id = m.id
  WHERE c.data_conciliacao BETWEEN p_periodo_inicio AND p_periodo_fim
  AND m.operadora = 'rede';
  
  performance_rede := jsonb_build_object(
    'operadora', 'Rede',
    'total_conciliacoes', rede_stats.total_conciliacoes,
    'taxa_sucesso', CASE 
      WHEN rede_stats.total_conciliacoes > 0 
      THEN ROUND((rede_stats.conciliacoes_ok::NUMERIC / rede_stats.total_conciliacoes) * 100, 2)
      ELSE 0 
    END,
    'volume_total', rede_stats.volume_total,
    'taxas_total', rede_stats.taxas_total
  );
  
  -- Performance do Sipag
  SELECT 
    COUNT(*) as total_conciliacoes,
    COUNT(*) FILTER (WHERE c.status = 'ok') as conciliacoes_ok,
    COALESCE(SUM(c.total_vendas), 0) as volume_total,
    COALESCE(SUM(c.total_taxas), 0) as taxas_total
  INTO sipag_stats
  FROM conciliacoes_maquininha c
  INNER JOIN maquininhas m ON c.maquininha_id = m.id
  WHERE c.data_conciliacao BETWEEN p_periodo_inicio AND p_periodo_fim
  AND m.operadora = 'sipag';
  
  performance_sipag := jsonb_build_object(
    'operadora', 'Sipag',
    'total_conciliacoes', sipag_stats.total_conciliacoes,
    'taxa_sucesso', CASE 
      WHEN sipag_stats.total_conciliacoes > 0 
      THEN ROUND((sipag_stats.conciliacoes_ok::NUMERIC / sipag_stats.total_conciliacoes) * 100, 2)
      ELSE 0 
    END,
    'volume_total', sipag_stats.volume_total,
    'taxas_total', sipag_stats.taxas_total
  );
  
  -- Evolução mensal (últimos 6 meses)
  mes_atual := DATE_TRUNC('month', p_periodo_fim);
  
  WITH meses AS (
    SELECT generate_series(
      mes_atual - INTERVAL '5 months',
      mes_atual,
      INTERVAL '1 month'
    )::DATE as mes_ref
  ),
  
  dados_mensais AS (
    SELECT 
      m.mes_ref,
      COUNT(c.*) as total_conciliacoes,
      COUNT(*) FILTER (WHERE c.status = 'ok') as conciliacoes_ok,
      COALESCE(SUM(c.total_vendas), 0) as volume_mensal
    FROM meses m
    LEFT JOIN conciliacoes_maquininha c ON DATE_TRUNC('month', c.data_conciliacao) = m.mes_ref
    GROUP BY m.mes_ref
    ORDER BY m.mes_ref
  )
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'mes', TO_CHAR(dm.mes_ref, 'YYYY-MM'),
      'mes_nome', TO_CHAR(dm.mes_ref, 'Mon/YY'),
      'total_conciliacoes', dm.total_conciliacoes,
      'taxa_sucesso', CASE 
        WHEN dm.total_conciliacoes > 0 
        THEN ROUND((dm.conciliacoes_ok::NUMERIC / dm.total_conciliacoes) * 100, 2)
        ELSE 0 
      END,
      'volume_mensal', dm.volume_mensal
    ) ORDER BY dm.mes_ref
  ) INTO evolucao_mensal
  FROM dados_mensais dm;
  
  RETURN QUERY
  SELECT 
    total_maquininhas,
    taxa_conciliacao_media,
    total_transacoes,
    valor_total_transacionado,
    divergencias_criticas,
    tempo_medio_resolucao,
    performance_rede,
    performance_sipag,
    COALESCE(evolucao_mensal, '[]'::JSONB);
END;
$function$;