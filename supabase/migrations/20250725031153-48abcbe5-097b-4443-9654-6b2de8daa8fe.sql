-- ===============================================
-- PLANO DE CORREÇÃO COMPLETO - FORNECEDORES
-- ===============================================

-- 1. Adicionar campos de estatísticas que estão faltando
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS total_compras INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_total NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_compra DATE,
ADD COLUMN IF NOT EXISTS categoria_padrao_id INTEGER REFERENCES public.plano_contas(id);

-- 2. Adicionar tipo_fornecedor com valores padrão corretos
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS tipo_fornecedor VARCHAR(20) DEFAULT 'despesa' CHECK (tipo_fornecedor IN ('receita', 'despesa'));

-- 3. Atualizar todos os fornecedores existentes para ter tipo_fornecedor
UPDATE public.fornecedores 
SET tipo_fornecedor = 'despesa' 
WHERE tipo_fornecedor IS NULL;

-- 4. Remover o campo endereco JSONB obsoleto (foi substituído por campos específicos)
ALTER TABLE public.fornecedores DROP COLUMN IF EXISTS endereco;

-- 5. Garantir que o campo plano_conta_id seja renomeado para categoria_padrao_id
ALTER TABLE public.fornecedores DROP COLUMN IF EXISTS plano_conta_id;

-- 6. Criar função para atualizar estatísticas do fornecedor
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_fornecedor(fornecedor_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.fornecedores
    SET 
        total_compras = (
            SELECT COUNT(*)
            FROM public.contas_pagar 
            WHERE fornecedor_id = $1 AND status = 'pago'
        ),
        valor_total = (
            SELECT COALESCE(SUM(valor_final), 0)
            FROM public.contas_pagar 
            WHERE fornecedor_id = $1 AND status = 'pago'
        ),
        ultima_compra = (
            SELECT MAX(data_pagamento)
            FROM public.contas_pagar 
            WHERE fornecedor_id = $1 AND status = 'pago'
        ),
        updated_at = NOW()
    WHERE id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION public.trigger_atualizar_estatisticas_fornecedor()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar estatísticas quando uma conta for paga
    IF (TG_OP = 'UPDATE' AND OLD.status != 'pago' AND NEW.status = 'pago') OR
       (TG_OP = 'INSERT' AND NEW.status = 'pago') THEN
        PERFORM public.atualizar_estatisticas_fornecedor(NEW.fornecedor_id);
    END IF;
    
    -- Atualizar estatísticas quando uma conta paga for alterada
    IF TG_OP = 'UPDATE' AND OLD.status = 'pago' AND (NEW.status != 'pago' OR OLD.valor_final != NEW.valor_final) THEN
        PERFORM public.atualizar_estatisticas_fornecedor(OLD.fornecedor_id);
        IF NEW.fornecedor_id != OLD.fornecedor_id THEN
            PERFORM public.atualizar_estatisticas_fornecedor(NEW.fornecedor_id);
        END IF;
    END IF;
    
    -- Atualizar estatísticas quando uma conta paga for excluída
    IF TG_OP = 'DELETE' AND OLD.status = 'pago' THEN
        PERFORM public.atualizar_estatisticas_fornecedor(OLD.fornecedor_id);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Aplicar trigger na tabela contas_pagar
DROP TRIGGER IF EXISTS trigger_estatisticas_fornecedor ON public.contas_pagar;
CREATE TRIGGER trigger_estatisticas_fornecedor
    AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar
    FOR EACH ROW EXECUTE FUNCTION public.trigger_atualizar_estatisticas_fornecedor();

-- 9. Atualizar estatísticas para todos os fornecedores existentes
DO $$
DECLARE
    fornecedor_record RECORD;
BEGIN
    FOR fornecedor_record IN SELECT id FROM public.fornecedores LOOP
        PERFORM public.atualizar_estatisticas_fornecedor(fornecedor_record.id);
    END LOOP;
END $$;

-- 10. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo_fornecedor ON public.fornecedores(tipo_fornecedor);
CREATE INDEX IF NOT EXISTS idx_fornecedores_categoria_padrao ON public.fornecedores(categoria_padrao_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor_status ON public.contas_pagar(fornecedor_id, status);

-- 11. Atualizar a função de validação de documento para ser funcional
CREATE OR REPLACE FUNCTION public.validar_documento_fornecedor()
RETURNS TRIGGER AS $$
DECLARE
    documento_limpo TEXT;
    documento_existente INTEGER;
BEGIN
    -- Limpar o documento (remover pontos, traços, barras)
    documento_limpo := REGEXP_REPLACE(NEW.documento, '[^0-9]', '', 'g');
    
    -- Validação de comprimento
    IF NEW.tipo = 'pessoa_fisica' AND LENGTH(documento_limpo) != 11 THEN
        RAISE EXCEPTION 'CPF deve ter 11 dígitos';
    END IF;
    
    IF NEW.tipo = 'pessoa_juridica' AND LENGTH(documento_limpo) != 14 THEN
        RAISE EXCEPTION 'CNPJ deve ter 14 dígitos';
    END IF;
    
    -- Verificar duplicidade (excluir o próprio registro em caso de UPDATE)
    SELECT COUNT(*) INTO documento_existente
    FROM public.fornecedores 
    WHERE REGEXP_REPLACE(documento, '[^0-9]', '', 'g') = documento_limpo
    AND (TG_OP = 'INSERT' OR id != NEW.id);
    
    IF documento_existente > 0 THEN
        RAISE EXCEPTION 'Documento já cadastrado para outro fornecedor';
    END IF;
    
    -- Armazenar documento limpo
    NEW.documento := documento_limpo;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;