// Mock de dados pessoais para credores
export const mockCredoresPersonais = [
  {
    id: 1,
    nome: 'Dr. João Silva',
    documento: '12345678901',
    tipo: 'pessoa_fisica',
    categoria_padrao_id: null,
    tipo_fornecedor: 'despesa',
    email: 'joao.silva@clinica.com',
    telefone: '(11) 99999-1234',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    observacoes: 'Cardiologista - Consultas particulares',
    total_compras: 8,
    valor_total: 2800.00,
    ultima_compra: '2024-12-01',
    ativo: true
  },
  {
    id: 2,
    nome: 'Maria Beleza Studio',
    documento: '12345678000195',
    tipo: 'pessoa_juridica',
    categoria_padrao_id: null,
    tipo_fornecedor: 'despesa',
    email: 'contato@mariabeleza.com',
    telefone: '(11) 99999-5678',
    endereco: 'Av. Paulista, 456',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310-100',
    observacoes: 'Salão de beleza e estética',
    total_compras: 12,
    valor_total: 960.00,
    ultima_compra: '2024-11-28',
    ativo: true
  },
  {
    id: 3,
    nome: 'Academia Fitness+',
    documento: '98765432000187',
    tipo: 'pessoa_juridica',
    categoria_padrao_id: null,
    tipo_fornecedor: 'despesa',
    email: 'info@fitnessmais.com',
    telefone: '(11) 99999-9012',
    endereco: 'Rua do Exercício, 789',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04567-890',
    observacoes: 'Academia de musculação e pilates',
    total_compras: 24,
    valor_total: 1916.00,
    ultima_compra: '2024-12-05',
    ativo: true
  },
  {
    id: 4,
    nome: 'ENEL Distribuição São Paulo',
    documento: '61695227000193',
    tipo: 'pessoa_juridica',
    categoria_padrao_id: null,
    tipo_fornecedor: 'despesa',
    email: 'atendimento@enel.com',
    telefone: '0800-123-4567',
    endereco: 'Av. das Nações Unidas, 12901',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04578-000',
    observacoes: 'Concessionária de energia elétrica',
    total_compras: 12,
    valor_total: 2950.00,
    ultima_compra: '2024-12-08',
    ativo: true
  },
  {
    id: 5,
    nome: 'Claro S.A.',
    documento: '40432544000147',
    tipo: 'pessoa_juridica',
    categoria_padrao_id: null,
    tipo_fornecedor: 'despesa',
    email: 'suporte@claro.com.br',
    telefone: '1052',
    endereco: 'Av. Chedid Jafet, 222',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04551-065',
    observacoes: 'Provedor de internet e telefonia',
    total_compras: 12,
    valor_total: 1078.80,
    ultima_compra: '2024-12-10',
    ativo: true
  }
];

// Mock de contas pessoais para exemplo
export const mockContasPessoais = [
  {
    id: 1,
    descricao: 'Conta de Luz - ENEL',
    valor: 245.80,
    data_vencimento: '2025-01-15',
    fornecedor_id: 4,
    plano_conta_id: 3, // Moradia > Energia Elétrica
    status: 'pendente',
    observacoes: 'Consumo de dezembro/2024'
  },
  {
    id: 2,
    descricao: 'Internet Claro Fibra',
    valor: 89.90,
    data_vencimento: '2025-01-10',
    fornecedor_id: 5,
    plano_conta_id: 6, // Moradia > Internet e TV
    status: 'pendente',
    observacoes: 'Plano 200MB'
  },
  {
    id: 3,
    descricao: 'Consulta Cardiológica',
    valor: 350.00,
    data_vencimento: '2025-01-20',
    fornecedor_id: 1,
    plano_conta_id: 22, // Saúde > Consultas Médicas
    status: 'pendente',
    observacoes: 'Check-up preventivo'
  },
  {
    id: 4,
    descricao: 'Academia Fitness+ Mensalidade',
    valor: 79.90,
    data_vencimento: '2025-01-05',
    fornecedor_id: 3,
    plano_conta_id: 26, // Saúde > Academia/Exercícios
    status: 'pago',
    observacoes: 'Musculação + pilates'
  },
  {
    id: 5,
    descricao: 'Cartão Nubank Fatura',
    valor: 1250.30,
    data_vencimento: '2025-01-08',
    fornecedor_id: null,
    plano_conta_id: 46, // Outros > Diversos
    status: 'pendente',
    observacoes: 'Compras diversas do mês'
  }
];