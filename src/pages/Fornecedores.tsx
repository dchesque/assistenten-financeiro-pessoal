import React, { useState } from 'react';
import { Grid, List, Plus, Building2, User, Eye, Edit, Trash2, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardCadastro } from '@/components/cadastros/CardCadastro';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatarMoeda, formatarData } from '@/lib/formatacaoBrasileira';

// Mock data - substituir pelos hooks reais
const fornecedoresMock = [
  {
    id: 1,
    nome: 'Fornecedor Alpha Ltda',
    tipo: 'pessoa_juridica',
    documento: '12.345.678/0001-90',
    email: 'contato@alpha.com.br',
    telefone: '(11) 98765-4321',
    ativo: true,
    total_compras: 125000,
    ultima_compra: '2024-01-15',
    updated_at: '2024-01-20'
  },
  {
    id: 2,
    nome: 'João Silva',
    tipo: 'pessoa_fisica',
    documento: '123.456.789-01',
    email: 'joao@email.com',
    telefone: '(11) 91234-5678',
    ativo: true,
    total_compras: 45000,
    ultima_compra: '2024-01-10',
    updated_at: '2024-01-18'
  }
];

export default function Fornecedores() {
  const [visualizacao, setVisualizacao] = useState<'cards' | 'tabela'>('cards');
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo: '',
    ativo: ''
  });
  const [modalNovo, setModalNovo] = useState(false);

  // Métricas (mock - substituir por hooks reais)
  const fornecedoresAtivos = 156;
  const cadastradosEsteMes = 12;
  const maiorGasto = 250000;
  const mediaCompras = 75000;

  const filtrarFornecedores = () => {
    return fornecedoresMock.filter(fornecedor => {
      const matchNome = !filtros.busca || 
        fornecedor.nome.toLowerCase().includes(filtros.busca.toLowerCase());
      const matchTipo = !filtros.tipo || fornecedor.tipo === filtros.tipo;
      const matchAtivo = filtros.ativo === '' || 
        fornecedor.ativo.toString() === filtros.ativo;
      
      return matchNome && matchTipo && matchAtivo;
    });
  };

  const fornecedoresFiltrados = filtrarFornecedores();

  const visualizar = (fornecedor: any) => {
    console.log('Visualizar', fornecedor);
  };

  const editar = (fornecedor: any) => {
    console.log('Editar', fornecedor);
  };

  const excluir = (fornecedor: any) => {
    console.log('Excluir', fornecedor);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="space-y-6">
      {/* Header Premium */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Fornecedores</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os seus fornecedores</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          {/* Toggle cards/tabela */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-1">
            <button 
              onClick={() => setVisualizacao('cards')}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center",
                visualizacao === 'cards'
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-600 hover:text-gray-800"
              )}
            >
              <Grid className="w-4 h-4 mr-2" />
              Cards
            </button>
            <button 
              onClick={() => setVisualizacao('tabela')}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center",
                visualizacao === 'tabela'
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-600 hover:text-gray-800"
              )}
            >
              <List className="w-4 h-4 mr-2" />
              Tabela
            </button>
          </div>
          
          <Button 
            onClick={() => setModalNovo(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          titulo="Total Ativos"
          valor={fornecedoresAtivos}
          formato="numero"
          icone={<Building2 className="w-5 h-5" />}
          cor="blue"
        />
        <MetricCard
          titulo="Cadastrados Este Mês"
          valor={cadastradosEsteMes}
          formato="numero"
          icone={<Plus className="w-5 h-5" />}
          cor="green"
        />
        <MetricCard
          titulo="Maior Gasto"
          valor={maiorGasto}
          formato="moeda"
          icone={<TrendingUp className="w-5 h-5" />}
          cor="orange"
        />
        <MetricCard
          titulo="Média de Compras"
          valor={mediaCompras}
          formato="moeda"
          icone={<TrendingUp className="w-5 h-5" />}
          cor="purple"
        />
      </div>

      {/* Filtros Premium */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por nome
            </label>
            <input
              type="text"
              value={filtros.busca}
              onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
              placeholder="Digite o nome do fornecedor..."
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pessoa
            </label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">Todos os tipos</option>
              <option value="pessoa_fisica">Pessoa Física</option>
              <option value="pessoa_juridica">Pessoa Jurídica</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filtros.ativo}
              onChange={(e) => setFiltros(prev => ({ ...prev, ativo: e.target.value }))}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">Todos os status</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conteúdo - Cards ou Tabela */}
      {fornecedoresFiltrados.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-12 text-center shadow-lg">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Nenhum fornecedor encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            Não há fornecedores que correspondam aos filtros aplicados.
          </p>
          <Button 
            onClick={() => setModalNovo(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Primeiro Fornecedor
          </Button>
        </div>
      ) : (
        <>
          {visualizacao === 'cards' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {fornecedoresFiltrados.map((fornecedor) => (
                <CardCadastro
                  key={fornecedor.id}
                  titulo={fornecedor.nome}
                  icone={fornecedor.tipo === 'pessoa_fisica' ? <User /> : <Building2 />}
                  cor={fornecedor.tipo === 'pessoa_fisica' ? 'blue' : 'purple'}
                  descricao={fornecedor.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  ativo={fornecedor.ativo}
                  dataAtualizacao={fornecedor.updated_at}
                  metricas={[
                    { label: 'Total Compras', valor: fornecedor.total_compras, formato: 'moeda' },
                    { label: 'Última Compra', valor: fornecedor.ultima_compra, formato: 'data' }
                  ]}
                  acoes={[
                    { icone: <Eye />, label: 'Visualizar', onClick: () => visualizar(fornecedor) },
                    { icone: <Edit />, label: 'Editar', onClick: () => editar(fornecedor), cor: 'primary' },
                    { icone: <Trash2 />, label: 'Excluir', onClick: () => excluir(fornecedor), cor: 'danger' }
                  ]}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fornecedor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Compras
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {fornecedoresFiltrados.map((fornecedor) => (
                      <tr key={fornecedor.id} className="hover:bg-white/60 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center mr-3",
                              fornecedor.tipo === 'pessoa_fisica' 
                                ? "bg-gradient-to-r from-blue-500 to-blue-600" 
                                : "bg-gradient-to-r from-purple-500 to-purple-600"
                            )}>
                              {fornecedor.tipo === 'pessoa_fisica' ? (
                                <User className="w-5 h-5 text-white" />
                              ) : (
                                <Building2 className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {fornecedor.nome}
                              </div>
                              <div className="text-sm text-gray-500">
                                {fornecedor.documento}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fornecedor.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{fornecedor.email}</div>
                          <div className="text-sm text-gray-500">{fornecedor.telefone}</div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                          {formatarMoeda(fornecedor.total_compras)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge 
                            variant={fornecedor.ativo ? "default" : "secondary"}
                            className={
                              fornecedor.ativo 
                                ? "bg-green-100/80 text-green-700 border-green-200" 
                                : "bg-red-100/80 text-red-700 border-red-200"
                            }
                          >
                            {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => visualizar(fornecedor)}
                              className="text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editar(fornecedor)}
                              className="text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => excluir(fornecedor)}
                              className="text-gray-600 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}