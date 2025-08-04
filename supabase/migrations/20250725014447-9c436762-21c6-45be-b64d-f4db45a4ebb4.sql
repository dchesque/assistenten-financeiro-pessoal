-- Primeiro, ajustar a constraint para incluir despesa_operacional
ALTER TABLE plano_contas DROP CONSTRAINT plano_contas_tipo_dre_check;

ALTER TABLE plano_contas ADD CONSTRAINT plano_contas_tipo_dre_check 
CHECK (tipo_dre::text = ANY (ARRAY[
  'receita'::character varying,
  'deducao_receita'::character varying,
  'custo'::character varying,
  'despesa_operacional'::character varying,
  'despesa_administrativa'::character varying,
  'despesa_comercial'::character varying,
  'despesa_financeira'::character varying,
  'outras_receitas'::character varying,
  'outras_despesas'::character varying
]::text[]));

-- Limpar tabela atual
DELETE FROM plano_contas;

-- Resetar sequence
ALTER SEQUENCE plano_contas_id_seq RESTART WITH 1;

-- Inserir estrutura CORRETA e SIMPLIFICADA
INSERT INTO plano_contas (codigo, nome, descricao, tipo_dre, aceita_lancamento, nivel, plano_pai_id, cor, icone, ativo, observacoes) VALUES

-- NÍVEL 1 - GRUPOS PRINCIPAIS
('1', 'RECEITAS', 'Receitas da empresa', 'receita', false, 1, NULL, '#10B981', 'TrendingUp', true, 'Receitas operacionais'),
('2', 'DEDUÇÕES DA RECEITA', 'Deduções das receitas', 'deducao_receita', false, 1, NULL, '#EF4444', 'TrendingDown', true, 'Impostos e devoluções'),
('3', 'CUSTOS DOS PRODUTOS VENDIDOS', 'Custos diretos dos produtos', 'custo', false, 1, NULL, '#3B82F6', 'Package', true, 'Custo dos produtos vendidos'),
('4', 'DESPESAS OPERACIONAIS', 'Despesas operacionais da empresa', 'despesa_operacional', false, 1, NULL, '#8B5CF6', 'Receipt', true, 'Despesas operacionais'),

-- NÍVEL 2 - SUBGRUPOS
('1.1', 'Receita Operacional Bruta', 'Receitas brutas de vendas', 'receita', false, 2, 1, '#10B981', 'ShoppingCart', true, 'Vendas de roupas'),
('2.1', 'Impostos sobre Vendas', 'Impostos incidentes sobre vendas', 'deducao_receita', false, 2, 2, '#EF4444', 'FileText', true, 'Impostos'),
('2.2', 'Devoluções e Cancelamentos', 'Devoluções de mercadorias', 'deducao_receita', false, 2, 2, '#EF4444', 'RotateCcw', true, 'Devoluções'),
('3.1', 'Compra de Mercadorias', 'Compras para revenda', 'custo', false, 2, 3, '#3B82F6', 'ShoppingBag', true, 'Compras'),
('3.2', 'Logística', 'Custos de logística e entrega', 'custo', false, 2, 3, '#3B82F6', 'Truck', true, 'Logística'),
('4.1', 'Despesas com Pessoal', 'Gastos com funcionários', 'despesa_operacional', false, 2, 4, '#8B5CF6', 'Users', true, 'Pessoal'),
('4.2', 'Despesas da Loja', 'Gastos da estrutura física', 'despesa_operacional', false, 2, 4, '#8B5CF6', 'Store', true, 'Loja'),
('4.3', 'Despesas Comerciais', 'Gastos comerciais e marketing', 'despesa_comercial', false, 2, 4, '#8B5CF6', 'Megaphone', true, 'Comerciais'),
('4.4', 'Despesas Administrativas', 'Gastos administrativos', 'despesa_administrativa', false, 2, 4, '#8B5CF6', 'FileText', true, 'Administrativas'),
('4.5', 'Despesas Financeiras', 'Gastos financeiros e bancários', 'despesa_financeira', false, 2, 4, '#8B5CF6', 'CreditCard', true, 'Financeiras'),

-- NÍVEL 3 - CONTAS ANALÍTICAS (APENAS AS NECESSÁRIAS)
-- RECEITAS (SIMPLES)
('1.1.1', 'Vendas de Roupas', 'Vendas de roupas femininas plus size', 'receita', true, 3, 5, '#10B981', 'ShoppingBag', true, 'Vendas principais'),

-- DEDUÇÕES (SIMPLES)
('2.1.1', 'SIMPLES Nacional', 'Imposto SIMPLES Nacional', 'deducao_receita', true, 3, 6, '#EF4444', 'Receipt', true, 'Único imposto'),
('2.2.1', 'Reembolso/Devoluções', 'Reembolsos e devoluções', 'deducao_receita', true, 3, 7, '#EF4444', 'Undo', true, 'Devoluções'),

-- CUSTOS (SIMPLES)
('3.1.1', 'Compra de Mercadoria para Revenda', 'Compras de roupas para revenda', 'custo', true, 3, 8, '#3B82F6', 'Package', true, 'Compras principais'),
('3.2.1', 'Entrega', 'Custos de entrega', 'custo', true, 3, 9, '#3B82F6', 'Truck', true, 'Entregas'),
('3.2.2', 'Motoboy', 'Serviços de motoboy', 'custo', true, 3, 9, '#3B82F6', 'Bike', true, 'Motoboy'),
('3.2.3', 'Embalagens', 'Embalagens e sacolas', 'custo', true, 3, 9, '#3B82F6', 'Package2', true, 'Embalagens'),
('3.2.4', 'Plataformas', 'Custos de plataformas digitais', 'custo', true, 3, 9, '#3B82F6', 'Smartphone', true, 'Plataformas digitais'),

