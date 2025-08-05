import { useState } from 'react';
import { Search, Plus, Building, Eye, Edit, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCredoresPessoais } from '@/hooks/useCredoresPessoais';
import { useToast } from '@/hooks/use-toast';

export default function Credores() {
  const { toast } = useToast();
  const { credores, loading } = useCredoresPessoais();
  const [busca, setBusca] = useState('');

  const credoresFiltrados = credores.filter(credor =>
    credor.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 space-y-4 p-4 pt-6">
          <PageHeader
            breadcrumb={createBreadcrumb('/credores')}
            title="Credores"
            subtitle="Carregando credores..."
            icon={<Building className="h-8 w-8 text-primary" />}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 pt-6">
        <PageHeader
          breadcrumb={createBreadcrumb('/credores')}
          title="Credores"
          subtitle="Gerencie seus credores pessoais"
          icon={<Building className="h-8 w-8 text-primary" />}
          actions={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Credor
            </Button>
          }
        />

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar credores..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Credores */}
        <div className="grid gap-4 md:grid-cols-2">
          {credoresFiltrados.map((credor) => (
            <Card key={credor.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="font-medium">{credor.nome}</p>
                    <p className="text-sm text-muted-foreground">{credor.email}</p>
                    <p className="text-sm text-muted-foreground">{credor.telefone}</p>
                    <Badge variant="outline">
                      {credor.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}