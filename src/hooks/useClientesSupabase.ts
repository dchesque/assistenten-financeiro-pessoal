import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Cliente, ClienteSupabase, ClientesEstatisticas } from '@/types/cliente';

interface UseClientesReturn {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;
  estatisticas: ClientesEstatisticas;
  criarCliente: (cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt' | 'totalCompras' | 'valorTotalCompras' | 'ticketMedio' | 'dataUltimaCompra'>) => Promise<Cliente>;
  atualizarCliente: (id: number, cliente: Partial<Cliente>) => Promise<Cliente>;
  excluirCliente: (id: number) => Promise<void>;
  buscarPorDocumento: (documento: string, excludeId?: number) => Promise<Cliente | null>;
  buscarPorEmail: (email: string, excludeId?: number) => Promise<Cliente | null>;
  atualizarEstatisticas: (clienteId: number) => Promise<void>;
  recarregar: () => Promise<void>;
  buscarClientes: (termo: string) => Cliente[];
  buscarClientesParaVenda: (termo: string) => Cliente[];
  clienteConsumidor: Cliente;
}

// Função para converter dados do Supabase para Cliente
const supabaseToCliente = (data: any): Cliente => ({
  id: data.id,
  nome: data.nome,
  documento: data.documento,
  tipo: data.tipo as 'PF' | 'PJ',
  rg_ie: data.rg_ie,
  telefone: data.telefone,
  whatsapp: data.whatsapp,
  email: data.email,
  cep: data.cep,
  logradouro: data.logradouro,
  numero: data.numero,
  complemento: data.complemento,
  bairro: data.bairro,
  cidade: data.cidade,
  estado: data.estado,
  status: data.status as 'ativo' | 'inativo' | 'bloqueado',
  observacoes: data.observacoes,
  receberPromocoes: data.receber_promocoes,
  whatsappMarketing: data.whatsapp_marketing,
  totalCompras: data.total_compras,
  valorTotalCompras: data.valor_total_compras,
  ticketMedio: data.ticket_medio,
  dataUltimaCompra: data.data_ultima_compra,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  ativo: data.ativo
});

// Função para converter Cliente para dados do Supabase
const clienteToSupabase = (cliente: Partial<Cliente>) => {
  const dados: any = {};
  
  if (cliente.nome !== undefined) dados.nome = cliente.nome;
  if (cliente.documento !== undefined) dados.documento = cliente.documento;
  if (cliente.tipo !== undefined) dados.tipo = cliente.tipo;
  if (cliente.rg_ie !== undefined) dados.rg_ie = cliente.rg_ie;
  if (cliente.telefone !== undefined) dados.telefone = cliente.telefone;
  if (cliente.whatsapp !== undefined) dados.whatsapp = cliente.whatsapp;
  if (cliente.email !== undefined) dados.email = cliente.email;
  if (cliente.cep !== undefined) dados.cep = cliente.cep;
  if (cliente.logradouro !== undefined) dados.logradouro = cliente.logradouro;
  if (cliente.numero !== undefined) dados.numero = cliente.numero;
  if (cliente.complemento !== undefined) dados.complemento = cliente.complemento;
  if (cliente.bairro !== undefined) dados.bairro = cliente.bairro;
  if (cliente.cidade !== undefined) dados.cidade = cliente.cidade;
  if (cliente.estado !== undefined) dados.estado = cliente.estado;
  if (cliente.status !== undefined) dados.status = cliente.status;
  if (cliente.observacoes !== undefined) dados.observacoes = cliente.observacoes;
  if (cliente.receberPromocoes !== undefined) dados.receber_promocoes = cliente.receberPromocoes;
  if (cliente.whatsappMarketing !== undefined) dados.whatsapp_marketing = cliente.whatsappMarketing;
  if (cliente.ativo !== undefined) dados.ativo = cliente.ativo;

  return dados;
};

// Cliente CONSUMIDOR padrão para vendas
const CLIENTE_CONSUMIDOR: Cliente = {
  id: 1,
  nome: "CONSUMIDOR",
  documento: "000.000.000-00",
  tipo: "PF",
  status: "ativo",
  receberPromocoes: false,
  whatsappMarketing: false,
  totalCompras: 0,
  valorTotalCompras: 0,
  ticketMedio: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ativo: true
};

export const useClientesSupabase = (): UseClientesReturn => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<ClientesEstatisticas>({
    totalClientes: 0,
    clientesAtivos: 0,
    clientesInativos: 0,
    tempoMedioRetorno: 0,
    ticketMedio: 0,
    faturamentoTotal: 0,
    crescimentoMensal: 0,
    percentualAtivos: 0,
    variacaoTicket: 0,
    metaMensal: 0
  });
  const { toast } = useToast();

