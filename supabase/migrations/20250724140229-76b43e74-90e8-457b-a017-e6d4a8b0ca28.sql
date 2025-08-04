-- Inserir cliente CONSUMIDOR padrão se não existir
INSERT INTO clientes (id, nome, documento, tipo, status, receber_promocoes, whatsapp_marketing, total_compras, valor_total_compras, ticket_medio, ativo) 
VALUES (1, 'CONSUMIDOR', '000.000.000-00', 'PF', 'ativo', false, false, 0, 0.00, 0.00, true)
ON CONFLICT (id) DO NOTHING;

-- Garantir que o ID do CONSUMIDOR sempre seja 1
SELECT setval('clientes_id_seq', GREATEST(1, (SELECT MAX(id) FROM clientes WHERE id > 1)), true);

-- Atualizar função para calcular ticket médio corretamente
CREATE OR REPLACE FUNCTION atualizar_estatisticas_cliente(cliente_id INTEGER, valor_compra DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE clientes 
    SET 
        total_compras = total_compras + 1,
        valor_total_compras = valor_total_compras + valor_compra,
        ticket_medio = CASE 
            WHEN total_compras + 1 > 0 THEN (valor_total_compras + valor_compra) / (total_compras + 1)
            ELSE 0
        END,
        data_ultima_compra = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = cliente_id AND id != 1; -- Não atualizar estatísticas do CONSUMIDOR
END;
$$ language 'plpgsql';

-- Índices otimizados para busca rápida
CREATE INDEX IF NOT EXISTS idx_clientes_busca_nome ON clientes USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_clientes_documento_busca ON clientes(documento) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_status_ativo ON clientes(status, ativo) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_status ON clientes(tipo, status) WHERE ativo = true;