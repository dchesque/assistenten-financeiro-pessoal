-- Limpar tabela atual
DELETE FROM plano_contas;

-- Resetar sequence
ALTER SEQUENCE plano_contas_id_seq RESTART WITH 1;

-- Inserir estrutura CORRETA e SIMPLIFICADA (sem a coluna descricao)
INSERT INTO plano_contas (codigo, nome, tipo_dre, aceita_lancamento, nivel, plano_pai_id, cor, icone, ativo, observacoes) VALUES

-- NÍVEL 1 - GRUPOS PRINCIPAIS
('1', 'RECEITAS', 'receita', false, 1, NULL, '#10B981', 'TrendingUp', true, 'Receitas operacionais'),
('2', 'DEDUÇÕES DA RECEITA', 'deducao_receita', false, 1, NULL, '#EF4444', 'TrendingDown', true, 'Impostos e devoluções'),
('3', 'CUSTOS DOS PRODUTOS VENDIDOS', 'custo', false, 1, NULL, '#3B82F6', 'Package', true, 'Custo dos produtos vendidos'),
('4', 'DESPESAS OPERACIONAIS', 'despesa_operacional', false, 1, NULL, '#8B5CF6', 'Receipt', true, 'Despesas operacionais'),

-- NÍVEL 2 - SUBGRUPOS
('1.1', 'Receita Operacional Bruta', 'receita', false, 2, 1, '#10B981', 'ShoppingCart', true, 'Vendas de roupas'),
('2.1', 'Impostos sobre Vendas', 'deducao_receita', false, 2, 2, '#EF4444', 'FileText', true, 'Impostos'),
('2.2', 'Devoluções e Cancelamentos', 'deducao_receita', false, 2, 2, '#EF4444', 'RotateCcw', true, 'Devoluções'),
('3.1', 'Compra de Mercadorias', 'custo', false, 2, 3, '#3B82F6', 'ShoppingBag', true, 'Compras'),
('3.2', 'Logística', 'custo', false, 2, 3, '#3B82F6', 'Truck', true, 'Logística'),
('4.1', 'Despesas com Pessoal', 'despesa_operacional', false, 2, 4, '#8B5CF6', 'Users', true, 'Pessoal'),
('4.2', 'Despesas da Loja', 'despesa_operacional', false, 2, 4, '#8B5CF6', 'Store', true, 'Loja'),
('4.3', 'Despesas Comerciais', 'despesa_comercial', false, 2, 4, '#8B5CF6', 'Megaphone', true, 'Comerciais'),
('4.4', 'Despesas Administrativas', 'despesa_administrativa', false, 2, 4, '#8B5CF6', 'FileText', true, 'Administrativas'),
('4.5', 'Despesas Financeiras', 'despesa_financeira', false, 2, 4, '#8B5CF6', 'CreditCard', true, 'Financeiras'),

-- NÍVEL 3 - CONTAS ANALÍTICAS (APENAS AS NECESSÁRIAS)
-- RECEITAS (SIMPLES)
('1.1.1', 'Vendas de Roupas', 'receita', true, 3, 5, '#10B981', 'ShoppingBag', true, 'Vendas principais'),

-- DEDUÇÕES (SIMPLES)
('2.1.1', 'SIMPLES Nacional', 'deducao_receita', true, 3, 6, '#EF4444', 'Receipt', true, 'Único imposto'),
('2.2.1', 'Reembolso/Devoluções', 'deducao_receita', true, 3, 7, '#EF4444', 'Undo', true, 'Devoluções'),

-- CUSTOS (SIMPLES)
('3.1.1', 'Compra de Mercadoria para Revenda', 'custo', true, 3, 8, '#3B82F6', 'Package', true, 'Compras principais'),
('3.2.1', 'Entrega', 'custo', true, 3, 9, '#3B82F6', 'Truck', true, 'Entregas'),
('3.2.2', 'Motoboy', 'custo', true, 3, 9, '#3B82F6', 'Bike', true, 'Motoboy'),
('3.2.3', 'Embalagens', 'custo', true, 3, 9, '#3B82F6', 'Package2', true, 'Embalagens'),
('3.2.4', 'Plataformas', 'custo', true, 3, 9, '#3B82F6', 'Smartphone', true, 'Plataformas digitais'),

