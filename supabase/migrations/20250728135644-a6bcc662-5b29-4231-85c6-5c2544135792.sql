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

-- Criar índices para performance
CREATE INDEX idx_vendas_cliente_id ON public.vendas(cliente_id);
CREATE INDEX idx_vendas_data_venda ON public.vendas(data_venda);
CREATE INDEX idx_vendas_status ON public.vendas(status);
CREATE INDEX idx_vendas_ativo ON public.vendas(ativo);
CREATE INDEX idx_vendas_plano_conta_id ON public.vendas(plano_conta_id);

-- Inserir algumas vendas de exemplo
INSERT INTO public.vendas (cliente_id, data_venda, hora_venda, valor_total, desconto, valor_final, forma_pagamento, parcelas, observacoes, plano_conta_id, vendedor, status, tipo_venda) VALUES
(1, '2024-01-15', '10:30:00', 150.00, 0.00, 150.00, 'dinheiro', 1, 'Venda à vista', 1, 'João Silva', 'ativa', 'produto'),
(1, '2024-01-20', '14:45:00', 250.00, 25.00, 225.00, 'cartao_credito', 2, 'Cliente fidelizado', 1, 'Maria Santos', 'ativa', 'produto'),
(1, '2024-01-25', '16:20:00', 180.00, 0.00, 180.00, 'pix', 1, 'Pagamento via PIX', 1, 'Carlos Oliveira', 'ativa', 'servico'),
(1, '2024-02-01', '09:15:00', 320.00, 20.00, 300.00, 'cartao_debito', 1, 'Desconto promocional', 1, 'Ana Costa', 'ativa', 'produto'),
(1, '2024-02-05', '11:30:00', 95.00, 0.00, 95.00, 'dinheiro', 1, 'Venda rápida', 1, 'Pedro Lima', 'ativa', 'produto');