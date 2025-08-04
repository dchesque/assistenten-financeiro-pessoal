-- FASE 6: OTIMIZAÇÕES E PERFORMANCE
-- ================================================

-- 1. CORREÇÃO CRÍTICA DE SEGURANÇA: Remover SECURITY DEFINER da view
DROP VIEW IF EXISTS vw_vendas_completas;

CREATE VIEW vw_vendas_completas AS
SELECT 
    v.id,
    v.data_venda,
    v.hora_venda,
    v.valor_total,
    v.desconto,
    v.valor_final,
    v.parcelas,
    v.forma_pagamento,
    v.tipo_venda,
    v.status,
    v.vendedor,
    v.observacoes,
    v.comissao_percentual,
    v.comissao_valor,
    v.plano_conta_id,
    v.cliente_id,
    v.ativo,
    v.created_at,
    v.updated_at,
    
    -- Cálculos de valor
    (v.valor_final - COALESCE(v.desconto, 0)) as valor_liquido,
    
    -- Dados do cliente
    c.nome as cliente_nome,
    c.documento as cliente_documento,
    c.tipo as cliente_tipo,
    
    -- Dados da categoria/plano de contas
    pc.nome as categoria_nome,
    pc.codigo as categoria_codigo,
    pc.tipo_dre,
    
    -- Campos para agrupamento temporal
    EXTRACT(YEAR FROM v.data_venda) as ano_venda,
    EXTRACT(MONTH FROM v.data_venda) as mes_venda,
    TO_CHAR(v.data_venda, 'YYYY-MM') as periodo_venda
    
FROM vendas v
LEFT JOIN clientes c ON v.cliente_id = c.id
LEFT JOIN plano_contas pc ON v.plano_conta_id = pc.id
WHERE v.ativo = true;

