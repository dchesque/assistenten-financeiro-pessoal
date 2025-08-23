// Exemplo de como usar AdminOnly em diferentes contextos
import { AdminOnly } from '@/components/auth/AdminOnly';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Settings, BarChart3 } from 'lucide-react';

export function AdminMenuExample() {
  return (
    <div className="space-y-4">
      {/* Exemplo 1: Card completamente oculto para não-admins */}
      <AdminOnly>
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Shield className="w-5 h-5" />
              Painel Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 text-sm">
              Este card só é visível para usuários com role 'admin'.
            </p>
          </CardContent>
        </Card>
      </AdminOnly>

      {/* Exemplo 2: Botões condicionalmente renderizados */}
      <div className="flex gap-2">
        <Button variant="outline">
          <Users className="w-4 h-4 mr-2" />
          Ver Usuários
        </Button>
        
        <AdminOnly>
          <Button variant="default" className="bg-red-600 hover:bg-red-700">
            <Shield className="w-4 h-4 mr-2" />
            Gerenciar Usuários
          </Button>
        </AdminOnly>
        
        <AdminOnly>
          <Button variant="secondary">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios Admin
          </Button>
        </AdminOnly>
      </div>

      {/* Exemplo 3: Menu com fallback */}
      <AdminOnly 
        fallback={
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <p className="text-gray-600 text-sm">
                Funcionalidades administrativas não disponíveis para seu nível de acesso.
              </p>
            </CardContent>
          </Card>
        }
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Settings className="w-5 h-5" />
              Configurações Avançadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Configurar Permissões
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Roles
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Métricas do Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      </AdminOnly>
    </div>
  );
}