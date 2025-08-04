// Modal para credores usando o mesmo FornecedorModal mas com terminologia pessoal
import { FornecedorModal } from '../fornecedores/FornecedorModal';
import type { Fornecedor as Credor } from '@/types/fornecedor';

interface CredorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (credor: Credor) => Promise<void>;
  fornecedor: Credor | null; // Requerido para compatibilidade
  modo: 'criar' | 'editar' | 'visualizar';
  salvando?: boolean;
}

export function CredorModal(props: CredorModalProps) {
  // Reutiliza o FornecedorModal existente
  return <FornecedorModal {...props} />;
}