import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import type { TaxaMaquininha } from '@/types/maquininha';
import { BANDEIRAS, TIPOS_TRANSACAO } from '@/types/maquininha';

interface TabelaTaxasProps {
  taxas: Omit<TaxaMaquininha, 'id' | 'maquininha_id'>[];
  onTaxasChange: (taxas: Omit<TaxaMaquininha, 'id' | 'maquininha_id'>[]) => void;
  readonly?: boolean;
}

const PARCELAS_OPTIONS = [
  { value: undefined, label: 'N/A' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' },
  { value: 5, label: '5x' },
  { value: 6, label: '6x' },
  { value: 7, label: '7x' },
  { value: 8, label: '8x' },
  { value: 9, label: '9x' },
  { value: 10, label: '10x' },
  { value: 11, label: '11x' },
  { value: 12, label: '12x' }
];

export default function TabelaTaxas({ taxas, onTaxasChange, readonly = false }: TabelaTaxasProps) {
  
  const adicionarTaxa = () => {
    const novaTaxa: Omit<TaxaMaquininha, 'id' | 'maquininha_id'> = {
      bandeira: 'visa',
      tipo_transacao: 'debito',
      parcelas_max: undefined,
      taxa_percentual: 0,
      taxa_fixa: 0,
      ativo: true
    };
    onTaxasChange([...taxas, novaTaxa]);
  };

  const removerTaxa = (index: number) => {
    const novasTaxas = taxas.filter((_, i) => i !== index);
    onTaxasChange(novasTaxas);
  };

  const atualizarTaxa = (index: number, campo: string, valor: any) => {
    const novasTaxas = taxas.map((taxa, i) => 
      i === index ? { ...taxa, [campo]: valor } : taxa
    );
    onTaxasChange(novasTaxas);
  };

  const formatarTipoTransacao = (tipo: string, parcelas?: number) => {
    const tipoLabel = TIPOS_TRANSACAO[tipo as keyof typeof TIPOS_TRANSACAO] || tipo;
    if (tipo === 'credito_parcelado' && parcelas) {
      return `${tipoLabel} ${parcelas}x`;
    }
    return tipoLabel;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Configuração de Taxas por Bandeira</h3>
        {!readonly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarTaxa}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Taxa
          </Button>
        )}
      </div>

      {taxas.length > 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="font-semibold">Bandeira</TableHead>
                <TableHead className="font-semibold">Tipo de Transação</TableHead>
                <TableHead className="font-semibold">Parcelas Máx.</TableHead>
                <TableHead className="font-semibold">Taxa (%)</TableHead>
                <TableHead className="font-semibold">Taxa Fixa (R$)</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                {!readonly && <TableHead className="font-semibold w-20">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxas.map((taxa, index) => (
                <TableRow key={index} className="hover:bg-gray-50/50">
                  <TableCell>
                    {readonly ? (
                      <span className="font-medium">
                        {BANDEIRAS[taxa.bandeira as keyof typeof BANDEIRAS] || taxa.bandeira}
                      </span>
                    ) : (
                      <Select 
                        value={taxa.bandeira} 
                        onValueChange={(value) => atualizarTaxa(index, 'bandeira', value)}
                      >
                        <SelectTrigger className="bg-white/90">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BANDEIRAS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>

                  <TableCell>
                    {readonly ? (
                      <span>{formatarTipoTransacao(taxa.tipo_transacao, taxa.parcelas_max)}</span>
                    ) : (
                      <Select 
                        value={taxa.tipo_transacao} 
                        onValueChange={(value) => {
                          atualizarTaxa(index, 'tipo_transacao', value);
                          if (value !== 'credito_parcelado') {
                            atualizarTaxa(index, 'parcelas_max', undefined);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white/90">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TIPOS_TRANSACAO).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>

                  <TableCell>
                    {readonly ? (
                      <span>{taxa.parcelas_max || 'N/A'}</span>
                    ) : taxa.tipo_transacao === 'credito_parcelado' ? (
                      <Select 
                        value={taxa.parcelas_max?.toString() || ''} 
                        onValueChange={(value) => atualizarTaxa(index, 'parcelas_max', value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger className="bg-white/90">
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {PARCELAS_OPTIONS.map((option) => (
                            <SelectItem 
                              key={option.value || 'na'} 
                              value={option.value?.toString() || ''}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {readonly ? (
                      <span className="font-mono">{taxa.taxa_percentual.toFixed(2)}%</span>
                    ) : (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={taxa.taxa_percentual}
                        onChange={(e) => atualizarTaxa(index, 'taxa_percentual', parseFloat(e.target.value) || 0)}
                        className="bg-white/90 w-24"
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    {readonly ? (
                      <span className="font-mono">
                        R$ {taxa.taxa_fixa?.toFixed(2) || '0,00'}
                      </span>
                    ) : (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={taxa.taxa_fixa || 0}
                        onChange={(e) => atualizarTaxa(index, 'taxa_fixa', parseFloat(e.target.value) || 0)}
                        className="bg-white/90 w-24"
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant={taxa.ativo ? 'default' : 'secondary'}>
                      {taxa.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>

                  {!readonly && (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerTaxa(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white/50 rounded-lg border border-white/20">
          <div className="text-gray-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma taxa configurada</h3>
            <p className="text-sm">
              {readonly 
                ? 'Esta maquininha não possui taxas configuradas'
                : 'Clique em "Adicionar Taxa" para configurar as taxas por bandeira e tipo de transação'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}