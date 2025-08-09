import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dataService } from '@/services/DataServiceFactory';

interface CategoriaSelectorProps {
  value: string;
  onChange: (value: string) => void;
  tipo?: 'receita' | 'despesa' | 'todos';
}

export function CategoriaSelector({ value, onChange, tipo = 'todos' }: CategoriaSelectorProps) {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategorias();
  }, [tipo]);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const data = await dataService.categorias.getAll();
      
      const categoriasFiltradas = tipo === 'todos' 
        ? data 
        : data.filter(cat => (cat.tipo || cat.type) === tipo);
      
      setCategorias(categoriasFiltradas);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando categorias...</div>;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione uma categoria" />
      </SelectTrigger>
      <SelectContent>
        {categorias.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: cat.cor || cat.color }}
              />
              {cat.nome || cat.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}