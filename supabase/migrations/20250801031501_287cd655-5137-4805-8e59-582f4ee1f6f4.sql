-- Função para atualizar estatísticas do vendedor
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_vendedor(p_vendedor_id INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    total_vendas_count INTEGER := 0;
    valor_total_vendido_calc NUMERIC := 0;
    comissao_total_calc NUMERIC := 0;
    ticket_medio_calc NUMERIC := 0;
    melhor_mes_calc NUMERIC := 0;
    data_ultima_venda_calc DATE;
BEGIN
    -- Calcular estatísticas das vendas do vendedor
    SELECT 
        COUNT(*),
        COALESCE(SUM(valor_final), 0),
        COALESCE(SUM(comissao_valor), 0),
        COALESCE(AVG(valor_final), 0),
        MAX(data_venda)
    INTO 
        total_vendas_count,
        valor_total_vendido_calc,
        comissao_total_calc,
        ticket_medio_calc,
        data_ultima_venda_calc
    FROM vendas 
    WHERE vendedor_id = p_vendedor_id 
    AND ativo = true;
    
    -- Calcular melhor mês (maior faturamento mensal)
    SELECT COALESCE(MAX(mes_valor), 0)
    INTO melhor_mes_calc
    FROM (
        SELECT SUM(valor_final) as mes_valor
        FROM vendas 
        WHERE vendedor_id = p_vendedor_id 
        AND ativo = true
        GROUP BY EXTRACT(YEAR FROM data_venda), EXTRACT(MONTH FROM data_venda)
    ) subquery;
    
    -- Atualizar registro do vendedor
    UPDATE vendedores 
    SET 
        total_vendas = total_vendas_count,
        valor_total_vendido = valor_total_vendido_calc,
        comissao_total_recebida = comissao_total_calc,
        ticket_medio = ticket_medio_calc,
        melhor_mes_vendas = melhor_mes_calc,
        data_ultima_venda = data_ultima_venda_calc,
        updated_at = NOW()
    WHERE id = p_vendedor_id;
END;
$$;