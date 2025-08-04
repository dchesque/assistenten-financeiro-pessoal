import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Filter, Users, MapPin, DollarSign, ShoppingCart, Mail, MessageSquare } from "lucide-react";
import { ClientesFiltros } from "@/types/cliente";
const estadosBrasil = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface FiltrosInteligentesProps {
  filtros: ClientesFiltros;
  onFiltrosChange: (filtros: ClientesFiltros) => void;
  totalResultados: number;
}

export function FiltrosInteligentes({ 
  filtros, 
  onFiltrosChange, 
  totalResultados 
}: FiltrosInteligentesProps) {
  
  const atualizarFiltro = (campo: keyof ClientesFiltros, valor: string) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  const limparFiltros = () => {
    onFiltrosChange({
      busca: '',
      status: 'todos',
      tipo: 'todos',
      ultimaCompra: 'todos',
      cidade: '',
      estado: 'todos',
      faixaTicket: 'todos',
      totalCompras: 'todos',
      receberPromocoes: 'todos',
      whatsappMarketing: 'todos'
    });
  };

  const contarFiltrosAtivos = () => {
    let count = 0;
    if (filtros.busca) count++;
    if (filtros.status !== 'todos') count++;
    if (filtros.tipo !== 'todos') count++;
    if (filtros.ultimaCompra !== 'todos') count++;
    if (filtros.cidade) count++;
    if (filtros.estado && filtros.estado !== 'todos') count++;
    if (filtros.faixaTicket !== 'todos') count++;
    if (filtros.totalCompras !== 'todos') count++;
    if (filtros.receberPromocoes !== 'todos') count++;
    if (filtros.whatsappMarketing !== 'todos') count++;
    return count;
  };

  const filtrosAtivos = contarFiltrosAtivos();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
      <CardContent className="p-6">
        {/* Cabeçalho dos Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filtros Inteligentes</h3>
              <p className="text-sm text-gray-600">
                {totalResultados} resultado{totalResultados !== 1 ? 's' : ''} encontrado{totalResultados !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {filtrosAtivos > 0 && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-100/80 text-blue-700 border-blue-200">
                {filtrosAtivos} filtro{filtrosAtivos !== 1 ? 's' : ''} ativ{filtrosAtivos !== 1 ? 'os' : 'o'}
              </Badge>
              <Button 
                onClick={limparFiltros}
                variant="outline" 
                size="sm"
                className="bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 rounded-lg"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>

        {/* Filtros Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Busca Geral */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Busca Geral
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={filtros.busca}
                onChange={(e) => atualizarFiltro('busca', e.target.value)}
                placeholder="Nome, documento, telefone, email..."
                className="pl-10 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Status
            </label>
            <Select 
              value={filtros.status} 
              onValueChange={(value) => atualizarFiltro('status', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">🟢 Ativo</SelectItem>
                <SelectItem value="inativo">🔴 Inativo</SelectItem>
                <SelectItem value="bloqueado">🚫 Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cliente</label>
            <Select 
              value={filtros.tipo} 
              onValueChange={(value) => atualizarFiltro('tipo', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="PF">👤 Pessoa Física</SelectItem>
                <SelectItem value="PJ">🏢 Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Avançados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          
          {/* Última Compra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Última Compra</label>
            <Select 
              value={filtros.ultimaCompra} 
              onValueChange={(value) => atualizarFiltro('ultimaCompra', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Qualquer período</SelectItem>
                <SelectItem value="30dias">📅 Últimos 30 dias</SelectItem>
                <SelectItem value="90dias">📅 Últimos 90 dias</SelectItem>
                <SelectItem value="180dias">📅 Últimos 180 dias</SelectItem>
                <SelectItem value="1ano">📅 Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Estado
            </label>
            <Select 
              value={filtros.estado} 
              onValueChange={(value) => atualizarFiltro('estado', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Estados</SelectItem>
                {estadosBrasil.map(estado => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
            <Input
              value={filtros.cidade}
              onChange={(e) => atualizarFiltro('cidade', e.target.value)}
              placeholder="Digite a cidade..."
              className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl"
            />
          </div>

          {/* Faixa de Ticket Médio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ticket Médio
            </label>
            <Select 
              value={filtros.faixaTicket} 
              onValueChange={(value) => atualizarFiltro('faixaTicket', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as faixas</SelectItem>
                <SelectItem value="baixo">💰 Baixo (até R$ 200)</SelectItem>
                <SelectItem value="medio">💰💰 Médio (R$ 201 - R$ 500)</SelectItem>
                <SelectItem value="alto">💰💰💰 Alto (acima de R$ 500)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Total de Compras */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Total de Compras
            </label>
            <Select 
              value={filtros.totalCompras} 
              onValueChange={(value) => atualizarFiltro('totalCompras', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Qualquer quantidade</SelectItem>
                <SelectItem value="0-5">🛒 Até 5 compras</SelectItem>
                <SelectItem value="6-15">🛒🛒 6 a 15 compras</SelectItem>
                <SelectItem value="16-30">🛒🛒🛒 16 a 30 compras</SelectItem>
                <SelectItem value="30+">🛒🛒🛒+ Mais de 30 compras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Receber Promoções */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Promoções
            </label>
            <Select 
              value={filtros.receberPromocoes} 
              onValueChange={(value) => atualizarFiltro('receberPromocoes', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sim">✅ Aceita promoções</SelectItem>
                <SelectItem value="nao">❌ Não aceita promoções</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* WhatsApp Marketing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </label>
            <Select 
              value={filtros.whatsappMarketing} 
              onValueChange={(value) => atualizarFiltro('whatsappMarketing', value)}
            >
              <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sim">📱 Aceita WhatsApp</SelectItem>
                <SelectItem value="nao">🚫 Não aceita WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Badges de Filtros Ativos */}
        {filtrosAtivos > 0 && (
          <div className="border-t border-gray-200/50 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Filtros aplicados:</p>
            <div className="flex flex-wrap gap-2">
              {filtros.busca && (
                <Badge variant="outline" className="bg-blue-100/80 text-blue-700 border-blue-200 rounded-full">
                  Busca: "{filtros.busca}"
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-blue-900" 
                    onClick={() => atualizarFiltro('busca', '')}
                  />
                </Badge>
              )}
              {filtros.status !== 'todos' && (
                <Badge variant="outline" className="bg-green-100/80 text-green-700 border-green-200 rounded-full">
                  Status: {filtros.status}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-green-900" 
                    onClick={() => atualizarFiltro('status', 'todos')}
                  />
                </Badge>
              )}
              {filtros.tipo !== 'todos' && (
                <Badge variant="outline" className="bg-purple-100/80 text-purple-700 border-purple-200 rounded-full">
                  Tipo: {filtros.tipo}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-purple-900" 
                    onClick={() => atualizarFiltro('tipo', 'todos')}
                  />
                </Badge>
              )}
              {filtros.ultimaCompra !== 'todos' && (
                <Badge variant="outline" className="bg-orange-100/80 text-orange-700 border-orange-200 rounded-full">
                  Última compra: {filtros.ultimaCompra}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-orange-900" 
                    onClick={() => atualizarFiltro('ultimaCompra', 'todos')}
                  />
                </Badge>
              )}
              {filtros.cidade && (
                <Badge variant="outline" className="bg-indigo-100/80 text-indigo-700 border-indigo-200 rounded-full">
                  Cidade: {filtros.cidade}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-indigo-900" 
                    onClick={() => atualizarFiltro('cidade', '')}
                  />
                </Badge>
              )}
              {filtros.estado && filtros.estado !== 'todos' && (
                <Badge variant="outline" className="bg-teal-100/80 text-teal-700 border-teal-200 rounded-full">
                  Estado: {filtros.estado}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-teal-900" 
                    onClick={() => atualizarFiltro('estado', 'todos')}
                  />
                </Badge>
              )}
              {filtros.faixaTicket !== 'todos' && (
                <Badge variant="outline" className="bg-yellow-100/80 text-yellow-700 border-yellow-200 rounded-full">
                  Ticket: {filtros.faixaTicket}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-yellow-900" 
                    onClick={() => atualizarFiltro('faixaTicket', 'todos')}
                  />
                </Badge>
              )}
              {filtros.totalCompras !== 'todos' && (
                <Badge variant="outline" className="bg-pink-100/80 text-pink-700 border-pink-200 rounded-full">
                  Compras: {filtros.totalCompras}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-pink-900" 
                    onClick={() => atualizarFiltro('totalCompras', 'todos')}
                  />
                </Badge>
              )}
              {filtros.receberPromocoes !== 'todos' && (
                <Badge variant="outline" className="bg-emerald-100/80 text-emerald-700 border-emerald-200 rounded-full">
                  Promoções: {filtros.receberPromocoes === 'sim' ? 'Aceita' : 'Não aceita'}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-emerald-900" 
                    onClick={() => atualizarFiltro('receberPromocoes', 'todos')}
                  />
                </Badge>
              )}
              {filtros.whatsappMarketing !== 'todos' && (
                <Badge variant="outline" className="bg-cyan-100/80 text-cyan-700 border-cyan-200 rounded-full">
                  WhatsApp: {filtros.whatsappMarketing === 'sim' ? 'Aceita' : 'Não aceita'}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-cyan-900" 
                    onClick={() => atualizarFiltro('whatsappMarketing', 'todos')}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}