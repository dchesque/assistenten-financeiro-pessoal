-- ============================================================
-- PLANO DE CORREÇÕES CRÍTICAS - IMPLEMENTAÇÃO PRIORITÁRIA
-- ============================================================

-- 1. CORREÇÃO DE STATUS DE CHEQUES
-- Ajustar status de cheques para padronização
UPDATE cheques 
SET status = 'pendente' 
WHERE status = 'emitido';

-- 2. CORREÇÃO DE CAMPOS OBRIGATÓRIOS NA TABELA CHEQUES
-- Adicionar campos ausentes para compatibilidade completa
ALTER TABLE cheques 
ADD COLUMN IF NOT EXISTS tipo_beneficiario VARCHAR(20) DEFAULT 'outros',
ADD COLUMN IF NOT EXISTS fornecedor_id INTEGER,
ADD COLUMN IF NOT EXISTS finalidade TEXT,
ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
ADD COLUMN IF NOT EXISTS motivo_devolucao TEXT,
ADD COLUMN IF NOT EXISTS data_compensacao DATE;

-- 3. TRIGGER PARA ATUALIZAR DATA DE COMPENSAÇÃO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION atualizar_data_compensacao_cheque()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar data de compensação quando status for 'compensado'
    IF NEW.status = 'compensado' AND OLD.status != 'compensado' THEN
        NEW.data_compensacao = CURRENT_DATE;
    END IF;
    
    -- Limpar data de compensação se status não for mais 'compensado'
    IF NEW.status != 'compensado' AND OLD.status = 'compensado' THEN
        NEW.data_compensacao = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_atualizar_data_compensacao_cheque ON cheques;
CREATE TRIGGER trigger_atualizar_data_compensacao_cheque
    BEFORE UPDATE ON cheques
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_data_compensacao_cheque();

-- 4. INTEGRAÇÃO DRE - CRIAR TABELA DE DADOS ESSENCIAIS
CREATE TABLE IF NOT EXISTS dados_essenciais_dre (
    id SERIAL PRIMARY KEY,
    mes_referencia VARCHAR(7) NOT NULL, -- YYYY-MM
    cmv_valor NUMERIC(15,2) NOT NULL DEFAULT 0,
    deducoes_receita NUMERIC(15,2) DEFAULT 0,
    percentual_impostos NUMERIC(5,2) DEFAULT 8.5,
    percentual_devolucoes NUMERIC(5,2) DEFAULT 1.5,
    estoque_inicial_qtd INTEGER DEFAULT 0,
    estoque_inicial_valor NUMERIC(15,2) DEFAULT 0,
    estoque_final_qtd INTEGER DEFAULT 0,
    estoque_final_valor NUMERIC(15,2) DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mes_referencia)
);

