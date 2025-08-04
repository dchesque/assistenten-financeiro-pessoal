-- ==========================================
-- MÓDULO VENDEDORES - MIGRATION COMPLETA
-- ==========================================

-- 1. CRIAÇÃO DA TABELA VENDEDORES
CREATE TABLE public.vendedores (
  id SERIAL PRIMARY KEY,
  
  -- Dados Pessoais
  nome VARCHAR(255) NOT NULL,
  documento VARCHAR(20) NOT NULL,
  tipo_documento VARCHAR(10) DEFAULT 'CPF',
  email VARCHAR(255),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  data_nascimento DATE,
  
  -- Dados Profissionais
  codigo_vendedor VARCHAR(20) NOT NULL,
  data_admissao DATE DEFAULT CURRENT_DATE,
  data_demissao DATE,
  cargo VARCHAR(100) DEFAULT 'Vendedor',
  departamento VARCHAR(100) DEFAULT 'Vendas',
  
  -- Sistema de Comissão
  tipo_comissao VARCHAR(20) DEFAULT 'percentual' CHECK (tipo_comissao IN ('percentual', 'valor_fixo', 'hibrido')),
  percentual_comissao NUMERIC(5,2) DEFAULT 5.00,
  valor_fixo_comissao NUMERIC(15,2) DEFAULT 0,
  meta_mensal NUMERIC(15,2) DEFAULT 0,
  
  -- Controles de Acesso
  pode_dar_desconto BOOLEAN DEFAULT false,
  desconto_maximo NUMERIC(5,2) DEFAULT 0,
  acesso_sistema BOOLEAN DEFAULT false,
  nivel_acesso VARCHAR(20) DEFAULT 'vendedor' CHECK (nivel_acesso IN ('vendedor', 'supervisor', 'gerente')),
  
  -- Endereço
  cep VARCHAR(9),
  logradouro TEXT,
  numero VARCHAR(10),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  
  -- Estatísticas Calculadas
  total_vendas INTEGER DEFAULT 0,
  valor_total_vendido NUMERIC(15,2) DEFAULT 0,
  comissao_total_recebida NUMERIC(15,2) DEFAULT 0,
  ticket_medio NUMERIC(15,2) DEFAULT 0,
  melhor_mes_vendas NUMERIC(15,2) DEFAULT 0,
  data_ultima_venda DATE,
  ranking_atual INTEGER DEFAULT 0,
  
  -- Status e Auditoria
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'afastado', 'demitido')),
  foto_url TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_vendedores_codigo ON public.vendedores(codigo_vendedor);
CREATE INDEX idx_vendedores_documento ON public.vendedores(documento);
CREATE INDEX idx_vendedores_status ON public.vendedores(status);
CREATE INDEX idx_vendedores_ranking ON public.vendedores(ranking_atual);
CREATE INDEX idx_vendedores_user_id ON public.vendedores(user_id);
CREATE INDEX idx_vendedores_ativo ON public.vendedores(ativo);
CREATE INDEX idx_vendedores_nome ON public.vendedores(nome);
CREATE INDEX idx_vendedores_email ON public.vendedores(email);

-- 3. CONSTRAINTS ÚNICOS
ALTER TABLE public.vendedores ADD CONSTRAINT unique_documento_vendedor UNIQUE (documento, user_id);
ALTER TABLE public.vendedores ADD CONSTRAINT unique_email_vendedor UNIQUE (email, user_id);
ALTER TABLE public.vendedores ADD CONSTRAINT unique_codigo_vendedor UNIQUE (codigo_vendedor, user_id);

-- 4. INTEGRAÇÃO COM VENDAS - Adicionar FK na tabela vendas
ALTER TABLE public.vendas ADD COLUMN vendedor_id INTEGER REFERENCES public.vendedores(id);
CREATE INDEX idx_vendas_vendedor_id ON public.vendas(vendedor_id);

-- 5. FUNÇÕES SQL AUTOMATIZADAS

-- Função 1: Atualizar Estatísticas do Vendedor
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_vendedor(p_vendedor_id INTEGER)
RETURNS VOID AS $$
DECLARE
    vendedor_stats RECORD;
