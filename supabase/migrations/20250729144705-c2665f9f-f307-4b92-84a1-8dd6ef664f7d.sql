-- Corrigir as últimas funções para incluir SET search_path TO 'public'

-- Função atualizar_estatisticas_cliente_completas
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_cliente_completas(cliente_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    total_vendas integer := 0;
    valor_total_vendas numeric := 0;
    ultima_venda date := NULL;
    ticket_medio_calc numeric := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendas' AND table_schema = 'public') THEN
        SELECT 
            COUNT(*),
            COALESCE(SUM(valor_total), 0),
            MAX(data_venda)
        INTO total_vendas, valor_total_vendas, ultima_venda
        FROM public.vendas 
        WHERE cliente_id = $1 AND ativo = true;
        
        IF total_vendas > 0 THEN
            ticket_medio_calc := valor_total_vendas / total_vendas;
        END IF;
    END IF;
    
    UPDATE public.clientes
    SET 
        total_compras = total_vendas,
        valor_total_compras = valor_total_vendas,
        ticket_medio = ticket_medio_calc,
        data_ultima_compra = ultima_venda,
        updated_at = NOW()
    WHERE id = cliente_id AND id != 1;
END;
$function$;

-- Função atualizar_estatisticas_cliente
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_cliente(cliente_id integer, valor_compra numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    UPDATE clientes 
    SET 
        total_compras = total_compras + 1,
        valor_total_compras = valor_total_compras + valor_compra,
        ticket_medio = CASE 
            WHEN total_compras + 1 > 0 THEN (valor_total_compras + valor_compra) / (total_compras + 1)
            ELSE 0
        END,
        data_ultima_compra = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = cliente_id AND id != 1; -- Não atualizar estatísticas do CONSUMIDOR
END;
$function$;

-- Função atualizar_estatisticas_fornecedor
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