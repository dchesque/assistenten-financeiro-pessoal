import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Receipt, AlertCircle, Trash2, CheckCircle, RotateCcw, User, Calendar, DollarSign, FileText, BarChart3, CreditCard, Settings, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { aplicarMascaraMoeda, converterMoedaParaNumero, numeroParaMascaraMoeda, validarValorMonetario, formatarMoedaExibicao } from '@/utils/masks';
import { ValidationService } from '@/services/ValidationService';
import { supabase } from '@/integrations/supabase/client';
import { CampoComValidacao } from '@/components/ui/CampoComValidacao';
import { validarValor, validarDescricao, validarDataVencimento, validarObservacoes } from '@/utils/validacoesTempoReal';
import { useBancosSupabase } from '@/hooks/useBancosSupabase';
import { usePagadores } from '@/hooks/usePagadores';
import { useCategoriasReceitas } from '@/hooks/useCategoriasReceitas';
import { useContasReceber } from '@/hooks/useContasReceber';
import type { ContaReceber, CriarContaReceber } from '@/types/contaReceber';

export default function NovoRecebimento() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { criarConta } = useContasReceber();
  const { bancos } = useBancosSupabase();
  const { pagadores } = usePagadores();
  const { categorias } = useCategoriasReceitas();

  // Estados do formulário
  const [conta, setConta] = useState<Partial<ContaReceber>>({
    descricao: '',
    valor: 0,
    data_vencimento: '',
    data_recebimento: '',
    status: 'pendente',
    pagador_id: 0,
    categoria_id: 0,
    banco_id: undefined,
    observacoes: '',
    recorrente: false
  });

  // Estados de controle
  const [salvandoRascunho, setSalvandoRascunho] = useState(false);
  const [errosValidacao, setErrosValidacao] = useState<{[key: string]: string}>({});
  const [rascunhoDetectado, setRascunhoDetectado] = useState(false);

  // Auto salvamento no localStorage
  const salvarRascunho = useCallback(async () => {
    if (!conta.descricao && !conta.valor) return;
    
    setSalvandoRascunho(true);
    try {
      localStorage.setItem('rascunho_novo_recebimento', JSON.stringify(conta));
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setSalvandoRascunho(false);
    }
  }, [conta]);

  // Verificar rascunho salvo no carregamento
  useEffect(() => {
    const rascunhoSalvo = localStorage.getItem('rascunho_novo_recebimento');
    if (rascunhoSalvo) {
      setRascunhoDetectado(true);
    }
  }, []);

  // Auto salvamento com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      salvarRascunho();
    }, 2000);
    return () => clearTimeout(timer);
  }, [salvarRascunho]);

  // Handlers de alteração
  const handleInputChange = (campo: keyof ContaReceber, valor: any) => {
    setConta(prev => ({ ...prev, [campo]: valor }));
    
    // Limpar erro do campo ao alterar
    if (errosValidacao[campo]) {
      setErrosValidacao(prev => {
        const novosErros = { ...prev };
        delete novosErros[campo];
        return novosErros;
      });
    }
  };

  const handleValorChange = (valor: string) => {
    const valorMascara = aplicarMascaraMoeda(valor);
    const valorNumerico = converterMoedaParaNumero(valorMascara);
    handleInputChange('valor', valorNumerico);
  };

  // Aplicar rascunho salvo
  const aplicarRascunho = () => {
    const rascunhoSalvo = localStorage.getItem('rascunho_novo_recebimento');
    if (rascunhoSalvo) {
      const dadosRascunho = JSON.parse(rascunhoSalvo);
      setConta(dadosRascunho);
      setRascunhoDetectado(false);
      toast({
        title: 'Rascunho aplicado',
        description: 'Os dados salvos foram restaurados',
      });
    }
  };

  // Descartar rascunho
  const descartarRascunho = () => {
    localStorage.removeItem('rascunho_novo_recebimento');
    setRascunhoDetectado(false);
    toast({
      title: 'Rascunho descartado',
      description: 'Os dados salvos foram removidos',
    });
  };

  // Validação em tempo real
  const validarCampo = (campo: string, valor: any): string => {
    switch (campo) {
      case 'descricao':
        return validarDescricao(valor);
      case 'valor':
        return validarValor(valor);
      case 'data_vencimento':
        return validarDataVencimento(valor);
      case 'observacoes':
        return validarObservacoes(valor);
      default:
        return '';
    }
  };

  // Salvar conta
  const salvarConta = async () => {
    try {
      // Validações obrigatórias
      const novosErros: {[key: string]: string} = {};
      
      if (!conta.descricao) novosErros.descricao = 'Descrição é obrigatória';
      if (!conta.valor || conta.valor <= 0) novosErros.valor = 'Valor deve ser maior que zero';
      if (!conta.data_vencimento) novosErros.data_vencimento = 'Data de vencimento é obrigatória';
      if (!conta.pagador_id) novosErros.pagador_id = 'Pagador é obrigatório';
      if (!conta.categoria_id) novosErros.categoria_id = 'Categoria é obrigatória';

      // Validações de formato
      Object.keys(conta).forEach(campo => {
        const erro = validarCampo(campo, conta[campo as keyof ContaReceber]);
        if (erro) novosErros[campo] = erro;
      });

      if (Object.keys(novosErros).length > 0) {
        setErrosValidacao(novosErros);
        toast({
          title: 'Dados inválidos',
          description: 'Verifique os campos destacados',
          variant: 'destructive'
        });
        return;
      }

      const dadosConta: CriarContaReceber = {
        descricao: conta.descricao!,
        valor: conta.valor!,
        data_vencimento: conta.data_vencimento!,
        data_recebimento: conta.status === 'recebido' ? conta.data_recebimento : undefined,
        status: conta.status as 'pendente' | 'recebido' | 'vencido',
        pagador_id: conta.pagador_id!,
        categoria_id: conta.categoria_id!,
        banco_id: conta.banco_id,
        observacoes: conta.observacoes,
        recorrente: conta.recorrente
      };

      const sucesso = await criarConta(dadosConta);
      
      if (sucesso) {
        // Limpar rascunho
        localStorage.removeItem('rascunho_novo_recebimento');
        
        toast({
          title: 'Recebimento cadastrado!',
          description: `"${conta.descricao}" foi salvo com sucesso`,
        });
        
        navigate('/contas-receber');
      }
    } catch (error) {
      console.error('Erro ao salvar recebimento:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o recebimento',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Banner de rascunho detectado */}
      {rascunhoDetectado && (
        <Card className="border-blue-200 bg-blue-50/50 backdrop-blur-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Rascunho detectado</h4>
                <p className="text-xs text-blue-700">Há dados salvos automaticamente para este recebimento</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={aplicarRascunho}
                className="text-blue-700 border-blue-300"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restaurar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={descartarRascunho}
                className="text-blue-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Descartar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/contas-receber')}
            className="hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Recebimento</h1>
              <p className="text-gray-600">Cadastre um novo recebimento no sistema</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {salvandoRascunho && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              Salvando...
            </div>
          )}
          <Button onClick={salvarConta} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
            <Save className="w-4 h-4 mr-2" />
            Salvar Recebimento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="xl:col-span-2 space-y-6">
          {/* Pagador */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Pagador</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="pagador">Pagador *</Label>
                <Select 
                  value={conta.pagador_id?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('pagador_id', parseInt(value))}
                >
                  <SelectTrigger className={`bg-white/80 backdrop-blur-sm ${errosValidacao.pagador_id ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder="Selecione o pagador" />
                  </SelectTrigger>
                  <SelectContent>
                    {pagadores.map((pagador) => (
                      <SelectItem key={pagador.id} value={pagador.id.toString()}>
                        {pagador.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errosValidacao.pagador_id && (
                  <p className="text-red-500 text-sm mt-1">{errosValidacao.pagador_id}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Dados do Recebimento */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Dados do Recebimento</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CampoComValidacao
                  label="Descrição *"
                  value={conta.descricao || ''}
                  onChange={(value) => handleInputChange('descricao', value)}
                  validacao={(value) => validarDescricao(value)}
                  placeholder="Ex: Prestação de serviços - Janeiro"
                  className="bg-white/80 backdrop-blur-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select 
                  value={conta.categoria_id?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('categoria_id', parseInt(value))}
                >
                  <SelectTrigger className={`bg-white/80 backdrop-blur-sm ${errosValidacao.categoria_id ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errosValidacao.categoria_id && (
                  <p className="text-red-500 text-sm mt-1">{errosValidacao.categoria_id}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={conta.data_vencimento || ''}
                  onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                  className={`bg-white/80 backdrop-blur-sm ${errosValidacao.data_vencimento ? 'border-red-300' : ''}`}
                />
                {errosValidacao.data_vencimento && (
                  <p className="text-red-500 text-sm mt-1">{errosValidacao.data_vencimento}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={conta.observacoes || ''}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais..."
                  className="bg-white/80 backdrop-blur-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Valores */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Valores</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CampoComValidacao
                  label="Valor *"
                  value={numeroParaMascaraMoeda(conta.valor || 0)}
                  onChange={handleValorChange}
                  validacao={(value) => {
                    const numero = converterMoedaParaNumero(value);
                    return validarValor(numero.toString());
                  }}
                  placeholder="R$ 0,00"
                  className="bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>
          </Card>

          {/* Status e Recebimento */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Status</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Status do Recebimento</Label>
                <RadioGroup 
                  value={conta.status || 'pendente'} 
                  onValueChange={(value) => handleInputChange('status', value)}
                  className="flex space-x-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pendente" id="pendente" />
                    <Label htmlFor="pendente">Pendente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recebido" id="recebido" />
                    <Label htmlFor="recebido">Recebido</Label>
                  </div>
                </RadioGroup>
              </div>

              {conta.status === 'recebido' && (
                <>
                  <div>
                    <Label htmlFor="data_recebimento">Data do Recebimento</Label>
                    <Input
                      id="data_recebimento"
                      type="date"
                      value={conta.data_recebimento || ''}
                      onChange={(e) => handleInputChange('data_recebimento', e.target.value)}
                      className="bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="banco">Banco</Label>
                    <Select 
                      value={conta.banco_id?.toString() || ''} 
                      onValueChange={(value) => handleInputChange('banco_id', parseInt(value))}
                    >
                      <SelectTrigger className="bg-white/80 backdrop-blur-sm">
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {bancos.map((banco) => (
                          <SelectItem key={banco.id} value={banco.id.toString()}>
                            {banco.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Configurações Adicionais */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Configurações Adicionais</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="recorrente">Recebimento Recorrente</Label>
                  <p className="text-sm text-gray-600">Este recebimento se repetirá mensalmente</p>
                </div>
                <Switch
                  id="recorrente"
                  checked={conta.recorrente || false}
                  onCheckedChange={(checked) => handleInputChange('recorrente', checked)}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Resumo do Recebimento</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Descrição:</span>
                <span className="font-medium">{conta.descricao || '-'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-medium text-green-600">
                  {formatarMoedaExibicao(conta.valor || 0)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Vencimento:</span>
                <span className="font-medium">
                  {conta.data_vencimento ? new Date(conta.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  conta.status === 'recebido' ? 'text-green-600' : 
                  conta.status === 'vencido' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {conta.status === 'recebido' ? 'Recebido' : 
                   conta.status === 'vencido' ? 'Vencido' : 'Pendente'}
                </span>
              </div>
              
              {conta.recorrente && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Recorrente:</span>
                  <span className="font-medium text-blue-600">Sim</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}