BEGIN
    -- Calcular estatísticas do vendedor
    SELECT 
        COUNT(*) as total_vendas,
        COALESCE(SUM(valor_final), 0) as valor_total_vendido,
        COALESCE(SUM(comissao_valor), 0) as comissao_total,
        CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(valor_final), 0) / COUNT(*) ELSE 0 END as ticket_medio,
        MAX(data_venda) as data_ultima_venda
    INTO vendedor_stats
    FROM public.vendas 
    WHERE vendedor_id = p_vendedor_id AND ativo = true;
    
    -- Calcular melhor mês de vendas
    DECLARE
        melhor_mes NUMERIC := 0;
    BEGIN
        SELECT COALESCE(MAX(valor_mensal), 0) INTO melhor_mes
        FROM (
            SELECT SUM(valor_final) as valor_mensal
            FROM public.vendas
            WHERE vendedor_id = p_vendedor_id AND ativo = true
            GROUP BY EXTRACT(YEAR FROM data_venda), EXTRACT(MONTH FROM data_venda)
        ) meses;
        
        -- Atualizar vendedor
        UPDATE public.vendedores SET
            total_vendas = vendedor_stats.total_vendas,
            valor_total_vendido = vendedor_stats.valor_total_vendido,
            comissao_total_recebida = vendedor_stats.comissao_total,
            ticket_medio = vendedor_stats.ticket_medio,
            melhor_mes_vendas = melhor_mes,
            data_ultima_venda = vendedor_stats.data_ultima_venda,
            updated_at = now()
        WHERE id = p_vendedor_id;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função 2: Atualizar Ranking de Vendedores
CREATE OR REPLACE FUNCTION public.atualizar_ranking_vendedores()
RETURNS VOID AS $$
BEGIN
    -- Atualizar ranking baseado no valor vendido do mês atual, particionado por user_id
    WITH ranking_mensal AS (
        SELECT 
            v.id,
            v.user_id,
            COALESCE(SUM(vd.valor_final), 0) as vendas_mes,
            ROW_NUMBER() OVER (
                PARTITION BY v.user_id 
                ORDER BY COALESCE(SUM(vd.valor_final), 0) DESC
            ) as ranking_pos
        FROM public.vendedores v
        LEFT JOIN public.vendas vd ON v.id = vd.vendedor_id 
            AND EXTRACT(YEAR FROM vd.data_venda) = EXTRACT(YEAR FROM CURRENT_DATE)
            AND EXTRACT(MONTH FROM vd.data_venda) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND vd.ativo = true
        WHERE v.ativo = true
        GROUP BY v.id, v.user_id
    )
    UPDATE public.vendedores 
    SET ranking_atual = ranking_mensal.ranking_pos
    FROM ranking_mensal 
    WHERE vendedores.id = ranking_mensal.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função 3: Gerar Próximo Código de Vendedor
CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_vendedor(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    proximo_numero INTEGER;
    codigo_gerado TEXT;
BEGIN
    -- Buscar o maior número existente para o usuário
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(codigo_vendedor FROM 4) AS INTEGER)
    ), 0) + 1
    INTO proximo_numero
    FROM public.vendedores 
    WHERE user_id = p_user_id 
    AND codigo_vendedor ~ '^VEN[0-9]+$';
    
    -- Gerar código no formato VEN001, VEN002, etc.
    codigo_gerado := 'VEN' || LPAD(proximo_numero::TEXT, 3, '0');
    
    RETURN codigo_gerado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função 4: Performance Analytics de Vendedor
CREATE OR REPLACE FUNCTION public.obter_performance_vendedor(
    p_vendedor_id INTEGER,
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS TABLE(
    vendedor_nome VARCHAR,
    periodo TEXT,
    total_vendas BIGINT,
    valor_total NUMERIC,
    meta_periodo NUMERIC,
    percentual_meta NUMERIC,
    comissao_periodo NUMERIC,
    ticket_medio NUMERIC,
    ranking_posicao INTEGER,
    vendas_por_dia JSONB
) AS $$
DECLARE
    vendedor_info RECORD;
    dias_periodo INTEGER;
BEGIN
    -- Buscar informações do vendedor
    SELECT nome, meta_mensal, ranking_atual
    INTO vendedor_info
    FROM public.vendedores
    WHERE id = p_vendedor_id;
    
    -- Calcular dias no período
    SELECT (p_data_fim - p_data_inicio + 1) INTO dias_periodo;
    
    RETURN QUERY
    SELECT 
        vendedor_info.nome,
        p_data_inicio::TEXT || ' a ' || p_data_fim::TEXT,
        COUNT(v.id)::BIGINT,
        COALESCE(SUM(v.valor_final), 0),
        vendedor_info.meta_mensal,
        CASE 
            WHEN vendedor_info.meta_mensal > 0 
            THEN ROUND((COALESCE(SUM(v.valor_final), 0) / vendedor_info.meta_mensal) * 100, 2)
            ELSE 0 
        END,
        COALESCE(SUM(v.comissao_valor), 0),
        CASE 
            WHEN COUNT(v.id) > 0 
            THEN COALESCE(SUM(v.valor_final), 0) / COUNT(v.id)
            ELSE 0 
        END,
        vendedor_info.ranking_atual,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'data', data_venda,
                    'vendas', count(*),
                    'valor', sum(valor_final)
                ) ORDER BY data_venda
            )
            FROM public.vendas
            WHERE vendedor_id = p_vendedor_id
            AND data_venda BETWEEN p_data_inicio AND p_data_fim
            AND ativo = true
            GROUP BY data_venda
        )
    FROM public.vendas v
    WHERE v.vendedor_id = p_vendedor_id
    AND v.data_venda BETWEEN p_data_inicio AND p_data_fim
    AND v.ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função 5: Ranking Geral de Vendedores
