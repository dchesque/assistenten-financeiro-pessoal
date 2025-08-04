-- Dropar e recriar função corrigida
DROP FUNCTION IF EXISTS public.buscar_contas_otimizada(jsonb, uuid);

-- Criar função corrigida sem valor_pago
CREATE OR REPLACE FUNCTION public.buscar_contas_otimizada(
    p_filtros JSONB,
    p_user_id UUID
)
RETURNS TABLE(
    id INTEGER,
    fornecedor_id INTEGER,
    plano_conta_id INTEGER,
    banco_id INTEGER,
    documento_referencia TEXT,
    descricao TEXT,
    data_emissao DATE,
    data_vencimento DATE,
    valor_original NUMERIC,
    valor_final NUMERIC,
    status TEXT,
    data_pagamento DATE,
    grupo_lancamento UUID,
    parcela_atual INTEGER,
    total_parcelas INTEGER,
    forma_pagamento TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    fornecedor_nome TEXT,
    plano_conta_nome TEXT,
    banco_nome TEXT,
    dias_para_vencimento INTEGER,
    dias_em_atraso INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fornecedor_filter INTEGER;
    plano_conta_filter INTEGER;
    status_filter TEXT;
    busca_filter TEXT;
    data_inicio_filter DATE;
    data_fim_filter DATE;
BEGIN
    -- Extrair filtros do JSON com tratamento de 'todos'
    fornecedor_filter := CASE 
        WHEN (p_filtros->>'fornecedor_id') = 'todos' THEN NULL
        ELSE (p_filtros->>'fornecedor_id')::INTEGER
    END;
    
    plano_conta_filter := CASE 
        WHEN (p_filtros->>'plano_conta_id') = 'todos' THEN NULL
        ELSE (p_filtros->>'plano_conta_id')::INTEGER
    END;
    
    status_filter := CASE 
        WHEN (p_filtros->>'status') = 'todos' THEN NULL
        ELSE (p_filtros->>'status')
    END;
    
    busca_filter := p_filtros->>'busca';
    data_inicio_filter := CASE 
        WHEN (p_filtros->>'data_inicio') = '' THEN NULL
        ELSE (p_filtros->>'data_inicio')::DATE
    END;
    data_fim_filter := CASE 
        WHEN (p_filtros->>'data_fim') = '' THEN NULL
        ELSE (p_filtros->>'data_fim')::DATE
    END;

    RETURN QUERY
    SELECT 
        cp.id,
        cp.fornecedor_id,
        cp.plano_conta_id,
        cp.banco_id,
        cp.documento_referencia,
        cp.descricao,
        cp.data_emissao,
        cp.data_vencimento,
        cp.valor_original,
        cp.valor_final,
        cp.status,
        cp.data_pagamento,
        cp.grupo_lancamento,
        COALESCE(cp.parcela_atual, 1) as parcela_atual,
        COALESCE(cp.total_parcelas, 1) as total_parcelas,
        COALESCE(cp.forma_pagamento, 'dinheiro_pix') as forma_pagamento,
        cp.observacoes,
        cp.created_at,
        cp.updated_at,
        f.nome as fornecedor_nome,
        pc.nome as plano_conta_nome,
        b.nome as banco_nome,
        CASE 
            WHEN cp.data_vencimento >= CURRENT_DATE THEN 
                (cp.data_vencimento - CURRENT_DATE)
            ELSE 0
        END as dias_para_vencimento,
        CASE 
            WHEN cp.data_vencimento < CURRENT_DATE AND cp.status = 'pendente' THEN 
                (CURRENT_DATE - cp.data_vencimento)
            ELSE 0
        END as dias_em_atraso
    FROM contas_pagar cp
    LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
    LEFT JOIN plano_contas pc ON cp.plano_conta_id = pc.id
    LEFT JOIN bancos b ON cp.banco_id = b.id
    WHERE cp.user_id = p_user_id
        AND (fornecedor_filter IS NULL OR cp.fornecedor_id = fornecedor_filter)
        AND (plano_conta_filter IS NULL OR cp.plano_conta_id = plano_conta_filter)
        AND (status_filter IS NULL OR cp.status = status_filter)
        AND (busca_filter IS NULL OR busca_filter = '' OR (
            cp.descricao ILIKE '%' || busca_filter || '%' OR
            f.nome ILIKE '%' || busca_filter || '%' OR
            cp.documento_referencia ILIKE '%' || busca_filter || '%'
        ))
        AND (data_inicio_filter IS NULL OR cp.data_vencimento >= data_inicio_filter)
        AND (data_fim_filter IS NULL OR cp.data_vencimento <= data_fim_filter)
    ORDER BY cp.data_vencimento ASC, cp.created_at DESC;
END;
$$;