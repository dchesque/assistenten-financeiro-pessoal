-- Criar tabela clientes
CREATE TABLE public.clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  documento VARCHAR(20),
  tipo VARCHAR(20) NOT NULL DEFAULT 'pessoa_fisica',
  endereco JSONB,
  data_nascimento DATE,
  observacoes TEXT,
  total_compras NUMERIC(15,2) DEFAULT 0,
  valor_total NUMERIC(15,2) DEFAULT 0,
  primeira_compra DATE,
  ultima_compra DATE,
  ticket_medio NUMERIC(15,2) DEFAULT 0,
  receber_promocoes BOOLEAN DEFAULT true,
  marketing_whatsapp BOOLEAN DEFAULT false,
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
CREATE INDEX idx_clientes_created_at ON public.clientes(created_at);

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

-- Inserir alguns dados de exemplo
INSERT INTO public.clientes (nome, email, telefone, documento, tipo, endereco, total_compras, valor_total, receber_promocoes, marketing_whatsapp) VALUES
('João Silva Santos', 'joao.silva@email.com', '(11) 99999-1234', '123.456.789-00', 'pessoa_fisica', '{"logradouro": "Rua das Flores, 123", "cidade": "São Paulo", "estado": "SP", "cep": "01234-567"}', 15, 2500.75, true, true),
('Maria Oliveira Costa', 'maria.oliveira@email.com', '(11) 98888-5678', '987.654.321-00', 'pessoa_fisica', '{"logradouro": "Av. Paulista, 456", "cidade": "São Paulo", "estado": "SP", "cep": "01310-100"}', 8, 1350.20, true, false),
('Tech Solutions LTDA', 'contato@techsolutions.com', '(11) 3333-4444', '12.345.678/0001-90', 'pessoa_juridica', '{"logradouro": "Rua Comercial, 789", "cidade": "São Paulo", "estado": "SP", "cep": "04567-890"}', 25, 15750.50, false, false),
('Ana Carolina Ferreira', 'ana.ferreira@email.com', '(11) 97777-9999', '555.444.333-22', 'pessoa_fisica', '{"logradouro": "Rua Nova, 321", "cidade": "Rio de Janeiro", "estado": "RJ", "cep": "20000-123"}', 12, 3200.80, true, true);