-- 5. POLÍTICAS RLS PARA DADOS ESSENCIAIS DRE
ALTER TABLE dados_essenciais_dre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver dados essenciais DRE"
ON dados_essenciais_dre FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir dados essenciais DRE"
ON dados_essenciais_dre FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar dados essenciais DRE"
ON dados_essenciais_dre FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem excluir dados essenciais DRE"
ON dados_essenciais_dre FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 6. FUNÇÃO PARA CALCULAR DRE INTEGRADO
CREATE OR REPLACE FUNCTION gerar_dre_integrado(
    p_mes_referencia VARCHAR(7)
) RETURNS TABLE(
    item_codigo VARCHAR,
    item_nome TEXT,
    item_valor NUMERIC,
    item_nivel INTEGER,
    item_tipo VARCHAR,
    item_categoria VARCHAR
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    receita_bruta NUMERIC := 0;
    deducoes NUMERIC := 0;
    receita_liquida NUMERIC := 0;
    cmv NUMERIC := 0;
    lucro_bruto NUMERIC := 0;
    dados_essenciais RECORD;
    ano_ref INTEGER;
    mes_ref INTEGER;
BEGIN
    -- Extrair ano e mês
    ano_ref := CAST(SPLIT_PART(p_mes_referencia, '-', 1) AS INTEGER);
    mes_ref := CAST(SPLIT_PART(p_mes_referencia, '-', 2) AS INTEGER);
    
    -- Buscar dados essenciais
    SELECT * INTO dados_essenciais
    FROM dados_essenciais_dre
    WHERE mes_referencia = p_mes_referencia;
    
    -- 1. RECEITA OPERACIONAL BRUTA (vendas do período)
    SELECT COALESCE(SUM(valor_final), 0) INTO receita_bruta
    FROM vendas
    WHERE EXTRACT(YEAR FROM data_venda) = ano_ref
    AND EXTRACT(MONTH FROM data_venda) = mes_ref
    AND ativo = true;
    
    RETURN QUERY SELECT '1'::VARCHAR, 'RECEITA OPERACIONAL BRUTA'::TEXT, receita_bruta, 0, 'total'::VARCHAR, 'receita'::VARCHAR;
    
    -- 2. DEDUÇÕES DA RECEITA
    deducoes := CASE 
        WHEN dados_essenciais.deducoes_receita IS NOT NULL THEN dados_essenciais.deducoes_receita
        ELSE receita_bruta * -((COALESCE(dados_essenciais.percentual_impostos, 8.5) + COALESCE(dados_essenciais.percentual_devolucoes, 1.5)) / 100)
    END;
    
    RETURN QUERY SELECT '2'::VARCHAR, '(-) DEDUÇÕES DA RECEITA'::TEXT, deducoes, 0, 'total'::VARCHAR, 'deducao'::VARCHAR;
    
    -- 3. RECEITA LÍQUIDA
    receita_liquida := receita_bruta + deducoes; -- deducoes já é negativo
    RETURN QUERY SELECT '3'::VARCHAR, 'RECEITA LÍQUIDA'::TEXT, receita_liquida, 0, 'subtotal'::VARCHAR, 'subtotal'::VARCHAR;
    
    -- 4. CMV (Custo das Mercadorias Vendidas)
    cmv := COALESCE(dados_essenciais.cmv_valor, 0);
    IF cmv = 0 THEN
        -- Estimar CMV como 60% da receita líquida se não informado
        cmv := receita_liquida * 0.60;
    END IF;
    
    RETURN QUERY SELECT '4'::VARCHAR, '(-) CUSTO DAS MERCADORIAS VENDIDAS'::TEXT, -cmv, 0, 'total'::VARCHAR, 'custo'::VARCHAR;
    
    -- 5. LUCRO BRUTO
    lucro_bruto := receita_liquida - cmv;
    RETURN QUERY SELECT '5'::VARCHAR, 'LUCRO BRUTO'::TEXT, lucro_bruto, 0, 'subtotal'::VARCHAR, 'subtotal'::VARCHAR;
    
    -- 6. DESPESAS OPERACIONAIS (contas a pagar do período)
    RETURN QUERY 
    SELECT 
        '6'::VARCHAR,
        '(-) DESPESAS OPERACIONAIS'::TEXT,
        -COALESCE(SUM(cp.valor_final), 0),
        0,
        'total'::VARCHAR,
        'despesa'::VARCHAR
    FROM contas_pagar cp
    WHERE EXTRACT(YEAR FROM cp.data_vencimento) = ano_ref
    AND EXTRACT(MONTH FROM cp.data_vencimento) = mes_ref;
    
    -- 7. LUCRO/PREJUÍZO OPERACIONAL
    RETURN QUERY 
    SELECT 
        '7'::VARCHAR,
        'LUCRO/PREJUÍZO OPERACIONAL'::TEXT,
        lucro_bruto - COALESCE((
            SELECT SUM(cp.valor_final)
            FROM contas_pagar cp
            WHERE EXTRACT(YEAR FROM cp.data_vencimento) = ano_ref
            AND EXTRACT(MONTH FROM cp.data_vencimento) = mes_ref
        ), 0),
        0,
        'total'::VARCHAR,
        'resultado'::VARCHAR;
END;
$$;

-- 7. ATUALIZAR TRIGGERS EXISTENTES PARA COMPATIBILIDADE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em dados_essenciais_dre
CREATE TRIGGER update_dados_essenciais_dre_updated_at
    BEFORE UPDATE ON dados_essenciais_dre
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
CREATE INDEX IF NOT EXISTS idx_cheques_banco_id ON cheques(banco_id);
CREATE INDEX IF NOT EXISTS idx_cheques_data_emissao ON cheques(data_emissao);
CREATE INDEX IF NOT EXISTS idx_dados_essenciais_dre_mes ON dados_essenciais_dre(mes_referencia);

-- 9. FUNÇÃO PARA ESTATÍSTICAS DE CHEQUES OTIMIZADA
CREATE OR REPLACE FUNCTION obter_estatisticas_cheques()
RETURNS TABLE(
    total_cheques BIGINT,
    total_valor NUMERIC,
    pendentes_quantidade BIGINT,
    pendentes_valor NUMERIC,
    compensados_quantidade BIGINT,
    compensados_valor NUMERIC,
    devolvidos_quantidade BIGINT,
    devolvidos_valor NUMERIC,
    cancelados_quantidade BIGINT,
    cancelados_valor NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_cheques,
        COALESCE(SUM(valor), 0) as total_valor,
        COUNT(*) FILTER (WHERE status = 'pendente') as pendentes_quantidade,
        COALESCE(SUM(valor) FILTER (WHERE status = 'pendente'), 0) as pendentes_valor,
        COUNT(*) FILTER (WHERE status = 'compensado') as compensados_quantidade,
        COALESCE(SUM(valor) FILTER (WHERE status = 'compensado'), 0) as compensados_valor,
        COUNT(*) FILTER (WHERE status = 'devolvido') as devolvidos_quantidade,
        COALESCE(SUM(valor) FILTER (WHERE status = 'devolvido'), 0) as devolvidos_valor,
        COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados_quantidade,
        COALESCE(SUM(valor) FILTER (WHERE status = 'cancelado'), 0) as cancelados_valor
    FROM cheques;
END;
$$;