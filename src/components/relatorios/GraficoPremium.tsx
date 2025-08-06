import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { LineChart, BarChart, PieChart, Line, Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatarMoeda } from '@/lib/formatacaoBrasileira';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface GraficoPremiumProps {
  dados: any[];
  tipo: 'linha' | 'barra' | 'pizza' | 'area';
  titulo: string;
  subtitulo?: string;
  cores: string[];
  formatacao: 'moeda' | 'numero' | 'percentual';
  periodo?: string;
  loading?: boolean;
  onPeriodoChange?: (periodo: string) => void;
  onExportar?: () => void;
  className?: string;
}

export function GraficoPremium({
  dados,
  tipo,
  titulo,
  subtitulo,
  cores,
  formatacao,
  periodo = '30d',
  loading = false,
  onPeriodoChange,
  onExportar,
  className
}: GraficoPremiumProps) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState(periodo);

  const handlePeriodoChange = (novoPeriodo: string) => {
    setPeriodoSelecionado(novoPeriodo);
    onPeriodoChange?.(novoPeriodo);
  };

  const formatarValor = (value: any) => {
    switch (formatacao) {
      case 'moeda':
        return formatarMoeda(Number(value));
      case 'percentual':
        return `${Number(value).toFixed(1)}%`;
      case 'numero':
        return Number(value).toLocaleString('pt-BR');
      default:
        return value;
    }
  };

  const opcoesPerioso = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: '6m', label: '6 meses' },
    { value: '1y', label: '1 ano' }
  ];

  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
          {subtitulo && (
            <p className="text-sm text-gray-600 mt-1">{subtitulo}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {onPeriodoChange && (
            <Select value={periodoSelecionado} onValueChange={handlePeriodoChange}>
              <SelectTrigger className="w-32 bg-white/80 backdrop-blur-sm border-gray-300/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opcoesPerioso.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {onExportar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportar}
              className="bg-white/80 backdrop-blur-sm border-gray-300/50"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Gráfico */}
      <div className="relative h-64 lg:h-80">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600 font-medium">
                Carregando dados do gráfico...
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {(() => {
              if (tipo === 'linha') {
                return (
                  <LineChart data={dados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="periodo" 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={formatarValor}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                      labelStyle={{ color: '#374151', fontWeight: 500 }}
                      formatter={(value: any, name: string) => [
                        formatarValor(value),
                        name
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valor" 
                      stroke={cores[0]} 
                      strokeWidth={3}
                      dot={{ fill: cores[0], strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: cores[0], strokeWidth: 2, fill: '#ffffff' }}
                    />
                  </LineChart>
                );
              }
              
              if (tipo === 'barra') {
                return (
                  <BarChart data={dados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="categoria" 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={formatarValor}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px'
                      }}
                      formatter={(value: any) => [formatarValor(value), 'Valor']}
                    />
                    <Bar 
                      dataKey="valor" 
                      fill={cores[0]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                );
              }
              
              if (tipo === 'pizza') {
                return (
                  <PieChart>
                    <Pie
                      data={dados}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="valor"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {dados.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px'
                      }}
                      formatter={(value: any) => [formatarValor(value), 'Valor']}
                    />
                  </PieChart>
                );
              }
              
              return null;
            })()}
          </ResponsiveContainer>
        )}
      </div>

      {/* Legenda personalizada para gráfico de pizza */}
      {tipo === 'pizza' && !loading && (
        <div className="flex flex-wrap justify-center mt-4 gap-4">
          {dados.map((item, index) => (
            <div key={item.name} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cores[index % cores.length] }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}