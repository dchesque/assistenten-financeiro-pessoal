import { useState, useEffect } from 'react';
import { UsuarioAdmin, MetricasUsuarios } from '@/types/usuarioAdmin';

// Mock data para usuários administrativos
const mockUsuarios: UsuarioAdmin[] = [
  {
    id: '1',
    email: 'joao.silva@empresa.com',
    nome: 'João Silva',
    tipo_pessoa: 'pessoa_fisica',
    documento: '123.456.789-00',
    telefone: '(11) 99999-9999',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    data_cadastro: '2024-01-15',
    ultimo_acesso: '2024-01-07',
    status_assinatura: 'ativo',
    plano: 'premium',
    valor_mensalidade: 89.90,
    data_vencimento: '2024-02-15',
    empresa: 'Silva & Associados',
    observacoes: 'Cliente premium desde o início',
    ativo: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-07T14:30:00Z'
  },
  {
    id: '2',
    email: 'maria.santos@comercio.com',
    nome: 'Maria Santos',
    tipo_pessoa: 'pessoa_juridica',
    documento: '12.345.678/0001-90',
    telefone: '(11) 88888-8888',
    endereco: 'Av. Paulista, 1000',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    data_cadastro: '2024-01-20',
    ultimo_acesso: '2024-01-06',
    status_assinatura: 'ativo',
    plano: 'basico',
    valor_mensalidade: 39.90,
    data_vencimento: '2024-02-20',
    empresa: 'Comércio Santos Ltda',
    observacoes: '',
    ativo: true,
    created_at: '2024-01-20T15:20:00Z',
    updated_at: '2024-01-06T09:15:00Z'
  },
  {
    id: '3',
    email: 'carlos.oliveira@startup.tech',
    nome: 'Carlos Oliveira',
    tipo_pessoa: 'pessoa_fisica',
    documento: '987.654.321-00',
    telefone: '(11) 77777-7777',
    endereco: 'Rua Inovação, 456',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04567-890',
    data_cadastro: '2024-01-05',
    ultimo_acesso: '2024-01-05',
    status_assinatura: 'inativo',
    plano: 'gratuito',
    valor_mensalidade: 0,
    empresa: 'Tech Startup',
    observacoes: 'Trial expirado, não converteu',
    ativo: false,
    created_at: '2024-01-05T11:45:00Z',
    updated_at: '2024-01-05T16:20:00Z'
  },
  {
    id: '4',
    email: 'ana.costa@empresa.com.br',
    nome: 'Ana Costa',
    tipo_pessoa: 'pessoa_juridica',
    documento: '98.765.432/0001-10',
    telefone: '(11) 66666-6666',
    endereco: 'Rua do Comércio, 789',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '20000-000',
    data_cadastro: '2023-12-10',
    ultimo_acesso: '2024-01-04',
    status_assinatura: 'ativo',
    plano: 'enterprise',
    valor_mensalidade: 199.90,
    data_vencimento: '2024-02-10',
    empresa: 'Costa Comércio S.A.',
    observacoes: 'Cliente enterprise com múltiplas filiais',
    ativo: true,
    created_at: '2023-12-10T08:30:00Z',
    updated_at: '2024-01-04T13:45:00Z'
  },
  {
    id: '5',
    email: 'pedro.ferreira@freelancer.com',
    nome: 'Pedro Ferreira',
    tipo_pessoa: 'pessoa_fisica',
    documento: '456.789.123-00',
    telefone: '(11) 55555-5555',
    endereco: 'Rua dos Freelancers, 321',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    cep: '30000-000',
    data_cadastro: '2024-01-25',
    ultimo_acesso: '2024-01-07',
    status_assinatura: 'trial',
    plano: 'basico',
    valor_mensalidade: 39.90,
    data_vencimento: '2024-02-08',
    observacoes: 'Em período de teste',
    ativo: true,
    created_at: '2024-01-25T14:15:00Z',
    updated_at: '2024-01-07T10:20:00Z'
  }
];

export function useUsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>(mockUsuarios);
  const [loading, setLoading] = useState(false);

  const calcularMetricas = (): MetricasUsuarios => {
    const usuariosAtivos = usuarios.filter(u => u.ativo && u.status_assinatura === 'ativo');
    const usuariosInativos = usuarios.filter(u => !u.ativo || u.status_assinatura === 'inativo');
    const assinaturasAtivas = usuarios.filter(u => ['ativo', 'trial'].includes(u.status_assinatura));
    const valorTotal = usuariosAtivos.reduce((total, u) => total + u.valor_mensalidade, 0);
    
    // Mock data para novos usuários e cancelamentos do mês
    const novosUsuariosMes = usuarios.filter(u => {
      const dataCadastro = new Date(u.data_cadastro);
      const agora = new Date();
      return dataCadastro.getMonth() === agora.getMonth() && dataCadastro.getFullYear() === agora.getFullYear();
    }).length;

    const cancelamentosMes = usuarios.filter(u => {
      return u.status_assinatura === 'cancelado' || u.status_assinatura === 'inativo';
    }).length;

    return {
      total_usuarios: usuarios.length,
      usuarios_ativos: usuariosAtivos.length,
      usuarios_inativos: usuariosInativos.length,
      total_assinaturas: assinaturasAtivas.length,
      valor_total_mensal: valorTotal,
      novos_usuarios_mes: novosUsuariosMes,
      cancelamentos_mes: cancelamentosMes
    };
  };

  const obterUsuarios = async () => {
    setLoading(true);
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
    return usuarios;
  };

  const atualizarUsuario = async (usuarioId: string, dadosAtualizados: Partial<UsuarioAdmin>) => {
    setLoading(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setUsuarios(prevUsuarios => 
      prevUsuarios.map(usuario => 
        usuario.id === usuarioId 
          ? { 
              ...usuario, 
              ...dadosAtualizados, 
              updated_at: new Date().toISOString() 
            }
          : usuario
      )
    );
    
    setLoading(false);
  };

  const obterUsuarioPorId = (id: string): UsuarioAdmin | undefined => {
    return usuarios.find(usuario => usuario.id === id);
  };

  useEffect(() => {
    obterUsuarios();
  }, []);

  return {
    usuarios,
    loading,
    metricas: calcularMetricas(),
    obterUsuarios,
    atualizarUsuario,
    obterUsuarioPorId
  };
}