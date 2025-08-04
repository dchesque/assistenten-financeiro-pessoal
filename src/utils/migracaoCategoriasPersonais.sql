-- MIGRAÇÃO COMPLETA: Transformação de ERP Empresarial para Assistente Financeiro Pessoal
-- Execute este script no SQL Editor do Supabase

-- 1. BACKUP e LIMPEZA
-- Criar backup da estrutura atual (opcional)
-- CREATE TABLE plano_contas_backup AS SELECT * FROM plano_contas;

-- Limpar dados antigos
DELETE FROM plano_contas;
ALTER SEQUENCE plano_contas_id_seq RESTART WITH 1;

-- 2. INSERIR NOVA ESTRUTURA DE CATEGORIAS PESSOAIS

-- GRUPOS PRINCIPAIS (Nível 1 - Sintéticos)
INSERT INTO plano_contas (codigo, nome, descricao, cor, icone, nivel, tipo_dre, aceita_lancamento, plano_pai_id, ativo, total_contas, valor_total, created_at, updated_at) VALUES
('1', 'MORADIA', 'Gastos relacionados à habitação e residência', '#8B5CF6', 'Home', 1, 'despesa_pessoal', false, null, true, 0, 0.00, NOW(), NOW()),
('2', 'TRANSPORTE', 'Gastos com locomoção e veículos', '#3B82F6', 'Car', 1, 'despesa_pessoal', false, null, true, 0, 0.00, NOW(), NOW()),
('3', 'ALIMENTAÇÃO', 'Gastos com comida e bebidas', '#10B981', 'UtensilsCrossed', 1, 'despesa_pessoal', false, null, true, 0, 0.00, NOW(), NOW()),
('4', 'SAÚDE E BEM-ESTAR', 'Gastos com saúde, medicina e bem-estar', '#EF4444', 'Heart', 1, 'despesa_pessoal', false, null, true, 0, 0.00, NOW(), NOW()),
('5', 'EDUCAÇÃO E CULTURA', 'Gastos com educação, cursos e cultura', '#F59E0B', 'GraduationCap', 1, 'despesa_pessoal', false, null, true, 0, 0.00, NOW(), NOW()),
('6', 'LAZER E ENTRETENIMENTO', 'Gastos com diversão e entretenimento', '#EC4899', 'Gamepad2', 1, 'despesa_pessoal', false, null, true, 0, 0.00, NOW(), NOW()),
('7', 'CUIDADOS PESSOAIS', 'Gastos com aparência e cuidados pessoais', '#06B6D4', 'Sparkles', 1, 'despesa_pessoal', false, null, true, 0, 0.00, NOW(), NOW()),
('8', 'OUTROS GASTOS', 'Demais gastos não categorizados', '#6B7280', 'Package', 1, 'despesa_pessoal', false, null, true, 0, 0.00, NOW(), NOW());

-- SUBCATEGORIAS (Nível 2 - Analíticas)

-- 1. MORADIA
INSERT INTO plano_contas (codigo, nome, descricao, cor, icone, nivel, tipo_dre, aceita_lancamento, plano_pai_id, ativo, total_contas, valor_total, created_at, updated_at) VALUES
('1.1', 'Aluguel/Financiamento', 'Pagamento de aluguel ou prestações de financiamento habitacional', '#8B5CF6', 'Home', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW()),
('1.2', 'Condomínio', 'Taxa de condomínio e administração predial', '#8B5CF6', 'Building2', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW()),
('1.3', 'Energia Elétrica', 'Conta de luz e energia elétrica', '#8B5CF6', 'Zap', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW()),
('1.4', 'Água e Esgoto', 'Conta de água, esgoto e saneamento', '#8B5CF6', 'Droplets', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW()),
('1.5', 'Gás', 'Gás encanado ou botijão de gás', '#8B5CF6', 'Flame', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW()),
('1.6', 'Internet e TV', 'Planos de internet, TV por assinatura e streaming', '#8B5CF6', 'Wifi', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW()),
('1.7', 'Telefone Fixo', 'Linha telefônica fixa residencial', '#8B5CF6', 'Phone', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW()),
('1.8', 'IPTU', 'Imposto Predial e Territorial Urbano', '#8B5CF6', 'FileText', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW()),
('1.9', 'Reformas e Reparos', 'Manutenção, reformas e reparos na residência', '#8B5CF6', 'Wrench', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW()),
('1.10', 'Móveis e Decoração', 'Compra de móveis, eletrodomésticos e decoração', '#8B5CF6', 'Sofa', 2, 'despesa_pessoal', true, 1, true, 0, 0.00, NOW(), NOW());

