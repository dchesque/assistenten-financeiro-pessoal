-- Verificar se a estrutura da tabela taxas_maquininha está correta
-- e criar índices para melhor performance

-- Criar índice para busca eficiente das taxas por maquininha
CREATE INDEX IF NOT EXISTS idx_taxas_maquininha_ativo 
ON taxas_maquininha (maquininha_id, ativo) 
WHERE ativo = true;

-- Criar índice para busca por bandeira e tipo de transação
CREATE INDEX IF NOT EXISTS idx_taxas_maquininha_tipo 
ON taxas_maquininha (bandeira, tipo_transacao, ativo) 
WHERE ativo = true;

-- Garantir que não existam taxas duplicadas para a mesma maquininha
CREATE UNIQUE INDEX IF NOT EXISTS idx_taxas_maquininha_unica
ON taxas_maquininha (maquininha_id, bandeira, tipo_transacao, COALESCE(parcelas_max, 0))
WHERE ativo = true;