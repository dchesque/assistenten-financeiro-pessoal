import React, { useEffect } from 'react';
import { User, Edit, TrendingUp, Target, Crown, Mail, Phone, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Vendedor, STATUS_VENDEDOR } from '@/types/vendedor';
import { formatarMoeda } from '@/utils/formatters';
import { usePerformanceVendedor } from '@/hooks/usePerformanceVendedor';

interface VendedorDetailsModalProps {
  aberto: boolean;
  onFechar: () => void;
  vendedor: Vendedor | null;
  onEditar: () => void;
}

export const VendedorDetailsModal: React.FC<VendedorDetailsModalProps> = ({
  aberto,
  onFechar,
  vendedor,
  onEditar
}) => {
  const { performance, carregarPerformance } = usePerformanceVendedor();

  useEffect(() => {
    if (vendedor && aberto) {
      // Carregar performance dos últimos 30 dias
      const hoje = new Date().toISOString().split('T')[0];
      const inicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      carregarPerformance(vendedor.id, inicio, hoje);
    }
  }, [vendedor, aberto, carregarPerformance]);

  if (!vendedor) return null;

  const statusInfo = STATUS_VENDEDOR.find(s => s.valor === vendedor.status);
  const iniciais = vendedor.nome.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Vendedor
            </DialogTitle>
            <Button onClick={onEditar} size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com foto e info básica */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={vendedor.foto_url} alt={vendedor.nome} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xl">
                      {iniciais}
                    </AvatarFallback>
                  </Avatar>
                  {vendedor.ranking_atual <= 3 && vendedor.ranking_atual > 0 && (
                    <div className="absolute -top-2 -right-2">
                      <Crown className="h-6 w-6 text-yellow-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{vendedor.nome}</h2>
                    <Badge 
                      variant={vendedor.status === 'ativo' ? 'default' : 'secondary'}
                      className={`${
                        statusInfo?.cor === 'green' ? 'bg-green-100 text-green-700' :
                        statusInfo?.cor === 'red' ? 'bg-red-100 text-red-700' :
                        statusInfo?.cor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {statusInfo?.nome}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Código</p>
                      <p className="font-medium">{vendedor.codigo_vendedor}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Cargo</p>
                      <p className="font-medium">{vendedor.cargo}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Departamento</p>
                      <p className="font-medium">{vendedor.departamento}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ranking</p>
                      <p className="font-medium">
                        {vendedor.ranking_atual > 0 ? `#${vendedor.ranking_atual}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas de Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vendedor.total_vendas}</div>
                <p className="text-xs text-muted-foreground">
                  Vendas realizadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatarMoeda(vendedor.valor_total_vendido)}</div>
                <p className="text-xs text-muted-foreground">
                  Valor acumulado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatarMoeda(vendedor.ticket_medio)}</div>
                <p className="text-xs text-muted-foreground">
                  Por venda
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium">{vendedor.documento} ({vendedor.tipo_documento})</p>
                </div>
                
                {vendedor.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{vendedor.email}</span>
                  </div>
                )}
                
                {vendedor.telefone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{vendedor.telefone}</span>
                  </div>
                )}
                
                {vendedor.data_nascimento && (
                  <div>
                    <p className="text-sm text-gray-600">Data de Nascimento</p>
                    <p className="font-medium">
                      {new Date(vendedor.data_nascimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações Profissionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Profissionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Data de Admissão</p>
                  <p className="font-medium">
                    {new Date(vendedor.data_admissao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Nível de Acesso</p>
                  <p className="font-medium capitalize">{vendedor.nivel_acesso}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Meta Mensal</p>
                  <p className="font-medium">{formatarMoeda(vendedor.meta_mensal)}</p>
                </div>
                
                {vendedor.data_ultima_venda && (
                  <div>
                    <p className="text-sm text-gray-600">Última Venda</p>
                    <p className="font-medium">
                      {new Date(vendedor.data_ultima_venda).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comissões */}
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Comissões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Tipo de Comissão</p>
                  <p className="font-medium capitalize">{vendedor.tipo_comissao.replace('_', ' ')}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Percentual</p>
                  <p className="font-medium">{vendedor.percentual_comissao}%</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Total Recebido</p>
                  <p className="font-medium text-green-600">
                    {formatarMoeda(vendedor.comissao_total_recebida)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          {(vendedor.logradouro || vendedor.cidade) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {vendedor.logradouro && (
                    <p>{vendedor.logradouro}, {vendedor.numero}</p>
                  )}
                  {vendedor.complemento && <p>{vendedor.complemento}</p>}
                  {vendedor.bairro && vendedor.cidade && (
                    <p>{vendedor.bairro} - {vendedor.cidade}/{vendedor.estado}</p>
                  )}
                  {vendedor.cep && <p>CEP: {vendedor.cep}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {vendedor.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{vendedor.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};