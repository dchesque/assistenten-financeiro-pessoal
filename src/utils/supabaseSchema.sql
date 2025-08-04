-- Schema completo da tabela fornecedores para Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela fornecedores
CREATE TABLE fornecedores (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  documento VARCHAR(20) UNIQUE NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica')),
  categoria_padrao_id BIGINT REFERENCES plano_contas(id),
  tipo_fornecedor VARCHAR(20) NOT NULL CHECK (tipo_fornecedor IN ('receita', 'despesa')),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  observacoes TEXT,
  total_compras INTEGER DEFAULT 0,
  valor_total DECIMAL(15,2) DEFAULT 0.00,
  ultima_compra DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE
);

-- 2. Comentários na tabela
COMMENT ON TABLE fornecedores IS 'Cadastro de fornecedores e clientes do sistema';
COMMENT ON COLUMN fornecedores.nome IS 'Nome completo ou razão social';
COMMENT ON COLUMN fornecedores.documento IS 'CPF ou CNPJ (único no sistema)';
COMMENT ON COLUMN fornecedores.tipo IS 'Tipo de pessoa: fisica ou juridica';
COMMENT ON COLUMN fornecedores.categoria_padrao_id IS 'Conta padrão do plano de contas';
COMMENT ON COLUMN fornecedores.tipo_fornecedor IS 'Classificação: receita (clientes) ou despesa (fornecedores)';
COMMENT ON COLUMN fornecedores.total_compras IS 'Total de transações realizadas';
COMMENT ON COLUMN fornecedores.valor_total IS 'Valor total de todas as transações';
COMMENT ON COLUMN fornecedores.ultima_compra IS 'Data da última transação';

-- 3. Índices para performance
CREATE INDEX idx_fornecedores_documento ON fornecedores(documento);
CREATE INDEX idx_fornecedores_tipo_fornecedor ON fornecedores(tipo_fornecedor);
CREATE INDEX idx_fornecedores_ativo ON fornecedores(ativo);
CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX idx_fornecedores_email ON fornecedores(email);
CREATE INDEX idx_fornecedores_created_at ON fornecedores(created_at);

-- 4. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fornecedores_updated_at 
    BEFORE UPDATE ON fornecedores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Função para validar documento (CPF/CNPJ)
CREATE OR REPLACE FUNCTION validar_documento_fornecedor()
RETURNS TRIGGER AS $$
BEGIN
    -- Remover caracteres especiais do documento
    NEW.documento = REGEXP_REPLACE(NEW.documento, '[^0-9]', '', 'g');
    
    -- Validar tamanho do documento conforme o tipo
    IF NEW.tipo = 'pessoa_fisica' AND LENGTH(NEW.documento) != 11 THEN
        RAISE EXCEPTION 'CPF deve ter 11 dígitos';
    END IF;
    
    IF NEW.tipo = 'pessoa_juridica' AND LENGTH(NEW.documento) != 14 THEN
        RAISE EXCEPTION 'CNPJ deve ter 14 dígitos';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validar_documento_trigger
    BEFORE INSERT OR UPDATE ON fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION validar_documento_fornecedor();

-- 6. Função para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION atualizar_estatisticas_fornecedor(fornecedor_id BIGINT)
RETURNS VOID AS $$
DECLARE
    stats RECORD;
BEGIN
    -- Calcular estatísticas baseadas nas contas pagas
    SELECT 
        COUNT(*) as total_compras,
        COALESCE(SUM(valor_pago), 0) as valor_total,
        MAX(data_pagamento) as ultima_compra
    INTO stats
    FROM contas_pagar 
    WHERE fornecedor_id = $1 AND status = 'pago';
    
    -- Atualizar fornecedor
    UPDATE fornecedores 
    SET 
        total_compras = stats.total_compras,
        valor_total = stats.valor_total,
        ultima_compra = stats.ultima_compra,
        updated_at = NOW()
    WHERE id = fornecedor_id;
END;
$$ language 'plpgsql';

-- 7. View para relatórios
CREATE OR REPLACE VIEW vw_fornecedores_resumo AS
SELECT 
    f.id,
    f.nome,
    f.documento,
    f.tipo,
    f.tipo_fornecedor,
    f.email,
    f.telefone,
    f.cidade,
    f.estado,
    f.total_compras,
    f.valor_total,
    f.ultima_compra,
    f.ativo,
    f.created_at,
    pc.nome as categoria_padrao_nome,
    pc.codigo as categoria_padrao_codigo
FROM fornecedores f
LEFT JOIN plano_contas pc ON f.categoria_padrao_id = pc.id
ORDER BY f.nome;

-- 8. Habilitar RLS (Row Level Security)
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS (ajustar conforme necessário)
-- Política para usuários autenticados verem todos os fornecedores
CREATE POLICY "Usuários podem ver todos os fornecedores" ON fornecedores
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para usuários autenticados inserirem fornecedores
CREATE POLICY "Usuários podem inserir fornecedores" ON fornecedores
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para usuários autenticados atualizarem fornecedores
CREATE POLICY "Usuários podem atualizar fornecedores" ON fornecedores
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para usuários autenticados excluírem fornecedores
CREATE POLICY "Usuários podem excluir fornecedores" ON fornecedores
    FOR DELETE USING (auth.role() = 'authenticated');

-- 10. Inserir dados de exemplo (opcional)
INSERT INTO fornecedores (
    nome, documento, tipo, tipo_fornecedor, email, telefone, 
    cidade, estado, ativo
) VALUES
('Empresa ABC Ltda', '12345678000195', 'pessoa_juridica', 'despesa', 'contato@empresaabc.com', '(11) 99999-9999', 'São Paulo', 'SP', true),
('João Silva', '12345678901', 'pessoa_fisica', 'receita', 'joao@email.com', '(11) 88888-8888', 'Rio de Janeiro', 'RJ', true),
('Fornecedor XYZ', '98765432000187', 'pessoa_juridica', 'despesa', 'vendas@xyz.com', '(21) 77777-7777', 'Belo Horizonte', 'MG', true)
ON CONFLICT (documento) DO NOTHING;

-- 11. Verificar instalação
SELECT 
    'Tabela criada com sucesso!' as status,
    COUNT(*) as total_fornecedores
FROM fornecedores;