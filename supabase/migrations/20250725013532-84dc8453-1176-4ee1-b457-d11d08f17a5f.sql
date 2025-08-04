-- Limpar dados existentes e resetar estrutura
DELETE FROM plano_contas;
ALTER SEQUENCE plano_contas_id_seq RESTART WITH 1;

-- Inserir novo plano de contas para loja de roupas femininas plus size
INSERT INTO plano_contas (codigo, nome, plano_pai_id, nivel, tipo_dre, aceita_lancamento, cor, icone, observacoes) VALUES

-- NÍVEL 1: CONTAS PRINCIPAIS
('1', 'RECEITAS', NULL, 1, 'receita', false, '#10B981', 'TrendingUp', 'Receitas operacionais e não operacionais'),
('2', 'DEDUÇÕES DA RECEITA', NULL, 1, 'deducao_receita', false, '#EF4444', 'TrendingDown', 'Impostos, devoluções e abatimentos'),
('3', 'CUSTOS', NULL, 1, 'custo', false, '#3B82F6', 'Package', 'Custo dos produtos vendidos'),
('4', 'DESPESAS ADMINISTRATIVAS', NULL, 1, 'despesa_administrativa', false, '#8B5CF6', 'Building', 'Despesas administrativas e gerais'),
('5', 'DESPESAS COMERCIAIS', NULL, 1, 'despesa_comercial', false, '#EC4899', 'Megaphone', 'Despesas com vendas e marketing'),
('6', 'DESPESAS FINANCEIRAS', NULL, 1, 'despesa_financeira', false, '#F59E0B', 'CreditCard', 'Despesas e receitas financeiras'),

-- NÍVEL 2: SUBGRUPOS DE RECEITAS
('1.1', 'Receita Bruta de Vendas', 1, 2, 'receita', false, '#10B981', 'ShoppingBag', 'Vendas de produtos e serviços'),
('1.2', 'Outras Receitas Operacionais', 1, 2, 'receita', false, '#059669', 'Plus', 'Receitas operacionais diversas'),

-- NÍVEL 2: SUBGRUPOS DE DEDUÇÕES
('2.1', 'Impostos sobre Vendas', 2, 2, 'deducao_receita', false, '#DC2626', 'Receipt', 'Impostos incidentes sobre vendas'),
('2.2', 'Devoluções e Abatimentos', 2, 2, 'deducao_receita', false, '#B91C1C', 'RotateCcw', 'Devoluções de mercadorias e abatimentos'),

-- NÍVEL 2: SUBGRUPOS DE CUSTOS
('3.1', 'Custo das Mercadorias Vendidas', 3, 2, 'custo', false, '#2563EB', 'Package', 'Custo direto das mercadorias'),
('3.2', 'Custos Diretos de Produção', 3, 2, 'custo', false, '#1D4ED8', 'Factory', 'Custos diretos relacionados à produção'),

-- NÍVEL 2: SUBGRUPOS DE DESPESAS ADMINISTRATIVAS
('4.1', 'Pessoal Administrativo', 4, 2, 'despesa_administrativa', false, '#7C3AED', 'Users', 'Salários e encargos administrativos'),
('4.2', 'Ocupação e Funcionamento', 4, 2, 'despesa_administrativa', false, '#6D28D9', 'Building', 'Despesas de ocupação do estabelecimento'),
('4.3', 'Serviços de Terceiros', 4, 2, 'despesa_administrativa', false, '#5B21B6', 'Wrench', 'Serviços prestados por terceiros'),
('4.4', 'Despesas Gerais', 4, 2, 'despesa_administrativa', false, '#4C1D95', 'MoreHorizontal', 'Outras despesas administrativas'),

-- NÍVEL 2: SUBGRUPOS DE DESPESAS COMERCIAIS
('5.1', 'Marketing e Publicidade', 5, 2, 'despesa_comercial', false, '#DB2777', 'Megaphone', 'Investimentos em marketing'),
('5.2', 'Comissões de Vendas', 5, 2, 'despesa_comercial', false, '#BE185D', 'Percent', 'Comissões pagas aos vendedores'),
('5.3', 'Logística e Entrega', 5, 2, 'despesa_comercial', false, '#9D174D', 'Truck', 'Custos com frete e logística'),

-- NÍVEL 2: SUBGRUPOS DE DESPESAS FINANCEIRAS
('6.1', 'Despesas Financeiras', 6, 2, 'despesa_financeira', false, '#D97706', 'CreditCard', 'Juros e encargos pagos'),
('6.2', 'Receitas Financeiras', 6, 2, 'despesa_financeira', false, '#92400E', 'PiggyBank', 'Juros e rendimentos recebidos'),

