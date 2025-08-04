import React from 'react';
import { Home } from 'lucide-react';
import { BreadcrumbItem } from '@/components/layout/PageHeader';

export const createBreadcrumb = (path: string, customItems?: BreadcrumbItem[]): BreadcrumbItem[] => {
  if (customItems) return customItems;
  
  const defaultBreadcrumbs: Record<string, BreadcrumbItem[]> = {
    '/': [
      { label: 'Dashboard Executivo', icon: React.createElement(Home, { className: "w-4 h-4" }) }
    ],
    '/vendedores': [
      { label: 'Início', href: '/', icon: React.createElement(Home, { className: "w-4 h-4" }) },
      { label: 'Cadastros' },
      { label: 'Vendedores' }
    ],
    '/vendedor-analytics': [
      { label: 'Início', href: '/' },
      { label: 'Vendedores', href: '/vendedores' },
      { label: 'Analytics' }
    ],
    '/contas-pagar': [
      { label: 'Início', href: '/' },
      { label: 'Financeiro' },
      { label: 'Contas a Pagar' }
    ],
    '/conta-individual': [
      { label: 'Início', href: '/' },
      { label: 'Financeiro' },
      { label: 'Contas a Pagar', href: '/contas-pagar' },
      { label: 'Nova Conta' }
    ],
    '/lancamento-lote': [
      { label: 'Início', href: '/' },
      { label: 'Financeiro' },
      { label: 'Contas a Pagar', href: '/contas-pagar' },
      { label: 'Lançamento em Lote' }
    ],
    '/nova-venda': [
      { label: 'Início', href: '/' },
      { label: 'Vendas' },
      { label: 'Nova Venda' }
    ],
    '/consultar-vendas': [
      { label: 'Início', href: '/' },
      { label: 'Vendas' },
      { label: 'Consultar Vendas' }
    ],
    '/consultar-vendas-atualizada': [
      { label: 'Início', href: '/' },
      { label: 'Vendas' },
      { label: 'Consultar Vendas' }
    ],
    '/importar-vendas': [
      { label: 'Início', href: '/' },
      { label: 'Vendas' },
      { label: 'Importar Vendas' }
    ],
    '/fornecedores': [
      { label: 'Início', href: '/' },
      { label: 'Cadastros' },
      { label: 'Fornecedores' }
    ],
    '/clientes': [
      { label: 'Início', href: '/' },
      { label: 'Cadastros' },
      { label: 'Clientes' }
    ],
    '/dre': [
      { label: 'Início', href: '/' },
      { label: 'Relatórios' },
      { label: 'DRE' }
    ],
    '/fluxo-caixa': [
      { label: 'Início', href: '/' },
      { label: 'Relatórios' },
      { label: 'Fluxo de Caixa' }
    ],
    '/bancos': [
      { label: 'Início', href: '/' },
      { label: 'Cadastros' },
      { label: 'Bancos' }
    ],
    '/cheques': [
      { label: 'Início', href: '/' },
      { label: 'Financeiro' },
      { label: 'Cheques' }
    ],
    '/plano-contas': [
      { label: 'Início', href: '/' },
      { label: 'Configurações' },
      { label: 'Plano de Contas' }
    ],
    '/relatorios': [
      { label: 'Início', href: '/' },
      { label: 'Relatórios' }
    ],
    '/relatorios-gerais': [
      { label: 'Início', href: '/' },
      { label: 'Relatórios' },
      { label: 'Relatórios Gerais' }
    ]
  };
  
  return defaultBreadcrumbs[path] || [
    { label: 'Início', href: '/', icon: React.createElement(Home, { className: "w-4 h-4" }) },
    { label: 'Página Atual' }
  ];
};