CREATE OR REPLACE FUNCTION public.obter_ranking_vendedores(
    p_periodo VARCHAR,
    p_user_id UUID
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
) AS $$
DECLARE
    data_inicio DATE;
    data_fim DATE;
BEGIN
    -- Definir período baseado no parâmetro
    CASE p_periodo
        WHEN 'mes_atual' THEN
            data_inicio := DATE_TRUNC('month', CURRENT_DATE);
            data_fim := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
        WHEN 'mes_anterior' THEN
            data_inicio := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month';
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
    WITH vendedor_stats AS (
        SELECT 
            vend.id,
            vend.nome,
            vend.codigo_vendedor,
            vend.meta_mensal,
            vend.foto_url,
            COUNT(v.id) as total_vendas_count,
            COALESCE(SUM(v.valor_final), 0) as valor_total,
            ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(v.valor_final), 0) DESC) as posicao
        FROM public.vendedores vend
        LEFT JOIN public.vendas v ON vend.id = v.vendedor_id 
            AND v.data_venda BETWEEN data_inicio AND data_fim
            AND v.ativo = true
        WHERE vend.user_id = p_user_id AND vend.ativo = true
        GROUP BY vend.id, vend.nome, vend.codigo_vendedor, vend.meta_mensal, vend.foto_url
    )
    SELECT 
        vs.id,
        vs.nome,
        vs.codigo_vendedor,
        vs.total_vendas_count,
        vs.valor_total,
        vs.meta_mensal,
        CASE 
            WHEN vs.meta_mensal > 0 
            THEN ROUND((vs.valor_total / vs.meta_mensal) * 100, 2)
            ELSE 0 
        END,
        vs.posicao::INTEGER,
        vs.foto_url
    FROM vendedor_stats vs
    ORDER BY vs.valor_total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGERS AUTOMÁTICOS

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_vendedores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendedores_updated_at
    BEFORE UPDATE ON public.vendedores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_vendedores_updated_at();

-- Trigger para atualizar estatísticas quando vendas são modificadas
CREATE OR REPLACE FUNCTION public.trigger_vendedor_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT e UPDATE de vendas com vendedor
    IF TG_OP = 'INSERT' AND NEW.vendedor_id IS NOT NULL THEN
        PERFORM public.atualizar_estatisticas_vendedor(NEW.vendedor_id);
        PERFORM public.atualizar_ranking_vendedores();
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Atualizar vendedor antigo se mudou
        IF OLD.vendedor_id IS NOT NULL AND OLD.vendedor_id != COALESCE(NEW.vendedor_id, -1) THEN
            PERFORM public.atualizar_estatisticas_vendedor(OLD.vendedor_id);
        END IF;
        
        -- Atualizar vendedor novo
        IF NEW.vendedor_id IS NOT NULL THEN
            PERFORM public.atualizar_estatisticas_vendedor(NEW.vendedor_id);
        END IF;
        
        PERFORM public.atualizar_ranking_vendedores();
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' AND OLD.vendedor_id IS NOT NULL THEN
        PERFORM public.atualizar_estatisticas_vendedor(OLD.vendedor_id);
        PERFORM public.atualizar_ranking_vendedores();
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_vendedor_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_vendedor_stats();

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.vendedores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para vendedores
CREATE POLICY "Usuários só veem seus vendedores" 
ON public.vendedores FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários só inserem seus vendedores" 
ON public.vendedores FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários só atualizam seus vendedores" 
ON public.vendedores FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários só excluem seus vendedores" 
ON public.vendedores FOR DELETE 
USING (auth.uid() = user_id);

-- 8. DADOS INICIAIS (OPCIONAL)
-- Comentado para não inserir dados de teste
-- INSERT INTO public.vendedores (nome, documento, codigo_vendedor, email, user_id) 
-- VALUES ('Vendedor Exemplo', '12345678901', 'VEN001', 'vendedor@exemplo.com', auth.uid());