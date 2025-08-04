-- Criar tabela de maquininhas
CREATE TABLE public.maquininhas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    operadora VARCHAR(20) NOT NULL CHECK (operadora IN ('rede', 'sipag')),
    codigo_estabelecimento VARCHAR(100) NOT NULL,
    banco_id INTEGER NOT NULL REFERENCES public.bancos(id),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(operadora, codigo_estabelecimento)
);

-- Criar tabela de taxas das maquininhas
CREATE TABLE public.taxas_maquininha (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    maquininha_id UUID NOT NULL REFERENCES public.maquininhas(id) ON DELETE CASCADE,
    bandeira VARCHAR(20) NOT NULL CHECK (bandeira IN ('visa', 'mastercard', 'elo', 'hipercard', 'american_express')),
    tipo_transacao VARCHAR(20) NOT NULL CHECK (tipo_transacao IN ('debito', 'credito_vista', 'credito_parcelado')),
    parcelas_max INTEGER,
    taxa_percentual NUMERIC(5,2) NOT NULL,
    taxa_fixa NUMERIC(10,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de processamentos de extrato
CREATE TABLE public.processamentos_extrato (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    periodo VARCHAR(7) NOT NULL, -- "2025-01"
    maquininha_id UUID NOT NULL REFERENCES public.maquininhas(id),
    arquivo_vendas_nome VARCHAR(255) NOT NULL,
    arquivo_vendas_tipo VARCHAR(10) NOT NULL CHECK (arquivo_vendas_tipo IN ('csv', 'xlsx')),
    arquivo_vendas_processado_em TIMESTAMPTZ NOT NULL,
    arquivo_vendas_total_registros INTEGER NOT NULL,
    arquivo_bancario_nome VARCHAR(255) NOT NULL,
    arquivo_bancario_tipo VARCHAR(10) NOT NULL CHECK (arquivo_bancario_tipo IN ('ofx', 'csv')),
    arquivo_bancario_processado_em TIMESTAMPTZ NOT NULL,
    arquivo_bancario_total_registros INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'processando' CHECK (status IN ('processando', 'conciliado', 'divergencias', 'erro')),
    divergencias INTEGER DEFAULT 0,
    conciliado_automaticamente INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de vendas das maquininhas
CREATE TABLE public.vendas_maquininha (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    maquininha_id UUID NOT NULL REFERENCES public.maquininhas(id),
    nsu VARCHAR(50) NOT NULL,
    data_venda DATE NOT NULL,
    data_recebimento DATE NOT NULL,
    valor_bruto NUMERIC(15,2) NOT NULL,
    valor_taxa NUMERIC(15,2) NOT NULL,
    valor_liquido NUMERIC(15,2) NOT NULL,
    taxa_percentual_cobrada NUMERIC(5,2) NOT NULL,
    bandeira VARCHAR(20) NOT NULL,
    tipo_transacao VARCHAR(20) NOT NULL,
    parcelas INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'cancelado')),
    periodo_processamento VARCHAR(7) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(maquininha_id, nsu, periodo_processamento)
);

-- Criar tabela de recebimentos bancários
CREATE TABLE public.recebimentos_bancario (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    banco_id INTEGER NOT NULL REFERENCES public.bancos(id),
    data_recebimento DATE NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    descricao TEXT NOT NULL,
    tipo_operacao VARCHAR(50),
    documento VARCHAR(50),
    periodo_processamento VARCHAR(7) NOT NULL,
    status VARCHAR(30) DEFAULT 'pendente_conciliacao' CHECK (status IN ('pendente_conciliacao', 'conciliado', 'divergencia')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de conciliações
CREATE TABLE public.conciliacoes_maquininha (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    periodo VARCHAR(7) NOT NULL,
    maquininha_id UUID NOT NULL REFERENCES public.maquininhas(id),
    data_conciliacao DATE NOT NULL,
    total_vendas NUMERIC(15,2) NOT NULL,
    total_recebimentos NUMERIC(15,2) NOT NULL,
    total_taxas NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ok' CHECK (status IN ('ok', 'divergencia')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(periodo, maquininha_id)
);

-- Criar tabela de detalhes de conciliação
CREATE TABLE public.detalhes_conciliacao (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conciliacao_id UUID NOT NULL REFERENCES public.conciliacoes_maquininha(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    vendas_valor NUMERIC(15,2) NOT NULL,
    vendas_quantidade INTEGER NOT NULL,
    recebimento_valor NUMERIC(15,2) NOT NULL,
    recebimento_quantidade INTEGER NOT NULL,
    diferenca NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ok' CHECK (status IN ('ok', 'divergencia')),
    motivo_divergencia TEXT
);

-- Criar triggers de updated_at
CREATE TRIGGER update_maquininhas_updated_at
    BEFORE UPDATE ON public.maquininhas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_taxas_maquininha_updated_at
    BEFORE UPDATE ON public.taxas_maquininha
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processamentos_extrato_updated_at
    BEFORE UPDATE ON public.processamentos_extrato
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendas_maquininha_updated_at
    BEFORE UPDATE ON public.vendas_maquininha
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recebimentos_bancario_updated_at
    BEFORE UPDATE ON public.recebimentos_bancario
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conciliacoes_maquininha_updated_at
    BEFORE UPDATE ON public.conciliacoes_maquininha
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.maquininhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxas_maquininha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processamentos_extrato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_maquininha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos_bancario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacoes_maquininha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalhes_conciliacao ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem gerenciar maquininhas" ON public.maquininhas
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem gerenciar taxas" ON public.taxas_maquininha
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem gerenciar processamentos" ON public.processamentos_extrato
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem gerenciar vendas maquininha" ON public.vendas_maquininha
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem gerenciar recebimentos" ON public.recebimentos_bancario
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem gerenciar conciliações" ON public.conciliacoes_maquininha
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem gerenciar detalhes conciliação" ON public.detalhes_conciliacao
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Criar índices para performance
CREATE INDEX idx_maquininhas_ativo ON public.maquininhas(ativo);
CREATE INDEX idx_maquininhas_operadora ON public.maquininhas(operadora);
CREATE INDEX idx_taxas_maquininha_maquininha_id ON public.taxas_maquininha(maquininha_id);
CREATE INDEX idx_vendas_maquininha_periodo ON public.vendas_maquininha(periodo_processamento);
CREATE INDEX idx_vendas_maquininha_data_venda ON public.vendas_maquininha(data_venda);
CREATE INDEX idx_recebimentos_bancario_periodo ON public.recebimentos_bancario(periodo_processamento);
CREATE INDEX idx_conciliacoes_periodo ON public.conciliacoes_maquininha(periodo);

-- Inserir dados de exemplo
INSERT INTO public.maquininhas (nome, operadora, codigo_estabelecimento, banco_id) VALUES
('Rede - Loja Principal', 'rede', 'EC123456789', 1),
('Sipag - Balcão', 'sipag', 'MERCH001', 1);

-- Inserir taxas exemplo
INSERT INTO public.taxas_maquininha (maquininha_id, bandeira, tipo_transacao, taxa_percentual) 
SELECT 
    m.id,
    'visa',
    'debito',
    1.99
FROM public.maquininhas m WHERE m.operadora = 'rede' LIMIT 1;

INSERT INTO public.taxas_maquininha (maquininha_id, bandeira, tipo_transacao, taxa_percentual) 
SELECT 
    m.id,
    'visa',
    'credito_vista',
    3.49
FROM public.maquininhas m WHERE m.operadora = 'rede' LIMIT 1;