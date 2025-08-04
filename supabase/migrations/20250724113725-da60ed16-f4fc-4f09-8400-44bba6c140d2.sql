-- Migration 4: Contas a Pagar

-- Criar tabela contas_pagar
CREATE TABLE contas_pagar (
  id SERIAL PRIMARY KEY,
  descricao VARCHAR(500) NOT NULL,
  fornecedor_id INTEGER REFERENCES fornecedores(id) NOT NULL,
  plano_conta_id INTEGER REFERENCES plano_contas(id) NOT NULL,
  banco_id INTEGER REFERENCES bancos(id),
  valor_original DECIMAL(15,2) NOT NULL,
  desconto DECIMAL(15,2) DEFAULT 0,
  acrescimo DECIMAL(15,2) DEFAULT 0,
  valor_final DECIMAL(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')) DEFAULT 'pendente',
  forma_pagamento VARCHAR(50),
  documento_referencia VARCHAR(100),
  observacoes TEXT,
  parcela_atual INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  grupo_lancamento UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_contas_pagar_fornecedor ON contas_pagar(fornecedor_id);
CREATE INDEX idx_contas_pagar_plano_conta ON contas_pagar(plano_conta_id);
CREATE INDEX idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX idx_contas_pagar_grupo ON contas_pagar(grupo_lancamento);

-- Trigger
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON contas_pagar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar status automaticamente
CREATE OR REPLACE FUNCTION atualizar_status_conta()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualizar_status_conta_trigger
  BEFORE UPDATE ON contas_pagar
  FOR EACH ROW EXECUTE FUNCTION atualizar_status_conta();