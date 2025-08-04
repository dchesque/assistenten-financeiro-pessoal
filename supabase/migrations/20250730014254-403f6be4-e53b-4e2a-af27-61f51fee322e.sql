-- Função para obter dashboard de maquininhas
CREATE OR REPLACE FUNCTION public.obter_dashboard_maquininhas()
RETURNS TABLE(
    maquininhas_ativas BIGINT,
    taxa_conciliacao NUMERIC,
    recebido_mes NUMERIC,
    taxas_pagas NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    total_maquininhas BIGINT;
    conciliacoes_ok BIGINT;
    total_conciliacoes BIGINT;
BEGIN
    -- Maquininhas ativas
    SELECT COUNT(*) INTO total_maquininhas
    FROM maquininhas 
    WHERE ativo = true;
    
    -- Taxa de conciliação baseada no mês atual
    SELECT 
        COUNT(*) FILTER (WHERE status = 'ok'),
        COUNT(*)
    INTO conciliacoes_ok, total_conciliacoes
    FROM conciliacoes_maquininha 
    WHERE periodo = TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    RETURN QUERY
    SELECT 
        total_maquininhas,
        CASE 
            WHEN total_conciliacoes > 0 THEN 
                ROUND((conciliacoes_ok::NUMERIC / total_conciliacoes) * 100, 2)
            ELSE 0 
        END,
        COALESCE((
            SELECT SUM(valor_liquido) 
            FROM vendas_maquininha 
            WHERE EXTRACT(YEAR FROM data_recebimento) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM data_recebimento) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND status = 'recebido'
        ), 0),
        COALESCE((
            SELECT SUM(valor_taxa) 
            FROM vendas_maquininha 
            WHERE EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM data_venda) = EXTRACT(MONTH FROM CURRENT_DATE)
        ), 0);
END;
$function$;

-- Função para processar extrato de maquininha
CREATE OR REPLACE FUNCTION public.processar_extrato_maquininha(
    p_maquininha_id UUID,
    p_periodo VARCHAR(7),
    p_arquivo_vendas_nome VARCHAR(255),
    p_arquivo_bancario_nome VARCHAR(255)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    processamento_id UUID;
BEGIN
    -- Criar registro de processamento
    INSERT INTO processamentos_extrato (
        periodo,
        maquininha_id,
        arquivo_vendas_nome,
        arquivo_vendas_tipo,
        arquivo_vendas_processado_em,
        arquivo_vendas_total_registros,
        arquivo_bancario_nome,
        arquivo_bancario_tipo,
        arquivo_bancario_processado_em,
        arquivo_bancario_total_registros,
        status
    ) VALUES (
        p_periodo,
        p_maquininha_id,
        p_arquivo_vendas_nome,
        CASE WHEN p_arquivo_vendas_nome ILIKE '%.xlsx' THEN 'xlsx' ELSE 'csv' END,
        NOW(),
        0, -- Será atualizado após processamento
        p_arquivo_bancario_nome,
        CASE WHEN p_arquivo_bancario_nome ILIKE '%.ofx' THEN 'ofx' ELSE 'csv' END,
        NOW(),
        0, -- Será atualizado após processamento
        'processando'
    ) RETURNING id INTO processamento_id;
    
    RETURN processamento_id;
END;
$function$;

-- Função para conciliar maquininha
CREATE OR REPLACE FUNCTION public.conciliar_maquininha(
    p_maquininha_id UUID,
    p_periodo VARCHAR(7)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    conciliacao_id UUID;
    total_vendas_valor NUMERIC := 0;
    total_recebimentos_valor NUMERIC := 0;
    total_taxas_valor NUMERIC := 0;
    status_resultado VARCHAR(20) := 'ok';
BEGIN
    -- Calcular totais de vendas
    SELECT COALESCE(SUM(valor_liquido), 0), COALESCE(SUM(valor_taxa), 0)
    INTO total_vendas_valor, total_taxas_valor
    FROM vendas_maquininha
    WHERE maquininha_id = p_maquininha_id 
    AND periodo_processamento = p_periodo;
    
    -- Calcular totais de recebimentos bancários
    SELECT COALESCE(SUM(valor), 0)
    INTO total_recebimentos_valor
    FROM recebimentos_bancario rb
    INNER JOIN maquininhas m ON rb.banco_id = m.banco_id
    WHERE m.id = p_maquininha_id
    AND rb.periodo_processamento = p_periodo;
    
    -- Verificar se há divergência (tolerância de R$ 1,00)
    IF ABS(total_vendas_valor - total_recebimentos_valor) > 1.00 THEN
        status_resultado := 'divergencia';
    END IF;
    
    -- Inserir ou atualizar conciliação
    INSERT INTO conciliacoes_maquininha (
        periodo,
        maquininha_id,
        data_conciliacao,
        total_vendas,
        total_recebimentos,
        total_taxas,
        status
    ) VALUES (
        p_periodo,
        p_maquininha_id,
        CURRENT_DATE,
        total_vendas_valor,
        total_recebimentos_valor,
        total_taxas_valor,
        status_resultado
    )
    ON CONFLICT (periodo, maquininha_id)
    DO UPDATE SET
        data_conciliacao = CURRENT_DATE,
        total_vendas = EXCLUDED.total_vendas,
        total_recebimentos = EXCLUDED.total_recebimentos,
        total_taxas = EXCLUDED.total_taxas,
        status = EXCLUDED.status,
        updated_at = NOW()
    RETURNING id INTO conciliacao_id;
    
    RETURN conciliacao_id;
END;
$function$;

-- Função para listar últimas conciliações
CREATE OR REPLACE FUNCTION public.obter_ultimas_conciliacoes(limite INTEGER DEFAULT 10)
RETURNS TABLE(
    id UUID,
    periodo VARCHAR(7),
    maquininha_nome VARCHAR(255),
    data_conciliacao DATE,
    total_vendas NUMERIC,
    total_recebimentos NUMERIC,
    status VARCHAR(20),
    diferenca NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.periodo,
        m.nome,
        c.data_conciliacao,
        c.total_vendas,
        c.total_recebimentos,
        c.status,
        ABS(c.total_vendas - c.total_recebimentos) as diferenca
    FROM conciliacoes_maquininha c
    INNER JOIN maquininhas m ON c.maquininha_id = m.id
    ORDER BY c.data_conciliacao DESC, c.created_at DESC
    LIMIT limite;
END;
$function$;

-- Função para obter relatório de taxas por operadora
CREATE OR REPLACE FUNCTION public.obter_relatorio_taxas_operadora(
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS TABLE(
    operadora VARCHAR(20),
    nome_operadora VARCHAR(50),
    total_transacoes BIGINT,
    total_taxas NUMERIC,
    fornecedor_id INTEGER,
    banco_vinculado INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        m.operadora,
        CASE m.operadora 
            WHEN 'rede' THEN 'Rede'
            WHEN 'sipag' THEN 'Sipag'
            ELSE m.operadora
        END,
        COUNT(vm.id)::BIGINT,
        COALESCE(SUM(vm.valor_taxa), 0),
        0, -- Placeholder para fornecedor_id
        m.banco_id
    FROM maquininhas m
    LEFT JOIN vendas_maquininha vm ON m.id = vm.maquininha_id
        AND vm.data_venda BETWEEN p_data_inicio AND p_data_fim
    WHERE m.ativo = true
    GROUP BY m.operadora, m.banco_id
    ORDER BY total_taxas DESC;
END;
$function$;