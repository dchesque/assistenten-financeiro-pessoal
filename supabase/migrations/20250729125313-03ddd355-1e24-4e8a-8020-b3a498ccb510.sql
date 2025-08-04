-- Verificar se a tabela vendas já existe e corrigir a estrutura
ALTER TABLE public.vendas 
ADD COLUMN IF NOT EXISTS plano_conta_id INTEGER REFERENCES public.plano_contas(id);

-- Remover a referência a categoria_id se existir e usar plano_conta_id
UPDATE public.vendas SET plano_conta_id = categoria_id WHERE categoria_id IS NOT NULL AND plano_conta_id IS NULL;

-- Adicionar índice para plano_conta_id
CREATE INDEX IF NOT EXISTS idx_vendas_plano_conta_id ON public.vendas(plano_conta_id);

-- Trigger para atualizar estatísticas de cliente após venda
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_cliente_venda()
RETURNS TRIGGER AS $$
BEGIN
    -- Apenas para INSERT/UPDATE de vendas ativas
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.ativo = true) THEN
        -- Não atualizar estatísticas do CONSUMIDOR (ID 1)
        IF NEW.cliente_id IS NOT NULL AND NEW.cliente_id != 1 THEN
            PERFORM public.atualizar_estatisticas_cliente_completas(NEW.cliente_id);
        END IF;
    END IF;
    
    -- Para UPDATE que desativa venda ou DELETE
    IF TG_OP = 'UPDATE' AND OLD.ativo = true AND NEW.ativo = false THEN
        IF OLD.cliente_id IS NOT NULL AND OLD.cliente_id != 1 THEN
            PERFORM public.atualizar_estatisticas_cliente_completas(OLD.cliente_id);
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        IF OLD.cliente_id IS NOT NULL AND OLD.cliente_id != 1 THEN
            PERFORM public.atualizar_estatisticas_cliente_completas(OLD.cliente_id);
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar trigger para estatísticas
DROP TRIGGER IF EXISTS trigger_vendas_atualizar_estatisticas_cliente ON public.vendas;
CREATE TRIGGER trigger_vendas_atualizar_estatisticas_cliente
    AFTER INSERT OR UPDATE OR DELETE ON public.vendas
    FOR EACH ROW
    EXECUTE FUNCTION public.atualizar_estatisticas_cliente_venda();