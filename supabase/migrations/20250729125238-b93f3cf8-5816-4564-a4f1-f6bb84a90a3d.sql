-- Criar tabela vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES public.clientes(id), -- NULL para CONSUMIDOR
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_venda TIME NOT NULL DEFAULT CURRENT_TIME,
  
  -- Valores
  valor_bruto DECIMAL(15,2) NOT NULL CHECK (valor_bruto > 0),
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  desconto_valor DECIMAL(15,2) DEFAULT 0,
  valor_liquido DECIMAL(15,2) NOT NULL,
  
  -- Classificação
  categoria_id INTEGER NOT NULL REFERENCES public.plano_contas(id),
  tipo_venda VARCHAR(20) DEFAULT 'venda' CHECK (tipo_venda IN ('venda', 'devolucao')),
  
  -- Pagamento
  forma_pagamento VARCHAR(50) NOT NULL,
  banco_id INTEGER REFERENCES public.bancos(id),
  parcelas INTEGER DEFAULT 1,
  
  -- Dados adicionais
  documento_referencia VARCHAR(100),
  observacoes TEXT,
  vendedor VARCHAR(255),
  
  -- Status e auditoria
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON public.vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON public.vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_categoria_id ON public.vendas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON public.vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_tipo_venda ON public.vendas(tipo_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_ativo ON public.vendas(ativo);

-- Trigger para updated_at
CREATE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON public.vendas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários autenticados podem ver todas as vendas" 
ON public.vendas FOR SELECT 
USING (true);

CREATE POLICY "Usuários autenticados podem inserir vendas" 
ON public.vendas FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar vendas" 
ON public.vendas FOR UPDATE 
USING (true);

CREATE POLICY "Usuários autenticados podem excluir vendas" 
ON public.vendas FOR DELETE 
USING (true);

-- Cliente CONSUMIDOR especial (se não existir)
INSERT INTO public.clientes (id, nome, documento, tipo, status, ativo) 
VALUES (1, 'CONSUMIDOR', '', 'especial', 'ativo', true)
ON CONFLICT (id) DO NOTHING;

-- Função para atualizar estatísticas de cliente após venda
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