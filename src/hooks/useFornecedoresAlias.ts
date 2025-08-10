import { useState, useEffect } from 'react';
import { useContatos } from '@/hooks/useContatos';
import { toast } from 'sonner';

// Alias/Wrapper para manter compatibilidade com código existente
// Mapeia fornecedores para contacts com type='supplier'

export interface FornecedorCompat {
  id: string;
  nome: string;
  nome_fantasia?: string;
  documento?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  tipo_fornecedor: 'receita' | 'despesa';
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  ativo: boolean;
  totalCompras: number;
  valorTotal: number;
  ultimaCompra?: string;
  dataCadastro: string;
}

export interface EstatisticasFornecedor {
  total: number;
  ativos: number;
  inativos: number;
  totalCompras: number;
  valorTotal: number;
}

export interface FiltrosFornecedor {
  busca: string;
  status: 'todos' | 'ativo' | 'inativo';
  tipo: 'todos' | 'pessoa_fisica' | 'pessoa_juridica';
}

export function useFornecedores() {
  const { contatos, loading, error, criarContato, atualizarContato, excluirContato } = useContatos();
  const [fornecedores, setFornecedores] = useState<FornecedorCompat[]>([]);

  // Converter contacts para formato de fornecedores
  useEffect(() => {
    const fornecedoresConverted = contatos
      .filter(contato => contato.type === 'supplier' || contato.type === 'fornecedor')
      .map(contato => ({
        id: contato.id,
        nome: contato.name,
        nome_fantasia: contato.name, // Por simplicidade, usar mesmo nome
        documento: contato.document,
        tipo: contato.document_type === 'cpf' ? 'pessoa_fisica' : 'pessoa_juridica' as 'pessoa_fisica' | 'pessoa_juridica',
        tipo_fornecedor: 'despesa' as 'receita' | 'despesa', // Padrão despesa
        email: contato.email,
        telefone: contato.phone,
        endereco: contato.address,
        cidade: contato.city,
        estado: contato.state,
        cep: contato.zip,
        observacoes: contato.notes,
        ativo: contato.active,
        totalCompras: 0, // TODO: Calcular baseado em accounts_payable
        valorTotal: 0, // TODO: Calcular baseado em accounts_payable
        ultimaCompra: undefined,
        dataCadastro: contato.created_at
      }));
    
    setFornecedores(fornecedoresConverted);
  }, [contatos]);

  const criarFornecedor = async (fornecedor: Partial<FornecedorCompat>) => {
    try {
      const novoContato = await criarContato({
        name: fornecedor.nome || '',
        type: 'supplier',
        document: fornecedor.documento,
        document_type: fornecedor.tipo === 'pessoa_fisica' ? 'cpf' : 'cnpj',
        email: fornecedor.email,
        phone: fornecedor.telefone,
        address: fornecedor.endereco,
        city: fornecedor.cidade,
        state: fornecedor.estado,
        zip: fornecedor.cep,
        notes: fornecedor.observacoes,
        active: fornecedor.ativo ?? true
      });
      
      toast.success('Fornecedor criado com sucesso!');
      return novoContato;
    } catch (error) {
      toast.error('Erro ao criar fornecedor');
      throw error;
    }
  };

  const atualizarFornecedor = async (id: string, updates: Partial<FornecedorCompat>) => {
    try {
      const contatoAtualizado = await atualizarContato(id, {
        name: updates.nome,
        document: updates.documento,
        document_type: updates.tipo === 'pessoa_fisica' ? 'cpf' : 'cnpj',
        email: updates.email,
        phone: updates.telefone,
        address: updates.endereco,
        city: updates.cidade,
        state: updates.estado,
        zip: updates.cep,
        notes: updates.observacoes,
        active: updates.ativo
      });
      
      toast.success('Fornecedor atualizado com sucesso!');
      return contatoAtualizado;
    } catch (error) {
      toast.error('Erro ao atualizar fornecedor');
      throw error;
    }
  };

  const excluirFornecedor = async (id: string) => {
    try {
      await excluirContato(id);
      toast.success('Fornecedor excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir fornecedor');
      throw error;
    }
  };

  const buscarFornecedores = (termo: string) => {
    if (!termo) return fornecedores;
    
    const termoLower = termo.toLowerCase();
    return fornecedores.filter(f => 
      f.nome?.toLowerCase().includes(termoLower) ||
      f.documento?.includes(termo) ||
      f.email?.toLowerCase().includes(termoLower)
    );
  };

  const buscarPorDocumento = (documento: string) => {
    return fornecedores.find(f => f.documento === documento);
  };

  const calcularEstatisticas = (): EstatisticasFornecedor => {
    const ativos = fornecedores.filter(f => f.ativo);
    return {
      total: fornecedores.length,
      ativos: ativos.length,
      inativos: fornecedores.length - ativos.length,
      totalCompras: fornecedores.reduce((acc, f) => acc + f.totalCompras, 0),
      valorTotal: fornecedores.reduce((acc, f) => acc + f.valorTotal, 0)
    };
  };

  return {
    fornecedores,
    loading,
    error,
    estatisticas: calcularEstatisticas(),
    criarFornecedor,
    atualizarFornecedor,
    excluirFornecedor,
    buscarFornecedores,
    buscarPorDocumento,
    atualizarEstatisticas: async () => {}, // No-op
    recarregar: async () => {}, // No-op, handled by useContatos
    carregarFornecedores: async () => {} // No-op, handled by useContatos
  };
}