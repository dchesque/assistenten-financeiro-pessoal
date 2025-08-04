import { AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DadosEssenciaisDRE {
  id?: number;
  mes_referencia: string;
  cmv_valor: number;
  estoque_inicial_qtd?: number;
  estoque_inicial_valor?: number;
  estoque_final_qtd?: number;
  estoque_final_valor?: number;
}

interface StatusDadosEssenciaisProps {
  periodo: string;
  dadosEssenciais?: DadosEssenciaisDRE;
  onAbrirModal: () => void;
}

export function StatusDadosEssenciais({ 
  periodo, 
  dadosEssenciais, 
  onAbrirModal 
}: StatusDadosEssenciaisProps) {
  
  if (!dadosEssenciais?.cmv_valor) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              CMV não informado para {periodo}
            </span>
          </div>
          <Button 
            onClick={onAbrirModal}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Lançar Agora
          </Button>
        </div>
        <p className="text-sm text-yellow-700 mt-2">
          Para um DRE mais preciso, informe o custo das mercadorias vendidas (CMV) do período.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">
            Dados essenciais completos para {periodo}
          </span>
        </div>
        <Button 
          onClick={onAbrirModal}
          variant="outline"
          size="sm"
          className="border-green-300 text-green-700 hover:bg-green-100"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>
      <p className="text-sm text-green-700 mt-2">
        CMV: R$ {dadosEssenciais.cmv_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        {dadosEssenciais.estoque_inicial_qtd && dadosEssenciais.estoque_final_qtd && (
          <span className="ml-4">
            • Estoque: {dadosEssenciais.estoque_inicial_qtd} → {dadosEssenciais.estoque_final_qtd} peças
          </span>
        )}
      </p>
    </div>
  );
}