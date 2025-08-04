// Dados iniciais para o sistema de finanças pessoais
import { CategoriaDespesa } from '@/types/categoriaDespesa';
import { CredorPessoal } from '@/types/credorPessoal';

// Categorias padrão por grupo
export const categoriasPadrao: Omit<CategoriaDespesa, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  // MORADIA
  { nome: 'Aluguel', grupo: 'moradia', cor: '#8B5CF6', icone: 'Home', ativo: true },
  { nome: 'Energia Elétrica', grupo: 'moradia', cor: '#F59E0B', icone: 'Lightbulb', ativo: true },
  { nome: 'Água e Esgoto', grupo: 'moradia', cor: '#06B6D4', icone: 'Droplets', ativo: true },
  { nome: 'Internet e TV', grupo: 'moradia', cor: '#8B5CF6', icone: 'Wifi', ativo: true },
  { nome: 'Condomínio', grupo: 'moradia', cor: '#6B7280', icone: 'Building', ativo: true },
  { nome: 'IPTU', grupo: 'moradia', cor: '#DC2626', icone: 'FileText', ativo: true },
  { nome: 'Seguro Residencial', grupo: 'moradia', cor: '#059669', icone: 'Shield', ativo: true },

  // TRANSPORTE  
  { nome: 'Combustível', grupo: 'transporte', cor: '#DC2626', icone: 'Fuel', ativo: true },
  { nome: 'Manutenção Veículo', grupo: 'transporte', cor: '#F59E0B', icone: 'Wrench', ativo: true },
  { nome: 'Seguro Veículo', grupo: 'transporte', cor: '#059669', icone: 'Car', ativo: true },
  { nome: 'IPVA', grupo: 'transporte', cor: '#DC2626', icone: 'FileText', ativo: true },
  { nome: 'Transporte Público', grupo: 'transporte', cor: '#0EA5E9', icone: 'Bus', ativo: true },
  { nome: 'Estacionamento', grupo: 'transporte', cor: '#6B7280', icone: 'ParkingCircle', ativo: true },

  // ALIMENTAÇÃO
  { nome: 'Supermercado', grupo: 'alimentacao', cor: '#059669', icone: 'ShoppingCart', ativo: true },
  { nome: 'Restaurantes', grupo: 'alimentacao', cor: '#DC2626', icone: 'UtensilsCrossed', ativo: true },
  { nome: 'Delivery', grupo: 'alimentacao', cor: '#F59E0B', icone: 'Bike', ativo: true },
  { nome: 'Padaria', grupo: 'alimentacao', cor: '#8B5CF6', icone: 'Croissant', ativo: true },
  { nome: 'Bebidas', grupo: 'alimentacao', cor: '#06B6D4', icone: 'Coffee', ativo: true },

  // SAÚDE
  { nome: 'Plano de Saúde', grupo: 'saude', cor: '#059669', icone: 'Heart', ativo: true },
  { nome: 'Consultas Médicas', grupo: 'saude', cor: '#DC2626', icone: 'Stethoscope', ativo: true },
  { nome: 'Medicamentos', grupo: 'saude', cor: '#F59E0B', icone: 'Pill', ativo: true },
  { nome: 'Exames', grupo: 'saude', cor: '#8B5CF6', icone: 'Activity', ativo: true },
  { nome: 'Dentista', grupo: 'saude', cor: '#06B6D4', icone: 'Smile', ativo: true },
  { nome: 'Academia/Exercícios', grupo: 'saude', cor: '#059669', icone: 'Dumbbell', ativo: true },

  // EDUCAÇÃO
  { nome: 'Cursos', grupo: 'educacao', cor: '#8B5CF6', icone: 'GraduationCap', ativo: true },
  { nome: 'Livros', grupo: 'educacao', cor: '#F59E0B', icone: 'Book', ativo: true },
  { nome: 'Material Escolar', grupo: 'educacao', cor: '#059669', icone: 'PenTool', ativo: true },
  { nome: 'Assinaturas Educativas', grupo: 'educacao', cor: '#DC2626', icone: 'Monitor', ativo: true },

  // LAZER
  { nome: 'Cinema/Teatro', grupo: 'lazer', cor: '#8B5CF6', icone: 'Clapperboard', ativo: true },
  { nome: 'Viagens', grupo: 'lazer', cor: '#059669', icone: 'Plane', ativo: true },
  { nome: 'Streaming', grupo: 'lazer', cor: '#DC2626', icone: 'Play', ativo: true },
  { nome: 'Hobbies', grupo: 'lazer', cor: '#F59E0B', icone: 'Gamepad2', ativo: true },
  { nome: 'Eventos', grupo: 'lazer', cor: '#06B6D4', icone: 'Calendar', ativo: true },

  // CUIDADOS PESSOAIS
  { nome: 'Roupas', grupo: 'cuidados', cor: '#8B5CF6', icone: 'Shirt', ativo: true },
  { nome: 'Cabeleireiro/Barbeiro', grupo: 'cuidados', cor: '#F59E0B', icone: 'Scissors', ativo: true },
  { nome: 'Cosméticos', grupo: 'cuidados', cor: '#DC2626', icone: 'Sparkles', ativo: true },
  { nome: 'Produtos de Higiene', grupo: 'cuidados', cor: '#059669', icone: 'Soap', ativo: true },

  // OUTROS
  { nome: 'Presentes', grupo: 'outros', cor: '#8B5CF6', icone: 'Gift', ativo: true },
  { nome: 'Impostos', grupo: 'outros', cor: '#DC2626', icone: 'Receipt', ativo: true },
  { nome: 'Seguros', grupo: 'outros', cor: '#059669', icone: 'Shield', ativo: true },
  { nome: 'Doações', grupo: 'outros', cor: '#F59E0B', icone: 'Heart', ativo: true },
  { nome: 'Diversos', grupo: 'outros', cor: '#6B7280', icone: 'Package', ativo: true }
];

