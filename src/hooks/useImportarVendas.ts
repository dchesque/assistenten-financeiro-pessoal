
import { useState } from 'react';
import { Cliente } from '@/types/cliente';
import { NovaVenda } from '@/types/venda';
import { useClientesSupabase } from '@/hooks/useClientesSupabase';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';

interface ResultadoImportacao {
  sucessos: number;
  erros: string[];
  warnings: string[];
  vendasCriadas: NovaVenda[];
  clientesCriados: Cliente[];
  analises: {
    totalLinhas: number;
    linhasValidas: number;
    linhasComErro: number;
    clientesNovos: number;
    clientesExistentes: number;
    valorTotal: number;
    formasPagamento: Record<string, number>;
    categorias: Record<string, number>;
  };
}

interface ProcessoImportacao {
  etapa: 'preparando' | 'validando' | 'processando' | 'finalizando' | 'concluido';
  progresso: number;
  mensagem: string;
}

export function useImportarVendas() {
  const { clientes } = useClientesSupabase();
  const { planoContas: planos } = usePlanoContas();
  const { bancos } = useBancosSupabase();
  
  const [processo, setProcesso] = useState<ProcessoImportacao>({
    etapa: 'preparando',
    progresso: 0,
    mensagem: ''
  });

  const normalizarFormaPagamento = (forma: string): string => {
    const formaLower = forma.toLowerCase().trim();
    const mapeamento: Record<string, string> = {
      'pix': 'pix',
      'dinheiro': 'dinheiro',
      'cartao': 'cartao_credito',
      'cartão': 'cartao_credito',
      'cartao credito': 'cartao_credito',
      'cartão crédito': 'cartao_credito',
      'cartao debito': 'cartao_debito',
      'cartão débito': 'cartao_debito',
      'debito': 'cartao_debito',
      'débito': 'cartao_debito',
      'boleto': 'boleto',
      'transferencia': 'transferencia',
      'transferência': 'transferencia'
    };
    return mapeamento[formaLower] || 'pix';
  };

  const normalizarTipoVenda = (tipo: string): 'venda' | 'devolucao' | 'desconto' => {
    const tipoLower = tipo.toLowerCase().trim();
    if (tipoLower.includes('devoluc') || tipoLower.includes('estorno')) return 'devolucao';
    if (tipoLower.includes('desconto')) return 'desconto';
    return 'venda';
  };

  const encontrarOuCriarCliente = (nomeCliente: string, documento?: string): { cliente: Cliente | null; criado: boolean } => {
    if (!nomeCliente || nomeCliente.toLowerCase().trim() === 'consumidor') {
      return { cliente: null, criado: false };
    }

    // Procurar cliente existente
    let clienteExistente = clientes.find(c => 
      c.nome.toLowerCase() === nomeCliente.toLowerCase().trim()
    );

    if (documento && !clienteExistente) {
      clienteExistente = clientes.find(c => 
        c.documento === documento.replace(/\D/g, '')
      );
    }

    if (clienteExistente) {
      return { cliente: clienteExistente, criado: false };
    }

    // Criar novo cliente
    const novoCliente: Cliente = {
      id: Date.now() + Math.random(),
      nome: nomeCliente.trim(),
      documento: documento?.replace(/\D/g, '') || '',
      tipo: documento && documento.replace(/\D/g, '').length > 11 ? 'PJ' : 'PF',
      status: 'ativo',
      receberPromocoes: false,
      whatsappMarketing: false,
      totalCompras: 0,
      valorTotalCompras: 0,
      ticketMedio: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ativo: true
    };

    // TODO: Salvar cliente no Supabase
    return { cliente: novoCliente, criado: true };
  };

  const encontrarCategoria = (nomeCategoria: string) => {
    return planos.find(c => 
      c.nome.toLowerCase().includes(nomeCategoria.toLowerCase()) ||
      nomeCategoria.toLowerCase().includes(c.nome.toLowerCase())
    ) || planos.find(c => c.tipo_dre === 'receita');
  };

  const encontrarBanco = (nomeBanco?: string) => {
    if (!nomeBanco) return bancos[0];
    return bancos.find(b => 
      b.nome.toLowerCase().includes(nomeBanco.toLowerCase())
    ) || bancos[0];
  };

  const validarLinha = (dados: string[], indice: number): { valido: boolean; erros: string[] } => {
    const erros: string[] = [];

    // Validar data
    if (!dados[0] || !dados[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
      erros.push(`Linha ${indice + 2}: Data inválida (formato esperado: YYYY-MM-DD)`);
    }

    // Validar cliente
    if (!dados[1] || dados[1].trim().length === 0) {
      erros.push(`Linha ${indice + 2}: Nome do cliente é obrigatório`);
    }

    // Validar categoria
    if (!dados[2] || dados[2].trim().length === 0) {
      erros.push(`Linha ${indice + 2}: Categoria é obrigatória`);
    }

    // Validar valor bruto
    const valorBruto = parseFloat(dados[3]?.replace(',', '.') || '0');
    if (isNaN(valorBruto) || valorBruto === 0) {
      erros.push(`Linha ${indice + 2}: Valor bruto inválido ou zero`);
    }

    // Validar desconto
    const desconto = parseFloat(dados[4]?.replace(',', '.') || '0');
    if (isNaN(desconto) || desconto < 0) {
      erros.push(`Linha ${indice + 2}: Desconto inválido`);
    }

    // Validar valor líquido
    const valorLiquido = parseFloat(dados[5]?.replace(',', '.') || '0');
    if (isNaN(valorLiquido)) {
      erros.push(`Linha ${indice + 2}: Valor líquido inválido`);
    }

    // Validar forma de pagamento
    if (!dados[6] || dados[6].trim().length === 0) {
      erros.push(`Linha ${indice + 2}: Forma de pagamento é obrigatória`);
    }

    return { valido: erros.length === 0, erros };
  };

  const processarImportacao = async (arquivo: File): Promise<ResultadoImportacao> => {
    const resultado: ResultadoImportacao = {
      sucessos: 0,
      erros: [],
      warnings: [],
      vendasCriadas: [],
      clientesCriados: [],
      analises: {
        totalLinhas: 0,
        linhasValidas: 0,
        linhasComErro: 0,
        clientesNovos: 0,
        clientesExistentes: 0,
        valorTotal: 0,
        formasPagamento: {},
        categorias: {}
      }
    };

    try {
      setProcesso({ etapa: 'preparando', progresso: 10, mensagem: 'Lendo arquivo...' });
      
      const texto = await arquivo.text();
      const linhas = texto.split('\n').filter(linha => linha.trim()).slice(1); // Remove cabeçalho
      
      resultado.analises.totalLinhas = linhas.length;

      setProcesso({ etapa: 'validando', progresso: 20, mensagem: 'Validando dados...' });

      // Primeira passada: validação
      linhas.forEach((linha, indice) => {
        const dados = linha.split(',').map(cell => cell.trim());
        const { valido, erros } = validarLinha(dados, indice);
        
        if (!valido) {
          resultado.erros.push(...erros);
          resultado.analises.linhasComErro++;
        } else {
          resultado.analises.linhasValidas++;
        }
      });

      setProcesso({ etapa: 'processando', progresso: 40, mensagem: 'Processando vendas...' });

      // Segunda passada: processamento
      const clientesNovos: Cliente[] = [];
      
      linhas.forEach((linha, indice) => {
        const dados = linha.split(',').map(cell => cell.trim());
        const { valido } = validarLinha(dados, indice);
        
        if (!valido) return;

        try {
          // Converter dados
          const valorBruto = parseFloat(dados[3].replace(',', '.'));
          const desconto = parseFloat(dados[4]?.replace(',', '.') || '0');
          const valorLiquido = parseFloat(dados[5]?.replace(',', '.'));
          
          // Processar cliente
          const { cliente, criado } = encontrarOuCriarCliente(dados[1], dados[9]);
          if (criado && cliente) {
            clientesNovos.push(cliente);
            resultado.analises.clientesNovos++;
          } else if (cliente) {
            resultado.analises.clientesExistentes++;
          }

          // Encontrar categoria e banco
          const categoria = encontrarCategoria(dados[2]);
          const banco = encontrarBanco(dados[8]);

          if (!categoria) {
            resultado.warnings.push(`Linha ${indice + 2}: Categoria "${dados[2]}" não encontrada, usando padrão`);
          }

          // Criar venda
          const novaVenda: NovaVenda = {
            data_venda: dados[0],
            hora_venda: new Date().toTimeString().slice(0, 5),
            cliente_id: cliente?.id,
            categoria_id: categoria?.id || 1,
            valor_bruto: valorBruto,
            desconto_percentual: valorBruto > 0 ? (desconto / valorBruto) * 100 : 0,
            desconto_valor: desconto,
            forma_pagamento: normalizarFormaPagamento(dados[6]),
            banco_id: banco?.id,
            tipo_venda: normalizarTipoVenda(dados[7] || 'venda'),
            documento_referencia: dados[8] || '',
            observacoes: `Importado automaticamente em ${new Date().toLocaleString('pt-BR')}`,
            venda_a_vista: true,
            enviar_por_email: false
          };

          resultado.vendasCriadas.push(novaVenda);
          resultado.sucessos++;

          // Estatísticas
          resultado.analises.valorTotal += valorLiquido;
          
          const formaPagamento = normalizarFormaPagamento(dados[6]);
          resultado.analises.formasPagamento[formaPagamento] = 
            (resultado.analises.formasPagamento[formaPagamento] || 0) + 1;
          
          const categoriaNome = categoria?.nome || 'Sem categoria';
          resultado.analises.categorias[categoriaNome] = 
            (resultado.analises.categorias[categoriaNome] || 0) + 1;

          setProcesso({ 
            etapa: 'processando', 
            progresso: 40 + ((indice + 1) / linhas.length) * 40, 
            mensagem: `Processando venda ${indice + 1} de ${linhas.length}...` 
          });

        } catch (error) {
          resultado.erros.push(`Linha ${indice + 2}: Erro no processamento - ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      });

      resultado.clientesCriados = clientesNovos;

      setProcesso({ etapa: 'finalizando', progresso: 90, mensagem: 'Finalizando importação...' });

      // Simular salvamento no banco
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcesso({ etapa: 'concluido', progresso: 100, mensagem: 'Importação concluída!' });

      return resultado;

    } catch (error) {
      resultado.erros.push(`Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return resultado;
    }
  };

  return {
    processo,
    processarImportacao,
    setProcesso
  };
}
