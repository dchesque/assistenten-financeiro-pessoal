import { useState, useEffect } from 'react';
import { X, Save, Wand2 } from 'lucide-react';
import { PlanoContas, TIPOS_DRE, CORES_PLANO_CONTAS, ICONES_PLANO_CONTAS } from '@/types/planoContas';
import { Label } from '@/components/ui/label';
import * as icons from 'lucide-react';
import { toast } from 'sonner';

interface PlanoContasModalProps {
  isOpen: boolean;
  onClose: () => void;
  planoContas: PlanoContas | null;
  planosContas: PlanoContas[];
  modo: 'criar' | 'editar' | 'visualizar';
  onSave: (planoContas: PlanoContas) => void;
}

export default function PlanoContasModal({
  isOpen,
  onClose,
  planoContas,
  planosContas,
  modo,
  onSave
}: PlanoContasModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    icone: 'Package',
    plano_pai_id: '',
    tipo_dre: 'despesa_administrativa' as PlanoContas['tipo_dre'],
    aceita_lancamento: false,
    ativo: true
  });

  const readonly = modo === 'visualizar';
  const isEdicao = modo === 'editar';

  useEffect(() => {
    if (planoContas && (modo === 'editar' || modo === 'visualizar')) {
      setFormData({
        codigo: planoContas.codigo,
        nome: planoContas.nome,
        descricao: planoContas.descricao || '',
        cor: planoContas.cor,
        icone: planoContas.icone,
        plano_pai_id: planoContas.plano_pai_id?.toString() || '',
        tipo_dre: planoContas.tipo_dre,
        aceita_lancamento: planoContas.aceita_lancamento,
        ativo: planoContas.ativo
      });
    } else if (modo === 'criar') {
      setFormData({
        codigo: '',
        nome: '',
        descricao: '',
        cor: '#3B82F6',
        icone: 'Package',
        plano_pai_id: '',
        tipo_dre: 'despesa_pessoal',
        aceita_lancamento: false,
        ativo: true
      });
    }
  }, [planoContas, modo]);

  const gerarCodigoAutomatico = () => {
    if (formData.plano_pai_id) {
      const pai = planosContas.find(p => p.id === parseInt(formData.plano_pai_id));
      if (pai) {
        const irmaos = planosContas.filter(p => p.plano_pai_id === pai.id);
        const proximoNumero = irmaos.length + 1;
        let novoCodigo;
        
        if (pai.nivel === 1) {
          // Subcategoria: 3.1.1, 3.1.2, etc.
          novoCodigo = `${pai.codigo}.${proximoNumero}`;
        } else if (pai.nivel === 2) {
          // Conta analítica: 3.1.1.001, 3.1.1.002, etc.
          novoCodigo = `${pai.codigo}.${proximoNumero.toString().padStart(3, '0')}`;
        } else {
          novoCodigo = `${pai.codigo}.${proximoNumero}`;
        }
        
        setFormData(prev => ({
          ...prev,
          codigo: novoCodigo,
          tipo_dre: pai.tipo_dre,
          cor: pai.cor
        }));
      }
    } else {
      // Categoria principal - gerar próximo código principal
      const principais = planosContas.filter(p => p.nivel === 1);
      const proximoNumero = principais.length + 1;
      const novoCodigo = `3.${proximoNumero}`;
      setFormData(prev => ({ ...prev, codigo: novoCodigo }));
    }
  };

  const calcularNivel = (): number => {
    if (!formData.plano_pai_id) return 1;
    const pai = planosContas.find(p => p.id === parseInt(formData.plano_pai_id));
    return pai ? pai.nivel + 1 : 1;
  };

  const planosDisponiveis = planosContas.filter(p => 
    p.ativo && 
    p.nivel < 3 && // Máximo 3 níveis
    (!isEdicao || p.id !== planoContas?.id) // Não pode ser pai de si mesmo
  );

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-ajustar tipo DRE e cor quando selecionar pai
    if (field === 'plano_pai_id' && value) {
      const pai = planosContas.find(p => p.id === parseInt(value));
      if (pai) {
        setFormData(prev => ({
          ...prev,
          tipo_dre: pai.tipo_dre,
          cor: pai.cor
        }));
      }
    }
  };

  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }

    if (!formData.codigo.trim()) {
      toast.error('Código é obrigatório');
      return false;
    }

    // Verificar código único
    const codigoExiste = planosContas.some(p => 
      p.codigo === formData.codigo && 
      (!isEdicao || p.id !== planoContas?.id)
    );
    if (codigoExiste) {
      toast.error('Este código já existe');
      return false;
    }

    // Verificar hierarquia
    const nivel = calcularNivel();
    if (nivel > 3) {
      toast.error('Máximo de 3 níveis permitido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const nivel = calcularNivel();
      
      const novoPlanoContas: PlanoContas = {
        id: planoContas?.id || Date.now(),
        codigo: formData.codigo,
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        cor: formData.cor,
        icone: formData.icone,
        plano_pai_id: formData.plano_pai_id ? parseInt(formData.plano_pai_id) : undefined,
        nivel,
        tipo_dre: formData.tipo_dre,
        aceita_lancamento: formData.aceita_lancamento,
        ativo: formData.ativo,
        total_contas: planoContas?.total_contas || 0,
        valor_total: planoContas?.valor_total || 0,
        created_at: planoContas?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onSave(novoPlanoContas);
      onClose();
      toast.success(`Conta ${isEdicao ? 'atualizada' : 'criada'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar conta');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const IconComponent = (icons as any)[formData.icone] || icons.Package;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixo */}
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {modo === 'criar' && 'Nova Conta do Plano'}
            {modo === 'editar' && 'Editar Conta'}
            {modo === 'visualizar' && 'Detalhes da Conta'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Rolável */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Código e Plano Pai */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo" className="text-sm font-medium text-gray-700 mb-2 block">
                Código *
              </Label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="codigo"
                  disabled={readonly}
                  value={formData.codigo}
                  onChange={(e) => handleInputChange('codigo', e.target.value)}
                  className="flex-1 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
                  placeholder="Ex: 3.2.1.005"
                />
                {!readonly && (
                  <button
                    type="button"
                    onClick={gerarCodigoAutomatico}
                    className="px-4 py-3 bg-blue-100/80 hover:bg-blue-200/80 text-blue-700 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Auto</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="plano_pai_id" className="text-sm font-medium text-gray-700 mb-2 block">
                Plano Pai
              </Label>
              <select
                id="plano_pai_id"
                disabled={readonly}
                value={formData.plano_pai_id}
                onChange={(e) => handleInputChange('plano_pai_id', e.target.value)}
                className="w-full bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
              >
                <option value="">Categoria Principal</option>
                {planosDisponiveis
                  .sort((a, b) => a.codigo.localeCompare(b.codigo))
                  .map(plano => (
                    <option key={plano.id} value={plano.id}>
                      {plano.codigo} - {plano.nome}
                    </option>
                  ))
                }
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Nível calculado: {calcularNivel()}
              </p>
            </div>
          </div>

          {/* Nome */}
          <div>
            <Label htmlFor="nome" className="text-sm font-medium text-gray-700 mb-2 block">
              Nome da Conta *
            </Label>
            <input
              type="text"
              id="nome"
              disabled={readonly}
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className="w-full bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
              placeholder="Ex: Material de Escritório"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao" className="text-sm font-medium text-gray-700 mb-2 block">
              Descrição
            </Label>
            <textarea
              id="descricao"
              disabled={readonly}
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              rows={2}
              className="w-full bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 resize-none"
              placeholder="Descreva brevemente esta conta..."
            />
          </div>

          {/* Tipo DRE */}
          <div>
            <Label htmlFor="tipo_dre" className="text-sm font-medium text-gray-700 mb-2 block">
              Tipo no DRE *
            </Label>
            <select
              id="tipo_dre"
              disabled={readonly}
              value={formData.tipo_dre}
              onChange={(e) => handleInputChange('tipo_dre', e.target.value)}
              className="w-full bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            >
              {TIPOS_DRE.map(tipo => (
                <option key={tipo.valor} value={tipo.valor}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Cor e Ícone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Cor de Identificação
              </Label>
              <div className="flex flex-wrap gap-2">
                {CORES_PLANO_CONTAS.map((cor) => (
                  <button
                    key={cor.valor}
                    type="button"
                    disabled={readonly}
                    onClick={() => handleInputChange('cor', cor.valor)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                      formData.cor === cor.valor 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-300 hover:border-gray-500'
                    } disabled:opacity-50`}
                    style={{ backgroundColor: cor.valor }}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Ícone
              </Label>
              <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                {ICONES_PLANO_CONTAS.map((iconeItem) => {
                  const IconeComponente = (icons as any)[iconeItem.icone] || icons.Package;
                  return (
                    <button
                      key={iconeItem.icone}
                      type="button"
                      disabled={readonly}
                      onClick={() => handleInputChange('icone', iconeItem.icone)}
                      className={`p-2 rounded-lg border transition-all duration-200 ${
                        formData.icone === iconeItem.icone
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      } disabled:opacity-50`}
                      title={iconeItem.nome}
                    >
                      <IconeComponente className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50/50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: formData.cor }}
              >
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-medium text-gray-600 bg-white px-2 py-1 rounded">
                    {formData.codigo || 'Código...'}
                  </span>
                  <span className="text-xs text-gray-500">Nível {calcularNivel()}</span>
                </div>
                <p className="font-medium text-gray-900">{formData.nome || 'Nome da conta...'}</p>
                {formData.descricao && (
                  <p className="text-sm text-gray-600">{formData.descricao}</p>
                )}
              </div>
            </div>
          </div>

          {/* Aceita Lançamento */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="aceita_lancamento"
              disabled={readonly}
              checked={formData.aceita_lancamento}
              onChange={(e) => handleInputChange('aceita_lancamento', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
            />
            <div>
              <label htmlFor="aceita_lancamento" className="text-sm font-medium text-gray-700">
                Esta conta pode receber lançamentos diretos
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Contas "sintéticas" não recebem lançamentos, apenas agrupam outras contas
              </p>
            </div>
          </div>

          {/* Status Ativo (apenas no modo editar) */}
          {modo !== 'criar' && (
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="ativo"
                disabled={readonly}
                checked={formData.ativo}
                onChange={(e) => handleInputChange('ativo', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                Conta ativa
              </label>
            </div>
          )}

          </form>
        </div>

        {/* Footer Actions - Fixo */}
        {!readonly && (
          <div className="border-t border-gray-200 bg-gray-50 p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}