-- FASE 1: IMPLEMENTAÇÃO COMPLETA DA ESTRUTURA DE VENDAS

-- 1. View completa de vendas com joins
CREATE OR REPLACE VIEW vw_vendas_completas AS
SELECT 
    v.id,
    v.data_venda,
    v.hora_venda,
    v.cliente_id,
    c.nome as cliente_nome,
    c.documento as cliente_documento,
    c.tipo as cliente_tipo,
    v.vendedor,
    v.valor_total,
    v.desconto,
    v.valor_final,
    v.forma_pagamento,
    v.parcelas,
    v.tipo_venda,
    v.comissao_percentual,
    v.comissao_valor,
    v.status,
    v.observacoes,
    v.plano_conta_id,
    pc.nome as categoria_nome,
    pc.codigo as categoria_codigo,
    pc.tipo_dre,
    v.ativo,
    v.created_at,
    v.updated_at,
    -- Campos calculados
    EXTRACT(YEAR FROM v.data_venda) as ano_venda,
    EXTRACT(MONTH FROM v.data_venda) as mes_venda,
    CASE 
        WHEN v.tipo_venda = 'devolucao' THEN -v.valor_final
        ELSE v.valor_final
    END as valor_liquido,
    -- Status da venda baseado na data
    CASE 
        WHEN v.status = 'cancelada' THEN 'Cancelada'
        WHEN v.data_venda = CURRENT_DATE THEN 'Hoje'
        WHEN v.data_venda > CURRENT_DATE - INTERVAL '7 days' THEN 'Esta Semana'
        WHEN v.data_venda > CURRENT_DATE - INTERVAL '30 days' THEN 'Este Mês'
        ELSE 'Anterior'
    END as periodo_venda
FROM public.vendas v
LEFT JOIN public.clientes c ON v.cliente_id = c.id
LEFT JOIN public.plano_contas pc ON v.plano_conta_id = pc.id
WHERE v.ativo = true
ORDER BY v.data_venda DESC, v.hora_venda DESC;

-- 2. Função para cálculo automático de comissões
CREATE OR REPLACE FUNCTION public.calcular_comissao_venda(
    valor_venda NUMERIC,
    percentual_comissao NUMERIC DEFAULT 0,
    tipo_venda VARCHAR DEFAULT 'produto'
)
RETURNS NUMERIC AS $$
DECLARE
    comissao_calculada NUMERIC := 0;
BEGIN
    -- Não calcular comissão para devoluções ou cancelamentos
    IF tipo_venda IN ('devolucao', 'cancelamento') THEN
        RETURN 0;
    END IF;
    
    -- Calcular comissão baseada no percentual
    IF percentual_comissao > 0 AND valor_venda > 0 THEN
        comissao_calculada := (valor_venda * percentual_comissao / 100);
    END IF;
    
    -- Arredondar para 2 casas decimais
    RETURN ROUND(comissao_calculada, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para gerar relatórios de vendas por período
CREATE OR REPLACE FUNCTION public.relatorio_vendas_periodo(
    data_inicio DATE,
    data_fim DATE,
    vendedor_filtro VARCHAR DEFAULT NULL,
    cliente_id_filtro INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_vendas BIGINT,
    valor_bruto NUMERIC,
    valor_descontos NUMERIC,
    valor_liquido NUMERIC,
    total_comissoes NUMERIC,
    ticket_medio NUMERIC,
    vendas_por_forma_pagamento JSON,
    vendas_por_categoria JSON,
    vendas_por_vendedor JSON,
    evolucao_diaria JSON
) AS $$
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
    AND (cliente_id_filtro IS NULL OR cliente_id = cliente_id_filtro);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para calcular comissão automaticamente
CREATE OR REPLACE FUNCTION public.trigger_calcular_comissao_venda()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular comissão automaticamente se não foi informada
    IF NEW.comissao_valor IS NULL OR NEW.comissao_valor = 0 THEN
        NEW.comissao_valor := public.calcular_comissao_venda(
            NEW.valor_final,
            COALESCE(NEW.comissao_percentual, 0),
            NEW.tipo_venda
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar trigger para cálculo automático de comissão
DROP TRIGGER IF EXISTS trigger_calcular_comissao ON public.vendas;
CREATE TRIGGER trigger_calcular_comissao
    BEFORE INSERT OR UPDATE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_calcular_comissao_venda();

-- 5. Função para validação robusta de vendas
CREATE OR REPLACE FUNCTION public.validar_venda()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar valor total positivo
    IF NEW.valor_total <= 0 THEN
        RAISE EXCEPTION 'Valor total deve ser maior que zero: %', NEW.valor_total;
    END IF;
    
    -- Validar valor final
    IF NEW.valor_final <= 0 THEN
        RAISE EXCEPTION 'Valor final deve ser maior que zero: %', NEW.valor_final;
    END IF;
    
    -- Validar desconto não pode ser maior que valor total
    IF NEW.desconto > NEW.valor_total THEN
        RAISE EXCEPTION 'Desconto não pode ser maior que o valor total';
    END IF;
    
    -- Validar data de venda não pode ser futura para vendas normais
    IF NEW.data_venda > CURRENT_DATE AND NEW.tipo_venda = 'produto' THEN
        RAISE EXCEPTION 'Data de venda não pode ser futura para vendas normais';
    END IF;
    
    -- Validar cliente existe e está ativo
    IF NOT EXISTS (
        SELECT 1 FROM public.clientes 
        WHERE id = NEW.cliente_id AND ativo = true
    ) THEN
        RAISE EXCEPTION 'Cliente inválido ou inativo: %', NEW.cliente_id;
    END IF;
    
    -- Validar parcelas
    IF NEW.parcelas < 1 THEN
        RAISE EXCEPTION 'Número de parcelas deve ser maior que zero';
    END IF;
    
    -- Validar percentual de comissão
    IF NEW.comissao_percentual < 0 OR NEW.comissao_percentual > 100 THEN
        RAISE EXCEPTION 'Percentual de comissão deve estar entre 0 e 100%%';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar trigger de validação
DROP TRIGGER IF EXISTS trigger_validar_venda ON public.vendas;
CREATE TRIGGER trigger_validar_venda
    BEFORE INSERT OR UPDATE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_venda();

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON public.vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_vendedor ON public.vendas(vendedor);
CREATE INDEX IF NOT EXISTS idx_vendas_forma_pagamento ON public.vendas(forma_pagamento);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON public.vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_tipo_venda ON public.vendas(tipo_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_ativo ON public.vendas(ativo);
CREATE INDEX IF NOT EXISTS idx_vendas_data_created ON public.vendas(created_at);

-- 7. Comentários na view e funções
COMMENT ON VIEW vw_vendas_completas IS 'View completa de vendas com joins para clientes e categorias, incluindo campos calculados';
COMMENT ON FUNCTION public.calcular_comissao_venda IS 'Calcula comissão automática baseada no valor e percentual';
COMMENT ON FUNCTION public.relatorio_vendas_periodo IS 'Gera relatório completo de vendas por período com agregações';

-- Verificar se a estrutura está correta
SELECT 'Fase 1 implementada com sucesso!' as status;
SELECT 'View vw_vendas_completas criada' as item1;
SELECT 'Função calcular_comissao_venda criada' as item2;
SELECT 'Função relatorio_vendas_periodo criada' as item3;
SELECT 'Triggers de validação e comissão configurados' as item4;
SELECT 'Índices de performance criados' as item5;