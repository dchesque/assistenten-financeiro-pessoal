-- FASE 7: INTEGRAÇÃO COM OUTROS MÓDULOS
-- ================================================

-- 1. FUNÇÃO PARA LANÇAMENTO AUTOMÁTICO NO FLUXO DE CAIXA
CREATE OR REPLACE FUNCTION public.lancar_venda_fluxo_caixa(venda_id INTEGER)
RETURNS void AS $$
DECLARE
    venda_rec RECORD;
    entrada_total NUMERIC := 0;
    descricao_lancamento TEXT;
BEGIN
    -- Buscar dados da venda
    SELECT 
        v.*,
        c.nome as cliente_nome,
        pc.nome as categoria_nome
    INTO venda_rec
    FROM vendas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN plano_contas pc ON v.plano_conta_id = pc.id
    WHERE v.id = venda_id AND v.ativo = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venda não encontrada: %', venda_id;
    END IF;
    
    -- Calcular valor de entrada baseado no tipo de venda
    IF venda_rec.tipo_venda = 'devolucao' THEN
        entrada_total := -venda_rec.valor_final; -- Valor negativo para devolução
        descricao_lancamento := 'DEVOLUÇÃO - ' || venda_rec.cliente_nome;
    ELSE
        entrada_total := venda_rec.valor_final;
        descricao_lancamento := 'VENDA - ' || venda_rec.cliente_nome;
    END IF;
    
    -- Adicionar detalhes da forma de pagamento
    IF venda_rec.forma_pagamento IS NOT NULL THEN
        descricao_lancamento := descricao_lancamento || ' (' || venda_rec.forma_pagamento || ')';
    END IF;
    
    -- Inserir lançamento no fluxo de caixa
    -- Verificar se já existe lançamento para esta venda
    IF NOT EXISTS (
        SELECT 1 FROM movimentacoes_bancarias 
        WHERE documento_referencia = 'VENDA-' || venda_id::TEXT
    ) THEN
        -- Usar banco padrão (primeiro banco ativo) se não especificado
        INSERT INTO movimentacoes_bancarias (
            banco_id,
            data_movimentacao,
            tipo_movimentacao,
            valor,
            descricao,
            categoria,
            documento_referencia,
            observacoes
        )
        SELECT 
            COALESCE((SELECT id FROM bancos WHERE ativo = true LIMIT 1), 1),
            venda_rec.data_venda,
            CASE WHEN entrada_total >= 0 THEN 'entrada' ELSE 'saida' END,
            ABS(entrada_total),
            descricao_lancamento,
            COALESCE(venda_rec.categoria_nome, 'Vendas'),
            'VENDA-' || venda_id::TEXT,
            'Lançamento automático da venda #' || venda_id::TEXT;
    END IF;
    
    -- Log da operação
    INSERT INTO audit_log (
        tabela, operacao, registro_id, descricao
    ) VALUES (
        'fluxo_caixa', 'lancamento_automatico', venda_id,
        'Lançamento automático no fluxo de caixa para venda #' || venda_id::TEXT
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO PARA CLASSIFICAÇÃO AUTOMÁTICA DRE
CREATE OR REPLACE FUNCTION public.classificar_venda_dre(venda_id INTEGER)
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO PARA RECONCILIAÇÃO BANCÁRIA AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.reconciliar_movimentacao_automatica(
    p_data_inicio DATE,
    p_data_fim DATE,
    p_banco_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    movimentacoes_reconciliadas INTEGER,
    vendas_encontradas INTEGER,
    valor_total_reconciliado NUMERIC,
    detalhes JSONB
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO PARA GERAÇÃO DE RELATÓRIO GERENCIAL AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.gerar_relatorio_gerencial_periodo(
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS TABLE(
    periodo TEXT,
    total_vendas BIGINT,
    receita_bruta NUMERIC,
    receita_liquida NUMERIC,
    ticket_medio NUMERIC,
    vendas_por_forma_pagamento JSONB,
    evolucao_diaria JSONB,
    top_categorias JSONB,
    performance_vendedores JSONB,
    indicadores_dre JSONB
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER PARA INTEGRAÇÃO AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.trigger_integracao_venda()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para integração automática
DROP TRIGGER IF EXISTS trigger_integracao_vendas ON vendas;
CREATE TRIGGER trigger_integracao_vendas
    AFTER INSERT OR UPDATE ON vendas
    FOR EACH ROW EXECUTE FUNCTION trigger_integracao_venda();

-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
COMMENT ON FUNCTION public.lancar_venda_fluxo_caixa(INTEGER) IS 'Lança vendas automaticamente no fluxo de caixa';
COMMENT ON FUNCTION public.classificar_venda_dre(INTEGER) IS 'Classifica vendas automaticamente no plano de contas DRE';
COMMENT ON FUNCTION public.reconciliar_movimentacao_automatica(DATE, DATE, INTEGER) IS 'Reconcilia movimentações bancárias com vendas automaticamente';
COMMENT ON FUNCTION public.gerar_relatorio_gerencial_periodo(DATE, DATE) IS 'Gera relatório gerencial completo para período';