import { useState, useEffect } from 'react';
import { Building, User } from 'lucide-react';
import { Fornecedor } from '@/types/fornecedor';
import { PlanoContas } from '@/types/planoContas';

import { usePlanoContas } from '@/hooks/usePlanoContas';
import { useValidacoesFornecedor } from '@/hooks/useValidacoesFornecedor';
import { useBuscaCEP } from '@/hooks/useBuscaCEP';
import { Modal, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FornecedorModalForm } from './FornecedorModalForm';

interface FornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedor: Fornecedor | null;
  modo: 'criar' | 'editar' | 'visualizar';
  onSave: (fornecedor: Fornecedor) => void;
  loading?: boolean;
}

export function FornecedorModal({ isOpen, onClose, fornecedor, modo, onSave, loading }: FornecedorModalProps) {
  const { toast } = useToast();
  const { planoContas, buscarContasAnaliticas } = usePlanoContas();
  const { buscarCEP, carregando: carregandoCEP, erro: erroCEP } = useBuscaCEP();
  
  const {
    validarDocumento,
    validarEmail,
    validarTelefone,
    validarCEP,
    validarCamposObrigatorios,
    obterErro,
    temErros,
    limparErros
  } = useValidacoesFornecedor();

  const [formData, setFormData] = useState<Partial<Fornecedor>>({
    nome: '',
    tipo: 'pessoa_juridica',
    documento: '',
    email: '',
    telefone: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
    tipo_fornecedor: 'despesa',
    ativo: true
  });

  const [salvando, setSalvando] = useState(false);
  const [contasDisponiveis, setContasDisponiveis] = useState<any[]>([]);
  const [categoriaAtual, setCategoriaAtual] = useState<PlanoContas | null>(null);

  // Inicializar dados do formulário
  useEffect(() => {
    if (fornecedor && (modo === 'editar' || modo === 'visualizar')) {
      setFormData(fornecedor);
      // Carregar categoria se existir
      if (fornecedor.categoria_padrao_id) {
        carregarCategoria(fornecedor.categoria_padrao_id);
      }
    } else if (modo === 'criar') {
      setFormData({
        nome: '',
        tipo: 'pessoa_juridica',
        documento: '',
        email: '',
        telefone: '',
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: '',
        tipo_fornecedor: 'despesa',
        ativo: true
      });
      setCategoriaAtual(null);
    }
    limparErros();
  }, [fornecedor, modo, isOpen, limparErros]);

  // Carregar categoria pelo ID
  const carregarCategoria = async (categoriaId: number) => {
    try {
      const contas = await buscarContasAnaliticas('');
      const categoria = contas.find(c => c.id === categoriaId);
      setCategoriaAtual(categoria || null);
    } catch (error) {
      console.error('Erro ao carregar categoria:', error);
    }
  };

  // Carregar contas disponíveis baseado no tipo de fornecedor
  const carregarContasDisponiveis = async () => {
    try {
      const contas = await buscarContasAnaliticas('', formData.tipo_fornecedor);
      setContasDisponiveis(contas);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      setContasDisponiveis([]);
    }
  };

  // Atualizar contas quando tipo de fornecedor mudar
  useEffect(() => {
    if (formData.tipo_fornecedor && isOpen) {
      carregarContasDisponiveis();
    }
  }, [formData.tipo_fornecedor, isOpen]);

  // Função para lidar com mudança de categoria
  const handleCategoriaChange = (categoria: PlanoContas | null) => {
    setCategoriaAtual(categoria);
  };

  const handleDocumentoChange = async (value: string) => {
    setFormData(prev => ({ ...prev, documento: value }));
    
    if (value && formData.tipo) {
      await validarDocumento(value, formData.tipo, fornecedor?.id);
    }
  };

  const handleBuscarCEP = async () => {
    if (!formData.cep) return;

    try {
      const endereco = await buscarCEP(formData.cep);
      if (endereco) {
        setFormData(prev => ({
          ...prev,
          endereco: endereco.logradouro,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          estado: endereco.estado
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const handleSalvar = async () => {
    if (!formData.nome || !formData.documento || !formData.tipo || !formData.tipo_fornecedor) {
      toast({
        title: "Erro de validação",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar campos obrigatórios
    if (!validarCamposObrigatorios(formData)) {
      return;
    }

    // Validar documento
    if (formData.documento) {
      const documentoValido = await validarDocumento(formData.documento, formData.tipo, fornecedor?.id);
      if (!documentoValido) return;
    }

    // Validar outros campos
    if (formData.email && !validarEmail(formData.email)) return;
    if (formData.telefone && !validarTelefone(formData.telefone)) return;
    if (formData.cep && !validarCEP(formData.cep)) return;

    // Verificar se há erros
    if (temErros()) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros antes de continuar",
        variant: "destructive"
      });
      return;
    }

    try {
      setSalvando(true);
      
      const fornecedorData: Fornecedor = {
        id: fornecedor?.id || Date.now(),
        nome: formData.nome!,
        nome_fantasia: formData.nome_fantasia,
        tipo: formData.tipo!,
        documento: formData.documento!,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep,
        observacoes: formData.observacoes,
        categoria_padrao_id: formData.categoria_padrao_id,
        tipo_fornecedor: formData.tipo_fornecedor!,
        ativo: formData.ativo ?? true,
        totalCompras: fornecedor?.totalCompras || 0,
        valorTotal: fornecedor?.valorTotal || 0,
        ultimaCompra: fornecedor?.ultimaCompra,
        dataCadastro: fornecedor?.dataCadastro || new Date().toISOString().split('T')[0]
      };

      await onSave(fornecedorData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar fornecedor",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  // Determinar título e ícone
  const titulo = modo === 'criar' ? 'Novo Fornecedor' : 
                 modo === 'editar' ? 'Editar Fornecedor' : 
                 'Visualizar Fornecedor';
  
  const icone = formData.tipo === 'pessoa_fisica' ? 
    <User className="w-5 h-5 text-white" /> : 
    <Building className="w-5 h-5 text-white" />;

  const readonly = modo === 'visualizar';

  const footer = (
    <ModalFooter showRequiredNote={!readonly}>
      <Button variant="outline" onClick={onClose} disabled={salvando}>
        Cancelar
      </Button>
      {!readonly && (
        <Button onClick={handleSalvar} disabled={salvando || loading}>
          {salvando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>}
          {modo === 'criar' ? 'Criar Fornecedor' : 'Salvar Alterações'}
        </Button>
      )}
    </ModalFooter>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titulo}
      subtitle={readonly ? "Informações do fornecedor" : "Preencha as informações do fornecedor"}
      icon={icone}
      size="3xl"
      footer={footer}
    >
      <ModalContent>
        <FornecedorModalForm
          formData={formData}
          setFormData={setFormData}
          onDocumentoChange={handleDocumentoChange}
          onBuscarCEP={handleBuscarCEP}
          carregandoCEP={carregandoCEP}
          erroCEP={erroCEP}
          obterErro={obterErro}
          validarEmail={validarEmail}
          validarTelefone={validarTelefone}
          planoContas={contasDisponiveis}
          categoriaAtual={categoriaAtual}
          onCategoriaChange={handleCategoriaChange}
          readonly={readonly}
        />
      </ModalContent>
    </Modal>
  );
}