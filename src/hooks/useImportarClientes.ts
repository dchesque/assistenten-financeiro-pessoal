import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Cliente, ClienteInsert } from '@/types/cliente';
import { useAuth } from '@/hooks/useAuth';

interface ResultadoImportacao {
  sucesso: boolean;
  total: number;
  importados: number;
  erros: string[];
  duplicatas: number;
  invalidos: number;
  clientesImportados: Cliente[];
}

interface ProcessoImportacao {
  etapa: 'aguardando' | 'lendo' | 'validando' | 'importando' | 'concluido' | 'erro';
  progresso: number;
  mensagem: string;
}

export function useImportarClientes() {
  const { user } = useAuth();
  const [processo, setProcesso] = useState<ProcessoImportacao>({
    etapa: 'aguardando',
    progresso: 0,
    mensagem: ''
  });

  const validarCPF = (cpf: string): boolean => {
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(numeros[i]) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digito1 = resto < 2 ? 0 : resto;

    if (parseInt(numeros[9]) !== digito1) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(numeros[i]) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digito2 = resto < 2 ? 0 : resto;

    return parseInt(numeros[10]) === digito2;
  };

  const validarCNPJ = (cnpj: string): boolean => {
    const numeros = cnpj.replace(/\D/g, '');
    if (numeros.length !== 14 || /^(\d)\1{13}$/.test(numeros)) return false;

    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let soma = 0;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(numeros[i]) * pesos1[i];
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;

    if (parseInt(numeros[12]) !== digito1) return false;

    soma = 0;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(numeros[i]) * pesos2[i];
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;

    return parseInt(numeros[13]) === digito2;
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarLinha = (dados: any[], indice: number): { valido: boolean; erros: string[] } => {
    const erros: string[] = [];

    // Nome obrigatório
    if (!dados[0] || dados[0].toString().trim().length === 0) {
      erros.push(`Linha ${indice + 1}: Nome é obrigatório`);
    }

    // Documento obrigatório e válido
    const documento = dados[1]?.toString().replace(/\D/g, '') || '';
    if (!documento) {
      erros.push(`Linha ${indice + 1}: Documento é obrigatório`);
    } else {
      if (documento.length === 11 && !validarCPF(documento)) {
        erros.push(`Linha ${indice + 1}: CPF inválido`);
      } else if (documento.length === 14 && !validarCNPJ(documento)) {
        erros.push(`Linha ${indice + 1}: CNPJ inválido`);
      } else if (documento.length !== 11 && documento.length !== 14) {
        erros.push(`Linha ${indice + 1}: Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos`);
      }
    }

    // Email válido se informado
    const email = dados[7]?.toString().trim();
    if (email && !validarEmail(email)) {
      erros.push(`Linha ${indice + 1}: Email inválido`);
    }

    return { valido: erros.length === 0, erros };
  };

  const lerArquivo = async (arquivo: File): Promise<any[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let workbook: XLSX.WorkBook;

          if (arquivo.name.endsWith('.csv')) {
            workbook = XLSX.read(data, { type: 'binary' });
          } else {
            workbook = XLSX.read(data, { type: 'array' });
          }

          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Remover cabeçalho se existir
          const dados = jsonData.slice(1);
          resolve(dados as any[][]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

      if (arquivo.name.endsWith('.csv')) {
        reader.readAsBinaryString(arquivo);
      } else {
        reader.readAsArrayBuffer(arquivo);
      }
    });
  };

  const processarImportacao = async (arquivo: File): Promise<ResultadoImportacao> => {
    const resultado: ResultadoImportacao = {
      sucesso: false,
      total: 0,
      importados: 0,
      erros: [],
      duplicatas: 0,
      invalidos: 0,
      clientesImportados: []
    };

    try {
      // Etapa 1: Ler arquivo
      setProcesso({
        etapa: 'lendo',
        progresso: 10,
        mensagem: 'Lendo arquivo...'
      });

      const dados = await lerArquivo(arquivo);
      
      if (!dados || dados.length === 0) {
        throw new Error('Arquivo vazio ou formato inválido');
      }

      resultado.total = dados.length;

      // Etapa 2: Validar dados
      setProcesso({
        etapa: 'validando',
        progresso: 30,
        mensagem: 'Validando dados...'
      });

      const clientesValidos: ClienteInsert[] = [];
      const documentosExistentes = new Set<string>();
      const emailsExistentes = new Set<string>();

      // Buscar documentos e emails já existentes no banco
      const { data: clientesExistentes } = await supabase
        .from('clientes')
        .select('documento, email')
        .eq('ativo', true);

      const documentosBanco = new Set(clientesExistentes?.map(c => c.documento) || []);
      const emailsBanco = new Set(
        clientesExistentes?.filter(c => c.email).map(c => c.email!.toLowerCase()) || []
      );

      for (let i = 0; i < dados.length; i++) {
        const linha = dados[i];
        const validacao = validarLinha(linha, i + 1);
        
        if (!validacao.valido) {
          resultado.erros.push(...validacao.erros);
          resultado.invalidos++;
          continue;
        }

        const documento = String(linha[1] || '').replace(/\D/g, '');
        const email = String(linha[7] || '').toLowerCase().trim();

        // Verificar duplicatas no banco
        if (documentosBanco.has(documento)) {
          resultado.erros.push(`Linha ${i + 1}: Cliente com documento ${documento} já existe no sistema`);
          resultado.duplicatas++;
          continue;
        }

        if (email && emailsBanco.has(email)) {
          resultado.erros.push(`Linha ${i + 1}: Cliente com email ${email} já existe no sistema`);
          resultado.duplicatas++;
          continue;
        }

        // Verificar duplicatas no próprio arquivo
        if (documentosExistentes.has(documento)) {
          resultado.erros.push(`Linha ${i + 1}: Documento ${documento} duplicado no arquivo`);
          resultado.duplicatas++;
          continue;
        }

        if (email && emailsExistentes.has(email)) {
          resultado.erros.push(`Linha ${i + 1}: Email ${email} duplicado no arquivo`);
          resultado.duplicatas++;
          continue;
        }

        documentosExistentes.add(documento);
        if (email) emailsExistentes.add(email);

        // Preparar dados do cliente
        const clienteData: ClienteInsert = {
          nome: String(linha[0] || '').trim(),
          documento,
          tipo: documento.length === 11 ? 'PF' : 'PJ',
          rg_ie: String(linha[2] || '').trim() || undefined,
          telefone: String(linha[3] || '').trim() || undefined,
          whatsapp: String(linha[4] || '').trim() || undefined,
          email: email || undefined,
          cep: String(linha[8] || '').replace(/\D/g, '') || undefined,
          logradouro: String(linha[9] || '').trim() || undefined,
          numero: String(linha[10] || '').trim() || undefined,
          complemento: String(linha[11] || '').trim() || undefined,
          bairro: String(linha[12] || '').trim() || undefined,
          cidade: String(linha[13] || '').trim() || undefined,
          estado: String(linha[14] || '').trim() || undefined,
          observacoes: String(linha[15] || '').trim() || undefined,
          receber_promocoes: String(linha[16] || '').toLowerCase() === 'sim',
          whatsapp_marketing: String(linha[17] || '').toLowerCase() === 'sim',
          status: 'ativo',
          user_id: user?.id
        };

        clientesValidos.push(clienteData);
      }

      // Etapa 3: Importar para o Supabase
      setProcesso({
        etapa: 'importando',
        progresso: 60,
        mensagem: 'Importando clientes...'
      });

      // Processar em lotes para melhor performance
      const TAMANHO_LOTE = 50;
      const clientesImportados: Cliente[] = [];

      for (let i = 0; i < clientesValidos.length; i += TAMANHO_LOTE) {
        const lote = clientesValidos.slice(i, i + TAMANHO_LOTE);
        
        try {
          const { data, error } = await supabase
            .from('clientes')
            .insert(lote)
            .select();

          if (error) {
            // Tentar inserir individualmente em caso de erro no lote
            for (const cliente of lote) {
              try {
                const { data: clienteData, error: clienteError } = await supabase
                  .from('clientes')
                  .insert(cliente)
                  .select()
                  .single();

                if (clienteError) {
                  resultado.erros.push(`Erro ao importar cliente ${cliente.nome}: ${clienteError.message}`);
                } else if (clienteData) {
                  const clienteConvertido: Cliente = {
                    id: clienteData.id,
                    nome: clienteData.nome,
                    documento: clienteData.documento,
                    tipo: clienteData.tipo as 'PF' | 'PJ',
                    rg_ie: clienteData.rg_ie,
                    telefone: clienteData.telefone,
                    whatsapp: clienteData.whatsapp,
                    email: clienteData.email,
                    cep: clienteData.cep,
                    logradouro: clienteData.logradouro,
                    numero: clienteData.numero,
                    complemento: clienteData.complemento,
                    bairro: clienteData.bairro,
                    cidade: clienteData.cidade,
                    estado: clienteData.estado,
                    status: clienteData.status as 'ativo' | 'inativo' | 'bloqueado',
                    observacoes: clienteData.observacoes,
                    receberPromocoes: clienteData.receber_promocoes || false,
                    whatsappMarketing: clienteData.whatsapp_marketing || false,
                    totalCompras: clienteData.total_compras || 0,
                    valorTotalCompras: clienteData.valor_total_compras || 0,
                    ticketMedio: clienteData.ticket_medio || 0,
                    dataUltimaCompra: clienteData.data_ultima_compra,
                    createdAt: clienteData.created_at,
                    updatedAt: clienteData.updated_at,
                    ativo: clienteData.ativo
                  };
                  clientesImportados.push(clienteConvertido);
                  resultado.importados++;
                }
              } catch (individualError) {
                resultado.erros.push(`Erro ao importar cliente ${cliente.nome}: ${individualError}`);
              }
            }
          } else if (data) {
            const clientesConvertidos: Cliente[] = data.map(item => ({
              id: item.id,
              nome: item.nome,
              documento: item.documento,
              tipo: item.tipo as 'PF' | 'PJ',
              rg_ie: item.rg_ie,
              telefone: item.telefone,
              whatsapp: item.whatsapp,
              email: item.email,
              cep: item.cep,
              logradouro: item.logradouro,
              numero: item.numero,
              complemento: item.complemento,
              bairro: item.bairro,
              cidade: item.cidade,
              estado: item.estado,
              status: item.status as 'ativo' | 'inativo' | 'bloqueado',
              observacoes: item.observacoes,
              receberPromocoes: item.receber_promocoes || false,
              whatsappMarketing: item.whatsapp_marketing || false,
              totalCompras: item.total_compras || 0,
              valorTotalCompras: item.valor_total_compras || 0,
              ticketMedio: item.ticket_medio || 0,
              dataUltimaCompra: item.data_ultima_compra,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
              ativo: item.ativo
            }));
            clientesImportados.push(...clientesConvertidos);
            resultado.importados += data.length;
          }

          // Atualizar progresso
          const progressoAtual = 60 + Math.round(((i + TAMANHO_LOTE) / clientesValidos.length) * 30);
          setProcesso({
            etapa: 'importando',
            progresso: Math.min(progressoAtual, 90),
            mensagem: `Importando lote ${Math.floor(i / TAMANHO_LOTE) + 1}...`
          });
        } catch (error) {
          resultado.erros.push(`Erro no lote: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      resultado.clientesImportados = clientesImportados;
      resultado.sucesso = resultado.importados > 0;

      setProcesso({
        etapa: 'concluido',
        progresso: 100,
        mensagem: 'Importação concluída!'
      });

    } catch (error) {
      console.error('Erro no processamento:', error);
      resultado.erros.push(`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      setProcesso({
        etapa: 'erro',
        progresso: 100,
        mensagem: 'Erro na importação'
      });
    }

    return resultado;
  };

  const gerarTemplateImportacao = () => {
    const template = [
      ['nome', 'documento', 'rg_ie', 'telefone', 'whatsapp', 'email', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'observacoes', 'receber_promocoes', 'whatsapp_marketing'],
      ['Maria Silva', '123.456.789-01', '12.345.678-9', '(11)99999-9999', '(11)99999-9999', 'maria@email.com', '01310-100', 'Av. Paulista', '1000', '', 'Bela Vista', 'São Paulo', 'SP', 'Cliente modelo', 'sim', 'sim'],
      ['João Santos LTDA', '12.345.678/0001-90', '123.456.789.123', '(11)3333-3333', '', 'contato@joao.com.br', '01310-200', 'Rua Augusta', '500', 'Sala 10', 'Consolação', 'São Paulo', 'SP', '', 'nao', 'nao']
    ];

    const csvContent = template
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_importacao_clientes.csv';
    link.click();
  };

  return {
    processo,
    processarImportacao,
    gerarTemplateImportacao,
    setProcesso
  };
}