-- 2. TRANSPORTE
INSERT INTO plano_contas (codigo, nome, descricao, cor, icone, nivel, tipo_dre, aceita_lancamento, plano_pai_id, ativo, total_contas, valor_total, created_at, updated_at) VALUES
('2.1', 'Combustível', 'Gasolina, álcool, diesel e outros combustíveis', '#3B82F6', 'Fuel', 2, 'despesa_pessoal', true, 2, true, 0, 0.00, NOW(), NOW()),
('2.2', 'Manutenção Veicular', 'Revisões, peças, pneus e manutenção do veículo', '#3B82F6', 'Wrench', 2, 'despesa_pessoal', true, 2, true, 0, 0.00, NOW(), NOW()),
('2.3', 'Seguro Veicular', 'Seguro obrigatório e voluntário do veículo', '#3B82F6', 'Shield', 2, 'despesa_pessoal', true, 2, true, 0, 0.00, NOW(), NOW()),
('2.4', 'IPVA e Licenciamento', 'Impostos e taxas veiculares', '#3B82F6', 'FileText', 2, 'despesa_pessoal', true, 2, true, 0, 0.00, NOW(), NOW()),
('2.5', 'Transporte Público', 'Ônibus, metrô, trem e outros transportes coletivos', '#3B82F6', 'Bus', 2, 'despesa_pessoal', true, 2, true, 0, 0.00, NOW(), NOW()),
('2.6', 'Uber/Táxi', 'Aplicativos de transporte e táxis', '#3B82F6', 'Car', 2, 'despesa_pessoal', true, 2, true, 0, 0.00, NOW(), NOW()),
('2.7', 'Estacionamento', 'Estacionamentos pagos e mensalidades de garagem', '#3B82F6', 'ParkingCircle', 2, 'despesa_pessoal', true, 2, true, 0, 0.00, NOW(), NOW()),
('2.8', 'Multas de Trânsito', 'Multas de trânsito e infrações', '#3B82F6', 'AlertTriangle', 2, 'despesa_pessoal', true, 2, true, 0, 0.00, NOW(), NOW());

-- 3. ALIMENTAÇÃO
INSERT INTO plano_contas (codigo, nome, descricao, cor, icone, nivel, tipo_dre, aceita_lancamento, plano_pai_id, ativo, total_contas, valor_total, created_at, updated_at) VALUES
('3.1', 'Supermercado', 'Compras em supermercados e hipermercados', '#10B981', 'ShoppingCart', 2, 'despesa_pessoal', true, 3, true, 0, 0.00, NOW(), NOW()),
('3.2', 'Restaurantes', 'Refeições em restaurantes e lanchonetes', '#10B981', 'UtensilsCrossed', 2, 'despesa_pessoal', true, 3, true, 0, 0.00, NOW(), NOW()),
('3.3', 'Delivery/iFood', 'Pedidos por aplicativo e delivery', '#10B981', 'Bike', 2, 'despesa_pessoal', true, 3, true, 0, 0.00, NOW(), NOW()),
('3.4', 'Padaria', 'Pães, bolos e produtos de padaria', '#10B981', 'Cookie', 2, 'despesa_pessoal', true, 3, true, 0, 0.00, NOW(), NOW()),
('3.5', 'Lanchonetes', 'Lanches rápidos e fast food', '#10B981', 'Coffee', 2, 'despesa_pessoal', true, 3, true, 0, 0.00, NOW(), NOW()),
('3.6', 'Bebidas', 'Bebidas alcoólicas e não alcoólicas especiais', '#10B981', 'Wine', 2, 'despesa_pessoal', true, 3, true, 0, 0.00, NOW(), NOW());

