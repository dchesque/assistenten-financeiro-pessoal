-- CORREÇÃO 1: ISOLAMENTO DE DADOS POR USUÁRIO
-- Adicionar coluna user_id nas tabelas principais
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.bancos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.cheques ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.plano_contas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Preencher user_id para dados existentes (usar o primeiro usuário cadastrado)
UPDATE public.contas_pagar SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.fornecedores SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.vendas SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.clientes SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.bancos SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.cheques SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE public.plano_contas SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- Tornar user_id obrigatório
ALTER TABLE public.contas_pagar ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.fornecedores ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.vendas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.bancos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.cheques ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.plano_contas ALTER COLUMN user_id SET NOT NULL;

-- Atualizar RLS Policies para isolamento por usuário
-- CONTAS PAGAR
DROP POLICY IF EXISTS "Usuários autenticados podem ver contas" ON public.contas_pagar;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir contas" ON public.contas_pagar;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar contas" ON public.contas_pagar;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir contas" ON public.contas_pagar;

CREATE POLICY "Usuários só veem suas contas" ON public.contas_pagar
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários só inserem suas contas" ON public.contas_pagar
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários só atualizam suas contas" ON public.contas_pagar
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários só excluem suas contas" ON public.contas_pagar
FOR DELETE USING (auth.uid() = user_id);

-- FORNECEDORES
DROP POLICY IF EXISTS "Usuários autenticados podem ver fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir fornecedores" ON public.fornecedores;

CREATE POLICY "Usuários só veem seus fornecedores" ON public.fornecedores
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários só inserem seus fornecedores" ON public.fornecedores
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários só atualizam seus fornecedores" ON public.fornecedores
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários só excluem seus fornecedores" ON public.fornecedores
FOR DELETE USING (auth.uid() = user_id);

-- VENDAS
DROP POLICY IF EXISTS "Usuários autenticados podem ver todas as vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar vendas" ON public.vendas;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir vendas" ON public.vendas;

CREATE POLICY "Usuários só veem suas vendas" ON public.vendas
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários só inserem suas vendas" ON public.vendas
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários só atualizam suas vendas" ON public.vendas
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários só excluem suas vendas" ON public.vendas
FOR DELETE USING (auth.uid() = user_id);

-- CLIENTES
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir clientes" ON public.clientes;

CREATE POLICY "Usuários só veem seus clientes" ON public.clientes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários só inserem seus clientes" ON public.clientes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários só atualizam seus clientes" ON public.clientes
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários só excluem seus clientes" ON public.clientes
FOR DELETE USING (auth.uid() = user_id);

-- BANCOS
DROP POLICY IF EXISTS "Usuários autenticados podem ver bancos" ON public.bancos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir bancos" ON public.bancos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar bancos" ON public.bancos;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir bancos" ON public.bancos;

CREATE POLICY "Usuários só veem seus bancos" ON public.bancos
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários só inserem seus bancos" ON public.bancos
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários só atualizam seus bancos" ON public.bancos
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários só excluem seus bancos" ON public.bancos
FOR DELETE USING (auth.uid() = user_id);

-- CHEQUES
DROP POLICY IF EXISTS "Usuários autenticados podem ver cheques" ON public.cheques;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir cheques" ON public.cheques;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar cheques" ON public.cheques;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir cheques" ON public.cheques;

CREATE POLICY "Usuários só veem seus cheques" ON public.cheques
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários só inserem seus cheques" ON public.cheques
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários só atualizam seus cheques" ON public.cheques
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários só excluem seus cheques" ON public.cheques
FOR DELETE USING (auth.uid() = user_id);

-- PLANO CONTAS
DROP POLICY IF EXISTS "Usuários autenticados podem ver plano de contas" ON public.plano_contas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir plano de contas" ON public.plano_contas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar plano de contas" ON public.plano_contas;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir plano de contas" ON public.plano_contas;

CREATE POLICY "Usuários só veem seu plano de contas" ON public.plano_contas
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários só inserem seu plano de contas" ON public.plano_contas
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários só atualizam seu plano de contas" ON public.plano_contas
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários só excluem seu plano de contas" ON public.plano_contas
FOR DELETE USING (auth.uid() = user_id);