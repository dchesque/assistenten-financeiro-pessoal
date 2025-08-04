-- Adicionar novos campos à tabela contas_pagar
ALTER TABLE public.contas_pagar 
ADD COLUMN IF NOT EXISTS grupo_lancamento TEXT,
ADD COLUMN IF NOT EXISTS parcela_atual INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS forma_pagamento CHARACTER VARYING(50) DEFAULT 'dinheiro_pix';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON public.contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor ON public.contas_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON public.contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_grupo_lancamento ON public.contas_pagar(grupo_lancamento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_user_status ON public.contas_pagar(user_id, status);

-- Função otimizada para buscar contas
CREATE OR REPLACE FUNCTION buscar_contas_otimizada(
  p_filtros JSONB DEFAULT '{}'::JSONB,
  p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
  id INTEGER,
  descricao TEXT,
  valor_final NUMERIC,
  valor_original NUMERIC,
  status TEXT,
  data_vencimento DATE,
  data_pagamento DATE,
  fornecedor_id INTEGER,
  fornecedor_nome TEXT,
  plano_conta_id INTEGER,
  plano_conta_nome TEXT,
  banco_id INTEGER,
  banco_nome TEXT,
  dias_para_vencimento INTEGER,
  dias_em_atraso INTEGER,
  grupo_lancamento TEXT,
  parcela_atual INTEGER,
  total_parcelas INTEGER,
  forma_pagamento TEXT,
  documento_referencia TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  where_clause TEXT := '';
  limit_clause TEXT := '';
  order_clause TEXT := '';
  busca_term TEXT;
  status_filter TEXT;
  fornecedor_filter INTEGER;
  plano_conta_filter INTEGER;
  data_inicio DATE;
  data_fim DATE;
BEGIN
  -- Extrair filtros do JSON
  busca_term := p_filtros->>'busca';
  status_filter := p_filtros->>'status';
  fornecedor_filter := (p_filtros->>'fornecedor_id')::INTEGER;
  plano_conta_filter := (p_filtros->>'plano_conta_id')::INTEGER;
  data_inicio := (p_filtros->>'data_inicio')::DATE;
  data_fim := (p_filtros->>'data_fim')::DATE;
  
  -- Construir WHERE clause
  where_clause := 'WHERE cp.user_id = $1';
  
  IF busca_term IS NOT NULL AND busca_term != '' THEN
    where_clause := where_clause || ' AND (cp.descricao ILIKE ''%' || busca_term || '%'' OR f.nome ILIKE ''%' || busca_term || '%'')';
  END IF;
  
  IF status_filter IS NOT NULL AND status_filter != 'todos' THEN
    where_clause := where_clause || ' AND cp.status = ''' || status_filter || '''';
  END IF;
  
  IF fornecedor_filter IS NOT NULL THEN
    where_clause := where_clause || ' AND cp.fornecedor_id = ' || fornecedor_filter;
  END IF;
  
  IF plano_conta_filter IS NOT NULL THEN
    where_clause := where_clause || ' AND cp.plano_conta_id = ' || plano_conta_filter;
  END IF;
  
  IF data_inicio IS NOT NULL THEN
    where_clause := where_clause || ' AND cp.data_vencimento >= ''' || data_inicio || '''';
  END IF;
  
  IF data_fim IS NOT NULL THEN
    where_clause := where_clause || ' AND cp.data_vencimento <= ''' || data_fim || '''';
  END IF;
  
  -- Ordenação otimizada
  order_clause := 'ORDER BY cp.data_vencimento ASC, cp.created_at DESC';
  
  -- Executar query otimizada
  RETURN QUERY EXECUTE format('
    SELECT 
      cp.id,
      cp.descricao::TEXT,
      cp.valor_final,
      cp.valor_original,
      cp.status::TEXT,
      cp.data_vencimento,
      cp.data_pagamento,
      cp.fornecedor_id,
      f.nome::TEXT as fornecedor_nome,
      cp.plano_conta_id,
      pc.nome::TEXT as plano_conta_nome,
      cp.banco_id,
      b.nome::TEXT as banco_nome,
      CASE 
        WHEN cp.data_vencimento >= CURRENT_DATE THEN (cp.data_vencimento - CURRENT_DATE)
        ELSE 0
      END::INTEGER as dias_para_vencimento,
      CASE 
        WHEN cp.data_vencimento < CURRENT_DATE AND cp.status = ''pendente'' THEN (CURRENT_DATE - cp.data_vencimento)
        ELSE 0
      END::INTEGER as dias_em_atraso,
      cp.grupo_lancamento::TEXT,
      cp.parcela_atual,
      cp.total_parcelas,
      cp.forma_pagamento::TEXT,
      cp.documento_referencia::TEXT,
      cp.observacoes::TEXT,
      cp.created_at,
      cp.updated_at
    FROM contas_pagar cp
    LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
    LEFT JOIN plano_contas pc ON cp.plano_conta_id = pc.id
    LEFT JOIN bancos b ON cp.banco_id = b.id
    %s
    %s
  ', where_clause, order_clause) USING p_user_id;
END;
$$;

-- Função para estatísticas rápidas
CREATE OR REPLACE FUNCTION estatisticas_contas_rapidas(p_user_id UUID)
RETURNS TABLE(
  total_pendentes BIGINT,
  valor_pendente NUMERIC,
  total_vencidas BIGINT,
  valor_vencido NUMERIC,
  total_vence_7_dias BIGINT,
  valor_vence_7_dias NUMERIC,
  total_pagas_mes BIGINT,
  valor_pago_mes NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE status = 'pendente') as total_pendentes,
    COALESCE(SUM(valor_final) FILTER (WHERE status = 'pendente'), 0) as valor_pendente,
    COUNT(*) FILTER (WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE) as total_vencidas,
    COALESCE(SUM(valor_final) FILTER (WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE), 0) as valor_vencido,
    COUNT(*) FILTER (WHERE status = 'pendente' AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as total_vence_7_dias,
    COALESCE(SUM(valor_final) FILTER (WHERE status = 'pendente' AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'), 0) as valor_vence_7_dias,
    COUNT(*) FILTER (WHERE status = 'pago' AND EXTRACT(YEAR FROM data_pagamento) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM data_pagamento) = EXTRACT(MONTH FROM CURRENT_DATE)) as total_pagas_mes,
    COALESCE(SUM(valor_final) FILTER (WHERE status = 'pago' AND EXTRACT(YEAR FROM data_pagamento) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM data_pagamento) = EXTRACT(MONTH FROM CURRENT_DATE)), 0) as valor_pago_mes
  FROM contas_pagar
  WHERE user_id = p_user_id;
END;
$$;