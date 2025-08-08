export const requiresPremium = (feature: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      // Verificar se o usuário tem plano premium
      const userPlan = localStorage.getItem('user_plan') || 'free';
      
      if (userPlan !== 'premium') {
        // Mostrar modal de upgrade
        const upgradeModal = document.createElement('div');
        upgradeModal.innerHTML = `
          <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-xl max-w-md mx-4">
              <h3 class="text-lg font-semibold mb-2">Recurso Premium</h3>
              <p class="text-gray-600 mb-4">
                O recurso "${feature}" está disponível apenas para assinantes Premium.
              </p>
              <div class="flex space-x-3">
                <button onclick="this.closest('.fixed').remove()" 
                        class="px-4 py-2 bg-gray-200 rounded">
                  Cancelar
                </button>
                <button onclick="window.open('https://wa.me/5511999999999?text=Quero fazer upgrade para Premium', '_blank')" 
                        class="px-4 py-2 bg-blue-600 text-white rounded">
                  Fazer Upgrade
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(upgradeModal);
        return;
      }
      
      return originalMethod.apply(this, args);
    };
  };
};