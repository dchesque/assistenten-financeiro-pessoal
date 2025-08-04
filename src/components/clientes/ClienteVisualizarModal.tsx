import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, User, Building2, Phone, Mail, MapPin, Calendar, DollarSign, ShoppingCart } from "lucide-react";
import { Cliente } from "@/types/cliente";
import { formatarMoeda } from "@/utils/formatters";

interface ClienteVisualizarModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente;
}

export function ClienteVisualizarModal({ isOpen, onClose, cliente }: ClienteVisualizarModalProps) {
  if (!isOpen || !cliente) return null;

  const obterIniciais = () => {
    return cliente.nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatarData = (data?: string) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const obterCorStatus = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-emerald-100/80 text-emerald-700';
      case 'inativo': return 'bg-gray-100/80 text-gray-700';
      case 'bloqueado': return 'bg-red-100/80 text-red-700';
      default: return 'bg-gray-100/80 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              {cliente.tipo === 'PF' ? <User className="w-6 h-6 text-blue-600" /> : <Building2 className="w-6 h-6 text-purple-600" />}
              Visualizar Cliente
            </h2>
            <p className="text-sm text-gray-600 mt-1">Informações completas do cliente</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coluna 1: Informações Principais */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card Principal do Cliente */}
              <Card className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {obterIniciais()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900">{cliente.nome}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cliente.tipo === 'PF' ? 'bg-blue-100/80 text-blue-700' : 'bg-purple-100/80 text-purple-700'}>
                          {cliente.tipo === 'PF' ? '👤 Pessoa Física' : '🏢 Pessoa Jurídica'}
                        </Badge>
                        <Badge variant="outline" className={`rounded-full ${obterCorStatus(cliente.status)}`}>
                          {cliente.status === 'ativo' ? '🟢 Ativo' : 
                           cliente.status === 'inativo' ? '🔴 Inativo' : '🚫 Bloqueado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {cliente.tipo === 'PF' ? 'CPF' : 'CNPJ'}
                      </label>
                      <p className="font-mono text-lg">{cliente.documento}</p>
                    </div>
                    {cliente.rg_ie && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          {cliente.tipo === 'PF' ? 'RG' : 'Inscrição Estadual'}
                        </label>
                        <p className="font-mono">{cliente.rg_ie}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Contato */}
              <Card className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 backdrop-blur-sm border border-emerald-200/50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Phone className="w-5 h-5 text-emerald-600" />
                    Informações de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cliente.telefone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Telefone Principal</label>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        {cliente.telefone}
                      </p>
                    </div>
                  )}
                  
                  {cliente.whatsapp && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">WhatsApp</label>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        {cliente.whatsapp}
                      </p>
                    </div>
                  )}
                  
                  {cliente.email && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">E-mail</label>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-600" />
                        {cliente.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Endereço */}
              {(cliente.logradouro || cliente.cidade) && (
                <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/40 backdrop-blur-sm border border-purple-200/50 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      Endereço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cliente.cep && (
                        <p><span className="font-medium">CEP:</span> {cliente.cep}</p>
                      )}
                      {cliente.logradouro && (
                        <p>
                          <span className="font-medium">Endereço:</span> {cliente.logradouro}
                          {cliente.numero && `, ${cliente.numero}`}
                          {cliente.complemento && ` - ${cliente.complemento}`}
                        </p>
                      )}
                      {cliente.bairro && (
                        <p><span className="font-medium">Bairro:</span> {cliente.bairro}</p>
                      )}
                      {cliente.cidade && cliente.estado && (
                        <p><span className="font-medium">Cidade:</span> {cliente.cidade}, {cliente.estado}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Observações */}
              {cliente.observacoes && (
                <Card className="bg-gradient-to-br from-gray-50/80 to-gray-100/40 backdrop-blur-sm border border-gray-200/50 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{cliente.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Coluna 2: Estatísticas e Configurações */}
            <div className="space-y-6">
              
              {/* Estatísticas de Compras */}
              <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/40 backdrop-blur-sm border border-blue-200/50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{cliente.totalCompras}</div>
                    <div className="text-sm text-gray-600">Total de Compras</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">
                      {formatarMoeda(cliente.valorTotalCompras)}
                    </div>
                    <div className="text-sm text-gray-600">Valor Total</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white/60 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatarMoeda(cliente.ticketMedio)}
                    </div>
                    <div className="text-sm text-gray-600">Ticket Médio</div>
                  </div>
                  
                  {cliente.dataUltimaCompra && (
                    <div className="text-center p-4 bg-white/60 rounded-xl">
                      <div className="text-lg font-bold text-gray-700">
                        {formatarData(cliente.dataUltimaCompra)}
                      </div>
                      <div className="text-sm text-gray-600">Última Compra</div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Preferências */}
              <Card className="bg-gradient-to-br from-orange-50/80 to-orange-100/40 backdrop-blur-sm border border-orange-200/50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-gray-900">Preferências</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                    <span className="text-sm font-medium">E-mail promocional</span>
                    <Badge variant={cliente.receberPromocoes ? "default" : "secondary"}>
                      {cliente.receberPromocoes ? '✅ Sim' : '❌ Não'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                    <span className="text-sm font-medium">WhatsApp marketing</span>
                    <Badge variant={cliente.whatsappMarketing ? "default" : "secondary"}>
                      {cliente.whatsappMarketing ? '✅ Sim' : '❌ Não'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Datas */}
              <Card className="bg-gradient-to-br from-gray-50/80 to-gray-100/40 backdrop-blur-sm border border-gray-200/50 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    Informações do Cadastro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cadastrado em</label>
                    <p>{formatarData(cliente.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Última atualização</label>
                    <p>{formatarData(cliente.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50 flex justify-end">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}