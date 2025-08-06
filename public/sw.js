// Service Worker para funcionalidade PWA completa
const CACHE_NAME = 'financeiro-premium-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/contas-pagar',
  '/fornecedores',
  '/bancos',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Todos os arquivos foram cached');
        // Força a ativação imediata
        return self.skipWaiting();
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Deletar caches antigos
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar controle de todas as páginas
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Estratégia: Cache First para assets estáticos, Network First para API
  
  if (event.request.url.includes('/api/')) {
    // Network First para APIs
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clonar resposta para cache
          const responseClone = response.clone();
          
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Se falhou, tentar do cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Retornar página offline personalizada
              if (event.request.destination === 'document') {
                return caches.match('/offline.html');
              }
              
              // Para outros recursos, retornar resposta de fallback
              return new Response('Conteúdo não disponível offline', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  } else {
    // Cache First para assets estáticos
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Encontrou no cache, retornar
            return cachedResponse;
          }
          
          // Não estava no cache, buscar da rede
          return fetch(event.request)
            .then((response) => {
              // Verificar se resposta é válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clonar resposta para cache
              const responseClone = response.clone();
              
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
              
              return response;
            })
            .catch(() => {
              // Erro de rede - retornar página offline se for documento
              if (event.request.destination === 'document') {
                return caches.match('/offline.html');
              }
            });
        })
    );
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Função de sincronização
async function doBackgroundSync() {
  try {
    console.log('[SW] Executando sincronização em background...');
    
    // Aqui você pode implementar a sincronização de dados offline
    // Por exemplo, enviar dados que foram salvos enquanto offline
    
    // Simular sincronização
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      for (const data of offlineData) {
        await syncDataToServer(data);
      }
      
      // Limpar dados offline após sincronização
      await clearOfflineData();
    }
    
    console.log('[SW] Sincronização concluída');
  } catch (error) {
    console.error('[SW] Erro na sincronização:', error);
    throw error; // Reagendar sync
  }
}

// Funções auxiliares para dados offline
async function getOfflineData() {
  // Implementar busca de dados offline do IndexedDB
  return [];
}

async function syncDataToServer(data) {
  // Implementar envio de dados para servidor
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Falha na sincronização');
  }
  
  return response.json();
}

async function clearOfflineData() {
  // Implementar limpeza de dados offline
  console.log('[SW] Dados offline limpos');
}

// Notificações Push (se implementar)
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/icon-explore.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Sistema Financeiro', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Abrir aplicação
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});