-- DESPESAS COM PESSOAL (CONFORME ERP ATUAL)
('4.1.1', 'Folha de Pagamento', 'Salários e ordenados', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'DollarSign', true, 'Salários'),
('4.1.2', 'Encargos Sociais', 'Encargos sociais', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Shield', true, 'Encargos'),
('4.1.3', 'FGTS', 'Fundo de Garantia', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'PiggyBank', true, 'FGTS'),
('4.1.4', 'Décimo Terceiro Salário', 'Décimo terceiro salário', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Gift', true, '13º salário'),
('4.1.5', 'Vale Refeição', 'Vale refeição funcionários', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Coffee', true, 'VR'),
('4.1.6', 'Vale Transporte', 'Vale transporte funcionários', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Bus', true, 'VT'),
('4.1.7', 'Plano de Saúde', 'Plano de saúde funcionários', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Heart', true, 'Plano de saúde'),
('4.1.8', 'Verbas Rescisórias', 'Verbas rescisórias', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'UserX', true, 'Rescisões'),

-- DESPESAS DA LOJA (CONFORME ERP ATUAL)
('4.2.1', 'Aluguel', 'Aluguel da loja', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Home', true, 'Aluguel'),
('4.2.2', 'Condomínio', 'Taxa de condomínio', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Building', true, 'Condomínio'),
('4.2.3', 'Luz', 'Energia elétrica', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Lightbulb', true, 'Energia'),
('4.2.4', 'Água', 'Conta de água', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Droplets', true, 'Água'),
('4.2.5', 'Telefone', 'Telefone fixo e celular', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Phone', true, 'Telefone'),
('4.2.6', 'Internet', 'Internet da loja', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Wifi', true, 'Internet'),
('4.2.7', 'Segurança', 'Segurança e monitoramento', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Shield', true, 'Segurança'),
('4.2.8', 'Despesas Loja', 'Outras despesas da loja', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Store', true, 'Outras despesas'),
('4.2.9', 'Estrutura Loja', 'Reformas e melhorias', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Hammer', true, 'Estrutura'),
('4.2.10', 'Móveis e Estrutura', 'Móveis e equipamentos', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Sofa', true, 'Móveis'),

-- DESPESAS COMERCIAIS (CONFORME ERP ATUAL)
('4.3.1', 'Marketing', 'Marketing e propaganda', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Target', true, 'Marketing'),
('4.3.2', 'Publicidade', 'Publicidade e anúncios', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Megaphone', true, 'Publicidade'),
('4.3.3', 'Comissões', 'Comissões de vendas', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Percent', true, 'Comissões'),
('4.3.4', 'Cartão de Crédito Empresa', 'Gastos cartão empresa', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'CreditCard', true, 'Cartão empresa'),
('4.3.5', 'Despesas Cartão', 'Taxas de cartão', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'CreditCard', true, 'Taxas cartão'),
('4.3.6', 'Brindes', 'Brindes para clientes', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Gift', true, 'Brindes'),
('4.3.7', 'Premiações', 'Premiações e incentivos', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Award', true, 'Premiações'),

-- DESPESAS ADMINISTRATIVAS (CONFORME ERP ATUAL)
('4.4.1', 'Contabilidade', 'Serviços contábeis', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Calculator', true, 'Contabilidade'),
('4.4.2', 'Honorários', 'Honorários profissionais', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Briefcase', true, 'Honorários'),
('4.4.3', 'Material de Expediente', 'Material de escritório', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Paperclip', true, 'Material escritório'),
('4.4.4', 'Material de Limpeza', 'Produtos de limpeza', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Sparkles', true, 'Limpeza'),
('4.4.5', 'Papelaria', 'Papelaria em geral', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'FileText', true, 'Papelaria'),
('4.4.6', 'Informática', 'Equipamentos de informática', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Monitor', true, 'Informática'),
('4.4.7', 'Software', 'Licenças de software', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Code', true, 'Software'),
('4.4.8', 'Seguros', 'Seguros diversos', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Shield', true, 'Seguros'),
('4.4.9', 'Associação Comercial', 'Taxas associação comercial', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Users', true, 'Associação'),

-- DESPESAS FINANCEIRAS (CONFORME SOLICITADO + ERP ATUAL)
('4.5.1', 'Despesas Bancárias', 'Tarifas e taxas bancárias', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'Banknote', true, 'Despesas bancárias'),
('4.5.2', 'Juros Passivos', 'Juros de empréstimos', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'TrendingDown', true, 'Juros'),
('4.5.3', 'Multas', 'Multas e penalidades', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'AlertTriangle', true, 'Multas'),
('4.5.4', 'Taxas e Emolumentos', 'Taxas e emolumentos diversos', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'Receipt', true, 'Taxas'),
('4.5.5', 'Amortização de Empréstimos', 'Amortização de empréstimos bancários', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'ArrowDown', true, 'Amortização empréstimos'),
('4.5.6', 'Consórcios', 'Parcelas de consórcios', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'Calendar', true, 'Consórcios');