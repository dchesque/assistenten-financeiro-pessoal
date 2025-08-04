-- Corrigir search_path nas funções criadas para melhorar a segurança

-- Atualizar função de atualizar estatísticas do fornecedor
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_fornecedor(p_fornecedor_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Atualizar trigger de estatísticas do fornecedor
CREATE OR REPLACE FUNCTION public.trigger_atualizar_estatisticas_fornecedor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;