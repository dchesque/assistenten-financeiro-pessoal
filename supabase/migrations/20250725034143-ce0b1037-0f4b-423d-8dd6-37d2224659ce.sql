-- Adicionar colunas que estão faltando na tabela bancos
ALTER TABLE public.bancos 
ADD COLUMN IF NOT EXISTS digito_verificador VARCHAR(2),
ADD COLUMN IF NOT EXISTS suporta_ofx BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS url_ofx TEXT,
ADD COLUMN IF NOT EXISTS ultimo_fitid TEXT,
ADD COLUMN IF NOT EXISTS data_ultima_sincronizacao TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gerente VARCHAR(255),
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS limite NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS limite_usado NUMERIC DEFAULT 0;

-- Criar tabela para movimentações bancárias OFX se não existir
CREATE TABLE IF NOT EXISTS public.movimentacoes_bancarias_ofx (
  id SERIAL PRIMARY KEY,
  banco_id INTEGER NOT NULL REFERENCES public.bancos(id) ON DELETE CASCADE,
  fitid VARCHAR(255) UNIQUE,
  data_transacao DATE NOT NULL,
  data_processamento DATE NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('debito', 'credito')),
  valor NUMERIC(15,2) NOT NULL,
  descricao TEXT NOT NULL,
  categoria_automatica VARCHAR(255),
  conta_pagar_id INTEGER REFERENCES public.contas_pagar(id),
  origem VARCHAR(20) DEFAULT 'ofx' CHECK (origem IN ('manual', 'ofx')),
  status_conciliacao VARCHAR(20) DEFAULT 'pendente' CHECK (status_conciliacao IN ('conciliado', 'pendente', 'divergente')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bancarias_ofx_banco_id ON public.movimentacoes_bancarias_ofx(banco_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bancarias_ofx_fitid ON public.movimentacoes_bancarias_ofx(fitid);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_bancarias_ofx_data_transacao ON public.movimentacoes_bancarias_ofx(data_transacao);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_movimentacoes_bancarias_ofx_updated_at
    BEFORE UPDATE ON public.movimentacoes_bancarias_ofx
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para movimentações bancárias OFX
ALTER TABLE public.movimentacoes_bancarias_ofx ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver todas as movimentações OFX" 
    ON public.movimentacoes_bancarias_ofx FOR SELECT 
    USING (true);

CREATE POLICY "Usuários podem inserir movimentações OFX" 
    ON public.movimentacoes_bancarias_ofx FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar movimentações OFX" 
    ON public.movimentacoes_bancarias_ofx FOR UPDATE 
    USING (true);

CREATE POLICY "Usuários podem excluir movimentações OFX" 
    ON public.movimentacoes_bancarias_ofx FOR DELETE 
    USING (true);