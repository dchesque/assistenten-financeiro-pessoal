-- Criar bucket para arquivos de conciliação
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conciliacao-arquivos',
  'conciliacao-arquivos', 
  false,
  10485760,
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/x-ofx', 'text/plain']
);

-- Políticas de storage para conciliação
CREATE POLICY "Usuários autenticados podem ver arquivos de conciliação"
ON storage.objects FOR SELECT
USING (auth.uid() IS NOT NULL AND bucket_id = 'conciliacao-arquivos');

CREATE POLICY "Usuários autenticados podem fazer upload de arquivos de conciliação"
ON storage.objects FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'conciliacao-arquivos');

CREATE POLICY "Usuários autenticados podem atualizar arquivos de conciliação"
ON storage.objects FOR UPDATE
USING (auth.uid() IS NOT NULL AND bucket_id = 'conciliacao-arquivos');

CREATE POLICY "Usuários autenticados podem excluir arquivos de conciliação"
ON storage.objects FOR DELETE
USING (auth.uid() IS NOT NULL AND bucket_id = 'conciliacao-arquivos');