import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useVendas } from '@/hooks/useVendas';
import { useClientes } from '@/hooks/useClientes';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { 
  FileText, Download, Settings, Calendar, Filter,
  BarChart3, PieChart, TrendingUp, Users, Plus,
  Eye, Edit, Trash2, Save
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface RelatorioCustomizado {
  id: string;
  nome: string;
  descricao: string;
  filtros: {
    dataInicio?: string;
    dataFim?: string;
    formaPagamento?: string;
    vendedor?: string;
    clienteId?: number;
    valorMinimo?: number;
    valorMaximo?: number;
  };
  campos: string[];
  agrupamento?: string;
  ordenacao: { campo: string; ordem: 'asc' | 'desc' };
  formato: 'excel' | 'pdf' | 'csv';
  criadoEm: string;
  ultimaExecucao?: string;
}

export function RelatoriosCustomizados() {
  const { vendas } = useVendas();
  const { clientes } = useClientes();
  const [relatorios, setRelatorios] = useState<RelatorioCustomizado[]>([]);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<RelatorioCustomizado | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [executandoRelatorio, setExecutandoRelatorio] = useState(false);

  // Campos disponíveis para relatórios
  const camposDisponiveis = [
    { id: 'data_venda', nome: 'Data da Venda', tipo: 'data' },
    { id: 'cliente_nome', nome: 'Nome do Cliente', tipo: 'texto' },
    { id: 'cliente_documento', nome: 'Documento do Cliente', tipo: 'texto' },
    { id: 'valor_total', nome: 'Valor Total', tipo: 'moeda' },
    { id: 'valor_final', nome: 'Valor Final', tipo: 'moeda' },
    { id: 'desconto', nome: 'Desconto', tipo: 'moeda' },
    { id: 'forma_pagamento', nome: 'Forma de Pagamento', tipo: 'texto' },
    { id: 'vendedor', nome: 'Vendedor', tipo: 'texto' },
    { id: 'parcelas', nome: 'Parcelas', tipo: 'numero' },
    { id: 'tipo_venda', nome: 'Tipo de Venda', tipo: 'texto' },
    { id: 'observacoes', nome: 'Observações', tipo: 'texto' }
  ];

  useEffect(() => {
    // Carregar relatórios salvos do localStorage
    const relatoriosSalvos = localStorage.getItem('relatorios_customizados');
    if (relatoriosSalvos) {
      setRelatorios(JSON.parse(relatoriosSalvos));
    }
  }, []);

  const salvarRelatorios = (novosRelatorios: RelatorioCustomizado[]) => {
    setRelatorios(novosRelatorios);
    localStorage.setItem('relatorios_customizados', JSON.stringify(novosRelatorios));
  };

  const criarNovoRelatorio = () => {
    const novoRelatorio: RelatorioCustomizado = {
      id: Date.now().toString(),
      nome: '',
      descricao: '',
      filtros: {},
      campos: ['data_venda', 'cliente_nome', 'valor_final'],
      ordenacao: { campo: 'data_venda', ordem: 'desc' },
      formato: 'excel',
      criadoEm: new Date().toISOString()
    };
    
    setRelatorioSelecionado(novoRelatorio);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const editarRelatorio = (relatorio: RelatorioCustomizado) => {
    setRelatorioSelecionado({ ...relatorio });
    setModoEdicao(true);
    setModalAberto(true);
  };

  const salvarRelatorio = () => {
    if (!relatorioSelecionado?.nome) return;

    const relatoriosAtualizados = relatorioSelecionado.id 
      ? relatorios.map(r => r.id === relatorioSelecionado.id ? relatorioSelecionado : r)
      : [...relatorios, relatorioSelecionado];

    salvarRelatorios(relatoriosAtualizados);
    setModalAberto(false);
    setModoEdicao(false);
    setRelatorioSelecionado(null);
  };

  const excluirRelatorio = (id: string) => {
    const relatoriosAtualizados = relatorios.filter(r => r.id !== id);
    salvarRelatorios(relatoriosAtualizados);
  };

  const aplicarFiltros = (vendas: any[], filtros: any) => {
    return vendas.filter(venda => {
      // Filtro por data
      if (filtros.dataInicio && new Date(venda.data_venda) < new Date(filtros.dataInicio)) return false;
      if (filtros.dataFim && new Date(venda.data_venda) > new Date(filtros.dataFim)) return false;
      
      // Filtro por forma de pagamento
      if (filtros.formaPagamento && venda.forma_pagamento !== filtros.formaPagamento) return false;
      
      // Filtro por vendedor
      if (filtros.vendedor && venda.vendedor !== filtros.vendedor) return false;
      
      // Filtro por cliente
      if (filtros.clienteId && venda.cliente_id !== filtros.clienteId) return false;
      
      // Filtro por valor
      if (filtros.valorMinimo && venda.valor_final < filtros.valorMinimo) return false;
      if (filtros.valorMaximo && venda.valor_final > filtros.valorMaximo) return false;
      
      return true;
    });
  };

  const executarRelatorio = async (relatorio: RelatorioCustomizado) => {
    setExecutandoRelatorio(true);
    
    try {
      // Aplicar filtros
      const vendasFiltradas = aplicarFiltros(vendas, relatorio.filtros);
      
      // Enriquecer dados com informações do cliente
      const dadosRelatorio = vendasFiltradas.map(venda => {
        const cliente = clientes.find(c => c.id === venda.cliente_id);
        return {
          ...venda,
          cliente_nome: cliente?.nome || 'Cliente não encontrado',
          cliente_documento: cliente?.documento || ''
        };
      });

      // Ordenar dados
      dadosRelatorio.sort((a, b) => {
        const campoA = a[relatorio.ordenacao.campo as keyof typeof a];
        const campoB = b[relatorio.ordenacao.campo as keyof typeof b];
        
        if (relatorio.ordenacao.ordem === 'asc') {
          return campoA > campoB ? 1 : -1;
        } else {
          return campoA < campoB ? 1 : -1;
        }
      });

      // Gerar arquivo
      switch (relatorio.formato) {
        case 'excel':
          gerarExcel(dadosRelatorio, relatorio);
          break;
        case 'pdf':
          gerarPDF(dadosRelatorio, relatorio);
          break;
        case 'csv':
          gerarCSV(dadosRelatorio, relatorio);
          break;
      }

      // Atualizar última execução
      const relatoriosAtualizados = relatorios.map(r => 
        r.id === relatorio.id 
          ? { ...r, ultimaExecucao: new Date().toISOString() }
          : r
      );
      salvarRelatorios(relatoriosAtualizados);

    } catch (error) {
      console.error('Erro ao executar relatório:', error);
    } finally {
      setExecutandoRelatorio(false);
    }
  };

  const gerarExcel = (dados: any[], relatorio: RelatorioCustomizado) => {
    const worksheet = XLSX.utils.json_to_sheet(
      dados.map(item => {
        const linha: any = {};
        relatorio.campos.forEach(campo => {
          const campoInfo = camposDisponiveis.find(c => c.id === campo);
          const valor = item[campo];
          
          linha[campoInfo?.nome || campo] = 
            campoInfo?.tipo === 'moeda' ? formatarMoeda(valor) :
            campoInfo?.tipo === 'data' ? formatarData(valor) :
            valor || '';
        });
        return linha;
      })
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    XLSX.writeFile(workbook, `${relatorio.nome}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const gerarPDF = (dados: any[], relatorio: RelatorioCustomizado) => {
    const doc = new jsPDF();
    
    doc.text(relatorio.nome, 20, 20);
    doc.text(`Gerado em: ${formatarData(new Date().toISOString())}`, 20, 30);
    
    const colunas = relatorio.campos.map(campo => {
      const campoInfo = camposDisponiveis.find(c => c.id === campo);
      return campoInfo?.nome || campo;
    });

    const linhas = dados.map(item => 
      relatorio.campos.map(campo => {
        const campoInfo = camposDisponiveis.find(c => c.id === campo);
        const valor = item[campo];
        
        return campoInfo?.tipo === 'moeda' ? formatarMoeda(valor) :
               campoInfo?.tipo === 'data' ? formatarData(valor) :
               valor || '';
      })
    );

    (doc as any).autoTable({
      head: [colunas],
      body: linhas,
      startY: 40
    });

    doc.save(`${relatorio.nome}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const gerarCSV = (dados: any[], relatorio: RelatorioCustomizado) => {
    const headers = relatorio.campos.map(campo => {
      const campoInfo = camposDisponiveis.find(c => c.id === campo);
      return campoInfo?.nome || campo;
    });

    const linhas = dados.map(item => 
      relatorio.campos.map(campo => {
        const campoInfo = camposDisponiveis.find(c => c.id === campo);
        const valor = item[campo];
        
        return campoInfo?.tipo === 'moeda' ? formatarMoeda(valor) :
               campoInfo?.tipo === 'data' ? formatarData(valor) :
               valor || '';
      }).join(',')
    );

    const csvContent = [headers.join(','), ...linhas].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${relatorio.nome}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios Customizados</h2>
          <p className="text-muted-foreground">Crie e execute relatórios personalizados</p>
        </div>
        <Button onClick={criarNovoRelatorio}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      {/* Lista de Relatórios */}
      <div className="grid gap-4">
        {relatorios.map((relatorio) => (
          <Card key={relatorio.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>{relatorio.nome}</span>
                    <Badge variant="outline">{relatorio.formato.toUpperCase()}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {relatorio.descricao}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executarRelatorio(relatorio)}
                    disabled={executandoRelatorio}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {executandoRelatorio ? 'Gerando...' : 'Executar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editarRelatorio(relatorio)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => excluirRelatorio(relatorio.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Campos:</span>
                  <p className="text-muted-foreground">
                    {relatorio.campos.length} campos selecionados
                  </p>
                </div>
                <div>
                  <span className="font-medium">Criado em:</span>
                  <p className="text-muted-foreground">
                    {formatarData(relatorio.criadoEm)}
                  </p>
                </div>
                {relatorio.ultimaExecucao && (
                  <>
                    <div>
                      <span className="font-medium">Última execução:</span>
                      <p className="text-muted-foreground">
                        {formatarData(relatorio.ultimaExecucao)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {relatorios.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum relatório criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro relatório customizado para extrair dados específicos
              </p>
              <Button onClick={criarNovoRelatorio}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Relatório
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Edição */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modoEdicao ? 'Editar Relatório' : 'Novo Relatório'}
            </DialogTitle>
          </DialogHeader>

          {relatorioSelecionado && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Relatório</Label>
                  <Input
                    id="nome"
                    value={relatorioSelecionado.nome}
                    onChange={(e) => setRelatorioSelecionado({
                      ...relatorioSelecionado,
                      nome: e.target.value
                    })}
                    placeholder="Ex: Vendas por período"
                  />
                </div>
                <div>
                  <Label htmlFor="formato">Formato de Exportação</Label>
                  <Select 
                    value={relatorioSelecionado.formato}
                    onValueChange={(value: any) => setRelatorioSelecionado({
                      ...relatorioSelecionado,
                      formato: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={relatorioSelecionado.descricao}
                  onChange={(e) => setRelatorioSelecionado({
                    ...relatorioSelecionado,
                    descricao: e.target.value
                  })}
                  placeholder="Descreva o objetivo deste relatório"
                />
              </div>

              {/* Campos */}
              <div>
                <Label>Campos a Incluir</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {camposDisponiveis.map((campo) => (
                    <div key={campo.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={campo.id}
                        checked={relatorioSelecionado.campos.includes(campo.id)}
                        onCheckedChange={(checked) => {
                          const novosCampos = checked
                            ? [...relatorioSelecionado.campos, campo.id]
                            : relatorioSelecionado.campos.filter(c => c !== campo.id);
                          
                          setRelatorioSelecionado({
                            ...relatorioSelecionado,
                            campos: novosCampos
                          });
                        }}
                      />
                      <Label htmlFor={campo.id} className="text-sm">
                        {campo.nome}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filtros */}
              <div className="space-y-4">
                <Label>Filtros (Opcional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={relatorioSelecionado.filtros.dataInicio || ''}
                      onChange={(e) => setRelatorioSelecionado({
                        ...relatorioSelecionado,
                        filtros: {
                          ...relatorioSelecionado.filtros,
                          dataInicio: e.target.value
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim">Data Fim</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={relatorioSelecionado.filtros.dataFim || ''}
                      onChange={(e) => setRelatorioSelecionado({
                        ...relatorioSelecionado,
                        filtros: {
                          ...relatorioSelecionado.filtros,
                          dataFim: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Ordenação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ordenacao-campo">Ordenar por</Label>
                  <Select 
                    value={relatorioSelecionado.ordenacao.campo}
                    onValueChange={(value) => setRelatorioSelecionado({
                      ...relatorioSelecionado,
                      ordenacao: {
                        ...relatorioSelecionado.ordenacao,
                        campo: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {camposDisponiveis.map(campo => (
                        <SelectItem key={campo.id} value={campo.id}>
                          {campo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ordenacao-ordem">Ordem</Label>
                  <Select 
                    value={relatorioSelecionado.ordenacao.ordem}
                    onValueChange={(value: any) => setRelatorioSelecionado({
                      ...relatorioSelecionado,
                      ordenacao: {
                        ...relatorioSelecionado.ordenacao,
                        ordem: value
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Crescente</SelectItem>
                      <SelectItem value="desc">Decrescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={salvarRelatorio}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Relatório
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}