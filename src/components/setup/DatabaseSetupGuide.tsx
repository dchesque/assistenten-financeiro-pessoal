import { AlertTriangle, Database, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { toast } from 'sonner';

interface DatabaseSetupGuideProps {
  tableName: string;
  description: string;
}

export function DatabaseSetupGuide({ tableName, description }: DatabaseSetupGuideProps) {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- Schema para finanças pessoais
-- Execute este script no SQL Editor do Supabase

-- 1. Limpar estruturas antigas (se existirem)
DROP TABLE IF EXISTS contas_pessoais CASCADE;
DROP TABLE IF EXISTS credores CASCADE;
DROP TABLE IF EXISTS categorias_despesas CASCADE;
DROP TYPE IF EXISTS tipo_pessoa CASCADE;
DROP TYPE IF EXISTS status_conta CASCADE;
DROP TYPE IF EXISTS grupo_categoria CASCADE;

-- 2. Criar tipos ENUM
CREATE TYPE tipo_pessoa AS ENUM ('pessoa_fisica', 'pessoa_juridica');
CREATE TYPE status_conta AS ENUM ('pendente', 'paga', 'vencida');
CREATE TYPE grupo_categoria AS ENUM ('moradia', 'transporte', 'alimentacao', 'saude', 'educacao', 'lazer', 'cuidados', 'outros');

-- 3. Criar tabela de categorias de despesas
CREATE TABLE categorias_despesas (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  grupo grupo_categoria NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#6B7280',
  icone VARCHAR(50) NOT NULL DEFAULT 'Package',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT nome_categoria_user_unique UNIQUE(nome, user_id),
  CONSTRAINT cor_hex_valid CHECK (cor ~ '^#[0-9A-Fa-f]{6}$')
);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE categorias_despesas ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
CREATE POLICY "Usuários podem ver suas categorias" ON categorias_despesas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas categorias" ON categorias_despesas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas categorias" ON categorias_despesas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas categorias" ON categorias_despesas
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Criar índices para performance
CREATE INDEX idx_categorias_user_grupo ON categorias_despesas(user_id, grupo);
CREATE INDEX idx_categorias_ativo ON categorias_despesas(ativo);
CREATE INDEX idx_categorias_nome ON categorias_despesas(nome);

-- 7. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_updated_at 
    BEFORE UPDATE ON categorias_despesas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verificar instalação
SELECT 'Tabela categorias_despesas criada com sucesso!' as status;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      toast.success('Script SQL copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar script');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Configuração do Banco de Dados
              </h1>
              <p className="text-gray-600 mt-2">
                A tabela <code className="bg-gray-100 px-2 py-1 rounded text-sm">{tableName}</code> não foi encontrada no banco de dados
              </p>
            </div>
          </div>

          {/* Alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Para usar {description}, você precisa executar um script SQL no Supabase para criar as tabelas necessárias.
            </AlertDescription>
          </Alert>

          {/* Instruções */}
          <Card className="card-base">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Como configurar
              </CardTitle>
              <CardDescription>
                Siga os passos abaixo para criar as tabelas necessárias no seu banco Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Acesse o Supabase Dashboard</h3>
                    <p className="text-sm text-gray-600">
                      Abra o dashboard do seu projeto Supabase
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Vá para o SQL Editor</h3>
                    <p className="text-sm text-gray-600">
                      No menu lateral, clique em "SQL Editor"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Execute o script SQL</h3>
                    <p className="text-sm text-gray-600">
                      Cole e execute o script abaixo para criar as tabelas
                    </p>
                  </div>
                </div>
              </div>

              {/* Script SQL */}
              <div className="relative">
                <div className="flex items-center justify-between bg-gray-900 text-white px-4 py-2 rounded-t-lg">
                  <span className="text-sm font-medium">Script SQL</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyToClipboard}
                    className="text-white hover:bg-gray-800 h-8"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
                <pre className="bg-gray-100 p-4 rounded-b-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                  <code>{sqlScript}</code>
                </pre>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={copyToClipboard}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Script SQL
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Supabase Dashboard
                </Button>
              </div>

              {/* Nota final */}
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  <strong>Importante:</strong> Após executar o script, atualize a página para que as alterações tenham efeito.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}