-- ====================================================================
-- FASE 1: CORREÇÃO COMPLETA DO MÓDULO PLANO DE CONTAS
-- ====================================================================

-- 1. Primeiro, vamos adicionar campos ausentes na tabela plano_contas
ALTER TABLE public.plano_contas 
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS total_contas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_total NUMERIC(15,2) DEFAULT 0;

-- 2. Atualizar triggers existentes para corrigir search_path (segurança)
DROP TRIGGER IF EXISTS trigger_calcular_nivel_plano_contas ON public.plano_contas;
DROP TRIGGER IF EXISTS trigger_validar_hierarquia_plano_contas ON public.plano_contas;
DROP TRIGGER IF EXISTS trigger_atualizar_totais_plano_contas ON public.plano_contas;

-- 3. Recriar função para calcular nível com search_path seguro
CREATE OR REPLACE FUNCTION public.calcular_nivel_plano_contas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.plano_pai_id IS NULL THEN
        NEW.nivel = 1;
    ELSE
        SELECT nivel + 1 INTO NEW.nivel
        FROM public.plano_contas 
        WHERE id = NEW.plano_pai_id;
        
        -- Se não encontrou o pai, definir como nível 1
        IF NEW.nivel IS NULL THEN
            NEW.nivel = 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 4. Recriar função para validar hierarquia com search_path seguro
CREATE OR REPLACE FUNCTION public.validar_hierarquia_plano_contas()
RETURNS TRIGGER AS $$
DECLARE
    pai_aceita_lancamento BOOLEAN;
BEGIN
    -- Se não tem pai, pode continuar
    IF NEW.plano_pai_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Verificar se o pai aceita lançamento
    SELECT aceita_lancamento INTO pai_aceita_lancamento
    FROM public.plano_contas 
    WHERE id = NEW.plano_pai_id;
    
    -- Se o pai aceita lançamento, ele deve ser sintético (não aceita mais)
    IF pai_aceita_lancamento = TRUE THEN
        UPDATE public.plano_contas 
        SET aceita_lancamento = FALSE 
        WHERE id = NEW.plano_pai_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 5. Função para atualizar totais dos pais com search_path seguro
CREATE OR REPLACE FUNCTION public.atualizar_totais_plano_pai(plano_id BIGINT)
RETURNS VOID AS $$
DECLARE
    conta_atual RECORD;
    pai_id BIGINT;
BEGIN
    -- Buscar informações da conta atual
    SELECT * INTO conta_atual 
    FROM public.plano_contas 
    WHERE id = plano_id;
    
    -- Se não encontrou a conta, sair
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    pai_id := conta_atual.plano_pai_id;
    
    -- Atualizar totais de todos os pais na hierarquia
    WHILE pai_id IS NOT NULL LOOP
        UPDATE public.plano_contas SET
            total_contas = (
                SELECT COUNT(*)
                FROM public.plano_contas filhas
                WHERE filhas.plano_pai_id = pai_id AND filhas.ativo = TRUE
            ),
            valor_total = (
                SELECT COALESCE(SUM(pc.valor_total), 0)
                FROM public.plano_contas pc
                WHERE pc.plano_pai_id = pai_id AND pc.ativo = TRUE
            ) + (
                SELECT COALESCE(SUM(cp.valor_final), 0)
                FROM public.contas_pagar cp
                WHERE cp.plano_conta_id = pai_id
            ),
            updated_at = NOW()
        WHERE id = pai_id;
        
        -- Subir para o próximo nível
        SELECT plano_pai_id INTO pai_id 
        FROM public.plano_contas 
        WHERE id = pai_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 6. Função trigger para atualizar totais com search_path seguro
CREATE OR REPLACE FUNCTION public.trigger_atualizar_totais_plano_pai()
RETURNS TRIGGER AS $$
BEGIN
    -- Para INSERT e UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.atualizar_totais_plano_pai(NEW.id);
        IF NEW.plano_pai_id IS NOT NULL THEN
            PERFORM public.atualizar_totais_plano_pai(NEW.plano_pai_id);
        END IF;
        RETURN NEW;
    END IF;
    
    -- Para DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.plano_pai_id IS NOT NULL THEN
            PERFORM public.atualizar_totais_plano_pai(OLD.plano_pai_id);
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 7. Função para gerar próximo código com search_path seguro
CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_plano_contas(pai_id BIGINT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    ultimo_codigo TEXT;
    proximo_numero INTEGER;
    codigo_pai TEXT;
BEGIN
    -- Se não tem pai, é conta de nível 1
    IF pai_id IS NULL THEN
        SELECT MAX(CAST(SPLIT_PART(codigo, '.', 1) AS INTEGER))
        INTO proximo_numero
        FROM public.plano_contas
        WHERE plano_pai_id IS NULL;
        
        RETURN COALESCE(proximo_numero + 1, 1)::TEXT;
    END IF;
    
    -- Buscar código do pai
    SELECT codigo INTO codigo_pai
    FROM public.plano_contas
    WHERE id = pai_id;
    
    -- Buscar último código filho
    SELECT MAX(CAST(SPLIT_PART(codigo, '.', -1) AS INTEGER))
    INTO proximo_numero
    FROM public.plano_contas
    WHERE plano_pai_id = pai_id;
    
    RETURN codigo_pai || '.' || LPAD((COALESCE(proximo_numero, 0) + 1)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 8. Função para buscar hierarquia com search_path seguro
CREATE OR REPLACE FUNCTION public.buscar_hierarquia_plano_contas(conta_id BIGINT)
RETURNS TEXT AS $$
DECLARE
    resultado TEXT := '';
    conta_atual RECORD;
BEGIN
    -- Buscar conta atual
    SELECT * INTO conta_atual
    FROM public.plano_contas
    WHERE id = conta_id;
    
    IF NOT FOUND THEN
        RETURN '';
    END IF;
    
    resultado := conta_atual.nome;
    
    -- Subir na hierarquia
    WHILE conta_atual.plano_pai_id IS NOT NULL LOOP
        SELECT * INTO conta_atual
        FROM public.plano_contas
        WHERE id = conta_atual.plano_pai_id;
        
        resultado := conta_atual.nome || ' > ' || resultado;
    END LOOP;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 9. Recriar triggers
CREATE TRIGGER trigger_calcular_nivel_plano_contas
    BEFORE INSERT OR UPDATE ON public.plano_contas
    FOR EACH ROW
    EXECUTE FUNCTION public.calcular_nivel_plano_contas();

CREATE TRIGGER trigger_validar_hierarquia_plano_contas
    BEFORE INSERT OR UPDATE ON public.plano_contas
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_hierarquia_plano_contas();

CREATE TRIGGER trigger_atualizar_totais_plano_contas
    AFTER INSERT OR UPDATE OR DELETE ON public.plano_contas
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_atualizar_totais_plano_pai();

-- 10. Atualizar dados existentes
UPDATE public.plano_contas 
SET total_contas = 0, valor_total = 0 
WHERE total_contas IS NULL OR valor_total IS NULL;

-- 11. Calcular totais para contas existentes
DO $$
DECLARE
    conta RECORD;
BEGIN
    FOR conta IN SELECT id FROM public.plano_contas WHERE nivel = (SELECT MAX(nivel) FROM public.plano_contas) LOOP
        PERFORM public.atualizar_totais_plano_pai(conta.id);
    END LOOP;
END $$;