// Credores de exemplo
export const credoresExemplo: Omit<CredorPessoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    nome: 'Dr. João Silva',
    tipo: 'pessoa_fisica',
    documento: '12345678901',
    email: 'joao.silva@clinica.com',
    telefone: '(11) 99999-1234',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    observacoes: 'Cardiologista - Consultas particulares',
    ativo: true,
    total_contas: 0,
    valor_total: 0
  },
  {
    nome: 'ENEL Distribuição São Paulo',
    tipo: 'pessoa_juridica',
    documento: '61695227000193',
    email: 'atendimento@enel.com',
    telefone: '0800-123-4567',
    endereco: 'Av. das Nações Unidas, 12901',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04578-000',
    observacoes: 'Concessionária de energia elétrica',
    ativo: true,
    total_contas: 0,
    valor_total: 0
  },
  {
    nome: 'Claro S.A.',
    tipo: 'pessoa_juridica',
    documento: '40432544000147',
    email: 'suporte@claro.com.br',
    telefone: '1052',
    endereco: 'Av. Chedid Jafet, 222',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04551-065',
    observacoes: 'Provedor de internet e telefonia',
    ativo: true,
    total_contas: 0,
    valor_total: 0
  },
  {
    nome: 'Academia Fitness+',
    tipo: 'pessoa_juridica',
    documento: '98765432000187',
    email: 'info@fitnessmais.com',
    telefone: '(11) 99999-9012',
    endereco: 'Rua do Exercício, 789',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04567-890',
    observacoes: 'Academia de musculação e pilates',
    ativo: true,
    total_contas: 0,
    valor_total: 0
  }
];

// Função para inserir categorias padrão para um usuário
export const inserirCategoriasPadrao = async (userId: string, supabase: any) => {
  const categoriasComUser = categoriasPadrao.map(categoria => ({
    ...categoria,
    user_id: userId
  }));

  const { data, error } = await supabase
    .from('categorias_despesas')
    .insert(categoriasComUser)
    .select();

  if (error) {
    console.error('Erro ao inserir categorias padrão:', error);
    throw error;
  }

  return data;
};

// Função para inserir credores de exemplo para um usuário
export const inserirCredoresExemplo = async (userId: string, supabase: any) => {
  const credoresComUser = credoresExemplo.map(credor => ({
    ...credor,
    user_id: userId
  }));

  const { data, error } = await supabase
    .from('credores')
    .insert(credoresComUser)
    .select();

  if (error) {
    console.error('Erro ao inserir credores de exemplo:', error);
    throw error;
  }

  return data;
};