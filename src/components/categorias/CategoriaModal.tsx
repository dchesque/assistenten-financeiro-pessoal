import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Save, X } from 'lucide-react';
import type { Categoria, CriarCategoria, AtualizarCategoria } from '@/types/categoria';
import { obterGrupos } from '@/types/categoria';

interface CategoriaModalProps {
  aberto: boolean;
  categoria?: Categoria | null;
  modo: 'criar' | 'editar' | 'visualizar';
  onFechar: () => void;
  onSalvar: (dados: CriarCategoria | AtualizarCategoria) => Promise<boolean>;
}

const CORES_PREDEFINIDAS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
  '#6C5CE7', '#A29BFE', '#FD79A8', '#E17055', '#00B894'
];

const ICONES_PREDEFINIDOS = [
  '🏠', '🚗', '🍔', '💊', '📚', '🎮', '💄', '💰',
  '💸', '🛒', '⚡', '💧', '📱', '👔', '🎯', '🎨'
];

export function CategoriaModal({ aberto, categoria, modo, onFechar, onSalvar }: CategoriaModalProps) {
  const [dados, setDados] = useState<CriarCategoria>({
    nome: '',
    tipo: 'despesa',
    grupo: '',
    cor: CORES_PREDEFINIDAS[0],
    icone: ICONES_PREDEFINIDOS[0]
  });

  const [salvando, setSalvando] = useState(false);

  const gruposDisponiveis = obterGrupos(dados.tipo);

  useEffect(() => {
    if (categoria && (modo === 'editar' || modo === 'visualizar')) {
      setDados({
        nome: categoria.nome,
        tipo: categoria.tipo,
        grupo: categoria.grupo,
        cor: categoria.cor,
        icone: categoria.icone
      });
    } else {
      setDados({
        nome: '',
        tipo: 'despesa',
        grupo: '',
        cor: CORES_PREDEFINIDAS[0],
        icone: ICONES_PREDEFINIDOS[0]
      });
    }
  }, [categoria, modo, aberto]);

  const handleSalvar = async () => {
    if (!dados.nome.trim() || !dados.grupo) return;

    setSalvando(true);
    try {
      let sucesso = false;
      
      if (modo === 'editar' && categoria) {
        sucesso = await onSalvar({
          id: categoria.id,
          ...dados
        } as AtualizarCategoria);
      } else {
        sucesso = await onSalvar(dados);
      }

      if (sucesso) {
        onFechar();
      }
    } finally {
      setSalvando(false);
    }
  };

  // Atualizar grupos quando o tipo muda
  useEffect(() => {
    const gruposAtuais = obterGrupos(dados.tipo);
    const primeiroGrupo = Object.keys(gruposAtuais)[0];
    
    if (!Object.keys(gruposAtuais).includes(dados.grupo)) {
      setDados(prev => ({ ...prev, grupo: primeiroGrupo }));
    }
  }, [dados.tipo, dados.grupo]);

  const isVisualizacao = modo === 'visualizar';

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isVisualizacao && <Eye className="h-5 w-5" />}
            <span>
              {modo === 'criar' && 'Nova Categoria'}
              {modo === 'editar' && 'Editar Categoria'}
              {modo === 'visualizar' && 'Visualizar Categoria'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={dados.nome}
              onChange={(e) => setDados(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Digite o nome da categoria"
              disabled={isVisualizacao}
              className="input-base"
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={dados.tipo}
              onValueChange={(valor) => setDados(prev => ({ ...prev, tipo: valor as 'despesa' | 'receita' }))}
              disabled={isVisualizacao || modo === 'editar'}
            >
              <SelectTrigger className="input-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="despesa">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Despesa</span>
                  </div>
                </SelectItem>
                <SelectItem value="receita">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Receita</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grupo */}
          <div className="space-y-2">
            <Label htmlFor="grupo">Grupo *</Label>
            <Select
              value={dados.grupo}
              onValueChange={(valor) => setDados(prev => ({ ...prev, grupo: valor }))}
              disabled={isVisualizacao}
            >
              <SelectTrigger className="input-base">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(gruposDisponiveis).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ícone */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-2">
              {ICONES_PREDEFINIDOS.map((icone) => (
                <button
                  key={icone}
                  type="button"
                  onClick={() => !isVisualizacao && setDados(prev => ({ ...prev, icone }))}
                  disabled={isVisualizacao}
                  className={`p-2 text-xl border rounded-lg hover:bg-gray-50 transition-colors ${
                    dados.icone === icone ? 'border-primary bg-primary/10' : 'border-gray-200'
                  } ${isVisualizacao ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {icone}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-8 gap-2">
              {CORES_PREDEFINIDAS.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => !isVisualizacao && setDados(prev => ({ ...prev, cor }))}
                  disabled={isVisualizacao}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    dados.cor === cor ? 'border-gray-400 scale-110' : 'border-gray-200'
                  } ${isVisualizacao ? 'cursor-default' : 'cursor-pointer'}`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: dados.cor }}
              >
                {dados.icone}
              </div>
              <div>
                <p className="font-medium">{dados.nome || 'Nome da categoria'}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={dados.tipo === 'despesa' ? 'destructive' : 'default'}>
                    {dados.tipo === 'despesa' ? 'Despesa' : 'Receita'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {gruposDisponiveis[dados.grupo as keyof typeof gruposDisponiveis] || 'Grupo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onFechar}
            disabled={salvando}
          >
            <X className="h-4 w-4 mr-2" />
            {isVisualizacao ? 'Fechar' : 'Cancelar'}
          </Button>
          
          {!isVisualizacao && (
            <Button
              onClick={handleSalvar}
              disabled={!dados.nome.trim() || !dados.grupo || salvando}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}