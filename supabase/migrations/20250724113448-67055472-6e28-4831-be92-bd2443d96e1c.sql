-- Migration 1: Plano de Contas (Base do Sistema)

-- Criar tabela plano_contas com hierarquia DRE
CREATE TABLE plano_contas (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  plano_pai_id INTEGER REFERENCES plano_contas(id),
  nivel INTEGER NOT NULL DEFAULT 1,
  tipo_dre VARCHAR(20) CHECK (tipo_dre IN ('receita', 'custo', 'despesa_operacional', 'despesa_administrativa', 'despesa_comercial', 'despesa_financeira', 'outras_receitas', 'outras_despesas')),
  aceita_lancamento BOOLEAN DEFAULT true,
  icone VARCHAR(50),
  cor VARCHAR(7),
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_plano_contas_codigo ON plano_contas(codigo);
CREATE INDEX idx_plano_contas_pai ON plano_contas(plano_pai_id);
CREATE INDEX idx_plano_contas_tipo_dre ON plano_contas(tipo_dre);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plano_contas_updated_at BEFORE UPDATE ON plano_contas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais DRE
INSERT INTO plano_contas (codigo, nome, tipo_dre, aceita_lancamento, nivel) VALUES
('1', 'RECEITAS', 'receita', false, 1),
('1.1', 'Receita Operacional Bruta', 'receita', false, 2),
('1.1.1', 'Vendas de Produtos', 'receita', true, 3),
('1.1.2', 'Prestação de Serviços', 'receita', true, 3),
('2', 'DEDUÇÕES DA RECEITA', 'receita', false, 1),
('2.1', 'Impostos sobre Vendas', 'receita', true, 2),
('3', 'CUSTOS', 'custo', false, 1),
('3.1', 'Custo dos Produtos Vendidos', 'custo', false, 2),
('3.1.1', 'Material Direto', 'custo', true, 3),
('4', 'DESPESAS OPERACIONAIS', 'despesa_operacional', false, 1),
('4.1', 'Despesas Administrativas', 'despesa_administrativa', false, 2),
('4.1.1', 'Aluguel', 'despesa_administrativa', true, 3),
('4.1.2', 'Energia Elétrica', 'despesa_administrativa', true, 3),
('4.2', 'Despesas Comerciais', 'despesa_comercial', false, 2),
('4.2.1', 'Marketing', 'despesa_comercial', true, 3),
('4.3', 'Despesas Financeiras', 'despesa_financeira', false, 2),
('4.3.1', 'Juros e Taxas Bancárias', 'despesa_financeira', true, 3);