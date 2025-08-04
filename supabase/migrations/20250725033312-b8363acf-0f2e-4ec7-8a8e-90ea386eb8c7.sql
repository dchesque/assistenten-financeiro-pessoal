-- Adicionar índices únicos para otimizar validações e evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_documento_unique 
ON public.clientes (documento) 
WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email_unique 
ON public.clientes (email) 
WHERE ativo = true AND email IS NOT NULL AND email != '';

-- Criar índices para otimizar performance
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes (status);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON public.clientes (tipo);
CREATE INDEX IF NOT EXISTS idx_clientes_cidade ON public.clientes (cidade);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON public.clientes (estado);
CREATE INDEX IF NOT EXISTS idx_clientes_data_ultima_compra ON public.clientes (data_ultima_compra);

-- Atualizar função para calcular estatísticas do cliente
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
    -- Calcular estatísticas baseadas na tabela vendas (quando existir)
    -- Por enquanto mantemos apenas a função de atualização preparada
    
    -- Verificar se existe tabela vendas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendas' AND table_schema = 'public') THEN
        SELECT 
            COUNT(*),
            COALESCE(SUM(valor_total), 0),
            MAX(data_venda)
        INTO total_vendas, valor_total_vendas, ultima_venda
        FROM public.vendas 
        WHERE cliente_id = cliente_id AND ativo = true;
        
        -- Calcular ticket médio
        IF total_vendas > 0 THEN
            ticket_medio_calc := valor_total_vendas / total_vendas;
        END IF;
    END IF;
    
    -- Atualizar cliente
    UPDATE public.clientes
    SET 
        total_compras = total_vendas,
        valor_total_compras = valor_total_vendas,
        ticket_medio = ticket_medio_calc,
        data_ultima_compra = ultima_venda,
        updated_at = NOW()
    WHERE id = cliente_id AND id != 1; -- Não atualizar CONSUMIDOR
END;
$function$;

-- Criar trigger para atualizar estatísticas automaticamente quando vendas forem inseridas/atualizadas
-- (Será ativado quando a tabela vendas existir)

-- Função para validar documento único
CREATE OR REPLACE FUNCTION public.validar_documento_cliente_unico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Verificar documento único para clientes ativos
    IF EXISTS (
        SELECT 1 FROM public.clientes 
        WHERE documento = NEW.documento 
        AND ativo = true 
        AND id != COALESCE(NEW.id, 0)
    ) THEN
        RAISE EXCEPTION 'Já existe um cliente ativo com este documento: %', NEW.documento;
    END IF;
    
    -- Verificar email único se fornecido
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        IF EXISTS (
            SELECT 1 FROM public.clientes 
            WHERE email = NEW.email 
            AND ativo = true 
            AND id != COALESCE(NEW.id, 0)
        ) THEN
            RAISE EXCEPTION 'Já existe um cliente ativo com este email: %', NEW.email;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Criar triggers para validação
DROP TRIGGER IF EXISTS trigger_validar_documento_cliente_unico ON public.clientes;
CREATE TRIGGER trigger_validar_documento_cliente_unico
    BEFORE INSERT OR UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_documento_cliente_unico();

-- Garantir que o cliente CONSUMIDOR padrão existe
INSERT INTO public.clientes (
    id, nome, documento, tipo, status, 
    receber_promocoes, whatsapp_marketing, ativo,
    total_compras, valor_total_compras, ticket_medio
) VALUES (
    1, 'CONSUMIDOR', '00000000000', 'PF', 'ativo',
    false, false, true, 0, 0, 0
) ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    documento = EXCLUDED.documento,
    updated_at = NOW();