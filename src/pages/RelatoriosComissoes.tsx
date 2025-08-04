import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, Filter, Download, CheckCircle, Clock, TrendingUp, Calendar, User } from 'lucide-react';
import { useVendedores } from '@/hooks/useVendedores';
import { useVendasSupabase } from '@/hooks/useVendasSupabase';

interface FiltrosComissao {
  vendedorId: string;
  periodo: string;
  dataInicio: string;
  dataFim: string;
  statusPagamento: string;
  valorMinimo: string;
}

export default function RelatoriosComissoes() {
  const { vendedores, loading: loadingVendedores } = useVendedores();
  const { vendas, loading: loadingVendas } = useVendasSupabase();
  
  const [filtros, setFiltros] = useState<FiltrosComissao>({
    vendedorId: 'todos',
    periodo: 'mes_atual',
    dataInicio: '',
    dataFim: '',
    statusPagamento: 'todos',
    valorMinimo: ''
  });

  // Calcular dados de comissões baseado nas vendas
  const dadosComissoes = useMemo(() => {
    if (!vendas || !vendedores) return [];

    return vendas
      .filter(venda => venda.vendedor_id && venda.comissao_valor > 0)
      .map(venda => {
        const vendedor = vendedores.find(v => v.id === venda.vendedor_id);
        return {
          id: venda.id,
          vendedor_id: venda.vendedor_id,
          vendedor_nome: vendedor?.nome || 'Vendedor não encontrado',
          vendedor_codigo: vendedor?.codigo_vendedor || '',
          vendedor_foto: vendedor?.foto_url || '',
          data_venda: venda.data_venda,
          valor_venda: venda.valor_final,
          comissao_percentual: venda.comissao_percentual,
          comissao_valor: venda.comissao_valor,
          status_pagamento: 'pendente', // Por enquanto sempre pendente
          cliente_nome: (venda as any).clientes?.nome || 'Cliente não informado',
          forma_pagamento: venda.forma_pagamento
        };
      });
  }, [vendas, vendedores]);

  // Aplicar filtros
  const comissoesFiltradas = useMemo(() => {
    let resultado = dadosComissoes;

    // Filtro por vendedor
    if (filtros.vendedorId !== 'todos') {
      resultado = resultado.filter(c => c.vendedor_id === parseInt(filtros.vendedorId));
    }

    // Filtro por período
    if (filtros.periodo !== 'personalizado') {
      const hoje = new Date();
      let dataInicio: Date;
      
      switch (filtros.periodo) {
        case 'mes_atual':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          break;
        case 'mes_anterior':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
          break;
        case 'trimestre':
          dataInicio = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1);
          break;
        default:
          dataInicio = new Date(0);
      }
      
      resultado = resultado.filter(c => new Date(c.data_venda) >= dataInicio);
    } else {
      // Filtro personalizado
      if (filtros.dataInicio) {
        resultado = resultado.filter(c => c.data_venda >= filtros.dataInicio);
      }
      if (filtros.dataFim) {
        resultado = resultado.filter(c => c.data_venda <= filtros.dataFim);
      }
    }

    // Filtro por status de pagamento
    if (filtros.statusPagamento !== 'todos') {
      resultado = resultado.filter(c => c.status_pagamento === filtros.statusPagamento);
    }

    // Filtro por valor mínimo
    if (filtros.valorMinimo) {
      const valorMin = parseFloat(filtros.valorMinimo.replace(/[^\d,]/g, '').replace(',', '.'));
      resultado = resultado.filter(c => c.comissao_valor >= valorMin);
    }

    return resultado;
  }, [dadosComissoes, filtros]);

  // Calcular totalizadores
  const totalizadores = useMemo(() => {
    const totalComissoes = comissoesFiltradas.reduce((acc, c) => acc + c.comissao_valor, 0);
    const totalVendas = comissoesFiltradas.reduce((acc, c) => acc + c.valor_venda, 0);
    const comissoesPendentes = comissoesFiltradas.filter(c => c.status_pagamento === 'pendente').length;
    const comissoesPagas = comissoesFiltradas.filter(c => c.status_pagamento === 'pago').length;

    // Agrupar por vendedor
    const porVendedor = comissoesFiltradas.reduce((acc, c) => {
      if (!acc[c.vendedor_id]) {
        acc[c.vendedor_id] = {
          nome: c.vendedor_nome,
          codigo: c.vendedor_codigo,
          foto: c.vendedor_foto,
          total_comissao: 0,
          total_vendas: 0,
          quantidade_vendas: 0
        };
      }
      acc[c.vendedor_id].total_comissao += c.comissao_valor;
      acc[c.vendedor_id].total_vendas += c.valor_venda;
      acc[c.vendedor_id].quantidade_vendas += 1;
      return acc;
    }, {} as any);

    return {
      totalComissoes,
      totalVendas,
      comissoesPendentes,
      comissoesPagas,
      porVendedor: Object.values(porVendedor)
    };
  }, [comissoesFiltradas]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const marcarComoPago = (comissaoId: number) => {
    // TODO: Implementar lógica para marcar comissão como paga
    console.log('Marcar como pago:', comissaoId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstratos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative p-4 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Relatórios de Comissões
          </h1>
          <p className="text-gray-600">
            Gerencie e acompanhe as comissões dos vendedores
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Comissões</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatarMoeda(totalizadores.totalComissoes)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Vendas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatarMoeda(totalizadores.totalVendas)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalizadores.comissoesPendentes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pagas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalizadores.comissoesPagas}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Vendedor
                </label>
                <Select
                  value={filtros.vendedorId}
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, vendedorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os vendedores</SelectItem>
                    {vendedores?.map(vendedor => (
                      <SelectItem key={vendedor.id} value={vendedor.id.toString()}>
                        {vendedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Período
                </label>
                <Select
                  value={filtros.periodo}
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, periodo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes_atual">Mês atual</SelectItem>
                    <SelectItem value="mes_anterior">Mês anterior</SelectItem>
                    <SelectItem value="trimestre">Trimestre</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filtros.periodo === 'personalizado' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Data Início
                    </label>
                    <Input
                      type="date"
                      value={filtros.dataInicio}
                      onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Data Fim
                    </label>
                    <Input
                      type="date"
                      value={filtros.dataFim}
                      onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <Select
                  value={filtros.statusPagamento}
                  onValueChange={(value) => setFiltros(prev => ({ ...prev, statusPagamento: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Exportar
                </label>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Comissões */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Comissões Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor Venda</TableHead>
                    <TableHead>% Comissão</TableHead>
                    <TableHead>Valor Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoesFiltradas.map((comissao) => (
                    <TableRow key={comissao.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comissao.vendedor_foto} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {comissao.vendedor_nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{comissao.vendedor_nome}</p>
                            <p className="text-sm text-gray-500">{comissao.vendedor_codigo}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatarData(comissao.data_venda)}</TableCell>
                      <TableCell>{comissao.cliente_nome}</TableCell>
                      <TableCell>{formatarMoeda(comissao.valor_venda)}</TableCell>
                      <TableCell>{comissao.comissao_percentual.toFixed(1)}%</TableCell>
                      <TableCell className="font-medium">{formatarMoeda(comissao.comissao_valor)}</TableCell>
                      <TableCell>
                        <Badge variant={comissao.status_pagamento === 'pago' ? 'default' : 'secondary'}>
                          {comissao.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {comissao.status_pagamento === 'pendente' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => marcarComoPago(comissao.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marcar Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}