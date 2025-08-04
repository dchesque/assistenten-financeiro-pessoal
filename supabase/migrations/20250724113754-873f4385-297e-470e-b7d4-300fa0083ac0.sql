-- Migration 5: Cheques

-- Criar tabela cheques
CREATE TABLE cheques (
  id SERIAL PRIMARY KEY,
  numero_cheque VARCHAR(20) NOT NULL,
  banco_id INTEGER REFERENCES bancos(id) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  data_emissao DATE NOT NULL,
  data_vencimento DATE,
  beneficiario_nome VARCHAR(255) NOT NULL,
  beneficiario_documento VARCHAR(18),
  conta_pagar_id INTEGER REFERENCES contas_pagar(id),
  status VARCHAR(20) CHECK (status IN ('emitido', 'compensado', 'devolvido', 'cancelado')) DEFAULT 'emitido',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cheques_banco ON cheques(banco_id);
CREATE INDEX idx_cheques_numero ON cheques(numero_cheque);
CREATE INDEX idx_cheques_status ON cheques(status);
CREATE INDEX idx_cheques_vencimento ON cheques(data_vencimento);

-- Trigger
CREATE TRIGGER update_cheques_updated_at BEFORE UPDATE ON cheques FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();