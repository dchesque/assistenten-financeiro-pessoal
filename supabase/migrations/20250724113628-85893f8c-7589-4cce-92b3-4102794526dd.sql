-- Migration 2: Fornecedores

-- Criar tabela fornecedores
CREATE TABLE fornecedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  tipo VARCHAR(20) CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica')) NOT NULL,
  documento VARCHAR(18) UNIQUE NOT NULL,
  inscricao_estadual VARCHAR(20),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco JSONB,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  plano_conta_id INTEGER REFERENCES plano_contas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_fornecedores_documento ON fornecedores(documento);
CREATE INDEX idx_fornecedores_nome ON fornecedores USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_fornecedores_ativo ON fornecedores(ativo);

-- Trigger
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função validação documento
CREATE OR REPLACE FUNCTION validar_documento_fornecedor()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER validar_documento_fornecedor_trigger
  BEFORE INSERT OR UPDATE ON fornecedores
  FOR EACH ROW EXECUTE FUNCTION validar_documento_fornecedor();