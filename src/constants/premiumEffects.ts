/**
 * Constantes de hover effects premium para máxima consistência
 * Todos os componentes devem usar essas classes para garantir uniformidade
 */
export const HOVER_EFFECTS = {
  // Cards principais - efeitos reduzidos
  card: 'hover:shadow-lg hover:bg-white/85 transition-all duration-200',
  
  // Cards secundários (ainda mais sutil)
  cardSubtle: 'hover:shadow-md hover:bg-white/80 transition-all duration-200',
  
  // Botões primários - movimento mínimo
  buttonPrimary: 'hover:shadow-md hover:brightness-105 transition-all duration-200',
  
  // Botões secundários
  buttonSecondary: 'hover:shadow-sm hover:bg-opacity-95 transition-all duration-200',
  
  // Inputs
  input: 'hover:border-blue-400 hover:shadow-sm transition-all duration-200 hover:bg-white/90',
  
  // Modals
  modal: 'hover:backdrop-blur-lg transition-all duration-200',
  
  // Links e elementos clicáveis
  clickable: 'hover:text-blue-600 hover:underline transition-all duration-200 cursor-pointer',
  
  // Ícones - sem scale
  icon: 'hover:text-blue-600 transition-all duration-200 cursor-pointer',
  
  // Tabelas (linhas)
  tableRow: 'hover:bg-white/50 transition-all duration-200',
  
  // Navegação (sidebar) - sem translate
  navItem: 'hover:bg-white/10 hover:text-white transition-all duration-200',
  
  // Badges e status - sem scale
  badge: 'hover:shadow-sm transition-all duration-200',
  
  // Containers especiais
  containerGlass: 'hover:bg-white/85 hover:backdrop-blur-lg hover:shadow-lg transition-all duration-200'
};

/**
 * Classes de animações premium para micro-interações
 */
export const ANIMATIONS = {
  // Fade animations
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  
  // Scale animations
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  
  // Slide animations
  slideInRight: 'animate-slide-in-right',
  slideOutRight: 'animate-slide-out-right',
  
  // Combined animations
  enter: 'animate-enter',
  exit: 'animate-exit',
  
  // Loading animations
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  
  // Custom animations
  shimmer: 'animate-shimmer',
  gradient: 'animate-gradient'
};

/**
 * Estados de loading premium
 */
export const LOADING_STATES = {
  // Botões
  buttonLoading: 'opacity-70 cursor-not-allowed pointer-events-none',
  buttonSpinner: 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin',
  
  // Cards
  cardSkeleton: 'animate-pulse bg-gray-200 rounded',
  cardShimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
  
  // Inputs
  inputLoading: 'opacity-70 pointer-events-none',
  inputSpinner: 'w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin',
  
  // Páginas
  pageLoading: 'min-h-screen flex items-center justify-center',
  pageSpinner: 'w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin'
};

/**
 * Classes de focus premium para acessibilidade
 */
export const FOCUS_STATES = {
  // Inputs
  input: 'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none',
  
  // Botões
  button: 'focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:ring-offset-2',
  
  // Links
  link: 'focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:underline',
  
  // Cards clicáveis
  card: 'focus:ring-2 focus:ring-blue-500/20 focus:outline-none focus:ring-offset-2',
  
  // Elementos de navegação
  nav: 'focus:ring-2 focus:ring-white/20 focus:outline-none focus:bg-white/10'
};

/**
 * Breakpoints responsivos premium
 */
export const RESPONSIVE = {
  // Padding padrão obrigatório
  pagePadding: 'p-4 lg:p-8',
  
  // Containers
  container: 'container mx-auto px-4 lg:px-8',
  
  // Grids
  gridCards: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6',
  gridForm: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  gridFilters: 'grid grid-cols-1 md:grid-cols-3 gap-4',
  gridMetrics: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
  
  // Flex
  flexResponsive: 'flex flex-col lg:flex-row lg:items-center lg:justify-between',
  
  // Texto
  titleResponsive: 'text-2xl lg:text-3xl font-bold',
  subtitleResponsive: 'text-base lg:text-lg text-gray-600',
  
  // Botões
  buttonResponsive: 'w-full sm:w-auto',
  
  // Sidebar
  sidebarDesktop: 'hidden lg:block',
  sidebarMobile: 'lg:hidden'
};

/**
 * Helper para aplicar hover effects de forma consistente
 */
export const applyHoverEffect = (tipo: keyof typeof HOVER_EFFECTS, className?: string) => {
  return `${HOVER_EFFECTS[tipo]} ${className || ''}`.trim();
};

/**
 * Helper para aplicar animações
 */
export const applyAnimation = (tipo: keyof typeof ANIMATIONS, className?: string) => {
  return `${ANIMATIONS[tipo]} ${className || ''}`.trim();
};

/**
 * Helper para aplicar estados de loading
 */
export const applyLoadingState = (tipo: keyof typeof LOADING_STATES, className?: string) => {
  return `${LOADING_STATES[tipo]} ${className || ''}`.trim();
};