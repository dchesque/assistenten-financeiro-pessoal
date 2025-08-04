import { useState, useEffect } from 'react';
import { Venda, NovaVenda, FORMAS_PAGAMENTO } from '@/types/venda';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/modal';
import { formatarMoeda, formatarData } from '@/utils/formatters';
import { User, Search, Calculator, CreditCard, Copy, X, MessageSquare } from 'lucide-react';
import { useClientesSupabase } from '@/hooks/useClientesSupabase';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader, FieldDisplay, LoadingSpinner } from './ModalComponents';

interface VendaDuplicarModalProps {
  vendaOriginal: Venda | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (novaVenda: Venda) => void;
}

export function VendaDuplicarModal({ vendaOriginal, isOpen, onClose, onSave }: VendaDuplicarModalProps) {
  const { toast } = useToast();
  const { clientes } = useClientesSupabase();
  const { planoContas: planos } = usePlanoContas();
  const { bancos } = useBancosSupabase();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState<Partial<NovaVenda>>({
    data_venda: new Date().toISOString().split('T')[0],
    hora_venda: new Date().toTimeString().slice(0, 5),
    cliente_id: undefined,
    categoria_id: 0,
    valor_bruto: 0,
    desconto_percentual: 0,
    desconto_valor: 0,
    forma_pagamento: 'pix',
    banco_id: undefined,
    tipo_venda: 'venda',
    documento_referencia: '',
    observacoes: '',
    venda_a_vista: true,
    enviar_por_email: false
  });

  // Estados para seleções
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<any>(null);

  useEffect(() => {
    if (vendaOriginal && isOpen) {
      // Buscar cliente e categoria pelos IDs
      const cliente = vendaOriginal.cliente_id ? clientes.find(c => c.id === vendaOriginal.cliente_id) : null;
      const categoria = planos.find(c => c.id === vendaOriginal.categoria_id);

      setClienteSelecionado(cliente);
      setCategoriaSelecionada(categoria);

      // Preencher com dados da venda original, mas limpar valores e documento
      setFormData({
        data_venda: new Date().toISOString().split('T')[0],
        hora_venda: new Date().toTimeString().slice(0, 5),
        cliente_id: vendaOriginal.cliente_id,
        categoria_id: vendaOriginal.categoria_id,
        valor_bruto: 0, // Limpar valor para nova digitação
        desconto_percentual: 0, // Resetar desconto
        desconto_valor: 0,
        forma_pagamento: vendaOriginal.forma_pagamento,
        banco_id: vendaOriginal.banco_id,
        tipo_venda: vendaOriginal.tipo_venda,
        documento_referencia: '', // Limpar documento
        observacoes: `Duplicada de venda ${formatarData(vendaOriginal.data_venda)}`,
        venda_a_vista: true,
        enviar_por_email: false
      });
    }
  }, [vendaOriginal, isOpen]);

  const calcularValorLiquido = () => {
    const valorBruto = formData.valor_bruto || 0;
    const descontoValor = formData.desconto_valor || 0;
    return valorBruto - descontoValor;
  };

  const atualizarDesconto = (campo: 'percentual' | 'valor', valor: number) => {
    const valorBruto = formData.valor_bruto || 0;
    
    if (campo === 'percentual') {
      const descontoValor = (valorBruto * valor) / 100;
      setFormData(prev => ({
        ...prev,
        desconto_percentual: valor,
        desconto_valor: descontoValor
      }));
    } else {
      const descontoPercentual = valorBruto > 0 ? (valor / valorBruto) * 100 : 0;
      setFormData(prev => ({
        ...prev,
        desconto_percentual: descontoPercentual,
        desconto_valor: valor
      }));
    }
  };

  const handleSave = async () => {
    // Validações
    if (!categoriaSelecionada) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria",
        variant: "destructive"
      });
      return;
    }

    if (!formData.valor_bruto || formData.valor_bruto <= 0) {
      toast({
        title: "Erro", 
        description: "Valor bruto deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Gerar novo ID (simulado)
      const novoId = Math.max(...JSON.parse(localStorage.getItem('vendas') || '[]').map((v: any) => v.id), 0) + 1;

      const novaVenda: Venda = {
        id: novoId,
        data_venda: formData.data_venda!,
        hora_venda: formData.hora_venda!,
        cliente_id: formData.cliente_id,
        cliente_nome: clienteSelecionado?.nome || 'VAREJO',
        cliente_documento: clienteSelecionado?.documento,
        categoria_id: formData.categoria_id!,
        categoria_nome: categoriaSelecionada.nome,
        categoria_codigo: categoriaSelecionada.codigo,
        categoria_cor: categoriaSelecionada.cor,
        valor_bruto: formData.valor_bruto!,
        desconto_percentual: formData.desconto_percentual!,
        desconto_valor: formData.desconto_valor!,
        valor_liquido: formData.tipo_venda === 'devolucao' ? -calcularValorLiquido() : calcularValorLiquido(),
        forma_pagamento: formData.forma_pagamento as any,
        banco_id: formData.banco_id,
        banco_nome: formData.banco_id ? bancos.find(b => b.id === formData.banco_id)?.nome : undefined,
        tipo_venda: formData.tipo_venda as any,
        documento_referencia: formData.documento_referencia,
        observacoes: formData.observacoes,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      onSave(novaVenda);
      toast({
        title: "Sucesso",
        description: "Venda duplicada com sucesso!",
        variant: "default"
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao duplicar venda",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!vendaOriginal) return null;

  const valorLiquido = calcularValorLiquido();
  const formaRequerBanco = ['cartao_credito', 'cartao_debito', 'transferencia'].includes(formData.forma_pagamento!);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicar Venda"
      subtitle={`Baseada na venda de ${formatarData(vendaOriginal.data_venda)}`}
      size="xl"
      className="max-w-5xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Dados Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seção 1: Dados da Venda */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Copy className="w-5 h-5 text-blue-600" />
                <span>1. Nova Venda (Dados Atualizados)</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data">Data da Venda *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data_venda}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_venda: e.target.value }))}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl h-11"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hora">Hora da Venda *</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora_venda}
                    onChange={(e) => setFormData(prev => ({ ...prev, hora_venda: e.target.value }))}
                    className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="cliente">Cliente (Copiado)</Label>
                  <div className="relative">
                    <Input
                      id="cliente"
                      value={clienteSelecionado?.nome || 'VAREJO'}
                      readOnly
                      className="bg-green-50 border border-green-200 rounded-xl h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="categoria">Categoria (Copiada) *</Label>
                  <div className="relative">
                    <Input
                      id="categoria"
                      value={categoriaSelecionada ? `${categoriaSelecionada.codigo} - ${categoriaSelecionada.nome}` : ''}
                      readOnly
                      className="bg-green-50 border border-green-200 rounded-xl h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="documento">Documento de Referência (Novo)</Label>
                  <Input
                    id="documento"
                    placeholder="NF-001234"
                    value={formData.documento_referencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, documento_referencia: e.target.value }))}
                    className="bg-yellow-50 border border-yellow-200 rounded-xl h-11"
                  />
                  <p className="text-xs text-gray-500 mt-1">Campo limpo para nova venda</p>
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo de Venda (Copiado) *</Label>
                  <Select value={formData.tipo_venda} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_venda: value as any }))}>
                    <SelectTrigger className="bg-green-50 border border-green-200 rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="devolucao">Devolução</SelectItem>
                      <SelectItem value="desconto">Desconto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Valores (Novos) */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-green-600" />
                <span>2. Valores (Inserir Novos Valores)</span>
              </h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-700">
                  💡 Os valores foram zerados. Digite os novos valores para a venda duplicada.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valorBruto">Valor Bruto (Novo) *</Label>
                  <Input
                    id="valorBruto"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_bruto}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_bruto: parseFloat(e.target.value) || 0 }))}
                    className="bg-yellow-50 border border-yellow-200 rounded-xl h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="descontoPerc">Desconto (%) (Novo)</Label>
                  <Input
                    id="descontoPerc"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.desconto_percentual}
                    onChange={(e) => atualizarDesconto('percentual', parseFloat(e.target.value) || 0)}
                    className="bg-yellow-50 border border-yellow-200 rounded-xl h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="descontoValor">Desconto (R$) (Novo)</Label>
                  <Input
                    id="descontoValor"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.desconto_valor}
                    onChange={(e) => atualizarDesconto('valor', parseFloat(e.target.value) || 0)}
                    className="bg-yellow-50 border border-yellow-200 rounded-xl h-11"
                  />
                </div>

                <div>
                  <Label>Valor Líquido (Calculado)</Label>
                  <div className={`h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center px-3 font-semibold text-lg ${
                    valorLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatarMoeda(Math.abs(valorLiquido))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Forma de Pagamento (Copiada) */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>3. Forma de Pagamento (Copiada)</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
                  <Select value={formData.forma_pagamento} onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value, banco_id: undefined }))}>
                    <SelectTrigger className="bg-green-50 border border-green-200 rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                      {FORMAS_PAGAMENTO.map(forma => (
                        <SelectItem key={forma.valor} value={forma.valor}>
                          {forma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formaRequerBanco && (
                  <div>
                    <Label htmlFor="banco">Banco (Copiado)</Label>
                    <Select value={formData.banco_id?.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, banco_id: parseInt(value) }))}>
                      <SelectTrigger className="bg-green-50 border border-green-200 rounded-xl h-11">
                        <SelectValue placeholder="Selecionar banco" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                        {bancos.filter(b => b.ativo).map(banco => (
                          <SelectItem key={banco.id} value={banco.id.toString()}>
                            {banco.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre a venda..."
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl min-h-[100px]"
            />
          </div>
        </div>

        {/* Coluna 2: Preview */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200/50 rounded-xl sticky top-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Copy className="w-4 h-4" />
                <span>Nova Venda</span>
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{clienteSelecionado?.nome || 'VAREJO'}</span>
                </div>

                {categoriaSelecionada && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Categoria:</span>
                    <Badge 
                      className="rounded-full text-white border-0 text-xs" 
                      style={{ backgroundColor: categoriaSelecionada.cor }}
                    >
                      {categoriaSelecionada.codigo}
                    </Badge>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Bruto:</span>
                  <span className="font-medium">{formatarMoeda(formData.valor_bruto || 0)}</span>
                </div>

                {(formData.desconto_valor || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Desconto:</span>
                    <span className="text-orange-600 font-medium">
                      {formData.desconto_percentual?.toFixed(1)}% - {formatarMoeda(formData.desconto_valor || 0)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t pt-3">
                  <span className="font-semibold text-gray-900">Valor Líquido:</span>
                  <span className={`font-bold text-lg ${
                    valorLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatarMoeda(Math.abs(valorLiquido))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Pagamento:</span>
                  <span className="font-medium">
                    {FORMAS_PAGAMENTO.find(f => f.valor === formData.forma_pagamento)?.nome}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <Badge className={`rounded-full text-xs ${
                    formData.tipo_venda === 'venda' ? 'bg-green-100 text-green-700' :
                    formData.tipo_venda === 'devolucao' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {formData.tipo_venda === 'venda' ? 'Venda' :
                     formData.tipo_venda === 'devolucao' ? 'Devolução' : 'Desconto'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 Esta venda será criada como uma nova entrada, duplicando a configuração da venda original.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={onClose}
          disabled={loading}
          className="bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 px-6 py-3"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg px-6 py-3"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Duplicando...
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar Venda
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}