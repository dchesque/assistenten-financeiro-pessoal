// Hook para integrar dados mock no sistema existente
import { useEffect } from 'react';
import { mockCredoresPersonais } from '@/utils/mockDadosPessoais';
import { useFornecedores } from './useFornecedores';
import type { Fornecedor } from '@/types/fornecedor';

export const useDadosExemplo = () => {
  const { fornecedores, criarFornecedor } = useFornecedores();

  // Integrar dados mock se o sistema estiver vazio
  useEffect(() => {
    const integrarDadosExemplo = async () => {
      // Verificar se já existem dados
      if (fornecedores.length > 0) return;

      try {
        // Converter dados mock para formato do sistema
        for (const mockCredor of mockCredoresPersonais) {
          const credorParaCriar: Omit<Fornecedor, 'id' | 'dataCadastro' | 'totalCompras' | 'valorTotal'> = {
            nome: mockCredor.nome,
            tipo: mockCredor.tipo as 'pessoa_fisica' | 'pessoa_juridica',
            documento: mockCredor.documento,
            email: mockCredor.email,
            telefone: mockCredor.telefone,
            endereco: mockCredor.endereco,
            cidade: mockCredor.cidade,
            estado: mockCredor.estado,
            cep: mockCredor.cep,
            observacoes: mockCredor.observacoes,
            categoria_padrao_id: mockCredor.categoria_padrao_id,
            tipo_fornecedor: mockCredor.tipo_fornecedor as 'receita' | 'despesa',
            ativo: mockCredor.ativo
          };

          await criarFornecedor(credorParaCriar);
        }
      } catch (error) {
        console.log('Dados de exemplo já integrados ou erro na integração:', error);
      }
    };

    // Aguardar um pouco para carregar dados existentes
    const timer = setTimeout(integrarDadosExemplo, 2000);
    return () => clearTimeout(timer);
  }, [fornecedores.length, criarFornecedor]);

  return {
    dadosExemploCarregados: fornecedores.some(f => 
      mockCredoresPersonais.some(m => m.documento === f.documento)
    )
  };
};