-- 4. SAÚDE E BEM-ESTAR
INSERT INTO plano_contas (codigo, nome, descricao, cor, icone, nivel, tipo_dre, aceita_lancamento, plano_pai_id, ativo, total_contas, valor_total, created_at, updated_at) VALUES
('4.1', 'Plano de Saúde', 'Mensalidade do plano de saúde', '#EF4444', 'Heart', 2, 'despesa_pessoal', true, 4, true, 0, 0.00, NOW(), NOW()),
('4.2', 'Consultas Médicas', 'Consultas médicas particulares', '#EF4444', 'Stethoscope', 2, 'despesa_pessoal', true, 4, true, 0, 0.00, NOW(), NOW()),
('4.3', 'Exames', 'Exames laboratoriais e de imagem', '#EF4444', 'TestTube', 2, 'despesa_pessoal', true, 4, true, 0, 0.00, NOW(), NOW()),
('4.4', 'Medicamentos', 'Remédios e suplementos', '#EF4444', 'Pill', 2, 'despesa_pessoal', true, 4, true, 0, 0.00, NOW(), NOW()),
('4.5', 'Odontologia', 'Tratamentos dentários e ortodontia', '#EF4444', 'SmilePlus', 2, 'despesa_pessoal', true, 4, true, 0, 0.00, NOW(), NOW()),
('4.6', 'Academia/Exercícios', 'Academia, personal trainer e atividades físicas', '#EF4444', 'Dumbbell', 2, 'despesa_pessoal', true, 4, true, 0, 0.00, NOW(), NOW()),
('4.7', 'Terapias', 'Psicólogo, fisioterapeuta e outras terapias', '#EF4444', 'Brain', 2, 'despesa_pessoal', true, 4, true, 0, 0.00, NOW(), NOW());

-- 5. EDUCAÇÃO E CULTURA
INSERT INTO plano_contas (codigo, nome, descricao, cor, icone, nivel, tipo_dre, aceita_lancamento, plano_pai_id, ativo, total_contas, valor_total, created_at, updated_at) VALUES
('5.1', 'Cursos', 'Cursos profissionalizantes, idiomas e especializações', '#F59E0B', 'GraduationCap', 2, 'despesa_pessoal', true, 5, true, 0, 0.00, NOW(), NOW()),
('5.2', 'Livros', 'Livros físicos e digitais', '#F59E0B', 'Book', 2, 'despesa_pessoal', true, 5, true, 0, 0.00, NOW(), NOW()),
('5.3', 'Material Escolar', 'Material para estudos e trabalho', '#F59E0B', 'PenTool', 2, 'despesa_pessoal', true, 5, true, 0, 0.00, NOW(), NOW()),
('5.4', 'Mensalidades', 'Mensalidades escolares e universitárias', '#F59E0B', 'School', 2, 'despesa_pessoal', true, 5, true, 0, 0.00, NOW(), NOW()),
('5.5', 'Eventos Culturais', 'Teatro, shows, museus e eventos culturais', '#F59E0B', 'Music', 2, 'despesa_pessoal', true, 5, true, 0, 0.00, NOW(), NOW());

-- 6. LAZER E ENTRETENIMENTO
INSERT INTO plano_contas (codigo, nome, descricao, cor, icone, nivel, tipo_dre, aceita_lancamento, plano_pai_id, ativo, total_contas, valor_total, created_at, updated_at) VALUES
('6.1', 'Cinema', 'Ingressos de cinema e pipoca', '#EC4899', 'Film', 2, 'despesa_pessoal', true, 6, true, 0, 0.00, NOW(), NOW()),
('6.2', 'Viagens', 'Passagens, hospedagem e gastos em viagens', '#EC4899', 'Plane', 2, 'despesa_pessoal', true, 6, true, 0, 0.00, NOW(), NOW()),
('6.3', 'Streaming', 'Netflix, Amazon Prime, Spotify e outros', '#EC4899', 'Tv', 2, 'despesa_pessoal', true, 6, true, 0, 0.00, NOW(), NOW()),
('6.4', 'Jogos', 'Games, consoles e jogos digitais', '#EC4899', 'Gamepad2', 2, 'despesa_pessoal', true, 6, true, 0, 0.00, NOW(), NOW()),
('6.5', 'Hobbies', 'Materiais e equipamentos para hobbies', '#EC4899', 'Palette', 2, 'despesa_pessoal', true, 6, true, 0, 0.00, NOW(), NOW()),
('6.6', 'Festas/Eventos', 'Festas, baladas e eventos sociais', '#EC4899', 'PartyPopper', 2, 'despesa_pessoal', true, 6, true, 0, 0.00, NOW(), NOW());

