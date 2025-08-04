-- Criar tabelas para movimentações bancárias e OFX

-- Tabela para movimentações bancárias manuais
CREATE TABLE public.movimentacoes_bancarias (
  id SERIAL PRIMARY KEY,
  banco_id INTEGER NOT NULL REFERENCES public.bancos(id) ON DELETE CASCADE,
  data_movimentacao DATE NOT NULL,
  tipo_movimentacao VARCHAR(20) NOT NULL, -- 'entrada', 'saida'
  valor NUMERIC(15,2) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(100),
  documento_referencia VARCHAR(100),
  observacoes TEXT,
  saldo_anterior NUMERIC(15,2),
  saldo_posterior NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT true
);

-- Tabela para dados OFX importados
CREATE TABLE public.movimentacoes_ofx (
  id SERIAL PRIMARY KEY,
  banco_id INTEGER NOT NULL REFERENCES public.bancos(id) ON DELETE CASCADE,
  data_processamento TIMESTAMPTZ DEFAULT NOW(),
  nome_arquivo VARCHAR(255) NOT NULL,
  conteudo_ofx TEXT NOT NULL,
  total_movimentacoes INTEGER DEFAULT 0,
  periodo_inicio DATE,
  periodo_fim DATE,
  status_processamento VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'processado', 'erro'
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para itens individuais do OFX
CREATE TABLE public.itens_ofx (
  id SERIAL PRIMARY KEY,
  movimentacao_ofx_id INTEGER NOT NULL REFERENCES public.movimentacoes_ofx(id) ON DELETE CASCADE,
  data_transacao DATE NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  tipo_transacao VARCHAR(20) NOT NULL, -- 'debito', 'credito'
  descricao TEXT,
  documento VARCHAR(100),
  codigo_banco VARCHAR(10),
  agencia VARCHAR(10),
  conta VARCHAR(20),
  saldo NUMERIC(15,2),
  conciliado BOOLEAN DEFAULT false,
  movimentacao_bancaria_id INTEGER REFERENCES public.movimentacoes_bancarias(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_movimentacoes_bancarias_banco_id ON public.movimentacoes_bancarias(banco_id);
CREATE INDEX idx_movimentacoes_bancarias_data ON public.movimentacoes_bancarias(data_movimentacao);
CREATE INDEX idx_movimentacoes_bancarias_tipo ON public.movimentacoes_bancarias(tipo_movimentacao);
CREATE INDEX idx_movimentacoes_bancarias_ativo ON public.movimentacoes_bancarias(ativo);

CREATE INDEX idx_movimentacoes_ofx_banco_id ON public.movimentacoes_ofx(banco_id);
CREATE INDEX idx_movimentacoes_ofx_status ON public.movimentacoes_ofx(status_processamento);
CREATE INDEX idx_movimentacoes_ofx_data ON public.movimentacoes_ofx(data_processamento);

CREATE INDEX idx_itens_ofx_movimentacao_id ON public.itens_ofx(movimentacao_ofx_id);
CREATE INDEX idx_itens_ofx_data ON public.itens_ofx(data_transacao);
CREATE INDEX idx_itens_ofx_conciliado ON public.itens_ofx(conciliado);

-- Criar triggers para updated_at
CREATE TRIGGER update_movimentacoes_bancarias_updated_at
  BEFORE UPDATE ON public.movimentacoes_bancarias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movimentacoes_ofx_updated_at
  BEFORE UPDATE ON public.movimentacoes_ofx
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.movimentacoes_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_ofx ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_ofx ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para movimentacoes_bancarias
CREATE POLICY "Usuários podem ver todas as movimentações bancárias" 
  ON public.movimentacoes_bancarias 
  FOR SELECT 
  USING (true);

CREATE POLICY "Usuários podem inserir movimentações bancárias" 
  ON public.movimentacoes_bancarias 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar movimentações bancárias" 
  ON public.movimentacoes_bancarias 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Usuários podem excluir movimentações bancárias" 
  ON public.movimentacoes_bancarias 
  FOR DELETE 
  USING (true);

-- Criar políticas RLS para movimentacoes_ofx
CREATE POLICY "Usuários podem ver todas as movimentações OFX" 
  ON public.movimentacoes_ofx 
  FOR SELECT 
  USING (true);

CREATE POLICY "Usuários podem inserir movimentações OFX" 
  ON public.movimentacoes_ofx 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar movimentações OFX" 
  ON public.movimentacoes_ofx 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Usuários podem excluir movimentações OFX" 
  ON public.movimentacoes_ofx 
  FOR DELETE 
  USING (true);

-- Criar políticas RLS para itens_ofx
CREATE POLICY "Usuários podem ver todos os itens OFX" 
  ON public.itens_ofx 
  FOR SELECT 
  USING (true);

CREATE POLICY "Usuários podem inserir itens OFX" 
  ON public.itens_ofx 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar itens OFX" 
  ON public.itens_ofx 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Usuários podem excluir itens OFX" 
  ON public.itens_ofx 
  FOR DELETE 
  USING (true);

-- Função para atualizar saldo do banco após movimentação
CREATE OR REPLACE FUNCTION public.atualizar_saldo_banco()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar saldo atual do banco
  UPDATE public.bancos 
  SET saldo_atual = (
    SELECT 
      COALESCE(saldo_inicial, 0) + 
      COALESCE(SUM(
        CASE 
          WHEN tipo_movimentacao = 'entrada' THEN valor 
          ELSE -valor 
        END
      ), 0)
    FROM public.movimentacoes_bancarias 
    WHERE banco_id = NEW.banco_id AND ativo = true
  )
  WHERE id = NEW.banco_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar saldo automaticamente
CREATE TRIGGER trigger_atualizar_saldo_banco
  AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_bancarias
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_saldo_banco();

-- Inserir dados de exemplo para movimentações bancárias
INSERT INTO public.movimentacoes_bancarias (banco_id, data_movimentacao, tipo_movimentacao, valor, descricao, categoria) VALUES
(1, '2024-01-15', 'entrada', 5000.00, 'Depósito inicial', 'Capital'),
(1, '2024-01-16', 'saida', 1200.50, 'Pagamento fornecedor XYZ', 'Fornecedores'),
(1, '2024-01-17', 'entrada', 2500.00, 'Recebimento cliente ABC', 'Vendas'),
(1, '2024-01-18', 'saida', 800.00, 'Taxa bancária', 'Taxas');