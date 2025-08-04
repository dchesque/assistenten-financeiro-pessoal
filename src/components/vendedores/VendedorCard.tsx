import React, { memo } from 'react';
import { 
  MoreVertical, 
  Mail, 
  Phone, 
  TrendingUp, 
  Target, 
  Crown, 
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Briefcase,
  Calendar,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Vendedor, STATUS_VENDEDOR } from '@/types/vendedor';
import { formatarMoeda, formatarData } from '@/utils/formatters';

interface VendedorCardProps {
  vendedor: Vendedor;
  onEditar: (vendedor: Vendedor) => void;
  onVisualizar: (vendedor: Vendedor) => void;
  onToggleStatus: (id: number) => void;
  onExcluir: (id: number) => void;
}

const VendedorCardComponent: React.FC<VendedorCardProps> = ({
  vendedor,
  onEditar,
  onVisualizar,
  onToggleStatus,
  onExcluir
}) => {
  const statusInfo = STATUS_VENDEDOR.find(s => s.valor === vendedor.status);
  const iniciais = vendedor.nome.split(' ').map(n => n[0]).join('').toUpperCase();

  // Calcular percentual da meta (se existir)
  const percentualMeta = vendedor.meta_mensal > 0 
    ? (vendedor.valor_total_vendido / vendedor.meta_mensal) * 100 
    : 0;

  const getPerformanceColor = () => {
    if (percentualMeta >= 100) return 'text-green-600';
    if (percentualMeta >= 80) return 'text-blue-600';
    if (percentualMeta >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRankingBadge = () => {
    if (vendedor.ranking_atual === 1) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
          <Crown className="h-3 w-3 mr-1" />
          #1
        </Badge>
      );
    }
    if (vendedor.ranking_atual === 2) {
      return (
        <Badge className="bg-gradient-to-r from-gray-400 to-gray-600 text-white">
          <Award className="h-3 w-3 mr-1" />
          #2
        </Badge>
      );
    }
    if (vendedor.ranking_atual === 3) {
      return (
        <Badge className="bg-gradient-to-r from-orange-400 to-orange-600 text-white">
          <Award className="h-3 w-3 mr-1" />
          #3
        </Badge>
      );
    }
    if (vendedor.ranking_atual > 0) {
      return (
        <Badge variant="outline" className="text-gray-600">
          #{vendedor.ranking_atual}
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-300 hover:shadow-xl group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="h-11 w-11 lg:h-12 lg:w-12 ring-2 ring-white/50">
              <AvatarImage src={vendedor.foto_url} alt={vendedor.nome} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                {iniciais}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate text-sm lg:text-base">
                {vendedor.nome}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs lg:text-sm text-gray-500 font-medium">
                  {vendedor.codigo_vendedor}
                </p>
                <Briefcase className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500 truncate">
                  {vendedor.cargo}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2">
            {getRankingBadge()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onVisualizar(vendedor)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditar(vendedor)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleStatus(vendedor.id)}>
                  {vendedor.status === 'ativo' ? (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-2" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <ToggleRight className="h-4 w-4 mr-2" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onExcluir(vendedor.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <Badge 
            variant={vendedor.status === 'ativo' ? 'default' : 'secondary'}
            className={`text-xs ${
              statusInfo?.cor === 'green' ? 'bg-green-100/80 text-green-700 border-green-200' :
              statusInfo?.cor === 'red' ? 'bg-red-100/80 text-red-700 border-red-200' :
              statusInfo?.cor === 'yellow' ? 'bg-yellow-100/80 text-yellow-700 border-yellow-200' :
              'bg-gray-100/80 text-gray-700 border-gray-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${
              statusInfo?.cor === 'green' ? 'bg-green-600' :
              statusInfo?.cor === 'red' ? 'bg-red-600' :
              statusInfo?.cor === 'yellow' ? 'bg-yellow-600' :
              'bg-gray-600'
            }`}></div>
            {statusInfo?.nome}
          </Badge>
          
          {vendedor.data_ultima_venda && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Última venda: </span>
              <span>{formatarData(vendedor.data_ultima_venda)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Performance Grid */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 text-center border border-green-100">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-sm lg:text-base font-bold text-green-700">
              {vendedor.total_vendas}
            </p>
            <p className="text-xs text-green-600">Vendas</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 text-center border border-blue-100">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs lg:text-sm font-bold text-blue-700 truncate">
              {formatarMoeda(vendedor.valor_total_vendido)}
            </p>
            <p className="text-xs text-blue-600">Faturamento</p>
          </div>
        </div>

        {/* Meta Progress (se existir) */}
        {vendedor.meta_mensal > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600">Meta Mensal</span>
              <span className={`text-xs font-bold ${getPerformanceColor()}`}>
                {percentualMeta.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  percentualMeta >= 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  percentualMeta >= 80 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  percentualMeta >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                  'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${Math.min(percentualMeta, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatarMoeda(vendedor.valor_total_vendido)}</span>
              <span>{formatarMoeda(vendedor.meta_mensal)}</span>
            </div>
          </div>
        )}

        {/* Métricas Financeiras */}
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1">
            <span className="text-xs lg:text-sm text-gray-600">Comissão Total:</span>
            <span className="text-xs lg:text-sm font-semibold text-green-600">
              {formatarMoeda(vendedor.comissao_total_recebida)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-xs lg:text-sm text-gray-600">Ticket Médio:</span>
            <span className="text-xs lg:text-sm font-semibold text-blue-600">
              {formatarMoeda(vendedor.ticket_medio)}
            </span>
          </div>
        </div>

        {/* Contato */}
        <div className="pt-3 border-t border-gray-100">
          <div className="space-y-1">
            {vendedor.email && (
              <div className="flex items-center text-gray-600">
                <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="text-xs truncate">{vendedor.email}</span>
              </div>
            )}
            {vendedor.telefone && (
              <div className="flex items-center text-gray-600">
                <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                <span className="text-xs">{vendedor.telefone}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Memoizar o componente para otimização de performance
export const VendedorCard = memo(VendedorCardComponent, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders desnecessários
  return (
    prevProps.vendedor.id === nextProps.vendedor.id &&
    prevProps.vendedor.nome === nextProps.vendedor.nome &&
    prevProps.vendedor.status === nextProps.vendedor.status &&
    prevProps.vendedor.total_vendas === nextProps.vendedor.total_vendas &&
    prevProps.vendedor.valor_total_vendido === nextProps.vendedor.valor_total_vendido &&
    prevProps.vendedor.ranking_atual === nextProps.vendedor.ranking_atual &&
    prevProps.vendedor.updated_at === nextProps.vendedor.updated_at
  );
});