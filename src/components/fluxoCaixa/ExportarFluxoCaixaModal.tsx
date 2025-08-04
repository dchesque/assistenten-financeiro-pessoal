import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileType,
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format, subMonths, startOfYear } from 'date-fns';
import { MovimentacaoFluxo, ProjecaoFluxo, AlertaFluxo } from '@/types/fluxoCaixa';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportarFluxoCaixaModalProps {
  children: React.ReactNode;
  movimentacoes: MovimentacaoFluxo[];
  projecoes: ProjecaoFluxo[];
  alertas: AlertaFluxo[];
}

interface ConfiguracaoExportacao {
  formato: 'excel' | 'pdf' | 'csv';
  periodo: 'atual' | 'personalizado' | 'ultimos_12_meses' | 'ano_completo';
  dataInicio: string;
  dataFim: string;
  conteudo: {
    movimentacoes: boolean;
    projecoes: boolean;
    alertas: boolean;
    graficos: boolean;
    resumo: boolean;
    apenas_positivos: boolean;
    apenas_negativos: boolean;
  };
  pdf: {
    orientacao: 'retrato' | 'paisagem';
    incluir_logo: boolean;
    incluir_data: boolean;
  };
}

export function ExportarFluxoCaixaModal({ 
  children, 
  movimentacoes, 
  projecoes, 
  alertas 
}: ExportarFluxoCaixaModalProps) {
  const [aberto, setAberto] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoExportacao>({
    formato: 'excel',
    periodo: 'atual',
    dataInicio: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    dataFim: format(new Date(), 'yyyy-MM-dd'),
    conteudo: {
      movimentacoes: true,
      projecoes: true,
      alertas: true,
      graficos: true,
      resumo: true,
      apenas_positivos: false,
      apenas_negativos: false
    },
    pdf: {
      orientacao: 'paisagem',
      incluir_logo: true,
      incluir_data: true
    }
  });

  const handlePeriodoChange = (periodo: ConfiguracaoExportacao['periodo']) => {
    const hoje = new Date();
    let dataInicio = configuracao.dataInicio;
    let dataFim = configuracao.dataFim;

    switch (periodo) {
      case 'ultimos_12_meses':
        dataInicio = format(subMonths(hoje, 12), 'yyyy-MM-dd');
        dataFim = format(hoje, 'yyyy-MM-dd');
        break;
      case 'ano_completo':
        dataInicio = format(startOfYear(hoje), 'yyyy-MM-dd');
        dataFim = format(hoje, 'yyyy-MM-dd');
        break;
      default:
        // Manter datas atuais para 'atual' e 'personalizado'
        break;
    }

    setConfiguracao(prev => ({
      ...prev,
      periodo,
      dataInicio,
      dataFim
    }));
  };

  const filtrarMovimentacoesPorPeriodo = () => {
    const dataInicio = new Date(configuracao.dataInicio);
    const dataFim = new Date(configuracao.dataFim);
    
    let movimentacoesFiltradas = movimentacoes.filter(mov => 
      mov.data >= dataInicio && mov.data <= dataFim
    );

    // Aplicar filtros adicionais
    if (configuracao.conteudo.apenas_positivos) {
      movimentacoesFiltradas = movimentacoesFiltradas.filter(mov => mov.tipo === 'entrada');
    }
    if (configuracao.conteudo.apenas_negativos) {
      movimentacoesFiltradas = movimentacoesFiltradas.filter(mov => mov.tipo === 'saida');
    }

    return movimentacoesFiltradas;
  };

  const exportarExcel = async () => {
    const workbook = XLSX.utils.book_new();
    const movimentacoesFiltradas = filtrarMovimentacoesPorPeriodo();

    // Aba 1: Movimentações
    if (configuracao.conteudo.movimentacoes) {
      const dadosMovimentacoes = movimentacoesFiltradas.map(mov => ({
        'Data': format(mov.data, 'dd/MM/yyyy'),
        'Descrição': mov.descricao,
        'Categoria': mov.categoria,
        'Tipo': mov.tipo === 'entrada' ? 'Entrada' : mov.tipo === 'saida' ? 'Saída' : 'Transferência',
        'Valor': mov.valor,
        'Status': mov.status === 'realizado' ? 'Realizado' : mov.status === 'previsto' ? 'Previsto' : 'Em Atraso',
        'Saldo Acumulado': mov.saldo_acumulado,
        'Origem': mov.origem,
        'Fornecedor/Cliente': mov.fornecedor_nome || mov.cliente_nome || '',
        'Banco': mov.banco_nome || '',
        'Documento': mov.documento_referencia || '',
        'Observações': mov.observacoes || ''
      }));

      const wsMovimentacoes = XLSX.utils.json_to_sheet(dadosMovimentacoes);
      XLSX.utils.book_append_sheet(workbook, wsMovimentacoes, 'Movimentações');
    }

    // Aba 2: Projeções
    if (configuracao.conteudo.projecoes) {
      const dadosProjecoes = projecoes.map(proj => ({
        'Período': proj.periodo_label,
        'Data Início': format(proj.data_inicio, 'dd/MM/yyyy'),
        'Data Fim': format(proj.data_fim, 'dd/MM/yyyy'),
        'Entradas Previstas': proj.entradas_previstas,
        'Saídas Previstas': proj.saidas_previstas,
        'Saldo Inicial': proj.saldo_inicial,
        'Saldo Final': proj.saldo_final,
        'Variação': proj.variacao,
        'Variação %': proj.variacao_percentual,
        'Status': proj.status === 'positivo' ? 'Positivo' : 
                 proj.status === 'negativo' ? 'Negativo' : 
                 proj.status === 'critico' ? 'Crítico' : 'Estável',
        'Confiança %': proj.confianca,
        'Vendas Previstas': proj.detalhes.vendas_previstas,
        'Contas a Pagar': proj.detalhes.contas_a_pagar,
        'Transferências': proj.detalhes.transferencias
      }));

      const wsProjecoes = XLSX.utils.json_to_sheet(dadosProjecoes);
      XLSX.utils.book_append_sheet(workbook, wsProjecoes, 'Projeções');
    }

    // Aba 3: Alertas
    if (configuracao.conteudo.alertas) {
      const dadosAlertas = alertas.filter(alerta => alerta.status === 'ativo').map(alerta => ({
        'Tipo': alerta.tipo === 'critico' ? 'Crítico' : 
               alerta.tipo === 'atencao' ? 'Atenção' : 
               alerta.tipo === 'info' ? 'Informação' : 'Positivo',
        'Título': alerta.titulo,
        'Descrição': alerta.descricao,
        'Data Prevista': alerta.data_prevista ? format(alerta.data_prevista, 'dd/MM/yyyy') : '',
        'Valor Impacto': alerta.valor_impacto || 0,
        'Prioridade': alerta.prioridade === 'alta' ? 'Alta' : 
                     alerta.prioridade === 'media' ? 'Média' : 'Baixa',
        'Ações Sugeridas': alerta.acoes_sugeridas.join('; '),
        'Data Criação': format(alerta.created_at, 'dd/MM/yyyy')
      }));

      const wsAlertas = XLSX.utils.json_to_sheet(dadosAlertas);
      XLSX.utils.book_append_sheet(workbook, wsAlertas, 'Alertas');
    }

    // Aba 4: Resumo Executivo
    if (configuracao.conteudo.resumo) {
      const totalEntradas = movimentacoesFiltradas
        .filter(m => m.tipo === 'entrada')
        .reduce((sum, m) => sum + m.valor, 0);
      
      const totalSaidas = movimentacoesFiltradas
        .filter(m => m.tipo === 'saida')
        .reduce((sum, m) => sum + m.valor, 0);

      const dadosResumo = [
        { 'Indicador': 'Total de Entradas', 'Valor': totalEntradas },
        { 'Indicador': 'Total de Saídas', 'Valor': totalSaidas },
        { 'Indicador': 'Resultado Líquido', 'Valor': totalEntradas - totalSaidas },
        { 'Indicador': 'Quantidade de Movimentações', 'Valor': movimentacoesFiltradas.length },
        { 'Indicador': 'Período', 'Valor': `${configuracao.dataInicio} a ${configuracao.dataFim}` },
        { 'Indicador': 'Data de Geração', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm') }
      ];

      const wsResumo = XLSX.utils.json_to_sheet(dadosResumo);
      XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo Executivo');
    }

    // Salvar arquivo
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `fluxo-caixa-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportarCSV = async () => {
    const movimentacoesFiltradas = filtrarMovimentacoesPorPeriodo();
    
    const dadosCSV = movimentacoesFiltradas.map(mov => ({
      data: format(mov.data, 'dd/MM/yyyy'),
      descricao: mov.descricao,
      categoria: mov.categoria,
      tipo: mov.tipo,
      valor: mov.valor,
      status: mov.status,
      saldo_acumulado: mov.saldo_acumulado,
      origem: mov.origem
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosCSV);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `fluxo-caixa-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const exportarPDF = async () => {
    // Implementar exportação PDF com jsPDF
    console.log('Exportação PDF será implementada em breve');
  };

  const handleExportar = async () => {
    setExportando(true);
    
    try {
      switch (configuracao.formato) {
        case 'excel':
          await exportarExcel();
          break;
        case 'csv':
          await exportarCSV();
          break;
        case 'pdf':
          await exportarPDF();
          break;
      }
      
      setAberto(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setExportando(false);
    }
  };

  const getQuantidadeMovimentacoes = () => {
    return filtrarMovimentacoesPorPeriodo().length;
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Exportar Fluxo de Caixa</h3>
              <p className="text-sm text-gray-500">Configure os dados para exportação</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formato */}
          <Card className="bg-white/50 border border-gray-200/50">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                <Settings className="w-4 h-4 inline mr-2" />
                Formato de Arquivo
              </Label>
              <RadioGroup
                value={configuracao.formato}
                onValueChange={(value) => setConfiguracao(prev => ({ ...prev, formato: value as any }))}
                className="grid grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="excel" id="excel" />
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    <Label htmlFor="excel" className="text-sm cursor-pointer">Excel (.xlsx)</Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    <Label htmlFor="pdf" className="text-sm cursor-pointer">PDF (.pdf)</Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="csv" id="csv" />
                  <div className="flex items-center gap-2">
                    <FileType className="w-4 h-4 text-blue-600" />
                    <Label htmlFor="csv" className="text-sm cursor-pointer">CSV (.csv)</Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Período */}
          <Card className="bg-white/50 border border-gray-200/50">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                <Calendar className="w-4 h-4 inline mr-2" />
                Período dos Dados
              </Label>
              <RadioGroup
                value={configuracao.periodo}
                onValueChange={handlePeriodoChange}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="atual" id="atual" />
                  <Label htmlFor="atual" className="text-sm cursor-pointer">Período atual dos filtros</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ultimos_12_meses" id="ultimos_12_meses" />
                  <Label htmlFor="ultimos_12_meses" className="text-sm cursor-pointer">Últimos 12 meses</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ano_completo" id="ano_completo" />
                  <Label htmlFor="ano_completo" className="text-sm cursor-pointer">Ano completo 2024</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personalizado" id="personalizado" />
                  <Label htmlFor="personalizado" className="text-sm cursor-pointer">Personalizado</Label>
                </div>
              </RadioGroup>

              {configuracao.periodo === 'personalizado' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="text-xs text-gray-500">Data Início</Label>
                    <Input
                      type="date"
                      value={configuracao.dataInicio}
                      onChange={(e) => setConfiguracao(prev => ({ ...prev, dataInicio: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Data Fim</Label>
                    <Input
                      type="date"
                      value={configuracao.dataFim}
                      onChange={(e) => setConfiguracao(prev => ({ ...prev, dataFim: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  {getQuantidadeMovimentacoes()} movimentações serão exportadas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          <Card className="bg-white/50 border border-gray-200/50">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Conteúdo da Exportação</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="movimentacoes"
                    checked={configuracao.conteudo.movimentacoes}
                    onCheckedChange={(checked) => 
                      setConfiguracao(prev => ({ 
                        ...prev, 
                        conteudo: { ...prev.conteudo, movimentacoes: checked as boolean } 
                      }))
                    }
                  />
                  <Label htmlFor="movimentacoes" className="text-sm cursor-pointer">
                    Movimentações detalhadas
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="projecoes"
                    checked={configuracao.conteudo.projecoes}
                    onCheckedChange={(checked) => 
                      setConfiguracao(prev => ({ 
                        ...prev, 
                        conteudo: { ...prev.conteudo, projecoes: checked as boolean } 
                      }))
                    }
                  />
                  <Label htmlFor="projecoes" className="text-sm cursor-pointer">
                    Projeções e alertas
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="resumo"
                    checked={configuracao.conteudo.resumo}
                    onCheckedChange={(checked) => 
                      setConfiguracao(prev => ({ 
                        ...prev, 
                        conteudo: { ...prev.conteudo, resumo: checked as boolean } 
                      }))
                    }
                  />
                  <Label htmlFor="resumo" className="text-sm cursor-pointer">
                    Resumo executivo
                  </Label>
                </div>

                {configuracao.formato === 'excel' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="graficos"
                      checked={configuracao.conteudo.graficos}
                      onCheckedChange={(checked) => 
                        setConfiguracao(prev => ({ 
                          ...prev, 
                          conteudo: { ...prev.conteudo, graficos: checked as boolean } 
                        }))
                      }
                    />
                    <Label htmlFor="graficos" className="text-sm cursor-pointer">
                      Gráficos (apenas Excel)
                    </Label>
                  </div>
                )}

                <Separator className="my-3" />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apenas_positivos"
                    checked={configuracao.conteudo.apenas_positivos}
                    onCheckedChange={(checked) => 
                      setConfiguracao(prev => ({ 
                        ...prev, 
                        conteudo: { 
                          ...prev.conteudo, 
                          apenas_positivos: checked as boolean,
                          apenas_negativos: checked ? false : prev.conteudo.apenas_negativos
                        } 
                      }))
                    }
                  />
                  <Label htmlFor="apenas_positivos" className="text-sm cursor-pointer text-green-600">
                    Apenas entradas (valores positivos)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apenas_negativos"
                    checked={configuracao.conteudo.apenas_negativos}
                    onCheckedChange={(checked) => 
                      setConfiguracao(prev => ({ 
                        ...prev, 
                        conteudo: { 
                          ...prev.conteudo, 
                          apenas_negativos: checked as boolean,
                          apenas_positivos: checked ? false : prev.conteudo.apenas_positivos
                        } 
                      }))
                    }
                  />
                  <Label htmlFor="apenas_negativos" className="text-sm cursor-pointer text-red-600">
                    Apenas saídas (valores negativos)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações PDF */}
          {configuracao.formato === 'pdf' && (
            <Card className="bg-white/50 border border-gray-200/50">
              <CardContent className="p-4">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Configurações PDF</Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">Orientação</Label>
                    <RadioGroup
                      value={configuracao.pdf.orientacao}
                      onValueChange={(value) => 
                        setConfiguracao(prev => ({ 
                          ...prev, 
                          pdf: { ...prev.pdf, orientacao: value as any } 
                        }))
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="retrato" id="retrato" />
                        <Label htmlFor="retrato" className="text-sm cursor-pointer">A4 Retrato</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paisagem" id="paisagem" />
                        <Label htmlFor="paisagem" className="text-sm cursor-pointer">A4 Paisagem</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incluir_logo"
                      checked={configuracao.pdf.incluir_logo}
                      onCheckedChange={(checked) => 
                        setConfiguracao(prev => ({ 
                          ...prev, 
                          pdf: { ...prev.pdf, incluir_logo: checked as boolean } 
                        }))
                      }
                    />
                    <Label htmlFor="incluir_logo" className="text-sm cursor-pointer">
                      Incluir logo da empresa
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="incluir_data"
                      checked={configuracao.pdf.incluir_data}
                      onCheckedChange={(checked) => 
                        setConfiguracao(prev => ({ 
                          ...prev, 
                          pdf: { ...prev.pdf, incluir_data: checked as boolean } 
                        }))
                      }
                    />
                    <Label htmlFor="incluir_data" className="text-sm cursor-pointer">
                      Incluir data de geração
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo */}
          <Card className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-medium text-gray-700">Resumo da Exportação</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Formato:</p>
                  <Badge variant="secondary" className="mt-1">
                    {configuracao.formato.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Período:</p>
                  <p className="font-medium text-gray-800">
                    {configuracao.periodo === 'atual' ? 'Filtros atuais' : 
                     configuracao.periodo === 'ultimos_12_meses' ? 'Últimos 12 meses' :
                     configuracao.periodo === 'ano_completo' ? 'Ano completo' : 
                     'Personalizado'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Movimentações:</p>
                  <p className="font-medium text-gray-800">{getQuantidadeMovimentacoes()} registros</p>
                </div>
                <div>
                  <p className="text-gray-500">Conteúdo:</p>
                  <p className="font-medium text-gray-800">
                    {Object.values(configuracao.conteudo).filter(Boolean).length} seções
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
          <Button
            variant="outline"
            onClick={() => setAberto(false)}
            disabled={exportando}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleExportar}
            disabled={exportando || getQuantidadeMovimentacoes() === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          >
            {exportando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar {configuracao.formato.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}