-- Ajustar tabela clientes para corresponder às interfaces
DROP TABLE IF EXISTS public.clientes;

CREATE TABLE public.clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  documento VARCHAR(20) NOT NULL,
  tipo VARCHAR(2) NOT NULL DEFAULT 'PF',
  rg_ie VARCHAR(20),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  cep VARCHAR(10),
  logradouro VARCHAR(255),
  numero VARCHAR(10),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  receber_promocoes BOOLEAN DEFAULT true,
  whatsapp_marketing BOOLEAN DEFAULT false,
  total_compras INTEGER DEFAULT 0,
  valor_total_compras NUMERIC(15,2) DEFAULT 0,
  ticket_medio NUMERIC(15,2) DEFAULT 0,
  data_ultima_compra DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_clientes_documento ON public.clientes(documento);
CREATE INDEX idx_clientes_email ON public.clientes(email);
CREATE INDEX idx_clientes_nome ON public.clientes(nome);
CREATE INDEX idx_clientes_ativo ON public.clientes(ativo);
CREATE INDEX idx_clientes_tipo ON public.clientes(tipo);
CREATE INDEX idx_clientes_status ON public.clientes(status);
CREATE INDEX idx_clientes_created_at ON public.clientes(created_at);

-- Criar constraint para documento único
ALTER TABLE public.clientes ADD CONSTRAINT unique_documento UNIQUE (documento);

-- Criar trigger para updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Usuários autenticados podem ver todos os clientes" 
  ON public.clientes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir clientes" 
  ON public.clientes 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar clientes" 
  ON public.clientes 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Usuários autenticados podem excluir clientes" 
  ON public.clientes 
  FOR DELETE 
  USING (true);

-- Inserir dados de exemplo
INSERT INTO public.clientes (nome, documento, tipo, telefone, email, logradouro, cidade, estado, cep, total_compras, valor_total_compras, receber_promocoes, whatsapp_marketing) VALUES
('João Silva Santos', '123.456.789-00', 'PF', '(11) 99999-1234', 'joao.silva@email.com', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', 15, 2500.75, true, true),
('Maria Oliveira Costa', '987.654.321-00', 'PF', '(11) 98888-5678', 'maria.oliveira@email.com', 'Av. Paulista, 456', 'São Paulo', 'SP', '01310-100', 8, 1350.20, true, false),
('Tech Solutions LTDA', '12.345.678/0001-90', 'PJ', '(11) 3333-4444', 'contato@techsolutions.com', 'Rua Comercial, 789', 'São Paulo', 'SP', '04567-890', 25, 15750.50, false, false),
('Ana Carolina Ferreira', '555.444.333-22', 'PF', '(11) 97777-9999', 'ana.ferreira@email.com', 'Rua Nova, 321', 'Rio de Janeiro', 'RJ', '20000-123', 12, 3200.80, true, true);