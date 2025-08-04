import React from 'react';
import { MoreVertical, Mail, Phone, TrendingUp, Crown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Vendedor, STATUS_VENDEDOR } from '@/types/vendedor';
import { formatarMoeda } from '@/utils/formatters';

interface TabelaVendedoresProps {
  vendedores: Vendedor[];
  onEditar: (vendedor: Vendedor) => void;
  onVisualizar: (vendedor: Vendedor) => void;
  onToggleStatus: (id: number) => void;
  onExcluir: (id: number) => void;
}

export const TabelaVendedores: React.FC<TabelaVendedoresProps> = ({
  vendedores,
  onEditar,
  onVisualizar,
  onToggleStatus,
  onExcluir
}) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendedores.map((vendedor) => {
                const statusInfo = STATUS_VENDEDOR.find(s => s.valor === vendedor.status);
                const iniciais = vendedor.nome.split(' ').map(n => n[0]).join('').toUpperCase();

                return (
                  <TableRow 
                    key={vendedor.id}
                    className="hover:bg-white/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={vendedor.foto_url} alt={vendedor.nome} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                              {iniciais}
                            </AvatarFallback>
                          </Avatar>
                          {vendedor.ranking_atual <= 3 && vendedor.ranking_atual > 0 && (
                            <Crown className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{vendedor.nome}</div>
                          <div className="text-sm text-gray-500">{vendedor.cargo}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <div className="font-medium">{vendedor.codigo_vendedor}</div>
                        {vendedor.ranking_atual > 0 && (
                          <div className="text-sm text-gray-500">
                            Ranking #{vendedor.ranking_atual}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {vendedor.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-48">{vendedor.email}</span>
                          </div>
                        )}
                        {vendedor.telefone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            <span>{vendedor.telefone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                          <span className="font-medium">{vendedor.total_vendas} vendas</span>
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          {formatarMoeda(vendedor.valor_total_vendido)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Ticket: {formatarMoeda(vendedor.ticket_medio)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
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
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onVisualizar(vendedor)}>
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditar(vendedor)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onToggleStatus(vendedor.id)}>
                            {vendedor.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onExcluir(vendedor.id)}
                            className="text-red-600"
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};