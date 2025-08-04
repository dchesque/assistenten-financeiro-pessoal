-- Corrigir a função de atualização de estatísticas do cliente
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_cliente_completas(p_cliente_id integer)
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
    -- Verificar se existe tabela vendas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendas' AND table_schema = 'public') THEN
        SELECT 
            COUNT(*),
            COALESCE(SUM(valor_final), 0),
            MAX(data_venda)
        INTO total_vendas, valor_total_vendas, ultima_venda
        FROM public.vendas 
        WHERE cliente_id = p_cliente_id AND ativo = true AND status = 'ativa';
        
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
    WHERE id = p_cliente_id AND id != 1; -- Não atualizar CONSUMIDOR
END;
$function$;

-- Criar tabela vendas
CREATE TABLE public.vendas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES public.clientes(id),
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_venda TIME NOT NULL DEFAULT CURRENT_TIME,
  valor_total NUMERIC(15,2) NOT NULL CHECK (valor_total > 0),
  desconto NUMERIC(15,2) DEFAULT 0 CHECK (desconto >= 0),
  valor_final NUMERIC(15,2) NOT NULL CHECK (valor_final > 0),
  forma_pagamento VARCHAR(50) NOT NULL,
  parcelas INTEGER DEFAULT 1 CHECK (parcelas >= 1),
  observacoes TEXT,
  plano_conta_id INTEGER REFERENCES public.plano_contas(id),
  vendedor VARCHAR(255),
  comissao_percentual NUMERIC(5,2) DEFAULT 0,
  comissao_valor NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'devolvida')),
  tipo_venda VARCHAR(20) DEFAULT 'produto' CHECK (tipo_venda IN ('produto', 'servico', 'misto')),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela vendas
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para vendas
CREATE POLICY "Usuários autenticados podem ver todas as vendas" 
ON public.vendas 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir vendas" 
ON public.vendas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar vendas" 
ON public.vendas 
FOR UPDATE 
USING (true);

CREATE POLICY "Usuários autenticados podem excluir vendas" 
ON public.vendas 
FOR DELETE 
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_vendas_updated_at
BEFORE UPDATE ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para trigger de estatísticas do cliente
CREATE OR REPLACE FUNCTION public.trigger_vendas_estatisticas_cliente()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.atualizar_estatisticas_cliente_completas(OLD.cliente_id);
    RETURN OLD;
  ELSE
    PERFORM public.atualizar_estatisticas_cliente_completas(NEW.cliente_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas do cliente
CREATE TRIGGER trigger_atualizar_estatisticas_cliente_vendas
AFTER INSERT OR UPDATE OR DELETE ON public.vendas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_vendas_estatisticas_cliente();

-- Criar índices para performance
CREATE INDEX idx_vendas_cliente_id ON public.vendas(cliente_id);
CREATE INDEX idx_vendas_data_venda ON public.vendas(data_venda);
CREATE INDEX idx_vendas_status ON public.vendas(status);
CREATE INDEX idx_vendas_ativo ON public.vendas(ativo);
CREATE INDEX idx_vendas_plano_conta_id ON public.vendas(plano_conta_id);