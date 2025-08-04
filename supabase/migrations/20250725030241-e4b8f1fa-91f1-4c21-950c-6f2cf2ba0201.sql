-- Corrigir funções restantes com search_path para segurança

-- Corrigir função atualizar_estatisticas_cliente
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_cliente(cliente_id integer, valor_compra numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Corrigir função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Corrigir função validar_documento_fornecedor
CREATE OR REPLACE FUNCTION public.validar_documento_fornecedor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Validação simples de CPF/CNPJ
  IF NEW.tipo = 'pessoa_fisica' AND LENGTH(REPLACE(REPLACE(REPLACE(NEW.documento, '.', ''), '-', ''), '/', '')) != 11 THEN
    RAISE EXCEPTION 'CPF deve ter 11 dígitos';
  END IF;
  
  IF NEW.tipo = 'pessoa_juridica' AND LENGTH(REPLACE(REPLACE(REPLACE(NEW.documento, '.', ''), '-', ''), '/', '')) != 14 THEN
    RAISE EXCEPTION 'CNPJ deve ter 14 dígitos';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Corrigir função atualizar_status_conta
CREATE OR REPLACE FUNCTION public.atualizar_status_conta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Se data de pagamento foi preenchida, marcar como pago
  IF NEW.data_pagamento IS NOT NULL AND OLD.data_pagamento IS NULL THEN
    NEW.status = 'pago';
  END IF;
  
  -- Se venceu e não foi paga, marcar como vencida
  IF NEW.data_vencimento < CURRENT_DATE AND NEW.status = 'pendente' AND NEW.data_pagamento IS NULL THEN
    NEW.status = 'vencido';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Corrigir função atualizar_saldo_banco
CREATE OR REPLACE FUNCTION public.atualizar_saldo_banco()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Atualizar saldo atual do banco
  UPDATE bancos 
  SET saldo_atual = (
    SELECT 
      COALESCE(saldo_inicial, 0) + 
      COALESCE(SUM(
        CASE 
          WHEN tipo_movimentacao = 'entrada' THEN valor 
          ELSE -valor 
        END
      ), 0)
    FROM movimentacoes_bancarias 
    WHERE banco_id = NEW.banco_id AND ativo = true
  )
  WHERE id = NEW.banco_id;
  
  RETURN NEW;
END;
$function$;