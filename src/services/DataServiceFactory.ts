// Factory pattern para gerenciar instâncias de serviços de dados
import { DATABASE_CONFIG, validateDatabaseConfig } from '@/config/database.config';
import { IDataService } from './interfaces/IDataService';
import { MockDataServiceAdapter } from './adapters/MockDataServiceAdapter';
import { SupabaseDataService } from './adapters/SupabaseDataService';

let serviceInstance: IDataService | null = null;

export class DataServiceFactory {
  static getInstance(): IDataService {
    if (!serviceInstance) {
      validateDatabaseConfig();
      
      if (DATABASE_CONFIG.USE_MOCK_DATA) {
        if (DATABASE_CONFIG.ENABLE_LOGGING) {
          console.log('🔧 Inicializando MockDataService (desenvolvimento)');
        }
        serviceInstance = new MockDataServiceAdapter();
      } else {
        if (DATABASE_CONFIG.ENABLE_LOGGING) {
          console.log('🚀 Inicializando SupabaseDataService (produção)');
        }
        serviceInstance = new SupabaseDataService();
      }
    }
    
    return serviceInstance;
  }
  
  // Método para forçar recriação (útil para testes ou troca de configuração)
  static reset(): void {
    serviceInstance = null;
    if (DATABASE_CONFIG.ENABLE_LOGGING) {
      console.log('🔄 Factory resetado - próxima chamada criará nova instância');
    }
  }
  
  // Método para verificar qual serviço está ativo
  static getActiveService(): 'mock' | 'supabase' {
    return DATABASE_CONFIG.USE_MOCK_DATA ? 'mock' : 'supabase';
  }

  // Método para verificar se está em modo de desenvolvimento
  static isDevelopment(): boolean {
    return DATABASE_CONFIG.USE_MOCK_DATA;
  }

  // Método para logging de debug
  static logStatus(): void {
    console.log('🔍 Status do DataServiceFactory:', {
      activeService: DataServiceFactory.getActiveService(),
      isDevelopment: DataServiceFactory.isDevelopment(),
      hasInstance: !!serviceInstance,
      config: {
        useMock: DATABASE_CONFIG.USE_MOCK_DATA,
        hasSupabaseUrl: !!DATABASE_CONFIG.SUPABASE_URL,
        loggingEnabled: DATABASE_CONFIG.ENABLE_LOGGING
      }
    });
  }
}

// Export conveniente para uso direto
export const dataService = DataServiceFactory.getInstance();