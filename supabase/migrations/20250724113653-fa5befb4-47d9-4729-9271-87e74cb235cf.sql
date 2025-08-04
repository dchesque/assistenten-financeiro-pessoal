-- Migration 3: Bancos

-- Criar tabela bancos
CREATE TABLE bancos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  codigo_banco VARCHAR(10) NOT NULL,
  agencia VARCHAR(20) NOT NULL,
  conta VARCHAR(20) NOT NULL,
  tipo_conta VARCHAR(20) CHECK (tipo_conta IN ('corrente', 'poupanca', 'investimento')) DEFAULT 'corrente',
  saldo_inicial DECIMAL(15,2) DEFAULT 0,
  saldo_atual DECIMAL(15,2) DEFAULT 0,
  limite_conta DECIMAL(15,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_bancos_codigo ON bancos(codigo_banco);
CREATE INDEX idx_bancos_ativo ON bancos(ativo);

-- Trigger
CREATE TRIGGER update_bancos_updated_at BEFORE UPDATE ON bancos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais
INSERT INTO bancos (nome, codigo_banco, agencia, conta, saldo_inicial, saldo_atual) VALUES
('Banco do Brasil', '001', '1234-5', '12345-6', 50000.00, 50000.00),
('Itaú', '341', '5678', '98765-4', 30000.00, 30000.00);