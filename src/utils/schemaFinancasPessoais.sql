-- Schema completo para finanças pessoais
-- Execute este script no SQL Editor do Supabase

-- 1. Limpar estruturas antigas (se existirem)
DROP TABLE IF EXISTS contas_pessoais CASCADE;
DROP TABLE IF EXISTS credores CASCADE;
DROP TABLE IF EXISTS categorias_despesas CASCADE;
DROP TYPE IF EXISTS tipo_pessoa CASCADE;
DROP TYPE IF EXISTS status_conta CASCADE;
DROP TYPE IF EXISTS grupo_categoria CASCADE;

-- 2. Criar tipos ENUM
CREATE TYPE tipo_pessoa AS ENUM ('pessoa_fisica', 'pessoa_juridica');
CREATE TYPE status_conta AS ENUM ('pendente', 'paga', 'vencida');
CREATE TYPE grupo_categoria AS ENUM ('moradia', 'transporte', 'alimentacao', 'saude', 'educacao', 'lazer', 'cuidados', 'outros');

-- 3. Criar tabela de categorias de despesas
CREATE TABLE categorias_despesas (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  grupo grupo_categoria NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#6B7280',
  icone VARCHAR(50) NOT NULL DEFAULT 'Package',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT nome_categoria_user_unique UNIQUE(nome, user_id),
  CONSTRAINT cor_hex_valid CHECK (cor ~ '^#[0-9A-Fa-f]{6}$')
);

-- 4. Criar tabela de credores
CREATE TABLE credores (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  tipo tipo_pessoa DEFAULT 'pessoa_fisica',
  documento VARCHAR(20),
  email VARCHAR(100),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Estatísticas calculadas
  total_contas INTEGER DEFAULT 0,
  valor_total DECIMAL(15,2) DEFAULT 0.00,
  ultima_conta DATE,
  
  -- Constraints
  CONSTRAINT documento_user_unique UNIQUE(documento, user_id),
  CONSTRAINT email_format CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$'),
  CONSTRAINT estado_brasil CHECK (estado IS NULL OR estado ~ '^[A-Z]{2}$'),
  CONSTRAINT cep_format CHECK (cep IS NULL OR cep ~ '^[0-9]{5}-?[0-9]{3}$')
);

-- 5. Criar tabela de contas pessoais
CREATE TABLE contas_pessoais (
  id BIGSERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status status_conta DEFAULT 'pendente',
  credor_id BIGINT REFERENCES credores(id) ON DELETE SET NULL,
  categoria_id BIGINT NOT NULL REFERENCES categorias_despesas(id) ON DELETE RESTRICT,
  observacoes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT data_pagamento_valida CHECK (
    (status = 'paga' AND data_pagamento IS NOT NULL) OR 
    (status != 'paga' AND data_pagamento IS NULL)
  )
);

-- 6. Criar índices para performance
CREATE INDEX idx_categorias_user_grupo ON categorias_despesas(user_id, grupo);
CREATE INDEX idx_categorias_ativo ON categorias_despesas(ativo);
CREATE INDEX idx_categorias_nome ON categorias_despesas(nome);

CREATE INDEX idx_credores_user_id ON credores(user_id);
CREATE INDEX idx_credores_documento ON credores(documento);
CREATE INDEX idx_credores_nome ON credores(nome);
CREATE INDEX idx_credores_ativo ON credores(ativo);
CREATE INDEX idx_credores_tipo ON credores(tipo);

CREATE INDEX idx_contas_user_id ON contas_pessoais(user_id);
CREATE INDEX idx_contas_status ON contas_pessoais(status);
CREATE INDEX idx_contas_vencimento ON contas_pessoais(data_vencimento);
CREATE INDEX idx_contas_categoria ON contas_pessoais(categoria_id);
CREATE INDEX idx_contas_credor ON contas_pessoais(credor_id);
CREATE INDEX idx_contas_valor ON contas_pessoais(valor);

-- 7. Triggers para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_updated_at 
    BEFORE UPDATE ON categorias_despesas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credores_updated_at 
    BEFORE UPDATE ON credores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contas_updated_at 
    BEFORE UPDATE ON contas_pessoais 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Função para atualizar status das contas vencidas
