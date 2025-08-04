-- Adicionar coluna data_emissao à tabela contas_pagar
ALTER TABLE public.contas_pagar 
ADD COLUMN data_emissao DATE DEFAULT CURRENT_DATE;

-- Comentar a coluna
COMMENT ON COLUMN public.contas_pagar.data_emissao IS 'Data de emissão da conta a pagar';