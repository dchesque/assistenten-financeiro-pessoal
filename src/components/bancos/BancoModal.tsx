import { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Banco } from '../../types/banco';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InputValidacao } from '../ui/InputValidacao';
import { useToast } from '../../hooks/use-toast';
import { useValidacoesBanco } from '../../hooks/useValidacoesBanco';
import { useDebounce } from '../../hooks/useDebounce';
import { useMascaras } from '../../hooks/useMascaras';

interface BancoModalProps {
  isOpen: boolean;
  onClose: () => void;
  banco?: Banco | null;
  bancos?: Banco[];
  onSave: (banco: Omit<Banco, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function BancoModal({ isOpen, onClose, banco, bancos = [], onSave }: BancoModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mostrarErros, setMostrarErros] = useState(false);
  
  const { aplicarMascaraTelefone } = useMascaras();
  const [formData, setFormData] = useState<{
    nome: string;
    codigo_banco: string;
    agencia: string;
    conta: string;
    digito_verificador: string;
    tipo_conta: 'conta_corrente' | 'poupanca' | 'conta_salario';
    saldo_inicial: number;
    saldo_atual: number;
    limite: number;
    limite_usado: number;
    suporta_ofx: boolean;
    url_ofx: string;
    ultimo_fitid: string;
    data_ultima_sincronizacao: string;
    gerente: string;
    telefone: string;
    email: string;
    observacoes: string;
    ativo: boolean;
  }>({
    nome: '',
    codigo_banco: '',
    agencia: '',
    conta: '',
    digito_verificador: '',
    tipo_conta: 'conta_corrente',
    saldo_inicial: 0,
    saldo_atual: 0,
    limite: 0,
    limite_usado: 0,
    suporta_ofx: false,
    url_ofx: '',
    ultimo_fitid: '',
    data_ultima_sincronizacao: '',
    gerente: '',
    telefone: '',
    email: '',
    observacoes: '',
    ativo: true
  });

  // Hook de validações
  const { erros, validarCampo, validarTodos, limparErros, temErros } = useValidacoesBanco(bancos, banco);
  
  // Debounce para validações em tempo real
  const debouncedFormData = useDebounce(formData, 500);

  useEffect(() => {
    if (debouncedFormData && Object.values(debouncedFormData).some(v => v !== '')) {
      // Validar apenas campos preenchidos
      Object.keys(erros).forEach(campo => {
        const valor = debouncedFormData[campo as keyof typeof debouncedFormData];
        if (valor) {
          validarCampo(campo as keyof typeof erros, valor, debouncedFormData);
        }
      });
    }
  }, [debouncedFormData]);

  useEffect(() => {
    if (banco) {
      setFormData({
        nome: banco.nome,
        codigo_banco: banco.codigo_banco,
        agencia: banco.agencia,
        conta: banco.conta,
        digito_verificador: banco.digito_verificador,
        tipo_conta: banco.tipo_conta,
        saldo_inicial: banco.saldo_inicial,
        saldo_atual: banco.saldo_atual,
        limite: banco.limite || 0,
        limite_usado: banco.limite_usado,
        suporta_ofx: banco.suporta_ofx,
        url_ofx: banco.url_ofx || '',
        ultimo_fitid: banco.ultimo_fitid || '',
        data_ultima_sincronizacao: banco.data_ultima_sincronizacao || '',
        gerente: banco.gerente || '',
        telefone: banco.telefone || '',
        email: banco.email || '',
        observacoes: banco.observacoes || '',
        ativo: banco.ativo
      });
    } else {
      setFormData({
        nome: '',
        codigo_banco: '',
        agencia: '',
        conta: '',
        digito_verificador: '',
        tipo_conta: 'conta_corrente',
        saldo_inicial: 0,
        saldo_atual: 0,
        limite: 0,
        limite_usado: 0,
        suporta_ofx: false,
        url_ofx: '',
        ultimo_fitid: '',
        data_ultima_sincronizacao: '',
        gerente: '',
        telefone: '',
        email: '',
        observacoes: '',
        ativo: true
      });
      limparErros();
    }
  }, [banco, limparErros]);

  const handleSave = async () => {
    // Validar todos os campos
    const hasErrors = validarTodos(formData);
    
    if (hasErrors) {
      setMostrarErros(true);
      toast({
        title: "Erro de Validação",
        description: "Corrija os erros antes de continuar",
        variant: "destructive"
      });
      return;
    }

    // Verificar campos obrigatórios
    if (!formData.nome || !formData.codigo_banco || !formData.agencia || !formData.conta || !formData.digito_verificador) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simular delay para demonstrar loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Calcular saldo atual se for novo banco
      const saldoAtual = banco ? formData.saldo_atual : formData.saldo_inicial;
      
      await onSave({
        ...formData,
        saldo_atual: saldoAtual
      });
      
      toast({
        title: "Sucesso",
        description: banco ? "Banco atualizado com sucesso!" : "Banco criado com sucesso!"
      });
      
      limparErros();
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar banco. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    limparErros();
    setMostrarErros(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 flex-shrink-0">
          <h2 className="text-2xl font-bold text-foreground">
            {banco ? 'Editar Banco' : 'Novo Banco'}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Modal de Erros */}
          {mostrarErros && temErros && (
            <div className="bg-red-50/80 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2 text-red-700 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Erros encontrados:</span>
              </div>
              <div className="space-y-1 text-sm text-red-600">
                {Object.entries(erros).map(([campo, errosCampo]) => 
                  errosCampo.map((erro, index) => (
                    <p key={`${campo}-${index}`} className="flex items-center space-x-1">
                      <span>•</span>
                      <span>{erro}</span>
                    </p>
                  ))
                )}
              </div>
            </div>
          )}
          {/* Dados Bancários Básicos */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Dados Bancários</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InputValidacao
                  id="nome"
                  label="Nome do Banco"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Banco do Brasil"
                  obrigatorio
                  erro={erros.nome}
                  sucesso={formData.nome.length >= 3 && erros.nome.length === 0}
                  validacao={(valor) => validarCampo('nome', valor, formData)}
                />
              </div>
              
              <div>
                <InputValidacao
                  id="codigo_banco"
                  label="Código do Banco"
                  value={formData.codigo_banco}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo_banco: e.target.value }))}
                  placeholder="Ex: 001"
                  obrigatorio
                  erro={erros.codigo_banco}
                  sucesso={/^\d{3}$/.test(formData.codigo_banco) && erros.codigo_banco.length === 0}
                  validacao={(valor) => validarCampo('codigo_banco', valor, formData)}
                  maxLength={3}
                />
              </div>
              
              <div>
                <InputValidacao
                  id="agencia"
                  label="Agência"
                  value={formData.agencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, agencia: e.target.value }))}
                  placeholder="Ex: 1234-5"
                  obrigatorio
                  erro={erros.agencia}
                  sucesso={/^\d{4,5}(-\d)?$/.test(formData.agencia) && erros.agencia.length === 0}
                  validacao={(valor) => validarCampo('agencia', valor, formData)}
                />
              </div>
              
              <div>
                <InputValidacao
                  id="conta"
                  label="Número da Conta"
                  value={formData.conta}
                  onChange={(e) => setFormData(prev => ({ ...prev, conta: e.target.value }))}
                  placeholder="Ex: 12345-6"
                  obrigatorio
                  erro={erros.conta}
                  sucesso={/^\d{5,10}(-\d)?$/.test(formData.conta) && erros.conta.length === 0}
                  validacao={(valor) => validarCampo('conta', valor, formData)}
                />
              </div>
              
              <div>
                <InputValidacao
                  id="digito_verificador"
                  label="Dígito Verificador"
                  value={formData.digito_verificador}
                  onChange={(e) => setFormData(prev => ({ ...prev, digito_verificador: e.target.value }))}
                  placeholder="Ex: 7"
                  obrigatorio
                  erro={erros.digito_verificador}
                  sucesso={/^\d{1,2}$/.test(formData.digito_verificador) && erros.digito_verificador.length === 0}
                  validacao={(valor) => validarCampo('digito_verificador', valor, formData)}
                  maxLength={2}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="tipo_conta">Tipo de Conta *</Label>
                <Select 
                  value={formData.tipo_conta} 
                  onValueChange={(value: 'conta_corrente' | 'poupanca' | 'conta_salario') => 
                    setFormData(prev => ({ ...prev, tipo_conta: value }))
                  }
                >
                  <SelectTrigger className="input-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border border-white/20">
                    <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="conta_salario">Conta Salário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Configurações OFX */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Configurações OFX</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suporta_ofx"
                  checked={formData.suporta_ofx}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, suporta_ofx: checked as boolean }))
                  }
                />
                <Label htmlFor="suporta_ofx">Suporta OFX</Label>
              </div>
              
              {formData.suporta_ofx && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <InputValidacao
                      id="url_ofx"
                      label="URL OFX"
                      value={formData.url_ofx}
                      onChange={(e) => setFormData(prev => ({ ...prev, url_ofx: e.target.value }))}
                      placeholder="https://..."
                      erro={erros.url_ofx}
                      sucesso={formData.url_ofx === '' || (/^https?:\/\/.+/.test(formData.url_ofx) && erros.url_ofx.length === 0)}
                      validacao={(valor) => validarCampo('url_ofx', valor, formData)}
                      dica="URL para conexão automatizada com o banco"
                    />
                  </div>
                  
                  {banco && (
                    <>
                      <div>
                        <Label htmlFor="ultimo_fitid">Último FITID</Label>
                        <Input
                          id="ultimo_fitid"
                          value={formData.ultimo_fitid}
                          readOnly
                          className="input-base bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="data_ultima_sincronizacao">Data Última Sincronização</Label>
                        <Input
                          id="data_ultima_sincronizacao"
                          value={formData.data_ultima_sincronizacao}
                          readOnly
                          className="input-base bg-gray-50"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Informações Financeiras */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Informações Financeiras</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="saldo_inicial">Saldo Inicial</Label>
                <Input
                  id="saldo_inicial"
                  type="number"
                  step="0.01"
                  value={formData.saldo_inicial}
                  onChange={(e) => setFormData(prev => ({ ...prev, saldo_inicial: parseFloat(e.target.value) || 0 }))}
                  className="input-base"
                />
              </div>
              
              {banco && (
                <div>
                  <Label htmlFor="saldo_atual">Saldo Atual</Label>
                  <Input
                    id="saldo_atual"
                    type="number"
                    step="0.01"
                    value={formData.saldo_atual}
                    readOnly
                    className="input-base bg-gray-50"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="limite">Limite (opcional)</Label>
                <Input
                  id="limite"
                  type="number"
                  step="0.01"
                  value={formData.limite}
                  onChange={(e) => setFormData(prev => ({ ...prev, limite: parseFloat(e.target.value) || 0 }))}
                  className="input-base"
                />
              </div>
              
              {banco && formData.limite > 0 && (
                <div>
                  <Label htmlFor="limite_usado">Limite Usado</Label>
                  <Input
                    id="limite_usado"
                    type="number"
                    step="0.01"
                    value={formData.limite_usado}
                    readOnly
                    className="input-base bg-gray-50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dados Adicionais */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Dados Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gerente">Gerente</Label>
                <Input
                  id="gerente"
                  value={formData.gerente}
                  onChange={(e) => setFormData(prev => ({ ...prev, gerente: e.target.value }))}
                  className="input-base"
                />
              </div>
              
              <div>
                <InputValidacao
                  id="telefone"
                  label="Telefone do Banco"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  erro={erros.telefone}
                  sucesso={formData.telefone === '' || (/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.telefone) && erros.telefone.length === 0)}
                  validacao={(valor) => validarCampo('telefone', valor, formData)}
                  mascara={aplicarMascaraTelefone}
                />
              </div>
              
              <div className="md:col-span-2">
                <InputValidacao
                  id="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@banco.com.br"
                  erro={erros.email}
                  sucesso={formData.email === '' || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && erros.email.length === 0)}
                  validacao={(valor) => validarCampo('email', valor, formData)}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="input-base"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Fixo */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center space-x-2">
              {temErros && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Corrija os erros antes de salvar</span>
                </div>
              )}
              {!temErros && formData.nome && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Dados válidos</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={loading || temErros}
                className="btn-primary min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {banco ? 'Atualizando...' : 'Salvando...'}
                  </>
                ) : (
                  banco ? 'Salvar Alterações' : 'Criar Banco'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}