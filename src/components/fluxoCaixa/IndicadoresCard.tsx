import { IndicadorFluxo, STATUS_LIQUIDEZ_COLORS } from '@/types/fluxoCaixa';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, Sparkles } from 'lucide-react';

interface IndicadoresCardProps {
  indicadores: IndicadorFluxo | null;
}

export function IndicadoresCard({ indicadores }: IndicadoresCardProps) {
  if (!indicadores) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm border border-white/20 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      titulo: 'Saldo Atual',
      valor: indicadores.saldo_atual,
      descricao: 'Saldo consolidado dos bancos',
      icone: Wallet,
      cor: '#10b981',
      badge: {
        texto: `Situação: ${indicadores.status_liquidez === 'saudavel' ? 'Saudável' : 
                           indicadores.status_liquidez === 'atencao' ? 'Atenção' : 'Crítico'}`,
        classe: STATUS_LIQUIDEZ_COLORS[indicadores.status_liquidez]
      }
    },
    {
      titulo: 'Entradas do Mês',
      valor: indicadores.entradas_mes,
      descricao: 'Receitas recebidas',
      icone: TrendingUp,
      cor: '#3b82f6',
      detalhes: `${indicadores.entradas_mes_qtd} recebimentos`
    },
    {
      titulo: 'Saídas do Mês',
      valor: indicadores.saidas_mes,
      descricao: 'Despesas pagas',
      icone: TrendingDown,
      cor: '#ef4444',
      detalhes: `${indicadores.saidas_mes_qtd} pagamentos`
    },
    {
      titulo: 'Saldo Projetado (30 dias)',
      valor: indicadores.saldo_projetado_30d,
      descricao: 'Projeção para próximo mês',
      icone: Sparkles,
      cor: '#8b5cf6',
      detalhes: `${indicadores.resultado_mes > 0 ? '+' : ''}${((indicadores.resultado_mes / indicadores.saldo_atual) * 100).toFixed(1)}% vs atual`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card 
          key={index}
          className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${card.cor}15` }}
              >
                <card.icone 
                  className="w-6 h-6" 
                  style={{ color: card.cor }}
                />
              </div>
              {card.badge && (
                <Badge 
                  variant="secondary" 
                  className={`${card.badge.classe} text-xs font-medium px-2 py-1`}
                >
                  ✅ {card.badge.texto}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">
                {card.titulo}
              </h3>
              
              <div className="flex items-baseline gap-2">
                <span 
                  className="text-2xl font-bold"
                  style={{ color: card.cor }}
                >
                  {card.valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </span>
              </div>
              
              <p className="text-sm text-gray-500">
                {card.descricao}
              </p>
              
              {card.detalhes && (
                <p className="text-xs text-gray-400 mt-1">
                  {card.detalhes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}