  // Carregar lista de clientes
  const listarClientes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');

      if (supabaseError) {
        throw supabaseError;
      }

      const clientesConvertidos = data?.map(supabaseToCliente) || [];
      setClientes(clientesConvertidos);
      calcularEstatisticas(clientesConvertidos);
    } catch (err: any) {
      const mensagemErro = 'Erro ao carregar clientes';
      setError(mensagemErro);
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive"
      });
      console.error('Erro ao listar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas dos clientes
  const calcularEstatisticas = (clientesData: Cliente[]) => {
    const total = clientesData.length;
    const ativos = clientesData.filter(c => c.ativo).length;
    const totalVendas = clientesData.reduce((sum, c) => sum + c.valorTotalCompras, 0);
    const ticketMedio = total > 0 ? totalVendas / total : 0;

    setEstatisticas({
      totalClientes: total,
      clientesAtivos: ativos,
      clientesInativos: total - ativos,
      tempoMedioRetorno: 30, // Mock
      ticketMedio: ticketMedio,
      faturamentoTotal: totalVendas,
      crescimentoMensal: 12, // Mock
      percentualAtivos: total > 0 ? (ativos / total) * 100 : 0,
      variacaoTicket: 5, // Mock
      metaMensal: 50000 // Mock
    });
  };

  // Criar novo cliente
  const criarCliente = async (clienteData: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt' | 'totalCompras' | 'valorTotalCompras' | 'ticketMedio' | 'dataUltimaCompra'>): Promise<Cliente> => {
    try {
      const dadosSupabase = clienteToSupabase(clienteData);

      const { data, error: supabaseError } = await supabase
        .from('clientes')
        .insert(dadosSupabase)
        .select()
        .single();

      if (supabaseError) {
        // Tratar erros específicos do trigger de validação
        if (supabaseError.message.includes('Já existe um cliente ativo com este documento')) {
          throw new Error('Já existe um cliente com este documento');
        }
        if (supabaseError.message.includes('Já existe um cliente ativo com este email')) {
          throw new Error('Já existe um cliente com este email');
        }
        throw supabaseError;
      }

      const novoCliente = supabaseToCliente(data);
      
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso!",
        variant: "default"
      });

      await recarregar();
      return novoCliente;
    } catch (err: any) {
      const mensagemErro = err.message || 'Erro ao criar cliente';
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Atualizar cliente existente
  const atualizarCliente = async (id: number, clienteData: Partial<Cliente>): Promise<Cliente> => {
    try {
      const dadosSupabase = clienteToSupabase(clienteData);

      const { data, error: supabaseError } = await supabase
        .from('clientes')
        .update(dadosSupabase)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        // Tratar erros específicos do trigger de validação
        if (supabaseError.message.includes('Já existe um cliente ativo com este documento')) {
          throw new Error('Já existe um cliente com este documento');
        }
        if (supabaseError.message.includes('Já existe um cliente ativo com este email')) {
          throw new Error('Já existe um cliente com este email');
        }
        throw supabaseError;
      }

      const clienteAtualizado = supabaseToCliente(data);
      
      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso!",
        variant: "default"
      });

      await recarregar();
      return clienteAtualizado;
    } catch (err: any) {
      const mensagemErro = err.message || 'Erro ao atualizar cliente';
      toast({
        title: "Erro",
        description: mensagemErro,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Excluir cliente
  const excluirCliente = async (id: number): Promise<void> => {
    try {
      // TODO: Verificar se cliente tem vendas vinculadas
      
      const { error: supabaseError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
        variant: "default"
      });

      await recarregar();
    } catch (err: any) {
      const mensagemErro = err.message || 'Erro ao excluir cliente';
      toast({
        title: "Erro", 
        description: mensagemErro,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Buscar cliente por documento
  const buscarPorDocumento = async (documento: string, excludeId?: number): Promise<Cliente | null> => {
    try {
      let query = supabase
        .from('clientes')
        .select('*')
        .eq('documento', documento);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error: supabaseError } = await query.maybeSingle();

      if (supabaseError) {
        throw supabaseError;
      }

      return data ? supabaseToCliente(data) : null;
    } catch (err: any) {
      console.error('Erro ao buscar cliente por documento:', err);
      return null;
    }
  };

  // Buscar cliente por email
  const buscarPorEmail = async (email: string, excludeId?: number): Promise<Cliente | null> => {
    try {
      let query = supabase
        .from('clientes')
        .select('*')
        .eq('email', email);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error: supabaseError } = await query.maybeSingle();

      if (supabaseError) {
        throw supabaseError;
      }

      return data ? supabaseToCliente(data) : null;
    } catch (err: any) {
      console.error('Erro ao buscar cliente por email:', err);
      return null;
    }
  };

  // Buscar clientes por termo (nome, documento, email)
  const buscarClientes = (termo: string): Cliente[] => {
    if (!termo) return clientes.slice(0, 10);
    
    const termoLower = termo.toLowerCase();
    return clientes
      .filter(cliente => 
        cliente.nome.toLowerCase().includes(termoLower) ||
        cliente.documento?.toLowerCase().includes(termoLower) ||
        cliente.email?.toLowerCase().includes(termoLower)
      )
      .slice(0, 10);
  };

  // Busca otimizada para o módulo de vendas
  const buscarClientesParaVenda = (termo: string): Cliente[] => {
    const termoLower = termo.toLowerCase();
    
    // Se não há termo de busca, retorna clientes ativos mais recentes
    if (!termo.trim()) {
      return [CLIENTE_CONSUMIDOR, ...clientes
        .filter(c => c.status === 'ativo' && c.id !== 1)
        .sort((a, b) => {
          // Priorizar clientes com compras recentes
          if (a.dataUltimaCompra && b.dataUltimaCompra) {
            return new Date(b.dataUltimaCompra).getTime() - new Date(a.dataUltimaCompra).getTime();
          }
          if (a.dataUltimaCompra) return -1;
          if (b.dataUltimaCompra) return 1;
          return b.totalCompras - a.totalCompras;
        })
        .slice(0, 9)
      ];
    }

    // Busca por nome, documento, telefone e email
    const clientesFiltrados = clientes.filter(cliente => 
      cliente.id !== 1 && // Excluir o CONSUMIDOR da busca textual
      cliente.status === 'ativo' && (
        cliente.nome.toLowerCase().includes(termoLower) ||
        cliente.documento.toLowerCase().includes(termoLower) ||
        cliente.telefone?.toLowerCase().includes(termoLower) ||
        cliente.email?.toLowerCase().includes(termoLower)
      )
    );

    // Ordenar por relevância (nome primeiro, depois documento, etc.)
    const ordenados = clientesFiltrados.sort((a, b) => {
      // Priorizar matches no nome
      const aMatchNome = a.nome.toLowerCase().includes(termoLower);
      const bMatchNome = b.nome.toLowerCase().includes(termoLower);
      
      if (aMatchNome && !bMatchNome) return -1;
      if (!aMatchNome && bMatchNome) return 1;
      
      // Se ambos fazem match no nome, priorizar por total de compras
      if (aMatchNome && bMatchNome) {
        return b.totalCompras - a.totalCompras;
      }
      
      // Senão, priorizar por total de compras
      return b.totalCompras - a.totalCompras;
    });

    // Sempre incluir CONSUMIDOR no topo da lista
    return [CLIENTE_CONSUMIDOR, ...ordenados.slice(0, 9)];
  };

  // Atualizar estatísticas de vendas do cliente
  const atualizarEstatisticas = async (clienteId: number): Promise<void> => {
    // TODO: Implementar quando tabela vendas estiver criada
    console.log('Atualizando estatísticas do cliente:', clienteId);
  };

  // Recarregar lista
  const recarregar = async () => {
    await listarClientes();
  };

  // Carregar dados iniciais
  useEffect(() => {
    listarClientes();
  }, []);

  return {
    clientes,
    loading,
    error,
    estatisticas,
    criarCliente,
    atualizarCliente,
    excluirCliente,
    buscarPorDocumento,
    buscarPorEmail,
    atualizarEstatisticas,
    recarregar,
    buscarClientes,
    buscarClientesParaVenda,
    clienteConsumidor: CLIENTE_CONSUMIDOR
  };
};