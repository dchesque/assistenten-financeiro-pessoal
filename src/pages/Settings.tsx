import { PageHeader } from '@/components/layout/PageHeader';
import { createBreadcrumb } from '@/utils/breadcrumbUtils';

export default function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Background abstratos */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Page Header */}
      <PageHeader
        breadcrumb={createBreadcrumb('/settings')}
        title="Configurações"
        subtitle="Configurações do sistema • Personalização e preferências"
      />

      <div className="p-4 lg:p-8 space-y-6">
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center shadow-lg">
          <p className="text-muted-foreground">Configurações do sistema</p>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Em desenvolvimento...</p>
          </div>
        </div>
      </div>
    </div>
  );
}