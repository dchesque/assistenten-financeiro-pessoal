
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormatacao } from "@/hooks/useFormatacao";
import { ClienteSelector } from "@/components/vendas/ClienteSelector";
import { VendedorSelector } from "@/components/vendedores/VendedorSelector";
import { PlanoContasSelector } from "@/components/vendas/PlanoContasSelector";
import { Cliente } from "@/types/cliente";
import { Vendedor } from "@/types/vendedor";
import { PlanoContas } from "@/types/planoContas";
import { Calendar, Clock, DollarSign, TrendingUp, CreditCard, StickyNote, RotateCcw, QrCode, Banknote, FileText, ArrowRightLeft, Search, User } from "lucide-react";
import { FORMAS_PAGAMENTO } from "@/types/venda";

interface FormularioVendaProps {
  formData: any;
  setFormData: (data: any) => void;
  calcularValorLiquido: () => number;
  calcularPercentualDesconto: (valorDesconto: string, valorBruto: string) => string;
  errosValidacao: Record<string, string>;
}

export function FormularioVenda({ 
  formData, 
  setFormData, 
  calcularValorLiquido, 
  calcularPercentualDesconto,
  errosValidacao 
}: FormularioVendaProps) {
  const {
    formatarMoedaInput,
    formatarPercentualInput,
    converterMoedaParaNumero,
    converterPercentualParaNumero
  } = useFormatacao();

  // Sincronização bidirecional de desconto
  useEffect(() => {
    if (formData.descontoPercentual && formData.valorBruto) {
      const bruto = converterMoedaParaNumero(formData.valorBruto);
      const percentual = converterPercentualParaNumero(formData.descontoPercentual);
      const descontoCalculado = bruto * percentual / 100;
      setFormData(prev => ({
        ...prev,
        descontoValor: formatarMoedaInput(descontoCalculado.toString())
      }));
    } else if (!formData.descontoPercentual) {
      setFormData(prev => ({ ...prev, descontoValor: '' }));
    }
  }, [formData.descontoPercentual, formData.valorBruto, formatarMoedaInput, converterMoedaParaNumero, converterPercentualParaNumero]);

  return (
    <div className="space-y-6">
      {/* Seção 1️⃣ - Dados da Venda */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
        {/* Header da seção */}
        <div className="bg-blue-50 rounded-t-xl p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              1
            </div>
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Dados da Venda
          </h2>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Data da Venda <span className="text-red-500">*</span>
              </label>
              <Input 
                type="date" 
                value={formData.dataVenda} 
                onChange={e => setFormData(prev => ({ ...prev, dataVenda: e.target.value }))} 
                className={`bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11 ${errosValidacao.dataVenda ? 'border-red-500' : ''}`}
              />
              {errosValidacao.dataVenda && (
                <p className="text-red-600 text-xs mt-1">{errosValidacao.dataVenda}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Hora
              </label>
              <Input 
                type="time" 
                value={formData.horaVenda} 
                onChange={e => setFormData(prev => ({ ...prev, horaVenda: e.target.value }))} 
                className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11" 
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Cliente
              </label>
              <ClienteSelector 
                clienteSelecionado={formData.cliente} 
                onClienteChange={cliente => setFormData(prev => ({ ...prev, cliente }))} 
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Vendedor
              </label>
              <VendedorSelector 
                vendedorSelecionado={formData.vendedor} 
                onVendedorChange={vendedor => {
                  setFormData(prev => ({ 
                    ...prev, 
                    vendedor,
                    vendedor_id: vendedor?.id || null
                  }));
                }} 
                allowEmpty={true}
                placeholder="Selecione um vendedor (opcional)"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Categoria/Plano de Contas <span className="text-red-500">*</span>
              </label>
              <PlanoContasSelector 
                categoriaSelecionada={formData.categoria} 
                onCategoriaChange={categoria => setFormData(prev => ({ ...prev, categoria }))} 
                tipoVenda={formData.tipoVenda}
              />
              {errosValidacao.categoria && (
                <p className="text-red-600 text-xs mt-1">{errosValidacao.categoria}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2️⃣ - Valores e Tipo */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
        {/* Header da seção */}
        <div className="bg-green-50 rounded-t-xl p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              2
            </div>
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Valores e Tipo
          </h2>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Tipo de Venda <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="tipoVenda" 
                  value="venda" 
                  checked={formData.tipoVenda === 'venda'} 
                  onChange={e => setFormData(prev => ({ ...prev, tipoVenda: e.target.value as 'venda' }))} 
                  className="text-green-600" 
                />
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-700">Venda</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="tipoVenda" 
                  value="devolucao" 
                  checked={formData.tipoVenda === 'devolucao'} 
                  onChange={e => setFormData(prev => ({ ...prev, tipoVenda: e.target.value as 'devolucao' }))} 
                  className="text-red-600" 
                />
                <RotateCcw className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-700">Devolução</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Valor Bruto <span className="text-red-500">*</span>
              </label>
              <Input 
                placeholder="R$ 0,00" 
                value={formData.valorBruto} 
                onChange={e => {
                  const valorFormatado = formatarMoedaInput(e.target.value);
                  setFormData(prev => ({ ...prev, valorBruto: valorFormatado }));
                }} 
                className={`bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11 ${errosValidacao.valorBruto ? 'border-red-500' : ''}`}
              />
              {errosValidacao.valorBruto && (
                <p className="text-red-600 text-xs mt-1">{errosValidacao.valorBruto}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Desconto %
              </label>
              <Input 
                placeholder="0,00%" 
                value={formData.descontoPercentual} 
                onChange={e => {
                  const percentualFormatado = formatarPercentualInput(e.target.value);
                  setFormData(prev => ({ ...prev, descontoPercentual: percentualFormatado }));
                }} 
                className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11" 
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Desconto R$
              </label>
              <Input 
                placeholder="R$ 0,00" 
                value={formData.descontoValor} 
                onChange={e => {
                  const valorFormatado = formatarMoedaInput(e.target.value);
                  const percentualCalculado = calcularPercentualDesconto(valorFormatado, formData.valorBruto);
                  
                  setFormData(prev => ({
                    ...prev,
                    descontoValor: valorFormatado,
                    descontoPercentual: percentualCalculado
                  }));
                }} 
                className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11" 
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Valor Líquido
            </label>
            <div className={`text-lg font-semibold p-3 rounded-xl border-2 ${
              calcularValorLiquido() < 0 ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'
            }`}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(calcularValorLiquido())}
            </div>
          </div>
        </div>
      </div>

      {/* Seção 3️⃣ - Forma de Pagamento */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
        {/* Header da seção */}
        <div className="bg-yellow-50 rounded-t-xl p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              3
            </div>
            <CreditCard className="w-5 h-5 mr-2 text-yellow-600" />
            Forma de Pagamento
          </h2>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Tipo de Pagamento - À Vista ou Parcelada */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Tipo de Pagamento <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all duration-200 flex-1">
                <input 
                  type="radio" 
                  name="tipoPagamento" 
                  value="vista" 
                  checked={formData.vendaAVista} 
                  onChange={() => setFormData(prev => ({ 
                    ...prev, 
                    vendaAVista: true, 
                    parcelamento: 1,
                    formaPagamento: prev.formaPagamento === 'cartao_credito' ? '' : prev.formaPagamento
                  }))} 
                  className="text-green-600 w-4 h-4" 
                />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">💰</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Venda à Vista</span>
                    <p className="text-xs text-gray-500">PIX, Dinheiro, Débito, Transferência, Boleto</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all duration-200 flex-1">
                <input 
                  type="radio" 
                  name="tipoPagamento" 
                  value="parcelada" 
                  checked={!formData.vendaAVista} 
                  onChange={() => setFormData(prev => ({ 
                    ...prev, 
                    vendaAVista: false,
                    formaPagamento: 'cartao_credito'
                  }))} 
                  className="text-blue-600 w-4 h-4" 
                />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Venda Parcelada</span>
                    <p className="text-xs text-gray-500">Apenas Cartão de Crédito</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Método de Pagamento Filtrado */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Método de Pagamento <span className="text-red-500">*</span>
            </label>
            <Select 
              value={formData.formaPagamento} 
              onValueChange={value => setFormData(prev => ({ ...prev, formaPagamento: value }))}
            >
              <SelectTrigger className={`bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11 ${errosValidacao.formaPagamento ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione o método de pagamento" />
              </SelectTrigger>
              <SelectContent className="bg-white backdrop-blur-xl z-50">
                {FORMAS_PAGAMENTO
                  .filter(forma => {
                    if (formData.vendaAVista) {
                      // À vista: excluir cartão de crédito
                      return forma.valor !== 'cartao_credito';
                    } else {
                      // Parcelada: apenas cartão de crédito
                      return forma.valor === 'cartao_credito';
                    }
                  })
                  .map(forma => {
                    const IconeForma = forma.icone === 'QrCode' ? QrCode :
                                      forma.icone === 'CreditCard' ? CreditCard :
                                      forma.icone === 'Banknote' ? Banknote :
                                      forma.icone === 'FileText' ? FileText :
                                      forma.icone === 'ArrowRightLeft' ? ArrowRightLeft : CreditCard;
                    return (
                      <SelectItem key={forma.valor} value={forma.valor}>
                        <div className="flex items-center">
                          <IconeForma className="w-4 h-4 mr-2" style={{ color: forma.cor }} />
                          {forma.nome}
                        </div>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            {errosValidacao.formaPagamento && (
              <p className="text-red-600 text-xs mt-1">{errosValidacao.formaPagamento}</p>
            )}
          </div>

          {/* Seção de Maquininha para Cartões */}
          {(['cartao_debito', 'cartao_credito'].includes(formData.formaPagamento)) && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Maquininha
              </label>
              <Select onValueChange={value => setFormData(prev => ({ ...prev, bancoId: parseInt(value) }))}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11">
                  <SelectValue placeholder="Selecione a maquininha" />
                </SelectTrigger>
                <SelectContent className="bg-white backdrop-blur-xl z-50">
                  <SelectItem value="1">Stone - Terminal 1</SelectItem>
                  <SelectItem value="2">PagSeguro - Terminal 2</SelectItem>
                  <SelectItem value="3">Mercado Pago - Point</SelectItem>
                  <SelectItem value="4">SumUp - Top</SelectItem>
                  <SelectItem value="5">Rede - POS</SelectItem>
                  <SelectItem value="6">Cielo - LIO</SelectItem>
                  <SelectItem value="7">GetNet - Terminal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Seção de Banco para Transferências, PIX e Boleto */}
          {(['transferencia', 'boleto', 'pix'].includes(formData.formaPagamento)) && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Banco
              </label>
              <Select onValueChange={value => setFormData(prev => ({ ...prev, bancoId: parseInt(value) }))}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent className="bg-white backdrop-blur-xl z-50">
                  <SelectItem value="1">Banco do Brasil</SelectItem>
                  <SelectItem value="2">Caixa Econômica Federal</SelectItem>
                  <SelectItem value="3">Itaú Unibanco</SelectItem>
                  <SelectItem value="4">Bradesco</SelectItem>
                  <SelectItem value="5">Santander</SelectItem>
                  <SelectItem value="6">Nubank</SelectItem>
                  <SelectItem value="7">Inter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Número de Parcelas - Apenas para Cartão de Crédito e Vendas Parceladas */}
          {!formData.vendaAVista && formData.formaPagamento === 'cartao_credito' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Número de Parcelas <span className="text-red-500">*</span>
              </label>
              <Select 
                value={formData.parcelamento.toString()} 
                onValueChange={value => setFormData(prev => ({ ...prev, parcelamento: parseInt(value) }))}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white backdrop-blur-xl z-50">
                  {Array.from({ length: 12 }, (_, i) => i + 2).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x de {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(calcularValorLiquido() / num)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Indicador Visual do Tipo de Venda */}
          <div className={`p-3 rounded-xl border-l-4 ${
            formData.vendaAVista 
              ? 'bg-green-50 border-green-500' 
              : 'bg-blue-50 border-blue-500'
          }`}>
            <div className="flex items-center space-x-2">
              {formData.vendaAVista ? (
                <>
                  <span className="text-lg">💰</span>
                  <div>
                    <p className="font-medium text-green-800">Venda à Vista</p>
                    <p className="text-sm text-green-600">Pagamento em 1x - sem parcelamento</p>
                  </div>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Venda Parcelada</p>
                    <p className="text-sm text-blue-600">
                      {formData.parcelamento > 1 ? `${formData.parcelamento}x no cartão de crédito` : 'Selecione o número de parcelas'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção 4️⃣ - Informações Adicionais */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
        {/* Header da seção */}
        <div className="bg-orange-50 rounded-t-xl p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
              4
            </div>
            <StickyNote className="w-5 h-5 mr-2 text-orange-600" />
            Informações Adicionais
          </h2>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Documento/Referência
            </label>
            <Input 
              placeholder="NF, cupom, pedido..." 
              value={formData.documentoReferencia} 
              onChange={e => setFormData(prev => ({ ...prev, documentoReferencia: e.target.value }))} 
              className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-11" 
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex justify-between">
              <span>Observações</span>
              <span className="text-xs text-gray-500">{formData.observacoes.length}/500</span>
            </label>
            <Textarea 
              placeholder="Observações sobre a venda" 
              rows={3} 
              maxLength={500}
              value={formData.observacoes} 
              onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} 
              className="bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>

          <div className="pt-2">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="enviarPorEmail" 
                checked={formData.enviarPorEmail} 
                onCheckedChange={checked => setFormData(prev => ({ ...prev, enviarPorEmail: !!checked }))} 
              />
              <label htmlFor="enviarPorEmail" className="text-sm font-medium text-gray-700 cursor-pointer">
                Enviar comprovante por email
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
