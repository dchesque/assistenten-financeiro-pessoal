import { supabase } from '@/integrations/supabase/client';

export class ConciliacaoStorage {
  private static readonly BUCKET_NAME = 'conciliacao-arquivos';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly DIAS_RETENCAO_PADRAO = 90;

  /**
   * Inicializa o bucket se necessário
   */
  static async inicializarBucket(): Promise<void> {
    try {
      // Verificar se bucket existe
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExiste = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExiste) {
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: false,
          allowedMimeTypes: [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/x-ofx',
            'text/plain'
          ],
          fileSizeLimit: this.MAX_FILE_SIZE
        });

        if (error) {
          console.error('Erro ao criar bucket:', error);
          throw new Error('Erro ao inicializar storage de conciliação');
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar bucket:', error);
      throw error;
    }
  }

  /**
   * Upload seguro com validação
   */
  static async uploadArquivo(
    file: File,
    maquininhaId: string,
    periodo: string,
    tipo: 'vendas' | 'bancario'
  ): Promise<string> {
    try {
      // Validações básicas
      this.validarArquivo(file);

      // Garantir que bucket existe
      await this.inicializarBucket();

      // Gerar caminho único
      const timestamp = Date.now();
      const extensao = this.obterExtensao(file.name);
      const caminho = `${periodo}/${maquininhaId}/${tipo}/${timestamp}_${file.name}`;

      console.log(`Fazendo upload: ${caminho}`);

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(caminho, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        throw new Error(`Erro ao fazer upload: ${error.message}`);
      }

      if (!data?.path) {
        throw new Error('Caminho do arquivo não retornado pelo storage');
      }

      // Registrar upload na tabela de controle
      await this.registrarUpload(caminho, maquininhaId, periodo, tipo, file.size);

      console.log(`Upload realizado com sucesso: ${data.path}`);
      return data.path;

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido no upload');
    }
  }

  /**
   * Download para reprocessamento
   */
  static async downloadArquivo(caminho: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(caminho);

      if (error) {
        throw new Error(`Erro ao baixar arquivo: ${error.message}`);
      }

      if (!data) {
        throw new Error('Arquivo não encontrado');
      }

      // Converter blob para texto
      const texto = await data.text();
      return texto;

    } catch (error) {
      console.error('Erro ao fazer download:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido no download');
    }
  }

  /**
   * Verificar integridade do arquivo
   */
  static async verificarIntegridade(caminho: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(caminho.split('/').slice(0, -1).join('/'), {
          limit: 1,
          search: caminho.split('/').pop()
        });

      if (error) {
        console.error('Erro ao verificar integridade:', error);
        return false;
      }

      return data && data.length > 0;

    } catch (error) {
      console.error('Erro ao verificar integridade:', error);
      return false;
    }
  }

  /**
   * Limpeza de arquivos antigos
   */
  static async limparArquivosAntigos(diasRetencao: number = this.DIAS_RETENCAO_PADRAO): Promise<void> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasRetencao);

      // Listar todos os arquivos
      const { data: arquivos, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        throw new Error(`Erro ao listar arquivos: ${error.message}`);
      }

      if (!arquivos || arquivos.length === 0) {
        console.log('Nenhum arquivo encontrado para limpeza');
        return;
      }

      // Filtrar arquivos antigos
      const arquivosParaExcluir = arquivos
        .filter(arquivo => {
          const dataArquivo = new Date(arquivo.created_at);
          return dataArquivo < dataLimite;
        })
        .map(arquivo => arquivo.name);

      if (arquivosParaExcluir.length === 0) {
        console.log('Nenhum arquivo antigo encontrado');
        return;
      }

      // Excluir arquivos em lotes
      const { error: deleteError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(arquivosParaExcluir);

      if (deleteError) {
        throw new Error(`Erro ao excluir arquivos: ${deleteError.message}`);
      }

      console.log(`${arquivosParaExcluir.length} arquivos antigos removidos`);

      // Remover registros da tabela de controle
      await this.limparRegistrosAntigos(diasRetencao);

    } catch (error) {
      console.error('Erro na limpeza de arquivos:', error);
      throw error;
    }
  }

  /**
   * Obter URL assinada para download direto
   */
  static async obterUrlAssinada(caminho: string, expiracaoSegundos: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(caminho, expiracaoSegundos);

      if (error) {
        throw new Error(`Erro ao gerar URL assinada: ${error.message}`);
      }

      if (!data?.signedUrl) {
        throw new Error('URL assinada não gerada');
      }

      return data.signedUrl;

    } catch (error) {
      console.error('Erro ao gerar URL assinada:', error);
      throw error;
    }
  }

  /**
   * Listar arquivos de um período específico
   */
  static async listarArquivosPeriodo(periodo: string, maquininhaId?: string): Promise<Array<{
    nome: string;
    caminho: string;
    tamanho: number;
    dataUpload: Date;
    tipo: string;
  }>> {
    try {
      const prefixo = maquininhaId ? `${periodo}/${maquininhaId}` : periodo;
      
      const { data: arquivos, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(prefixo, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Erro ao listar arquivos: ${error.message}`);
      }

      return (arquivos || []).map(arquivo => ({
        nome: arquivo.name,
        caminho: `${prefixo}/${arquivo.name}`,
        tamanho: arquivo.metadata?.size || 0,
        dataUpload: new Date(arquivo.created_at),
        tipo: this.identificarTipoArquivo(arquivo.name)
      }));

    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  /**
   * Métodos privados auxiliares
   */
  private static validarArquivo(file: File): void {
    // Validar tamanho
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo permitido: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Validar tipo
    const extensao = this.obterExtensao(file.name).toLowerCase();
    const extensoesPermitidas = ['.csv', '.xlsx', '.xls', '.ofx', '.txt'];
    
    if (!extensoesPermitidas.includes(extensao)) {
      throw new Error(`Tipo de arquivo não permitido: ${extensao}. Permitidos: ${extensoesPermitidas.join(', ')}`);
    }

    // Validar nome
    if (!file.name || file.name.trim() === '') {
      throw new Error('Nome do arquivo inválido');
    }
  }

  private static obterExtensao(nomeArquivo: string): string {
    const ultimoPonto = nomeArquivo.lastIndexOf('.');
    return ultimoPonto > 0 ? nomeArquivo.substring(ultimoPonto) : '';
  }

  private static identificarTipoArquivo(nomeArquivo: string): string {
    const extensao = this.obterExtensao(nomeArquivo).toLowerCase();
    
    if (['.csv', '.xlsx', '.xls'].includes(extensao)) {
      return nomeArquivo.toLowerCase().includes('venda') ? 'vendas' : 'bancario';
    }
    if (extensao === '.ofx') {
      return 'bancario';
    }
    
    return 'desconhecido';
  }

  private static async registrarUpload(
    caminho: string,
    maquininhaId: string,
    periodo: string,
    tipo: string,
    tamanho: number
  ): Promise<void> {
    try {
      // Registrar no log de auditoria para controle
      const { error } = await supabase
        .from('audit_log')
        .insert({
          tabela: 'storage_conciliacao',
          operacao: 'upload',
          descricao: `Upload de arquivo ${tipo}: ${caminho}`,
          dados_depois: {
            caminho_arquivo: caminho,
            maquininha_id: maquininhaId,
            periodo,
            tipo_arquivo: tipo,
            tamanho_bytes: tamanho
          }
        });

      if (error) {
        console.warn('Aviso ao registrar upload no audit log:', error);
      }

    } catch (error) {
      console.warn('Aviso ao registrar upload:', error);
      // Não falhar o upload por causa disso
    }
  }

  private static async limparRegistrosAntigos(diasRetencao: number): Promise<void> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasRetencao);

      // Limpar registros antigos do audit log relacionados ao storage
      const { error } = await supabase
        .from('audit_log')
        .delete()
        .eq('tabela', 'storage_conciliacao')
        .lt('data_operacao', dataLimite.toISOString());

      if (error) {
        console.warn('Aviso ao limpar registros antigos do audit log:', error);
      }

    } catch (error) {
      console.warn('Aviso ao limpar registros antigos:', error);
    }
  }
}