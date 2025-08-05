import { useState, useEffect, useCallback } from 'react';
import { Cheque } from '@/types/cheque';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Building2, User, DollarSign, Calendar, FileText, ArrowRight, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { formatarMoeda } from '@/utils/formatters';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { useFornecedoresSupabase } from '@/hooks/useFornecedoresSupabase';
import { useValidacoesCompletas } from '@/hooks/useValidacoesCompletas';
import { toast } from '@/hooks/use-toast';
import { AcaoLoadingSpinner } from '@/components/cheques/ChequesSkeleton';

interface ChequeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cheque?: Cheque | null;
  onSave: (cheque: Omit<Cheque, 'id' | 'created_at' | 'updated_at'>) => void;
  loading?: boolean;
}

export function ChequeModal({ isOpen, onClose, cheque, onSave, loading = false }: ChequeModalProps) {
  const isEdit = !!cheque;
  const [formData, setFormData] = useState<Partial<Cheque>>({
    banco_id: 0,
    numero_cheque: '',
    tipo_beneficiario: 'fornecedor',
    fornecedor_id: 0,
    beneficiario_nome: '',
    beneficiario_documento: '',
    valor: 0,
    data_emissao: new Date().toISOString().split('T')[0],
    data_vencimento: '',
    status: 'pendente',
    finalidade: '',
    observacoes: ''
  });

  const [vincularContaPagar, setVincularContaPagar] = useState(false);
  const [buscarFornecedor, setBuscarFornecedor] = useState('');
  const [mostrarProximoSugestao, setMostrarProximoSugestao] = useState(false);
  
  const {
    validarDadosCheque,
    buscarProximoNumeroDisponivel,
    validacaoVisual,
    atualizarValidacaoVisual,
    limparValidacoesVisuais
  } = useValidacoesCompletas();

  useEffect(() => {
    if (cheque) {
      setFormData(cheque);
      setBuscarFornecedor('');
    } else {
      // Reset form for new cheque
      setFormData({
        banco_id: 0,
        numero_cheque: '',
        tipo_beneficiario: 'fornecedor',
        fornecedor_id: 0,
        beneficiario_nome: '',
        beneficiario_documento: '',
        valor: 0,
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: '',
        status: 'pendente',
        finalidade: '',
        observacoes: ''
      });
      setBuscarFornecedor('');
    }
    
    // Limpar validações quando modal abrir/fechar
    if (isOpen) {
      limparValidacoesVisuais();
    }
  }, [cheque, isOpen, limparValidacoesVisuais]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação completa
    const resultado = validarDadosCheque(formData, cheque?.id);
    
    if (!resultado.valido) {
      // Mostrar primeiro erro
      const primeiroErro = resultado.erros[0];
      toast({
        title: "Dados inválidos",
        description: primeiroErro.mensagem,
        variant: "destructive"
      });
      
      // Focar no primeiro campo com erro
      const campo = document.getElementById(primeiroErro.campo);
      if (campo) {
        campo.focus();
      }
      
      return;
    }
    
    // Mostrar warnings se houver
    if (resultado.warnings.length > 0) {
      toast({
        title: "Atenção",
        description: resultado.warnings[0],
      });
    }

    onSave(formData as Omit<Cheque, 'id' | 'created_at' | 'updated_at'>);
  };

  const handleProximoNumero = useCallback(() => {
    if (!formData.banco_id) {
      toast({
        title: "Selecione o banco",
        description: "É necessário selecionar o banco primeiro para buscar o próximo número.",
        variant: "destructive"
      });
      return;
    }
    
    const proximoNumero = buscarProximoNumeroDisponivel(formData.banco_id);
    setFormData(prev => ({ ...prev, numero_cheque: proximoNumero }));
    setMostrarProximoSugestao(true);
    
    toast({
      title: "Próximo número encontrado",
      description: `Número ${proximoNumero} está disponível para uso.`,
    });
    
    // Esconder sugestão após 3 segundos
    setTimeout(() => setMostrarProximoSugestao(false), 3000);
  }, [formData.banco_id, buscarProximoNumeroDisponivel]);

  // Atualizar validação visual quando campos mudarem
  const handleFieldChange = useCallback((campo: string, valor: any) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    atualizarValidacaoVisual(campo, valor, formData, cheque?.id);
  }, [formData, atualizarValidacaoVisual, cheque?.id]);

  // Filtrar credores para busca
  const { bancos } = useBancosSupabase();
  const { fornecedores } = useFornecedoresSupabase();
  
  const fornecedoresFiltrados = fornecedores.filter(f =>
    f.ativo && 
    (!buscarFornecedor || 
     f.nome.toLowerCase().includes(buscarFornecedor.toLowerCase()) ||
     f.documento.includes(buscarFornecedor)
    )
  ).slice(0, 10); // Máximo 10 resultados

  const banco = bancos.find(b => b.id === formData.banco_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-8 pt-8 pb-4">
          <DialogTitle className="flex items-center space-x-3 text-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900">{isEdit ? 'Editar Cheque' : 'Emitir Novo Cheque'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-120px)] px-8">
          <form id="cheque-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Seção: Dados Bancários */}
          <div className="bg-blue-50/50 border-l-4 border-blue-500 rounded-r-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dados Bancários</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="banco_id" className="text-sm font-medium text-gray-700">Banco *</Label>
                <Select 
                  value={formData.banco_id?.toString()} 
                  onValueChange={(value) => handleFieldChange('banco_id', Number(value))}
                >
                  <SelectTrigger className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 h-11 ${
                    validacaoVisual.banco_id?.hasError ? 'border-red-300' : 
                    validacaoVisual.banco_id?.borderColor || 'border-gray-200'
                  }`}>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20">
                    {bancos.filter(b => b.ativo).map(banco => (
                      <SelectItem key={banco.id} value={banco.id.toString()}>
                        <div>
                          <div className="font-medium">{banco.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            Ag: {banco.agencia} - Cc: {banco.conta}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validacaoVisual.banco_id?.hasError && (
                  <p className="text-sm text-red-600">{validacaoVisual.banco_id.message}</p>
                )}
                {banco && !banco.ativo && (
                  <div className="flex items-center space-x-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">Banco inativo</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_cheque" className="text-sm font-medium text-gray-700">Número do Cheque *</Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      id="numero_cheque"
                      value={formData.numero_cheque}
                      onChange={(e) => handleFieldChange('numero_cheque', e.target.value)}
                      placeholder="000001"
                      className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11 font-mono ${
                        validacaoVisual.numero_cheque?.hasError ? 'border-red-300' : 
                        validacaoVisual.numero_cheque?.borderColor || 'border-gray-200'
                      }`}
                      required
                      maxLength={6}
                    />
                    {validacaoVisual.numero_cheque?.hasError && (
                      <p className="text-sm text-red-600 mt-1">{validacaoVisual.numero_cheque.message}</p>
                    )}
                    {mostrarProximoSugestao && !validacaoVisual.numero_cheque?.hasError && (
                      <div className="flex items-center space-x-2 text-green-600 mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs">Número disponível</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleProximoNumero}
                    disabled={!formData.banco_id}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    title="Buscar próximo número disponível"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Próximo</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Dados do Beneficiário */}
          <div className="bg-green-50/50 border-l-4 border-green-500 rounded-r-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dados do Beneficiário</h3>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-700">Tipo de Beneficiário</Label>
                <RadioGroup 
                  value={formData.tipo_beneficiario} 
                  onValueChange={(value: 'fornecedor' | 'outros') => 
                    setFormData(prev => ({ ...prev, tipo_beneficiario: value }))
                  }
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fornecedor" id="fornecedor" />
                    <Label htmlFor="fornecedor">Credor Cadastrado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outros" id="outros" />
                    <Label htmlFor="outros">Outros</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.tipo_beneficiario === 'fornecedor' ? (
                <div className="space-y-2">
                  <Label htmlFor="fornecedor_id" className="text-sm font-medium text-gray-700">Credor *</Label>
                  
                  {/* Busca de credor */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome ou documento..."
                      value={buscarFornecedor}
                      onChange={(e) => setBuscarFornecedor(e.target.value)}
                      className="pl-10 bg-white/80 border border-gray-200 rounded-xl focus:border-blue-500 h-10 text-sm"
                    />
                  </div>
                  
                  <Select 
                    value={formData.fornecedor_id?.toString()} 
                    onValueChange={(value) => {
                      const fornecedor = fornecedores.find(f => f.id === Number(value));
                      if (fornecedor) {
                        handleFieldChange('fornecedor_id', Number(value));
                        handleFieldChange('beneficiario_nome', fornecedor.nome);
                        handleFieldChange('beneficiario_documento', fornecedor.documento);
                      }
                    }}
                  >
                    <SelectTrigger className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 h-11 ${
                      validacaoVisual.fornecedor_id?.hasError ? 'border-red-300' : 
                      validacaoVisual.fornecedor_id?.borderColor || 'border-gray-200'
                    }`}>
                      <SelectValue placeholder="Selecione o credor" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20 max-h-60">
                      {fornecedoresFiltrados.map(fornecedor => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id.toString()}>
                          <div>
                            <div className="font-medium">{fornecedor.nome}</div>
                            <div className="text-sm text-muted-foreground">{fornecedor.documento}</div>
                          </div>
                        </SelectItem>
                      ))}
                      {fornecedoresFiltrados.length === 0 && buscarFornecedor && (
                        <div className="p-2 text-sm text-gray-500">Nenhum credor encontrado</div>
                      )}
                    </SelectContent>
                  </Select>
                  {validacaoVisual.fornecedor_id?.hasError && (
                    <p className="text-sm text-red-600">{validacaoVisual.fornecedor_id.message}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="beneficiario_nome" className="text-sm font-medium text-gray-700">Nome do Beneficiário *</Label>
                    <Input
                      id="beneficiario_nome"
                      value={formData.beneficiario_nome}
                      onChange={(e) => handleFieldChange('beneficiario_nome', e.target.value)}
                      placeholder="Nome completo"
                      className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11 ${
                        validacaoVisual.beneficiario_nome?.hasError ? 'border-red-300' : 
                        validacaoVisual.beneficiario_nome?.borderColor || 'border-gray-200'
                      }`}
                      required={formData.tipo_beneficiario === 'outros'}
                    />
                    {validacaoVisual.beneficiario_nome?.hasError && (
                      <p className="text-sm text-red-600">{validacaoVisual.beneficiario_nome.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beneficiario_documento" className="text-sm font-medium text-gray-700">CPF/CNPJ</Label>
                    <Input
                      id="beneficiario_documento"
                      value={formData.beneficiario_documento}
                      onChange={(e) => handleFieldChange('beneficiario_documento', e.target.value)}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11 ${
                        validacaoVisual.beneficiario_documento?.hasError ? 'border-red-300' : 
                        validacaoVisual.beneficiario_documento?.borderColor || 'border-gray-200'
                      }`}
                    />
                    {validacaoVisual.beneficiario_documento?.hasError && (
                      <p className="text-sm text-red-600">{validacaoVisual.beneficiario_documento.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção: Dados Financeiros */}
          <div className="bg-purple-50/50 border-l-4 border-purple-500 rounded-r-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dados Financeiros</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-sm font-medium text-gray-700">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor}
                  onChange={(e) => handleFieldChange('valor', Number(e.target.value))}
                  placeholder="0,00"
                  className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11 ${
                    validacaoVisual.valor?.hasError ? 'border-red-300' : 
                    validacaoVisual.valor?.borderColor || 'border-gray-200'
                  }`}
                  required
                />
                {formData.valor > 0 && !validacaoVisual.valor?.hasError && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {formatarMoeda(formData.valor)}
                    </span>
                    {formData.valor > 50000 && (
                      <div className="flex items-center space-x-1 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs">Valor alto</span>
                      </div>
                    )}
                  </div>
                )}
                {validacaoVisual.valor?.hasError && (
                  <p className="text-sm text-red-600">{validacaoVisual.valor.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_emissao" className="text-sm font-medium text-gray-700">Data de Emissão *</Label>
                <Input
                  id="data_emissao"
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) => handleFieldChange('data_emissao', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11 ${
                    validacaoVisual.data_emissao?.hasError ? 'border-red-300' : 
                    validacaoVisual.data_emissao?.borderColor || 'border-gray-200'
                  }`}
                  required
                />
                {validacaoVisual.data_emissao?.hasError && (
                  <p className="text-sm text-red-600">{validacaoVisual.data_emissao.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_vencimento" className="text-sm font-medium text-gray-700">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => handleFieldChange('data_vencimento', e.target.value)}
                  min={formData.data_emissao}
                  className={`bg-white/80 border-2 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-11 ${
                    validacaoVisual.data_vencimento?.hasError ? 'border-red-300' : 
                    validacaoVisual.data_vencimento?.borderColor || 'border-gray-200'
                  }`}
                />
                {validacaoVisual.data_vencimento?.hasError && (
                  <p className="text-sm text-red-600">{validacaoVisual.data_vencimento.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Informações Adicionais */}
          <div className="bg-blue-50/50 border-l-4 border-blue-500 rounded-r-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Informações Adicionais</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="finalidade" className="text-sm font-medium text-gray-700">Finalidade/Observações</Label>
                <Textarea
                  id="finalidade"
                  value={formData.finalidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, finalidade: e.target.value }))}
                  placeholder="Pagamento de credor, adiantamento, etc."
                  className="bg-white/80 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  rows={3}
                />
              </div>

              {!isEdit && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="vincular_conta"
                    checked={vincularContaPagar}
                    onCheckedChange={(checked) => setVincularContaPagar(checked === true)}
                  />
                  <Label htmlFor="vincular_conta" className="text-sm font-medium text-gray-700">
                    Este cheque pagará uma conta específica
                  </Label>
                </div>
              )}
            </div>
          </div>
          </form>
        </div>

        {/* Footer Fixo */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 px-8 py-6 z-10">
          <div className="flex justify-between items-center gap-4">
            <Button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="bg-white border-2 border-gray-300 text-gray-700 rounded-xl px-6 py-3 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
            >
              Cancelar
            </Button>
            <Button 
              form="cheque-form"
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3 transition-all duration-200 font-medium disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <AcaoLoadingSpinner size="sm" />}
              <span>{loading ? (isEdit ? 'Salvando...' : 'Emitindo...') : (isEdit ? 'Salvar Alterações' : 'Emitir Cheque')}</span>
            </Button>
          </div>
          
          {/* Resumo de validação */}
          {Object.keys(validacaoVisual).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Campos obrigatórios marcados com *
                </span>
                {Object.values(validacaoVisual).some(v => v.hasError) && (
                  <Badge variant="destructive" className="text-xs">
                    {Object.values(validacaoVisual).filter(v => v.hasError).length} erro(s)
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}