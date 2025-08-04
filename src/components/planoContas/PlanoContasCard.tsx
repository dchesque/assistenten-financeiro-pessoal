import { useState } from 'react';
import { Edit, Eye, Trash2, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { PlanoContas, TIPOS_DRE } from '@/types/planoContas';
import { formatarMoeda } from '@/utils/formatters';
import * as icons from 'lucide-react';

interface PlanoContasCardProps {
  planoContas: PlanoContas;
  onEdit: (planoContas: PlanoContas) => void;
  onView: (planoContas: PlanoContas) => void;
  onToggleStatus: (id: number) => void;
}

export default function PlanoContasCard({ planoContas, onEdit, onView, onToggleStatus }: PlanoContasCardProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  
  const IconComponent = (icons as any)[planoContas.icone] || icons.Package;
  const tipoDre = TIPOS_DRE.find(t => t.valor === planoContas.tipo_dre);
  
  const getIndentClass = () => {
    return planoContas.nivel > 1 ? `ml-${(planoContas.nivel - 1) * 6}` : '';
  };

  return (
    <div 
      className={`bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90 ${getIndentClass()}`}
      style={{ 
        borderLeft: `4px solid ${planoContas.cor}`,
        marginLeft: planoContas.nivel > 1 ? `${(planoContas.nivel - 1) * 24}px` : '0'
      }}
    >
      <div className="p-6">
        {/* Header com nível e indicador hierárquico */}
        {planoContas.nivel > 1 && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <span className="mr-2">{'└─'.repeat(planoContas.nivel - 1)}</span>
            <span>Nível {planoContas.nivel}</span>
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Código e nome */}
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: planoContas.cor }}
              >
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-medium text-gray-600 bg-gray-100/80 px-2 py-1 rounded-lg">
                    {planoContas.codigo}
                  </span>
                  {planoContas.nivel === 1 && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-100/80 px-2 py-1 rounded-lg">
                      PRINCIPAL
                    </span>
                  )}
                </div>
                <h3 className={`font-semibold text-gray-900 mt-1 ${
                  planoContas.nivel === 1 ? 'text-lg' : 
                  planoContas.nivel === 2 ? 'text-base' : 'text-sm'
                }`}>
                  {planoContas.nome}
                </h3>
                {planoContas.descricao && (
                  <p className="text-sm text-gray-600 mt-1">{planoContas.descricao}</p>
                )}
              </div>
            </div>

            {/* Tipo DRE e aceita lançamento */}
            <div className="flex items-center space-x-3 mb-4">
              <span 
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: tipoDre?.cor }}
              >
                {tipoDre?.nome}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                planoContas.aceita_lancamento 
                  ? 'bg-green-100/80 text-green-700'
                  : 'bg-gray-100/80 text-gray-700'
              }`}>
                {planoContas.aceita_lancamento ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Aceita Lançamentos
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Apenas Agrupamento
                  </>
                )}
              </span>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/50 rounded-xl p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Total de Contas</p>
                <p className="text-lg font-bold text-blue-700">{planoContas.total_contas}</p>
              </div>
              <div className="bg-green-50/50 rounded-xl p-3">
                <p className="text-xs text-green-600 font-medium mb-1">Valor Total</p>
                <p className="text-lg font-bold text-green-700">{formatarMoeda(planoContas.valor_total)}</p>
              </div>
            </div>
          </div>

          {/* Menu de ações */}
          <div className="relative">
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-all duration-200"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuAberto && (
              <div className="absolute right-0 top-10 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-10 min-w-[160px]">
                <div className="py-2">
                  <button
                    onClick={() => {
                      onView(planoContas);
                      setMenuAberto(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50/80 flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Visualizar</span>
                  </button>
                  <button
                    onClick={() => {
                      onEdit(planoContas);
                      setMenuAberto(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50/80 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => {
                      onToggleStatus(planoContas.id);
                      setMenuAberto(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50/80 flex items-center space-x-2 ${
                      planoContas.ativo ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {planoContas.ativo ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Desativar</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Ativar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center justify-between">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            planoContas.ativo 
              ? 'bg-green-100/80 text-green-700'
              : 'bg-red-100/80 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              planoContas.ativo ? 'bg-green-600' : 'bg-red-600'
            }`}></div>
            {planoContas.ativo ? 'Ativo' : 'Inativo'}
          </span>
          
          <span className="text-xs text-gray-500">
            Criado em {new Date(planoContas.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
}