-- NÍVEL 3: CONTAS ANALÍTICAS DE RECEITAS
('1.1.001', 'Vendas de Roupas Plus Size', 7, 3, 'receita', true, '#10B981', 'ShoppingBag', 'Vendas de roupas femininas plus size'),
('1.1.002', 'Vendas de Acessórios', 7, 3, 'receita', true, '#059669', 'Watch', 'Vendas de acessórios femininos'),
('1.1.003', 'Vendas de Calçados', 7, 3, 'receita', true, '#047857', 'Footprints', 'Vendas de calçados femininos'),
('1.1.004', 'Vendas Online', 7, 3, 'receita', true, '#065F46', 'Smartphone', 'Vendas através de e-commerce'),
('1.1.005', 'Vendas na Loja Física', 7, 3, 'receita', true, '#064E3B', 'Store', 'Vendas presenciais'),

('1.2.001', 'Receita de Serviços de Ajuste', 8, 3, 'receita', true, '#059669', 'Scissors', 'Serviços de costura e ajustes'),
('1.2.002', 'Receita de Aluguel de Espaço', 8, 3, 'receita', true, '#047857', 'Home', 'Aluguel de espaços para terceiros'),

-- NÍVEL 3: CONTAS ANALÍTICAS DE DEDUÇÕES
('2.1.001', 'ICMS sobre Vendas', 9, 3, 'deducao_receita', true, '#DC2626', 'Receipt', 'ICMS incidente sobre vendas'),
('2.1.002', 'PIS sobre Vendas', 9, 3, 'deducao_receita', true, '#B91C1C', 'FileText', 'PIS incidente sobre vendas'),
('2.1.003', 'COFINS sobre Vendas', 9, 3, 'deducao_receita', true, '#991B1B', 'Calculator', 'COFINS incidente sobre vendas'),
('2.1.004', 'Simples Nacional', 9, 3, 'deducao_receita', true, '#7F1D1D', 'Building', 'Imposto Simples Nacional'),

('2.2.001', 'Devoluções de Vendas', 10, 3, 'deducao_receita', true, '#B91C1C', 'RotateCcw', 'Devoluções de mercadorias vendidas'),
('2.2.002', 'Descontos Concedidos', 10, 3, 'deducao_receita', true, '#991B1B', 'Percent', 'Descontos dados aos clientes'),

-- NÍVEL 3: CONTAS ANALÍTICAS DE CUSTOS
('3.1.001', 'Compra de Roupas Plus Size', 11, 3, 'custo', true, '#2563EB', 'Package', 'Aquisição de roupas para revenda'),
('3.1.002', 'Compra de Acessórios', 11, 3, 'custo', true, '#1D4ED8', 'Watch', 'Aquisição de acessórios'),
('3.1.003', 'Compra de Calçados', 11, 3, 'custo', true, '#1E40AF', 'Footprints', 'Aquisição de calçados'),
('3.1.004', 'Frete sobre Compras', 11, 3, 'custo', true, '#1E3A8A', 'Truck', 'Frete pago nas compras'),
('3.1.005', 'Impostos sobre Compras', 11, 3, 'custo', true, '#1E3A8A', 'Receipt', 'Impostos incidentes nas compras'),

('3.2.001', 'Mão de Obra Direta', 12, 3, 'custo', true, '#1D4ED8', 'Users', 'Custos com pessoal de produção'),
('3.2.002', 'Material de Embalagem', 12, 3, 'custo', true, '#1E40AF', 'Package2', 'Materiais para embalagem'),

-- NÍVEL 3: CONTAS ANALÍTICAS DE DESPESAS ADMINISTRATIVAS
('4.1.001', 'Salários Administrativos', 13, 3, 'despesa_administrativa', true, '#7C3AED', 'Users', 'Salários do pessoal administrativo'),
('4.1.002', 'Encargos Sociais', 13, 3, 'despesa_administrativa', true, '#6D28D9', 'Shield', 'INSS, FGTS e outros encargos'),
('4.1.003', 'Benefícios', 13, 3, 'despesa_administrativa', true, '#5B21B6', 'Heart', 'Vale alimentação, plano saúde'),

('4.2.001', 'Aluguel da Loja', 14, 3, 'despesa_administrativa', true, '#6D28D9', 'Building', 'Aluguel do ponto comercial'),
('4.2.002', 'Energia Elétrica', 14, 3, 'despesa_administrativa', true, '#5B21B6', 'Zap', 'Conta de energia elétrica'),
('4.2.003', 'Água e Esgoto', 14, 3, 'despesa_administrativa', true, '#4C1D95', 'Droplets', 'Conta de água e esgoto'),
('4.2.004', 'Telefone e Internet', 14, 3, 'despesa_administrativa', true, '#3730A3', 'Phone', 'Comunicações'),
('4.2.005', 'Segurança', 14, 3, 'despesa_administrativa', true, '#312E81', 'Shield', 'Segurança e monitoramento'),
('4.2.006', 'Limpeza e Conservação', 14, 3, 'despesa_administrativa', true, '#1E1B4B', 'Sparkles', 'Serviços de limpeza'),

