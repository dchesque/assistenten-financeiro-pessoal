-- Migration 6: Configurar RLS (Row Level Security)

-- Habilitar RLS em todas as tabelas
ALTER TABLE plano_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir tudo por enquanto - ajustar depois)
CREATE POLICY "Allow all operations" ON plano_contas FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON fornecedores FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON bancos FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON contas_pagar FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON cheques FOR ALL USING (true);