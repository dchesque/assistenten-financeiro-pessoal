-- Fase 1: Limpeza definitiva do banco de dados (corrigida)
-- Primeiro dropar todas as dependências, depois remover as colunas

-- 1. Dropar views que dependem das colunas obsoletas
DROP VIEW IF EXISTS public.active_suppliers CASCADE;
DROP VIEW IF EXISTS public.active_accounts_payable CASCADE;
DROP VIEW IF EXISTS public.active_accounts_receivable CASCADE;

-- 2. Dropar a tabela suppliers que está vazia e não é mais usada
DROP TABLE IF EXISTS public.suppliers CASCADE;

-- 3. Remover a coluna supplier_id da tabela accounts_payable com CASCADE
ALTER TABLE public.accounts_payable 
DROP COLUMN IF EXISTS supplier_id CASCADE;

-- 4. Verificar se contact_id tem foreign key constraint correta
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_payable_contact_id_fkey'
    ) THEN
        ALTER TABLE public.accounts_payable DROP CONSTRAINT accounts_payable_contact_id_fkey;
    END IF;
END $$;

-- 5. Adicionar foreign key constraint correta para contact_id
ALTER TABLE public.accounts_payable 
ADD CONSTRAINT accounts_payable_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

-- 6. Verificar se category_id tem foreign key constraint correta
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_payable_category_id_fkey'
    ) THEN
        ALTER TABLE public.accounts_payable DROP CONSTRAINT accounts_payable_category_id_fkey;
    END IF;
END $$;

-- 7. Adicionar foreign key constraint correta para category_id
ALTER TABLE public.accounts_payable 
ADD CONSTRAINT accounts_payable_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- 8. Fazer o mesmo para accounts_receivable
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_receivable_contact_id_fkey'
    ) THEN
        ALTER TABLE public.accounts_receivable DROP CONSTRAINT accounts_receivable_contact_id_fkey;
    END IF;
END $$;

ALTER TABLE public.accounts_receivable 
ADD CONSTRAINT accounts_receivable_contact_id_fkey 
FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_receivable_category_id_fkey'
    ) THEN
        ALTER TABLE public.accounts_receivable DROP CONSTRAINT accounts_receivable_category_id_fkey;
    END IF;
END $$;

ALTER TABLE public.accounts_receivable 
ADD CONSTRAINT accounts_receivable_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- 9. Recriar as views necessárias (apenas as que ainda fazem sentido)
CREATE VIEW public.active_accounts_payable AS
SELECT *
FROM public.accounts_payable
WHERE deleted_at IS NULL;

CREATE VIEW public.active_accounts_receivable AS
SELECT *
FROM public.accounts_receivable
WHERE deleted_at IS NULL;

-- 10. Atualizar comentários das tabelas para refletir a nova estrutura
COMMENT ON COLUMN public.accounts_payable.contact_id IS 'Referência ao credor na tabela contacts';
COMMENT ON COLUMN public.accounts_payable.category_id IS 'Referência à categoria na tabela categories';
COMMENT ON COLUMN public.accounts_receivable.contact_id IS 'Referência ao devedor na tabela contacts';
COMMENT ON COLUMN public.accounts_receivable.category_id IS 'Referência à categoria na tabela categories';