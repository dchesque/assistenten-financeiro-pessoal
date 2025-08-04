
import { useState, useEffect } from 'react';
import { Cliente } from '@/types/cliente';
import { useClientesSupabase } from '@/hooks/useClientesSupabase';

export const useClientes = () => {
  const { clientes: clientesSupabase, loading } = useClientesSupabase();
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Sincronizar com dados do Supabase
  useEffect(() => {
    setClientes(clientesSupabase);
  }, [clientesSupabase]);

  const buscarClientes = (termo: string): Cliente[] => {
    if (!termo) return clientes.slice(0, 10); // Limitar resultados
    
    const termoLower = termo.toLowerCase();
    return clientes
      .filter(cliente => 
        cliente.nome.toLowerCase().includes(termoLower) ||
        cliente.documento?.toLowerCase().includes(termoLower) ||
        cliente.email?.toLowerCase().includes(termoLower)
      )
      .slice(0, 10); // Limitar a 10 resultados
  };

  return {
    clientes,
    loading,
    buscarClientes
  };
};
