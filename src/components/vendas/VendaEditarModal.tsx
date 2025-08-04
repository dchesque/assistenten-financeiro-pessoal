import { useState, useEffect } from 'react';
import { Venda, NovaVenda, FORMAS_PAGAMENTO } from '@/types/venda';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatarMoeda } from '@/utils/formatters';
import { 
  aplicarMascaraMoeda, 
  aplicarMascaraPercentual, 
  converterMoedaParaNumero, 
  converterPercentualParaNumero,
  numeroParaMascaraMoeda,
  numeroParaMascaraPercentual
} from '@/utils/masks';
import { User, Search, Calculator, CreditCard, X, Edit, MessageSquare, Check, ChevronsUpDown } from 'lucide-react';
import { useClientesSupabase } from '@/hooks/useClientesSupabase';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader, FieldDisplay, LoadingSpinner, ValorVendaGrid } from './ModalComponents';
import { cn } from '@/lib/utils';
import { VendedorSelector } from '@/components/vendedores/VendedorSelector';
import { Vendedor } from '@/types/vendedor';
import { useVendedores } from '@/hooks/useVendedores';

interface VendaEditarModalProps {
  venda: Venda | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendaAtualizada: Venda) => void;
}

export function VendaEditarModal({ venda, isOpen, onClose, onSave }: VendaEditarModalProps) {
  const { toast } = useToast();
  const { clientes } = useClientesSupabase();
  const { planoContas: planos } = usePlanoContas();
  const { bancos } = useBancosSupabase();
  const { vendedores } = useVendedores();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState<Partial<NovaVenda>>({
    data_venda: '',
    hora_venda: '',
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
  const [vendedorSelecionado, setVendedorSelecionado] = useState<Vendedor | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<any>(null);
  
  // Estados para os popovers de busca
  const [clientePopoverOpen, setClientePopoverOpen] = useState(false);
  const [categoriaPopoverOpen, setCategoriaPopoverOpen] = useState(false);
  
  // Estados para campos com máscara
  const [valorBrutoMascarado, setValorBrutoMascarado] = useState('');
  const [descontoPercentualMascarado, setDescontoPercentualMascarado] = useState('');
  const [descontoValorMascarado, setDescontoValorMascarado] = useState('');

  useEffect(() => {
    if (venda && isOpen) {
      // Buscar cliente, vendedor e categoria pelos IDs
      const cliente = venda.cliente_id ? clientes.find(c => c.id === venda.cliente_id) : null;
      const vendedor = venda.vendedor_id ? vendedores.find(v => v.id === venda.vendedor_id) : null;
      const categoria = planos.find(c => c.id === venda.categoria_id);

      setClienteSelecionado(cliente);
      setVendedorSelecionado(vendedor);
      setCategoriaSelecionada(categoria);

      setFormData({
        data_venda: venda.data_venda,
        hora_venda: venda.hora_venda,
        cliente_id: venda.cliente_id,
        categoria_id: venda.categoria_id,
        valor_bruto: venda.valor_bruto,
        desconto_percentual: venda.desconto_percentual,
        desconto_valor: venda.desconto_valor,
        forma_pagamento: venda.forma_pagamento,
        banco_id: venda.banco_id,
        tipo_venda: venda.tipo_venda,
        documento_referencia: venda.documento_referencia || '',
        observacoes: venda.observacoes || '',
        venda_a_vista: true,
        enviar_por_email: false
      });

      // Inicializar campos mascarados
      setValorBrutoMascarado(numeroParaMascaraMoeda(venda.valor_bruto));
      setDescontoPercentualMascarado(numeroParaMascaraPercentual(venda.desconto_percentual));
      setDescontoValorMascarado(numeroParaMascaraMoeda(venda.desconto_valor));
    }
  }, [venda, isOpen]);

  // Handlers para campos mascarados
  const handleValorBrutoChange = (valor: string) => {
    const valorMascarado = aplicarMascaraMoeda(valor);
    const valorNumerico = converterMoedaParaNumero(valorMascarado);
    
    setValorBrutoMascarado(valorMascarado);
    setFormData(prev => ({ ...prev, valor_bruto: valorNumerico }));
    
    // Recalcular desconto em valor se há percentual
    if (formData.desconto_percentual && formData.desconto_percentual > 0) {
      const novoDescontoValor = (valorNumerico * formData.desconto_percentual) / 100;
      setFormData(prev => ({ ...prev, desconto_valor: novoDescontoValor }));
      setDescontoValorMascarado(numeroParaMascaraMoeda(novoDescontoValor));
    }
  };

  const handleDescontoPercentualChange = (valor: string) => {
    const valorMascarado = aplicarMascaraPercentual(valor);
    const valorNumerico = converterPercentualParaNumero(valorMascarado);
    
    setDescontoPercentualMascarado(valorMascarado);
    setFormData(prev => ({ ...prev, desconto_percentual: valorNumerico }));
    
    // Recalcular desconto em valor
    const valorBruto = formData.valor_bruto || 0;
    const novoDescontoValor = (valorBruto * valorNumerico) / 100;
    setFormData(prev => ({ ...prev, desconto_valor: novoDescontoValor }));
    setDescontoValorMascarado(numeroParaMascaraMoeda(novoDescontoValor));
  };

  const handleDescontoValorChange = (valor: string) => {
    const valorMascarado = aplicarMascaraMoeda(valor);
    const valorNumerico = converterMoedaParaNumero(valorMascarado);
    
    setDescontoValorMascarado(valorMascarado);
    setFormData(prev => ({ ...prev, desconto_valor: valorNumerico }));
    
    // Recalcular desconto em percentual
    const valorBruto = formData.valor_bruto || 0;
    const novoDescontoPercentual = valorBruto > 0 ? (valorNumerico / valorBruto) * 100 : 0;
    setFormData(prev => ({ ...prev, desconto_percentual: novoDescontoPercentual }));
    setDescontoPercentualMascarado(numeroParaMascaraPercentual(novoDescontoPercentual));
  };

  const calcularValorLiquido = () => {
    const valorBruto = formData.valor_bruto || 0;
    const descontoValor = formData.desconto_valor || 0;
    return valorBruto - descontoValor;
  };

  const handleSave = async () => {
    try {
      setErro('');
      setLoading(true);

      // Validações
      if (!categoriaSelecionada) {
        setErro('Selecione uma categoria');
        return;
      }

      if (!formData.valor_bruto || formData.valor_bruto <= 0) {
        setErro('Valor bruto deve ser maior que zero');
        return;
      }

      const vendaAtualizada: Venda = {
        ...venda!,
        data_venda: formData.data_venda!,
        hora_venda: formData.hora_venda!,
        cliente_id: formData.cliente_id,
        cliente_nome: clienteSelecionado?.nome || 'VAREJO',
        cliente_documento: clienteSelecionado?.documento,
        vendedor_id: vendedorSelecionado?.id,
        vendedor: vendedorSelecionado?.nome,
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
        updated_at: new Date().toISOString()
      };

      onSave(vendaAtualizada);
      toast({
        title: "Sucesso",
        description: "Venda atualizada com sucesso!",
        variant: "default"
      });
      onClose();
    } catch (error) {
      setErro('Erro ao salvar alterações');
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!venda || !isOpen) return null;

  const valorLiquido = calcularValorLiquido();
  const formaRequerBanco = ['cartao_credito', 'cartao_debito', 'transferencia'].includes(formData.forma_pagamento!);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Edit className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Editar Venda
                </h2>
                <p className="text-sm text-gray-500">ID: #{venda.id}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Mensagem de erro */}
        {erro && (
          <div className="flex-shrink-0 mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{erro}</p>
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Coluna 1: Dados Principais */}
              <div className="lg:col-span-2 space-y-8">
                <SectionHeader icon={User} title="1. Dados da Venda" color="blue" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data">Data da Venda *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data_venda}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_venda: e.target.value }))}
                      className="bg-white border border-gray-300 rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="hora">Hora da Venda *</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={formData.hora_venda}
                      onChange={(e) => setFormData(prev => ({ ...prev, hora_venda: e.target.value }))}
                      className="bg-white border border-gray-300 rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <Popover open={clientePopoverOpen} onOpenChange={setClientePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={clientePopoverOpen}
                          className="w-full justify-between bg-white border border-gray-300 rounded-xl h-11 hover:bg-gray-50"
                        >
                          {clienteSelecionado?.nome || 'VAREJO'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="varejo"
                                onSelect={() => {
                                  setClienteSelecionado(null);
                                  setFormData(prev => ({ ...prev, cliente_id: undefined }));
                                  setClientePopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !clienteSelecionado ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                VAREJO
                              </CommandItem>
                              {clientes.filter(c => c.ativo).map((cliente) => (
                                <CommandItem
                                  key={cliente.id}
                                  value={`${cliente.nome} ${cliente.documento}`}
                                  onSelect={() => {
                                    setClienteSelecionado(cliente);
                                    setFormData(prev => ({ ...prev, cliente_id: cliente.id }));
                                    setClientePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      clienteSelecionado?.id === cliente.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{cliente.nome}</span>
                                    <span className="text-sm text-gray-500">{cliente.documento}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="vendedor">Vendedor</Label>
                    <VendedorSelector 
                      vendedorSelecionado={vendedorSelecionado} 
                      onVendedorChange={(vendedor) => {
                        setVendedorSelecionado(vendedor);
                        setFormData(prev => ({ 
                          ...prev, 
                          vendedor_id: vendedor?.id || undefined
                        }));
                      }} 
                      allowEmpty={true}
                      placeholder="Selecione um vendedor (opcional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Popover open={categoriaPopoverOpen} onOpenChange={setCategoriaPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={categoriaPopoverOpen}
                          className="w-full justify-between bg-white border border-gray-300 rounded-xl h-11 hover:bg-gray-50"
                        >
                          {categoriaSelecionada ? `${categoriaSelecionada.codigo} - ${categoriaSelecionada.nome}` : 'Selecionar categoria...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                        <Command>
                          <CommandInput placeholder="Buscar categoria..." />
                          <CommandList>
                            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                            <CommandGroup>
                              {planos.filter(c => c.ativo).map((categoria) => (
                                <CommandItem
                                  key={categoria.id}
                                  value={`${categoria.codigo} ${categoria.nome}`}
                                  onSelect={() => {
                                    setCategoriaSelecionada(categoria);
                                    setFormData(prev => ({ ...prev, categoria_id: categoria.id }));
                                    setCategoriaPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      categoriaSelecionada?.id === categoria.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex items-center space-x-3">
                                    <Badge 
                                      className="rounded-full text-white border-0 text-xs w-8 h-6 flex items-center justify-center" 
                                      style={{ backgroundColor: categoria.cor }}
                                    >
                                      {categoria.codigo}
                                    </Badge>
                                    <span>{categoria.nome}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="documento">Documento de Referência</Label>
                    <Input
                      id="documento"
                      placeholder="NF-001234"
                      value={formData.documento_referencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, documento_referencia: e.target.value }))}
                      className="bg-white border border-gray-300 rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo">Tipo de Venda *</Label>
                    <Select value={formData.tipo_venda} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_venda: value as any }))}>
                      <SelectTrigger className="bg-white border border-gray-300 rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-xl">
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="devolucao">Devolução</SelectItem>
                        <SelectItem value="desconto">Desconto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <SectionHeader icon={Calculator} title="2. Valores" color="green" />
                
                <div className="space-y-4">
                  {/* Valor Bruto */}
                  <div>
                    <Label htmlFor="valorBruto">Valor Bruto *</Label>
                    <Input
                      id="valorBruto"
                      type="text"
                      placeholder="R$ 0,00"
                      value={valorBrutoMascarado}
                      onChange={(e) => handleValorBrutoChange(e.target.value)}
                      className="bg-white border border-gray-300 rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-right"
                    />
                  </div>

                  {/* Desconto */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Desconto</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          type="text"
                          placeholder="0,00%"
                          value={descontoPercentualMascarado}
                          onChange={(e) => handleDescontoPercentualChange(e.target.value)}
                          className="bg-white border border-gray-300 rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-right"
                        />
                        <p className="text-xs text-gray-500 mt-1">Percentual (%)</p>
                      </div>
                      <div>
                        <Input
                          type="text"
                          placeholder="R$ 0,00"
                          value={descontoValorMascarado}
                          onChange={(e) => handleDescontoValorChange(e.target.value)}
                          className="bg-white border border-gray-300 rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-right"
                        />
                        <p className="text-xs text-gray-500 mt-1">Valor (R$)</p>
                      </div>
                    </div>
                  </div>

                  {/* Valor Líquido */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Valor Líquido:</span>
                      <span className={`text-3xl font-bold ${
                        valorLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatarMoeda(Math.abs(valorLiquido))}
                      </span>
                    </div>
                  </div>
                </div>

                <SectionHeader icon={CreditCard} title="3. Forma de Pagamento" color="purple" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
                    <Select value={formData.forma_pagamento} onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value, banco_id: undefined }))}>
                      <SelectTrigger className="bg-white border border-gray-300 rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-xl">
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
                      <Label htmlFor="banco">Banco</Label>
                      <Select value={formData.banco_id?.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, banco_id: parseInt(value) }))}>
                        <SelectTrigger className="bg-white border border-gray-300 rounded-xl h-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <SelectValue placeholder="Selecionar banco" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-xl">
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

                <SectionHeader icon={MessageSquare} title="Observações" color="gray" />
                <Textarea
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={4}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Observações sobre esta venda..."
                />
              </div>

              {/* Coluna 2: Preview */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-xl sticky top-6">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview da Venda</h3>
                    
                    <div className="space-y-3 text-sm">
                      <FieldDisplay 
                        label="Cliente" 
                        value={clienteSelecionado?.nome || 'VAREJO'} 
                      />

                      {categoriaSelecionada && (
                        <FieldDisplay 
                          label="Categoria" 
                          value={
                            <Badge 
                              className="rounded-full text-white border-0 text-xs" 
                              style={{ backgroundColor: categoriaSelecionada.cor }}
                            >
                              {categoriaSelecionada.codigo}
                            </Badge>
                          } 
                        />
                      )}

                      <FieldDisplay 
                        label="Valor Bruto" 
                        value={formatarMoeda(formData.valor_bruto || 0)} 
                      />

                      {(formData.desconto_valor || 0) > 0 && (
                        <FieldDisplay 
                          label="Desconto" 
                          value={`${formData.desconto_percentual?.toFixed(1)}% - ${formatarMoeda(formData.desconto_valor || 0)}`}
                          valueClass="text-orange-600 font-medium"
                        />
                      )}

                      <div className="border-t pt-3">
                        <FieldDisplay 
                          label="Valor Líquido" 
                          value={formatarMoeda(Math.abs(valorLiquido))}
                          valueClass={`font-bold text-lg ${
                            valorLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        />
                      </div>

                      <FieldDisplay 
                        label="Pagamento" 
                        value={FORMAS_PAGAMENTO.find(f => f.valor === formData.forma_pagamento)?.nome}
                      />

                      <FieldDisplay 
                        label="Tipo" 
                        value={
                          <Badge className={`rounded-full text-xs ${
                            formData.tipo_venda === 'venda' ? 'bg-green-100 text-green-700' :
                            formData.tipo_venda === 'devolucao' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {formData.tipo_venda === 'venda' ? 'Venda' :
                             formData.tipo_venda === 'devolucao' ? 'Devolução' : 'Desconto'}
                          </Badge>
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}