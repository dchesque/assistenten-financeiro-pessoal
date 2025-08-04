
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX, Timer, Upload, Download, Plus, Eye, Edit, Building2, User, Phone, Mail, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { createBreadcrumb } from "@/utils/breadcrumbUtils";
import { ClienteModal } from "@/components/clientes/ClienteModal";
import { ImportarCSVModal } from "@/components/clientes/ImportarCSVModal";
import { ExportarClientesModal } from "@/components/clientes/ExportarClientesModal";
import { ClienteVisualizarModal } from "@/components/clientes/ClienteVisualizarModal";
import { FiltrosInteligentes } from "@/components/clientes/FiltrosInteligentes";
import { Cliente, ClientesFiltros } from "@/types/cliente";
import { useClientesSupabase } from "@/hooks/useClientesSupabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Clientes() {
  const { 
    clientes, 
    loading, 
    error, 
    estatisticas,
    criarCliente,
    atualizarCliente,
    excluirCliente,
    recarregar
  } = useClientesSupabase();
  const [filtros, setFiltros] = useState<ClientesFiltros>({
    busca: '',
    status: 'todos',
    tipo: 'todos',
    ultimaCompra: 'todos',
    cidade: '',
    estado: '',
    faixaTicket: 'todos',
    totalCompras: 'todos',
    receberPromocoes: 'todos',
    whatsappMarketing: 'todos'
  });
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
  const [modalExportacaoAberto, setModalExportacaoAberto] = useState(false);
  const [modalVisualizarAberto, setModalVisualizarAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | undefined>();
  
  const { toast } = useToast();

  const filtrarClientes = () => {
    return clientes.filter(cliente => {
      // Busca geral
      const matchBusca = !filtros.busca || 
        cliente.nome.toLowerCase().includes(filtros.busca.toLowerCase()) || 
        cliente.documento.includes(filtros.busca) || 
        cliente.telefone?.includes(filtros.busca) || 
        cliente.email?.toLowerCase().includes(filtros.busca.toLowerCase());
      
      // Status
      const matchStatus = filtros.status === 'todos' || cliente.status === filtros.status;
      
      // Tipo
      const matchTipo = filtros.tipo === 'todos' || cliente.tipo === filtros.tipo;
      
      // Última compra
      const matchUltimaCompra = (() => {
        if (filtros.ultimaCompra === 'todos') return true;
        if (!cliente.dataUltimaCompra) return false;
        
        const ultimaCompra = new Date(cliente.dataUltimaCompra);
        const hoje = new Date();
        const diasAtras = Math.floor((hoje.getTime() - ultimaCompra.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filtros.ultimaCompra) {
          case '30dias': return diasAtras <= 30;
          case '90dias': return diasAtras <= 90;
          case '180dias': return diasAtras <= 180;
          case '1ano': return diasAtras <= 365;
          default: return true;
        }
      })();
      
      // Cidade
      const matchCidade = !filtros.cidade || 
        cliente.cidade?.toLowerCase().includes(filtros.cidade.toLowerCase());
      
      // Estado
      const matchEstado = !filtros.estado || cliente.estado === filtros.estado;
      
      // Faixa de ticket médio
      const matchFaixaTicket = (() => {
        if (filtros.faixaTicket === 'todos') return true;
        const ticket = cliente.ticketMedio;
        
        switch (filtros.faixaTicket) {
          case 'baixo': return ticket <= 200;
          case 'medio': return ticket > 200 && ticket <= 500;
          case 'alto': return ticket > 500;
          default: return true;
        }
      })();
      
      // Total de compras
      const matchTotalCompras = (() => {
        if (filtros.totalCompras === 'todos') return true;
        const total = cliente.totalCompras;
        
        switch (filtros.totalCompras) {
          case '0-5': return total <= 5;
          case '6-15': return total >= 6 && total <= 15;
          case '16-30': return total >= 16 && total <= 30;
          case '30+': return total > 30;
          default: return true;
        }
      })();
      
      // Receber promoções
      const matchPromocoes = filtros.receberPromocoes === 'todos' || 
        (filtros.receberPromocoes === 'sim' && cliente.receberPromocoes) ||
        (filtros.receberPromocoes === 'nao' && !cliente.receberPromocoes);
      
      // WhatsApp marketing
      const matchWhatsApp = filtros.whatsappMarketing === 'todos' || 
        (filtros.whatsappMarketing === 'sim' && cliente.whatsappMarketing) ||
        (filtros.whatsappMarketing === 'nao' && !cliente.whatsappMarketing);
      
      return matchBusca && matchStatus && matchTipo && matchUltimaCompra && 
             matchCidade && matchEstado && matchFaixaTicket && matchTotalCompras && 
             matchPromocoes && matchWhatsApp;
    });
  };

  const clientesFiltrados = filtrarClientes();

  const handleSalvarCliente = async (clienteData: Partial<Cliente>) => {
    try {
      if (clienteSelecionado) {
        await atualizarCliente(clienteSelecionado.id, clienteData);
      } else {
        await criarCliente(clienteData as any);
      }
      setClienteSelecionado(undefined);
      setModalClienteAberto(false);
    } catch (error) {
      // Error já tratado pelo hook
    }
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setModalClienteAberto(true);
  };

  const handleVisualizarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setModalVisualizarAberto(true);
  };

  const handleImportacaoConcluida = (resultado?: any) => {
    // Recarregar lista de clientes após importação
    recarregar();
    
    if (resultado?.importados > 0) {
      toast({
        title: "Importação concluída",
        description: `${resultado.importados} cliente(s) importado(s) com sucesso!`,
      });
    }
    
    if (resultado?.erros?.length > 0) {
      console.warn('Erros na importação:', resultado.erros);
    }
  };

  const obterIniciais = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const obterCorStatus = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-emerald-100/80 text-emerald-700';
      case 'inativo':
        return 'bg-gray-100/80 text-gray-700';
      case 'bloqueado':
        return 'bg-red-100/80 text-red-700';
      default:
        return 'bg-gray-100/80 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 p-4 lg:p-8 space-y-6">
          {/* Header Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-5 w-80" />
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Skeleton */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/40">
                    <tr>
                      {[...Array(6)].map((_, i) => (
                        <th key={i} className="text-left p-4">
                          <Skeleton className="h-4 w-20" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="p-4">
                            <Skeleton className="h-4 w-16" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      
      {/* Blur decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 lg:p-8 space-y-6">
        
        {/* Page Header */}
        <PageHeader
          breadcrumb={createBreadcrumb('/clientes')}
          title="Clientes"
          subtitle="Base de clientes • Histórico de compras e relacionamento"
          actions={
            <>
              <Button 
                variant="outline" 
                onClick={() => setModalExportacaoAberto(true)}
                className="bg-white/80 backdrop-blur-sm border-white/20"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setModalImportacaoAberto(true)}
                className="bg-white/80 backdrop-blur-sm border-white/20"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button 
                onClick={() => {
                  setClienteSelecionado(undefined);
                  setModalClienteAberto(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </>
          }
        />

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-blue-700 font-medium">Total de Clientes</p>
                  <p className="text-2xl font-bold text-blue-900">{estatisticas.totalClientes}</p>
                  <p className="text-xs text-blue-600">Total cadastrados</p>
                </div>
              </div>
              <div className="mt-3">
                <Badge variant="outline" className="bg-blue-100/60 text-blue-700 border-blue-200/50">
                  +{estatisticas.crescimentoMensal}% este mês
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 backdrop-blur-sm border border-emerald-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-600 rounded-xl shadow-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-emerald-700 font-medium">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-emerald-900">{estatisticas.clientesAtivos}</p>
                  <p className="text-xs text-emerald-600">Com compras nos últimos 90 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50/80 to-red-100/40 backdrop-blur-sm border border-red-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg">
                  <UserX className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">Clientes Inativos</p>
                  <p className="text-2xl font-bold text-red-900">{estatisticas.clientesInativos}</p>
                  <p className="text-xs text-red-600">Sem compras há mais de 90 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-100/40 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-indigo-700 font-medium">Tempo Médio de Retorno</p>
                  <p className="text-2xl font-bold text-indigo-900">{estatisticas.tempoMedioRetorno} dias</p>
                  <p className="text-xs text-indigo-600">Tempo médio entre compras realizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Inteligentes */}
        <FiltrosInteligentes 
          filtros={filtros}
          onFiltrosChange={setFiltros}
          totalResultados={clientesFiltrados.length}
        />

        {/* Ações Rápidas */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button 
                onClick={() => setModalExportacaoAberto(true)} 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Dados
              </Button>
              <Button 
                onClick={() => setModalImportacaoAberto(true)} 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 rounded-xl"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV/Excel
              </Button>
              <Button 
                onClick={() => {
                  setClienteSelecionado(undefined);
                  setModalClienteAberto(true);
                }} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Clientes */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Clientes ({clientesFiltrados.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {clientesFiltrados.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/40">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700">Cliente</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Documento</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Contato</th>
                      <th className="text-right p-4 font-semibold text-gray-700">Compras</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Status</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientesFiltrados.map(cliente => (
                      <tr key={cliente.id} className="hover:bg-white/40 transition-all duration-200">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {obterIniciais(cliente.nome)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{cliente.nome}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {cliente.cidade && cliente.estado ? `${cliente.cidade}, ${cliente.estado}` : 'Endereço não informado'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant="outline" 
                            className={cliente.tipo === 'PF' ? 'bg-blue-100/80 text-blue-700' : 'bg-purple-100/80 text-purple-700'}
                          >
                            {cliente.tipo === 'PF' ? 'CPF' : 'CNPJ'}
                          </Badge>
                          <div className="text-sm mt-1 font-mono">{cliente.documento}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm space-y-1">
                            {cliente.telefone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {cliente.telefone}
                              </div>
                            )}
                            {cliente.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {cliente.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-medium">{cliente.totalCompras}</div>
                          <div className="text-sm text-gray-500">compras</div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge 
                            variant="outline" 
                            className={`rounded-full ${obterCorStatus(cliente.status)}`}
                          >
                            {cliente.status === 'ativo' ? '🟢 Ativo' : 
                             cliente.status === 'inativo' ? '🔴 Inativo' : '🚫 Bloqueado'}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleVisualizarCliente(cliente)} 
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditarCliente(cliente)} 
                              className="text-emerald-600 hover:bg-emerald-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum cliente encontrado</h3>
                <p className="text-gray-600 mb-4">Adicione seu primeiro cliente para começar.</p>
                <Button 
                  onClick={() => {
                    setClienteSelecionado(undefined);
                    setModalClienteAberto(true);
                  }} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modals */}
      <ClienteModal 
        isOpen={modalClienteAberto} 
        onClose={() => {
          setModalClienteAberto(false);
          setClienteSelecionado(undefined);
        }} 
        onSave={handleSalvarCliente} 
        cliente={clienteSelecionado} 
      />

      <ImportarCSVModal 
        isOpen={modalImportacaoAberto} 
        onClose={() => setModalImportacaoAberto(false)} 
        onImport={handleImportacaoConcluida} 
      />

      <ExportarClientesModal 
        isOpen={modalExportacaoAberto} 
        onClose={() => setModalExportacaoAberto(false)} 
        clientes={clientes}
        clientesFiltrados={clientesFiltrados}
      />

      {clienteSelecionado && (
        <ClienteVisualizarModal 
          isOpen={modalVisualizarAberto} 
          onClose={() => {
            setModalVisualizarAberto(false);
            setClienteSelecionado(undefined);
          }} 
          cliente={clienteSelecionado} 
        />
      )}
    </div>
  );
}
