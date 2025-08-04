-- ===============================================
-- PLANO DE CORREÇÃO COMPLETO - FORNECEDORES (CORRIGIDO)
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

-- 6. Criar função para atualizar estatísticas do fornecedor (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_fornecedor(p_fornecedor_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.fornecedores
    SET 
        total_compras = (
            SELECT COUNT(*)
            FROM public.contas_pagar cp
            WHERE cp.fornecedor_id = p_fornecedor_id AND cp.status = 'pago'
        ),
        valor_total = (
            SELECT COALESCE(SUM(cp.valor_final), 0)
            FROM public.contas_pagar cp
            WHERE cp.fornecedor_id = p_fornecedor_id AND cp.status = 'pago'
        ),
        ultima_compra = (
            SELECT MAX(cp.data_pagamento)
            FROM public.contas_pagar cp
            WHERE cp.fornecedor_id = p_fornecedor_id AND cp.status = 'pago'
        ),
        updated_at = NOW()
    WHERE id = p_fornecedor_id;
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