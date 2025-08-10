import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContatos } from '@/hooks/useContatos';
import { Badge } from '@/components/ui/badge';

interface ContactSelectorProps {
  value: string;
  onChange: (value: string) => void;
  tipo?: 'supplier' | 'customer' | 'all';
  placeholder?: string;
  required?: boolean;
}

export function ContactSelector({ 
  value, 
  onChange, 
  tipo = 'all', 
  placeholder = "Selecione um contato",
  required = false 
}: ContactSelectorProps) {
  const handleChange = (newValue: string) => {
    if (newValue === "empty") {
      onChange("");
    } else {
      onChange(newValue);
    }
  };
  
  const { contatos, credores, pagadores, loading } = useContatos();

  const getContatos = () => {
    switch (tipo) {
      case 'supplier':
        return credores;
      case 'customer':
        return pagadores;
      default:
        return contatos;
    }
  };

  const contatosFiltrados = getContatos();

  const formatDocument = (document: string | null) => {
    if (!document) return '';
    const cleaned = document.replace(/\D/g, '');
    if (cleaned.length === 11) {
      // CPF format
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleaned.length === 14) {
      // CNPJ format
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return document;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'supplier':
        return 'Fornecedor';
      case 'customer':
        return 'Cliente';
      case 'other':
        return 'Outro';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        Carregando contatos...
      </div>
    );
  }

  return (
    <Select value={value || "empty"} onValueChange={handleChange} required={required}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {!required && <SelectItem value="empty">Nenhum contato</SelectItem>}
        {contatosFiltrados.map((contato) => (
          <SelectItem key={contato.id} value={contato.id}>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="font-medium">{contato.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {contato.document && (
                    <span>{formatDocument(contato.document)}</span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(contato.type)}
                  </Badge>
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
        {contatosFiltrados.length === 0 && (
          <SelectItem value="empty" disabled>
            Nenhum contato encontrado
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}