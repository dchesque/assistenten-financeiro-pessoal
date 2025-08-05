// Sistema completo de cores, classes e padrões
export const DESIGN_SYSTEM = {
  // Gradientes principais
  gradients: {
    primary: 'from-blue-600 to-purple-600',
    empresa: 'from-pink-500 to-purple-600',
    sucesso: 'from-green-500 to-green-600',
    erro: 'from-red-500 to-red-600',
    aviso: 'from-orange-500 to-orange-600',
    neutro: 'from-gray-500 to-gray-600'
  },
  
  // Classes glassmorphism
  glassmorphism: {
    card: 'bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90',
    modal: 'bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl',
    input: 'bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200',
    sidebar: 'bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/50',
    overlay: 'bg-black/50 backdrop-blur-sm',
    header: 'bg-white/80 backdrop-blur-sm border-b border-white/20'
  },
  
  // Status badges
  status: {
    ativo: 'bg-green-100/80 text-green-700 border-green-200/50',
    inativo: 'bg-red-100/80 text-red-700 border-red-200/50',
    pendente: 'bg-blue-100/80 text-blue-700 border-blue-200/50',
    pago: 'bg-green-100/80 text-green-700 border-green-200/50',
    vencido: 'bg-red-100/80 text-red-700 border-red-200/50',
    cancelado: 'bg-gray-100/80 text-gray-700 border-gray-200/50',
    processando: 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50'
  },

  // Cores dos dots para badges
  statusDots: {
    ativo: 'bg-green-600',
    inativo: 'bg-red-600',
    pendente: 'bg-blue-600',
    pago: 'bg-green-600',
    vencido: 'bg-red-600',
    cancelado: 'bg-gray-600',
    processando: 'bg-yellow-600'
  },

  // Transições padrão
  transitions: {
    fast: 'transition-all duration-200',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500'
  },

  // Shadows
  shadows: {
    soft: 'shadow-lg hover:shadow-xl',
    strong: 'shadow-xl hover:shadow-2xl',
    glow: 'shadow-lg shadow-blue-500/25'
  },

  // Responsividade
  responsive: {
    mobile: 'lg:hidden',
    desktop: 'hidden lg:block',
    padding: 'p-4 lg:p-8',
    margin: 'mx-4 lg:mx-auto'
  }
};

// Mensagens padrão do sistema em português
export const MENSAGENS = {
  SUCESSO_SALVAR: "Dados salvos com sucesso!",
  SUCESSO_EXCLUIR: "Item excluído com sucesso!",
  SUCESSO_ATUALIZAR: "Dados atualizados com sucesso!",
  ERRO_SALVAR: "Erro ao salvar. Tente novamente.",
  ERRO_CARREGAR: "Erro ao carregar dados.",
  ERRO_EXCLUIR: "Erro ao excluir item.",
  CAMPO_OBRIGATORIO: "Este campo é obrigatório",
  VALOR_INVALIDO: "Valor inválido",
  DATA_INVALIDA: "Data inválida",
  EMAIL_INVALIDO: "Email inválido",
  CPF_INVALIDO: "CPF inválido",
  CNPJ_INVALIDO: "CNPJ inválido",
  TELEFONE_INVALIDO: "Telefone inválido",
  CEP_INVALIDO: "CEP inválido",
  CARREGANDO: "Carregando...",
  SALVANDO: "Salvando...",
  EXCLUINDO: "Excluindo...",
  PROCESSANDO: "Processando..."
};

// Estados de loading
export const LOADING_STATES = {
  idle: 'idle',
  loading: 'loading',
  success: 'success',
  error: 'error'
} as const;

export type LoadingState = typeof LOADING_STATES[keyof typeof LOADING_STATES];
export type StatusType = keyof typeof DESIGN_SYSTEM.status;
export type GradientType = keyof typeof DESIGN_SYSTEM.gradients;