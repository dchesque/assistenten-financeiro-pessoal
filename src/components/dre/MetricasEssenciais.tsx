import { Package, RotateCcw, TrendingUp, DollarSign } from "lucide-react";
import { formatarMoeda } from "@/utils/formatters";

interface DadosEssenciaisDRE {
  id?: number;
  mes_referencia: string;
  cmv_valor: number;
  estoque_inicial_qtd?: number;
  estoque_inicial_valor?: number;
  estoque_final_qtd?: number;
  estoque_final_valor?: number;
}

interface MetricasEssenciaisProps {
  dadosEssenciais?: DadosEssenciaisDRE;
  receitaLiquida: number;
}

export function MetricasEssenciais({ dadosEssenciais, receitaLiquida }: MetricasEssenciaisProps) {
  if (!dadosEssenciais?.cmv_valor) return null;

  const calcularGiroEstoque = () => {
    if (!dadosEssenciais.estoque_inicial_valor || !dadosEssenciais.estoque_final_valor) {
      return 0;
    }
    
    const estoqueMedio = (dadosEssenciais.estoque_inicial_valor + dadosEssenciais.estoque_final_valor) / 2;
    if (estoqueMedio === 0) return 0;
    
    return dadosEssenciais.cmv_valor / estoqueMedio;
  };

  const calcularMargemCMV = () => {
    if (receitaLiquida === 0) return 0;
    return (dadosEssenciais.cmv_valor / receitaLiquida) * 100;
  };

  const giroEstoque = calcularGiroEstoque();
  const margemCMV = calcularMargemCMV();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {/* Card CMV */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">CMV do Período</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatarMoeda(dadosEssenciais.cmv_valor)}
            </p>
            <p className="text-sm text-gray-500">
              {margemCMV.toFixed(1)}% da receita líquida
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Card Giro de Estoque */}
      {giroEstoque > 0 && (
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Giro de Estoque</p>
              <p className="text-2xl font-bold text-gray-900">
                {giroEstoque.toFixed(1)}x
              </p>
              <p className="text-sm text-gray-500">
                Rotatividade mensal
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Card Estoque Inicial */}
      {dadosEssenciais.estoque_inicial_qtd && dadosEssenciais.estoque_inicial_valor && (
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estoque Inicial</p>
              <p className="text-xl font-bold text-gray-900">
                {dadosEssenciais.estoque_inicial_qtd} peças
              </p>
              <p className="text-sm text-gray-500">
                {formatarMoeda(dadosEssenciais.estoque_inicial_valor)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Card Estoque Final */}
      {dadosEssenciais.estoque_final_qtd && dadosEssenciais.estoque_final_valor && (
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estoque Final</p>
              <p className="text-xl font-bold text-gray-900">
                {dadosEssenciais.estoque_final_qtd} peças
              </p>
              <p className="text-sm text-gray-500">
                {formatarMoeda(dadosEssenciais.estoque_final_valor)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}