-- 7. CUIDADOS PESSOAIS
INSERT INTO plano_contas (codigo, nome, descricao, cor, icone, nivel, tipo_dre, aceita_lancamento, plano_pai_id, ativo, total_contas, valor_total, created_at, updated_at) VALUES
('7.1', 'Roupas', 'Roupas e vestuário em geral', '#06B6D4', 'Shirt', 2, 'despesa_pessoal', true, 7, true, 0, 0.00, NOW(), NOW()),
('7.2', 'Calçados', 'Sapatos, tênis e outros calçados', '#06B6D4', 'FootPrints', 2, 'despesa_pessoal', true, 7, true, 0, 0.00, NOW(), NOW()),
('7.3', 'Cabeleireiro', 'Corte de cabelo, tratamentos capilares', '#06B6D4', 'Scissors', 2, 'despesa_pessoal', true, 7, true, 0, 0.00, NOW(), NOW()),
('7.4', 'Cosméticos', 'Produtos de beleza e maquiagem', '#06B6D4', 'Sparkles', 2, 'despesa_pessoal', true, 7, true, 0, 0.00, NOW(), NOW()),
('7.5', 'Perfumes', 'Perfumes e produtos de higiene especiais', '#06B6D4', 'Flower', 2, 'despesa_pessoal', true, 7, true, 0, 0.00, NOW(), NOW()),
('7.6', 'Acessórios', 'Bolsas, relógios, joias e acessórios', '#06B6D4', 'Watch', 2, 'despesa_pessoal', true, 7, true, 0, 0.00, NOW(), NOW());

-- 8. OUTROS GASTOS
INSERT INTO plano_contas (codigo, nome, descricao, cor, icone, nivel, tipo_dre, aceita_lancamento, plano_pai_id, ativo, total_contas, valor_total, created_at, updated_at) VALUES
('8.1', 'Presentes', 'Presentes para família e amigos', '#6B7280', 'Gift', 2, 'despesa_pessoal', true, 8, true, 0, 0.00, NOW(), NOW()),
('8.2', 'Doações', 'Doações e contribuições beneficentes', '#6B7280', 'Heart', 2, 'despesa_pessoal', true, 8, true, 0, 0.00, NOW(), NOW()),
('8.3', 'Cartório/Documentos', 'Taxas de cartório e documentos', '#6B7280', 'FileText', 2, 'despesa_pessoal', true, 8, true, 0, 0.00, NOW(), NOW()),
('8.4', 'Impostos Pessoais', 'IR, IPF e outros impostos pessoais', '#6B7280', 'Receipt', 2, 'despesa_pessoal', true, 8, true, 0, 0.00, NOW(), NOW()),
('8.5', 'Seguros Pessoais', 'Seguro de vida, residencial e outros', '#6B7280', 'Shield', 2, 'despesa_pessoal', true, 8, true, 0, 0.00, NOW(), NOW()),
('8.6', 'Diversos', 'Gastos não categorizados em outras contas', '#6B7280', 'Package', 2, 'despesa_pessoal', true, 8, true, 0, 0.00, NOW(), NOW());

-- 3. ATUALIZAR ESTRUTURA DA TABELA (se necessário)
-- Adicionar tipo_dre = 'despesa_pessoal' se não existir
-- ALTER TABLE plano_contas DROP CONSTRAINT IF EXISTS plano_contas_tipo_dre_check;
-- ALTER TABLE plano_contas ADD CONSTRAINT plano_contas_tipo_dre_check 
--   CHECK (tipo_dre IN ('despesa_pessoal'));

-- 4. ATUALIZAR RELACIONAMENTOS
-- Remover vínculos antigos que não fazem mais sentido
UPDATE fornecedores SET categoria_padrao_id = NULL WHERE categoria_padrao_id NOT IN (SELECT id FROM plano_contas);

-- 5. VERIFICAÇÃO FINAL
SELECT 
    'Migração concluída com sucesso!' as status,
    COUNT(*) as total_categorias,
    COUNT(CASE WHEN nivel = 1 THEN 1 END) as grupos_principais,
    COUNT(CASE WHEN nivel = 2 THEN 1 END) as subcategorias
FROM plano_contas 
WHERE ativo = true;