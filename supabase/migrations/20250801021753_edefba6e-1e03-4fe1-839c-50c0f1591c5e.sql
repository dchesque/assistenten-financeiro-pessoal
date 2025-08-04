-- Fase 1: Migration para migrar campo vendedor (texto) → vendedor_id (FK)

-- Primeiro, verificar se já existe o campo vendedor_id na tabela vendas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vendas' AND column_name = 'vendedor_id'
    ) THEN
        -- Adicionar campo vendedor_id como FK opcional
        ALTER TABLE vendas ADD COLUMN vendedor_id INTEGER;
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_vendas_vendedor_id ON vendas(vendedor_id);
    END IF;
END $$;

-- Função para migrar dados existentes de vendedor (texto) para vendedor_id (FK)
CREATE OR REPLACE FUNCTION migrar_vendedor_texto_para_id()
RETURNS TABLE(
    migradas INTEGER,
    nao_migradas INTEGER,
    detalhes JSONB
) LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_migradas INTEGER := 0;
    total_nao_migradas INTEGER := 0;
    vendedor_rec RECORD;
    vendedor_encontrado INTEGER;
    detalhes_resultado JSONB := '[]'::JSONB;
BEGIN
    -- Buscar vendas com campo vendedor preenchido mas sem vendedor_id
    FOR vendedor_rec IN 
        SELECT DISTINCT vendedor, COUNT(*) as total_vendas
        FROM vendas 
        WHERE vendedor IS NOT NULL 
        AND vendedor != '' 
        AND vendedor_id IS NULL
        GROUP BY vendedor
    LOOP
        -- Tentar encontrar vendedor correspondente
        SELECT id INTO vendedor_encontrado
        FROM vendedores
        WHERE LOWER(TRIM(nome)) = LOWER(TRIM(vendedor_rec.vendedor))
        OR LOWER(TRIM(codigo_vendedor)) = LOWER(TRIM(vendedor_rec.vendedor))
        AND ativo = true
        LIMIT 1;
        
        IF vendedor_encontrado IS NOT NULL THEN
            -- Atualizar vendas com o vendedor_id encontrado
            UPDATE vendas 
            SET vendedor_id = vendedor_encontrado
            WHERE vendedor = vendedor_rec.vendedor
            AND vendedor_id IS NULL;
            
            total_migradas := total_migradas + vendedor_rec.total_vendas;
            
            -- Adicionar aos detalhes
            detalhes_resultado := detalhes_resultado || jsonb_build_object(
                'vendedor_nome', vendedor_rec.vendedor,
                'vendedor_id', vendedor_encontrado,
                'vendas_migradas', vendedor_rec.total_vendas,
                'status', 'migrado'
            );
        ELSE
            total_nao_migradas := total_nao_migradas + vendedor_rec.total_vendas;
            
            -- Adicionar aos detalhes como não migrado
            detalhes_resultado := detalhes_resultado || jsonb_build_object(
                'vendedor_nome', vendedor_rec.vendedor,
                'vendas_nao_migradas', vendedor_rec.total_vendas,
                'status', 'nao_encontrado'
            );
        END IF;
    END LOOP;
    
    -- Log da migração
    INSERT INTO audit_log (
        tabela, operacao, descricao
    ) VALUES (
        'vendas', 'migracao_vendedor',
        'Migração vendedor texto->ID: ' || total_migradas::TEXT || ' migradas, ' || total_nao_migradas::TEXT || ' não migradas'
    );
    
    RETURN QUERY
    SELECT total_migradas, total_nao_migradas, detalhes_resultado;
END;
$$;

-- Função para obter ranking de vendedores com período
CREATE OR REPLACE FUNCTION obter_ranking_vendedores(
    p_periodo VARCHAR DEFAULT 'mes_atual',
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    vendedor_id INTEGER,
    vendedor_nome VARCHAR,
    codigo_vendedor VARCHAR,
    total_vendas BIGINT,
    valor_vendido NUMERIC,
    meta_mensal NUMERIC,
    percentual_meta NUMERIC,
    ranking_posicao INTEGER,
    foto_url TEXT
) LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    data_inicio DATE;
    data_fim DATE;
BEGIN
    -- Determinar período baseado no parâmetro
    CASE p_periodo
        WHEN 'mes_atual' THEN
            data_inicio := DATE_TRUNC('month', CURRENT_DATE);
            data_fim := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
        WHEN 'mes_anterior' THEN
            data_inicio := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
            data_fim := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
        WHEN 'trimestre' THEN
            data_inicio := DATE_TRUNC('quarter', CURRENT_DATE);
            data_fim := DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months' - INTERVAL '1 day';
        WHEN 'ano' THEN
            data_inicio := DATE_TRUNC('year', CURRENT_DATE);
            data_fim := DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day';
        ELSE
            data_inicio := DATE_TRUNC('month', CURRENT_DATE);
            data_fim := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
    END CASE;
    
    RETURN QUERY
    WITH vendas_periodo AS (
        SELECT 
            v.vendedor_id,
            COUNT(*) as total_vendas_periodo,
            COALESCE(SUM(v.valor_final), 0) as valor_total_periodo
        FROM vendas v
        WHERE v.data_venda BETWEEN data_inicio AND data_fim
        AND v.ativo = true
        AND v.vendedor_id IS NOT NULL
        AND (p_user_id IS NULL OR v.user_id = p_user_id)
        GROUP BY v.vendedor_id
    ),
    ranking_calculado AS (
        SELECT 
            vd.id as vendedor_id,
            vd.nome as vendedor_nome,
            vd.codigo_vendedor,
            COALESCE(vp.total_vendas_periodo, 0) as total_vendas,
            COALESCE(vp.valor_total_periodo, 0) as valor_vendido,
            vd.meta_mensal,
            CASE 
                WHEN vd.meta_mensal > 0 THEN 
                    ROUND((COALESCE(vp.valor_total_periodo, 0) / vd.meta_mensal) * 100, 2)
                ELSE 0 
            END as percentual_meta,
            vd.foto_url,
            ROW_NUMBER() OVER (ORDER BY COALESCE(vp.valor_total_periodo, 0) DESC) as ranking_posicao
        FROM vendedores vd
        LEFT JOIN vendas_periodo vp ON vd.id = vp.vendedor_id
        WHERE vd.ativo = true
        AND (p_user_id IS NULL OR vd.user_id = p_user_id)
    )
    SELECT 
        rc.vendedor_id,
        rc.vendedor_nome,
        rc.codigo_vendedor,
        rc.total_vendas,
        rc.valor_vendido,
        rc.meta_mensal,
        rc.percentual_meta,
        rc.ranking_posicao::INTEGER,
        rc.foto_url
    FROM ranking_calculado rc
    ORDER BY rc.ranking_posicao;
END;
$$;