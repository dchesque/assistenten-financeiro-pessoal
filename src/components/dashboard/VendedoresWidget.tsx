import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Crown, ChevronRight } from 'lucide-react';
import { useVendedores } from '@/hooks/useVendedores';
import { formatarMoeda } from '@/utils/formatters';

export const VendedoresWidget: React.FC = () => {
  const { vendedoresFiltrados, resumos, loading } = useVendedores();

  // Top 3 vendedores
  const topVendedores = vendedoresFiltrados
    .filter(v => v.status === 'ativo')
    .sort((a, b) => b.valor_total_vendido - a.valor_total_vendido)
    .slice(0, 3);

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-2 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Top Vendedores
          </CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {resumos.vendedores_ativos} ativos
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo Geral */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="text-center">
            <p className="text-sm text-gray-600">Faturamento Total</p>
            <p className="text-lg font-bold text-gray-900">
              {formatarMoeda(resumos.total_vendido)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Comissões Pagas</p>
            <p className="text-lg font-bold text-green-600">
              {formatarMoeda(resumos.total_comissoes)}
            </p>
          </div>
        </div>

        {/* Top 3 Vendedores */}
        <div className="space-y-3">
          {topVendedores.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum vendedor ativo encontrado</p>
            </div>
          ) : (
            topVendedores.map((vendedor, index) => {
              const iniciais = vendedor.nome.split(' ').map(n => n[0]).join('').toUpperCase();
              
              return (
                <Link
                  key={vendedor.id}
                  to={`/vendedor-analytics/${vendedor.id}`}
                  className="block"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={vendedor.foto_url} alt={vendedor.nome} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm">
                          {iniciais}
                        </AvatarFallback>
                      </Avatar>
                      {index === 0 && (
                        <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">
                          {vendedor.nome}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                            index === 1 ? 'bg-gray-100 text-gray-700 border-gray-300' :
                            'bg-orange-100 text-orange-700 border-orange-300'
                          }`}
                        >
                          #{index + 1}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600">
                          {vendedor.total_vendas} vendas
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatarMoeda(vendedor.valor_total_vendido)}
                        </p>
                      </div>
                    </div>
                    
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Botão Ver Todos */}
        <div className="pt-2 border-t border-gray-200">
          <Link to="/vendedores">
            <Button variant="outline" className="w-full group">
              <Users className="h-4 w-4 mr-2" />
              Ver Todos os Vendedores
              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};