import { Calendar, Download, Edit, Eye, History, MoreVertical, TrendingDown, TrendingUp, Upload } from 'lucide-react';
import { Banco, TIPO_CONTA_LABELS } from '../../types/banco';
import { formatarMoeda, formatarData } from '../../utils/formatters';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface BancoCardProps {
  banco: Banco;
  onEdit: (banco: Banco) => void;
  onView: (banco: Banco) => void;
  onUploadOFX: (banco: Banco) => void;
  onViewExtrato: (banco: Banco) => void;
  onViewHistorico: (banco: Banco) => void;
}

export function BancoCard({ 
  banco, 
  onEdit, 
  onView, 
  onUploadOFX, 
  onViewExtrato, 
  onViewHistorico 
}: BancoCardProps) {
  const getStatusOFXBadge = () => {
    if (!banco.suporta_ofx) {
      return <Badge className="bg-gray-100/80 text-gray-700">Manual</Badge>;
    }
    
    if (banco.data_ultima_sincronizacao) {
      const hoje = new Date();
      const ultimaSync = new Date(banco.data_ultima_sincronizacao);
      const diffDias = Math.floor((hoje.getTime() - ultimaSync.getTime()) / (1000 * 3600 * 24));
      
      if (diffDias <= 1) {
        return <Badge className="bg-green-100/80 text-green-700">Sincronizado</Badge>;
      } else if (diffDias <= 7) {
        return <Badge className="bg-yellow-100/80 text-yellow-700">Pendente</Badge>;
      } else {
        return <Badge className="bg-red-100/80 text-red-700">Erro</Badge>;
      }
    }
    
    return <Badge className="bg-blue-100/80 text-blue-700">Novo</Badge>;
  };

  const getTipoContaBadge = () => {
    const colors = {
      conta_corrente: 'bg-blue-100/80 text-blue-700',
      poupanca: 'bg-green-100/80 text-green-700',
      conta_salario: 'bg-purple-100/80 text-purple-700'
    };
    
    return (
      <Badge className={colors[banco.tipo_conta]}>
        {TIPO_CONTA_LABELS[banco.tipo_conta]}
      </Badge>
    );
  };

  const getSaldoVariacao = () => {
    const variacao = banco.saldo_atual - banco.saldo_inicial;
    const percentual = (variacao / banco.saldo_inicial) * 100;
    
    if (variacao > 0) {
      return (
        <div className="flex items-center space-x-1 text-green-600">
          <TrendingUp className="w-3 h-3" />
          <span className="text-xs">+{percentual.toFixed(1)}%</span>
        </div>
      );
    } else if (variacao < 0) {
      return (
        <div className="flex items-center space-x-1 text-red-600">
          <TrendingDown className="w-3 h-3" />
          <span className="text-xs">{percentual.toFixed(1)}%</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">{banco.codigo_banco}</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center space-x-2">
              <span>{banco.nome}</span>
              {banco.suporta_ofx && (
                <Download className="w-4 h-4 text-green-600" />
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {banco.agencia} • {banco.conta}-{banco.digito_verificador}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-xl border border-white/20">
            <DropdownMenuItem onClick={() => onView(banco)}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(banco)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {banco.suporta_ofx && (
              <>
                <DropdownMenuItem onClick={() => onUploadOFX(banco)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload OFX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewExtrato(banco)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver Extrato
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => onViewHistorico(banco)}>
              <History className="w-4 h-4 mr-2" />
              Histórico
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          {getTipoContaBadge()}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Saldo Atual:</span>
          <div className="text-right">
            <div className="font-semibold text-foreground">
              {formatarMoeda(banco.saldo_atual)}
            </div>
            {getSaldoVariacao()}
          </div>
        </div>

        {banco.limite && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Limite Disponível:</span>
            <span className="font-medium text-foreground">
              {formatarMoeda(banco.limite - banco.limite_usado)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status OFX:</span>
          {getStatusOFXBadge()}
        </div>

        {banco.data_ultima_sincronizacao && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Última Sync:</span>
            <span className="text-sm text-foreground">
              {formatarData(banco.data_ultima_sincronizacao)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}