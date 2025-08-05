import { FileText, DollarSign, Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface EstadoVazioPremiumProps {
  tipo: 'contas' | 'recebimentos' | 'vendas';
  onNovo: () => void;
}

const configuracoes = {
  contas: {
    icone: <FileText className="w-8 h-8 text-white" />,
    titulo: 'Nenhuma conta a pagar cadastrada',
    descricao: 'Comece criando sua primeira conta ou importe várias contas de uma vez usando nosso lançamento em lote.',
    botaoPrimario: 'Cadastrar Primeira Conta',
    botaoSecundario: 'Lançamento em Lote',
    rota: '/lancamento-lote'
  },
  recebimentos: {
    icone: <DollarSign className="w-8 h-8 text-white" />,
    titulo: 'Nenhum recebimento cadastrado',
    descricao: 'Registre suas receitas e entradas financeiras para ter controle total das suas finanças.',
    botaoPrimario: 'Cadastrar Primeiro Recebimento',
    botaoSecundario: 'Recebimentos Recorrentes',
    rota: '/lancamento-recorrente'
  },
  vendas: {
    icone: <Package className="w-8 h-8 text-white" />,
    titulo: 'Nenhuma venda registrada',
    descricao: 'Comece registrando suas vendas para acompanhar o desempenho do seu negócio.',
    botaoPrimario: 'Registrar Primeira Venda',
    botaoSecundario: 'Vendas em Lote',
    rota: '/vendas-lote'
  }
};

export function EstadoVazioPremium({ tipo, onNovo }: EstadoVazioPremiumProps) {
  const navigate = useNavigate();
  const config = configuracoes[tipo];

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-12 text-center shadow-lg animate-fade-in">
      <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
        {config.icone}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-3">
        {config.titulo}
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
        {config.descricao}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onNovo}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4" />
          <span>{config.botaoPrimario}</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigate(config.rota)}
          className="flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-sm border-white/20"
        >
          <Package className="w-4 h-4" />
          <span>{config.botaoSecundario}</span>
        </Button>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div className="text-sm text-blue-800 text-left">
            <p className="font-medium mb-1">Dica:</p>
            <p>Use o lançamento em lote para importar várias contas de uma vez, ideal para faturas parceladas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}