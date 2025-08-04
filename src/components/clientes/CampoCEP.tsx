
import { useState, useEffect } from 'react';
import { InputComValidacao } from './InputComValidacao';
import { useBuscaCEP } from '@/hooks/useBuscaCEP';
import { useMascaras } from '@/hooks/useMascaras';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CampoCEPProps {
  value: string;
  onChange: (value: string) => void;
  onEnderecoEncontrado: (endereco: {
    logradouro: string;
    bairro: string;
    cidade: string;
    estado: string;
  }) => void;
  erro?: string;
  onValidacao?: (value: string) => void;
}

export function CampoCEP({ 
  value, 
  onChange, 
  onEnderecoEncontrado, 
  erro, 
  onValidacao 
}: CampoCEPProps) {
  const { buscarCEP, carregando, erro: erroCEP } = useBuscaCEP();
  const { aplicarMascaraCEP, removerMascara } = useMascaras();
  const [ultimaBusca, setUltimaBusca] = useState('');

  // Busca automática quando CEP estiver completo
  useEffect(() => {
    const cepLimpo = removerMascara(value);
    
    if (cepLimpo.length === 8 && cepLimpo !== ultimaBusca && !carregando) {
      setUltimaBusca(cepLimpo);
      
      const buscarEndereco = async () => {
        const endereco = await buscarCEP(cepLimpo);
        if (endereco) {
          onEnderecoEncontrado(endereco);
        }
      };
      
      buscarEndereco();
    }
  }, [value, buscarCEP, onEnderecoEncontrado, ultimaBusca, carregando, removerMascara]);

  const handleBuscarManual = async () => {
    const cepLimpo = removerMascara(value);
    if (cepLimpo.length === 8) {
      const endereco = await buscarCEP(cepLimpo);
      if (endereco) {
        onEnderecoEncontrado(endereco);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorMascarado = aplicarMascaraCEP(e.target.value);
    onChange(valorMascarado);
    
    if (onValidacao) {
      onValidacao(valorMascarado);
    }
  };

  const cepCompleto = removerMascara(value).length === 8;
  const temErroGeral = erro || erroCEP;

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <div className="flex-1">
          <InputComValidacao
            label="CEP"
            value={value}
            onChange={handleChange}
            placeholder="00000-000"
            erro={temErroGeral}
            sucesso={cepCompleto && !temErroGeral}
            dica="Busca automática quando CEP estiver completo"
            maxLength={9}
          />
        </div>
        
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBuscarManual}
            disabled={!cepCompleto || carregando}
            className="h-11 px-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white/90 rounded-xl"
          >
            {carregando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      
      {carregando && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Buscando endereço...</span>
        </div>
      )}
    </div>
  );
}
