-- Adicionar campos de endereço separados na tabela fornecedores
ALTER TABLE fornecedores
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS logradouro TEXT,
ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2);

-- Comentário sobre o campo endereco existente (jsonb) que pode ser removido futuramente
COMMENT ON COLUMN fornecedores.endereco IS 'Campo legado em JSONB - migrar dados se necessário';