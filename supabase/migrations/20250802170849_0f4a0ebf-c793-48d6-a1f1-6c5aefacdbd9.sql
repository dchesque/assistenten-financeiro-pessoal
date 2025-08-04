-- Adicionar campo lote_id na tabela contas_pagar para agrupar lançamentos em lote
ALTER TABLE contas_pagar 
ADD COLUMN IF NOT EXISTS lote_id UUID;

-- Criar índice para melhorar performance das consultas por lote
CREATE INDEX IF NOT EXISTS idx_contas_pagar_lote_id ON contas_pagar(lote_id);

-- Comentário na coluna
COMMENT ON COLUMN contas_pagar.lote_id IS 'UUID que agrupa contas criadas em lote';