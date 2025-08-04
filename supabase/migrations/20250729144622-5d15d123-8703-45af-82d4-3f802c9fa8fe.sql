-- Corrigir as funções restantes para incluir SET search_path TO 'public'

-- 11. Função classificar_venda_dre
CREATE OR REPLACE FUNCTION public.classificar_venda_dre(venda_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    venda_rec RECORD;
    categoria_dre_id INTEGER;
    tipo_dre_calculado VARCHAR(50);
BEGIN
    -- Buscar dados da venda
    SELECT 
        v.*,
        pc.tipo_dre,
        pc.id as plano_conta_id
    INTO venda_rec
    FROM vendas v
    LEFT JOIN plano_contas pc ON v.plano_conta_id = pc.id
    WHERE v.id = venda_id AND v.ativo = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venda não encontrada: %', venda_id;
    END IF;
    
    -- Determinar classificação DRE baseada no tipo de venda
    CASE venda_rec.tipo_venda
        WHEN 'produto' THEN
            tipo_dre_calculado := 'receita_vendas';
        WHEN 'servico' THEN
            tipo_dre_calculado := 'receita_servicos';
        WHEN 'devolucao' THEN
            tipo_dre_calculado := 'devolucoes_vendas';
        ELSE
            tipo_dre_calculado := 'outras_receitas';
    END CASE;
    
    -- Se não tem plano de contas ou o tipo DRE está vazio, buscar/criar categoria adequada
    IF venda_rec.plano_conta_id IS NULL OR venda_rec.tipo_dre IS NULL THEN
        -- Buscar categoria DRE apropriada
        SELECT id INTO categoria_dre_id
        FROM plano_contas
        WHERE tipo_dre = tipo_dre_calculado
        AND aceita_lancamento = true
        AND ativo = true
        LIMIT 1;
        
        -- Se não encontrou, criar categoria básica
        IF categoria_dre_id IS NULL THEN
            INSERT INTO plano_contas (
                codigo,
                nome,
                tipo_dre,
                aceita_lancamento,
                ativo
            ) VALUES (
                '3.' || LPAD(nextval('plano_contas_id_seq')::TEXT, 3, '0'),
                CASE tipo_dre_calculado
                    WHEN 'receita_vendas' THEN 'Receita de Vendas - Produtos'
                    WHEN 'receita_servicos' THEN 'Receita de Vendas - Serviços'
                    WHEN 'devolucoes_vendas' THEN 'Devoluções de Vendas'
                    ELSE 'Outras Receitas'
                END,
                tipo_dre_calculado,
                true,
                true
            ) RETURNING id INTO categoria_dre_id;
        END IF;
        
        -- Atualizar venda com a categoria correta
        UPDATE vendas 
        SET plano_conta_id = categoria_dre_id
        WHERE id = venda_id;
    END IF;
    
    -- Log da classificação
    INSERT INTO audit_log (
        tabela, operacao, registro_id, descricao
    ) VALUES (
        'dre', 'classificacao_automatica', venda_id,
        'Classificação automática DRE: ' || tipo_dre_calculado
    );
END;
$function$;

-- 12. Função reconciliar_movimentacao_automatica
CREATE OR REPLACE FUNCTION public.reconciliar_movimentacao_automatica(p_data_inicio date, p_data_fim date, p_banco_id integer DEFAULT NULL::integer)
 RETURNS TABLE(movimentacoes_reconciliadas integer, vendas_encontradas integer, valor_total_reconciliado numeric, detalhes jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    reconciliadas INTEGER := 0;
    vendas_match INTEGER := 0;
    valor_total NUMERIC := 0;
    detalhes_result JSONB := '[]'::JSONB;
    mov_rec RECORD;
    venda_match RECORD;
    tolerance NUMERIC := 0.50; -- Tolerância de R$ 0,50 para matching
BEGIN
    -- Buscar movimentações bancárias não reconciliadas
    FOR mov_rec IN
        SELECT mb.*
        FROM movimentacoes_bancarias mb
        WHERE mb.data_movimentacao BETWEEN p_data_inicio AND p_data_fim
        AND (p_banco_id IS NULL OR mb.banco_id = p_banco_id)
        AND mb.tipo_movimentacao = 'entrada'
        AND mb.ativo = true
        AND mb.documento_referencia IS NULL
    LOOP
        -- Buscar venda com valor similar na mesma data
        SELECT v.* INTO venda_match
        FROM vendas v
        WHERE v.data_venda = mov_rec.data_movimentacao
        AND ABS(v.valor_final - mov_rec.valor) <= tolerance
        AND v.ativo = true
        AND NOT EXISTS (
            SELECT 1 FROM movimentacoes_bancarias mb2
            WHERE mb2.documento_referencia = 'VENDA-' || v.id::TEXT
        )
        ORDER BY ABS(v.valor_final - mov_rec.valor)
        LIMIT 1;
        
        -- Se encontrou match, fazer a reconciliação
        IF FOUND THEN
            -- Atualizar movimentação bancária
            UPDATE movimentacoes_bancarias
            SET 
                documento_referencia = 'VENDA-' || venda_match.id::TEXT,
                descricao = 'RECONCILIADO - ' || mov_rec.descricao,
                categoria = 'Vendas',
                observacoes = COALESCE(observacoes, '') || ' | Reconciliação automática'
            WHERE id = mov_rec.id;
            
            reconciliadas := reconciliadas + 1;
            vendas_match := vendas_match + 1;
            valor_total := valor_total + mov_rec.valor;
            
            -- Adicionar aos detalhes
            detalhes_result := detalhes_result || jsonb_build_object(
                'movimentacao_id', mov_rec.id,
                'venda_id', venda_match.id,
                'valor', mov_rec.valor,
                'data', mov_rec.data_movimentacao,
                'diferenca', ABS(venda_match.valor_final - mov_rec.valor)
            );
        END IF;
    END LOOP;
    
    -- Log da reconciliação
    INSERT INTO audit_log (
        tabela, operacao, descricao
    ) VALUES (
        'reconciliacao', 'automatica',
        'Reconciliação automática: ' || reconciliadas::TEXT || ' movimentações'
    );
    
    RETURN QUERY
    SELECT reconciliadas, vendas_match, valor_total, detalhes_result;
END;
$function$;

-- 13. Função gerar_relatorio_gerencial_periodo
CREATE OR REPLACE FUNCTION public.gerar_relatorio_gerencial_periodo(p_data_inicio date, p_data_fim date)
 RETURNS TABLE(periodo text, total_vendas bigint, receita_bruta numeric, receita_liquida numeric, ticket_medio numeric, vendas_por_forma_pagamento jsonb, evolucao_diaria jsonb, top_categorias jsonb, performance_vendedores jsonb, indicadores_dre jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        -- Período
        p_data_inicio::TEXT || ' a ' || p_data_fim::TEXT,
        
        -- Métricas básicas
        COUNT(v.id)::BIGINT,
        COALESCE(SUM(v.valor_total), 0),
        COALESCE(SUM(v.valor_final), 0),
        CASE WHEN COUNT(v.id) > 0 THEN COALESCE(SUM(v.valor_final), 0) / COUNT(v.id) ELSE 0 END,
        
        -- Vendas por forma de pagamento
        (SELECT jsonb_agg(
            jsonb_build_object(
                'forma_pagamento', forma_pagamento,
                'quantidade', count(*),
                'valor_total', sum(valor_final),
                'percentual', ROUND((sum(valor_final) / NULLIF(SUM(SUM(valor_final)) OVER(), 0)) * 100, 2)
            )
        ) FROM vendas
         WHERE data_venda BETWEEN p_data_inicio AND p_data_fim AND ativo = true
         GROUP BY forma_pagamento),
        
        -- Evolução diária
        (SELECT jsonb_agg(
            jsonb_build_object(
                'data', data_venda,
                'vendas', count(*),
                'receita', sum(valor_final)
            ) ORDER BY data_venda
        ) FROM vendas
         WHERE data_venda BETWEEN p_data_inicio AND p_data_fim AND ativo = true
         GROUP BY data_venda),
        
        -- Top categorias
        (SELECT jsonb_agg(
            jsonb_build_object(
                'categoria', pc.nome,
                'vendas', count(*),
                'receita', sum(v.valor_final),
                'participacao', ROUND((sum(v.valor_final) / NULLIF(SUM(SUM(v.valor_final)) OVER(), 0)) * 100, 2)
            )
        ) FROM vendas v
         LEFT JOIN plano_contas pc ON v.plano_conta_id = pc.id
         WHERE v.data_venda BETWEEN p_data_inicio AND p_data_fim AND v.ativo = true
         GROUP BY pc.nome
         ORDER BY sum(v.valor_final) DESC
         LIMIT 10),
        
        -- Performance vendedores
        (SELECT jsonb_agg(
            jsonb_build_object(
                'vendedor', vendedor,
                'vendas', count(*),
                'receita', sum(valor_final),
                'comissao', sum(comissao_valor),
                'ticket_medio', ROUND(sum(valor_final) / count(*), 2)
            )
        ) FROM vendas
         WHERE data_venda BETWEEN p_data_inicio AND p_data_fim AND ativo = true
         AND vendedor IS NOT NULL
         GROUP BY vendedor
         ORDER BY sum(valor_final) DESC),
        
        -- Indicadores DRE
        (SELECT jsonb_build_object(
            'receita_total', COALESCE(SUM(CASE WHEN pc.tipo_dre LIKE 'receita%' THEN v.valor_final ELSE 0 END), 0),
            'devolucoes', COALESCE(SUM(CASE WHEN pc.tipo_dre = 'devolucoes_vendas' THEN v.valor_final ELSE 0 END), 0),
            'receita_liquida', COALESCE(SUM(CASE WHEN pc.tipo_dre LIKE 'receita%' THEN v.valor_final ELSE 0 END), 0) - 
                             COALESCE(SUM(CASE WHEN pc.tipo_dre = 'devolucoes_vendas' THEN v.valor_final ELSE 0 END), 0),
            'comissoes_pagas', COALESCE(SUM(v.comissao_valor), 0)
        ) FROM vendas v
         LEFT JOIN plano_contas pc ON v.plano_conta_id = pc.id
         WHERE v.data_venda BETWEEN p_data_inicio AND p_data_fim AND v.ativo = true)
         
    FROM vendas v
    WHERE v.data_venda BETWEEN p_data_inicio AND p_data_fim AND v.ativo = true;
END;
$function$;

-- 14. Função trigger_integracao_venda
CREATE OR REPLACE FUNCTION public.trigger_integracao_venda()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Para INSERT de vendas ativas
    IF TG_OP = 'INSERT' AND NEW.ativo = true THEN
        -- Classificar na DRE
        PERFORM public.classificar_venda_dre(NEW.id);
        
        -- Lançar no fluxo de caixa
        PERFORM public.lancar_venda_fluxo_caixa(NEW.id);
        
        RETURN NEW;
    END IF;
    
    -- Para UPDATE que ativa uma venda
    IF TG_OP = 'UPDATE' AND OLD.ativo = false AND NEW.ativo = true THEN
        -- Classificar na DRE
        PERFORM public.classificar_venda_dre(NEW.id);
        
        -- Lançar no fluxo de caixa
        PERFORM public.lancar_venda_fluxo_caixa(NEW.id);
        
        RETURN NEW;
    END IF;
    
    -- Para UPDATE que desativa uma venda
    IF TG_OP = 'UPDATE' AND OLD.ativo = true AND NEW.ativo = false THEN
        -- Remover lançamento do fluxo de caixa
        UPDATE movimentacoes_bancarias 
        SET ativo = false
        WHERE documento_referencia = 'VENDA-' || NEW.id::TEXT;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- 15. Função relatorio_vendas_periodo
CREATE OR REPLACE FUNCTION public.relatorio_vendas_periodo(data_inicio date, data_fim date, vendedor_filtro character varying DEFAULT NULL::character varying, cliente_id_filtro integer DEFAULT NULL::integer)
 RETURNS TABLE(total_vendas bigint, valor_bruto numeric, valor_descontos numeric, valor_liquido numeric, total_comissoes numeric, ticket_medio numeric, vendas_por_forma_pagamento json, vendas_por_categoria json, vendas_por_vendedor json, evolucao_diaria json)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    vendas_cursor CURSOR FOR 
        SELECT * FROM vw_vendas_completas 
        WHERE data_venda BETWEEN data_inicio AND data_fim
        AND (vendedor_filtro IS NULL OR vendedor = vendedor_filtro)
        AND (cliente_id_filtro IS NULL OR cliente_id = cliente_id_filtro);
BEGIN
    RETURN QUERY
    SELECT 
        -- Total de vendas
        COUNT(*)::BIGINT,
        
        -- Valor bruto (soma de valor_total)
        COALESCE(SUM(valor_total), 0),
        
        -- Total de descontos
        COALESCE(SUM(desconto), 0),
        
        -- Valor líquido
        COALESCE(SUM(valor_liquido), 0),
        
        -- Total de comissões
        COALESCE(SUM(comissao_valor), 0),
        
        -- Ticket médio
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(valor_liquido), 0) / COUNT(*)
            ELSE 0
        END,
        
        -- Vendas por forma de pagamento
        (SELECT json_agg(
            json_build_object(
                'forma_pagamento', forma_pagamento,
                'quantidade', count(*),
                'valor_total', sum(valor_liquido)
            )
        ) FROM vw_vendas_completas 
         WHERE data_venda BETWEEN data_inicio AND data_fim
         AND (vendedor_filtro IS NULL OR vendedor = vendedor_filtro)
         AND (cliente_id_filtro IS NULL OR cliente_id = cliente_id_filtro)
         GROUP BY forma_pagamento),
        
        -- Vendas por categoria
        (SELECT json_agg(
            json_build_object(
                'categoria', categoria_nome,
                'quantidade', count(*),
                'valor_total', sum(valor_liquido)
            )
        ) FROM vw_vendas_completas 
         WHERE data_venda BETWEEN data_inicio AND data_fim
         AND (vendedor_filtro IS NULL OR vendedor = vendedor_filtro)
         AND (cliente_id_filtro IS NULL OR cliente_id = cliente_id_filtro)
         AND categoria_nome IS NOT NULL
         GROUP BY categoria_nome),
        
        -- Vendas por vendedor
        (SELECT json_agg(
            json_build_object(
                'vendedor', vendedor,
                'quantidade', count(*),
                'valor_total', sum(valor_liquido),
                'comissao_total', sum(comissao_valor)
            )
        ) FROM vw_vendas_completas 
         WHERE data_venda BETWEEN data_inicio AND data_fim
         AND (vendedor_filtro IS NULL OR vendedor = vendedor_filtro)
         AND (cliente_id_filtro IS NULL OR cliente_id = cliente_id_filtro)
         AND vendedor IS NOT NULL
         GROUP BY vendedor),
        
        -- Evolução diária
        (SELECT json_agg(
            json_build_object(
                'data', data_venda,
                'quantidade', count(*),
                'valor_total', sum(valor_liquido)
            ) ORDER BY data_venda
        ) FROM vw_vendas_completas 
         WHERE data_venda BETWEEN data_inicio AND data_fim
         AND (vendedor_filtro IS NULL OR vendedor = vendedor_filtro)
         AND (cliente_id_filtro IS NULL OR cliente_id = cliente_id_filtro)
         GROUP BY data_venda)
         
    FROM vw_vendas_completas
    WHERE data_venda BETWEEN data_inicio AND data_fim
    AND (vendedor_filtro IS NULL OR vendedor = vendedor_filtro)
    AND (cliente_id_filtro IS NULL OR cliente_id_filtro);
END;
$function$;