-- DESPESAS COM PESSOAL
('4.1.1', 'Folha de Pagamento', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'DollarSign', true, 'Salários'),
('4.1.2', 'Encargos Sociais', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Shield', true, 'Encargos'),
('4.1.3', 'FGTS', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'PiggyBank', true, 'FGTS'),
('4.1.4', 'Décimo Terceiro Salário', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Gift', true, '13º salário'),
('4.1.5', 'Vale Refeição', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Coffee', true, 'VR'),
('4.1.6', 'Vale Transporte', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Bus', true, 'VT'),
('4.1.7', 'Plano de Saúde', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'Heart', true, 'Plano de saúde'),
('4.1.8', 'Verbas Rescisórias', 'despesa_operacional', true, 3, 10, '#8B5CF6', 'UserX', true, 'Rescisões'),

-- DESPESAS DA LOJA
('4.2.1', 'Aluguel', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Home', true, 'Aluguel'),
('4.2.2', 'Condomínio', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Building', true, 'Condomínio'),
('4.2.3', 'Luz', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Lightbulb', true, 'Energia'),
('4.2.4', 'Água', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Droplets', true, 'Água'),
('4.2.5', 'Telefone', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Phone', true, 'Telefone'),
('4.2.6', 'Internet', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Wifi', true, 'Internet'),
('4.2.7', 'Segurança', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Shield', true, 'Segurança'),
('4.2.8', 'Despesas Loja', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Store', true, 'Outras despesas'),
('4.2.9', 'Estrutura Loja', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Hammer', true, 'Estrutura'),
('4.2.10', 'Móveis e Estrutura', 'despesa_operacional', true, 3, 11, '#8B5CF6', 'Sofa', true, 'Móveis'),

-- DESPESAS COMERCIAIS
('4.3.1', 'Marketing', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Target', true, 'Marketing'),
('4.3.2', 'Publicidade', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Megaphone', true, 'Publicidade'),
('4.3.3', 'Comissões', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Percent', true, 'Comissões'),
('4.3.4', 'Cartão de Crédito Empresa', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'CreditCard', true, 'Cartão empresa'),
('4.3.5', 'Despesas Cartão', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'CreditCard', true, 'Taxas cartão'),
('4.3.6', 'Brindes', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Gift', true, 'Brindes'),
('4.3.7', 'Premiações', 'despesa_comercial', true, 3, 12, '#8B5CF6', 'Award', true, 'Premiações'),

-- DESPESAS ADMINISTRATIVAS
('4.4.1', 'Contabilidade', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Calculator', true, 'Contabilidade'),
('4.4.2', 'Honorários', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Briefcase', true, 'Honorários'),
('4.4.3', 'Material de Expediente', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Paperclip', true, 'Material escritório'),
('4.4.4', 'Material de Limpeza', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Sparkles', true, 'Limpeza'),
('4.4.5', 'Papelaria', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'FileText', true, 'Papelaria'),
('4.4.6', 'Informática', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Monitor', true, 'Informática'),
('4.4.7', 'Software', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Code', true, 'Software'),
('4.4.8', 'Seguros', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Shield', true, 'Seguros'),
('4.4.9', 'Associação Comercial', 'despesa_administrativa', true, 3, 13, '#8B5CF6', 'Users', true, 'Associação'),

-- DESPESAS FINANCEIRAS
('4.5.1', 'Despesas Bancárias', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'Banknote', true, 'Despesas bancárias'),
('4.5.2', 'Juros Passivos', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'TrendingDown', true, 'Juros'),
('4.5.3', 'Multas', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'AlertTriangle', true, 'Multas'),
('4.5.4', 'Taxas e Emolumentos', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'Receipt', true, 'Taxas'),
('4.5.5', 'Amortização de Empréstimos', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'ArrowDown', true, 'Amortização empréstimos'),
('4.5.6', 'Consórcios', 'despesa_financeira', true, 3, 14, '#8B5CF6', 'Calendar', true, 'Consórcios');