('4.3.001', 'Contabilidade', 15, 3, 'despesa_administrativa', true, '#5B21B6', 'Calculator', 'Serviços contábeis'),
('4.3.002', 'Jurídico', 15, 3, 'despesa_administrativa', true, '#4C1D95', 'Scale', 'Serviços jurídicos'),
('4.3.003', 'Consultoria', 15, 3, 'despesa_administrativa', true, '#3730A3', 'Users', 'Consultorias diversas'),
('4.3.004', 'Sistema de Gestão', 15, 3, 'despesa_administrativa', true, '#312E81', 'Monitor', 'Software de gestão'),

('4.4.001', 'Material de Escritório', 16, 3, 'despesa_administrativa', true, '#4C1D95', 'FileText', 'Papelaria e material de escritório'),
('4.4.002', 'Depreciação', 16, 3, 'despesa_administrativa', true, '#3730A3', 'TrendingDown', 'Depreciação de bens'),
('4.4.003', 'Seguros', 16, 3, 'despesa_administrativa', true, '#312E81', 'Shield', 'Seguros diversos'),
('4.4.004', 'Taxas e Licenças', 16, 3, 'despesa_administrativa', true, '#1E1B4B', 'FileCheck', 'Taxas municipais e licenças'),

-- NÍVEL 3: CONTAS ANALÍTICAS DE DESPESAS COMERCIAIS
('5.1.001', 'Publicidade Online', 17, 3, 'despesa_comercial', true, '#DB2777', 'Smartphone', 'Facebook, Instagram, Google Ads'),
('5.1.002', 'Marketing de Influência', 17, 3, 'despesa_comercial', true, '#BE185D', 'Users', 'Parcerias com influenciadoras'),
('5.1.003', 'Material Promocional', 17, 3, 'despesa_comercial', true, '#9D174D', 'Gift', 'Brindes e materiais promocionais'),
('5.1.004', 'Eventos e Desfiles', 17, 3, 'despesa_comercial', true, '#831843', 'Calendar', 'Participação em eventos'),
('5.1.005', 'Fotos e Catálogos', 17, 3, 'despesa_comercial', true, '#701A75', 'Camera', 'Fotografia de produtos'),

('5.2.001', 'Comissões Vendedores', 18, 3, 'despesa_comercial', true, '#BE185D', 'Percent', 'Comissões pagas aos vendedores'),
('5.2.002', 'Prêmios e Incentivos', 18, 3, 'despesa_comercial', true, '#9D174D', 'Award', 'Premiações por metas'),

('5.3.001', 'Frete de Entrega', 19, 3, 'despesa_comercial', true, '#9D174D', 'Truck', 'Frete pago nas entregas'),
('5.3.002', 'Embalagens de Entrega', 19, 3, 'despesa_comercial', true, '#831843', 'Package', 'Embalagens para envio'),
('5.3.003', 'Taxa de Marketplace', 19, 3, 'despesa_comercial', true, '#701A75', 'Store', 'Taxas de plataformas de venda'),

-- NÍVEL 3: CONTAS ANALÍTICAS DE DESPESAS FINANCEIRAS
('6.1.001', 'Juros de Financiamentos', 20, 3, 'despesa_financeira', true, '#D97706', 'CreditCard', 'Juros pagos em financiamentos'),
('6.1.002', 'Tarifas Bancárias', 20, 3, 'despesa_financeira', true, '#B45309', 'Building', 'Tarifas e taxas bancárias'),
('6.1.003', 'IOF', 20, 3, 'despesa_financeira', true, '#92400E', 'Receipt', 'Imposto sobre operações financeiras'),
('6.1.004', 'Taxas de Cartão', 20, 3, 'despesa_financeira', true, '#78350F', 'CreditCard', 'Taxas de máquinas de cartão'),

('6.2.001', 'Juros de Aplicações', 21, 3, 'despesa_financeira', true, '#92400E', 'PiggyBank', 'Rendimentos de aplicações'),
('6.2.002', 'Descontos Obtidos', 21, 3, 'despesa_financeira', true, '#78350F', 'Percent', 'Descontos recebidos de fornecedores');

-- Atualizar totais após inserção
SELECT atualizar_totais_plano_pai(id) FROM plano_contas WHERE nivel = 3;