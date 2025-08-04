
import { Cliente } from '@/types/cliente';
import * as XLSX from 'xlsx';

export function useExportarClientes() {
  const formatarDataExportacao = (data?: string) => {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const exportarCSV = (clientes: Cliente[], nomeArquivo = 'clientes_jc_financeiro') => {
    // Filtrar cliente CONSUMIDOR da exportação
    const clientesParaExportar = clientes.filter(c => c.id !== 1);
    const cabecalho = [
      'Nome',
      'Documento',
      'Tipo', 
      'RG/IE',
      'Telefone',
      'WhatsApp',
      'Email',
      'CEP',
      'Logradouro',
      'Número',
      'Complemento',
      'Bairro',
      'Cidade',
      'Estado',
      'Status',
      'Observações',
      'Receber Promoções',
      'WhatsApp Marketing',
      'Total Compras',
      'Valor Total Compras',
      'Ticket Médio',
      'Data Última Compra',
      'Data Cadastro'
    ];

    const dados = clientesParaExportar.map(cliente => [
      cliente.nome,
      cliente.documento,
      cliente.tipo,
      cliente.rg_ie || '',
      cliente.telefone || '',
      cliente.whatsapp || '',
      cliente.email || '',
      cliente.cep || '',
      cliente.logradouro || '',
      cliente.numero || '',
      cliente.complemento || '',
      cliente.bairro || '',
      cliente.cidade || '',
      cliente.estado || '',
      cliente.status,
      cliente.observacoes || '',
      cliente.receberPromocoes ? 'Sim' : 'Não',
      cliente.whatsappMarketing ? 'Sim' : 'Não',
      cliente.totalCompras.toString(),
      cliente.valorTotalCompras.toFixed(2).replace('.', ','),
      cliente.ticketMedio.toFixed(2).replace('.', ','),
      formatarDataExportacao(cliente.dataUltimaCompra),
      formatarDataExportacao(cliente.createdAt)
    ]);

    const csvContent = [cabecalho, ...dados]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dataFormatada = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    link.download = `${nomeArquivo}_${dataFormatada}.csv`;
    link.click();
  };

  const exportarExcel = (clientes: Cliente[], nomeArquivo = 'clientes_jc_financeiro') => {
    // Filtrar cliente CONSUMIDOR da exportação
    const clientesParaExportar = clientes.filter(c => c.id !== 1);
    
    const dadosExportacao = clientesParaExportar.map(cliente => ({
      'Nome': cliente.nome,
      'Documento': cliente.documento,
      'Tipo': cliente.tipo,
      'RG/IE': cliente.rg_ie || '',
      'Telefone': cliente.telefone || '',
      'WhatsApp': cliente.whatsapp || '',
      'Email': cliente.email || '',
      'CEP': cliente.cep || '',
      'Logradouro': cliente.logradouro || '',
      'Número': cliente.numero || '',
      'Complemento': cliente.complemento || '',
      'Bairro': cliente.bairro || '',
      'Cidade': cliente.cidade || '',
      'Estado': cliente.estado || '',
      'Status': cliente.status,
      'Observações': cliente.observacoes || '',
      'Receber Promoções': cliente.receberPromocoes ? 'Sim' : 'Não',
      'WhatsApp Marketing': cliente.whatsappMarketing ? 'Sim' : 'Não',
      'Total Compras': cliente.totalCompras,
      'Valor Total Compras': cliente.valorTotalCompras,
      'Ticket Médio': cliente.ticketMedio,
      'Data Última Compra': formatarDataExportacao(cliente.dataUltimaCompra),
      'Data Cadastro': formatarDataExportacao(cliente.createdAt)
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    // Ajustar largura das colunas
    const maxWidth = 30;
    ws['!cols'] = Object.keys(dadosExportacao[0] || {}).map(() => ({ wch: maxWidth }));

    const dataFormatada = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, `${nomeArquivo}_${dataFormatada}.xlsx`);
  };

  const obterEstatisticasExportacao = (clientes: Cliente[]) => {
    // Filtrar cliente CONSUMIDOR das estatísticas
    const clientesReais = clientes.filter(c => c.id !== 1);
    const total = clientesReais.length;
    const ativos = clientesReais.filter(c => c.status === 'ativo').length;
    const pessoaFisica = clientesReais.filter(c => c.tipo === 'PF').length;
    const pessoaJuridica = clientesReais.filter(c => c.tipo === 'PJ').length;
    const comEmail = clientesReais.filter(c => c.email).length;
    const comWhatsApp = clientesReais.filter(c => c.whatsapp).length;
    const comCompras = clientesReais.filter(c => c.totalCompras > 0).length;
    const valorTotalGeral = clientesReais.reduce((acc, c) => acc + c.valorTotalCompras, 0);

    return {
      total,
      ativos,
      inativos: total - ativos,
      pessoaFisica,
      pessoaJuridica,
      comEmail,
      comWhatsApp,
      comCompras,
      percentualAtivos: total > 0 ? Math.round((ativos / total) * 100) : 0,
      percentualComEmail: total > 0 ? Math.round((comEmail / total) * 100) : 0,
      percentualComWhatsApp: total > 0 ? Math.round((comWhatsApp / total) * 100) : 0,
      percentualComCompras: total > 0 ? Math.round((comCompras / total) * 100) : 0,
      valorTotalGeral,
      ticketMedioGeral: total > 0 ? valorTotalGeral / total : 0
    };
  };

  return {
    exportarCSV,
    exportarExcel,
    obterEstatisticasExportacao
  };
}
