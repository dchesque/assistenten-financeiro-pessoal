import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClientes } from '@/hooks/useClientes';
import { useVendas } from '@/hooks/useVendas';
import { formatarMoeda } from '@/utils/formatters';
import { Users, Crown, Star, TrendingUp, Filter, Download } from 'lucide-react';

interface SegmentoCliente {
  id: string;
  nome: string;
  descricao: string;
  clientes: any[];
  valorTotal: number;
  ticketMedio: number;
  cor: string;
  icone: any;
}

export function SegmentacaoClientes() {
  const { clientes } = useClientes();
  const { vendas } = useVendas();
  const [segmentos, setSegmentos] = useState<SegmentoCliente[]>([]);
  const [segmentoSelecionado, setSegmentoSelecionado] = useState<string | null>(null);

  useEffect(() => {
    if (clientes.length === 0 || vendas.length === 0) return;

    // Calcular estatísticas por cliente
    const estatisticasClientes = clientes.map(cliente => {
      const vendasCliente = vendas.filter(v => v.cliente_id === cliente.id);
      const valorTotal = vendasCliente.reduce((sum, v) => sum + v.valor_final, 0);
      const ultimaCompra = vendasCliente.length > 0 
        ? Math.max(...vendasCliente.map(v => new Date(v.data_venda).getTime()))
        : 0;
      
      return {
        ...cliente,
        vendasCount: vendasCliente.length,
        valorTotal,
        ticketMedio: vendasCliente.length > 0 ? valorTotal / vendasCliente.length : 0,
        ultimaCompra: new Date(ultimaCompra),
        diasSemComprar: ultimaCompra > 0 ? Math.floor((Date.now() - ultimaCompra) / (1000 * 60 * 60 * 24)) : 999
      };
    });

    // Definir segmentos
    const novosSegmentos: SegmentoCliente[] = [
      {
        id: 'vip',
        nome: 'Clientes VIP',
        descricao: 'Maior valor de compras (top 10%)',
        clientes: estatisticasClientes
          .sort((a, b) => b.valorTotal - a.valorTotal)
          .slice(0, Math.max(1, Math.floor(estatisticasClientes.length * 0.1))),
        valorTotal: 0,
        ticketMedio: 0,
        cor: 'bg-gradient-to-r from-purple-500 to-pink-500',
        icone: Crown
      },
      {
        id: 'frequentes',
        nome: 'Clientes Frequentes',
        descricao: 'Mais de 5 compras realizadas',
        clientes: estatisticasClientes.filter(c => c.vendasCount >= 5),
        valorTotal: 0,
        ticketMedio: 0,
        cor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        icone: Star
      },
      {
        id: 'recentes',
        nome: 'Clientes Recentes',
        descricao: 'Primeira compra nos últimos 30 dias',
        clientes: estatisticasClientes.filter(c => c.diasSemComprar <= 30 && c.vendasCount === 1),
        valorTotal: 0,
        ticketMedio: 0,
        cor: 'bg-gradient-to-r from-green-500 to-emerald-500',
        icone: TrendingUp
      },
      {
        id: 'risco',
        nome: 'Em Risco',
        descricao: 'Sem compras há mais de 90 dias',
        clientes: estatisticasClientes.filter(c => c.diasSemComprar > 90 && c.vendasCount > 0),
        valorTotal: 0,
        ticketMedio: 0,
        cor: 'bg-gradient-to-r from-orange-500 to-red-500',
        icone: Filter
      }
    ];

    // Calcular métricas de cada segmento
    novosSegmentos.forEach(segmento => {
      segmento.valorTotal = segmento.clientes.reduce((sum, c) => sum + c.valorTotal, 0);
      segmento.ticketMedio = segmento.clientes.length > 0 
        ? segmento.valorTotal / segmento.clientes.reduce((sum, c) => sum + c.vendasCount, 0)
        : 0;
    });

    setSegmentos(novosSegmentos);
  }, [clientes, vendas]);

  const exportarSegmento = (segmento: SegmentoCliente) => {
    const headers = ['Nome', 'Documento', 'Email', 'Total Compras', 'Valor Total', 'Ticket Médio', 'Última Compra'];
    const rows = segmento.clientes.map(cliente => [
      cliente.nome,
      cliente.documento,
      cliente.email || '',
      cliente.vendasCount,
      formatarMoeda(cliente.valorTotal),
      formatarMoeda(cliente.ticketMedio),
      cliente.ultimaCompra.toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `segmento_${segmento.id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Cards dos Segmentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {segmentos.map((segmento) => {
          const IconeSegmento = segmento.icone;
          
          return (
            <Card 
              key={segmento.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                segmentoSelecionado === segmento.id 
                  ? 'border-primary shadow-lg' 
                  : 'border-transparent hover:border-primary/50'
              }`}
              onClick={() => setSegmentoSelecionado(
                segmentoSelecionado === segmento.id ? null : segmento.id
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-full ${segmento.cor} flex items-center justify-center`}>
                    <IconeSegmento className="w-5 h-5 text-white" />
                  </div>
                  <Badge variant="secondary">
                    {segmento.clientes.length}
                  </Badge>
                </div>
                <CardTitle className="text-base">{segmento.nome}</CardTitle>
                <p className="text-sm text-muted-foreground">{segmento.descricao}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor Total:</span>
                    <span className="font-medium">{formatarMoeda(segmento.valorTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ticket Médio:</span>
                    <span className="font-medium">{formatarMoeda(segmento.ticketMedio)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detalhes do Segmento Selecionado */}
      {segmentoSelecionado && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>
                    {segmentos.find(s => s.id === segmentoSelecionado)?.nome}
                  </span>
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {segmentos.find(s => s.id === segmentoSelecionado)?.clientes.length} clientes neste segmento
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const segmento = segmentos.find(s => s.id === segmentoSelecionado);
                  if (segmento) exportarSegmento(segmento);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Lista de Clientes */}
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {segmentos
                    .find(s => s.id === segmentoSelecionado)
                    ?.clientes.map((cliente) => (
                      <div 
                        key={cliente.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {cliente.documento} • {cliente.vendasCount} compras
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatarMoeda(cliente.valorTotal)}</p>
                          <p className="text-sm text-muted-foreground">
                            Último: {cliente.ultimaCompra.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Ações do Segmento */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Ações Sugeridas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {segmentoSelecionado === 'vip' && (
                    <>
                      <Button variant="outline" size="sm">Oferecer Desconto Exclusivo</Button>
                      <Button variant="outline" size="sm">Enviar Catálogo Premium</Button>
                      <Button variant="outline" size="sm">Agendar Atendimento VIP</Button>
                    </>
                  )}
                  {segmentoSelecionado === 'frequentes' && (
                    <>
                      <Button variant="outline" size="sm">Programa de Fidelidade</Button>
                      <Button variant="outline" size="sm">Produtos Relacionados</Button>
                      <Button variant="outline" size="sm">Convite para Eventos</Button>
                    </>
                  )}
                  {segmentoSelecionado === 'recentes' && (
                    <>
                      <Button variant="outline" size="sm">Welcome Kit</Button>
                      <Button variant="outline" size="sm">Tutorial de Produtos</Button>
                      <Button variant="outline" size="sm">Feedback da Experiência</Button>
                    </>
                  )}
                  {segmentoSelecionado === 'risco' && (
                    <>
                      <Button variant="outline" size="sm">Campanha de Reativação</Button>
                      <Button variant="outline" size="sm">Desconto Especial</Button>
                      <Button variant="outline" size="sm">Pesquisa de Satisfação</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}