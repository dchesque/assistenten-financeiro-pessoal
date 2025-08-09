// Factory pattern para gerenciar instâncias de serviços de dados
import { IDataService } from './interfaces/IDataService';
import { MockDataServiceAdapter } from './adapters/MockDataServiceAdapter';
import { SupabaseDataService } from './SupabaseDataService';
import { FEATURES } from '@/config/features';

let serviceInstance: IDataService | null = null;

// Função principal para criar instância do serviço
function createDataService(): IDataService {
  // Em produção: sempre Supabase
  if (import.meta.env.PROD) {
    return new SupabaseDataService();
  }
  
  // Em dev: checar flag de mock
  const useMock = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  
  if (useMock) {
    console.warn('🚨 Usando MockDataService - dados não serão persistidos!');
    return new MockDataServiceAdapter();
  }
  
  return new SupabaseDataService();
}

export class DataServiceFactory {
  static getInstance(): IDataService {
    if (!serviceInstance) {
      serviceInstance = createDataService();
      
      if (import.meta.env.DEV) {
        console.warn(`🔧 DataService inicializado: ${FEATURES.USE_SUPABASE ? 'Supabase' : 'Mock'}`);
      }
    }
    
    return serviceInstance;
  }
  
  // Método para forçar recriação (útil para testes ou troca de configuração)
  static reset(): void {
    serviceInstance = null;
    console.warn('🔄 Factory resetado - próxima chamada criará nova instância');
  }
  
  // Método para verificar qual serviço está ativo
  static getActiveService(): 'mock' | 'supabase' {
    return FEATURES.USE_SUPABASE ? 'supabase' : 'mock';
  }

  // Método para verificar se está em modo de desenvolvimento
  static isDevelopment(): boolean {
    return !FEATURES.USE_SUPABASE;
  }

  // Método para logging de debug
  static logStatus(): void {
    console.warn('🔍 Status do DataServiceFactory:', {
      activeService: DataServiceFactory.getActiveService(),
      isDevelopment: DataServiceFactory.isDevelopment(),
      hasInstance: !!serviceInstance,
      useSupabase: FEATURES.USE_SUPABASE
    });
  }
}

// Export conveniente para uso direto
export const dataService = DataServiceFactory.getInstance();