import React from 'react';
import { Trophy, Crown, Medal, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRankingVendedores } from '@/hooks/useRankingVendedores';
import { formatarMoeda } from '@/utils/formatters';

interface RankingVendedoresModalProps {
  aberto: boolean;
  onFechar: () => void;
}

const PERIODOS = [
  { valor: 'mes_atual', nome: 'Mês Atual' },
  { valor: 'mes_anterior', nome: 'Mês Anterior' },
  { valor: 'trimestre', nome: 'Trimestre' },
  { valor: 'ano', nome: 'Ano' }
];

export const RankingVendedoresModal: React.FC<RankingVendedoresModalProps> = ({
  aberto,
  onFechar
}) => {
  const { ranking, loading, periodo, alterarPeriodo } = useRankingVendedores();

  const getRankingIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{posicao}</span>;
    }
  };

  const getRankingClass = (posicao: number) => {
    switch (posicao) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200';
      default:
        return 'bg-white/80 backdrop-blur-sm border-white/20';
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking de Vendedores
            </DialogTitle>
            <div className="flex items-center gap-4">
              <Select value={periodo} onValueChange={alterarPeriodo}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map(p => (
                    <SelectItem key={p.valor} value={p.valor}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Top 3 em destaque */}
          {ranking.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ranking.slice(0, 3).map((vendedor) => (
                <Card 
                  key={vendedor.vendedor_id} 
                  className={`text-center ${getRankingClass(vendedor.ranking_posicao)}`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      {getRankingIcon(vendedor.ranking_posicao)}
                    </div>
                    
                    <Avatar className="h-16 w-16 mx-auto mb-4">
                      <AvatarImage src={vendedor.foto_url} alt={vendedor.vendedor_nome} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                        {vendedor.vendedor_nome.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="font-semibold text-gray-900 mb-1">{vendedor.vendedor_nome}</h3>
                    <p className="text-sm text-gray-600 mb-3">{vendedor.codigo_vendedor}</p>
                    
                    <div className="space-y-2">
                      <div className="text-lg font-bold text-green-600">
                        {formatarMoeda(vendedor.valor_vendido)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {vendedor.total_vendas} vendas
                      </div>
                      
                      {vendedor.meta_mensal > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Meta: {formatarMoeda(vendedor.meta_mensal)}</span>
                            <span>{vendedor.percentual_meta.toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={Math.min(vendedor.percentual_meta, 100)} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Lista completa */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking Completo</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Carregando ranking...</div>
                </div>
              ) : ranking.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum dado de ranking
                  </h3>
                  <p className="text-gray-600">
                    Não há vendas registradas para o período selecionado.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ranking.map((vendedor) => (
                    <div 
                      key={vendedor.vendedor_id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${getRankingClass(vendedor.ranking_posicao)}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8">
                          {getRankingIcon(vendedor.ranking_posicao)}
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={vendedor.foto_url} alt={vendedor.vendedor_nome} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm">
                            {vendedor.vendedor_nome.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900">{vendedor.vendedor_nome}</h4>
                          <p className="text-sm text-gray-600">{vendedor.codigo_vendedor}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatarMoeda(vendedor.valor_vendido)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {vendedor.total_vendas} vendas
                        </div>
                        {vendedor.meta_mensal > 0 && (
                          <Badge 
                            variant={vendedor.percentual_meta >= 100 ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {vendedor.percentual_meta.toFixed(1)}% da meta
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onFechar}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};