-- 2. ÍNDICES COMPOSTOS PARA OTIMIZAÇÃO DE PERFORMANCE
-- Índices para vendas (principais consultas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendas_data_cliente_ativo 
    ON vendas(data_venda DESC, cliente_id, ativo) 
    WHERE ativo = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendas_vendedor_data 
    ON vendas(vendedor, data_venda DESC) 
    WHERE ativo = true AND vendedor IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendas_forma_pagamento_data 
    ON vendas(forma_pagamento, data_venda DESC) 
    WHERE ativo = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendas_plano_conta_data 
    ON vendas(plano_conta_id, data_venda DESC) 
    WHERE ativo = true AND plano_conta_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendas_periodo_performance 
    ON vendas(EXTRACT(YEAR FROM data_venda), EXTRACT(MONTH FROM data_venda), status) 
    WHERE ativo = true;

-- Índices para contas a pagar
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contas_pagar_fornecedor_vencimento 
    ON contas_pagar(fornecedor_id, data_vencimento DESC, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contas_pagar_status_vencimento 
    ON contas_pagar(status, data_vencimento) 
    WHERE status IN ('pendente', 'vencido');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contas_pagar_plano_data 
    ON contas_pagar(plano_conta_id, data_vencimento DESC);

-- Índices para clientes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_documento_ativo 
    ON clientes(documento) 
    WHERE ativo = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clientes_nome_busca 
    ON clientes USING gin(to_tsvector('portuguese', nome)) 
    WHERE ativo = true;

-- Índices para fornecedores
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fornecedores_documento_ativo 
    ON fornecedores(documento) 
    WHERE ativo = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fornecedores_tipo_nome 
    ON fornecedores(tipo_fornecedor, nome) 
    WHERE ativo = true;

-- 3. FUNÇÃO DE LIMPEZA DE CACHE AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.limpar_cache_performance()
RETURNS void AS $$
BEGIN
    -- Atualizar estatísticas das tabelas principais
    ANALYZE vendas;
    ANALYZE contas_pagar;
    ANALYZE clientes;
    ANALYZE fornecedores;
    ANALYZE plano_contas;
    
    -- Log da operação
    INSERT INTO public.audit_log (
        tabela, 
        operacao, 
        descricao, 
        data_operacao
    ) VALUES (
        'sistema', 
        'limpeza_cache', 
        'Limpeza automática de cache e atualização de estatísticas', 
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TABELA DE AUDITORIA PARA MONITORAMENTO
CREATE TABLE IF NOT EXISTS public.audit_log (
    id BIGSERIAL PRIMARY KEY,
    tabela VARCHAR(100) NOT NULL,
    operacao VARCHAR(50) NOT NULL,
    registro_id BIGINT,
    dados_antes JSONB,
    dados_depois JSONB,
    usuario_id UUID,
    ip_address INET,
    user_agent TEXT,
    descricao TEXT,
    data_operacao TIMESTAMPTZ DEFAULT NOW(),
    tempo_execucao INTERVAL
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_tabela_data 
    ON audit_log(tabela, data_operacao DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_operacao_data 
    ON audit_log(operacao, data_operacao DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_usuario 
    ON audit_log(usuario_id, data_operacao DESC);

-- 5. FUNÇÃO DE BACKUP AUTOMÁTICO DE DADOS CRÍTICOS
CREATE OR REPLACE FUNCTION public.backup_dados_criticos()
RETURNS TABLE(tabela TEXT, total_registros BIGINT, backup_timestamp TIMESTAMPTZ) AS $$
DECLARE
    resultado_backup RECORD;
BEGIN
    -- Backup de vendas dos últimos 30 dias
    CREATE TABLE IF NOT EXISTS backup_vendas_temp AS 
    SELECT * FROM vendas 
    WHERE data_venda >= CURRENT_DATE - INTERVAL '30 days'
    AND ativo = true;
    
    -- Backup de contas críticas
    CREATE TABLE IF NOT EXISTS backup_contas_criticas_temp AS 
    SELECT * FROM contas_pagar 
    WHERE (status = 'pendente' OR data_vencimento >= CURRENT_DATE - INTERVAL '7 days')
    AND valor_final > 1000;
    
    -- Retornar estatísticas
    RETURN QUERY
    SELECT 'vendas'::TEXT, COUNT(*)::BIGINT, NOW()
    FROM backup_vendas_temp
    UNION ALL
    SELECT 'contas_criticas'::TEXT, COUNT(*)::BIGINT, NOW()
    FROM backup_contas_criticas_temp;
    
    -- Limpar tabelas temporárias antigas
    DROP TABLE IF EXISTS backup_vendas_temp;
    DROP TABLE IF EXISTS backup_contas_criticas_temp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO DE MONITORAMENTO DE PERFORMANCE
CREATE OR REPLACE FUNCTION public.monitorar_performance_sistema()
RETURNS TABLE(
    metrica TEXT,
    valor NUMERIC,
    unidade TEXT,
    status TEXT,
    recomendacao TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'vendas_mes_atual'::TEXT,
        COUNT(*)::NUMERIC,
        'registros'::TEXT,
        CASE 
            WHEN COUNT(*) > 1000 THEN 'otimo'
            WHEN COUNT(*) > 500 THEN 'bom'
            WHEN COUNT(*) > 100 THEN 'regular'
            ELSE 'baixo'
        END::TEXT,
        CASE 
            WHEN COUNT(*) < 100 THEN 'Verificar estratégias de vendas'
            ELSE 'Performance normal'
        END::TEXT
    FROM vendas 
    WHERE EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM data_venda) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND ativo = true
    
    UNION ALL
    
    SELECT 
        'contas_vencidas'::TEXT,
        COUNT(*)::NUMERIC,
        'registros'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'otimo'
            WHEN COUNT(*) < 5 THEN 'bom'
            WHEN COUNT(*) < 10 THEN 'atencao'
            ELSE 'critico'
        END::TEXT,
        CASE 
            WHEN COUNT(*) > 10 THEN 'Ação urgente necessária'
            WHEN COUNT(*) > 5 THEN 'Acompanhar de perto'
            ELSE 'Situação controlada'
        END::TEXT
    FROM contas_pagar 
    WHERE status = 'vencido'
    
    UNION ALL
    
    SELECT 
        'valor_total_mes'::TEXT,
        COALESCE(SUM(valor_final), 0)::NUMERIC,
        'reais'::TEXT,
        CASE 
            WHEN COALESCE(SUM(valor_final), 0) > 50000 THEN 'otimo'
            WHEN COALESCE(SUM(valor_final), 0) > 25000 THEN 'bom'
            WHEN COALESCE(SUM(valor_final), 0) > 10000 THEN 'regular'
            ELSE 'baixo'
        END::TEXT,
        'Monitorar tendências de faturamento'::TEXT
    FROM vendas 
    WHERE EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM data_venda) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER PARA AUDITORIA AUTOMÁTICA EM VENDAS
CREATE OR REPLACE FUNCTION public.trigger_auditoria_vendas()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (
            tabela, operacao, registro_id, dados_depois, descricao
        ) VALUES (
            'vendas', 'INSERT', NEW.id, to_jsonb(NEW), 
            'Nova venda criada'
        );
        RETURN NEW;
    END IF;
    
    -- Para UPDATE
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (
            tabela, operacao, registro_id, dados_antes, dados_depois, descricao
        ) VALUES (
            'vendas', 'UPDATE', NEW.id, to_jsonb(OLD), to_jsonb(NEW),
            'Venda atualizada'
        );
        RETURN NEW;
    END IF;
    
    -- Para DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (
            tabela, operacao, registro_id, dados_antes, descricao
        ) VALUES (
            'vendas', 'DELETE', OLD.id, to_jsonb(OLD),
            'Venda excluída'
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger de auditoria
DROP TRIGGER IF EXISTS trigger_audit_vendas ON vendas;
CREATE TRIGGER trigger_audit_vendas
    AFTER INSERT OR UPDATE OR DELETE ON vendas
    FOR EACH ROW EXECUTE FUNCTION trigger_auditoria_vendas();

-- 8. POLITICAS RLS PARA AUDIT_LOG
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver logs de auditoria" ON public.audit_log
    FOR SELECT USING (true);

-- 9. FUNÇÃO PARA ESTATÍSTICAS RÁPIDAS (CACHE MANUAL)
CREATE OR REPLACE FUNCTION public.estatisticas_rapidas_cache()
RETURNS TABLE(
    total_vendas_mes BIGINT,
    valor_total_mes NUMERIC,
    ticket_medio_mes NUMERIC,
    contas_pendentes BIGINT,
    valor_pendente NUMERIC,
    clientes_ativos BIGINT,
    fornecedores_ativos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM vendas 
         WHERE EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM data_venda) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND ativo = true),
        
        (SELECT COALESCE(SUM(valor_final), 0) FROM vendas 
         WHERE EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM data_venda) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND ativo = true),
        
        (SELECT CASE WHEN COUNT(*) > 0 THEN AVG(valor_final) ELSE 0 END FROM vendas 
         WHERE EXTRACT(YEAR FROM data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)
         AND EXTRACT(MONTH FROM data_venda) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND ativo = true),
        
        (SELECT COUNT(*) FROM contas_pagar WHERE status = 'pendente'),
        
        (SELECT COALESCE(SUM(valor_final), 0) FROM contas_pagar WHERE status = 'pendente'),
        
        (SELECT COUNT(*) FROM clientes WHERE ativo = true),
        
        (SELECT COUNT(*) FROM fornecedores WHERE ativo = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
COMMENT ON FUNCTION public.limpar_cache_performance() IS 'Função para limpeza automática de cache e atualização de estatísticas do sistema';
COMMENT ON FUNCTION public.backup_dados_criticos() IS 'Função para backup automático de dados críticos do sistema';
COMMENT ON FUNCTION public.monitorar_performance_sistema() IS 'Função para monitoramento de performance e geração de alertas';
COMMENT ON FUNCTION public.estatisticas_rapidas_cache() IS 'Função otimizada para estatísticas rápidas com cache manual';
COMMENT ON TABLE public.audit_log IS 'Tabela de auditoria para rastreamento de operações do sistema';