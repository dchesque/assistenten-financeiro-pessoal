-- FASE 1: CORREÇÕES CRÍTICAS DO BANCO DE DADOS

-- 1. Criar função para gerar próximo código de vendedor
CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_vendedor(p_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    proximo_numero INTEGER;
    codigo_gerado TEXT;
BEGIN
    -- Buscar o maior código existente para o usuário
    SELECT COALESCE(
        MAX(CAST(REGEXP_REPLACE(codigo_vendedor, '[^0-9]', '', 'g') AS INTEGER)), 
        0
    ) + 1 
    INTO proximo_numero
    FROM vendedores 
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
    AND codigo_vendedor ~ '^[V]?[0-9]+$'; -- Apenas códigos numéricos ou V+número
    
    -- Gerar código no formato V001, V002, etc.
    codigo_gerado := 'V' || LPAD(proximo_numero::TEXT, 3, '0');
    
    -- Verificar se o código já existe (loop de segurança)
    WHILE EXISTS (
        SELECT 1 FROM vendedores 
        WHERE codigo_vendedor = codigo_gerado 
        AND (p_user_id IS NULL OR user_id = p_user_id)
    ) LOOP
        proximo_numero := proximo_numero + 1;
        codigo_gerado := 'V' || LPAD(proximo_numero::TEXT, 3, '0');
    END LOOP;
    
    RETURN codigo_gerado;
END;
$$;

-- 2. Melhorar função de ranking para lidar com casos extremos
CREATE OR REPLACE FUNCTION public.obter_ranking_vendedores_melhorado(
    p_periodo character varying DEFAULT 'mes_atual'::character varying, 
    p_user_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
    vendedor_id integer, 
    vendedor_nome character varying, 
    codigo_vendedor character varying, 
    total_vendas bigint, 
    valor_vendido numeric, 
    meta_mensal numeric, 
    percentual_meta numeric, 
    ranking_posicao integer, 
    foto_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    data_inicio DATE;
    data_fim DATE;
BEGIN
    -- Determinar período com validação
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
            -- Período padrão em caso de valor inválido
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
            COALESCE(vd.meta_mensal, 0) as meta_mensal,
            CASE 
                WHEN COALESCE(vd.meta_mensal, 0) > 0 THEN 
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
    
EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar vazio
    RETURN;
END;
$$;

-- 3. Adicionar trigger para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION public.trigger_atualizar_vendedor_estatisticas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualizar estatísticas quando venda é criada, atualizada ou excluída
    IF TG_OP = 'INSERT' AND NEW.vendedor_id IS NOT NULL AND NEW.ativo = true THEN
        PERFORM public.atualizar_estatisticas_vendedor(NEW.vendedor_id);
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Se mudou o vendedor ou status
        IF OLD.vendedor_id IS DISTINCT FROM NEW.vendedor_id OR OLD.ativo IS DISTINCT FROM NEW.ativo THEN
            IF OLD.vendedor_id IS NOT NULL THEN
                PERFORM public.atualizar_estatisticas_vendedor(OLD.vendedor_id);
            END IF;
            IF NEW.vendedor_id IS NOT NULL AND NEW.ativo = true THEN
                PERFORM public.atualizar_estatisticas_vendedor(NEW.vendedor_id);
            END IF;
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' AND OLD.vendedor_id IS NOT NULL THEN
        PERFORM public.atualizar_estatisticas_vendedor(OLD.vendedor_id);
        RETURN OLD;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_vendedor_estatisticas ON vendas;
CREATE TRIGGER trigger_vendedor_estatisticas
    AFTER INSERT OR UPDATE OR DELETE ON vendas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_vendedor_estatisticas();