CREATE OR REPLACE FUNCTION atualizar_status_vencidas()
RETURNS VOID AS $$
BEGIN
    UPDATE contas_pessoais 
    SET status = 'vencida'
    WHERE status = 'pendente' 
    AND data_vencimento < CURRENT_DATE;
END;
$$ language 'plpgsql';

-- 9. Função para atualizar estatísticas do credor
CREATE OR REPLACE FUNCTION atualizar_estatisticas_credor(credor_id BIGINT)
RETURNS VOID AS $$
DECLARE
    stats RECORD;
BEGIN
    SELECT 
        COUNT(*) as total_contas,
        COALESCE(SUM(valor), 0) as valor_total,
        MAX(data_pagamento) as ultima_conta
    INTO stats
    FROM contas_pessoais 
    WHERE credor_id = $1 AND status = 'paga';
    
    UPDATE credores 
    SET 
        total_contas = stats.total_contas,
        valor_total = stats.valor_total,
        ultima_conta = stats.ultima_conta,
        updated_at = NOW()
    WHERE id = credor_id;
END;
$$ language 'plpgsql';

-- 10. Trigger para atualizar estatísticas automaticamente
CREATE OR REPLACE FUNCTION trigger_atualizar_estatisticas_credor()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar estatísticas do credor antigo (se mudou)
    IF TG_OP = 'UPDATE' AND OLD.credor_id IS DISTINCT FROM NEW.credor_id THEN
        IF OLD.credor_id IS NOT NULL THEN
            PERFORM atualizar_estatisticas_credor(OLD.credor_id);
        END IF;
    END IF;
    
    -- Atualizar estatísticas do credor atual
    IF NEW.credor_id IS NOT NULL THEN
        PERFORM atualizar_estatisticas_credor(NEW.credor_id);
    END IF;
    
    -- Para DELETE, atualizar credor antigo
    IF TG_OP = 'DELETE' AND OLD.credor_id IS NOT NULL THEN
        PERFORM atualizar_estatisticas_credor(OLD.credor_id);
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_contas_estatisticas
    AFTER INSERT OR UPDATE OR DELETE ON contas_pessoais
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_estatisticas_credor();

-- 11. Habilitar Row Level Security (RLS)
ALTER TABLE categorias_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE credores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pessoais ENABLE ROW LEVEL SECURITY;

-- 12. Políticas RLS
-- Categorias
CREATE POLICY "Usuários podem ver suas categorias" ON categorias_despesas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas categorias" ON categorias_despesas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas categorias" ON categorias_despesas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas categorias" ON categorias_despesas
    FOR DELETE USING (auth.uid() = user_id);

-- Credores
CREATE POLICY "Usuários podem ver seus credores" ON credores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus credores" ON credores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus credores" ON credores
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus credores" ON credores
    FOR DELETE USING (auth.uid() = user_id);

-- Contas
CREATE POLICY "Usuários podem ver suas contas" ON contas_pessoais
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas contas" ON contas_pessoais
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas contas" ON contas_pessoais
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas contas" ON contas_pessoais
    FOR DELETE USING (auth.uid() = user_id);

-- 13. Inserir categorias padrão (será feito via aplicação)
-- Para manter flexibilidade, as categorias padrão serão inseridas via código

-- 14. View para relatórios
CREATE OR REPLACE VIEW vw_resumo_financeiro AS
SELECT 
    cp.user_id,
    cd.grupo,
    cd.nome as categoria_nome,
    COUNT(cp.id) as total_contas,
    SUM(cp.valor) as valor_total,
    SUM(CASE WHEN cp.status = 'paga' THEN cp.valor ELSE 0 END) as valor_pago,
    SUM(CASE WHEN cp.status = 'pendente' THEN cp.valor ELSE 0 END) as valor_pendente,
    SUM(CASE WHEN cp.status = 'vencida' THEN cp.valor ELSE 0 END) as valor_vencido
FROM contas_pessoais cp
JOIN categorias_despesas cd ON cp.categoria_id = cd.id
GROUP BY cp.user_id, cd.grupo, cd.nome, cd.id
ORDER BY cd.grupo, cd.nome;

-- 15. Verificar instalação
SELECT 
    'Schema criado com sucesso!' as status,
    (SELECT COUNT(*) FROM categorias_despesas) as total_categorias,
    (SELECT COUNT(*) FROM credores) as total_credores,
    (SELECT COUNT(*) FROM contas_pessoais) as total_contas;